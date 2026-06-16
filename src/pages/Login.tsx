import { useState } from 'react';
import {
  Center,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Text,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconGauge } from '@tabler/icons-react';
import { supabase } from '../lib/supabase';

export function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Ungültige E-Mail'),
      password: (v) => (v.length >= 6 ? null : 'Mindestens 6 Zeichen'),
    },
  });

  const submit = form.onSubmit(async ({ email, password }) => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        notifications.show({
          color: 'teal',
          message: 'Registriert. Bitte ggf. E-Mail bestätigen, dann anmelden.',
        });
        setMode('login');
      }
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Center h="100vh" p="md">
      <Paper withBorder shadow="md" p="xl" radius="md" w={380} maw="100%">
        <Stack>
          <Group justify="center" gap="xs">
            <IconGauge size={28} />
            <Title order={3}>Zählerstand</Title>
          </Group>
          <Text c="dimmed" size="sm" ta="center">
            {mode === 'login' ? 'Anmelden, um fortzufahren' : 'Konto erstellen'}
          </Text>
          <form onSubmit={submit}>
            <Stack>
              <TextInput
                label="E-Mail"
                type="email"
                {...form.getInputProps('email')}
                required
              />
              <PasswordInput
                label="Passwort"
                {...form.getInputProps('password')}
                required
              />
              <Button type="submit" loading={loading} fullWidth>
                {mode === 'login' ? 'Anmelden' : 'Registrieren'}
              </Button>
            </Stack>
          </form>
          <Text size="sm" ta="center">
            {mode === 'login' ? 'Noch kein Konto? ' : 'Bereits registriert? '}
            <Anchor
              component="button"
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Registrieren' : 'Anmelden'}
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
