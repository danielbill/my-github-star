package github

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github-star-app/backend/models"
)

const (
	trendingURL = "https://github.com/trending"
	apiBaseURL = "https://api.github.com"
)

// Service GitHub 服务
type Service struct {
	client    *http.Client
	token     string // 可选的 GitHub API token
}

// NewService 创建新的 GitHub 服务
func NewService(token string) *Service {
	return &Service{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		token: token,
	}
}

// GetTrendingRepositories 获取趋势仓库
// 由于 GitHub Trending 没有官方 API，我们使用 GitHub Search API 作为替代
func (s *Service) GetTrendingRepositories(language, since string) ([]models.Repository, error) {
	// 使用 GitHub Search API 按星标数排序
	query := s.buildSearchQuery(language, since)
	url := fmt.Sprintf("%s/search/repositories?q=%s&sort=stars&order=desc&per_page=30", apiBaseURL, query)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	// 添加认证头（如果有 token）
	if s.token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.token))
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API 返回错误状态 %d: %s", resp.StatusCode, string(body))
	}

	// 解析响应
	var searchResponse struct {
		Items []struct {
			ID              int64     `json:"id"`
			Name            string    `json:"name"`
			FullName        string    `json:"full_name"`
			Owner           struct {
				Login string `json:"login"`
			} `json:"owner"`
			Description     string    `json:"description"`
			Language        string    `json:"language"`
			StargazersCount int       `json:"stargazers_count"`
			HTMLURL         string    `json:"html_url"`
			CreatedAt       time.Time `json:"created_at"`
			UpdatedAt       time.Time `json:"updated_at"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&searchResponse); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	// 转换为我们的 Repository 模型
	repos := make([]models.Repository, 0, len(searchResponse.Items))
	for _, item := range searchResponse.Items {
		repo := models.Repository{
			ID:              item.ID,
			Name:            item.Name,
			FullName:        item.FullName,
			Owner:           item.Owner.Login,
			Description:     s.cleanDescription(item.Description),
			Language:        item.Language,
			StargazersCount: item.StargazersCount,
			HTMLURL:         item.HTMLURL,
			CreatedAt:       models.JSONDateTime{Time: item.CreatedAt},
			UpdatedAt:       models.JSONDateTime{Time: item.UpdatedAt},
		}
		repos = append(repos, repo)
	}

	return repos, nil
}

// buildSearchQuery 构建搜索查询
func (s *Service) buildSearchQuery(language, since string) string {
	query := "stars:>100"

	// 添加语言过滤
	if language != "" && language != "all" {
		query += fmt.Sprintf(" language:%s", language)
	}

	// 添加时间过滤
	var dateThreshold string
	now := time.Now()

	switch since {
	case "daily":
		dateThreshold = now.AddDate(0, 0, -1).Format("2006-01-02")
	case "weekly":
		dateThreshold = now.AddDate(0, 0, -7).Format("2006-01-02")
	case "monthly":
		dateThreshold = now.AddDate(0, -1, 0).Format("2006-01-02")
	default:
		dateThreshold = now.AddDate(0, 0, -7).Format("2006-01-02") // 默认一周
	}

	query += fmt.Sprintf(" pushed:>=%s", dateThreshold)

	return strings.TrimSpace(query)
}

// cleanDescription 清理描述文本
func (s *Service) cleanDescription(desc string) string {
	if desc == "" {
		return "暂无描述"
	}
	// 限制描述长度
	if len(desc) > 200 {
		return desc[:200] + "..."
	}
	return desc
}

// GetRepositoryByID 根据 ID 获取仓库详情
func (s *Service) GetRepositoryByID(owner, repo string) (*models.Repository, error) {
	url := fmt.Sprintf("%s/repos/%s/%s", apiBaseURL, owner, repo)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	if s.token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", s.token))
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API 返回错误状态 %d: %s", resp.StatusCode, string(body))
	}

	var repoData struct {
		ID              int64     `json:"id"`
		Name            string    `json:"name"`
		FullName        string    `json:"full_name"`
		Owner           struct {
			Login string `json:"login"`
		} `json:"owner"`
		Description     string    `json:"description"`
		Language        string    `json:"language"`
		StargazersCount int       `json:"stargazers_count"`
		HTMLURL         string    `json:"html_url"`
		CreatedAt       time.Time `json:"created_at"`
		UpdatedAt       time.Time `json:"updated_at"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&repoData); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	return &models.Repository{
		ID:              repoData.ID,
		Name:            repoData.Name,
		FullName:        repoData.FullName,
		Owner:           repoData.Owner.Login,
		Description:     s.cleanDescription(repoData.Description),
		Language:        repoData.Language,
		StargazersCount: repoData.StargazersCount,
		HTMLURL:         repoData.HTMLURL,
		CreatedAt:       models.JSONDateTime{Time: repoData.CreatedAt},
		UpdatedAt:       models.JSONDateTime{Time: repoData.UpdatedAt},
	}, nil
}
