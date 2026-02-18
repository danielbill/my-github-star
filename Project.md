# My GitHub Star  - 项目文档

## 项目概述

My GitHub Star  是一个使用 Wails v2 构建的桌面应用程序，用于展示 GitHub 趋势仓库。支持按编程语言和时间范围筛选，并查看项目详情。

## 技术栈

### 后端 (Go)
| 技术              | 版本    | 说明             |
| ----------------- | ------- | ---------------- |
| Go                | 1.23    | 后端语言         |
| Wails             | v2.11.0 | 桌面应用框架     |
| GitHub Search API | -       | 获取趋势仓库数据 |

### 前端 (React + TypeScript)
| 技术         | 版本   | 说明     |
| ------------ | ------ | -------- |
| React        | 18.2.0 | UI 框架  |
| TypeScript   | 5.9.3  | 类型系统 |
| Mantine UI   | 8.3.15 | 组件库   |
| React Router | 7.13.0 | 路由管理 |
| Vite         | 3.0.7  | 构建工具 |
| Tabler Icons | 3.36.1 | 图标库   |

---

## 目录结构

```
my-github-star/
├── main.go                      # Wails 入口点
├── go.mod                       # Go 模块定义
├── wails.json                   # Wails 配置
├── .gitignore                   # Git 忽略文件
│
├── backend/                     # Go 后端服务
│   ├── app.go                   # App 结构体和 Wails 绑定方法
│   ├── github/                  # GitHub API 服务
│   │   └── service.go           # GitHub API 集成
│   └── models/                  # 数据模型
│       └── repository.go        # 仓库数据模型
│
├── frontend/                    # React 前端
│   ├── package.json             # 前端依赖
│   ├── vite.config.js           # Vite 配置
│   ├── src/
│   │   ├── App.tsx              # 主应用组件（路由配置）
│   │   ├── main.tsx             # React 入口
│   │   ├── types/               # TypeScript 类型
│   │   │   └── index.ts
│   │   ├── components/          # UI 组件
│   │   │   ├── MainLayout.tsx   # 顶部栏（筛选器、刷新按钮）
│   │   │   ├── ProjectList.tsx  # 项目列表网格
│   │   │   ├── ProjectCard.tsx  # 项目卡片
│   │   │   └── ProjectDetail.tsx # 项目详情页
│   │   └── wailsjs/             # Wails 生成的绑定
│   │       └── go/
│   │           └── backend/
│   │               └── App.js   # Go 方法调用
│   └── dist/                     # 构建输出（gitignore）
│
├── build/                       # Wails 构建配置
│   ├── appicon.png              # 应用图标
│   ├── windows/                 # Windows 构建配置
│   └── darwin/                  # macOS 构建配置
│
└── docs/                        # 项目文档
    ├── 快速原型.md
    ├── 框架图.md
    ├── 技术栈.md
    └── 功能模块.md
```

---

## 常用命令

### 开发
```bash
# 启动开发模式（支持热重载）
wails dev
```

### 构建
```bash
# 构建生产版本二进制文件
wails build
```

### 前端
```bash
# 安装前端依赖
cd frontend && npm install

# 前端开发服务器（通常由 wails dev 自动调用）
cd frontend && npm run dev

# 前端构建
cd frontend && npm run build
```


## 开发注意事项

1. **Wails 绑定生成**：修改 Go 后端方法后，Wails 会自动重新生成绑定文件到 `frontend/wailsjs/`
2. **类型一致**：前端 `types/index.ts` 中的 `Repository` 接口需与 Go 模型保持一致
3. **字段命名**：Go 结构体字段名与 JSON 标签保持一致（如 `StargazersCount` / `stargazers_count`）
4. **热重载**：开发模式下前端修改会自动刷新，Go 修改需要重启，AI不要反复关闭重启服务！
5. **测试脚本**：测试脚本统一放在 tests/目录下

---

## 实现进度

### 已完成 ✅

| 功能                       | 状态 |
| -------------------------- | ---- |
| 项目脚手架                 | ✅    |
| GitHub Search API 集成     | ✅    |
| 趋势仓库列表展示           | ✅    |
| 按编程语言筛选             | ✅    |
| 按时间范围筛选（日/周/月） | ✅    |
| 项目详情页                 | ✅    |
| 页面路由（列表 ↔ 详情）    | ✅    |
| 返回列表功能               | ✅    |
| 在 GitHub 中打开           | ✅    |
| 代码结构对齐 plan          | ✅    |

### 待实现 📋

| 功能                   | 优先级 |
| ---------------------- | ------ |
| 数据持久化（本地缓存） | 中     |
| GitHub OAuth 登录      | 低     |
| AI 项目摘要            | 低     |
| Star 增长图表          | 低     |
| 新闻和视频搜索         | 低     |

---

## API 接口

### 后端方法（Wails 绑定）

| 方法                                       | 参数                            | 返回值                | 说明             |
| ------------------------------------------ | ------------------------------- | --------------------- | ---------------- |
| `GetTrendingRepositories(language, since)` | language: string, since: string | `[]models.Repository` | 获取趋势仓库列表 |
| `RefreshRepositories()`                    | -                               | `[]models.Repository` | 刷新（默认参数） |
| `GetCachedRepositories()`                  | -                               | `[]models.Repository` | 获取缓存数据     |
| `GetRepositoryByID(owner, repo)`           | owner: string, repo: string     | `*models.Repository`  | 获取单个仓库详情 |

### 数据模型

```go
// Repository 仓库数据
type Repository struct {
    ID               int64        // 仓库 ID
    Name             string       // 仓库名称
    FullName         string       // 完整名称 (owner/repo)
    Owner            string       // 所有者
    Description      string       // 描述
    Language         string       // 主要编程语言
    StargazersCount  int          // Star 数量
    HTMLURL          string       // GitHub URL
    CreatedAt        JSONDateTime // 创建时间
    UpdatedAt        JSONDateTime // 更新时间
}
```

---

## 路由结构

| 路径                 | 组件            | 说明       |
| -------------------- | --------------- | ---------- |
| `/`                  | `ProjectList`   | 项目列表页 |
| `/repo/:owner/:name` | `ProjectDetail` | 项目详情页 |

---
