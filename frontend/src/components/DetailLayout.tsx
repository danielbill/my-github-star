import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flex,
  ActionIcon,
  Avatar,
  Menu,
  UnstyledButton,
  Modal,
  Stack,
  Paper,
  Button,
} from '@mantine/core';
import {
  IconBrandGithub,
  IconLogout,
  IconCopy,
  IconTrendingUp,
  IconSettings,
  IconMinus,
  IconSquare,
  IconX,
  IconArrowLeft,
} from '@tabler/icons-react';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime/runtime';
import { useAuth } from '../hooks/useAuth';

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

interface DetailLayoutProps {
  children: React.ReactNode;
}

export function DetailLayout({ children }: DetailLayoutProps) {
  const navigate = useNavigate();
  const [deviceCodeModalOpen, setDeviceCodeModalOpen] = useState(false);
  const {
    isLoggedIn,
    user,
    isLoading: authLoading,
    deviceCode,
    openVerificationPage,
    loginWithDeviceFlow,
    logout,
  } = useAuth();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleLoginDeviceFlow = async () => {
    try {
      await loginWithDeviceFlow();
      setDeviceCodeModalOpen(true);
    } catch (error) {
      console.error('Device Flow 登录失败:', error);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#212830' }}>
      <header
        className="custom-header"
        style={{
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
        }}
        onDoubleClick={() => WindowToggleMaximise()}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 20px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div style={{ width: 400, minWidth: 400 }}>
            <ActionIcon
              variant="subtle"
              size="md"
              radius="sm"
              onClick={handleGoBack}
              styles={{
                root: {
                  backgroundColor: 'transparent',
                  color: '#6a7a90',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                  },
                },
              }}
            >
              <IconArrowLeft size={18} />
            </ActionIcon>
          </div>

          <Flex gap={8} align="center" style={{ width: 300, justifyContent: 'flex-end' }}>
            <HeaderIcon
              icon={<IconTrendingUp size={18} />}
              onClick={handleGoBack}
            />

            <HeaderIcon
              icon={<IconSettings size={18} />}
              onClick={() => navigate('/settings')}
            />

            {isLoggedIn && user ? (
              <Menu shadow="md" width={100} position="bottom">
                <Menu.Target>
                  <UnstyledButton>
                    <Avatar
                      radius="md"
                      size={20}
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

            <div style={{ width: 1, height: 16, backgroundColor: '#3f4b5c', margin: '0 5px' }} />

            <Flex gap={0} align="center">
              <ActionIcon
                variant="subtle"
                size="sm"
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
                <IconMinus size={15} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                size="sm"
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
                size="sm"
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
        <div style={{ margin: '0 auto', maxWidth: 1280 }}>
          {children}
        </div>
      </main>

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
    </div>
  );
}
