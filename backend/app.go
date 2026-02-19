package backend

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github-star-app/backend/auth"
	"github-star-app/backend/config"
	"github-star-app/backend/database"
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
	db            *database.DB

	// 认证相关
	oauthService      *auth.OAuthService
	deviceFlowService *auth.DeviceFlowService
	appConfig         *config.Config
	sharedDir         string // 记录 shared 目录路径

	// 刷新计时器（控制刷新频率，60分钟内只能刷新一次）
	lastRefresh  time.Time
	refreshMutex sync.Mutex
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
		sharedDir = configPaths[0]
		a.appConfig.Load(sharedDir)
	}

	// 保存 shared 目录路径
	a.sharedDir = sharedDir

	// 初始化数据库
	db, err := database.NewDB(sharedDir)
	if err != nil {
		runtime.LogPrintf(ctx, "初始化数据库失败: %v", err)
	} else {
		a.db = db
		if err := a.db.Init(); err != nil {
			runtime.LogPrintf(ctx, "数据库表初始化失败: %v", err)
		} else {
			runtime.LogPrintf(ctx, "数据库初始化成功: %s", filepath.Join(sharedDir, "trending.db"))
		}
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

	// 自动加载初始数据
	a.autoLoadInitialData(ctx)
}

// Shutdown 应用关闭时调用
func (a *App) Shutdown(ctx context.Context) {
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

// OpenDirectoryDialog 打开目录选择对话框
// 返回用户选择的目录路径，如果取消则返回空字符串
func (a *App) OpenDirectoryDialog() (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("上下文未初始化")
	}

	// 获取默认目录（用户配置的克隆目录或用户主目录）
	defaultDir := a.appConfig.GetGitHubCloneDir()
	if defaultDir == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("获取用户主目录失败: %w", err)
		}
		defaultDir = homeDir
	}

	// 打开目录选择对话框
	selectedPath, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "选择 GitHub 克隆目录",
		DefaultDirectory: defaultDir,
	})
	if err != nil {
		return "", fmt.Errorf("打开目录选择对话框失败: %w", err)
	}

	// 如果用户取消选择，返回空字符串
	if selectedPath == "" {
		return "", nil
	}

	return selectedPath, nil
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

// ========== 用户设置相关方法 ==========

// Settings 用户设置
type Settings struct {
	RefreshInterval float64 `json:"refresh_interval"`
	GitHubCloneDir  string  `json:"github_clone_dir"`
}

// GetSettings 获取当前用户设置
func (a *App) GetSettings() (*Settings, error) {
	return &Settings{
		RefreshInterval: a.appConfig.GetRefreshInterval(),
		GitHubCloneDir:  a.appConfig.GetGitHubCloneDir(),
	}, nil
}

// UpdateSettings 更新用户设置
func (a *App) UpdateSettings(settings Settings) error {
	// 验证刷新间隔
	if settings.RefreshInterval < 0.1 || settings.RefreshInterval > 24.0 {
		return fmt.Errorf("刷新间隔必须在 0.1 到 24 小时之间")
	}

	// 验证克隆目录
	if settings.GitHubCloneDir == "" {
		return fmt.Errorf("GitHub 克隆目录不能为空")
	}

	// 更新配置
	pref := config.PreferencesConfig{
		RefreshInterval: settings.RefreshInterval,
		GitHubCloneDir:  settings.GitHubCloneDir,
	}

	if err := a.appConfig.UpdatePreferences(pref); err != nil {
		return fmt.Errorf("更新设置失败: %w", err)
	}

	return nil
}

// ========== 趋势数据相关方法（使用数据库缓存）==========

// TrendingData 趋势数据响应
type TrendingData struct {
	Repositories []models.Repository `json:"repositories"`
	CachedAt     string              `json:"cached_at"` // 格式: 2006-01-02 15:00:00
}

// LoadTrendingDataResponse 加载趋势数据的响应
type LoadTrendingDataResponse struct {
	Weekly  TrendingData `json:"weekly"`
	Monthly TrendingData `json:"monthly"`
}

// LoadTrendingData 从数据库加载最新的 weekly 和 monthly 数据
func (a *App) LoadTrendingData() (*LoadTrendingDataResponse, error) {
	if a.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	response := &LoadTrendingDataResponse{}

	// 加载 weekly 数据
	weeklyEntries, err := a.db.GetLatestEntries("weekly")
	if err != nil {
		return nil, fmt.Errorf("加载 weekly 数据失败: %w", err)
	}
	response.Weekly.Repositories = a.convertEntriesToModels(weeklyEntries)
	if len(weeklyEntries) > 0 {
		response.Weekly.CachedAt = database.FormatCachedTime(weeklyEntries[0].CachedAt)
	}

	// 加载 monthly 数据
	monthlyEntries, err := a.db.GetLatestEntries("monthly")
	if err != nil {
		return nil, fmt.Errorf("加载 monthly 数据失败: %w", err)
	}
	response.Monthly.Repositories = a.convertEntriesToModels(monthlyEntries)
	if len(monthlyEntries) > 0 {
		response.Monthly.CachedAt = database.FormatCachedTime(monthlyEntries[0].CachedAt)
	}

	return response, nil
}

