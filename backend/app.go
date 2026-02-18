package backend

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github-star-app/backend/auth"
	"github-star-app/backend/config"
	"github-star-app/backend/github"
	"github-star-app/backend/logger"
	"github-star-app/backend/models"
	"github-star-app/backend/storage"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App 应用结构
type App struct {
	ctx           context.Context
	githubService *github.Service
	cache         []models.Repository
	cacheMutex    sync.RWMutex

	// 认证相关
	oauthService      *auth.OAuthService
	deviceFlowService *auth.DeviceFlowService
	appConfig         *config.Config
}

// NewApp 创建新的应用实例
func NewApp() *App {
	// 初始化日志系统
	logger.Init()

	// 创建 GitHub 服务（可以传入 GitHub token 以提高 API 限制）
	githubService := github.NewService("") // 留空则不使用 token

	// 获取配置服务单例
	appConfig := config.Get()

	// 创建内存会话存储
	sessionStore := storage.NewMemorySessionStore()

	// 创建 OAuth 服务（方式1：Authorization Code Flow）
	oauthService := auth.NewOAuthService(appConfig, sessionStore)

	// 创建 Device Flow 服务（方式2：Device Authorization Flow）
	deviceFlowService := auth.NewDeviceFlowService(appConfig)

	return &App{
		githubService:     githubService,
		cache:             make([]models.Repository, 0),
		oauthService:      oauthService,
		deviceFlowService: deviceFlowService,
		appConfig:         appConfig,
	}
}

// Startup 应用启动时调用
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	a.oauthService.SetContext(ctx)
	a.deviceFlowService.SetContext(ctx)

	// 查找 shared 目录的策略：
	// 1. 尝试当前工作目录下的 shared（开发环境）
	// 2. 尝试可执行文件目录下的 shared（生产环境）
	// 3. 尝试用户主目录下的 github-star-app/shared
	sharedDir := ""
	configPaths := []string{}

	// 当前工作目录下的 shared
	wd, _ := os.Getwd()
	configPaths = append(configPaths, filepath.Join(wd, "shared"))

	// 可执行文件目录下的 shared
	execDir, err := os.Executable()
	if err == nil {
		configPaths = append(configPaths, filepath.Join(filepath.Dir(execDir), "shared"))
	}

	// 用户主目录下的 github-star-app/shared
	homeDir, _ := os.UserHomeDir()
	configPaths = append(configPaths, filepath.Join(homeDir, "github-star-app", "shared"))

	// 尝试每个路径
	for _, path := range configPaths {
		runtime.LogPrintf(ctx, "尝试加载配置: %s", filepath.Join(path, "app-config.toml"))
		if err := a.appConfig.Load(path); err == nil {
			sharedDir = path
			runtime.LogPrintf(ctx, "配置文件已加载: %s", filepath.Join(path, "app-config.toml"))
			break
		}
	}

	if sharedDir == "" {
		runtime.LogPrintf(ctx, "警告: 未找到配置文件，将在首次运行时创建默认配置")
		// 使用第一个路径创建默认配置
		a.appConfig.Load(configPaths[0])
	}

	// 打印 Client ID 状态（用于调试）
	clientID := a.appConfig.GetGitHubClientID()
	if clientID == "" {
		runtime.LogPrintf(ctx, "警告: GitHub Client ID 未配置，请在 shared/app-config.toml 中设置")
	} else {
		runtime.LogPrintf(ctx, "GitHub Client ID 已配置: %s...", clientID[:8]+"...")
	}

	// 打印登录状态
	if a.appConfig.IsLoggedIn() {
		_, login, name, _ := a.appConfig.GetAuthUser()
		runtime.LogPrintf(ctx, "用户已登录: %s (%s)", login, name)
	}
}

// Shutdown 应用关闭时调用
func (a *App) Shutdown(ctx context.Context) {
}

// GetTrendingRepositories 获取趋势仓库
// language: 编程语言过滤，如 "go", "python"，空字符串表示全部
// since: 时间范围 "daily", "weekly", "monthly"
func (a *App) GetTrendingRepositories(language, since string) ([]models.Repository, error) {
	repos, err := a.githubService.GetTrendingRepositories(language, since)
	if err != nil {
		return nil, fmt.Errorf("获取趋势仓库失败: %w", err)
	}

	// 更新缓存
	a.cacheMutex.Lock()
	a.cache = repos
	a.cacheMutex.Unlock()

	return repos, nil
}

