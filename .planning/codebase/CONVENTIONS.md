# Coding Conventions

**Analysis Date:** 2026-02-19

## Naming Patterns

**Files:**
- Go: `snake_case.go` (e.g., `app.go`, `database.go`, `oauth.go`)
- TypeScript/React: `PascalCase.ts` for components (e.g., `ProjectCard.tsx`), `camelCase.ts` for utilities (e.g., `useAuth.ts`)

**Functions:**
- Go exported: `PascalCase` (e.g., `NewApp`, `GetRepositoryByID`, `LoadTrendingData`)
- Go unexported: `camelCase` (e.g., `parseRepository`, `convertModelsToEntries`, `initOAuthConfig`)
- TypeScript: `camelCase` (e.g., `handleRefresh`, `loadInitialData`, `formatStars`)

**Variables:**
- Go: `camelCase` (e.g., `githubService`, `cacheMutex`, `lastRefresh`)
- TypeScript: `camelCase` (e.g., `weeklyRepos`, `loading`, `timeRange`)

**Types:**
- Go: `PascalCase` (e.g., `Repository`, `OAuthService`, `DeviceFlowInfo`)
- TypeScript interfaces: `PascalCase` (e.g., `Repository`, `GitHubUser`, `AuthState`)
- TypeScript type aliases: `PascalCase` for union types (e.g., `TimeRange`, `LoginMethod`)

**Constants:**
- Go: `PascalCase` or `camelCase` with descriptive names (e.g., `trendingURL`, `callbackPort`)
- TypeScript: `SCREAMING_SNAKE_CASE` for module constants (e.g., `languageColors` - actually camelCase in this codebase), `camelCase` for constants within components

## Code Style

**Formatting:**
- No ESLint/Prettier config detected
- No golangci-lint config detected
- Go uses standard gofmt conventions
- TypeScript uses 2-space indentation (inferred from code)
- Import statements follow specific organization (see below)

**Linting:**
- No automated linting configured
- Manual code review appears to be the convention

## Import Organization

**Go:**
```go
// Grouped into three sections with blank lines:
import (
    "fmt"
    "time"

    "github.com/wailsapp/wails/v2"
    "gorm.io/gorm"

    "github-star-app/backend/models"
)
```

**TypeScript/React:**
```typescript
// 1. React/Router imports
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 2. External libraries (Mantine, icons)
import { Button, Text } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';

// 3. Wails bindings (Go backend methods)
import { LoadTrendingData } from '../../wailsjs/go/backend/App';

// 4. Internal modules
import { Repository } from '../types';
import { ProjectCard } from './ProjectCard';

// 5. CSS/Styles
import classes from './Component.module.css';
import './styles.css';
```

**Path Aliases:**
- No TypeScript path aliases configured
- Uses relative imports: `'../types'`, `'../../wailsjs/go/backend/App'`

## Error Handling

**Go Patterns:**
- Always check errors: `if err != nil { return nil, fmt.Errorf("description: %w", err) }`
- Wrap errors with context using `fmt.Errorf` with `%w` verb for error chain preservation
- Use structured logging: `logger.Error("[ServiceName] description: %v", err)`
- Return custom error types or nil for success where appropriate
- Handle database errors explicitly: check `gorm.ErrRecordNotFound` when querying
- Example from `backend/app.go`:
```go
func (a *App) GetRepositoryByID(owner, repo string) (*models.Repository, error) {
    return a.githubService.GetRepositoryByID(owner, repo)
}

func (a *App) LoadTrendingData() (*LoadTrendingDataResponse, error) {
    if a.db == nil {
        return nil, fmt.Errorf("数据库未初始化")
    }
    // ... processing
}
```

**TypeScript/React Patterns:**
- Use try-catch for async operations
- Log errors with context: `console.error('Action failed:', err)`
- Display user-friendly error messages in UI
- Type guard for error checking: `err instanceof Error ? err.message : 'Unknown error'`
- Example from `frontend/src/App.tsx`:
```typescript
try {
    const result = await LoadTrendingData();
    // ... process result
} catch (err) {
    console.error('加载数据失败:', err);
    setError(err instanceof Error ? err.message : '加载数据失败');
}
```

**HTTP Error Handling (Go):**
- Check status codes explicitly: `if resp.StatusCode != http.StatusOK { return fmt.Errorf(...) }`
- Include response body in error messages for debugging: `fmt.Errorf("GitHub 返回错误: %d, %s", resp.StatusCode, string(body))`
- Use context timeouts for HTTP clients: `Timeout: 30 * time.Second`

## Logging

**Framework:** Custom logger in `backend/logger/logger.go`

**Patterns:**
- Log levels: `Info`, `Error`, `Warn`, `Debug`
- Format with service/component prefix: `logger.Info("[ServiceName] description: %v", args)`
- Example: `logger.Info("[OAuth] Authorization URL generated, state=%s", state)`
- Timestamps included automatically: `2006-01-02 15:04:05`
- Logs written to `app.log` file and console simultaneously
- Wails runtime logging also used: `runtime.LogPrintf(ctx, "message: %v", arg)`

**Frontend:**
- Use `console.error`, `console.log` for debugging
- Include context in log messages: `console.error('[useAuth] Device Flow 登录失败:', errorMsg)`
- No structured logging framework in frontend

## Comments

