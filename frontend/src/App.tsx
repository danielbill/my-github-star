import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { GetTrendingRepositories } from '../wailsjs/go/backend/App';
import { MainLayout } from './components/MainLayout';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { Repository, TimeRange, LanguageFilter } from './types';
import './App.css';

const theme = createTheme({
  primaryColor: 'blue',
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
      setRepositories(result || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('加载失败:', err);
      setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  }, [language, timeRange]);

  // 初始加载
  useEffect(() => {
    loadRepositories();
  }, []);

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
