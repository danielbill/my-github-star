# Phase 1: User Settings - Research

**Researched:** 2025-02-19
**Domain:** Wails v2 + React 18 + Mantine UI + TOML Configuration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Save approach: Real-time auto-save (no manual save button)
- Save feedback: Silent - no notifications on successful save
- Validation feedback: Use slider with preset values (0.5, 1, 4, 24 hours) to prevent invalid inputs
- UI control: Slider with labeled key values

### Claude's Discretion
- Folder picker implementation: Use native OS folder selection dialog (Wails runtime)
- Settings layout: Single column list for simplicity
- Error handling: Inline error messages below input fields
- Refresh interval integration: Apply immediately after save without requiring app restart

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | 在应用主界面添加设置入口 | Mantine Icon + Menu/Button pattern documented in existing MainLayout.tsx |
| UI-02 | 创建设置页面组件 | Component structure in `frontend/src/components/` with React Router |
| UI-03 | 刷新间隔配置项（默认0.5小时，范围0.1-24小时） | Mantine Slider with `restrictToMarks` + marks for presets (0.5, 1, 4, 24) |
| UI-04 | GitHub 克隆目录配置项（默认 d:\github，支持文件夹选择） | Wails `OpenDirectoryDialog` from Go backend |
| UI-05 | 设置页面导航 | React Router `<Route path="/settings" element={<Settings />} />` |
| PERS-01 | 保存刷新间隔到配置文件 | Extend `PreferencesConfig` struct in `backend/config/app_config.go` |
| PERS-02 | 保存 GitHub 克隆目录到配置文件 | TOML persistence with `BurntSushi/toml` library |
| API-01 | 创建后端配置读取方法 | Add methods to `backend/app.go` following existing pattern |
| API-02 | 创建后端配置更新方法 | Config methods with thread-safe `sync.RWMutex` |
| API-03 | 集成刷新间隔到趋势数据刷新逻辑 | Update refresh timer logic in `app.go:autoLoadInitialData` |
</phase_requirements>

## Summary

This phase implements a complete user settings feature for a Wails v2 desktop application using React 18 + Mantine UI. The phase requires creating a settings page with real-time auto-save, native folder picker integration, and TOML-based configuration persistence.

The existing codebase already provides a solid foundation: TOML configuration system using `BurntSushi/toml` with thread-safe config service (`backend/config/app_config.go`), React Router navigation pattern, and Mantine UI components throughout the application. The new settings feature will extend the existing `PreferencesConfig` struct, add Go backend methods following the established pattern, and create a React settings component with Mantine Slider and folder picker integration.

**Primary recommendation:** Extend existing TOML config system with new settings fields, use Mantine Slider with `restrictToMarks` for refresh interval validation, implement Wails Go backend method for native folder selection, and leverage React Router for settings page navigation.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|----------|---------|---------|-------------|
| Wails | v2.11.0 | Desktop framework + Go runtime | Project foundation, provides native dialogs |
| React | 18.3+ | Frontend framework | Existing codebase uses React 18 |
| React Router DOM | 6.x | Page navigation | Already used in `App.tsx` |
| Mantine UI | v7+ (or v8) | UI component library | Existing component stack, consistent styling |

### Supporting

| Library | Version | Purpose | When to Use |
|----------|---------|---------|-------------|
| BurntSushi/toml | Latest | TOML serialization | Already used for config persistence |
| @tabler/icons-react | Latest | Icon library | Already used in MainLayout |
| sync (Go stdlib) | Built-in | Thread-safe state | Already used in config service |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Mantine Slider | Custom slider input | Mantine provides accessibility, keyboard support, native feel |
| Wails OpenDirectoryDialog | FileInput component | Native dialog provides better UX for folder selection |
| TOML config | JSON/YAML | TOML is human-readable, already in use |
| React Router | Zustand state router | Router provides URL-based navigation, already integrated |

**Installation:**
```bash
# Dependencies already installed
npm install @mantine/core @tabler/icons-react react-router-dom
```

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── SettingsPage.tsx      # NEW: Settings page component
│   └── MainLayout.tsx        # EXISTING: Add settings entry
├── types/
│   └── index.ts             # NEW: Add UserSettings interface
└── App.tsx                 # EXISTING: Add /settings route

