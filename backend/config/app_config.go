package config

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/BurntSushi/toml"
)

// AppConfig 应用配置
type AppConfig struct {
	GitHub     GitHubConfig `toml:"github"`
	Auth       AuthConfig   `toml:"auth"`
	Preferences PreferencesConfig `toml:"preferences"`
}

// GitHubConfig GitHub 配置
type GitHubConfig struct {
	ClientID     string `toml:"client_id"`
	ClientSecret string `toml:"client_secret"`
}

// AuthConfig 认证配置（存储用户登录信息）
type AuthConfig struct {
	AccessToken string `toml:"access_token"`
	UserID      int64  `toml:"user_id"`
	Login       string `toml:"login"`
	Name        string `toml:"name"`
	AvatarURL   string `toml:"avatar_url"`
}

// PreferencesConfig 偏好设置
type PreferencesConfig struct {
	// LoginMethod 登录方式: "oauth" (方式1，需要ClientSecret) 或 "device" (方式2，无需ClientSecret)
	LoginMethod string `toml:"login_method"`
}

// Config 配置服务
type Config struct {
	mu     sync.RWMutex
	config *AppConfig
	path   string
}

var (
	instance *Config
	once     sync.Once
)

const (
	// LoginMethodOAuth OAuth 授权码登录（方式1）
	LoginMethodOAuth = "oauth"
	// LoginMethodDevice 设备码登录（方式2，推荐）
	LoginMethodDevice = "device"
)

// Get 获取配置服务单例
func Get() *Config {
	once.Do(func() {
		instance = &Config{
			config: &AppConfig{
				Preferences: PreferencesConfig{
					LoginMethod: LoginMethodDevice, // 默认使用方式2
				},
			},
		}
	})
	return instance
}

// Load 加载配置文件
func (c *Config) Load(sharedDir string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.path = filepath.Join(sharedDir, "app-config.toml")

	// 如果文件不存在，创建默认配置
	if _, err := os.Stat(c.path); os.IsNotExist(err) {
		// 创建默认配置
		c.config = &AppConfig{
			GitHub: GitHubConfig{
				ClientID:     "",
				ClientSecret: "",
			},
			Auth: AuthConfig{},
			Preferences: PreferencesConfig{
				LoginMethod: LoginMethodDevice, // 默认使用方式2
			},
		}
		return c.Save()
	}

	// 读取配置文件
	content, err := os.ReadFile(c.path)
	if err != nil {
		return fmt.Errorf("读取配置文件失败: %w", err)
	}

	var config AppConfig
	if err := toml.Unmarshal(content, &config); err != nil {
		return fmt.Errorf("解析配置文件失败: %w", err)
	}

	// 如果登录方式为空，设置默认值
	if config.Preferences.LoginMethod == "" {
		config.Preferences.LoginMethod = LoginMethodDevice
	}

	c.config = &config
	return nil
}

// Save 保存配置文件
func (c *Config) Save() error {
	if c.path == "" {
		return fmt.Errorf("配置路径未设置")
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	// 确保目录存在
	dir := filepath.Dir(c.path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建配置目录失败: %w", err)
	}

	// 序列化为 TOML
	content, err := toml.Marshal(c.config)
	if err != nil {
		return fmt.Errorf("序列化配置失败: %w", err)
	}

	// 写入文件
	if err := os.WriteFile(c.path, content, 0600); err != nil {
		return fmt.Errorf("写入配置文件失败: %w", err)
	}

	return nil
}

// GetGitHubClientID 获取 GitHub Client ID
func (c *Config) GetGitHubClientID() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config.GitHub.ClientID
}

// GetGitHubClientSecret 获取 GitHub Client Secret
func (c *Config) GetGitHubClientSecret() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config.GitHub.ClientSecret
}

// SetGitHubConfig 设置 GitHub OAuth 配置
func (c *Config) SetGitHubConfig(clientID, clientSecret string) error {
	c.mu.Lock()
	c.config.GitHub.ClientID = clientID
	c.config.GitHub.ClientSecret = clientSecret
	c.mu.Unlock()
	return c.Save()
}

// GetAuthToken 获取存储的认证 token
func (c *Config) GetAuthToken() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config.Auth.AccessToken
}

// SetAuth 设置认证信息
func (c *Config) SetAuth(accessToken string, userID int64, login, name, avatarURL string) error {
	c.mu.Lock()
	c.config.Auth.AccessToken = accessToken
	c.config.Auth.UserID = userID
	c.config.Auth.Login = login
	c.config.Auth.Name = name
	c.config.Auth.AvatarURL = avatarURL
	c.mu.Unlock()
	return c.Save()
}

// ClearAuth 清除认证信息
func (c *Config) ClearAuth() error {
	c.mu.Lock()
	c.config.Auth = AuthConfig{}
	c.mu.Unlock()
	return c.Save()
}

// IsLoggedIn 检查是否已登录
func (c *Config) IsLoggedIn() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config.Auth.AccessToken != ""
}

// GetAuthUser 获取认证用户信息
func (c *Config) GetAuthUser() (userID int64, login, name, avatarURL string) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.config.Auth.UserID, c.config.Auth.Login, c.config.Auth.Name, c.config.Auth.AvatarURL
}

// GetLoginMethod 获取登录方式
func (c *Config) GetLoginMethod() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	method := c.config.Preferences.LoginMethod
	if method == "" {
		return LoginMethodDevice // 默认返回方式2
	}
	return method
}

// SetLoginMethod 设置登录方式
func (c *Config) SetLoginMethod(method string) error {
	c.mu.Lock()
	c.config.Preferences.LoginMethod = method
	c.mu.Unlock()
	return c.Save()
}
