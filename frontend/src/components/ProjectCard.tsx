import React from 'react';
import { Badge, Group, Text, Anchor, Button, Flex } from '@mantine/core';
import { IconStar, IconBrandGithub, IconStarFilled, IconGitFork } from '@tabler/icons-react';
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
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  Julia: '#a270ba',
  R: '#198CE7',
  Matlab: '#e16737',
  Jupyter: '#F37626',
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
  const [owner, repoName] = repository.full_name.split('/');

  return (
    <div className={classes.cardItem}>
      <Flex justify="space-between" align="flex-start" gap="md">
        {/* 左侧内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 项目名称 */}
          <Group gap="xs" align="center" mb="xs">
            <IconBrandGithub size={16} className={classes.repoIcon} />
            <Anchor
              component={Link}
              to={`/repo/${owner}/${repoName}`}
              onClick={(e) => e.stopPropagation()}
              fw={600}
              size="sm"
              className={classes.repoLink}
            >
              {repository.full_name}
            </Anchor>
          </Group>

          {/* 描述 */}
          <Text size="sm" c="var(--color-text-secondary)" mb="sm" className={classes.description}>
            {repository.description || 'No description provided'}
          </Text>

          {/* 元数据 */}
          <Flex gap="lg" align="center" wrap="wrap">
            {repository.language && (
              <Flex gap="xs" align="center" className={classes.metadataItem}>
                <span
                  className={classes.languageDot}
                  style={{ backgroundColor: getLanguageColor(repository.language) }}
                />
                <Text size="xs" c="var(--color-text-secondary)">{repository.language}</Text>
              </Flex>
            )}

            {repository.stargazers_count > 0 && (
              <Flex gap="4" align="center" className={classes.metadataItem}>
                <IconStar size={13} className={classes.starIcon} />
                <Text size="xs" c="var(--color-text-secondary)">
                  {formatStars(repository.stargazers_count)}
                </Text>
              </Flex>
            )}

            {repository.forks_count > 0 && (
              <Flex gap="4" align="center" className={classes.metadataItem}>
                <IconGitFork size={13} className={classes.forkIcon} />
                <Text size="xs" c="var(--color-text-secondary)">
                  {formatStars(repository.forks_count)}
                </Text>
              </Flex>
            )}
          </Flex>
        </div>

        {/* 右侧操作按钮 */}
        <Button
          variant="light"
          color="gray"
          size="xs"
          radius="sm"
          leftSection={<IconStarFilled size={14} />}
          className={classes.starButton}
          styles={{
            root: {
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border-muted)',
              color: 'var(--color-text-secondary)',
              '&:hover': {
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-text-secondary)',
                color: 'var(--color-warning)',
              },
            },
          }}
        >
          Star
        </Button>
      </Flex>
    </div>
  );
}
