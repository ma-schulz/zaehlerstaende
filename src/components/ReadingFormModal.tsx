import { useEffect } from 'react';
import { Modal, NumberInput, Button, Stack, Group } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateReading, useUpdateReading } from '../hooks/useReadings';
import type { Meter, Reading } from '../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  meter: Meter;
  /** Bei gesetztem Wert: Bearbeiten-Modus. */
  reading?: Reading;
}

interface FormValues {
  value: number | '';
  reading_at: Date | null;
}

export function ReadingFormModal({ opened, onClose, meter, reading }: Props) {
  const create = useCreateReading(meter.id);
  const update = useUpdateReading(meter.id);

  const form = useForm<FormValues>({
    initialValues: { value: '', reading_at: new Date() },
    validate: {
      value: (v) => (v === '' || Number.isNaN(v) ? 'Wert erforderlich' : null),
      reading_at: (v) => (v ? null : 'Datum erforderlich'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    if (reading) {
      form.setValues({ value: reading.value, reading_at: new Date(reading.reading_at) });
    } else {
      form.setValues({ value: '', reading_at: new Date() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, reading]);

  const submit = form.onSubmit(async ({ value, reading_at }) => {
    if (value === '' || !reading_at) return;
    const input = { value: Number(value), reading_at: reading_at.toISOString() };
    try {
      if (reading) {
        await update.mutateAsync({ id: reading.id, input });
      } else {
        await create.mutateAsync(input);
      }
      onClose();
    } catch (e) {
      notifications.show({ color: 'red', message: (e as Error).message });
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={reading ? 'Stand bearbeiten' : 'Stand erfassen'}
      centered
    >
      <form onSubmit={submit}>
        <Stack>
          <NumberInput
            label="Zählerstand"
            placeholder="0"
            suffix={` ${meter.unit}`}
            decimalScale={meter.decimals}
            fixedDecimalScale
            decimalSeparator=","
            thousandSeparator="."
            hideControls
            data-autofocus
            {...form.getInputProps('value')}
          />
          <DateTimePicker
            label="Datum & Uhrzeit"
            valueFormat="DD.MM.YYYY HH:mm"
            {...form.getInputProps('reading_at')}
          />
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
