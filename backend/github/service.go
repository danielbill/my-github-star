package github

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github-star-app/backend/models"
)

const (
	trendingURL = "https://github.com/trending"
)

// Service GitHub 服务
type Service struct {
	client *http.Client
	token  string // 可选的 GitHub API token（保留用于未来可能的 API 调用）
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
// 通过爬取 GitHub Trending 页面获取真实数据
func (s *Service) GetTrendingRepositories(language, since string) ([]models.Repository, error) {
	// 默认使用 weekly
	if since == "" {
		since = "weekly"
	}

	url := s.buildTrendingURL(language, since)

	// 创建 HTTP 请求（添加 User-Agent 避免被拒绝）
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub 返回错误状态: %d", resp.StatusCode)
	}

	// 解析 HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("解析 HTML 失败: %w", err)
	}

	var repos []models.Repository
	var parseErrors []string

	// 遍历每个仓库条目: article.Box-row
	doc.Find("article.Box-row").Each(func(i int, selection *goquery.Selection) {
		repo, err := s.parseRepository(selection)
		if err != nil {
			parseErrors = append(parseErrors, err.Error())
			return
		}
		// 设置默认时间戳
		repo.CreatedAt = models.JSONDateTime{Time: time.Now()}
		repo.UpdatedAt = models.JSONDateTime{Time: time.Now()}
		repos = append(repos, repo)
	})

	if len(repos) == 0 {
		if len(parseErrors) > 0 {
			return nil, fmt.Errorf("解析失败: %s", strings.Join(parseErrors, "; "))
		}
		return nil, fmt.Errorf("未找到仓库数据，GitHub 页面结构可能已变化")
	}

	return repos, nil
}

// buildTrendingURL 构建 Trending URL
func (s *Service) buildTrendingURL(language, since string) string {
	var url strings.Builder
	url.WriteString(trendingURL)

	// 添加语言过滤: /trending/go
	if language != "" && language != "all" {
		url.WriteString("/")
		url.WriteString(language)
	}

	// 添加时间范围: ?since=weekly
	url.WriteString("?since=")
	url.WriteString(since)

	return url.String()
}

// parseRepository 解析单个仓库元素
func (s *Service) parseRepository(selection *goquery.Selection) (models.Repository, error) {
	repo := models.Repository{}
	var errs []string

	// 仓库名和 owner: h2 > a[href="/owner/repo"]
	selection.Find("h2 a").Each(func(i int, a *goquery.Selection) {
		href, exists := a.Attr("href")
		if !exists {
			return
		}
		href = strings.TrimSpace(href)
		parts := strings.Split(strings.Trim(href, "/"), "/")
		if len(parts) >= 2 {
			repo.Owner = parts[0]
			repo.Name = parts[1]
			repo.FullName = fmt.Sprintf("%s/%s", parts[0], parts[1])
			repo.HTMLURL = fmt.Sprintf("https://github.com%s", href)
		}
	})

	if repo.Owner == "" {
		errs = append(errs, "未找到仓库所有者")
	}

	// 描述: p.col-9
	if desc := selection.Find("p.col-9").First(); desc.Length() > 0 {
		repo.Description = s.cleanDescription(desc.Text())
	} else {
		// 尝试其他可能的描述选择器
		if desc := selection.Find("div.f4.my-1").First(); desc.Length() > 0 {
			repo.Description = s.cleanDescription(desc.Text())
		}
	}

	// 编程语言: span[itemprop="programmingLanguage"]
	if lang := selection.Find(`span[itemprop="programmingLanguage"]`).First(); lang.Length() > 0 {
		repo.Language = strings.TrimSpace(lang.Text())
	}

	// 解析所有包含数字的链接（星标、fork等）
	selection.Find("a[href]").Each(func(i int, a *goquery.Selection) {
		href, _ := a.Attr("href")
		text := strings.TrimSpace(a.Text())

		if strings.Contains(href, "/stargazers") {
			// 总星标数
			repo.StargazersCount = parseNumber(text)
		} else if strings.Contains(href, "/forks") {
			// Fork 数（如果有的话）
			// 有些页面可能没有单独的 fork 链接
		}
	})

	// 从文本中解析 fork 数和星标增长数
	// 查找所有包含数字的 span
	selection.Find("span.d-inline-block").Each(func(i int, span *goquery.Selection) {
		text := strings.TrimSpace(span.Text())

		// 检查是否包含 fork 相关信息
		if strings.Contains(strings.ToLower(text), "fork") ||
		   span.HasClass("color-fg-muted") && strings.Contains(text, "k") {
			// 这可能是 fork 数或其他统计
			num := parseNumber(text)
			if num > 0 && repo.ForksCount == 0 {
				// 如果还没有设置过 fork 数，且这个数字看起来合理
				repo.ForksCount = num
			}
		}
	})

	// 更精确的 fork 解析：查找包含 "forks" 的元素
	selection.Find("a[href*='/forks'], a[href*='/network/members']").Each(func(i int, a *goquery.Selection) {
		text := strings.TrimSpace(a.Text())
		if num := parseNumber(text); num > 0 {
			repo.ForksCount = num
		}
	})

	// 解析星标增长数
	// 查找包含 "stars today/week/month" 的元素
	s.parseStarsGrowth(selection, &repo)

	// 如果没有找到 fork 数，尝试其他方式
	if repo.ForksCount == 0 {
		// 有些页面 fork 显示在 span 中
		selection.Find("span").Each(func(i int, span *goquery.Selection) {
			text := strings.TrimSpace(span.Text())
			// 检查是否包含 fork 数字（通常在星标数之后）
			if strings.Contains(strings.ToLower(text), "fork") {
				num := parseNumber(text)
				if num > 100 { // fork 数通常比较大，避免误判
					repo.ForksCount = num
				}
			}
		})
	}

	if len(errs) > 0 {
		return repo, fmt.Errorf("解析错误: %s", strings.Join(errs, ", "))
	}

	return repo, nil
}

