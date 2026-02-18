package models

import "context"

// TokenStore token 存储接口
type TokenStore interface {
	SaveToken(ctx context.Context, user *User, token *StoredToken) error
	LoadToken(ctx context.Context) (*User, *StoredToken, error)
	DeleteToken(ctx context.Context) error
	IsLoggedIn(ctx context.Context) bool
}

// AuthSessionStore 认证会话存储接口（内存存储）
type AuthSessionStore interface {
	SaveSession(session *AuthSession) error
	LoadSession(state string) (*AuthSession, error)
	DeleteSession(state string) error
}