backend/
├── config/
│   └── app_config.go        # EXISTING: Extend PreferencesConfig struct
└── app.go                  # EXISTING: Add GetSettings/SetSettings methods
```

### Pattern 1: Mantine Slider with Marks (Refresh Interval)

**What:** Mantine Slider component with preset mark values to restrict user input

**When to use:** When you need to present a limited set of options within a continuous range

**Example:**
```typescript
// Source: https://mantine.dev/core/slider/
import { Slider } from '@mantine/core';

function RefreshIntervalSlider({ value, onChange }) {
  const marks = [
    { value: 0.5, label: '0.5h' },
    { value: 1, label: '1h' },
    { value: 4, label: '4h' },
    { value: 24, label: '24h' },
  ];

  return (
    <Slider
      min={0.1}
      max={24}
      step={0.1}
      marks={marks}
      value={value}
      onChange={onChange}
      label={(val) => `${val.toFixed(1)}小时`}
      restrictToMarks={true}  // Restricts to marks only
    />
  );
}
```

**Note:** `restrictToMarks` prop ensures users can only select preset values (0.5, 1, 4, 24 hours), preventing invalid inputs as required by locked decisions.

### Pattern 2: Wails Native Folder Dialog (Go Backend)

**What:** Use Wails runtime `OpenDirectoryDialog` from Go backend to present native OS folder picker

**When to use:** When user needs to select a directory path (not a file)

**Example:**
```go
// Source: https://wails.io/docs/reference/runtime/dialog
import (
    "context"
    "github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
    ctx context.Context
}

// SelectFolder opens native folder picker dialog
func (a *App) SelectFolder(defaultPath string) (string, error) {
    selectedDirectory, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
        DefaultDirectory: defaultPath,
        Title: "Select GitHub Clone Directory",
    })

    if err != nil {
        return "", fmt.Errorf("folder selection failed: %w", err)
    }

    return selectedDirectory, nil
}
```

**Important:** Dialog methods are Go-only and not available in JavaScript runtime. The dialog returns empty string if user cancels.

### Pattern 3: Extend TOML Config Struct

**What:** Add new fields to existing TOML configuration struct while maintaining thread-safety

**When to use:** Adding new persistent settings to existing config system

**Example:**
```go
// Source: backend/config/app_config.go (existing pattern)
type PreferencesConfig struct {
    LoginMethod      string  `toml:"login_method"`
    RefreshInterval  float64 `toml:"refresh_interval"`  // NEW: hours
    CloneDirectory   string  `toml:"clone_directory"`   // NEW: path
}

// GetRefreshInterval with thread-safety
func (c *Config) GetRefreshInterval() float64 {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.config.Preferences.RefreshInterval
}

// SetRefreshInterval with thread-safety and auto-save
func (c *Config) SetRefreshInterval(hours float64) error {
    c.mu.Lock()
    c.config.Preferences.RefreshInterval = hours
    c.mu.Unlock()
    return c.Save()
}
```

**Note:** All getter methods use `RLock()` (read lock), all setter methods use `Lock()` (write lock) + `Unlock()` + `Save()` for thread-safe persistence.

### Pattern 4: React Router Settings Page

**What:** Add new route to React Router for settings page

**When to use:** Creating a new page that needs URL-based navigation

**Example:**
```typescript
// Source: frontend/src/App.tsx (existing pattern)
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsPage } from './components/SettingsPage';

function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* Existing routes */}
          <Route path="/" element={<MainLayout>...</MainLayout>} />
          <Route path="/repo/:owner/:name" element={<ProjectDetail />} />

          {/* NEW: Settings route */}
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
```

### Pattern 5: Wails Go Method + Auto-Generated Bindings

**What:** Add Go method to App struct, run `wails dev` to auto-generate JavaScript bindings

**When to use:** Adding new backend API methods accessible from React frontend

**Example:**
```go
// backend/app.go
func (a *App) GetUserSettings() (*UserSettings, error) {
    return &UserSettings{
        RefreshInterval: a.appConfig.GetRefreshInterval(),
        CloneDirectory: a.appConfig.GetCloneDirectory(),
    }, nil
}

func (a *App) SetUserSettings(settings UserSettings) error {
    if err := a.appConfig.SetRefreshInterval(settings.RefreshInterval); err != nil {
        return err
    }
    return a.appConfig.SetCloneDirectory(settings.CloneDirectory)
}
```

**Then import in React:**
```typescript
// Auto-generated by wails dev
import { GetUserSettings, SetUserSettings } from '../../wailsjs/go/backend/App';

