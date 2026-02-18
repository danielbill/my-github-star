import React, { useState } from 'react';
import {
  Title,
  Flex,
  ActionIcon,
  Avatar,
  SegmentedControl,
  Menu,
  Text,
  UnstyledButton,
  Tooltip,
  Modal,
  Stack,
  Group,
  Button,
  Code,
  Alert,
} from '@mantine/core';
import {
  IconBrandGithub,
  IconRefresh,
  IconLogout,
  IconUser,
  IconAlertCircle,
  IconKey,
  IconDeviceDesktop,
} from '@tabler/icons-react';
import { TimeRange, LanguageFilter } from '../types';
import { useAuth } from '../hooks/useAuth';

type ViewScope = 'all' | 'mine';

interface MainLayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  language: LanguageFilter;
  onLanguageChange: (value: LanguageFilter) => void;
  repositoryCount: number;
  lastUpdate?: Date;
}

const timeRangeOptions = [
  { value: 'daily', label: '今日' },
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' },
];

const languageOptions = [
  { value: '', label: '全部语言' },
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Go', label: 'Go' },
  { value: 'Rust', label: 'Rust' },
  { value: 'Java', label: 'Java' },
  { value: 'C++', label: 'C++' },
  { value: 'Vue', label: 'Vue' },
  { value: 'HTML', label: 'HTML' },
];

