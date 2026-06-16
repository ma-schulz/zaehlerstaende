import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Group,
  Stack,
  Card,
  Text,
  ThemeIcon,
  Table,
  SimpleGrid,
  ActionIcon,
  Center,
  Loader,
  Button,
} from '@mantine/core';
import { LineChart, BarChart } from '@mantine/charts';
import { IconArrowLeft, IconListNumbers } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useMeter } from '../hooks/useMeters';
import { useReadings } from '../hooks/useReadings';
import { analyze, intervalSeries } from '../lib/calculations';
import { getMeterIcon } from '../lib/icons';
import { formatCurrency, formatNumber, formatWithUnit, meterTerms } from '../lib/format';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="xl" fw={700} mt={4}>
        {value}
      </Text>
    </Card>
  );
}

export function Analysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meter = useMeter(id);
  const { data: readings, isLoading } = useReadings(id);

  if (!meter) {
    return (
      <Center h={200}>
        {isLoading ? <Loader /> : <Text c="dimmed">Zähler nicht gefunden.</Text>}
      </Center>
    );
  }

  const Icon = getMeterIcon(meter.icon);
  const t = meterTerms(meter.kind);
  const a = analyze(readings ?? [], meter.cost_per_unit);
  const series = intervalSeries(readings ?? []).map((p) => ({
    ...p,
    label: dayjs(p.date).format('DD.MM.YY'),
  }));
  const enoughData = a.count >= 2 && a.days > 0;

  return (
    <Stack>
      <Group wrap="nowrap" justify="space-between">
        <Group wrap="nowrap">
          <ActionIcon variant="subtle" size="lg" onClick={() => navigate('/meters')} aria-label="Zurück">
            <IconArrowLeft size={20} />
          </ActionIcon>
          <ThemeIcon variant="light" size="lg" radius="md">
            <Icon size={20} />
          </ThemeIcon>
          <Title order={3}>{meter.name} – Auswertung</Title>
        </Group>
        <Button
          variant="default"
          leftSection={<IconListNumbers size={18} />}
          onClick={() => navigate(`/meters/${meter.id}/readings`)}
          visibleFrom="xs"
        >
          Stände
        </Button>
      </Group>

      {!enoughData ? (
        <Card withBorder p="xl">
          <Text c="dimmed" ta="center">
            Für eine Auswertung werden mindestens zwei Zählerstände an unterschiedlichen Zeitpunkten
            benötigt. Der erste Wert zählt als Anfangsstand.
          </Text>
        </Card>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, md: t.hasMoney ? 4 : 2 }}>
            <StatCard label={`${t.amount} / Tag`} value={formatWithUnit(a.perDay, meter.decimals, meter.unit)} />
            <StatCard label={`${t.amount} / Jahr`} value={formatWithUnit(a.perYear, meter.decimals, meter.unit)} />
            {t.hasMoney && (
              <>
                <StatCard label={`${t.money} / Tag`} value={formatCurrency(a.costPerDay)} />
                <StatCard label={`${t.money} / Jahr`} value={formatCurrency(a.costPerYear)} />
              </>
            )}
          </SimpleGrid>

          <Card withBorder>
            <Title order={5} mb="sm">
              Kennzahlen
            </Title>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>Zeitraum</Table.Td>
                  <Table.Td ta="right">
                    {formatNumber(a.days, 1)} Tage ({a.count} Messwerte)
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Anfangsstand</Table.Td>
                  <Table.Td ta="right">{formatWithUnit(a.firstValue ?? 0, meter.decimals, meter.unit)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Aktueller Stand</Table.Td>
                  <Table.Td ta="right">{formatWithUnit(a.lastValue ?? 0, meter.decimals, meter.unit)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Gesamt{t.amount.toLowerCase()}</Table.Td>
                  <Table.Td ta="right">{formatWithUnit(a.totalConsumption, meter.decimals, meter.unit)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t.amount} pro Tag</Table.Td>
                  <Table.Td ta="right">{formatWithUnit(a.perDay, meter.decimals, meter.unit)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Voraussichtlich pro Jahr</Table.Td>
                  <Table.Td ta="right">{formatWithUnit(a.perYear, meter.decimals, meter.unit)}</Table.Td>
                </Table.Tr>
                {t.hasMoney && (
                  <>
                    <Table.Tr>
                      <Table.Td>{t.money} pro Tag</Table.Td>
                      <Table.Td ta="right">{formatCurrency(a.costPerDay)}</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>{t.money} pro Jahr</Table.Td>
                      <Table.Td ta="right">{formatCurrency(a.costPerYear)}</Table.Td>
                    </Table.Tr>
                  </>
                )}
              </Table.Tbody>
            </Table>
          </Card>

          <Card withBorder>
            <Title order={5} mb="sm">
              Zählerstand über Zeit
            </Title>
            <LineChart
              h={260}
              data={series}
              dataKey="label"
              series={[{ name: 'value', label: `Stand (${meter.unit})`, color: 'teal.5' }]}
              curveType="linear"
              withDots
            />
          </Card>

          <Card withBorder>
            <Title order={5} mb="sm">
              {t.amount} pro Tag (je Intervall)
            </Title>
            <BarChart
              h={260}
              data={series.slice(1)}
              dataKey="label"
              series={[{ name: 'perDay', label: `${t.amount}/Tag (${meter.unit})`, color: 'blue.5' }]}
            />
          </Card>
        </>
      )}
    </Stack>
  );
}
