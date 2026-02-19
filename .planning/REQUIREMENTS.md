# Requirements

**Created:** 2026-02-19

## v1 Requirements

### Settings UI

- [ ] **UI-01**: 在应用主界面添加设置入口
  - 入口位置：登录图标左侧
  - 使用 Tabler Icons 的设置图标（IconSettings）
  - 图标样式与现有登录图标保持一致

- [ ] **UI-02**: 创建设置页面组件
  - 页面标题：Header 显示"设置"
  - 页面布局：使用 Mantine 的 Card 或 Stack 组件
  - 响应式设计：适配不同窗口大小

- [ ] **UI-03**: 刷新间隔配置项
  - 控件类型：数字输入框（NumberInput）
  - 默认值：0.5 小时
  - 单位显示：在输入框后显示"小时"标签
  - 验证规则：最小值 0.1 小时，最大值 24 小时

- [ ] **UI-04**: GitHub 克隆目录配置项
  - 控件类型：文件夹路径输入 + 打开目录按钮
  - 默认值：d:\github
  - 打开目录按钮：点击后弹出文件夹选择对话框
  - 选择后更新：用户选择的目录路径自动填充到输入框
  - 跨平台：适配 Windows/macOS/Linux 路径格式

- [ ] **UI-05**: 设置页面导航
  - 点击设置图标时切换到设置视图
  - Header 标题从当前视图标题切换为"设置"
  - 支持返回主视图

### Settings Persistence

- [ ] **PERS-01**: 保存刷新间隔到配置文件
  - 配置文件：shared/app-config.toml
  - 配置字段：添加到 AppConfig 结构
  - 保存时机：用户修改后自动保存

- [ ] **PERS-02**: 保存 GitHub 克隆目录到配置文件
  - 配置文件：shared/app-config.toml
  - 配置字段：添加到 AppConfig 结构
  - 保存时机：用户修改后自动保存

### Settings Backend API

- [ ] **API-01**: 创建后端配置读取方法
  - 方法名：GetSettings()
  - 返回值：包含刷新间隔和克隆目录的配置对象
  - 位置：backend/app.go

- [ ] **API-02**: 创建后端配置更新方法
  - 方法名：UpdateSettings(settings)
  - 参数：包含刷新间隔和克隆目录的配置对象
  - 位置：backend/app.go
  - 验证：参数有效性验证（间隔范围、路径有效性）

- [ ] **API-03**: 集成刷新间隔到趋势数据刷新逻辑
  - 读取配置文件中的刷新间隔
  - 应用到趋势数据刷新定时器
  - 位置：backend/app.go

## v2 Requirements (Deferred)

- [ ] **UI-06**: 设置页面分组（UI、数据、高级）
- [ ] **UI-07**: 更多配置项（主题切换、日志级别等）
- [ ] **PERS-03**: 配置导入/导出功能

## Out of Scope

- [GitHub 仓库实际克隆功能] — 仅配置克隆目录路径，不实现 git clone 逻辑
- [多语言支持（i18n）] — 仅中文界面
- [设置历史/回滚功能] — 不保留配置历史记录

## Traceability

| REQ-ID | Description | Phase | Status |
|---------|-------------|--------|--------|
| UI-01 | 设置入口 | Phase 1 | Pending |
| UI-02 | 设置页面组件 | Phase 1 | Pending |
| UI-03 | 刷新间隔配置 | Phase 1 | Pending |
| UI-04 | 克隆目录配置 | Phase 1 | Pending |
| UI-05 | 设置页面导航 | Phase 1 | Pending |
| PERS-01 | 保存刷新间隔 | Phase 1 | Pending |
| PERS-02 | 保存克隆目录 | Phase 1 | Pending |
| API-01 | 读取配置方法 | Phase 1 | Pending |
| API-02 | 更新配置方法 | Phase 1 | Pending |
| API-03 | 集成刷新间隔 | Phase 1 | Pending |

**Coverage:** 11/11 requirements mapped (100%)
