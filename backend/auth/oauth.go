package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
"log"
	"net/http"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"github-star-app/backend/config"
	"github-star-app/backend/models"
)

const (
	callbackPort = 36542
)

// OAuthService OAuth 认证服务
type OAuthService struct {
	ctx            context.Context
	config         *config.Config
	oauth2Config   *oauth2.Config
	sessionStore   models.AuthSessionStore
	callbackServer *CallbackServer
}

// NewOAuthService 创建 OAuth 服务
func NewOAuthService(cfg *config.Config, sessionStore models.AuthSessionStore) *OAuthService {
	return &OAuthService{
		config:       cfg,
		sessionStore: sessionStore,
	}
}

// SetContext 设置 Wails 上下文
func (s *OAuthService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// initOAuthConfig 初始化 OAuth 配置（延迟初始化，因为配置可能在运行时更新）
func (s *OAuthService) initOAuthConfig() error {
	clientID := s.config.GetGitHubClientID()
	clientSecret := s.config.GetGitHubClientSecret()

	if clientID == "" {
		return fmt.Errorf("GitHub Client ID 未配置，请在 shared/app-config.toml 中设置")
	}

	s.oauth2Config = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  fmt.Sprintf("http://localhost:%d/callback", callbackPort),
		Scopes:       []string{"read:user", "user:email"},
		Endpoint:     github.Endpoint,
	}

	return nil
}

// StartLogin 开始登录流程
func (s *OAuthService) StartLogin() (string, error) {
	if err := s.initOAuthConfig(); err != nil {
		return "", err
	}

	// 1. 生成 state 参数（防 CSRF）
	state, err := generateRandomString(32)
	if err != nil {
		return "", fmt.Errorf("生成 state 失败: %w", err)
	}

	// 2. 生成 PKCE code_verifier
	codeVerifier, err := generatePKCEVerifier()
	if err != nil {
		return "", fmt.Errorf("生成 code_verifier 失败: %w", err)
	}

	// 3. 生成 code_challenge（SHA256）
	hash := sha256.Sum256([]byte(codeVerifier))
	codeChallenge := base64.RawURLEncoding.EncodeToString(hash[:])

	// 4. 存储会话
	session := &models.AuthSession{
		State:        state,
		CodeVerifier: codeVerifier,
		ExpiresAt:    time.Now().Add(10 * time.Minute),
	}
	if err := s.sessionStore.SaveSession(session); err != nil {
		return "", fmt.Errorf("存储会话失败: %w", err)
	}

	// 5. 启动本地 HTTP server 监听回调
	s.callbackServer = NewCallbackServer(callbackPort, s.handleCallback)
	go func() {
		if err := s.callbackServer.Start(); err != nil {
			log.Printf("[OAuth] Callback server error: %v", err)
		}
	}()

	// 6. 构建授权 URL（使用 code_challenge 和 code_challenge_method=S256）
	authURL := s.oauth2Config.AuthCodeURL(
		state,
		oauth2.SetAuthURLParam("code_challenge", codeChallenge),
		oauth2.SetAuthURLParam("code_challenge_method", "S256"),
	)

	log.Printf("[OAuth] Authorization URL generated, state=%s", state)
	return authURL, nil
}

// handleCallback 处理 OAuth 回调
func (s *OAuthService) handleCallback(code, state string) error {
	log.Printf("[OAuth] Received callback, state=%s", state)

	// 1. 验证 state
	session, err := s.sessionStore.LoadSession(state)
	if err != nil {
		return fmt.Errorf("无效的 state: %w", err)
	}
	defer s.sessionStore.DeleteSession(state)

	// 2. 用 code 换取 token（使用 PKCE code_verifier）
	token, err := s.oauth2Config.Exchange(
		context.Background(),
		code,
		oauth2.SetAuthURLParam("code_verifier", session.CodeVerifier),
	)
	if err != nil {
		return fmt.Errorf("交换 token 失败: %w", err)
	}

	log.Printf("[OAuth] Token exchanged successfully")

	// 3. 获取用户信息
	user, err := s.fetchUserInfo(token.AccessToken)
	if err != nil {
		return fmt.Errorf("获取用户信息失败: %w", err)
	}

	log.Printf("[OAuth] User info fetched: %s (%s)", user.Login, user.Name)

	// 4. 存储到配置文件
	if err := s.config.SetAuth(
		token.AccessToken,
		user.ID,
		user.Login,
		user.Name,
		user.AvatarURL,
	); err != nil {
		return fmt.Errorf("存储认证信息失败: %w", err)
	}

	// 5. 通知前端（通过 Wails Events）
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "login-success", map[string]interface{}{
			"id":          user.ID,
			"login":       user.Login,
			"name":        user.Name,
			"email":       user.Email,
			"avatar_url":  user.AvatarURL,
			"bio":         user.Bio,
			"location":    user.Location,
			"blog":        user.Blog,
			"company":     user.Company,
			"public_repos": user.PublicRepos,
			"followers":   user.Followers,
			"following":   user.Following,
		})
	}

	return nil
}

