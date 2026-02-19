import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Paper,
  Text,
  Group,
  Stack,
  Loader,
  Alert,
  Box,
  Flex,
  Modal,
  Button,
} from '@mantine/core';
import { IconBrandGithub, IconStarFilled, IconDownload } from '@tabler/icons-react';
import { GetRepositoryByID, CloneRepository, OpenURL } from '../../wailsjs/go/backend/App';
import { Repository } from '../types';
import { DetailLayout } from './DetailLayout';

function formatStars(stars: number): string {
  if (stars >= 1000000) {
    return `${(stars / 1000000).toFixed(1)}M`;
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}K`;
  }
  return stars.toString();
}

export function ProjectDetail() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const location = useLocation();
  const locationState = location.state as { repository?: Repository } | null;

  const [repository, setRepository] = useState<Repository | null>(
    locationState?.repository || null
  );
  const [loading, setLoading] = useState(!locationState?.repository);
  const [error, setError] = useState('');
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  useEffect(() => {
    if (repository) return;

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
        setRepository(result as unknown as Repository);
      } catch (err) {
        console.error('获取项目详情失败:', err);
        setError(err instanceof Error ? err.message : '获取项目详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [owner, name, repository]);

  if (loading) {
    return (
      <DetailLayout>
        <Stack align="center" py="xl">
          <Loader size="lg" />
          <Text c="dimmed">加载项目详情中...</Text>
        </Stack>
      </DetailLayout>
    );
  }

  if (error || !repository) {
    return (
      <DetailLayout>
        <Alert color="red" title="加载失败">
          {error || '项目未找到'}
        </Alert>
      </DetailLayout>
    );
  }

  const handleDownloadClick = () => {
    setDownloadModalOpen(true);
  };

  const handleConfirmDownload = async () => {
    setDownloadModalOpen(false);
    try {
      await CloneRepository(repository.html_url);
    } catch (err) {
      console.error('克隆失败:', err);
    }
  };

  return (
    <DetailLayout>
      <Paper
        shadow="sm"
        radius="md"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border-default)',
          width: '70%',
          margin: '0 auto',
          height: 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '10px 14px',
        }}
      >
        <Flex justify="space-between" align="flex-start" gap="md">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" align="center" mb={4}>
              <IconBrandGithub size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <Text
                fw={600}
                size="sm"
                style={{ color: 'var(--color-link)' }}
              >
                {repository.full_name}
              </Text>
              <IconStarFilled size={13} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <Text size="xs" c="var(--color-text-secondary)">
                {formatStars(repository.stargazers_count)}
              </Text>
            </Group>

            <Text size="sm" c="var(--color-text-secondary)" style={{ lineHeight: 1.4 }}>
              {repository.description || 'No description provided'}
            </Text>

            <Group gap="xs" align="center" style={{ marginTop: 4 }}>
              <IconDownload
                size={18}
                style={{ color: 'var(--color-link)', flexShrink: 0, cursor: 'pointer' }}
                onClick={handleDownloadClick}
              />
              <Text
                size="sm"
                c="var(--color-link)"
                style={{ cursor: 'pointer' }}
                onClick={() => OpenURL(repository.html_url)}
              >
                {repository.html_url}
              </Text>
            </Group>
          </div>

          {(repository.stars_since && repository.stars_since > 0) ||
           (repository.stars_today && repository.stars_today > 0) ? (
            <Text size="xs" c="var(--color-text-secondary)">
              +{repository.stars_since || repository.stars_today || 0} stars
            </Text>
          ) : null}
        </Flex>
      </Paper>

      <Box mt="lg" style={{ minHeight: 400 }}>
      </Box>

      <Modal
        opened={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        centered
        size="lg"
        overlayProps={{
          opacity: 1,
          color: '#000000',
        }}
        zIndex={9999}
        styles={{
          content: {
            backgroundColor: '#212830',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          },
          header: {
            backgroundColor: '#212830',
          },
          body: {
            backgroundColor: '#212830',
          },
          close: {
            color: '#6a7a90',
            '&:hover': {
              color: '#ffffff',
              backgroundColor: '#3f4b5c',
            },
          },
        }}
      >
        <Stack gap="md">
          <Paper
            p="md"
            radius="md"
            style={{
              backgroundColor: '#1a1f26',
              border: '0px solid #3f4b5c',
            }}
          >
            <Stack align="center" gap="md">
              <IconDownload size={48} style={{ color: '#79C0E4' }} />
              <Text size="lg" fw={400} c="#dae7f5ff">
               git clone {repository.html_url}
              </Text>

            </Stack>
          </Paper>

          <Button
            leftSection={<IconDownload size={18} />}
            onClick={handleConfirmDownload}
            fullWidth
            size="md"
            styles={{
              root: {
                backgroundColor: '#79C0E4',
                color: '#1a1f26',
                '&:hover': {
                  backgroundColor: '#5a9fc4',
                },
              },
            }}
          >
            确认下载
          </Button>
        </Stack>
      </Modal>
    </DetailLayout>
  );
}
