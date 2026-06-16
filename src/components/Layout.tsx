import { type ReactNode } from 'react';
import { AppShell, Group, Title, Button, ActionIcon, Tooltip } from '@mantine/core';
import { IconGauge, IconLayoutDashboard, IconLogout } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <IconGauge size={24} />
            <Title order={4}>Zählerstand</Title>
          </Group>
          <Group gap="xs">
            <Button
              variant={pathname === '/' ? 'light' : 'subtle'}
              leftSection={<IconLayoutDashboard size={18} />}
              onClick={() => navigate('/')}
              visibleFrom="xs"
            >
              Dashboard
            </Button>
            <Button
              variant={pathname.startsWith('/meters') ? 'light' : 'subtle'}
              leftSection={<IconGauge size={18} />}
              onClick={() => navigate('/meters')}
              visibleFrom="xs"
            >
              Zähler
            </Button>
            <ActionIcon
              hiddenFrom="xs"
              variant={pathname.startsWith('/meters') ? 'light' : 'subtle'}
              size="lg"
              onClick={() => navigate('/meters')}
              aria-label="Zähler"
            >
              <IconGauge size={20} />
            </ActionIcon>
            <Tooltip label="Abmelden">
              <ActionIcon variant="subtle" size="lg" onClick={signOut} aria-label="Abmelden">
                <IconLogout size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
