# Codebase Structure

**Analysis Date:** 2026-02-19

## Directory Layout

```
[project-root]/
├── backend/                 # Go backend code
│   ├── app.go              # Main App struct (Wails bindings)
│   ├── auth/               # OAuth and Device Flow authentication
│   ├── config/             # Configuration management (TOML)
│   ├── database/           # SQLite database operations (GORM)
│   ├── github/             # GitHub API and web scraping
│   ├── logger/             # File-based logging system
│   ├── models/             # Domain models and types
│   └── storage/            # In-memory session storage
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   ├── App.tsx         # Root React component
│   │   └── main.tsx        # Frontend entry point
│   ├── wailsjs/            # Auto-generated Wails bindings
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build config
├── shared/                 # Runtime data directory
│   ├── trending.db         # SQLite database
│   └── app-config.toml     # Application configuration
├── tests/                  # Integration tests
├── docs/                   # Documentation and plans
├── .planning/              # Planning and codebase analysis
├── build/                  # Build artifacts
├── main.go                 # Go entry point (Wails app setup)
├── wails.json              # Wails project configuration
└── go.mod                  # Go module definition
```

## Directory Purposes

**backend:**
- Purpose: Go backend containing all business logic, services, and Wails bindings
- Contains: Application orchestration, external integrations, data persistence
- Key files: `app.go` (663 lines), `github/service.go` (360 lines), `auth/oauth.go` (418 lines)

**backend/auth:**
- Purpose: GitHub OAuth authentication with two methods
- Contains: OAuthService (Authorization Code Flow), DeviceFlowService, callback server
- Key files: `oauth.go`, `device_auth.go`, `callback_server.go`

**backend/config:**
- Purpose: Configuration loading and persistence
- Contains: AppConfig struct, TOML serialization, OAuth credential storage
- Key files: `app_config.go` (227 lines)

**backend/database:**
- Purpose: SQLite database operations with GORM ORM
- Contains: Database connection, models, CRUD operations, caching logic
- Key files: `database.go`, `models.go`, `repository.go` (268 lines)

**backend/github:**
- Purpose: GitHub API client and web scraping
- Contains: HTTP client, goquery HTML parsing, trending data fetching
- Key files: `service.go` (360 lines)

**backend/logger:**
- Purpose: Application logging
- Contains: File-based logger with concurrent access protection
- Key files: `logger.go` (122 lines)

**backend/models:**
- Purpose: Domain models and type definitions
- Contains: Repository, User, AuthSession, JSONDateTime (Wails-compatible time)
- Key files: `repository.go`, `user.go`, `token_store.go`

**backend/storage:**
- Purpose: In-memory session storage for OAuth
- Contains: MemorySessionStore with thread-safe map operations
- Key files: `memory_store.go` (49 lines)

**frontend/src:**
- Purpose: React application source code
- Contains: Components, hooks, types, main app logic
- Key files: `App.tsx` (174 lines), `main.tsx`

**frontend/src/components:**
- Purpose: React UI components
- Contains: MainLayout, ProjectCard, ProjectList, ProjectDetail, StarredSidebar
- Key files: `MainLayout.tsx` (476 lines), `ProjectCard.tsx`, `StarredSidebar.tsx`

**frontend/src/hooks:**
- Purpose: Custom React hooks for shared logic
- Contains: useAuth (OAuth state management)
- Key files: `useAuth.ts`

**frontend/src/types:**
- Purpose: TypeScript type definitions
- Contains: Repository, GitHubUser, AuthState, DeviceFlowInfo, TimeRange
- Key files: `index.ts` (70 lines)

**frontend/wailsjs:**
- Purpose: Auto-generated Wails bindings (DO NOT EDIT)
- Contains: TypeScript functions calling Go backend methods
- Key files: `go/backend/App` (all exported Go methods)

**shared:**
- Purpose: Runtime data directory (created at first run)
- Contains: SQLite database, TOML configuration, log file
- Key files: `trending.db`, `app-config.toml`, `app.log`
- Generated: Yes (created if missing)
- Committed: No

**tests:**
- Purpose: Integration tests
- Contains: Database operations tests
- Key files: `test_db.go`

## Key File Locations

**Entry Points:**
- `main.go`: Wails app initialization, window configuration, Go entry point
- `frontend/src/main.tsx`: React DOM mounting, frontend entry point
- `frontend/src/App.tsx`: Root React component with routing and global state

