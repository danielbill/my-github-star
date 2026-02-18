# GitHub Star Tracking Desktop Application - Implementation Plan (Basic MVP)

## Context

Build a desktop application to track GitHub community dynamics, discover rapidly rising new projects, and monitor the growth rate of starred projects. The app will use Wails v2 framework combining Go backend with React + Mantine frontend.

**Initial Scope**: Basic MVP - Focus on core GitHub data fetching and display without AI summaries or OAuth initially.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Wails v2 (Go + React binding) |
| **Backend** | Go 1.21+, google/go-github SDK |
| **Frontend** | React 18, TypeScript, Mantine UI, Vite |
| **Platform** | Windows desktop app (.exe) |

## Implementation Plan (Basic MVP)

### Phase 1: Project Scaffolding

1. **Initialize Wails project**
   - Install Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
   - Create project: `wails init -n my-github-star -t react`
   - Install Mantine UI: `npm install @mantine/core @mantine/hooks @emotion/react`

2. **Project structure**
   ```
   my-github-star/
   ├── frontend/           # React + Mantine frontend
   │   ├── src/
   │   │   ├── components/ # UI components
   │   │   │   ├── ProjectList.tsx
   │   │   │   ├── ProjectCard.tsx
   │   │   │   └── MainLayout.tsx
   │   │   ├── types/      # TypeScript interfaces
   │   │   └── App.tsx
   ├── backend/            # Go services
   │   ├── main.go         # Wails entry point
   │   ├── github/         # GitHub API service
   │   └── models/         # Data models
   └── wails.json          # Wails config
   ```

### Phase 2: Backend Services (Go) - MVP Scope

#### 2.1 GitHub Data Service (`backend/github/service.go`)
- Fetch trending repositories from GitHub Trending API
- Parse repository data (name, stars, description, language, owner)
- Calculate simple star growth metrics (daily/weekly comparison)

#### 2.2 Data Models (`backend/models/repository.go`)
```go
type Repository struct {
    ID          int64
    Name        string
    FullName    string
    Owner       string
    Description string
    Language    string
    Stars       int
    URL         string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

#### 2.3 Basic Configuration (`backend/config/config.go`)
- Load GitHub API token from environment or config file
- Cache settings for API requests

### Phase 3: Frontend Components (React + Mantine) - MVP Scope

#### 3.1 Main Layout (`frontend/src/components/MainLayout.tsx`)
- Mantine AppShell with header
- Refresh button to reload trending projects
- Basic responsive layout

#### 3.2 Project List (`frontend/src/components/ProjectList.tsx`)
- Display projects as cards or list
- Show: name, stars, description, language, owner
- Simple sorting (by stars, name)

#### 3.3 Project Card (`frontend/src/components/ProjectCard.tsx`)
- Individual project display
- Click to open GitHub repository
- Badge for programming language

### Phase 4: Integration (MVP)

#### 4.1 Wails Binding (`backend/main.go`)
```go
// Core Go functions to expose
func (a *App) GetTrendingRepositories(period string) ([]Repository, error)
func (a *App) RefreshRepositories() ([]Repository, error)
```

#### 4.2 TypeScript Types (`frontend/src/types/index.ts`)
```typescript
export interface Repository {
    id: number;
    name: string;
    fullName: string;
    owner: string;
    description: string;
    language: string;
    stars: number;
    url: string;
}
```

### Phase 5: Build & Package

- Configure `wails.json` for Windows build
- Test build with `wails dev`
- Generate Windows `.exe` with `wails build`

## MVP Scope - What's Included

| Feature | Status |
|---------|--------|
| GitHub Trending API fetch | ✅ Include |
| Project list display | ✅ Include |
| Star count & basic info | ✅ Include |
| Refresh button | ✅ Include |
| Language badges | ✅ Include |
| GitHub repository links | ✅ Include |
| Sorting (stars, name) | ✅ Include |
| GitHub OAuth login | ❌ Future |
| AI summaries | ❌ Future |
| News search | ❌ Future |
| Star growth charts | ❌ Future |
| Watched projects tracking | ❌ Future |

## Critical Files to Create (MVP)

| File | Purpose |
|------|---------|
| `backend/main.go` | Wails app entry point, Go bindings for GetTrendingRepositories |
| `backend/github/service.go` | GitHub Trending API integration |
| `backend/models/repository.go` | Repository data model |
| `frontend/src/App.tsx` | Main React component with Mantine provider |
| `frontend/src/components/MainLayout.tsx` | AppShell layout with header |
| `frontend/src/components/ProjectList.tsx` | Project list with Grid/Stack |
| `frontend/src/components/ProjectCard.tsx` | Individual project card |
| `frontend/src/types/index.ts` | TypeScript interfaces |

## Verification Plan

1. **Development Mode**: Run `wails dev` and verify:
   - Trending repositories load successfully
   - Projects display correctly in UI
   - Refresh button works
   - Clicking project opens GitHub URL

2. **Build Test**: Run `wails build` and verify:
   - `.exe` file is generated
   - Application launches correctly
   - All features work in standalone mode

## Next Steps

1. Initialize Wails project with React template
2. Install and configure Mantine UI
3. Implement GitHub Trending service (Go)
4. Build frontend components (MainLayout, ProjectList, ProjectCard)
5. Connect frontend to Go backend via Wails bindings
6. Test with `wails dev`
7. Build Windows executable with `wails build`

## Future Enhancements (Post-MVP)

- GitHub OAuth login for private API access
- AI-powered project summaries
- Star growth rate charts and analytics
- News and video search integration
- Watched/starred projects tracking
- Periodic refresh with notifications
