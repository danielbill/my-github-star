import React, { useEffect, useState } from 'react';
import { Paper, Text, Stack, Group, Anchor, ScrollArea, LoadingOverlay, ActionIcon, Tooltip } from '@mantine/core';
import { IconStarFilled, IconBrandGithub, IconRefresh } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Repository } from '../types';
import { LoadUserStarRepo, RefreshUserStarRepo } from '../../wailsjs/go/backend/App';
import { useAuth } from '../hooks/useAuth';
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
  const [owner, repoName] = repository.full_name.split('/');

  const repoData = {
    id: repository.id,
    name: repository.name,
    full_name: repository.full_name,
    owner: repository.owner,
    description: repository.description,
    language: repository.language,
    stargazers_count: repository.stargazers_count,
    stars_today: repository.stars_today,
    stars_since: repository.stars_since,
    forks_count: repository.forks_count,
    html_url: repository.html_url,
    created_at: repository.created_at,
    updated_at: repository.updated_at,
  };

  return (
    <div className={classes.repoItem}>
      <Group gap="xs" align="center" justify="space-between" wrap="nowrap">
        <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <IconBrandGithub size={16} className={classes.repoIcon} />
          <Anchor
            component={Link}
            to={`/repo/${owner}/${repoName}`}
            state={{ repository: repoData }}
            fw={600}
            size="sm"
            className={classes.repoLink}
            lineClamp={1}
            style={{ minWidth: 0 }}
          >
            {repository.full_name}
          </Anchor>
          <IconStarFilled size={13} className={classes.starIcon} />
          <Text size="xs" c="var(--color-text-secondary)" style={{ flexShrink: 0 }}>
            {formatStars(repository.stargazers_count)}
          </Text>
        </Group>
        {repository.stars_since && repository.stars_since > 0 && (
          <Text size="xs" c="var(--color-text-secondary)" style={{ flexShrink: 0 }}>
            +{formatStars(repository.stars_since)}
          </Text>
        )}
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
      const repos = await LoadUserStarRepo();
      setRepositories(repos || []);
    } catch (err) {
      console.error('加载星标仓库失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const repos = await RefreshUserStarRepo();
      setRepositories(repos || []);
    } catch (err) {
      console.error('刷新星标仓库失败:', err);
      setError(err instanceof Error ? err.message : '刷新失败');
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className={classes.header} >
        <Text size="sm" fw={600} className={classes.headerTitle}>
          个人星标仓库 [{repositories.length}]
        </Text>
        <Tooltip label="刷新" position="bottom" withArrow>
          <ActionIcon
            variant="subtle"
            size="sm"
            radius="sm"
            onClick={handleRefresh}
            disabled={loading}
            styles={{
              root: {
                backgroundColor: 'transparent',
                color: '#6a7a90',
                '&:hover': {
                  backgroundColor: '#3f4b5c',
                },
              },
            }}
          >
            <IconRefresh size={16} className={loading ? 'spin' : ''} />
          </ActionIcon>
        </Tooltip>
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

          <Stack gap={2}>
            {repositories.map((repo) => (
              <StarredRepoItem key={repo.id} repository={repo} />
            ))}
          </Stack>
        </div>
      </ScrollArea>
    </Paper>
  );
}
