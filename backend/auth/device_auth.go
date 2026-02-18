package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
"log"
	"net/http"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github-star-app/backend/config"
	"github-star-app/backend/models"
)

const (
	// GitHub Device Flow 端点
	deviceCodeURL = "https://github.com/login/device/code"
	tokenURL       = "https://github.com/login/oauth/access_token"
)

// DeviceCodeResponse GitHub Device Code 响应
type DeviceCodeResponse struct {
	DeviceCode      string `json:"device_code"`
	UserCode       string `json:"user_code"`
	VerificationURI string `json:"verification_uri"`
	ExpiresIn       int    `json:"expires_in"`
	Interval        int    `json:"interval"`
}

// DeviceFlowService GitHub Device Flow 认证服务
type DeviceFlowService struct {
	ctx         context.Context
	config      *config.Config
	pollingDone chan struct{}
}

// NewDeviceFlowService 创建 Device Flow 服务
func NewDeviceFlowService(cfg *config.Config) *DeviceFlowService {
	return &DeviceFlowService{
		config:      cfg,
		pollingDone: make(chan struct{}),
	}
}

// SetContext 设置 Wails 上下文
func (s *DeviceFlowService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// StartLogin 开始 Device Flow 登录
func (s *DeviceFlowService) StartLogin() (*DeviceCodeResponse, error) {
	clientID := s.config.GetGitHubClientID()
	if clientID == "" {
		return nil, fmt.Errorf("GitHub Client ID 未配置，请在 shared/app-config.toml 中设置")
	}

	// 请求 Device Code
	req, err := http.NewRequest("POST", deviceCodeURL, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	q := req.URL.Query()
	q.Add("client_id", clientID)
	q.Add("scope", "read:user user:email")
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求 Device Code 失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var result DeviceCodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	log.Printf("[DeviceFlow] Device code 获取成功, UserCode: %s", result.UserCode)

	// 启动轮询
	go s.pollForToken(result.DeviceCode, result.Interval, result.ExpiresIn)

	return &result, nil
}

// pollForToken 轮询获取 Token
func (s *DeviceFlowService) pollForToken(deviceCode string, interval, expiresIn int) {
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	timeout := time.After(time.Duration(expiresIn) * time.Second)
	client := &http.Client{Timeout: 10 * time.Second}

	for {
		select {
		case <-timeout:
			log.Printf("[DeviceFlow] 轮询超时")
			return
		case <-s.pollingDone:
			log.Printf("[DeviceFlow] 轮询被取消")
			return
		case <-ticker.C:
			token, err := s.exchangeToken(client, deviceCode)
			if err != nil {
				// 继续轮询
				continue
			}

			// 获取到 token，获取用户信息
			user, err := s.fetchUserInfo(token.AccessToken)
			if err != nil {
				log.Printf("[DeviceFlow] 获取用户信息失败: %v", err)
				return
			}

			log.Printf("[DeviceFlow] 登录成功: %s (%s)", user.Login, user.Name)

			// 保存到配置
			if err := s.config.SetAuth(
				token.AccessToken,
				user.ID,
				user.Login,
				user.Name,
				user.AvatarURL,
			); err != nil {
				log.Printf("[DeviceFlow] 保存认证信息失败: %v", err)
				return
			}

			// 通知前端
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

			return
		}
	}
}

// exchangeToken 用 Device Code 换取 Token
func (s *DeviceFlowService) exchangeToken(client *http.Client, deviceCode string) (*TokenResponse, error) {
	clientID := s.config.GetGitHubClientID()

	req, err := http.NewRequest("POST", tokenURL, nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	q.Add("client_id", clientID)
	q.Add("device_code", deviceCode)
	q.Add("grant_type", "urn:ietf:params:oauth:grant-type:device_code")
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		// 处理 GitHub 返回的错误
		var errResp struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
		}
		json.Unmarshal(body, &errResp)

		// 授权未完成或等待中，继续轮询
		if errResp.Error == "authorization_pending" {
			return nil, fmt.Errorf("pending")
		}
		if errResp.Error == "slow_down" {
			return nil, fmt.Errorf("slow_down")
		}

		return nil, fmt.Errorf("token exchange failed: %s", errResp.Error)
	}

	var token TokenResponse
	if err := json.Unmarshal(body, &token); err != nil {
		return nil, err
	}

	return &token, nil
}

// TokenResponse Token 响应
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
}

// fetchUserInfo 获取用户信息
func (s *DeviceFlowService) fetchUserInfo(accessToken string) (*models.User, error) {
	client := &http.Client{Timeout: 10 * time.Second}

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

// Cancel 取消轮询
func (s *DeviceFlowService) Cancel() {
	select {
	case <-s.pollingDone:
		// 已经关闭
	default:
		close(s.pollingDone)
	}
	s.pollingDone = make(chan struct{})
}

// GetCurrentUser 获取当前登录用户
func (s *DeviceFlowService) GetCurrentUser() (*models.User, error) {
	if !s.config.IsLoggedIn() {
		return nil, nil
	}

	userID, login, name, avatarURL := s.config.GetAuthUser()
	return &models.User{
		ID:        userID,
		Login:     login,
		Name:      name,
		AvatarURL: avatarURL,
	}, nil
}

// IsLoggedIn 检查是否已登录
func (s *DeviceFlowService) IsLoggedIn() bool {
	return s.config.IsLoggedIn()
}

// Logout 登出
func (s *DeviceFlowService) Logout() error {
	s.Cancel() // 取消可能正在进行的轮询

	if err := s.config.ClearAuth(); err != nil {
		return fmt.Errorf("清除认证信息失败: %w", err)
	}

	// 通知前端
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "logout-success", nil)
	}

	log.Printf("[DeviceFlow] User logged out")
	return nil
}
