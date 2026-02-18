# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此代码库中工作的指导。

## 项目概述

GitHub Star Tracker 是一个使用 Wails v2（Go 后端 + React 前端）构建的桌面应用程序。它展示 GitHub 趋势仓库，并支持按编程语言和时间范围筛选。

## 命令

### 开发
```bash
# 以开发模式运行（支持热重载）
wails dev

# 安装前端依赖
cd frontend && npm install
```

### 构建
```bash
# 构建生产版本二进制文件
wails build
```

### 测试

测试脚本统一存放 tests/

## 架构

### 后端 (Go)
- **main.go**: Wails 应用入口，通过 `//go:embed all:frontend/dist` 嵌入前端资源
- **app.go**: 核心 App 结构体，连接前端与后端服务
  - `GetTrendingRepositories(language, since)`: 通过 GitHub Search API 获取趋势仓库
  - `RefreshRepositories()`: 使用默认参数（本周、全部语言）的便捷方法
  - `GetCachedRepositories()`: 返回缓存数据
  - `GetRepositoryByID(owner, repo)`: 获取单个仓库详情
- **github/service.go**: GitHub API 集成，使用 GitHub Search API（而非 Trending 页面）
  - 使用 `stars:>100` 和日期过滤的搜索查询
  - 30 秒 HTTP 超时
  - 支持可选的 GitHub token 以提高 API 限额
- **github/models.go**: 数据模型，包括 `Repository` 和自定义的 `JSONDateTime` 用于 Wails JSON 序列化

### 前端 (React + Vite + Mantine)
- **src/App.tsx**: 主组件，管理仓库状态和 API 调用
- **src/components/MainLayout.tsx**: AppShell 头部，包含筛选器（时间范围、语言）和刷新按钮
- **src/components/ProjectList.tsx**: 仓库卡片网格显示，包含加载/错误状态
- **src/components/ProjectCard.tsx**: 单个仓库卡片，带语言颜色编码
- **src/types/index.ts**: TypeScript 接口，镜像 Go 模型

### 构建配置
- **wails.json**: Wails 项目配置（名称: github-star-app）
- **frontend/vite.config.js**: Vite 配置，使用 React 插件和自动 JSX
- **go.mod**: Go 1.23，依赖 `github.com/wailsapp/wails/v2 v2.11.0`

## 关键模式

### 添加新的 Go 方法
1. 在 `app.go` 的 `App` 结构体中添加方法
2. 导出方法（首字母大写）
3. 运行 `wails dev` - Wails 会自动在 `frontend/wailsjs/` 生成绑定
4. 在 React 中导入使用: `import { YourMethod } from '../wailsjs/go/main/App';`

### 前后端数据流
1. React 组件调用 Wails 生成的 Go 绑定
2. Go 方法处理请求，调用 GitHub 服务
3. 响应通过 JSON 序列化，返回到前端
4. React 状态更新，触发重新渲染

### 语言筛选
语言选项在 `MainLayout.tsx` 中硬编码。要添加新语言，在 `languageOptions` 数组中添加，并可选地在 `ProjectCard.tsx` 的 `languageColors` 中添加颜色。