// Usage
const settings = await GetUserSettings();
await SetUserSettings(newSettings);
```

### Anti-Patterns to Avoid

- **Direct DOM manipulation:** Don't manipulate DOM directly, use Mantine components and React state
- **Manual file path parsing:** Don't parse paths manually, use `filepath.Join()` for cross-platform paths
- **Manual TOML encoding:** Don't hand-roll TOML serialization, use existing `BurntSushi/toml` library
- **Ignoring thread-safety:** Don't access config fields directly, always use getter/setter methods with mutex locks
- **Hardcoded paths:** Don't use hardcoded `d:\github` as absolute path, handle platform differences

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Folder picker dialog | Custom file browser or Node.js fs dialogs | Wails `runtime.OpenDirectoryDialog` | Native OS dialog provides consistent UX across Windows/macOS/Linux |
| Config persistence | Custom JSON/YAML file writers | Existing TOML config service | Thread-safe, battle-tested, already integrated with app lifecycle |
| Form validation | Custom regex validators | Mantine `restrictToMarks` prop | Built-in validation ensures only valid preset values selectable |
| Path handling | String concatenation for paths | Go `filepath.Join()`, Node `path.join()` | Handles separators and edge cases across platforms |
| Settings UI components | Custom slider/inputs | Mantine Slider, TextInput | Accessibility, keyboard navigation, consistent theming |

**Key insight:** Wails provides native OS dialogs that are superior to any web-based solution. The existing config service with TOML persistence and thread-safety should be extended, not replaced. Mantine UI components provide all the form controls needed with built-in accessibility and theming.

## Common Pitfalls

### Pitfall 1: Wrong Context for Wails Dialog

**What goes wrong:** Calling `OpenDirectoryDialog` without proper Wails context, resulting in dialog not appearing or crashing

**Why it happens:** Wails runtime methods require a valid `context.Context` from the Wails app lifecycle

**How to avoid:** Store context in App struct during Startup(), always use stored context

```go
type App struct {
    ctx context.Context  // Store Wails context here
}

func (a *App) Startup(ctx context.Context) {
    a.ctx = ctx  // Store context
}

func (a *App) SelectFolder() (string, error) {
    // Use stored context
    return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{...})
}
```

**Warning signs:** Dialog not appearing, panic: context missing, empty return value

### Pitfall 2: Race Conditions in Config Access

**What goes wrong:** Concurrent reads/writes to config cause crashes or data corruption

**Why it happens:** Accessing config fields directly without mutex locks

**How to avoid:** Always use getter/setter methods with proper locking

```go
// WRONG: Direct access
interval := c.config.Preferences.RefreshInterval  // No lock!

// CORRECT: Use getter method with RLock
interval := c.GetRefreshInterval()  // Internally uses mu.RLock()

// WRONG: Direct modification
c.config.Preferences.RefreshInterval = 1.0  // No lock!

// CORRECT: Use setter method with Lock + Save
c.SetRefreshInterval(1.0)  // Internally uses mu.Lock() + Save()
```

**Warning signs:** Panic: concurrent map writes, corrupted TOML files, inconsistent values

### Pitfall 3: Not Using restrictToMarks on Slider

**What goes wrong:** Users can select invalid refresh intervals like 0.15 hours

**Why it happens:** Slider allows any value between min/max unless restricted

**How to avoid:** Always use `restrictToMarks={true}` when preset values are required

```typescript
// WRONG: Allows any value between 0.1 and 24
<Slider min={0.1} max={24} step={0.1} value={value} onChange={onChange} />

// CORRECT: Restricts to marks only (0.5, 1, 4, 24)
<Slider
    min={0.1}
    max={24}
    step={0.1}
    marks={[{value: 0.5}, {value: 1}, {value: 4}, {value: 24}]}
    restrictToMarks={true}
    value={value}
    onChange={onChange}
/>
```

**Warning signs:** Slider shows values like "0.2h" or "7.5h", unexpected refresh intervals

### Pitfall 4: Forgetting to Run Wails Dev After Adding Go Methods

**What goes wrong:** React imports for new Go methods fail, TypeScript errors

**Why it happens:** Wails generates JavaScript bindings during `wails dev`, not at import time

**How to avoid:** Run `wails dev` after adding new exported methods, then restart dev server

```bash
# After adding new method to app.go
wails dev

