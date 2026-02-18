package models

import (
	"fmt"
	"strings"
	"time"
)

// JSONDateTime 兼容 Wails 的 JSON 时间类型
type JSONDateTime struct {
	time.Time
}

// UnmarshalJSON 实现 JSON 解析
func (j *JSONDateTime) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), "\"")
	if s == "null" || s == "" {
		j.Time = time.Time{}
		return nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return err
	}
	j.Time = t
	return nil
}

// MarshalJSON 实现 JSON 序列化
func (j JSONDateTime) MarshalJSON() ([]byte, error) {
	return []byte(fmt.Sprintf("\"%s\"", j.Time.Format(time.RFC3339))), nil
}

// String 返回字符串表示
func (j JSONDateTime) String() string {
	return j.Time.Format("2006-01-02T15:04:05Z")
}

// Repository 表示一个 GitHub 仓库
type Repository struct {
	ID               int64        `json:"id"`
	Name             string       `json:"name"`
	FullName         string       `json:"full_name"`
	Owner            string       `json:"owner"`
	Description      string       `json:"description"`
	Language         string       `json:"language"`
	StargazersCount  int          `json:"stargazers_count"`
	StarsToday       int          `json:"stars_today"`        // 今日新增星标数
	StarsSince       int          `json:"stars_since"`        // 时间范围内新增星标数
	ForksCount       int          `json:"forks_count"`        // Fork 数量
	HTMLURL          string       `json:"html_url"`
	CreatedAt        JSONDateTime `json:"created_at"`
	UpdatedAt        JSONDateTime `json:"updated_at"`
}

// TrendingParams 获取趋势仓库的参数
type TrendingParams struct {
	Language string // 编程语言过滤，如 "go", "python"，空字符串表示全部
	Since    string // 时间范围: "daily", "weekly", "monthly"
}

// TrendingResponse 趋势仓库响应
type TrendingResponse struct {
	Repositories []Repository `json:"repositories"`
	Timestamp    JSONDateTime `json:"timestamp"`
}
