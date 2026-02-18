import React from 'react';
import { SimpleGrid, LoadingOverlay, Text, Center, Stack } from '@mantine/core';
import { IconDatabase } from '@tabler/icons-react';
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
      <div style={{ position: 'relative', minHeight: 400 }}>
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      </div>
    );
  }

  if (error) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="md">
          <Text c="red" size="lg" fw={500}>
            加载失败
          </Text>
          <Text c="dimmed">{error}</Text>
        </Stack>
      </Center>
    );
  }

  if (repositories.length === 0) {
    return (
      <Center style={{ minHeight: 400 }}>
        <Stack align="center" gap="md">
          <IconDatabase size={48} style={{ color: '#8b949e' }} />
          <Text c="dimmed" size="lg">
            暂无数据
          </Text>
          <Text c="dimmed" size="sm">
            点击刷新按钮获取最新的趋势项目
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, sm: 2, lg: 3 }}
      spacing="lg"
    >
      {repositories.map((repo) => (
        <ProjectCard key={repo.id} repository={repo} />
      ))}
    </SimpleGrid>
  );
}
