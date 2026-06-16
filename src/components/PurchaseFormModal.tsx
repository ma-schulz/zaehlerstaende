import { useEffect } from 'react';
import { Modal, NumberInput, Button, Stack, Group, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreatePurchase, useUpdatePurchase } from '../hooks/usePurchases';
import { formatCurrency } from '../lib/format';
import type { Meter, Purchase } from '../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  meter: Meter;
  /** Bei gesetztem Wert: Bearbeiten-Modus. */
  purchase?: Purchase;
}

interface FormValues {
  quantity: number | '';
  total_price: number | '';
  purchased_at: Date | null;
}

export function PurchaseFormModal({ opened, onClose, meter, purchase }: Props) {
  const create = useCreatePurchase(meter.id);
  const update = useUpdatePurchase(meter.id);

  const form = useForm<FormValues>({
    initialValues: { quantity: '', total_price: '', purchased_at: new Date() },
    validate: {
      quantity: (v) => (v !== '' && Number(v) > 0 ? null : 'Menge > 0 erforderlich'),
      total_price: (v) => (v === '' || Number(v) < 0 ? 'Preis erforderlich' : null),
      purchased_at: (v) => (v ? null : 'Datum erforderlich'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    if (purchase) {
      form.setValues({
        quantity: purchase.quantity,
        total_price: purchase.total_price,
        purchased_at: new Date(purchase.purchased_at),
      });
    } else {
      form.setValues({ quantity: '', total_price: '', purchased_at: new Date() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, purchase]);

  // Live-Anzeige des resultierenden Stückpreises.
  const unitPrice =
    form.values.quantity !== '' && Number(form.values.quantity) > 0 && form.values.total_price !== ''
      ? Number(form.values.total_price) / Number(form.values.quantity)
      : null;

  const submit = form.onSubmit(async ({ quantity, total_price, purchased_at }) => {
    if (quantity === '' || total_price === '' || !purchased_at) return;
    const input = {
      quantity: Number(quantity),
      total_price: Number(total_price),
      purchased_at: purchased_at.toISOString(),
    };
    try {
      if (purchase) {
        await update.mutateAsync({ id: purchase.id, input });
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
      title={purchase ? 'Zukauf bearbeiten' : 'Zukauf erfassen'}
      centered
    >
      <form onSubmit={submit}>
        <Stack>
          <NumberInput
            label="Menge"
            placeholder="0"
            suffix={` ${meter.unit}`}
            decimalScale={meter.decimals}
            decimalSeparator=","
            thousandSeparator="."
            min={0}
            hideControls
            data-autofocus
            {...form.getInputProps('quantity')}
          />
          <NumberInput
            label="Gesamtpreis (€)"
            placeholder="0,00"
            decimalScale={2}
            decimalSeparator=","
            thousandSeparator="."
            min={0}
            hideControls
            {...form.getInputProps('total_price')}
          />
          {unitPrice !== null && (
            <Text size="sm" c="dimmed">
              Stückpreis: {formatCurrency(unitPrice)} / {meter.unit}
            </Text>
          )}
          <DateTimePicker
            label="Kaufdatum"
            valueFormat="DD.MM.YYYY HH:mm"
            {...form.getInputProps('purchased_at')}
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
