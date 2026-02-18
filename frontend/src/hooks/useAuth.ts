import { useState, useEffect, useCallback } from 'react';
import { EventsOn, EventsOff } from '../../wailsjs/runtime/runtime';
import {
  GetCurrentUser,
  IsLoggedIn,
  StartLogin,
  Logout,
  OpenURL,
  StartDeviceFlowLogin,
  OpenVerificationURL,
} from '../../wailsjs/go/backend/App';
import { GitHubUser, DeviceFlowInfo } from '../types';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceFlowInfo, setDeviceFlowInfo] = useState<DeviceFlowInfo | null>(null);

  // 初始化：检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await IsLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const currentUser = await GetCurrentUser();
          if (currentUser) {
            setUser(currentUser as GitHubUser);
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 监听登录成功事件
  useEffect(() => {
    const handleLoginSuccess = (userData: any) => {
      setIsLoggedIn(true);
      setUser(userData as GitHubUser);
      setIsLoading(false);
      setDeviceFlowInfo(null); // 清除 Device Flow 信息
    };

    EventsOn('login-success', handleLoginSuccess);

    return () => {
      EventsOff('login-success');
    };
  }, []);

  // 监听登出事件
  useEffect(() => {
    const handleLogoutSuccess = () => {
      setIsLoggedIn(false);
      setUser(null);
      setDeviceFlowInfo(null);
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
      const info = await StartDeviceFlowLogin();
      setDeviceFlowInfo(info as DeviceFlowInfo);
      setIsLoading(false);
      // 自动打开验证页面
      await OpenVerificationURL();
    } catch (error) {
      console.error('Device Flow 登录失败:', error);
      setIsLoading(false);
      throw error;
    }
  }, []);

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
    deviceFlowInfo,
    setDeviceFlowInfo,
    loginWithOAuth,
    loginWithDeviceFlow,
    logout,
  };
}
