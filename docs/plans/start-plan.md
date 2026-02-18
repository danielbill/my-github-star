# GitHub Star 追踪桌面应用 - 实施计划（基础 MVP）

  

## 背景

  

构建一个桌面应用程序，用于追踪 GitHub 社区动态，发现快速崛起的新项目，并监控关注项目的星标增长速率。应用使用 Wails v2 框架，结合 Go 后端和 React + Mantine 前端。

  

**初始范围**：基础 MVP - 专注于核心 GitHub 数据获取和展示，暂不包含 AI 摘要和 OAuth 登录。

  

## 技术栈

  

| 层级 | 技术 |

|------|------|

| **框架** | Wails v2 (Go + React 绑定) |

| **后端** | Go 1.21+, google/go-github SDK |

| **前端** | React 18, TypeScript, Mantine UI, Vite |

| **平台** | Windows 桌面应用 (.exe) |

  

## 实施计划

  

### 第一阶段：项目脚手架

  

1. **初始化 Wails 项目**

   - 安装 Wails CLI：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`

   - 创建项目：`wails init -n my-github-star -t react`

   - 安装 Mantine UI：`npm install @mantine/core @mantine/hooks @emotion/react`

  

2. **项目结构**

   ```

   my-github-star/

   ├── frontend/           # React + Mantine 前端

   │   ├── src/

   │   │   ├── components/ # UI 组件

   │   │   │   ├── ProjectList.tsx    # 项目列表

   │   │   │   ├── ProjectCard.tsx    # 项目卡片

   │   │   │   └── MainLayout.tsx     # 主布局

   │   │   ├── types/      # TypeScript 接口

   │   │   └── App.tsx     # 主应用组件

   ├── backend/            # Go 服务

   │   ├── main.go         # Wails 入口

   │   ├── github/         # GitHub API 服务

   │   └── models/         # 数据模型

   └── wails.json          # Wails 配置

   ```

  

### 第二阶段：后端服务（Go）- MVP 范围

  

#### 2.1 GitHub 数据服务 (`backend/github/service.go`)

- 从 GitHub Trending API 获取趋势仓库

- 解析仓库数据（名称、星标数、描述、语言、所有者）

- 计算简单的星标增长指标（每日/每周对比）

  

#### 2.2 数据模型 (`backend/models/repository.go`)

```go

type Repository struct {

    ID          int64

    Name        string        // 仓库名称

    FullName    string        // 完整名称 (owner/repo)

    Owner       string        // 所有者

    Description string        // 描述

    Language    string        // 主要编程语言

    Stars       int           // 星标数量

    URL         string        // GitHub 链接

    CreatedAt   time.Time     // 创建时间

    UpdatedAt   time.Time     // 更新时间

}

```

  

#### 2.3 基础配置 (`backend/config/config.go`)

- 从环境变量或配置文件加载 GitHub API Token

- API 请求的缓存设置

  

### 第三阶段：前端组件（React + Mantine）- MVP 范围

  

#### 3.1 主布局 (`frontend/src/components/MainLayout.tsx`)

- Mantine AppShell 布局

- 顶部栏带刷新按钮

- 基础响应式布局

  

#### 3.2 项目列表 (`frontend/src/components/ProjectList.tsx`)

- 以卡片或列表形式展示项目

- 显示：名称、星标数、描述、语言、所有者

- 简单排序（按星标数、名称）

  

#### 3.3 项目卡片 (`frontend/src/components/ProjectCard.tsx`)

- 单个项目展示

- 点击打开 GitHub 仓库

- 编程语言徽章

  

### 第四阶段：集成（MVP）

  

#### 4.1 Wails 绑定 (`backend/main.go`)

```go

// 暴露给前端的 Go 函数

func (a *App) GetTrendingRepositories(period string) ([]Repository, error)

func (a *App) RefreshRepositories() ([]Repository, error)

```

  

#### 4.2 TypeScript 类型定义 (`frontend/src/types/index.ts`)

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

  

### 第五阶段：构建打包

  

- 配置 `wails.json` 用于 Windows 构建

- 使用 `wails dev` 测试开发模式

- 使用 `wails build` 生成 Windows `.exe`

  

## MVP 范围 - 包含功能

  

| 功能 | 状态 |

|------|------|

| GitHub Trending API 获取 | ✅ 包含 |

| 项目列表展示 | ✅ 包含 |

| 星标数和基础信息 | ✅ 包含 |

| 刷新按钮 | ✅ 包含 |

| 编程语言徽章 | ✅ 包含 |

| GitHub 仓库链接 | ✅ 包含 |

| 排序（星标、名称） | ✅ 包含 |

| GitHub OAuth 登录 | ❌ 后续 |

| AI 摘要 | ❌ 后续 |

| 新闻搜索 | ❌ 后续 |

| 星标增长图表 | ❌ 后续 |

| 关注项目追踪 | ❌ 后续 |

  

## 需要创建的关键文件（MVP）

  

| 文件 | 用途 |

|------|------|

| `backend/main.go` | Wails 入口，GetTrendingRepositories 绑定 |

| `backend/github/service.go` | GitHub Trending API 集成 |

| `backend/models/repository.go` | 仓库数据模型 |

| `frontend/src/App.tsx` | 主 React 组件，Mantine Provider |

| `frontend/src/components/MainLayout.tsx` | AppShell 布局和头部 |

| `frontend/src/components/ProjectList.tsx` | 项目列表（Grid/Stack） |

| `frontend/src/components/ProjectCard.tsx` | 单个项目卡片 |

| `frontend/src/types/index.ts` | TypeScript 接口定义 |

  

## 验证计划

  

1. **开发模式**：运行 `wails dev` 并验证：

   - 趋势仓库成功加载

   - 项目在 UI 中正确显示

   - 刷新按钮正常工作

   - 点击项目打开 GitHub URL

  

2. **构建测试**：运行 `wails build` 并验证：

   - `.exe` 文件成功生成

   - 应用程序正常启动

   - 所有功能在独立模式下正常工作

  

## 后续步骤

  

1. 使用 React 模板初始化 Wails 项目

2. 安装并配置 Mantine UI

3. 实现 GitHub Trending 服务（Go）

4. 构建前端组件（MainLayout、ProjectList、ProjectCard）

5. 通过 Wails 绑定连接前端和 Go 后端

6. 使用 `wails dev` 测试

7. 使用 `wails build` 构建 Windows 可执行文件

  

## 未来增强功能（MVP 之后）

  

- GitHub OAuth 登录以访问私有 API

- AI 驱动的项目摘要

- 星标增长率图表和分析

- 新闻和视频搜索集成

- 关注/星标项目追踪

- 定期刷新和通知