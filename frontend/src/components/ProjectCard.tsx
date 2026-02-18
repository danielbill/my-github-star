import React from 'react';
import { Card, Badge, Group, Text, Anchor, ActionIcon, Tooltip } from '@mantine/core';
import { IconStar, IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Repository } from '../types';
import classes from './ProjectCard.module.css';

interface ProjectCardProps {
  repository: Repository;
}

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

export function ProjectCard({ repository }: ProjectCardProps) {
  const openRepo = () => {
    window.open(repository.html_url, '_blank');
  };

  // 解析 owner 和 repo 名称
  const [owner, repoName] = repository.full_name.split('/');

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className={classes.card}
      component={Link}
      to={`/repo/${owner}/${repoName}`}
      style={{ cursor: 'pointer' }}
    >
      <Card.Section inheritPadding withBorder py="xs">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBrandGithub size={18} />
            <Text fw={500} size="lg">{repository.full_name}</Text>
          </Group>
          <Tooltip label="在 GitHub 中打开">
            <ActionIcon variant="subtle" color="gray" onClick={(e) => { e.preventDefault(); openRepo(); }}>
              <IconExternalLink size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card.Section>

      <Text size="sm" c="dimmed" mt="sm" lineClamp={2} className={classes.description}>
        {repository.description}
      </Text>

      <Group gap="xs" mt="md">
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
          >
            {repository.language}
          </Badge>
        )}
      </Group>

      <Group justify="space-between" mt="md">
        <Group gap="xs">
          <IconStar size={16} color="#e3b341" />
          <Text size="sm" fw={500}>
            {formatStars(repository.stargazers_count)} stars
          </Text>
        </Group>
        <Anchor
          size="xs"
          c="dimmed"
          component={Link}
          to={`/repo/${owner}/${repoName}`}
          onClick={(e) => e.stopPropagation()}
        >
          在 GitHub 中打开 →
        </Anchor>
      </Group>
    </Card>
  );
}