// LoadUserStarRepo 从数据库加载用户星标仓库
func (a *App) LoadUserStarRepo() ([]models.Repository, error) {
	if a.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	// 从数据库读取
	repos, err := a.db.GetUserStarRepos()
	if err != nil {
		return nil, fmt.Errorf("加载用户星标仓库失败: %w", err)
	}

	// 转换为 models.Repository
	return a.convertUserStarReposToModels(repos), nil
}

// RefreshUserStarRepo 刷新用户星标仓库（从 GitHub API 获取并保存到数据库）
func (a *App) RefreshUserStarRepo() ([]models.Repository, error) {
	if a.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	// 获取配置的刷新间隔
	refreshInterval := a.appConfig.GetRefreshInterval()
	refreshDuration := time.Duration(refreshInterval*3600) * time.Second

	// 检查计时器
	a.refreshMutex.Lock()
	if !a.lastRefresh.IsZero() && time.Since(a.lastRefresh) < refreshDuration {
		a.refreshMutex.Unlock()
		// 返回缓存数据
		repos, _ := a.db.GetUserStarRepos()
		return a.convertUserStarReposToModels(repos), nil
	}
	a.refreshMutex.Unlock()

	// 执行刷新
	repos := a.refreshUserStarRepoInternal()

	// 更新计时器
	a.refreshMutex.Lock()
	a.lastRefresh = time.Now()
	a.refreshMutex.Unlock()

	return repos, nil
}

// refreshUserStarRepoInternal 内部刷新方法，不检查计时器
func (a *App) refreshUserStarRepoInternal() []models.Repository {
	// 获取旧的星标数据（用于计算 stars_since）
	oldRepos, _ := a.db.GetUserStarRepos()
	oldStarsMap := make(map[int64]int)
	var oldCachedAt time.Time
	for _, repo := range oldRepos {
		oldStarsMap[repo.GithubID] = repo.StargazersCount
		if repo.CachedAt.After(oldCachedAt) {
			oldCachedAt = repo.CachedAt
		}
	}

	// 调用 OAuth 服务获取星标仓库
	repos, err := a.oauthService.GetStarredRepositories()
	if err != nil {
		runtime.LogPrintf(a.ctx, "获取星标仓库失败: %v", err)
		return nil
	}

	// 计算 time_range（刷新间隔小时数）
	now := time.Now()
	var timeRangeHours int
	if !oldCachedAt.IsZero() {
		hours := int(now.Sub(oldCachedAt).Hours())
		if hours < 1 {
			hours = 1
		}
		timeRangeHours = hours
	} else {
		timeRangeHours = 0
	}

	// 转换并计算 stars_since
	starRepos := make([]database.UserStarRepo, len(repos))
	for i, repo := range repos {
		oldStars := oldStarsMap[repo.ID]
		starsSince := repo.StargazersCount - oldStars
		if starsSince < 0 {
			starsSince = 0
		}

		starRepos[i] = database.UserStarRepo{
			GithubID:        repo.ID,
			FullName:        repo.FullName,
			Name:            repo.Name,
			Owner:           repo.Owner,
			Description:     repo.Description,
			StargazersCount: repo.StargazersCount,
			StarsSince:      starsSince,
			HTMLURL:         repo.HTMLURL,
			CachedAt:        now,
			TimeRange:       fmt.Sprintf("%d", timeRangeHours),
		}
	}

	// 保存到数据库
	if err := a.db.SaveUserStarRepos(starRepos); err != nil {
		runtime.LogPrintf(a.ctx, "保存用户星标仓库失败: %v", err)
	} else {
		runtime.LogPrintf(a.ctx, "已保存 %d 个用户星标仓库", len(repos))
	}

	return repos
}

// convertUserStarReposToModels 将 database.UserStarRepo 转换为 models.Repository
func (a *App) convertUserStarReposToModels(repos []database.UserStarRepo) []models.Repository {
	result := make([]models.Repository, len(repos))
	for i, repo := range repos {
		result[i] = models.Repository{
			ID:              repo.GithubID,
			FullName:        repo.FullName,
			Name:            repo.Name,
			Owner:           repo.Owner,
			Description:     repo.Description,
			StargazersCount: repo.StargazersCount,
			StarsSince:      repo.StarsSince,
			HTMLURL:         repo.HTMLURL,
		}
	}
	return result
}