// RefreshRepositories 刷新仓库列表（使用默认参数）
func (a *App) RefreshRepositories() ([]models.Repository, error) {
	return a.GetTrendingRepositories("", "weekly")
}

// GetCachedRepositories 从缓存获取仓库
func (a *App) GetCachedRepositories() []models.Repository {
	a.cacheMutex.RLock()
	defer a.cacheMutex.RUnlock()

	// 返回副本
	result := make([]models.Repository, len(a.cache))
	copy(result, a.cache)
	return result
}

// GetRepositoryByID 根据 owner/repo 获取仓库详情
func (a *App) GetRepositoryByID(owner, repo string) (*models.Repository, error) {
	return a.githubService.GetRepositoryByID(owner, repo)
}

// Greet 测试用的问候函数
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// OpenURL 在默认浏览器中打开 URL
func (a *App) OpenURL(url string) {
	if a.ctx != nil {
		runtime.BrowserOpenURL(a.ctx, url)
	}
}

// ========== 认证相关方法 ==========

// StartLogin 开始 OAuth 登录流程
// 返回授权 URL，前端调用 OpenURL 打开
func (a *App) StartLogin() (string, error) {
	authURL, err := a.oauthService.StartLogin()
	if err != nil {
		return "", fmt.Errorf("启动登录失败: %w", err)
	}
	return authURL, nil
}

// GetCurrentUser 获取当前登录用户信息
func (a *App) GetCurrentUser() (*models.User, error) {
	return a.oauthService.GetCurrentUser()
}

// IsLoggedIn 检查是否已登录
func (a *App) IsLoggedIn() bool {
	return a.oauthService.IsLoggedIn()
}

// Logout 登出
func (a *App) Logout() error {
	return a.oauthService.Logout()
}

// SetGitHubConfig 设置 GitHub OAuth 配置
func (a *App) SetGitHubConfig(clientID, clientSecret string) error {
	return a.oauthService.SetGitHubConfig(clientID, clientSecret)
}

// GetStarredRepositories 获取用户星标的仓库
func (a *App) GetStarredRepositories() ([]models.Repository, error) {
	return a.oauthService.GetStarredRepositories()
}

// GetUserRepositories 获取用户的私有仓库
func (a *App) GetUserRepositories() ([]models.Repository, error) {
	return a.oauthService.GetUserRepositories()
}

// ========== Device Flow 登录方式（无需 Client Secret）==========

// DeviceFlowInfo Device Flow 登录信息
type DeviceFlowInfo struct {
	UserCode                string `json:"user_code"`
	VerificationURI         string `json:"verification_uri"`
	VerificationURIComplete string `json:"verification_uri_complete"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
}

// StartDeviceFlowLogin 开始 Device Flow 登录
// 返回用户需要输入的验证码和验证 URL
func (a *App) StartDeviceFlowLogin() (*DeviceFlowInfo, error) {
	response, err := a.deviceFlowService.StartLogin()
	if err != nil {
		return nil, fmt.Errorf("启动 Device Flow 登录失败: %w", err)
	}

	return &DeviceFlowInfo{
		UserCode:                response.UserCode,
		VerificationURI:         response.VerificationURI,
		VerificationURIComplete: response.VerificationURIComplete,
		ExpiresIn:               response.ExpiresIn,
		Interval:                response.Interval,
	}, nil
}

// OpenVerificationURL 在浏览器中打开验证页面
func (a *App) OpenVerificationURL() {
	if a.ctx != nil {
		runtime.BrowserOpenURL(a.ctx, "https://github.com/login/device")
	}
}

// GetLoginMethod 获取当前设置的登录方式
// 返回 "oauth" (方式1) 或 "device" (方式2)
func (a *App) GetLoginMethod() string {
	return a.appConfig.GetLoginMethod()
}

// SetLoginMethod 设置登录方式
func (a *App) SetLoginMethod(method string) error {
	return a.appConfig.SetLoginMethod(method)
}

// GetLogs 获取应用日志内容
func (a *App) GetLogs() string {
	return logger.GetLogs()
}
