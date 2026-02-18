package storage

import (
	"fmt"
	"sync"

	"github-star-app/backend/models"
)

// MemorySessionStore 内存会话存储
type MemorySessionStore struct {
	sessions map[string]*models.AuthSession
	mu       sync.RWMutex
}

// NewMemorySessionStore 创建内存会话存储
func NewMemorySessionStore() *MemorySessionStore {
	return &MemorySessionStore{
		sessions: make(map[string]*models.AuthSession),
	}
}

// SaveSession 保存会话
func (s *MemorySessionStore) SaveSession(session *models.AuthSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[session.State] = session
	return nil
}

// LoadSession 加载会话
func (s *MemorySessionStore) LoadSession(state string) (*models.AuthSession, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	session, exists := s.sessions[state]
	if !exists {
		return nil, fmt.Errorf("session not found")
	}
	return session, nil
}

// DeleteSession 删除会话
func (s *MemorySessionStore) DeleteSession(state string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, state)
	return nil
}
