# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- Go 1.24.0 - Backend application logic, API integration, database operations

**Secondary:**
- TypeScript 5.9.3 - Frontend React components and logic

## Runtime

**Environment:**
- Go 1.24.0 (backend)
- Node.js (frontend - Vite dev server)

**Package Manager:**
- Go modules (`go.mod`, `go.sum`) - Backend dependencies
- npm (`package-lock.json`) - Frontend dependencies

## Frameworks

**Core:**
- Wails v2.11.0 - Desktop application framework (bridges Go backend with React frontend)
- React 18.2.0 - Frontend UI library
- React Router DOM 7.13.0 - Client-side routing

**Testing:**
- None - Tests are Go scripts executed directly via `go run tests/test_db.go`

**Build/Dev:**
- Vite 3.0.7 - Frontend build tool and dev server
- @vitejs/plugin-react 2.0.1 - React plugin for Vite
- TypeScript 5.9.3 - Type checking for frontend

## Key Dependencies

**Critical:**
- gorm.io/gorm v1.31.1 - Go ORM for database operations
- gorm.io/driver/sqlite v1.6.0 - SQLite driver for GORM
- github.com/wailsapp/wails/v2 v2.11.0 - Desktop application framework
- github.com/PuerkitoBio/goquery v1.11.0 - HTML parsing for GitHub scraping

**Infrastructure:**
- golang.org/x/oauth2 v0.35.0 - OAuth2 client for GitHub authentication
- github.com/BurntSushi/toml v1.6.0 - TOML configuration file parsing
- modernc.org/sqlite v1.46.0 - Pure Go SQLite driver

**Frontend UI:**
- @mantine/core v8.3.15 - React component library
- @mantine/hooks v8.3.15 - React hooks library
- @mantine/notifications v8.3.15 - Notification system
- @tabler/icons-react v3.36.1 - Icon library
- @emotion/react v11.14.0 - CSS-in-JS library (Mantine dependency)

## Configuration

**Environment:**
- Configuration via TOML files (`shared/app-config.toml`)
- No environment variable system (config stored in TOML)
- Git ignores `shared/app-config.toml` (contains sensitive data)

**Build:**
- `wails.json` - Wails application configuration
- `wails build` - Production binary build
- `wails dev` - Development mode with hot reload
- `frontend/vite.config.js` - Vite bundler configuration
- `frontend/tsconfig.json` - TypeScript compiler configuration

## Platform Requirements

**Development:**
- Go 1.24.0 or higher
- Node.js (for frontend dev server)
- Wails CLI (installed via Go)
- Windows, macOS, or Linux

**Production:**
- Desktop application distributed as:
  - `.exe` (Windows)
  - App bundle (macOS)
  - Binary (Linux)
- No server required (runs as native desktop app)
- SQLite database embedded in application

---

*Stack analysis: 2026-02-19*
