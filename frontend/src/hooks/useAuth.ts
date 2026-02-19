import { useState, useEffect, useCallback } from 'react';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';
import {
  StartLogin,
  Logout,
  OpenURL,
  StartDeviceFlowLogin,
  IsLoggedIn,
  GetCurrentUser,
  ForceRefreshUserStarRepo,
} from '../../wailsjs/go/backend/App';
import { GitHubUser, DeviceFlowInfo } from '../types';
import { ClipboardSetText } from '../../wailsjs/runtime/runtime';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [verificationUri, setVerificationUri] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 应用启动时检查登录状态（自动登录）
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await IsLoggedIn();
        if (loggedIn) {
          const userData = await GetCurrentUser();
          console.log('[useAuth] 自动登录成功:', userData);
          setIsLoggedIn(true);
          setUser(userData as GitHubUser);
        }
      } catch (error) {
        console.error('[useAuth] 检查登录状态失败:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    checkLoginStatus();
  }, []);

  // 监听登录成功事件
  useEffect(() => {
    const handleLoginSuccess = async (userData: any) => {
      console.log('[useAuth] 收到 login-success 事件:', userData);
      
      // 先强制刷新星标仓库到数据库，再更新状态
      try {
        console.log('[useAuth] 强制刷新星标仓库...');
        await ForceRefreshUserStarRepo();
        console.log('[useAuth] 星标仓库刷新完成');
      } catch (err) {
        console.error('[useAuth] 刷新星标仓库失败:', err);
      }
      
      // 刷新完成后再更新状态，触发 UI 更新
      setIsLoggedIn(true);
      setUser(userData as GitHubUser);
      setIsLoading(false);
      setDeviceCode(null);
    };

    console.log('[useAuth] 注册 login-success 事件监听器');
    EventsOn('login-success', handleLoginSuccess);

    return () => {
      console.log('[useAuth] 注销 login-success 事件监听器');
      EventsOff('login-success');
    };
  }, []);

  // 监听登出事件
  useEffect(() => {
    const handleLogoutSuccess = () => {
      setIsLoggedIn(false);
      setUser(null);
    };

    EventsOn('logout-success', handleLogoutSuccess);

    return () => {
      EventsOff('logout-success');
    };
  }, []);

  // 登录方式 1: OAuth 授权码流程（需要 Client Secret）
  const loginWithOAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const authURL = await StartLogin();
      // 打开浏览器
      await OpenURL(authURL);
      setIsLoading(false);
    } catch (error) {
      console.error('OAuth 登录失败:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  // 登录方式 2: Device Flow（无需 Client Secret）
  const loginWithDeviceFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = (await StartDeviceFlowLogin()) as DeviceFlowInfo;

      // 显示用户码
      setDeviceCode(info.user_code);
      
      // 保存验证 URI，不自动打开浏览器
      const complete = (info as any).verification_uri_complete as string | undefined;
      const uri = complete && complete.trim() ? complete : info.verification_uri;
      setVerificationUri(uri);

      // 复制到剪贴板
      try {
        await ClipboardSetText(info.user_code);
      } catch {
        // clipboard is best-effort; do not block login flow
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Device Flow 登录失败:', error);
      setIsLoading(false);
      setDeviceCode(null);
      setVerificationUri(null);
      throw error;
    }
  }, []);

  // 打开验证页面
  const openVerificationPage = useCallback(async () => {
    if (verificationUri) {
      await OpenURL(verificationUri);
    }
  }, [verificationUri]);

  // 登出
  const logout = useCallback(async () => {
    try {
      await Logout();
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }, []);

  return {
    isLoggedIn,
    user,
    isLoading,
    deviceCode,
    verificationUri,
    loginWithOAuth,
    loginWithDeviceFlow,
    openVerificationPage,
    logout,
  };
}
