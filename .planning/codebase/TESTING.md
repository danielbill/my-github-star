# Testing Patterns

**Analysis Date:** 2026-02-19

## Test Framework

**Runner:**
- **No formal test framework configured**
- Tests are standalone Go programs in `tests/` directory
- No Jest, Vitest, or Go testing package usage detected

**Configuration:**
- No `jest.config.*` files found
- No `vitest.config.*` files found
- No `go test` integration detected
- Tests are run directly: `go run tests/test_db.go`

**Run Commands:**
```bash
# Run a specific test file
go run tests/test_db.go

# Run all tests in the tests directory
for f in tests/*.go; do go run "$f"; done
```

## Test File Organization

**Location:**
- Tests are in `tests/` directory at project root
- **Not co-located** with source files
- Separate test package: `package main` (not `package backend_test`)

**Naming:**
- Pattern: `test_<functionality>.go` (e.g., `test_db.go`)
- No `*_test.go` convention (standard Go testing pattern not used)

**Structure:**
```
tests/
└── test_db.go          # Database initialization test
```

**No test directories found:**
- No `frontend/src/__tests__/`
- No `backend/**/test/`
- No `*_test.go` files alongside source files

## Test Structure

**Suite Organization:**
```go
package main

import (
    "fmt"
    "os"
    "github-star-app/backend/database"
)

func main() {
    // 1. Setup
    tmpDir, err := os.MkdirTemp("", "test-db-*")
    if err != nil {
        fmt.Printf("创建临时目录失败: %v\n", err)
        os.Exit(1)
    }
    defer os.RemoveAll(tmpDir)

    // 2. Exercise
    db, err := database.NewDB(tmpDir)
    if err != nil {
        fmt.Printf("初始化数据库失败: %v\n", err)
        os.Exit(1)
    }

    // 3. Verify
    if err := db.Init(); err != nil {
        fmt.Printf("初始化表结构失败: %v\n", err)
        os.Exit(1)
    }

    // 4. Cleanup
    db.Close()
    fmt.Println("测试通过!")
}
```

**Patterns:**
- **Setup:** Create temporary directory with `os.MkdirTemp`
- **Exercise:** Call functions being tested
- **Verify:** Manual assertions with `if err != nil { os.Exit(1) }`
- **Teardown:** `defer os.RemoveAll(tmpDir)` for cleanup
- **Output:** Print success/failure messages in Chinese

**Missing Patterns:**
- No test suite structure (describe/it pattern)
- No assertion library (manual conditionals)
- No table-driven tests
- No subtests

## Mocking

**Framework:**
- **No mocking framework detected**
- No `gomock`, `testify/mock`, or similar

**Patterns:**
- Tests use real implementations (e.g., real SQLite database)
- No mock objects, fakes, or stubs
- Example from `tests/test_db.go`:
```go
// Uses real database instance
db, err := database.NewDB(tmpDir)
if err != nil {
    fmt.Printf("初始化数据库失败: %v\n", err)
    os.Exit(1)
}
```

**What to Mock:**
- No guidelines established (no extensive mocking in codebase)
- Database tests use temporary in-memory databases (real SQLite)

**What NOT to Mock:**
- Database operations tested with real SQLite in temporary directory
- External API calls not tested (no tests for GitHub service)

## Fixtures and Factories

**Test Data:**
- No fixture files detected
- No factory functions for test data
- Manual data creation in test functions

**Location:**
- No dedicated test data directory
- No `fixtures/`, `testdata/`, or similar

**Example pattern from `tests/test_db.go`:**
```go
// No fixture data - tests use empty database initialization
// Data would be created manually if needed:
// entry := database.TrendingEntry{
//     GithubID: 123,
//     FullName: "test/repo",
// }
```

## Coverage

**Requirements:** **None enforced**
- No coverage requirements configured
- No coverage reports generated

**View Coverage:**
- No coverage command available
- No `.nyc_output/` or `coverage/` directories
- No coverage comments in code

## Test Types

**Unit Tests:**
- **Limited implementation detected**
- Only database initialization test exists
- No unit tests for:
  - Service layer (`backend/github/service.go`)
  - Auth layer (`backend/auth/`)
  - Models (`backend/models/`)
  - Frontend components (`frontend/src/`)

**Integration Tests:**
- `tests/test_db.go` tests database initialization and schema
- Tests are more integration than unit (real SQLite database)

**E2E Tests:**
- **Not used**
- No Playwright, Cypress, or similar E2E framework
- No automated UI testing

## Common Patterns

**Async Testing:**
```go
// No async testing patterns detected
// Go's concurrency not tested
// Wails async operations not tested
```

**Error Testing:**
```go
// Manual error checking pattern:
if err != nil {
    fmt.Printf("操作失败: %v\n", err)
    os.Exit(1)
}

// No positive/negative test cases organized
// All errors cause immediate exit
```

**Data-Driven Testing:**
```go
// Not used - no table-driven tests detected
// Would look like this if implemented:
for _, tc := range []struct{
    name string
    input string
    want string
}{
    {"case1", "input1", "output1"},
    {"case2", "input2", "output2"},
}{
    t.Run(tc.name, func(t *testing.T) {
        // test logic
    })
}
```

## Wails-Specific Testing

**Backend Testing:**
- `backend/app.go` exports methods tested by `tests/test_db.go`
- Database operations tested through `database` package
- No Wails-specific test utilities detected

**Frontend Testing:**
- **No React component tests**
- No `@testing-library/react` usage
- No component render tests
- No event handler tests
- Wails bindings not tested

**Integration Testing:**
- No tests of frontend-backend communication
- No tests of Wails runtime calls
- No tests of event emission/listening

## Testing Gaps

**Backend Go:**
- **Untested areas:**
  - GitHub service (`backend/github/service.go` - 359 lines)
  - OAuth service (`backend/auth/oauth.go` - 418 lines)
  - Device flow auth (`backend/auth/device_auth.go` - 356 lines)
  - Config management (`backend/config/app_config.go` - 226 lines)
  - App logic (`backend/app.go` - 663 lines)
- **Risk:** Core application logic has no automated test coverage

**Frontend React:**
- **Untested areas:**
  - All components in `frontend/src/components/`
  - All hooks in `frontend/src/hooks/`
  - All type definitions
  - Wails integration code
- **Risk:** UI changes require manual testing

**Integration:**
- **Untested areas:**
  - OAuth flow end-to-end
  - Database CRUD operations
  - GitHub API integration
  - Trending data scraping
- **Risk:** Changes to external API integrations could break silently

## Testing Recommendations

**To Add Testing:**

1. **Go Unit Tests:**
   - Convert `tests/test_db.go` to use Go testing package: `func TestDBInit(t *testing.T)`
   - Add table-driven tests for data models
   - Test service layer with mocks (gomock or testify)
   - Test error handling paths

2. **Frontend Tests:**
   - Add React Testing Library
   - Test component rendering
   - Test user interactions (clicks, form submissions)
   - Test Wails binding calls

3. **Integration Tests:**
   - Test OAuth flow with mock GitHub server
   - Test database operations with test fixtures
   - Test event emission/handling between frontend/backend

4. **CI/CD:**
   - Add automated test runs
   - Add coverage reporting
   - Add pre-commit hooks for testing

**Test Frameworks to Consider:**
- Go: Standard `testing` package + `testify/assert` for assertions
- Go: `gomock` for interface mocking
- React: `@testing-library/react` + `@testing-library/user-event`
- Frontend: `vitest` as test runner (already uses Vite)

---

*Testing analysis: 2026-02-19*
