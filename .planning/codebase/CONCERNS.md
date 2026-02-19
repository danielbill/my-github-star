# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**Web Scraping Dependency:**
- Issue: GitHub Trending data is scraped via HTML parsing (`backend/github/service.go`), which is fragile and breaks if GitHub changes page structure
- Files: `backend/github/service.go`
- Impact: App will fail silently if GitHub updates their trending page layout
- Fix approach: Consider using GitHub API (if available) or implement multiple fallback selectors with versioning

**Mixed Authentication Methods:**
- Issue: Two authentication paths (OAuth Authorization Code + Device Flow) in parallel create complexity and maintenance burden
- Files: `backend/auth/oauth.go`, `backend/auth/device_auth.go`, `backend/app.go`
- Impact: Code duplication, confusion about which method to use, increased testing surface
- Fix approach: Choose one method (Device Flow is recommended per AGENTS.md) and deprecate/remove the other

**In-Memory Session Storage:**
- Issue: `backend/storage/memory_store.go` stores OAuth sessions in memory, lost on app restart
- Files: `backend/storage/memory_store.go`
- Impact: Users must restart OAuth flow if app crashes during authentication
- Fix approach: Persist sessions to database or filesystem with expiration

**HTML in Go Code:**
- Issue: Large HTML response templates embedded in Go code for callback server
- Files: `backend/auth/callback_server.go:120-259`
- Impact: Hard to maintain, difficult to style, mixes concerns
- Fix approach: Move to separate template files or serve static HTML

## Known Bugs

**Goroutine Error Silencing:**
- Symptoms: Background goroutines (`backend/app.go:633`, `backend/auth/oauth.go:104`, `backend/auth/device_auth.go:106`) have no error propagation
- Files: `backend/app.go`, `backend/auth/oauth.go`, `backend/auth/device_auth.go`
- Trigger: Auto-refresh or auth polling errors occur silently
- Workaround: Check `app.log` file for errors
- Fix approach: Use error channels or context cancellation to propagate errors from goroutines

**Logger Race Condition:**
- Symptoms: `GetLogs()` closes and reopens log file while other goroutines may be writing
- Files: `backend/logger/logger.go:84-103`
- Trigger: Concurrent calls to GetLogs while logging is active
- Workaround: None (potential data loss)
- Fix approach: Use separate read handle or snapshot approach instead of closing/reopening

## Security Considerations

**Hardcoded GitHub Client ID:**
- Risk: Default GitHub Client ID (`Ov23liRTX5eK2scwvG20`) exposed in source code
- Files: `backend/auth/device_auth.go:22`
- Current mitigation: File is in repository, gitignored config allows override
- Recommendations: Remove hardcoded value, require explicit configuration via `shared/app-config.toml`

**Leaked Access Token in Local Config:**
- Risk: Access token found in `shared/app-config.toml` (though gitignored)
- Files: `shared/app-config.toml`
- Current mitigation: File is in `.gitignore`, not committed
- Recommendations: Ensure config file permissions are restrictive (0600), add token rotation mechanism

**HTTP OAuth Callback:**
- Risk: OAuth callback uses HTTP on localhost (port 36542), potentially vulnerable to CSRF if not properly validated
- Files: `backend/auth/oauth.go:62`, `backend/auth/callback_server.go`
- Current mitigation: State parameter with PKCE provides CSRF protection
- Recommendations: Add additional validation for callback origin, consider HTTPS even for localhost

**User-Agent Impersonation:**
- Risk: Hardcoded Chrome User-Agent string for web scraping, potentially violating GitHub's Terms of Service
- Files: `backend/github/service.go:51, 308`
- Current mitigation: None
- Recommendations: Use honest User-Agent or switch to official GitHub API

## Performance Bottlenecks

**No Rate Limiting:**
- Problem: GitHub API calls have no rate limiting enforcement
- Files: `backend/auth/oauth.go`, `backend/auth/device_auth.go`, `backend/github/service.go`
- Cause: Multiple concurrent operations can hit GitHub's rate limits (5000/hr authenticated, 60/hr unauthenticated)
- Improvement path: Implement rate limiter with exponential backoff, cache API responses

**Inefficient Database Delete:**
- Problem: `SaveUserStarRepos()` uses `WHERE "1 = 1"` to delete all records before insertion
- Files: `backend/database/repository.go:154`
- Cause: Deleting all rows instead of incremental updates
- Improvement path: Use upsert (ON CONFLICT) or track which records changed

**No Data Retention Policy:**
- Problem: Database grows indefinitely with cached trending data
- Files: `backend/database/`
- Cause: No cleanup of old cached entries
- Improvement path: Implement cron job to delete entries older than X days, add `cached_at` index for efficient cleanup

**Unbounded Goroutine Creation:**
- Problem: No limit on concurrent goroutines for auto-refresh operations
- Files: `backend/app.go:633`
- Cause: Each refresh spawns new goroutine without worker pool
- Improvement path: Use buffered channel as semaphore, limit to 1-3 concurrent refreshes

## Fragile Areas

