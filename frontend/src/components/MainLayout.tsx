import React from 'react';
import {
  AppShell,
  Header,
  Title,
  Group,
  Button,
  Select,
  Container,
  Stack,
  Paper,
  Text,
  Badge,
} from '@mantine/core';
import { IconRefresh, IconBrandGithub } from '@tabler/icons-react';
import { TimeRange, LanguageFilter } from '../types';

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
  return (
    <AppShell
      header={{
        height: 60,
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="sm">
              <IconBrandGithub size={28} />
              <Title order={3}>GitHub Star Tracker</Title>
            </Group>
            <Group gap="sm">
              <Badge variant="light" size="lg">
                {repositoryCount} 个项目
              </Badge>
              {lastUpdate && (
                <Text size="xs" c="dimmed">
                  更新于 {lastUpdate.toLocaleTimeString()}
                </Text>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="xl">
          <Stack gap="lg">
            {/* 控制面板 */}
            <Paper p="md" withBorder>
              <Group justify="space-between">
                <Group gap="sm">
                  <Select
                    label="时间范围"
                    placeholder="选择时间范围"
                    data={timeRangeOptions}
                    value={timeRange}
                    onChange={(value) => onTimeRangeChange(value as TimeRange)}
                    style={{ width: 120 }}
                    size="sm"
                  />
                  <Select
                    label="编程语言"
                    placeholder="筛选语言"
                    data={languageOptions}
                    value={language}
                    onChange={onLanguageChange}
                    style={{ width: 140 }}
                    size="sm"
                    searchable
                    clearable
                  />
                </Group>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={onRefresh}
                  loading={loading}
                  variant="filled"
                >
                  刷新
                </Button>
              </Group>
            </Paper>

            {/* 主要内容 */}
            {children}
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