**When to Comment:**
- Package-level documentation
- Complex algorithm explanations (e.g., PKCE flow in oauth.go)
- Public API documentation
- Chinese comments used extensively in Go code for descriptions

**JSDoc/TSDoc:**
- Not extensively used in TypeScript
- Interface properties have inline comments for clarification
- Example from `frontend/src/types/index.ts`:
```typescript
export interface Repository {
  id: number;
  full_name: string;
  stars_today?: number;      // 今日新增星标数
  stars_since?: number;      // 时间范围内新增星标数
}
```

**Go Comments:**
- Exported functions have comments: `// GetRepositoryByID 根据 owner/repo 获取仓库详情`
- Struct comments: `// App 应用结构`, `// OAuthService OAuth 认证服务`
- Section separators: `// ========== 认证相关方法 ==========`

## Function Design

**Size:**
- Go functions typically 20-100 lines
- Large functions broken down into helper methods (e.g., `parseRepository`, `convertModelsToEntries`)
- TypeScript component functions follow React patterns

**Parameters:**
- Go: Typically 1-3 parameters for exported functions
- Go: Context passed as first parameter when needed: `func (a *App) Startup(ctx context.Context)`
- TypeScript: Props interfaces defined for component parameters
- TypeScript: Event handlers take `React.MouseEvent` or similar

**Return Values:**
- Go: `(result, error)` tuple pattern
- Go: Single return for no-error functions: `func (a *App) IsLoggedIn() bool`
- TypeScript: Async functions return Promise types
- TypeScript: Use proper typing for all return values

## Module Design

**Exports:**
- Go: Exported functions/methods start with uppercase, unexported with lowercase
- TypeScript: Named exports preferred: `export function ComponentName() {}`
- TypeScript: Type exports: `export interface Repository`, `export type TimeRange`

**Barrel Files:**
- `frontend/src/types/index.ts` exports all types
- No barrel files detected in Go (packages imported directly)
- Wails generates bindings in `frontend/wailsjs/go/backend/App.ts`

## Concurrency Patterns (Go)

**Mutex Usage:**
- Use `sync.RWMutex` for read-heavy data: `cacheMutex sync.RWMutex`
- Use `sync.Mutex` for exclusive access: `refreshMutex sync.Mutex`
- Pattern: `defer mutex.Unlock()` immediately after `mutex.Lock()`

**Example from `backend/app.go`:**
```go
type App struct {
    cache      []models.Repository
    cacheMutex sync.RWMutex
}

func (a *App) getCache() []models.Repository {
    a.cacheMutex.RLock()
    defer a.cacheMutex.RUnlock()
    return a.cache
}
```

**Goroutines:**
- Used for background tasks: `go a.doRefresh(ctx)`
- Channels for communication (though limited use in current codebase)
- Context for cancellation support

## Go-Specific Conventions

**Struct Tags:**
- JSON: `` `json:"field_name"` ``
- GORM: `` `gorm:"column:field_name;primaryKey"` ``
- Combined: `` `json:"id" gorm:"column:id;primaryKey;autoIncrement"` ``

**Time Handling:**
- Use `time.Time` for database storage
- Use custom `JSONDateTime` wrapper for Wails JSON compatibility (see `backend/models/repository.go`)
- Format constants: `"2006-01-02 15:04:05"`, `"2006-01-02T15:04:05Z"`

**Database Operations:**
- Use GORM ORM
- Transactions for multi-step operations: `db.Transaction(func(tx *gorm.DB) error {})`
- Explicit error checking: `gorm.ErrRecordNotFound`
- Connection pooling configured: `SetMaxIdleConns(10)`, `SetMaxOpenConns(100)`

## TypeScript/React-Specific Conventions

**Component Structure:**
- Functional components with hooks
- Props interfaces defined at top of file
- Event handlers defined before render
- Early returns for loading/error states

**State Management:**
- Local state with `useState`
- Derived state from existing state (no useMemo extensively used)
- Custom hooks for reusable logic (e.g., `useAuth`)
- useCallback for event handlers to prevent re-renders

**Styling:**
- Mantine UI components for base styling
- CSS Modules for component-specific styles: `import classes from './Component.module.css'`
- Inline styles for dynamic values: `style={{ opacity: isOpen ? 1 : 0 }}`
- CSS custom properties for theming: `var(--color-bg-primary)`
- No global CSS imports beyond `@mantine/core/styles.css`

**Wails Integration:**
- Import bindings from `wailsjs/go/backend/App`
- Go methods called as async functions in React
- Use `runtime.BrowserOpenURL` for external links
- Use `runtime.EventsEmit` for backend-to-frontend events
- Event listeners in `useEffect` with cleanup:

```typescript
useEffect(() => {
    const handleEvent = (data) => { /* ... */ };
    EventsOn('event-name', handleEvent);
    return () => { EventsOff('event-name', handleEvent); };
}, []);
```

## Constants and Configuration

**Go:**
- Constants declared at package level with descriptive names
- Configuration loaded from TOML files: `shared/app-config.toml`
- Environment: No `.env` file pattern detected (uses TOML config instead)

**TypeScript:**
- Constants in component files: `const timeRangeOptions = [...]`
- Color maps: `const languageColors: Record<string, string> = { ... }`
- Theme configuration: `createTheme({ ... })` with custom color palettes

---

*Convention analysis: 2026-02-19*
