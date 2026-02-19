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
  Alert,
  Modal,
  Stack,
  Code,
  Button,
  Paper,
  ScrollArea,
  Badge,
} from '@mantine/core';
import {
  IconBrandGithub,
  IconRefresh,
  IconLogout,
  IconUser,
  IconAlertCircle,
  IconCopy,
  IconBug,
  IconNews,
  IconTrendingUp,
  IconSettings,
} from '@tabler/icons-react';
import { TimeRange } from '../types';
import { useAuth } from '../hooks/useAuth';
import { GetLogs } from '../../wailsjs/go/backend/App';
import { StarredSidebar } from './StarredSidebar';

type ViewScope = 'all' | 'mine';
type PageType = 'trend' | 'news';

interface MainLayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  refreshing: boolean;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  repositoryCount: number;
  cacheTime: string;
  refreshMessage: string;
  error: string;
  onNavigate?: (path: string) => void;
}

const timeRangeOptions = [
  { value: 'weekly', label: '本周' },
  { value: 'monthly', label: '本月' },
];

export function MainLayout({
  children,
  onRefresh,
  loading,
  refreshing,
  timeRange,
  onTimeRangeChange,
  repositoryCount,
  cacheTime,
  refreshMessage,
  error,
  onNavigate,
}: MainLayoutProps) {
  const [viewScope, setViewScope] = useState<ViewScope>('all');
  const [currentPage, setCurrentPage] = useState<PageType>('trend');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deviceCodeModalOpen, setDeviceCodeModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const {
    isLoggedIn,
    user,
    isLoading: authLoading,
    deviceCode,
    loginWithDeviceFlow,
    logout,
  } = useAuth();

  const handleTimeRangeChange = (value: string | string[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    if (newValue === 'weekly' || newValue === 'monthly') {
      onTimeRangeChange(newValue as 'weekly' | 'monthly');
    }
  };

  const handleLoginDeviceFlow = async () => {
    try {
      setLoginError(null);
      await loginWithDeviceFlow();
      setDeviceCodeModalOpen(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Device Flow 登录失败:', errorMsg);
      setLoginError(errorMsg);
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const handleCopyUserCode = async () => {
    if (deviceCode) {
      try {
        await navigator.clipboard.writeText(deviceCode);
      } catch (err) {
        console.error('复制失败:', err);
      }
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const handleOpenLogs = async () => {
    try {
      const logContent = await GetLogs();
      setLogs(logContent);
      setLogsModalOpen(true);
    } catch (error) {
      console.error('获取日志失败:', error);
    }
  };

  const handleTrendClick = () => {
    setCurrentPage('trend');
  };

  const handleNewsClick = () => {
    setCurrentPage('news');
  };

  const handleRefreshClick = () => {
    if (currentPage === 'trend') {
      onRefresh();
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
          position: 'relative',
        }}>
          <div style={{ width: 400, minWidth: 400 }}>
            <Title order={4} c="#6a7a90" style={{ margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              GitHub Stars
            </Title>
          </div>

          {/* 时间切换 - 居中 */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
            {currentPage === 'trend' && (
              <SegmentedControl
                data={timeRangeOptions}
                value={timeRange}
                onChange={onTimeRangeChange}
                size="xs"
                styles={{
                  root: {
                    backgroundColor: '#212830',
                    border: '1px solid #4a576a99',
                    borderRadius: '4px',
                    padding: '2px',
                    height: '28px',
                  },
                  indicator: {
                    backgroundColor: '#4a576a',
                    borderRadius: '2px',
                    height: 'calc(100% - 4px)',
                    margin: '-1px',
                  },
                  label: {
                    color: '#6a7a90',
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
            )}
          </div>

          <Flex gap="xs" align="center" style={{ width: 400, justifyContent: 'flex-end' }}>
            {/* Trend 链接 */}
            <UnstyledButton
              onClick={handleTrendClick}
              style={{
                color: '#6a7a90',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                background: 'transparent',
              }}
            >
              <span style={{
                borderBottom: currentPage === 'trend' ? '2px solid #6a7a90' : '2px solid transparent',
                paddingBottom: '2px',
              }}>
                Trend
              </span>
            </UnstyledButton>

            {/* News 链接 */}
            <UnstyledButton
              onClick={handleNewsClick}
              style={{
                color: '#6a7a90',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s',
                background: 'transparent',
              }}
            >
              <span style={{
                borderBottom: currentPage === 'news' ? '2px solid #6a7a90' : '2px solid transparent',
                paddingBottom: '2px',
              }}>
                News
              </span>
            </UnstyledButton>

            <div style={{ width: '100px' }} />

            {/* Settings icon - left of login icon */}
            <Tooltip label="设置" position="bottom-end" withArrow>
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={() => onNavigate?.('/settings')}
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
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>

      
    

            {/* 日志按钮 - 暂时隐藏 */}
            {/* <Tooltip label="查看日志" position="bottom-end" withArrow>
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={handleOpenLogs}
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
                <IconBug size={18} />
              </ActionIcon>
            </Tooltip> */}

            {/* 用户登录/头像 */}
            {isLoggedIn && user ? (
              <Menu shadow="md" width={120} position="bottom-end">
                <Menu.Target>
                  <UnstyledButton>
                    <Avatar
                      radius="md"
                      size={28}
                      src={user.avatar_url}
                      alt={user.login}
                      style={{ cursor: 'pointer' }}
                    />
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item    
                    color="gray"
                    onClick={() => window.open(`https://github.com/${user.login}`, '_blank')}
                  >
                    GitHub主页
                  </Menu.Item>

                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="gray"
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
                  onClick={handleLoginDeviceFlow}
                  disabled={authLoading}
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

      <main style={{ paddingTop: '62px', paddingLeft: '18px', paddingRight: '18px', paddingBottom: '18px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: '18px' }}>
          {currentPage === 'trend' ? (
            <>
              <div style={{ flex: 6 }}>
                {children}
              </div>
              <div style={{ flex: 4 }}>
                {/* 我的星标列表 - 登录后显示 */}
                <StarredSidebar />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, textAlign: 'center', padding: '100px 0' }}>
              <IconNews size={64} c="#4a576a" style={{ marginBottom: '20px' }} />
              <Text size="xl" c="#a0a0a0">News 页面即将推出</Text>
              <Text size="sm" c="#6a7a90" mt="sm">敬请期待...</Text>
            </div>
          )}
        </div>
      </main>

      {/* 刷新消息提示 */}
      {refreshMessage && (
        <Alert
          icon={refreshing ? <IconRefresh size={16} /> : <IconAlertCircle size={16} />}
          title={refreshing ? '正在刷新...' : '刷新结果'}
          color={refreshing ? 'blue' : error ? 'red' : 'green'}
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            maxWidth: 400,
            zIndex: 2000,
          }}
          withClose
          onClose={() => {}}
        >
          {refreshMessage}
        </Alert>
      )}

      {/* 登录错误提示 */}
      {loginError && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="登录失败"
          color="red"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            maxWidth: 400,
            zIndex: 2000,
          }}
          withCloseButton
          onClose={() => setLoginError(null)}
        >
          {loginError}
        </Alert>
      )}

      {/* 用户码显示弹窗 */}
      <Modal
        opened={deviceCodeModalOpen}
        onClose={() => setDeviceCodeModalOpen(false)}
        title="输入验证码"
        centered
      >
        <Stack>
          <Text size="sm">
            浏览器已打开 GitHub 授权页面。请在页面上输入以下验证码：
          </Text>
          <Code
            style={{
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: 4,
              padding: 16,
            }}
          >
            {deviceCode}
          </Code>
          <Text size="xs" c="dimmed">
            验证码已复制到剪贴板，也可以点击按钮重新复制
          </Text>
          <Button
            leftSection={<IconCopy size={16} />}
            onClick={handleCopyUserCode}
            variant="light"
          >
            复制验证码
          </Button>
        </Stack>
      </Modal>

      {/* 日志查看窗口 */}
      <Modal
        opened={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        title="应用日志"
        size="lg"
        centered
      >
        <Paper
          style={{
            backgroundColor: '#1a1a1a',
            padding: 16,
            maxHeight: 400,
          }}
        >
          <ScrollArea h={350}>
            <Code
              style={{
                display: 'block',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {logs || '暂无日志'}
            </Code>
          </ScrollArea>
        </Paper>
      </Modal>
    </div>
  );
}
