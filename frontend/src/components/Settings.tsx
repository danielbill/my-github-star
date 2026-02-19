import React, { useState, useEffect } from 'react';
import {
  Slider,
  TextInput,
  Button,
  Text,
  Title,
  Stack,
  Card,
  Flex,
} from '@mantine/core';
import { IconFolder, IconArrowLeft } from '@tabler/icons-react';
import {
  GetSettings,
  UpdateSettings,
  OpenDirectoryDialog,
} from '../../wailsjs/go/backend/App';

interface SettingsProps {
  onNavigate?: (path: string) => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  const [refreshInterval, setRefreshInterval] = useState<number>(0.5);
  const [cloneDirectory, setCloneDirectory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Load initial settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await GetSettings();
        setRefreshInterval(settings.refresh_interval);
        setCloneDirectory(settings.github_clone_dir);
        setError('');
      } catch (err) {
        console.error('加载设置失败:', err);
        setError(
          err instanceof Error ? err.message : '加载设置失败'
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update refresh interval
  const updateRefreshInterval = async (value: number) => {
    try {
      await UpdateSettings({
        refresh_interval: value,
        github_clone_dir: cloneDirectory,
      });
      setRefreshInterval(value);
      setError('');
    } catch (err) {
      console.error('保存刷新间隔失败:', err);
      const errorMsg =
        err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
      // Revert the value on error
      setRefreshInterval(refreshInterval);
    }
  };

  // Handle folder picker
  const handleFolderPicker = async () => {
    try {
      const selectedPath = await OpenDirectoryDialog();
      if (selectedPath) {
        await UpdateSettings({
          refresh_interval: refreshInterval,
          github_clone_dir: selectedPath,
        });
        setCloneDirectory(selectedPath);
        setError('');
      }
    } catch (err) {
      console.error('选择目录失败:', err);
      const errorMsg =
        err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('/');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#a0a0a0',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: '20px' }}>
      <Card
        p="lg"
        radius="md"
        withBorder
        style={{
          backgroundColor: '#212830',
          borderColor: '#3f4b5c',
        }}
      >
        <Flex justify="space-between" align="center" mb="md">
          <Title order={3} c="#a0a0a0">
            设置
          </Title>
          {onNavigate && (
            <Button
              leftSection={<IconArrowLeft size={16} />}
              variant="subtle"
              size="xs"
              onClick={handleBack}
              color="gray"
            >
              返回
            </Button>
          )}
        </Flex>

        <Stack spacing="md">
          {/* Refresh Interval Section */}
          <div>
            <Text size="sm" c="#a0a0a0" mb="sm">
              刷新间隔
            </Text>
            <Slider
              min={0.1}
              max={24}
              marks={[
                { value: 0.5, label: '30m' },
                { value: 1, label: '1h' },
                { value: 4, label: '4h' },
                { value: 24, label: '24h' },
              ]}
              restrictToMarks
              value={refreshInterval}
              onChange={updateRefreshInterval}
              styles={{
                markLabel: { color: '#a0a0a0', fontSize: '12px' },
              }}
            />
            <Text size="xs" c="#6a7a90" mt="xs">
              当前设置: {refreshInterval} 小时
            </Text>
            {error && error.includes('刷新') && (
              <Text c="red" size="sm" mt="xs">
                {error}
              </Text>
            )}
          </div>

          {/* Clone Directory Section */}
          <div>
            <Text size="sm" c="#a0a0a0" mb="sm">
              GitHub 克隆目录
            </Text>
            <TextInput
              value={cloneDirectory}
              readOnly
              rightSection={
                <Button
                  leftSection={<IconFolder size={16} />}
                  variant="subtle"
                  size="xs"
                  onClick={handleFolderPicker}
                  color="gray"
                >
                  浏览
                </Button>
              }
              styles={{
                input: {
                  backgroundColor: '#2a333f',
                  borderColor: '#3f4b5c',
                  color: '#a0a0a0',
                },
              }}
            />
            {error && error.includes('目录') && (
              <Text c="red" size="sm" mt="xs">
                {error}
              </Text>
            )}
            {error && !error.includes('刷新') && !error.includes('目录') && (
              <Text c="red" size="sm" mt="xs">
                {error}
              </Text>
            )}
          </div>
        </Stack>
      </Card>
    </div>
  );
}
