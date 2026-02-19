import React, { useState, useEffect } from 'react';
import {
  Slider,
  TextInput,
  Button,
  Text,
  Stack,
  Paper,
  Group,
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
    console.log('>>> 点击了文件夹按钮！');
    try {
      console.log('>>> 调用 OpenDirectoryDialog...');
      const selectedPath = await OpenDirectoryDialog();
      console.log('>>> OpenDirectoryDialog 返回:', selectedPath);
      if (selectedPath) {
        await UpdateSettings({
          refresh_interval: refreshInterval,
          github_clone_dir: selectedPath,
        });
        setCloneDirectory(selectedPath);
        setError('');
      }
    } catch (err) {
      console.error('>>> 错误:', err);
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
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '10px' }}>
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
            restrictToMarks
            value={sliderPos}
            onChange={updateRefreshInterval}
            label={null}
            styles={{
              track: { backgroundColor: '#3f4b5c' },
              bar: { backgroundColor: '#79C0E4' },
              thumb: {
                borderColor: '#79C0E4',
                backgroundColor: '#79C0E4',
              },
            }}
          />
          
          <Group justify="space-between" mt="xs">
            {['1小时', '2小时', '4小时', '8小时'].map((label, idx) => (
              <Text
                key={idx}
                size="xs"
                c={sliderPos === idx ? '#79C0E4' : '#6a7a90'}
                fw={sliderPos === idx ? 600 : 400}
              >
                {label}
              </Text>
            ))}
          </Group>

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
            className="clone-directory-input"
            value={cloneDirectory}
            readOnly
            placeholder="未设置"
            leftSection={
              <Button
                variant="subtle"
                size="md"
                onClick={handleFolderPicker}
                style={{ minWidth: 'auto', padding: '0 2px' }}
              >
                <IconFolder size={22} />
              </Button>
            }
          />
       
        </Paper>
      </Stack>
    </div>
  );
}
