---
created: 2026-02-19T01:18:35.396Z
title: Add settings page with refresh interval and GitHub clone directory
area: ui
files:
  - frontend/src/App.tsx
  - frontend/src/components/
  - backend/config/
---

## Problem

用户需要配置应用参数，当前缺少设置页面。需要支持：
1. 配置数据刷新间隔（默认1小时）
2. 配置GitHub仓库克隆目录（默认 d:\github）

设置入口应该位于登录图标左侧，点击后header标题切换为"设置"。

## Solution

创建设置页面：
1. 在 `frontend/src/App.tsx` 或主布局中添加设置图标（登录图标左侧）
2. 创建新的设置组件 `frontend/src/components/Settings.tsx` 或类似
3. 实现两个可配置参数：
   - 刷新间隔：数字输入，单位小时，默认值1
   - GitHub克隆目录：文件夹路径选择，默认值 d:\github
4. 点击设置图标时：
   - 切换到设置视图
   - Header标题更新为"设置"
5. 集成后端配置保存/读取（可能需要在 `backend/config/` 添加配置项）
