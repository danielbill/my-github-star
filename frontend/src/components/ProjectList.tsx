import React from 'react';
import { LoadingOverlay, Stack, Text, Paper, Center } from '@mantine/core';
import { IconDatabase, IconAlertCircle } from '@tabler/icons-react';
import { Repository } from '../types';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
  repositories: Repository[];
  loading: boolean;
  error?: string;
}

export function ProjectList({ repositories, loading, error }: ProjectListProps) {
  if (loading) {
    return (
      <Paper
        radius="lg"
        sx={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border-default)',
          minHeight: 400,
          position: 'relative',
        }}
      >
        <LoadingOverlay
          visible={loading}
          overlayProps={{ blur: 0 }}
          loaderProps={{ size: 'lg', color: '#58a6ff', type: 'bars' }}
        />
        <Stack align="center" gap="md" py={80}>
          <Text c="var(--color-text-secondary)" size="lg">
            正在加载项目...
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper
        radius="lg"
        p="xl"
        sx={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border-muted)',
          minHeight: 300,
        }}
      >
        <Stack align="center" gap="sm">
          <IconAlertCircle size={48} style={{ color: 'var(--color-error)' }} />
          <Text c="var(--color-error)" size="lg" fw={600}>
            加载失败
          </Text>
          <Text c="var(--color-text-secondary)" size="sm" ta="center" maw={400}>
            {error}
          </Text>
          <Text c="var(--color-text-muted)" size="xs" mt="xs">
            请检查网络连接后重试
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (repositories.length === 0) {
    return (
      <Paper
        radius="lg"
        p="xl"
        sx={{
          backgroundColor: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border-default)',
          minHeight: 300,
        }}
      >
        <Stack align="center" gap="md">
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconDatabase size={40} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
          <Text c="var(--color-text-primary)" size="lg" fw={500}>
            暂无数据
          </Text>
          <Text c="var(--color-text-secondary)" size="sm" maw={400} ta="center">
            尝试调整筛选条件或点击刷新按钮获取最新的趋势项目
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      {repositories.map((repo) => (
        <ProjectCard key={repo.id} repository={repo} />
      ))}
    </Stack>
  );
}
