package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github-star-app/backend/config"
	"github-star-app/backend/logger"
	"github-star-app/backend/models"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	// GitHub Device Flow 端点
	deviceCodeURL = "https://github.com/login/device/code"
	tokenURL      = "https://github.com/login/oauth/access_token"
	// my-github-stars OAuth App Client ID
	defaultClientID = "Ov23liRTX5eK2scwvG20"
)

// DeviceCodeResponse GitHub Device Code 响应
type DeviceCodeResponse struct {
	DeviceCode              string `json:"device_code"`
	UserCode                string `json:"user_code"`
	VerificationURI         string `json:"verification_uri"`
	VerificationURIComplete string `json:"verification_uri_complete"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
}

// DeviceFlowService GitHub Device Flow 认证服务
type DeviceFlowService struct {
	ctx         context.Context
	config      *config.Config
	pollingDone chan struct{}
}

// NewDeviceFlowService 创建 Device Flow 服务
func NewDeviceFlowService(cfg *config.Config) *DeviceFlowService {
	logger.Init()
	logger.Info("[DeviceFlow] 服务创建")
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
	s.Cancel()

	clientID := s.config.GetGitHubClientID()
	// 如果配置文件没有 Client ID，使用内置的默认值
	if clientID == "" {
		clientID = defaultClientID
	}

	logger.Info("[DeviceFlow] 开始登录，Client ID: %s", clientID)

	// 请求 Device Code
	req, err := http.NewRequest("POST", deviceCodeURL, nil)
	if err != nil {
		logger.Error("[DeviceFlow] 创建请求失败: %v", err)
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
		logger.Error("[DeviceFlow] 请求 Device Code 失败: %v", err)
		return nil, fmt.Errorf("请求 Device Code 失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logger.Error("[DeviceFlow] GitHub API 返回错误 %d: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("GitHub API 返回错误: %d, %s", resp.StatusCode, string(body))
	}

	var result DeviceCodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		logger.Error("[DeviceFlow] 解析响应失败: %v", err)
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	logger.Info("[DeviceFlow] Device code 获取成功, UserCode: %s, ExpiresIn: %d, Interval: %d",
		result.UserCode, result.ExpiresIn, result.Interval)

	// 启动轮询
	logger.Info("[DeviceFlow] 启动轮询获取 token...")
	go s.pollForToken(result.DeviceCode, result.Interval, result.ExpiresIn)

	return &result, nil
}

// pollForToken 轮询获取 Token
func (s *DeviceFlowService) pollForToken(deviceCode string, interval, expiresIn int) {
	logger.Info("[DeviceFlow] 轮询开始，deviceCode: %s..., interval: %d秒, expiresIn: %d秒",
		deviceCode[:8], interval, expiresIn)

	currentInterval := interval
	client := &http.Client{Timeout: 10 * time.Second}
	pollCount := 0
	startTime := time.Now()

	for {
		// 检查是否超时
		if time.Since(startTime) > time.Duration(expiresIn)*time.Second {
			logger.Warn("[DeviceFlow] 轮询超时（%d秒后），放弃", expiresIn)
			return
		}

		// 检查是否被取消
		select {
		case <-s.pollingDone:
			logger.Info("[DeviceFlow] 轮询被取消")
			return
		default:
		}

		pollCount++
		logger.Debug("[DeviceFlow] 第 %d 次轮询，间隔 %d 秒...", pollCount, currentInterval)

		token, err := s.exchangeToken(client, deviceCode)
		if err == nil {
			// 成功获取 token
			// 获取用户信息
			user, err := s.fetchUserInfo(token.AccessToken)
			if err != nil {
				logger.Error("[DeviceFlow] 获取用户信息失败: %v", err)
				return
			}

			logger.Info("[DeviceFlow] 登录成功: %s (%s)", user.Login, user.Name)

			// 保存到配置文件
			if err := s.config.SetAuth(
				token.AccessToken,
				user.ID,
				user.Login,
				user.Name,
				user.AvatarURL,
			); err != nil {
				logger.Error("[DeviceFlow] 保存认证信息失败: %v", err)
			} else {
				logger.Info("[DeviceFlow] 认证信息已保存到配置文件")
			}

			// 通知前端
			if s.ctx != nil {
				logger.Info("[DeviceFlow] 发送 login-success 事件到前端")
				runtime.EventsEmit(s.ctx, "login-success", map[string]interface{}{
					"id":           user.ID,
					"login":        user.Login,
					"name":         user.Name,
					"email":        user.Email,
					"avatar_url":   user.AvatarURL,
					"bio":          user.Bio,
					"location":     user.Location,
					"blog":         user.Blog,
					"company":      user.Company,
					"public_repos": user.PublicRepos,
					"followers":    user.Followers,
					"following":    user.Following,
				})
			} else {
				logger.Warn("[DeviceFlow] 警告: ctx 为 nil，无法发送事件")
			}

			return
		}

		// 处理错误
		errMsg := err.Error()
		if errMsg == "pending" {
			logger.Debug("[DeviceFlow] 第 %d 次轮询: 等待用户授权...", pollCount)
		} else if errMsg == "slow_down" {
			currentInterval += 5
			logger.Info("[DeviceFlow] GitHub 要求降速，轮询间隔增加到 %d 秒", currentInterval)
		} else {
			logger.Warn("[DeviceFlow] 第 %d 次轮询失败: %v", pollCount, err)
		}

		// 等待下一次轮询
		select {
		case <-s.pollingDone:
			logger.Info("[DeviceFlow] 轮询被取消")
			return
		case <-time.After(time.Duration(currentInterval) * time.Second):
			// 继续下一次轮询
		}
	}
}

// exchangeToken 用 Device Code 换取 Token
func (s *DeviceFlowService) exchangeToken(client *http.Client, deviceCode string) (*TokenResponse, error) {
	clientID := s.config.GetGitHubClientID()
	// 如果配置文件没有 Client ID，使用内置的默认值
	if clientID == "" {
		clientID = defaultClientID
	}

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
	// GitHub 设备码换 token：即使 HTTP 200，也可能返回 {"error":"authorization_pending"} 之类的 JSON。
	// 所以不能只看 status code，必须解析 body。
	var errResp struct {
		Error            string `json:"error"`
		ErrorDescription string `json:"error_description"`
	}
	_ = json.Unmarshal(body, &errResp)

	if errResp.Error != "" {
		// 授权未完成或等待中，继续轮询
		if errResp.Error == "authorization_pending" {
			return nil, fmt.Errorf("pending")
		}
		if errResp.Error == "slow_down" {
			return nil, fmt.Errorf("slow_down")
		}
		return nil, fmt.Errorf("token exchange failed: %s", errResp.Error)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange http error: %d", resp.StatusCode)
	}

	var token TokenResponse
	if err := json.Unmarshal(body, &token); err != nil {
		return nil, err
	}
	if token.AccessToken == "" {
		return nil, fmt.Errorf("token exchange returned empty token")
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

	// 清除配置
	if err := s.config.ClearAuth(); err != nil {
		logger.Error("[DeviceFlow] 清除认证信息失败: %v", err)
	}

	// 通知前端
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, "logout-success", nil)
	}

	logger.Info("[DeviceFlow] User logged out")
	return nil
}