// parseStarsGrowth 解析星标增长数
func (s *Service) parseStarsGrowth(selection *goquery.Selection, repo *models.Repository) {
	// 查找包含星标增长信息的 span
	// 格式通常是: "1,234 stars today", "5,678 stars this week", "12,345 stars this month"

	// 遍历所有 span，查找包含 "stars" 和时间关键词的文本
	selection.Find("span").Each(func(i int, span *goquery.Selection) {
		text := strings.ToLower(strings.TrimSpace(span.Text()))

		// 检查是否包含星标增长信息
		if strings.Contains(text, "stars") {
			if strings.Contains(text, "today") || strings.Contains(text, "日") {
				// 今日新增星标
				parts := strings.Split(text, "stars")
				if len(parts) > 0 {
					repo.StarsToday = parseNumber(parts[0])
				}
			} else if strings.Contains(text, "week") || strings.Contains(text, "周") {
				// 本周新增星标
				parts := strings.Split(text, "stars")
				if len(parts) > 0 {
					repo.StarsSince = parseNumber(parts[0])
				}
			} else if strings.Contains(text, "month") || strings.Contains(text, "月") {
				// 本月新增星标
				parts := strings.Split(text, "stars")
				if len(parts) > 0 {
					repo.StarsSince = parseNumber(parts[0])
				}
			}
		}
	})

	// 如果是 weekly 模式且没有找到 StarsSince，尝试使用其他模式
	if repo.StarsSince == 0 {
		selection.Find("div.f6").Each(func(i int, div *goquery.Selection) {
			text := div.Text()
			// 使用正则表达式匹配数字 + stars + 时间
			re := regexp.MustCompile(`([\d,]+)\s*stars?\s*(today|this week|this month)`)
			matches := re.FindStringSubmatch(text)
			if len(matches) >= 3 {
				repo.StarsSince = parseNumber(matches[1])
			}
		})
	}
}

// parseNumber 解析带逗号的数字: "1,234 stars" -> 1234
func parseNumber(s string) int {
	// 移除逗号
	s = strings.ReplaceAll(s, ",", "")
	// 提取数字部分
	re := regexp.MustCompile(`\d+`)
	match := re.FindString(s)
	if match == "" {
		return 0
	}
	num, err := strconv.Atoi(match)
	if err != nil {
		return 0
	}
	return num
}

// cleanDescription 清理描述文本
func (s *Service) cleanDescription(desc string) string {
	desc = strings.TrimSpace(desc)
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
// 保留此方法以兼容现有代码，但可能需要使用爬虫方式
func (s *Service) GetRepositoryByID(owner, repo string) (*models.Repository, error) {
	// 构建仓库 URL
	url := fmt.Sprintf("https://github.com/%s/%s", owner, repo)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "text/html")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub 返回错误状态: %d", resp.StatusCode)
	}

	// 解析 HTML 获取仓库详情
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("解析 HTML 失败: %w", err)
	}

	result := &models.Repository{
		Owner:       owner,
		Name:        repo,
		FullName:    fmt.Sprintf("%s/%s", owner, repo),
		HTMLURL:     url,
		CreatedAt:   models.JSONDateTime{Time: time.Now()},
		UpdatedAt:   models.JSONDateTime{Time: time.Now()},
	}

	// 获取描述
	if desc := doc.Find("div.f4.my-1").First(); desc.Length() > 0 {
		result.Description = s.cleanDescription(desc.Text())
	}

	// 获取语言
	if lang := doc.Find(`span[itemprop="programmingLanguage"]`).First(); lang.Length() > 0 {
		result.Language = strings.TrimSpace(lang.Text())
	}

	// 获取星标数
	doc.Find(`a[href*="/stargazers"]`).Each(func(i int, a *goquery.Selection) {
		text := strings.TrimSpace(a.Text())
		result.StargazersCount = parseNumber(text)
	})

	// 获取 fork 数
	doc.Find(`a[href*="/forks"]`).Each(func(i int, a *goquery.Selection) {
		text := strings.TrimSpace(a.Text())
		result.ForksCount = parseNumber(text)
	})

	return result, nil
}
