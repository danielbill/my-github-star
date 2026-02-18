import React, { useState } from 'react';
import {
  Title,
  Flex,
  ActionIcon,
  Avatar,
  SegmentedControl,
} from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { TimeRange, LanguageFilter } from '../types';

type ViewScope = 'all' | 'mine';
type ViewPeriod = 'weekly' | 'monthly';

interface MainLayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  language: LanguageFilter;
  onLanguageChange: (value: LanguageFilter) => void;
  repositoryCount: number;
  lastUpdate?: Date;
}

const timeRangeOptions = [
  { value: 'daily', label: '今日' },
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' },
];

const languageOptions = [
  { value: '', label: '全部语言' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Go', label: 'Go' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Java', label: 'Java' },
  { value: 'C++', label: 'C++' },
  { value: 'Vue', label: 'Vue' },
  { value: 'HTML', label: 'HTML' },
];

export function MainLayout({
  children,
  onRefresh,
  loading,
  timeRange,
  onTimeRangeChange,
  language,
  onLanguageChange,
  repositoryCount,
  lastUpdate,
}: MainLayoutProps) {
  const [viewScope, setViewScope] = useState<ViewScope>('all');
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('weekly');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#212830' }}>
      <header className="custom-header" style={{
        height: 50,
        backgroundColor: '#212830',
        borderBottom: '0px solid #3f4b5c',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Title order={4} c="#a0a0a0" style={{ margin: 0, lineHeight: 1.2 }}>
            GitHub Stars
          </Title>

          <Flex gap="lg" align="center">          

            {/* 时间切换 */}
            <SegmentedControl
              data={[{ value: 'weekly', label: '本周' }, { value: 'monthly', label: '本月' }]}
              value={viewPeriod}
              onChange={(value) => setViewPeriod(value as ViewPeriod)}
              size="xs"
              styles={{
                root: {
                  backgroundColor: '#3f4b5c',
                  border: '1px solid #4a576a',
                  borderRadius: '4px',
                  padding: '2px',
                  height: '30px',
                },
                indicator: {
                  backgroundColor: '#4a576a',
                  borderRadius: '2px',
                  height: 'calc(100% - 4px)',
                  margin: '-1px',
                },
                label: {
                  color: '#a0a0a0',
                  fontSize: '12px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                  zIndex: 2,
                  position: 'relative',
                },
              }}
            />

            {/* 用户登录/头像 */}
            {isLoggedIn ? (
              <Avatar
                radius="xl"
                size={30}
                src="/avatar-placeholder.png"
                alt="User"
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={() => setIsLoggedIn(true)}
                styles={{
                  root: {
                    backgroundColor: '#3f4b5c',
                    color: '#a0a0a0',
                    '&:hover': {
                      backgroundColor: '#4a576a',
                    },
                  },
                }}
              >
                <IconBrandGithub size={20} />
              </ActionIcon>
            )}
          </Flex>
        </div>
      </header>

      <main style={{ paddingTop: '60px', paddingLeft: '18px', paddingRight: '18px', paddingBottom: '18px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: '18px' }}>
          <div style={{ flex: 6 }}>
            {children}
          </div>
          <div style={{ flex: 4 }}>
            {/* 我的列表 */}
          </div>
        </div>
      </main>
    </div>
  );
}