**Web Scraping Selectors:**
- Files: `backend/github/service.go:75-93, 116-218`
- Why fragile: GitHub HTML structure changes frequently; selectors like `article.Box-row`, `p.col-9`, `span[itemprop="programmingLanguage"]` may break
- Safe modification: Wrap parsing in try-catch with fallback selectors, add version detection for GitHub HTML
- Test coverage: No tests verify scraping works with live GitHub pages

**Authentication Flow State Machine:**
- Files: `backend/auth/device_auth.go:112-208`, `backend/auth/oauth.go:70-182`
- Why fragile: Multiple concurrent state transitions (polling, callback, timeout) without explicit state machine
- Safe modification: Document all state transitions, add state validation in each method
- Test coverage: No integration tests for OAuth flows

**Database Schema Evolution:**
- Files: `backend/database/models.go`, `backend/database/database.go:58`
- Why fragile: Uses GORM AutoMigrate which can cause breaking schema changes
- Safe modification: Use explicit migration files, add version tracking to schema
- Test coverage: No migration tests, no schema validation tests

**Mixed Language UI:**
- Files: `backend/auth/callback_server.go:180, 254` (Chinese strings in Go code)
- Why fragile: Hard to internationalize, inconsistent with frontend
- Safe modification: Use i18n library or move all UI strings to frontend
- Test coverage: No tests for different locales

## Scaling Limits

**Database Size:**
- Current capacity: No limit - trending cache can grow unbounded
- Limit: SQLite file size limits (~281 TB theoretically, but performance degrades after ~100MB)
- Scaling path: Implement retention policy, migrate to PostgreSQL if needed

**GitHub API Rate Limits:**
- Current capacity: 60 requests/hour (unauthenticated), 5000 requests/hour (authenticated)
- Limit: App will fail after exhausting limit
- Scaling path: Implement proper rate limiting, cache responses, batch requests where possible

**Memory Usage:**
- Current capacity: In-memory cache of repositories in `backend/app.go:26`
- Limit: ~662-line App struct with cache can grow large with many repositories
- Scaling path: Remove in-memory cache, rely on database queries with proper indexing

## Dependencies at Risk

**goquery (Web Scraping):**
- Risk: Dependency on HTML parsing which breaks when GitHub changes DOM
- Impact: App will fail to fetch trending data
- Migration plan: Implement fallback to GitHub API, use versioned selectors

**modernc.org/sqlite (SQLite Driver):**
- Risk: Pure Go SQLite driver may have performance issues vs CGO version
- Impact: Slower database operations under high load
- Migration plan: Benchmark against mattn/go-sqlite3, switch if needed

**golang.org/x/oauth2 (OAuth2):**
- Risk: External dependency for OAuth2 flows
- Impact: Security vulnerabilities in OAuth implementation
- Migration plan: Monitor for security updates, update regularly

## Missing Critical Features

**No Token Refresh Mechanism:**
- Problem: OAuth access tokens expire, but app doesn't refresh them
- Files: `backend/config/app_config.go:169`
- Blocks: Long-term authentication; users must re-login after token expires (typically 2-8 hours)
- Recommendations: Store refresh token, implement auto-refresh before expiry

**No Offline Mode:**
- Problem: App requires network to fetch data on every refresh
- Files: `backend/app.go`
- Blocks: Using app without internet, even for cached data display issues
- Recommendations: Cache strategy already exists, but UI doesn't handle network errors gracefully

**No Data Export/Import:**
- Problem: No way to backup or migrate starred repository data
- Files: `backend/database/`
- Blocks: Users can't backup their data, migrating to new machine difficult
- Recommendations: Add JSON export/import methods to `backend/app.go`

**No Configuration Validation:**
- Problem: No validation that Client ID is valid GitHub OAuth app
- Files: `backend/config/app_config.go`, `backend/auth/device_auth.go:59-63`
- Blocks: Users discover invalid configuration only when trying to login
- Recommendations: Add validation endpoint to GitHub API, test configuration on save

## Test Coverage Gaps

**Authentication Flows:**
- What's not tested: OAuth Authorization Code flow, Device Flow polling, callback handling, token exchange
- Files: `backend/auth/oauth.go`, `backend/auth/device_auth.go`, `backend/auth/callback_server.go`
- Risk: Authentication bugs go undetected, security vulnerabilities
- Priority: High

**Web Scraping:**
- What's not tested: GitHub Trending page parsing, fallback selectors, error handling on HTML changes
- Files: `backend/github/service.go:35-95, 116-218`
- Risk: Silent failures when GitHub changes page structure
- Priority: High

**Database Operations:**
- What's not tested: Save/Load trending entries, UserStarRepo CRUD, transaction rollback, concurrent access
- Files: `backend/database/repository.go`, `backend/database/database.go`
- Risk: Data corruption, race conditions, schema issues
- Priority: Medium

**Auto-refresh Logic:**
- What's not tested: Timer-based refresh, rate limiting, cache invalidation, error recovery
- Files: `backend/app.go:324-414, 461-546, 602-661`
- Risk: Stale data, excessive API calls, silent failures
- Priority: Medium

**Frontend Integration:**
- What's not tested: Wails bindings, event handling, state synchronization, error display
- Files: `frontend/src/`, `backend/app.go`
- Risk: UI bugs, poor error messages, state desync
- Priority: Medium

---

*Concerns audit: 2026-02-19*