# Wails auto-generates: frontend/wailsjs/go/backend/App.js
# Then you can import: import { NewMethod } from '../../wailsjs/go/backend/App'
```

**Warning signs:** Module not found error for new Go method, TypeScript error "has no exported member"

### Pitfall 5: Platform-Specific Path Hardcoding

**What goes wrong:** Settings fail on different OS (Windows vs macOS vs Linux)

**Why it happens:** Using hardcoded separators like `d:\github\` or `/home/user/github`

**How to avoid:** Use `filepath.Join()` for Go, `path.join()` for Node

```go
// WRONG: Windows-only path
path := "d:\github\repo"

// CORRECT: Cross-platform path
path := filepath.Join("d:", "github", "repo")  // Works on Windows
path := filepath.Join("/home", "user", "github")  // Works on Unix
```

**Warning signs:** Path errors on non-Windows OS, backslashes in logs on Unix

## Code Examples

Verified patterns from official sources:

### Settings Page Component Structure

```typescript
// frontend/src/components/SettingsPage.tsx
import { useState, useEffect } from 'react';
import { Container, Title, Stack, Text, Slider, TextInput, Button, Group, ActionIcon } from '@mantine/core';
import { IconFolder, IconRefresh } from '@tabler/icons-react';
import { GetUserSettings, SetUserSettings, SelectFolder } from '../../wailsjs/go/backend/App';

interface UserSettings {
    refresh_interval: number;
    clone_directory: string;
}

export function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>({
        refresh_interval: 0.5,
        clone_directory: 'd:\\github',
    });
    const [loading, setLoading] = useState(true);

    // Load settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const result = await GetUserSettings();
                setSettings(result);
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    // Auto-save on slider change
    const handleIntervalChange = async (value: number) => {
        const newSettings = { ...settings, refresh_interval: value };
        setSettings(newSettings);
        try {
            await SetUserSettings(newSettings);
            // Silent save - no notification
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    // Folder picker click handler
    const handleFolderClick = async () => {
        const selected = await SelectFolder(settings.clone_directory);
        if (selected) {  // Empty string if cancelled
            const newSettings = { ...settings, clone_directory: selected };
            setSettings(newSettings);
            await SetUserSettings(newSettings);
        }
    };

    if (loading) return <div>Loading...</div>;

    const marks = [
        { value: 0.5, label: '0.5h' },
        { value: 1, label: '1h' },
        { value: 4, label: '4h' },
        { value: 24, label: '24h' },
    ];

    return (
        <Container size="sm" py="xl">
            <Title order={2}>Settings</Title>
            <Stack gap="lg" mt="md">
                {/* Refresh Interval Setting */}
                <div>
                    <Text fw={500} mb="sm">Refresh Interval</Text>
                    <Text size="sm" c="dimmed" mb="xs">
                        How often to refresh trending data from GitHub
                    </Text>
                    <Slider
                        min={0.1}
                        max={24}
                        marks={marks}
                        value={settings.refresh_interval}
                        onChange={handleIntervalChange}
                        label={(val) => `${val.toFixed(1)}h`}
                        restrictToMarks={true}
                    />
                </div>

                {/* Clone Directory Setting */}
                <div>
                    <Text fw={500} mb="sm">GitHub Clone Directory</Text>
                    <Text size="sm" c="dimmed" mb="xs">
                        Where to clone GitHub repositories
                    </Text>
                    <Group>
                        <TextInput
                            style={{ flex: 1 }}
                            value={settings.clone_directory}
                            readOnly
                            rightSection={
                                <ActionIcon onClick={handleFolderClick}>
                                    <IconFolder />
                                </ActionIcon>
                            }
                        />
                    </Group>
                </div>
            </Stack>
        </Container>
    );
}
```

### Go Backend Methods

```go
// backend/app.go - Add these methods

// UserSettings represents user-configurable settings
type UserSettings struct {
    RefreshInterval float64 `json:"refresh_interval"`
    CloneDirectory  string  `json:"clone_directory"`
}

// GetUserSettings returns current user settings
func (a *App) GetUserSettings() (*UserSettings, error) {
    if a.appConfig == nil {
        return nil, fmt.Errorf("config not initialized")
    }

    interval := a.appConfig.GetRefreshInterval()
    dir := a.appConfig.GetCloneDirectory()

    return &UserSettings{
        RefreshInterval: interval,
        CloneDirectory:  dir,
    }, nil
}

// SetUserSettings updates user settings with auto-save
func (a *App) SetUserSettings(settings UserSettings) error {
    if a.appConfig == nil {
        return fmt.Errorf("config not initialized")
    }

    // Update refresh interval
    if err := a.appConfig.SetRefreshInterval(settings.RefreshInterval); err != nil {
        return fmt.Errorf("failed to set refresh interval: %w", err)
    }

    // Update clone directory
    if err := a.appConfig.SetCloneDirectory(settings.CloneDirectory); err != nil {
        return fmt.Errorf("failed to set clone directory: %w", err)
    }

    return nil
}

// SelectFolder opens native folder picker dialog
func (a *App) SelectFolder(defaultPath string) (string, error) {
    if a.ctx == nil {
        return "", fmt.Errorf("context not initialized")
    }

    selectedDirectory, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
        DefaultDirectory: defaultPath,
        Title: "Select GitHub Clone Directory",
    })

    if err != nil {
        return "", fmt.Errorf("folder selection failed: %w", err)
    }

    return selectedDirectory, nil
}
```

### Extend Config Struct

```go
// backend/config/app_config.go - Add these to existing code

