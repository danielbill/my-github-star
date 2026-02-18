import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { GetTrendingRepositories } from '../wailsjs/go/backend/App';
import { MainLayout } from './components/MainLayout';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { Repository, TimeRange, LanguageFilter } from './types';
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
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [language, setLanguage] = useState<LanguageFilter>('');
  const [lastUpdate, setLastUpdate] = useState<Date>();

  // 加载趋势仓库
  const loadRepositories = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await GetTrendingRepositories(language, timeRange);
      const repos = (result || []).map((repo: any) => ({
        ...repo,
        created_at: repo.created_at instanceof Date ? repo.created_at.toISOString() : String(repo.created_at),
      }));
      // 按照周期内新增星标数降序排序
      repos.sort((a, b) => (b.stars_since || 0) - (a.stars_since || 0));
      setRepositories(repos);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('加载失败:', err);
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [language, timeRange]);

  // 初始加载和当 timeRange 或 language 变化时重新加载
  useEffect(() => {
    loadRepositories();
  }, [timeRange, language]);

  // 刷新按钮
  const handleRefresh = () => {
    loadRepositories();
  };

  return (
    <MantineProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          {/* 首页：项目列表 */}
          <Route
            path="/"
            element={
              <MainLayout
                onRefresh={handleRefresh}
                loading={loading}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                language={language}
                onLanguageChange={setLanguage}
                repositoryCount={repositories.length}
                lastUpdate={lastUpdate}
              >
                <ProjectList
                  repositories={repositories}
                  loading={loading}
                  error={error}
                />
              </MainLayout>
            }
          />
          {/* 项目详情页 */}
          <Route path="/repo/:owner/:name" element={<ProjectDetail />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