**Configuration:**
- `wails.json`: Wails build configuration, frontend build commands
- `go.mod`: Go module and dependency declarations
- `frontend/package.json`: Frontend dependencies and scripts
- `shared/app-config.toml`: Runtime configuration (GitHub OAuth, user auth)

**Core Logic:**
- `backend/app.go`: Wails bindings, data orchestration, cache management
- `backend/github/service.go`: GitHub scraping and API client
- `backend/auth/oauth.go`: OAuth Authorization Code Flow
- `backend/auth/device_auth.go`: OAuth Device Flow
- `backend/database/repository.go`: Database CRUD operations

**Testing:**
- `tests/test_db.go`: Database integration tests

## Naming Conventions

**Files:**
- Go: `lowercase.go` for implementation files (e.g., `service.go`, `logger.go`)
- Go: `lowercase_test.go` for test files
- TypeScript/React: `PascalCase.tsx` for components (e.g., `MainLayout.tsx`, `ProjectCard.tsx`)
- TypeScript/React: `camelCase.ts` for utilities and hooks (e.g., `useAuth.ts`)
- CSS: `ComponentName.module.css` for CSS Modules (e.g., `ProjectCard.module.css`)

**Directories:**
- Go: `lowercase` single word (e.g., `auth`, `config`, `github`)
- TypeScript: `lowercase` descriptive names (e.g., `components`, `hooks`, `types`)

**Go Functions:**
- Exported: `PascalCase` (e.g., `NewApp`, `GetTrendingRepositories`, `SaveTrendingEntries`)
- Unexported: `camelCase` (e.g., `parseRepository`, `convertModelsToEntries`)
- Interfaces: `PascalCase` (e.g., `AuthSessionStore`, `Repository`)

**TypeScript/React:**
- Components: `PascalCase` (e.g., `MainLayout`, `ProjectCard`, `StarredSidebar`)
- Functions/hooks: `camelCase` (e.g., `useAuth`, `handleRefresh`, `loadInitialData`)
- Types/interfaces: `PascalCase` (e.g., `Repository`, `GitHubUser`, `AuthState`)

## Where to Add New Code

**New Go Service (External API Integration):**
- Implementation: `backend/[servicename]/service.go`
- Models: Add to `backend/models/[domain].go` if new types needed
- Usage: Import and instantiate in `backend/app.go`

**New Wails Backend Method:**
- Add method to `App` struct in `backend/app.go` (exported PascalCase name)
- Run `wails dev` to auto-generate bindings in `frontend/wailsjs/go/backend/App`
- Import in React: `import { YourMethod } from '../wailsjs/go/backend/App'`

**New React Component:**
- Implementation: `frontend/src/components/ComponentName.tsx`
- Styles: `frontend/src/components/ComponentName.module.css` (CSS Modules)
- Import: `import { ComponentName } from './components/ComponentName'`

**New Custom Hook:**
- Implementation: `frontend/src/hooks/use[Feature].ts`
- Import: `import { use[Feature] } from './hooks/use[Feature]'`

**New Database Operation:**
- Add method to `DB` struct in `backend/database/repository.go`
- Add model to `backend/database/models.go` if new table needed
- Transaction pattern: Use `db.Transaction(func(tx *gorm.DB) error {})` for multi-step operations

**New Configuration Option:**
- Add field to `AppConfig` or nested struct in `backend/config/app_config.go`
- Add getter/setter methods to `Config` struct
- Update `shared/app-config.example.toml` with example value

## Special Directories

**frontend/wailsjs:**
- Purpose: Auto-generated Wails bindings (TypeScript → Go)
- Generated: Yes (on `wails dev` or `wails build`)
- Committed: Yes (regenerates with backend changes)
- DO NOT EDIT: Changes will be overwritten on next build

**frontend/dist:**
- Purpose: Built frontend assets for embedding
- Generated: Yes (via `npm run build` or `wails dev`)
- Committed: No (in .gitignore)
- Embedded: Via `//go:embed all:frontend/dist` in `main.go`

**shared:**
- Purpose: Runtime data directory created at app start
- Generated: Yes (if missing)
- Committed: No (in .gitignore)
- Contains: `trending.db` (SQLite database), `app-config.toml` (user config), `app.log` (log file)

**build:**
- Purpose: Compiled binaries and installer files
- Generated: Yes (via `wails build`)
- Committed: No (in .gitignore)

**.planning:**
- Purpose: Planning documents, codebase analysis, implementation plans
- Generated: Yes (by GSD system)
- Committed: Yes (version-controlled planning)

---

*Structure analysis: 2026-02-19*
