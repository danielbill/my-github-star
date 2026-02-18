// 仓库数据类型（与 Wails 生成的 models.Repository 保持一致）
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string;
  language: string;
  stargazers_count: number;
  stars_today?: number;      // 今日新增星标数
  stars_since?: number;      // 时间范围内新增星标数
  forks_count?: number;      // Fork 数量
  html_url: string;
  created_at: string;
  updated_at: string;
}

// GitHub 用户信息类型
export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio: string;
  location: string;
  blog: string;
  company: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

// 认证状态类型
export interface AuthState {
  isLoggedIn: boolean;
  user: GitHubUser | null;
  isLoading: boolean;
}

// Device Flow 登录信息
export interface DeviceFlowInfo {
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

// 登录方式类型
export type LoginMethod = 'oauth' | 'device';

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 时间范围类型
export type TimeRange = 'daily' | 'weekly' | 'monthly';

// 语言过滤类型
export type LanguageFilter = string;

// 排序类型
export type SortBy = 'stars' | 'name' | 'updated';
