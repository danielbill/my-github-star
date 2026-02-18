package database

import (
	"time"

	"gorm.io/gorm"
)

// TrendingEntry 趋势仓库数据库模型
// 简化版，只包含必要字段
type TrendingEntry struct {
	ID               int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	GithubID         int64     `gorm:"column:github_id;not null;index" json:"github_id"`
	FullName         string    `gorm:"column:full_name;not null;index:idx_full_name" json:"full_name"`
	Name             string    `gorm:"column:name;not null" json:"name"`
	Owner            string    `gorm:"column:owner;not null" json:"owner"`
	Description      string    `gorm:"column:description" json:"description"`
	StargazersCount  int       `gorm:"column:stargazers_count" json:"stargazers_count"`
	StarsSince       int       `gorm:"column:stars_since" json:"stars_since"`
	HTMLURL          string    `gorm:"column:html_url" json:"html_url"`
	CachedAt         time.Time `gorm:"column:cached_at;not null;index:idx_cached_at" json:"cached_at"`
	TimeRange        string    `gorm:"column:time_range;not null;index:idx_time_range" json:"time_range"`
}

// TableName 指定表名
func (TrendingEntry) TableName() string {
	return "github_trending"
}

// BeforeCreate GORM 钩子
func (t *TrendingEntry) BeforeCreate(tx *gorm.DB) error {
	return nil
}

// UserStarRepo 用户星标仓库数据库模型
type UserStarRepo struct {
	ID               int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	GithubID         int64     `gorm:"column:github_id;not null;index" json:"github_id"`
	FullName         string    `gorm:"column:full_name;not null;index:idx_full_name" json:"full_name"`
	Name             string    `gorm:"column:name;not null" json:"name"`
	Owner            string    `gorm:"column:owner;not null" json:"owner"`
	Description      string    `gorm:"column:description" json:"description"`
	StargazersCount  int       `gorm:"column:stargazers_count" json:"stargazers_count"`
	StarsSince       int       `gorm:"column:stars_since" json:"stars_since"`
	HTMLURL          string    `gorm:"column:html_url" json:"html_url"`
	CachedAt         time.Time `gorm:"column:cached_at;not null;index:idx_cached_at" json:"cached_at"`
	TimeRange        string    `gorm:"column:time_range;not null;index:idx_time_range" json:"time_range"`
}

// TableName 指定表名
func (UserStarRepo) TableName() string {
	return "user_star_repo"
}

// BeforeCreate GORM 钩子
func (u *UserStarRepo) BeforeCreate(tx *gorm.DB) error {
	return nil
}
