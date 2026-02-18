package models

import (
	"time"
)

// User GitHub 用户信息
type User struct {
	ID          int64        `json:"id" toml:"id"`
	Login       string       `json:"login" toml:"login"`
	Name        string       `json:"name" toml:"name"`
	Email       string       `json:"email" toml:"email"`
	AvatarURL   string       `json:"avatar_url" toml:"avatar_url"`
	Bio         string       `json:"bio" toml:"bio"`
	Location    string       `json:"location" toml:"location"`
	Blog        string       `json:"blog" toml:"blog"`
	Company     string       `json:"company" toml:"company"`
	PublicRepos int          `json:"public_repos" toml:"public_repos"`
	Followers   int          `json:"followers" toml:"followers"`
	Following   int          `json:"following" toml:"following"`
	CreatedAt   JSONDateTime `json:"created_at" toml:"-"`
	UpdatedAt   JSONDateTime `json:"updated_at" toml:"-"`
}

// StoredToken 存储的 token 信息
type StoredToken struct {
	AccessToken  string `json:"access_token" toml:"access_token"`
	TokenType    string `json:"token_type" toml:"token_type"`
	Scope        string `json:"scope" toml:"scope"`
}

// AuthSession 认证会话（用于追踪 OAuth 流程，仅在内存中）
type AuthSession struct {
	State        string    `json:"state"`
	CodeVerifier string    `json:"code_verifier"`
	RedirectURL  string    `json:"redirect_url"`
	ExpiresAt    time.Time `json:"expires_at"`
}
