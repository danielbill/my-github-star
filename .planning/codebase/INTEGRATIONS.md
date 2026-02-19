# External Integrations

**Analysis Date:** 2026-02-19

## APIs & External Services

**GitHub API:**
- GitHub OAuth2 Device Flow - User authentication
  - Endpoints:
    - Device code: `https://github.com/login/device/code`
    - Token exchange: `https://github.com/login/oauth/access_token`
    - User profile: `https://api.github.com/user`
    - User repos: `https://api.github.com/user/repos`
    - User starred: `https://api.github.com/user/starred`
  - Client: `golang.org/x/oauth2` (OAuth2 standard)
  - Client ID: Configured in `shared/app-config.toml` or default `Ov23liRTX5eK2scwvG20`
  - Scopes: `read:user`, `user:email`
  - Authentication: Device Flow (no client secret required) or OAuth callback

**GitHub Web Scraping:**
- GitHub Trending Page - Repository discovery
  - URL: `https://github.com/trending`
  - Client: Custom HTTP client with goquery
  - Headers: User-Agent, Accept, Accept-Language (spoofed browser)
  - No authentication required (public page)
  - Parses HTML with `github.com/PuerkitoBio/goquery`
  - Filters by: Language (`/trending/{language}`), Time range (`?since=daily|weekly|monthly`)

**Browser Integration:**
- System default browser - OAuth callback and external links
  - Implementation: Wails runtime
  - Method: `runtime.BrowserOpenURL(url)` in Go backend
  - Used for: Opening GitHub device code URL, external repository links

## Data Storage

**Databases:**
- SQLite (local embedded database)
  - Location: `shared/trending.db` (in application directory)
  - Client: GORM ORM with `gorm.io/driver/sqlite` and `modernc.org/sqlite`
  - Driver: Pure Go SQLite driver (`modernc.org/sqlite v1.46.0`)
  - No external database service required
  - Connection pooling: MaxIdleConns=10, MaxOpenConns=100, ConnMaxLifetime=1 hour
  - Tables: `TrendingEntry`, `UserStarRepo`
  - Migrations: Auto-migration via GORM `AutoMigrate()`

**File Storage:**
- Local filesystem only (application directory)
  - Config: `shared/app-config.toml`
  - Database: `shared/trending.db`
  - No cloud storage integration

**Caching:**
- None - All data stored in SQLite
  - No in-memory cache layer
  - No external caching service (Redis, Memcached, etc.)

## Authentication & Identity

**Auth Provider:**
- GitHub OAuth2 (two methods supported)
  - **Method 1 (OAuth Authorization Code):** Requires Client ID and Client Secret
    - Implementation: `backend/auth/oauth.go`
    - Callback server: Local HTTP server (`backend/auth/callback_server.go`)
    - Redirect URI: `http://localhost:{port}/callback`
  - **Method 2 (Device Flow):** Requires Client ID only (recommended)
    - Implementation: `backend/auth/device_auth.go`
    - No Client Secret required
    - User visits GitHub device code URL in browser
    - Polling mechanism to exchange device code for access token
  - Default method: Device Flow (`LoginMethodDevice`)
  - Config: Stored in `shared/app-config.toml`
  - Token storage: In-memory and persisted to TOML config file

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service (Sentry, Rollbar, etc.)
  - Error logging: Custom logger (`backend/logger/`)
  - Output: Console/file (`app.log`)
  - No crash reporting

**Logs:**
- Custom logging system
  - Implementation: `backend/logger/`
  - Output: Console and file (`app.log`)
  - No centralized logging service
  - No log aggregation (ELK, Splunk, etc.)

## CI/CD & Deployment

**Hosting:**
- Desktop application (self-hosted)
  - No cloud hosting
  - Distribution: Binary executables (Windows `.exe`, macOS app bundle, Linux binary)
  - No web server or cloud platform

**CI Pipeline:**
- None - No automated CI/CD
  - Manual build process: `wails build`
  - No GitHub Actions, GitLab CI, etc.
  - No automated testing pipeline
  - No release automation

## Environment Configuration

**Required env vars:**
- None - Configuration via TOML file, not environment variables
  - GitHub Client ID: `github.client_id` in `shared/app-config.toml`
  - GitHub Client Secret: `github.client_secret` in `shared/app-config.toml` (optional for Device Flow)
  - Access token: Stored in `auth.access_token` after login

**Secrets location:**
- `shared/app-config.toml` - User authentication tokens and API credentials
  - Git-ignored file (not committed)
  - Contains: `access_token`, `client_id`, `client_secret`, user info
  - Managed by application (written/read at runtime)

## Webhooks & Callbacks

**Incoming:**
- OAuth callback - Local HTTP server for GitHub OAuth redirect
  - Endpoint: `http://localhost:{port}/callback`
  - Implementation: `backend/auth/callback_server.go`
  - Port: Configurable (default in code)
  - Handler: `CallbackServer` handles OAuth authorization code
  - Server auto-shuts down after receiving callback

**Outgoing:**
- None - No webhook integrations
  - No outgoing HTTP callbacks to external services
  - No webhooks registered with GitHub or other services
  - No event-driven integrations

---

*Integration audit: 2026-02-19*