type PreferencesConfig struct {
    LoginMethod      string  `toml:"login_method"`
    RefreshInterval  float64 `toml:"refresh_interval"`  // NEW
    CloneDirectory   string  `toml:"clone_directory"`   // NEW
}

const (
    DefaultRefreshInterval = 0.5  // hours
    DefaultCloneDirectory  = ""    // Empty means use default OS path
)

// Load - Update to set defaults for new fields
func (c *Config) Load(sharedDir string) error {
    // ... existing code ...

    // Set defaults if fields are zero/empty
    if c.config.Preferences.RefreshInterval == 0 {
        c.config.Preferences.RefreshInterval = DefaultRefreshInterval
    }
    if c.config.Preferences.CloneDirectory == "" {
        // Use user home directory + github
        homeDir, _ := os.UserHomeDir()
        c.config.Preferences.CloneDirectory = filepath.Join(homeDir, "github")
    }

    return nil
}

// GetRefreshInterval returns refresh interval in hours
func (c *Config) GetRefreshInterval() float64 {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.config.Preferences.RefreshInterval
}

// SetRefreshInterval updates refresh interval with auto-save
func (c *Config) SetRefreshInterval(hours float64) error {
    // Validate range
    if hours < 0.1 || hours > 24 {
        return fmt.Errorf("refresh interval must be between 0.1 and 24 hours")
    }
    c.mu.Lock()
    c.config.Preferences.RefreshInterval = hours
    c.mu.Unlock()
    return c.Save()
}

// GetCloneDirectory returns clone directory path
func (c *Config) GetCloneDirectory() string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.config.Preferences.CloneDirectory
}

// SetCloneDirectory updates clone directory with auto-save
func (c *Config) SetCloneDirectory(path string) error {
    c.mu.Lock()
    c.config.Preferences.CloneDirectory = path
    c.mu.Unlock()
    return c.Save()
}
```

### Add Settings Entry to MainLayout

```typescript
// frontend/src/components/MainLayout.tsx - Add settings icon/link

import { IconSettings } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// Inside MainLayout component
const navigate = useNavigate();

const handleSettingsClick = () => {
    navigate('/settings');
};

// In the header Flex component
<ActionIcon
    variant="subtle"
    size="md"
    radius="sm"
    onClick={handleSettingsClick}
    styles={{
        root: {
            backgroundColor: '#3f4b5c',
            color: '#a0a0a0',
            '&:hover': {
                backgroundColor: '#4a576a',
            },
        },
    }}
>
    <IconSettings size={20} />
</ActionIcon>
```

### Update Refresh Timer Logic

```go
// backend/app.go - Update autoLoadInitialData to use configurable refresh interval

