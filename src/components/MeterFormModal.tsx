import { useEffect } from 'react';
import { Modal, TextInput, NumberInput, Button, Stack, Group, Switch } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPicker } from './IconPicker';
import { DEFAULT_ICON } from '../lib/icons';
import { useCreateMeter, useUpdateMeter } from '../hooks/useMeters';
import type { Meter, MeterInput } from '../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Bei gesetztem Wert: Bearbeiten-Modus. */
  meter?: Meter;
}

export function MeterFormModal({ opened, onClose, meter }: Props) {
  const create = useCreateMeter();
  const update = useUpdateMeter();

  const form = useForm<MeterInput>({
    initialValues: {
      name: '',
      unit: '',
      icon: DEFAULT_ICON,
      decimals: 2,
      cost_per_unit: 0,
      is_feed_in: false,
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Name erforderlich'),
      unit: (v) => (v.trim() ? null : 'Einheit erforderlich'),
      decimals: (v) => (v >= 0 && v <= 6 ? null : '0 bis 6'),
    },
  });

  // Formular bei Öffnen mit den Werten des Zählers füllen (bzw. zurücksetzen).
  useEffect(() => {
    if (!opened) return;
    if (meter) {
      form.setValues({
        name: meter.name,
        unit: meter.unit,
        icon: meter.icon,
        decimals: meter.decimals,
        cost_per_unit: meter.cost_per_unit,
        is_feed_in: meter.is_feed_in,
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, meter]);

  const submit = form.onSubmit(async (values) => {
    try {
      if (meter) {
        await update.mutateAsync({ id: meter.id, input: values });
      } else {
        await create.mutateAsync(values);
      }
      onClose();
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  });

  return (
    <Modal opened={opened} onClose={onClose} title={meter ? 'Zähler bearbeiten' : 'Zähler anlegen'} centered>
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="Name" placeholder="z.B. Stromzähler Keller" {...form.getInputProps('name')} />
          <Group grow>
            <TextInput label="Einheit" placeholder="kWh / m³ / t" {...form.getInputProps('unit')} />
            <NumberInput
              label="Nachkommastellen"
              min={0}
              max={6}
              {...form.getInputProps('decimals')}
            />
          </Group>
          <Switch
            label="Einspeisezähler (Ertrag statt Kosten)"
            description="z.B. PV-Anlage – die Vergütung pro Einheit ergibt einen Ertrag."
            checked={form.values.is_feed_in}
            onChange={(e) => form.setFieldValue('is_feed_in', e.currentTarget.checked)}
          />
          <NumberInput
            label={`${form.values.is_feed_in ? 'Vergütung' : 'Kosten'} pro Einheit (€)`}
            min={0}
            step={0.01}
            decimalScale={4}
            {...form.getInputProps('cost_per_unit')}
          />
          <IconPicker value={form.values.icon} onChange={(k) => form.setFieldValue('icon', k)} />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              Speichern
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
