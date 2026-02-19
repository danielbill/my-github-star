# Architecture

**Analysis Date:** 2026-02-19

## Pattern Overview

**Overall:** Desktop Application with Embedded Frontend (Wails v2)

**Key Characteristics:**
- Wails v2 framework bridges Go backend and React frontend
- Backend exposes Go methods as TypeScript bindings via code generation
- Frontend is embedded as static assets into the binary
- Desktop app with native window (no separate server)
- SQLite database with ORM (GORM)
- GitHub API integration with web scraping fallback
- OAuth authentication with two methods (Authorization Code Flow and Device Flow)

## Layers

**Application Layer (Go):**
- Purpose: Core business logic and orchestration
- Location: `backend/app.go`
- Contains: Wails App struct, exported methods bound to frontend
- Depends on: All backend packages (github, auth, database, config, logger, storage)
- Used by: Frontend via auto-generated Wails bindings (`frontend/wailsjs/go/backend/App`)

**Service Layer:**
- Purpose: External service integrations
- Location: `backend/github/`, `backend/auth/`
- Contains: GitHub API client, OAuth flows, Device Flow authentication
- Depends on: `models`, `config`, `storage`, `logger`, third-party libraries (goquery, oauth2)
- Used by: Application layer

**Data Layer:**
- Purpose: Data persistence and caching
- Location: `backend/database/`
- Contains: GORM models, database operations, SQLite connection management
- Depends on: GORM, modernc.org/sqlite
- Used by: Application layer

**Models Layer:**
- Purpose: Domain models and type definitions
- Location: `backend/models/`
- Contains: Repository, User, AuthSession structs with JSON serialization
- Depends on: Standard library (time, fmt)
- Used by: All layers (Service, Data, Application)

**Configuration Layer:**
- Purpose: Application configuration and state persistence
- Location: `backend/config/`
- Contains: TOML config loading, OAuth credentials storage, user preferences
- Depends on: TOML library
- Used by: Application layer, Service layer

**Storage Layer:**
- Purpose: In-memory session storage for OAuth
- Location: `backend/storage/`
- Contains: MemorySessionStore for OAuth state management
- Depends on: `models`
- Used by: Auth service

**Logging Layer:**
- Purpose: Application logging and log retrieval
- Location: `backend/logger/`
- Contains: File-based logger with concurrent access protection
- Depends on: Standard library
- Used by: All layers

**Frontend Layer (React):**
- Purpose: User interface and interaction
- Location: `frontend/src/`
- Contains: React components, custom hooks, types, Wails bindings
- Depends on: React, React Router, Mantine UI, Tabler Icons, Wails bindings
- Used by: Desktop window (via embedded assets)

## Data Flow

**GitHub Trending Data Flow:**

1. User clicks refresh button in frontend (`MainLayout.tsx`)
2. React calls `RefreshTrending()` Wails binding (`App.tsx`)
3. Go `App.RefreshTrending()` checks rate limit timer
4. Calls `github.Service.GetTrendingRepositories()` for weekly and monthly
5. Service scrapes GitHub trending page using goquery
6. Parsed repositories converted to database models via `convertModelsToEntries()`
7. `database.DB.SaveTrendingEntries()` saves to SQLite (transaction: delete old, insert new)
8. `LoadTrendingDataResponse` constructed with cached data
9. Response serialized to JSON, sent to frontend
10. React state updates, triggers re-render with new data

**OAuth Device Flow Authentication:**

1. User clicks GitHub login icon in frontend header
2. React calls `loginWithDeviceFlow()` hook (`useAuth`)
3. Hook calls `StartDeviceFlowLogin()` Wails binding
4. Go `App.StartDeviceFlowLogin()` calls `auth.DeviceFlowService.StartLogin()`
5. Service requests device code from GitHub Device Authorization endpoint
6. Returns `DeviceFlowInfo` (user_code, verification_uri, etc.)
7. React opens modal displaying user code
8. User enters code on GitHub.com (opened via `OpenVerificationURL()`)
9. Frontend polls or waits for GitHub callback (background polling in Go)
10. Service exchanges device code for access token
11. User info fetched from GitHub API
12. `config.Config.SetAuth()` stores credentials in TOML
13. Wails event `login-success` emitted to frontend
14. React receives event, updates auth state

