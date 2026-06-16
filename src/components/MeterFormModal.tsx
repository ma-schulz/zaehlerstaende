import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Group,
  Input,
  SegmentedControl,
  Switch,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconPicker } from './IconPicker';
import { DEFAULT_ICON } from '../lib/icons';
import { meterTerms } from '../lib/format';
import { useCreateMeter, useUpdateMeter } from '../hooks/useMeters';
import type { Meter, MeterInput, MeterKind } from '../types';

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
      kind: 'consumption',
      line_bound: true,
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
        kind: meter.kind,
        line_bound: meter.line_bound,
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, meter]);

  const submit = form.onSubmit(async (raw) => {
    // leitungsgebunden ist nur bei Verbrauchszählern relevant; sonst immer true.
    const line_bound = raw.kind === 'consumption' ? raw.line_bound : true;
    // Tarif (cost_per_unit) gilt für Einspeisung sowie leitungsgebundenen Verbrauch.
    // Info-Zähler und nicht leitungsgebundene Zähler (Kosten via Zukäufe) haben hier 0.
    const usesTariff = raw.kind === 'feed_in' || (raw.kind === 'consumption' && line_bound);
    const values: MeterInput = {
      ...raw,
      line_bound,
      cost_per_unit: usesTariff ? raw.cost_per_unit : 0,
    };
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
          <Input.Wrapper
            label="Zählerart"
            description={
              form.values.kind === 'feed_in'
                ? 'Einspeisung (z.B. PV) – die Vergütung pro Einheit ergibt einen Ertrag.'
                : form.values.kind === 'info'
                  ? 'Reiner Info-Zähler ohne Kosten – zählt nicht in die Dashboard-Summe.'
                  : 'Normaler Verbrauchszähler mit Kosten.'
            }
          >
            <SegmentedControl
              fullWidth
              mt={4}
              value={form.values.kind}
              onChange={(v) => form.setFieldValue('kind', v as MeterKind)}
              data={[
                { label: 'Verbrauch', value: 'consumption' },
                { label: 'Einspeisung', value: 'feed_in' },
                { label: 'Info', value: 'info' },
              ]}
            />
          </Input.Wrapper>
          {form.values.kind === 'consumption' && (
            <Switch
              label="Leitungsgebunden"
              description={
                form.values.line_bound
                  ? 'Strom/Wasser – Kosten über den Tarif (Preis pro Einheit).'
                  : 'Vorrat (z.B. Pellets) – zusätzlich Zukäufe erfassbar, Kosten per FIFO.'
              }
              checked={form.values.line_bound}
              onChange={(e) => form.setFieldValue('line_bound', e.currentTarget.checked)}
            />
          )}
          {(form.values.kind === 'feed_in' ||
            (form.values.kind === 'consumption' && form.values.line_bound)) && (
            <NumberInput
              label={`${meterTerms(form.values.kind).rate} pro Einheit (€)`}
              min={0}
              step={0.01}
              decimalScale={4}
              {...form.getInputProps('cost_per_unit')}
            />
          )}
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
