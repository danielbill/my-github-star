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
  IconMinus,
  IconSquare,
  IconX,
} from '@tabler/icons-react';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime/runtime';
import { TimeRange } from '../types';
import { useAuth } from '../hooks/useAuth';
import { GetLogs } from '../../wailsjs/go/backend/App';
import { StarredSidebar } from './StarredSidebar';
import { useLocation } from 'react-router-dom';

interface HeaderIconProps {
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function HeaderIcon({ icon, isActive = false, onClick, disabled }: HeaderIconProps) {
  return (
    <ActionIcon
      variant="subtle"
      size="md"
      radius="sm"
      onClick={onClick}
      disabled={disabled}
      styles={{
        root: {
          backgroundColor: 'transparent',
          color: isActive ? '#79C0E4' : '#6a7a90',
          '&:hover': {
            backgroundColor: 'transparent',
            color: isActive ? '#79C0E4' : '#ffffff',
          },
          '&:disabled': {
            opacity: 0.5,
            cursor: 'not-allowed',
          },
        },
      }}
    >
      {icon}
    </ActionIcon>
  );
}

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
  const location = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deviceCodeModalOpen, setDeviceCodeModalOpen] = useState(false);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const {
    isLoggedIn,
    user,
    isLoading: authLoading,
    deviceCode,
    openVerificationPage,
    loginWithDeviceFlow,
    logout,
  } = useAuth();

  const isHomePage = location.pathname === '/';
  const isSettingsPage = location.pathname === '/settings';

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
        setDeviceCodeModalOpen(false);
        await openVerificationPage();
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
      }} onDoubleClick={() => WindowToggleMaximise()}>
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
              {isHomePage ? 'Github热点' : isSettingsPage ? '设置' : 'GitHub Stars'}
            </Title>
          </div>

          {/* 时间切换 - 居中 - 只在首页显示 */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
            {isHomePage && (
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

          <Flex gap={12} align="center" style={{ width: 400, justifyContent: 'flex-end' }}>
            {/* Trend 链接 - 首页 */}
            <HeaderIcon
              icon={<IconTrendingUp size={18} />}
              isActive={isHomePage}
              onClick={() => onNavigate?.('/')}
            />

            {/* Settings icon - left of login icon */}
            <HeaderIcon
              icon={<IconSettings size={18} />}
              isActive={isSettingsPage}
              onClick={() => onNavigate?.('/settings')}
            />

      

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
                 <Menu shadow="md" width={100} position="bottom">
                <Menu.Target>
                  <UnstyledButton>
                    <Avatar
                      radius="md"
                      size={24}
                      src={user.avatar_url}
                      alt={user.login}
                      style={{ cursor: 'pointer' }}
                    />
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown style={{ backgroundColor: '#2d3748' }}>
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
              <HeaderIcon
                icon={<IconBrandGithub size={20} />}
                onClick={handleLoginDeviceFlow}
                disabled={authLoading}
              />
            )}

            {/* 分隔线 */}
            <div style={{ width: 1, height: 16, backgroundColor: '#3f4b5c', margin: '0 8px' }} />

            {/* 窗口控制按钮 */}
            <Flex gap={3} align="center">
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={() => WindowMinimise()}
                styles={{
                  root: {
                    color: '#6a7a90',
                    '&:hover': {
                      backgroundColor: '#3f4b5c',
                      color: '#ffffff',
                    },
                  },
                }}
              >
                <IconMinus size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={() => WindowToggleMaximise()}
                styles={{
                  root: {
                    color: '#6a7a90',
                    '&:hover': {
                      backgroundColor: '#3f4b5c',
                      color: '#ffffff',
                    },
                  },
                }}
              >
                <IconSquare size={12} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="md"
                radius="sm"
                onClick={() => Quit()}
                styles={{
                  root: {
                    color: '#6a7a90',
                    '&:hover': {
                      backgroundColor: '#ff6b6b',
                      color: '#ffffff',
                    },
                  },
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </Flex>
          </Flex>
        </div>
      </header>

      <main style={{ paddingTop: '62px', paddingLeft: '18px', paddingRight: '18px', paddingBottom: '18px' }}>
        <div style={{ margin: '0 auto', display: 'flex', gap: '10px' }}>
          {isHomePage ? (
            <>
              <div style={{ flex: 6, minWidth: 0 }}>
                {children}
              </div>
              <div style={{ flex: 4, minWidth: 0 }}>
                <StarredSidebar />
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }}>
              {children}
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
        <Stack gap="lg">

          <Paper
            p="xl"
            radius="md"
            style={{
              backgroundColor: '#1a1f26',
              border: '0px solid #3f4b5c',

            }}
          >
            <Flex justify="center" gap="sm">
              {(deviceCode || '').split('').map((char, index) => (
                <div
                  key={index}
                  style={{
                    width: char === '-' ? 'auto' : 60,
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#212830',
                    border: char === '-' ? 'none' : '2px solid #4a576a',
                    borderRadius: 8,
                    fontSize: 28,
                    fontWeight: 700,
                    color: char === '-' ? '#6a7a90' : '#79C0E4',
                    fontFamily: 'monospace',
                  }}
                >
                  {char}
                </div>
              ))}
            </Flex>
          </Paper>

          <Button
            leftSection={<IconCopy size={18} />}
            onClick={handleCopyUserCode}
            fullWidth
            size="md"
            styles={{
              root: {
                backgroundColor: '#79C0E4',
                color: '#1a1f26',
                '&:hover': {
                  backgroundColor: '#5fa8d3',
                },
              },
            }}
          >
            复制验证码，打开浏览器，Ctrl+V粘贴即可
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