export function MainLayout({
  children,
  onRefresh,
  loading,
  timeRange,
  onTimeRangeChange,
  language,
  onLanguageChange,
  repositoryCount,
  lastUpdate,
}: MainLayoutProps) {
  const [viewScope, setViewScope] = useState<ViewScope>('all');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const {
    isLoggedIn,
    user,
    isLoading: authLoading,
    deviceFlowInfo,
    setDeviceFlowInfo,
    loginWithOAuth,
    loginWithDeviceFlow,
    logout,
  } = useAuth();

  const handleTimeRangeChange = (value: string | string[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    if (newValue === 'weekly' || newValue === 'monthly') {
      onTimeRangeChange(newValue as 'weekly' | 'monthly');
    }
  };

  const handleLoginOAuth = async () => {
    try {
      setLoginError(null);
      setLoginModalOpen(false);
      await loginWithOAuth();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('OAuth 登录失败:', errorMsg);
      setLoginError(errorMsg);
      setLoginModalOpen(true);
    }
  };

  const handleLoginDeviceFlow = async () => {
    try {
      setLoginError(null);
      await loginWithDeviceFlow();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Device Flow 登录失败:', errorMsg);
      setLoginError(errorMsg);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#212830' }}>
      <header className="custom-header" style={{
        height: 50,
        backgroundColor: '#212830',
        borderBottom: '0px solid #3f4b5c',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Title order={4} c="#a0a0a0" style={{ margin: 0, lineHeight: 1.2 }}>
            GitHub Stars
          </Title>

          <Flex gap="lg" align="center">

            {/* 时间切换 */}
            <SegmentedControl
              data={[{ value: 'weekly', label: '本周' }, { value: 'monthly', label: '本月' }]}
              value={timeRange === 'daily' ? 'weekly' : timeRange}
              onChange={handleTimeRangeChange}
              size="xs"
              disabled={loading}
              styles={{
                root: {
                  backgroundColor: '#3f4b5c',
                  border: '1px solid #4a576a',
                  borderRadius: '4px',
                  padding: '2px',
                  height: '30px',
                },
                indicator: {
                  backgroundColor: '#4a576a',
                  borderRadius: '2px',
                  height: 'calc(100% - 4px)',
                  margin: '-1px',
                },
                label: {
                  color: '#a0a0a0',
                  fontSize: '12px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                  zIndex: 2,
                  position: 'relative',
                },
              }}
            />

            {/* 用户登录/头像 */}
            {isLoggedIn && user ? (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <UnstyledButton>
                    <Avatar
                      radius="xl"
                      size={30}
                      src={user.avatar_url}
                      alt={user.login}
                      style={{ cursor: 'pointer' }}
                    />
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>
                    <Text size="sm" weight={500}>{user.name || user.login}</Text>
                    <Text size="xs" c="dimmed">@{user.login}</Text>
                  </Menu.Label>

                  <Menu.Divider />

                  <Menu.Item
                    leftSection={<IconUser size={14} />}
                    onClick={() => window.open(`https://github.com/${user.login}`, '_blank')}
                  >
                    GitHub 主页
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="red"
                    onClick={handleLogoutClick}
                  >
                    登出
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Tooltip label="点击登录" position="bottom-end" withArrow>
                <ActionIcon
                  variant="subtle"
                  size="md"
                  radius="sm"
                  onClick={() => setLoginModalOpen(true)}
                  loading={authLoading}
                  styles={{
                    root: {
                      backgroundColor: '#3f4b5c',
                      color: '#a0a0a0',
                      '&:hover': {
                        backgroundColor: '#4a576a',
                      },
                    },
                  }}
                >
                  <IconBrandGithub size={20} />
                </ActionIcon>
              </Tooltip>
            )}
          </Flex>
        </div>
      </header>

      {/* 登录方式选择模态框 */}
      <Modal
        opened={loginModalOpen}
        onClose={() => {
          setLoginModalOpen(false);
          setLoginError(null);
          setDeviceFlowInfo(null);
        }}
        title={<Text size="lg" weight={500}>选择登录方式</Text>}
        centered
        overlayProps={{ backgroundOpacity: 0.5 }}
      >
        <Stack gap="md">
          {loginError && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} withClose onClose={() => setLoginError(null)}>
              {loginError}
            </Alert>
          )}

          {deviceFlowInfo ? (
            // Device Flow 验证码显示
            <Stack gap="lg" align="center">
              <Text size="sm" c="dimmed">请在浏览器中输入以下验证码：</Text>

              <Code
                style={{
                  fontSize: '32px',
                  letterSpacing: '8px',
                  fontWeight: 'bold',
                  padding: '16px 32px',
                  backgroundColor: '#2d333b',
                }}
              >
                {deviceFlowInfo.user_code}
              </Code>

              <Text size="sm" c="dimmed">验证页面已在浏览器中打开</Text>

              <Group gap="xs">
                <Text size="xs" c="dimmed">未打开？</Text>
                <Button
                  size="xs"
                  variant="subtle"
                  leftSection={<IconBrandGithub size={14} />}
                  onClick={() => window.open('https://github.com/login/device', '_blank')}
                >
                  打开验证页面
                </Button>
              </Group>

              <Button
                fullWidth
                variant="light"
                color="gray"
                onClick={() => {
                  setDeviceFlowInfo(null);
                }}
              >
                返回选择其他方式
              </Button>
            </Stack>
          ) : (
            // 登录方式选择
            <Stack gap="sm">
              <Button
                size="lg"
                leftSection={<IconDeviceDesktop size={20} />}
                onClick={handleLoginDeviceFlow}
                styles={{
                  root: {
                    backgroundColor: '#238636',
                    height: '60px',
                    '&:hover': {
                      backgroundColor: '#2ea043',
                    },
                  },
                  label: {
                    fontSize: '16px',
                    fontWeight: 500,
                  },
                }}
              >
                <Stack gap={4}>
                  <Text>方式 1：设备码登录（推荐）</Text>
                  <Text size="xs" c="rgba(255,255,255,0.7)">无需 Client Secret，只需输入验证码</Text>
                </Stack>
              </Button>

              <Button
                size="lg"
                variant="light"
                leftSection={<IconKey size={20} />}
                onClick={handleLoginOAuth}
                styles={{
                  root: {
                    height: '60px',
                    border: '1px solid #4a576a',
                    color: '#a0a0a0',
                    '&:hover': {
                      backgroundColor: '#3f4b5c',
                    },
                  },
                  label: {
                    fontSize: '16px',
                    fontWeight: 500,
                  },
                }}
              >
                <Stack gap={4}>
                  <Text>方式 2：OAuth 授权登录</Text>
                  <Text size="xs" c="dimmed">需要配置 Client Secret</Text>
                </Stack>
              </Button>
            </Stack>
          )}
        </Stack>
      </Modal>

      <main style={{ paddingTop: '62px', paddingLeft: '18px', paddingRight: '18px', paddingBottom: '18px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: '18px' }}>
          <div style={{ flex: 6 }}>
            {children}
          </div>
          <div style={{ flex: 4 }}>
            {/* 我的列表 - 登录后显示 */}
          </div>
        </div>
      </main>
    </div>
  );
}
