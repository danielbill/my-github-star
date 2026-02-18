# GitHub 登录配置指南

## 两种登录方式

应用支持两种 GitHub 登录方式：

### 方式 1：OAuth 授权码登录（需要 Client Secret）

- ✅ 用户体验最佳（点击授权即可）
- ❌ 需要创建 GitHub OAuth App
- ❌ 需要配置 Client Secret

### 方式 2：设备码登录（推荐，无需 Client Secret）

- ✅ 只需要 Client ID
- ✅ 无需配置 Client Secret
- ⚠️ 需要手动输入验证码

**默认使用方式 2（设备码登录）**

---

## 配置文件位置

`~/github-star-app/app-config.toml`

### Windows
`C:\Users\你的用户名\github-star-app\app-config.toml`

---

## 方式 2：设备码登录（推荐）

### 步骤 1：创建 GitHub OAuth App

1. 访问 https://github.com/settings/developers
2. 点击 **"OAuth Apps"** -> **"New OAuth App"**
3. 填写应用信息：
   - **Application name**: `GitHub Star Tracker`
   - **Homepage URL**: `http://localhost`
   - **Application description**: `Desktop app for tracking GitHub trending repositories`
   - **Authorization callback URL**: `http://localhost:36542/callback`（方式1需要，方式2可不填）
4. 点击 **"Register application"**
5. 只需要记录 **Client ID**

### 步骤 2：配置应用

编辑 `~/github-star-app/app-config.toml`：

```toml
[github]
client_id = "你的GitHub_Client_ID"
# client_secret 不需要，留空即可

[preferences]
login_method = "device"  # 使用设备码登录（方式2）

[auth]
access_token = ""
user_id = 0
login = ""
name = ""
avatar_url = ""
```

### 步骤 3：登录流程

1. 启动应用，点击右上角 GitHub 图标
2. 点击「方式 1：设备码登录」
3. 浏览器自动打开验证页面
4. 应用显示 8 位验证码
5. 在浏览器中输入验证码并点击「Continue」
6. 点击「Authorize」授权
7. 应用自动完成登录

---

## 方式 1：OAuth 授权登录（需要 Client Secret）

如果你有完整的 OAuth App 配置（包含 Client Secret），可以使用这种方式，体验更流畅。

### 配置

```toml
[github]
client_id = "你的GitHub_Client_ID"
client_secret = "你的GitHub_Client_Secret"

[preferences]
login_method = "oauth"  # 使用 OAuth 登录（方式1）

[auth]
access_token = ""
user_id = 0
login = ""
name = ""
avatar_url = ""
```

---

## 配置字段说明

| 字段 | 说明 |
|------|------|
| `github.client_id` | GitHub OAuth App 的 Client ID（必需） |
| `github.client_secret` | GitHub OAuth App 的 Client Secret（仅方式1需要） |
| `preferences.login_method` | 登录方式：`oauth` 或 `device`，默认 `device` |
| `auth.access_token` | 登录后自动填充 |
| `auth.user_id` | 登录后自动填充 |
| `auth.login` | 登录后自动填充 |
| `auth.name` | 登录后自动填充 |
| `auth.avatar_url` | 登录后自动填充 |

---

## 系统设置

后续将在系统设置界面提供登录方式切换功能。


