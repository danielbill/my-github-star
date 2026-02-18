import React, { useEffect, useState } from 'react';
import { Paper, Text, Stack, Group, Anchor, ScrollArea, LoadingOverlay, ActionIcon, Tooltip } from '@mantine/core';
import { IconStarFilled, IconBrandGithub, IconRefresh } from '@tabler/icons-react';
import { Repository } from '../types';
import { GetStarredRepositories } from '../../wailsjs/go/backend/App';
import { useAuth } from '../hooks/useAuth';
import { OpenURL } from '../../wailsjs/go/backend/App';
import classes from './StarredSidebar.module.css';

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

interface StarredRepoItemProps {
  repository: Repository;
}

function StarredRepoItem({ repository }: StarredRepoItemProps) {
  const handleTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    OpenURL(repository.html_url);
  };

  return (
    <div className={classes.repoItem}>
      <Group gap="xs" align="center" wrap="nowrap" mb="xs">
        <IconBrandGithub size={16} className={classes.repoIcon} />
        <Anchor
          href={repository.html_url}
          onClick={handleTitleClick}
          fw={600}
          size="sm"
          className={classes.repoLink}
          lineClamp={1}
        >
          {repository.full_name}
        </Anchor>
        <IconStarFilled size={13} className={classes.starIcon} />
        <Text size="xs" c="var(--color-text-secondary)">
          {formatStars(repository.stargazers_count)}
        </Text>
      </Group>
    </div>
  );
}

export function StarredSidebar() {
  const { isLoggedIn } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      loadStarredRepos();
    } else {
      setRepositories([]);
    }
  }, [isLoggedIn]);

  const loadStarredRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const repos = await GetStarredRepositories();
      setRepositories(repos || []);
    } catch (err) {
      console.error('加载星标仓库失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Paper
      radius="lg"
      style={{
        backgroundColor: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border-default)',
        height: '100%',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className={classes.header} >
        <Text size="sm" fw={600} className={classes.headerTitle}>
          个人星标仓库 [{repositories.length}]
        </Text>
        
      </div>

      <ScrollArea flex={1}>
        <div className={classes.content}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 0 }} />

          {error && (
            <Text size="sm" c="var(--color-error)" ta="center" py="md">
              {error}
            </Text>
          )}

          {!loading && !error && repositories.length === 0 && (
            <Text size="sm" c="var(--color-text-secondary)" ta="center" py="md">
              暂无星标仓库
            </Text>
          )}

          <Stack gap="xs">
            {repositories.map((repo) => (
              <StarredRepoItem key={repo.id} repository={repo} />
            ))}
          </Stack>
        </div>
      </ScrollArea>
    </Paper>
  );
}
