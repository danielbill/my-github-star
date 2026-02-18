package backend

import (
	"context"
	"fmt"
	"sync"

	"github-star-app/backend/github"
	"github-star-app/backend/models"
)

// App 应用结构
type App struct {
	ctx           context.Context
	githubService *github.Service
	cache         []models.Repository
	cacheMutex    sync.RWMutex
}

// NewApp 创建新的应用实例
func NewApp() *App {
	// 创建 GitHub 服务（可以传入 GitHub token 以提高 API 限制）
	githubService := github.NewService("") // 留空则不使用 token

	return &App{
		githubService: githubService,
		cache:         make([]models.Repository, 0),
	}
}

// Startup 应用启动时调用
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
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
