import React, { useState, useEffect } from 'react';
import {
  Slider,
  TextInput,
  Button,
  Text,
  Stack,
  Paper,
} from '@mantine/core';
import { IconFolder } from '@tabler/icons-react';
import {
  GetSettings,
  UpdateSettings,
  OpenDirectoryDialog,
} from '../../wailsjs/go/backend/App';

interface SettingsProps {
  onNavigate?: (path: string) => void;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text size="md" fw={600} c="#79C0E4" mb="xs">
      {children}
    </Text>
  );
}

const sliderValues = [1, 2, 4, 8];

export function Settings({ onNavigate }: SettingsProps) {
  const [refreshInterval, setRefreshInterval] = useState<number>(1);
  const [sliderPos, setSliderPos] = useState<number>(0);
  const [cloneDirectory, setCloneDirectory] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await GetSettings();
        setRefreshInterval(settings.refresh_interval);
        const idx = sliderValues.indexOf(settings.refresh_interval);
        setSliderPos(idx >= 0 ? idx : 0);
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

  const updateRefreshInterval = async (pos: number) => {
    try {
      const value = sliderValues[pos];
      await UpdateSettings({
        refresh_interval: value,
        github_clone_dir: cloneDirectory,
      });
      setSliderPos(pos);
      setRefreshInterval(value);
      setError('');
    } catch (err) {
      console.error('保存刷新间隔失败:', err);
      const errorMsg =
        err instanceof Error ? err.message : '保存失败';
      setError(errorMsg);
    }
  };

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

  if (loading) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#6a7a90',
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Stack gap="xl">
        <Paper
          p="xl"
          radius="md"
          style={{
            backgroundColor: '#212830',
            border: '1px solid #3f4b5c',
          }}
        >
          <SectionTitle>热点刷新间隔</SectionTitle>

          <Slider
            min={0}
            max={3}
            marks={[
              { value: 0, label: '1小时' },
              { value: 1, label: '2小时' },
              { value: 2, label: '4小时' },
              { value: 3, label: '8小时' },
            ]}
            restrictToMarks
            value={sliderPos}
            onChange={updateRefreshInterval}
            label={null}
            styles={{
              markLabel: { color: '#6a7a90', fontSize: '12px' },
              track: { backgroundColor: '#3f4b5c' },
              bar: { backgroundColor: '#79C0E4' },
              thumb: {
                borderColor: '#79C0E4',
                backgroundColor: '#79C0E4',
              },
            }}
          />

          {error && error.includes('刷新') && (
            <Text c="#ff6b6b" size="sm" mt="md">
              {error}
            </Text>
          )}
        </Paper>

        <Paper
          p="xl"
          radius="md"
          style={{
            backgroundColor: '#212830',
            border: '1px solid #3f4b5c',
          }}
        >
          <SectionTitle>GitHub 克隆目录</SectionTitle>
          <TextInput
            value={cloneDirectory}
            readOnly
            placeholder="未设置"
            rightSection={
              <Button
                leftSection={<IconFolder size={16} />}
                variant="light"
                size="xs"
                onClick={handleFolderPicker}
                styles={{
                  root: {
                    backgroundColor: '#3f4b5c',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#4a576a',
                    },
                  },
                }}
              >
                浏览
              </Button>
            }
            styles={{
              input: {
                backgroundColor: '#2a333f',
                borderColor: '#3f4b5c',
                color: '#ffffff',
                '&:focus': {
                  borderColor: '#79C0E4',
                },
              },
            }}
          />
          {error && error.includes('目录') && (
            <Text c="#ff6b6b" size="sm" mt="md">
              {error}
            </Text>
          )}
          {error && !error.includes('刷新') && !error.includes('目录') && (
            <Text c="#ff6b6b" size="sm" mt="md">
              {error}
            </Text>
          )}
        </Paper>
      </Stack>
    </div>
  );
}