// convertModelsToUserStarRepos 将 models.Repository 转换为 database.UserStarRepo
func (a *App) convertModelsToUserStarRepos(repos []models.Repository) []database.UserStarRepo {
	result := make([]database.UserStarRepo, len(repos))
	for i, repo := range repos {
		result[i] = database.UserStarRepo{
			GithubID:        repo.ID,
			FullName:        repo.FullName,
			Name:            repo.Name,
			Owner:           repo.Owner,
			Description:     repo.Description,
			StargazersCount: repo.StargazersCount,
			StarsSince:      repo.StarsSince,
			HTMLURL:         repo.HTMLURL,
			CachedAt:        time.Now(),
		}
	}
	return result
}

// RefreshTrendingResponse 刷新趋势数据的响应
type RefreshTrendingResponse struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	Weekly  TrendingData `json:"weekly"`
	Monthly TrendingData `json:"monthly"`
}

// RefreshTrending 手动刷新趋势数据（同时爬取 weekly 和 monthly）
func (a *App) RefreshTrending() (*RefreshTrendingResponse, error) {
	if a.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	// 获取配置的刷新间隔
	refreshInterval := a.appConfig.GetRefreshInterval()
	refreshDuration := time.Duration(refreshInterval*3600) * time.Second

	// 检查计时器
	a.refreshMutex.Lock()
	if !a.lastRefresh.IsZero() && time.Since(a.lastRefresh) < refreshDuration {
		remaining := refreshDuration - time.Since(a.lastRefresh)
		a.refreshMutex.Unlock()
		// 返回缓存数据
		response := &RefreshTrendingResponse{
			Success: true,
			Message: fmt.Sprintf("距离下次刷新还需 %.0f 分钟", remaining.Minutes()),
		}
		weeklyEntries, _ := a.db.GetLatestEntries("weekly")
		response.Weekly.Repositories = a.convertEntriesToModels(weeklyEntries)
		if len(weeklyEntries) > 0 {
			response.Weekly.CachedAt = database.FormatCachedTime(weeklyEntries[0].CachedAt)
		}
		monthlyEntries, _ := a.db.GetLatestEntries("monthly")
		response.Monthly.Repositories = a.convertEntriesToModels(monthlyEntries)
		if len(monthlyEntries) > 0 {
			response.Monthly.CachedAt = database.FormatCachedTime(monthlyEntries[0].CachedAt)
		}
		return response, nil
	}
	a.refreshMutex.Unlock()

	// 执行刷新
	response := a.refreshTrendingInternal()

	// 更新计时器
	a.refreshMutex.Lock()
	a.lastRefresh = time.Now()
	a.refreshMutex.Unlock()

	return response, nil
}

// refreshTrendingInternal 内部刷新方法，不检查计时器
func (a *App) refreshTrendingInternal() *RefreshTrendingResponse {
	now := time.Now()
	currentHour := now.Truncate(time.Hour)

	response := &RefreshTrendingResponse{
		Success: true,
		Message: "刷新成功",
	}

	// 爬取 weekly 数据
	runtime.LogPrintf(a.ctx, "开始爬取 weekly 趋势数据...")
	weeklyRepos, err := a.githubService.GetTrendingRepositories("", "weekly")
	if err != nil {
		runtime.LogPrintf(a.ctx, "爬取 weekly 数据失败: %v", err)
		response.Success = false
		response.Message = fmt.Sprintf("爬取 weekly 数据失败: %v", err)
		return response
	}
	weeklyEntries := a.convertModelsToEntries(weeklyRepos)
	if err := a.db.SaveTrendingEntries(weeklyEntries, "weekly", currentHour); err != nil {
		runtime.LogPrintf(a.ctx, "保存 weekly 数据失败: %v", err)
	} else {
		runtime.LogPrintf(a.ctx, "已保存 %d 条 weekly 趋势数据", len(weeklyRepos))
	}
	response.Weekly.Repositories = weeklyRepos
	response.Weekly.CachedAt = database.FormatCachedTime(currentHour)

	// 爬取 monthly 数据
	runtime.LogPrintf(a.ctx, "开始爬取 monthly 趋势数据...")
	monthlyRepos, err := a.githubService.GetTrendingRepositories("", "monthly")
	if err != nil {
		runtime.LogPrintf(a.ctx, "爬取 monthly 数据失败: %v", err)
	} else {
		monthlyEntries := a.convertModelsToEntries(monthlyRepos)
		if err := a.db.SaveTrendingEntries(monthlyEntries, "monthly", currentHour); err != nil {
			runtime.LogPrintf(a.ctx, "保存 monthly 数据失败: %v", err)
		} else {
			runtime.LogPrintf(a.ctx, "已保存 %d 条 monthly 趋势数据", len(monthlyRepos))
		}
		response.Monthly.Repositories = monthlyRepos
		response.Monthly.CachedAt = database.FormatCachedTime(currentHour)
	}

	return response
}

