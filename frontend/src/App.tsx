import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { LoadTrendingData, RefreshTrending } from '../wailsjs/go/backend/App';
import { MainLayout } from './components/MainLayout';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { StarredSidebar } from './components/StarredSidebar';
import { Settings } from './components/Settings';
import { Repository, TimeRange } from './types';
import './style.css';
import './App.css';
import '@mantine/core/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    dark: ['#212830', '#2a333f', '#343e4d', '#3f4b5c', '#4a576a', '#5a6a80', '#6a7a90', '#7a8aa0', '#8a9ab0', '#e6e6e6'],
    green: ['#212830', '#0e4429', '#006d32', '#26a641', '#3fb950', '#56d364', '#7ee787', '#a371f7', '#bc8cff', '#e2c5ff'],
    blue: ['#212830', '#0c2d6b', '#1158c7', '#1f6feb', '#388bfd', '#58a6ff', '#79c0ff', '#93d3ff', '#b6e3ff', '#d2e9ff'],
    orange: ['#212830', '#3d2906', '#845306', '#bf8700', '#d29922', '#e3b341', '#f2cc60', '#f8e3a1', '#faeea7', '#fff5c1'],
    gray: ['#2a333f', '#343e4d', '#3f4b5c', '#4a576a', '#5a6a80', '#6a7a90', '#7a8aa0', '#8a9ab0', '#a0a0b0', '#c0c0d0'],
  },
  fontSizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
  },
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  defaultRadius: 'md',
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  globalStyles: (theme) => ({
    body: {
      backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      lineHeight: 1.5,
    },
    '::-webkit-scrollbar': {
      width: '12px',
      height: '12px',
    },
    '::-webkit-scrollbar-track': {
      background: 'var(--color-bg-primary)',
    },
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--color-border-muted)',
      borderRadius: '6px',
      border: '3px solid var(--color-bg-primary)',
    },
    '::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'var(--color-border-accent)',
    },
  }),
});

function App() {
  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </MantineProvider>
  );
}

function AppContent() {
  const navigate = useNavigate();

  // 数据状态
  const [weeklyRepos, setWeeklyRepos] = useState<Repository[]>([]);
  const [monthlyRepos, setMonthlyRepos] = useState<Repository[]>([]);
  const [weeklyCacheTime, setWeeklyCacheTime] = useState<string>('');
  const [monthlyCacheTime, setMonthlyCacheTime] = useState<string>('');

  // UI 状态
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  // 当前显示的仓库列表
  const currentRepos = timeRange === 'weekly' ? weeklyRepos : monthlyRepos;
  const currentCacheTime = timeRange === 'weekly' ? weeklyCacheTime : monthlyCacheTime;

  // 加载初始数据
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await LoadTrendingData();
      if (result) {
        setWeeklyRepos(result.weekly.repositories || []);
        setMonthlyRepos(result.monthly.repositories || []);
        setWeeklyCacheTime(result.weekly.cached_at || '');
        setMonthlyCacheTime(result.monthly.cached_at || '');
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    setRefreshMessage('');

    try {
      const result = await RefreshTrending();
      if (result) {
        if (result.success) {
          setWeeklyRepos(result.weekly.repositories || []);
          setMonthlyRepos(result.monthly.repositories || []);
          setWeeklyCacheTime(result.weekly.cached_at || '');
          setMonthlyCacheTime(result.monthly.cached_at || '');
          setRefreshMessage(result.message || '刷新成功');
        } else {
          setRefreshMessage(result.message || '刷新失败');
        }
      }
    } catch (err) {
      console.error('刷新失败:', err);
      const errorMsg = err instanceof Error ? err.message : '刷新失败';
      setError(errorMsg);
      setRefreshMessage(errorMsg);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 处理导航
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <Routes>
      {/* 首页：项目列表 */}
      <Route
        path="/"
        element={
          <MainLayout
            onRefresh={handleRefresh}
            loading={loading}
            refreshing={refreshing}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            repositoryCount={currentRepos.length}
            cacheTime={currentCacheTime}
            refreshMessage={refreshMessage}
            error={error}
            onNavigate={handleNavigate}
          >
            <ProjectList
              repositories={currentRepos}
              loading={loading}
              error={error}
            />
          </MainLayout>
        }
      />
      {/* 设置页 */}
      <Route
        path="/settings"
        element={<Settings onNavigate={handleNavigate} />}
      />
      {/* 项目详情页 */}
      <Route path="/repo/:owner/:name" element={<ProjectDetail />} />
    </Routes>
  );
}

export default App;