func (a *App) autoLoadInitialData(ctx context.Context) {
    if a.db == nil {
        runtime.LogPrintf(ctx, "数据库未初始化，跳过自动加载")
        return
    }

    cachedAt, err := a.db.GetLatestCachedAt()
    if err != nil {
        runtime.LogPrintf(ctx, "获取缓存时间失败: %v", err)
        return
    }

    now := time.Now()
    var elapsed time.Duration
    if cachedAt.IsZero() {
        elapsed = time.Hour
    } else {
        elapsed = now.Sub(cachedAt)
    }

    // Get configured refresh interval from config
    refreshIntervalHours := a.appConfig.GetRefreshInterval()
    refreshInterval := time.Duration(refreshIntervalHours * float64(time.Hour))

    a.refreshMutex.Lock()
    if elapsed >= refreshInterval {
        a.lastRefresh = time.Time{}
        a.refreshMutex.Unlock()
        runtime.LogPrintf(ctx, "缓存已过期或无数据，开始自动爬取...")
        go a.doRefresh(ctx)
    } else {
        a.lastRefresh = now.Add(-elapsed)
        a.refreshMutex.Unlock()
        remaining := refreshInterval - elapsed
        runtime.LogPrintf(ctx, "缓存有效，距下次刷新还需 %.0f 分钟", remaining.Minutes())
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|---------|
| Manual save buttons | Auto-save on change | Modern best practice | UX improvement, no data loss |
| Web-based file dialogs | Native OS dialogs | Wails v1 → v2 | Better platform integration |
| Hardcoded refresh intervals | Configurable settings | This phase | User flexibility |
| Page reload on settings save | Real-time updates | Modern React | Instant feedback |

**Deprecated/outdated:**
- Wails v1: Dialog API changed significantly in v2, always use v2 docs
- React Class Components: Existing codebase uses functional components with hooks
- Mantine v6: Mantine v7+ has different component APIs, use v7+

## Open Questions

1. **Refresh interval persistence across restarts**
   - What we know: Config saves to TOML file in shared directory
   - What's unclear: Should refresh timer use new interval immediately or wait for next cycle
   - Recommendation: Apply immediately after save without restart (per Claude's discretion)

2. **Default clone directory handling**
   - What we know: Requirement says default is `d:\github`
   - What's unclear: Should this be absolute path or relative to user home?
   - Recommendation: Use `filepath.Join(os.UserHomeDir(), "github")` for cross-platform compatibility, with `d:\github` as fallback on Windows only

3. **Settings page navigation pattern**
   - What we know: MainLayout uses React Router, currently has two tabs (Trend/News)
   - What's unclear: Should settings be a separate route or a modal within MainLayout?
   - Recommendation: Separate `/settings` route following existing `/repo/:owner/:name` pattern

## Sources

### Primary (HIGH confidence)

- **Mantine Slider docs** - https://mantine.dev/core/slider/ - Verified `restrictToMarks`, `marks`, `onChange` props for refresh interval slider
- **Mantine TextInput docs** - https://mantine.dev/core/text-input/ - Verified `rightSection`, `readOnly`, `error` props for folder path display
- **Wails Dialog API (v2.11.0)** - https://wails.io/docs/reference/runtime/dialog - Verified `OpenDirectoryDialog` signature, `OpenDialogOptions` struct, return value (empty string on cancel)
- **Existing codebase** - backend/config/app_config.go, backend/app.go, frontend/src/App.tsx, frontend/src/components/MainLayout.tsx - Verified TOML pattern, thread-safety, React Router setup, Mantine usage
- **Wails Events (Next Version)** - https://wails.io/docs/next/reference/runtime/events - Verified event system structure (not needed for this phase, but good to know)

### Secondary (MEDIUM confidence)

- **React Router v6 docs** - https://reactrouter.com/en/main - Verified route pattern for adding `/settings` page (standard pattern, high confidence but cross-referenced)

### Tertiary (LOW confidence)

None - All critical claims verified with official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified Wails v2.11.0, React 18, Mantine UI from official docs and existing codebase
- Architecture: HIGH - Patterns verified against existing codebase (config service, React Router, Wails bindings) and official documentation
- Pitfalls: HIGH - Race conditions, context issues, platform paths well-documented in Go concurrency and Wails docs

**Research date:** 2025-02-19
**Valid until:** 30 days (stable technologies: Go 1.24, Wails v2, React 18, Mantine v7/v8)