// GetTrendingRepositories 根据 timeRange 返回对应的数据
// 只从数据库读取，不触发网络请求
func (a *App) GetTrendingRepositories(timeRange string) ([]models.Repository, error) {
	if a.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	entries, err := a.db.GetLatestEntries(timeRange)
	if err != nil {
		return nil, fmt.Errorf("获取 %s 数据失败: %w", timeRange, err)
	}

	return a.convertEntriesToModels(entries), nil
}

// convertModelsToEntries 将 models.Repository 转换为 database.TrendingEntry
func (a *App) convertModelsToEntries(repos []models.Repository) []database.TrendingEntry {
	entries := make([]database.TrendingEntry, len(repos))
	for i, repo := range repos {
		entries[i] = database.TrendingEntry{
			GithubID:        repo.ID,
			FullName:        repo.FullName,
			Name:            repo.Name,
			Owner:           repo.Owner,
			Description:     repo.Description,
			StargazersCount: repo.StargazersCount,
			StarsSince:      repo.StarsSince,
			HTMLURL:         repo.HTMLURL,
		}
	}
	return entries
}

// convertEntriesToModels 将 database.TrendingEntry 转换为 models.Repository
func (a *App) convertEntriesToModels(entries []database.TrendingEntry) []models.Repository {
	repos := make([]models.Repository, len(entries))
	for i, entry := range entries {
		repos[i] = models.Repository{
			ID:              entry.GithubID,
			FullName:        entry.FullName,
			Name:            entry.Name,
			Owner:           entry.Owner,
			Description:     entry.Description,
			StargazersCount: entry.StargazersCount,
			StarsSince:      entry.StarsSince,
			HTMLURL:         entry.HTMLURL,
			CreatedAt:       models.JSONDateTime{Time: entry.CachedAt},
			UpdatedAt:       models.JSONDateTime{Time: entry.CachedAt},
		}
	}
	return repos
}

// autoLoadInitialData 应用启动时自动加载初始数据
// 根据数据库缓存时间决定是否需要刷新，并初始化计时器
func (a *App) autoLoadInitialData(ctx context.Context) {
	if a.db == nil {
		runtime.LogPrintf(ctx, "数据库未初始化，跳过自动加载")
		return
	}

	// 获取数据库最新的缓存时间
	cachedAt, err := a.db.GetLatestCachedAt()
	if err != nil {
		runtime.LogPrintf(ctx, "获取缓存时间失败: %v", err)
		return
	}

	// 获取配置的刷新间隔
	refreshInterval := a.appConfig.GetRefreshInterval()
	refreshDuration := time.Duration(refreshInterval*3600) * time.Second

	now := time.Now()
	var elapsed time.Duration
	if cachedAt.IsZero() {
		elapsed = refreshDuration // 无数据，视为已过刷新间隔
	} else {
		elapsed = now.Sub(cachedAt)
	}

	// 初始化计时器
	a.refreshMutex.Lock()
	if elapsed >= refreshDuration {
		// 超过刷新间隔或无数据，可以立即刷新，计时器从现在开始
		a.lastRefresh = time.Time{} // 零值，表示可以刷新
		a.refreshMutex.Unlock()

		runtime.LogPrintf(ctx, "缓存已过期或无数据，开始自动爬取...")
		go a.doRefresh(ctx)
	} else {
		// 未满刷新间隔，设置计时器为剩余时间
		// lastRefresh 设置为 (now - elapsed)，这样 time.Since(lastRefresh) = elapsed
		a.lastRefresh = now.Add(-elapsed)
		a.refreshMutex.Unlock()

		remaining := refreshDuration - elapsed
		runtime.LogPrintf(ctx, "缓存有效，距下次刷新还需 %.0f 分钟", remaining.Minutes())
	}
}

// doRefresh 执行实际的数据刷新
func (a *App) doRefresh(ctx context.Context) {
	// 刷新 Trending 数据
	a.refreshTrendingInternal()
	runtime.LogPrintf(ctx, "自动爬取 Trending 数据完成")

	// 刷新 UserStarRepo 数据（如果已登录）
	if a.appConfig.IsLoggedIn() {
		a.refreshUserStarRepoInternal()
		runtime.LogPrintf(ctx, "自动爬取用户星标数据完成")
	}

	// 更新计时器
	a.refreshMutex.Lock()
	a.lastRefresh = time.Now()
	a.refreshMutex.Unlock()
}
