# GitHub Stars 桌面应用

## What This Is

一个使用 Wails 框架构建的桌面应用，用于浏览 GitHub 趋势项目和管理用户星标的仓库。支持每日、每周、每月的 GitHub Trending 数据浏览，以及用户已星标仓库的本地缓存查看。

## Core Value

让用户快速浏览 GitHub 趋势项目，方便发现优质开源项目，并提供本地缓存功能提升浏览体验。

## Requirements

### Validated

- ✓ GitHub 趋势数据浏览 — 支持每日、每周、每月趋势切换
- ✓ 趋势数据本地缓存 — 使用 SQLite 数据库存储，减少 API 调用
- ✓ GitHub OAuth 认证 — 支持 Device Flow 和 Authorization Code Flow 两种登录方式
- ✓ 用户星标仓库管理 — 从 GitHub API 获取并缓存用户星标的仓库
- ✓ 项目详情查看 — 点击项目卡片查看完整描述、编程语言、星标数等信息
- ✓ 手动刷新功能 — 用户可手动刷新趋势数据和星标仓库
- ✓ 项目搜索和筛选 — 支持按语言和关键词筛选趋势项目
- ✓ 深色主题 — 使用 Mantine UI 框架实现深色主题界面

### Active

- [ ] **UI-01**: 用户设置页面 — 支持配置刷新间隔（默认1小时）和 GitHub 克隆目录（默认 d:\github）
  - 设置入口位于登录图标左侧
  - 点击设置图标后，header 标题切换为"设置"

### Out of Scope

- 多语言本地化（i18n） — 当前仅支持中文界面
- 移动端响应式设计 — 桌面应用专注于桌面体验
- 实时推送通知 — 依赖手动刷新或定时刷新机制
- GitHub 仓库克隆功能 — 仅配置克隆目录，不实现实际克隆逻辑

## Context

**技术环境**：
- 桌面应用框架：Wails v2 (Go 1.24 + React 18)
- 前端 UI：Mantine v8 框架，Tabler Icons 图标库
- 数据库：SQLite with GORM ORM
- GitHub API 集成：支持官方 API 和网页抓取（无速率限制）
- 认证方式：OAuth 2.0 (支持 Device Flow 和 Authorization Code Flow)

**现有功能状态**：
- 趋势数据存储在 `shared/trending.db` SQLite 数据库
- 用户配置存储在 `shared/app-config.toml` TOML 文件
- 认证凭证和用户信息存储在配置文件中
- 应用启动时自动加载趋势数据

**已知问题**：
- 无用户设置界面，无法自定义刷新间隔等参数
- 刷新间隔硬编码在 `backend/app.go` 中

## Constraints

- **技术栈**: 必须使用现有的 Wails + React + Mantine 技术栈
- **向后兼容**: 修改配置文件格式需支持现有配置文件的无缝升级
- **性能**: 趋势数据刷新不应阻塞 UI，使用后台任务
- **跨平台**: 配置文件路径需适配 Windows/macOS/Linux

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 使用 Device Flow 作为主要认证方式 | 无需 Client Secret，更适合桌面应用 | ✓ Good |
| 使用网页抓获取趋势数据 | GitHub 无官方趋势 API，抓取无速率限制 | ✓ Good |
| SQLite 用于数据持久化 | 轻量级、无需额外部署，适合桌面应用 | ✓ Good |
| Mantine UI 框架 | 提供完整的组件库和深色主题支持 | ✓ Good |

---
*Last updated: 2026-02-19 after initialization*