**User Starred Repositories Flow:**

1. User logged in, sidebar displays starred repos
2. React `StarredSidebar` component loads data via `LoadUserStarRepo()` binding
3. Go `App.LoadUserStarRepo()` queries database via `db.GetUserStarRepos()`
4. Database returns repos ordered by `stars_since` DESC
5. Converted to `models.Repository` and returned to frontend
6. Displayed in sidebar with stars growth badges

**State Management:**
- Go backend: In-memory state (App struct), SQLite database, TOML config, MemorySessionStore
- React frontend: `useState` for local component state, `useContext` for auth state
- Sync via: Wails method calls (frontend → backend) and Wails events (backend → frontend)

## Key Abstractions

**App Struct:**
- Purpose: Central orchestrator for all backend operations
- Examples: `backend/app.go` (663 lines)
- Pattern: Singleton instance created at startup, exported methods bound to Wails

**JSONDateTime:**
- Purpose: Wails-compatible time serialization
- Examples: `backend/models/repository.go` (lines 9-37)
- Pattern: Wrapper around `time.Time` with custom JSON marshal/unmarshal

**Wails Bindings:**
- Purpose: Type-safe frontend-backend communication
- Examples: `frontend/wailsjs/go/backend/App` (auto-generated)
- Pattern: Go exported methods → TypeScript functions with proper typing

**GORM Models:**
- Purpose: Database schema definition
- Examples: `TrendingEntry`, `UserStarRepo` in `backend/database/models.go`
- Pattern: Struct with GORM tags for column names and indexes

**Config Singleton:**
- Purpose: Thread-safe configuration management
- Examples: `backend/config/app_config.go` (lines 60-71)
- Pattern: `sync.Once` ensures single instance, `sync.RWMutex` for concurrent access

## Entry Points

**main.go (Go Entry Point):**
- Location: `main.go` (38 lines)
- Triggers: Application launch
- Responsibilities: Initialize Wails app, bind `backend.App` instance, configure window, embed frontend assets via `//go:embed all:frontend/dist`

**App.Startup (Backend Lifecycle):**
- Location: `backend/app.go` (lines 71-146)
- Triggers: Called by Wails during app initialization
- Responsibilities: Load config from shared directory, initialize SQLite database, check auth status, auto-load initial data

**main.tsx (Frontend Entry Point):**
- Location: `frontend/src/main.tsx` (15 lines)
- Triggers: Frontend render
- Responsibilities: Mount React app to DOM root, enable StrictMode

**App Component (React Root):**
- Location: `frontend/src/App.tsx` (174 lines)
- Triggers: React render
- Responsibilities: Setup Mantine theme, configure routing, load initial trending data, manage global state

## Error Handling

**Strategy:** Wrap errors with context, check explicitly, log with structured messages

**Patterns:**
- Go: `if err != nil { return nil, fmt.Errorf("action failed: %w", err) }`
- Go: `gorm.ErrRecordNotFound` explicitly checked for database queries
- Go: Structured logging via `logger.Error("[ServiceName] description: %v", err)`
- React: `try-catch` around async operations
- React: Type guards: `err instanceof Error ? err.message : 'Unknown error'`
- React: User-friendly error messages displayed in UI alerts

## Cross-Cutting Concerns

**Logging:** File-based logger at `backend/logger/logger.go` with `Info`, `Error`, `Warn`, `Debug` methods, mutex-protected concurrent writes

**Validation:** Input validation in Go services (e.g., check ClientID before OAuth), type safety from TypeScript interfaces

**Authentication:** Two methods managed by `auth.OAuthService` (Authorization Code Flow) and `auth.DeviceFlowService` (Device Flow), stored in TOML config, PKCE for security

**Concurrency:** `sync.RWMutex` in App struct for cache protection, `sync.Mutex` for refresh timer, goroutines for background polling

**Configuration:** TOML-based config in `shared/app-config.toml`, singleton pattern, automatic creation with defaults

---

*Architecture analysis: 2026-02-19*
