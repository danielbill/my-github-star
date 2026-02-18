import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Badge,
  Group,
  Button,
  Stack,
  Loader,
  Alert,
  Breadcrumbs,
  Anchor,
} from '@mantine/core';
import { IconStar, IconBrandGithub, IconArrowLeft } from '@tabler/icons-react';
import { GetRepositoryByID } from '../../wailsjs/go/backend/App';
import { Repository } from '../types';
import classes from './ProjectDetail.module.css';

// 编程语言颜色映射
const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#239120',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
};

// 格式化星标数字
function formatStars(stars: number): string {
  if (stars >= 1000000) {
    return `${(stars / 1000000).toFixed(1)}M`;
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}K`;
  }
  return stars.toString();
}

// 获取语言颜色
function getLanguageColor(language: string): string {
  return languageColors[language] || '#8b949e';
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ProjectDetail() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const navigate = useNavigate();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRepository = async () => {
      if (!owner || !name) {
        setError('缺少项目参数');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await GetRepositoryByID(owner, name);
        setRepository(result);
      } catch (err) {
        console.error('获取项目详情失败:', err);
        setError(err instanceof Error ? err.message : '获取项目详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [owner, name]);

  const handleGoBack = () => {
    navigate('/');
  };

  const openGitHub = () => {
    if (repository?.html_url) {
      window.open(repository.html_url, '_blank');
    }
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Stack align="center">
          <Loader size="lg" />
          <Text c="dimmed">加载项目详情中...</Text>
        </Stack>
      </Container>
    );
  }

  if (error || !repository) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red" title="加载失败">
          {error || '项目未找到'}
        </Alert>
        <Button mt="md" leftSection={<IconArrowLeft size={16} />} onClick={handleGoBack}>
          返回列表
        </Button>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      {/* 面包屑导航 */}
      <Breadcrumbs mb="md">
        <Anchor component={Link} to="/">
          首页
        </Anchor>
        <Text c="dimmed">{repository.full_name}</Text>
      </Breadcrumbs>

      <Paper shadow="sm" p="xl" radius="md" withBorder>
        {/* 头部：名称和操作按钮 */}
        <Group justify="space-between" align="flex-start" mb="lg">
          <Stack gap="xs">
            <Group gap="xs">
              <IconBrandGithub size={24} />
              <Title order={2}>{repository.full_name}</Title>
            </Group>
            {repository.language && (
              <Badge
                leftSection={
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: getLanguageColor(repository.language),
                    }}
                  />
                }
                color="gray"
                variant="light"
                size="lg"
              >
                {repository.language}
              </Badge>
            )}
          </Stack>

          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconArrowLeft size={16} />}
              onClick={handleGoBack}
            >
              返回列表
            </Button>
            <Button
              leftSection={<IconBrandGithub size={16} />}
              onClick={openGitHub}
            >
              在 GitHub 中打开
            </Button>
          </Group>
        </Group>

        {/* 描述 */}
        {repository.description && (
          <Text size="lg" mb="xl" className={classes.description}>
            {repository.description}
          </Text>
        )}

        {/* 统计信息 */}
        <Group gap="xl" mb="xl">
          <Group gap="xs">
            <IconStar size={20} color="#e3b341" />
            <Text size="lg" fw={500}>
              {formatStars(repository.stargazers_count)} <Text span c="dimmed" fw={400}>Stars</Text>
            </Text>
          </Group>
        </Group>

        {/* 时间信息 */}
        <Stack gap="xs">
          <Text size="sm">
            <Text span c="dimmed">创建时间：</Text>
            {formatDate(repository.created_at)}
          </Text>
          <Text size="sm">
            <Text span c="dimmed">更新时间：</Text>
            {formatDate(repository.updated_at)}
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
}