// fetchUserInfo 获取 GitHub 用户信息
func (s *OAuthService) fetchUserInfo(accessToken string) (*models.User, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var user models.User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetCurrentUser 获取当前登录用户
func (s *OAuthService) GetCurrentUser() (*models.User, error) {
	if !s.config.IsLoggedIn() {
		return nil, nil
	}

	userID, login, name, avatarURL := s.config.GetAuthUser()
	_ = s.config.GetAuthToken() // 预留用于后续 API 调用

	return &models.User{
		ID:        userID,
		Login:     login,
		Name:      name,
		AvatarURL: avatarURL,
	}, nil
}

// IsLoggedIn 检查是否已登录
func (s *OAuthService) IsLoggedIn() bool {
	return s.config.IsLoggedIn()
}

// Logout 登出
func (s *OAuthService) Logout() error {
	if err := s.config.ClearAuth(); err != nil {
		return fmt.Errorf("清除认证信息失败: %w", err)
	}

	// 通知前端
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "logout-success", nil)
	}

	log.Printf("[OAuth] User logged out")
	return nil
}

// SetGitHubConfig 设置 GitHub OAuth 配置
func (s *OAuthService) SetGitHubConfig(clientID, clientSecret string) error {
	return s.config.SetGitHubConfig(clientID, clientSecret)
}

// generateRandomString 生成随机字符串
func generateRandomString(length int) (string, error) {
	b := make([]byte, length)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// generatePKCEVerifier 生成 PKCE code_verifier (43-128 字符)
func generatePKCEVerifier() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// GetUserRepositories 获取用户的私有仓库（需要认证）
func (s *OAuthService) GetUserRepositories() ([]models.Repository, error) {
	accessToken := s.config.GetAuthToken()
	if accessToken == "" {
		return nil, fmt.Errorf("未登录")
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=30", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var apiRepos []struct {
		ID          int64  `json:"id"`
		Name        string `json:"name"`
		FullName    string `json:"full_name"`
		Description string `json:"description"`
		Language    string `json:"language"`
		Stargazers  int    `json:"stargazers_count"`
		Forks       int    `json:"forks_count"`
		HTMLURL     string `json:"html_url"`
		CreatedAt   string `json:"created_at"`
		UpdatedAt   string `json:"updated_at"`
		Owner       struct {
			Login string `json:"login"`
		} `json:"owner"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiRepos); err != nil {
		return nil, err
	}

	repos := make([]models.Repository, len(apiRepos))
	for i, repo := range apiRepos {
		repos[i] = models.Repository{
			ID:               repo.ID,
			Name:             repo.Name,
			FullName:         repo.FullName,
			Owner:            repo.Owner.Login,
			Description:      repo.Description,
			Language:         repo.Language,
			StargazersCount:  repo.Stargazers,
			ForksCount:       repo.Forks,
			HTMLURL:          repo.HTMLURL,
		}
	}

	return repos, nil
}

// GetStarredRepositories 获取用户星标的仓库
func (s *OAuthService) GetStarredRepositories() ([]models.Repository, error) {
	accessToken := s.config.GetAuthToken()
	if accessToken == "" {
		return nil, fmt.Errorf("未登录")
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	req, err := http.NewRequest("GET", "https://api.github.com/user/starred?sort=created&per_page=30", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var apiRepos []struct {
		ID          int64  `json:"id"`
		Name        string `json:"name"`
		FullName    string `json:"full_name"`
		Description string `json:"description"`
		Language    string `json:"language"`
		Stargazers  int    `json:"stargazers_count"`
		Forks       int    `json:"forks_count"`
		HTMLURL     string `json:"html_url"`
		CreatedAt   string `json:"created_at"`
		UpdatedAt   string `json:"updated_at"`
		Owner       struct {
			Login string `json:"login"`
		} `json:"owner"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiRepos); err != nil {
		return nil, err
	}

	repos := make([]models.Repository, len(apiRepos))
	for i, repo := range apiRepos {
		repos[i] = models.Repository{
			ID:               repo.ID,
			Name:             repo.Name,
			FullName:         repo.FullName,
			Owner:            repo.Owner.Login,
			Description:      repo.Description,
			Language:         repo.Language,
			StargazersCount:  repo.Stargazers,
			ForksCount:       repo.Forks,
			HTMLURL:          repo.HTMLURL,
		}
	}

	return repos, nil
}
