import {
  IconBolt,
  IconDroplet,
  IconFlame,
  IconGauge,
  IconTemperature,
  IconTrees,
  IconSun,
  IconWind,
  IconCar,
  IconChargingPile,
  type Icon,
} from '@tabler/icons-react';

/** Auswählbare Zähler-Icons (Schlüssel wird in der DB gespeichert). */
export const METER_ICONS: Record<string, { label: string; Icon: Icon }> = {
  bolt: { label: 'Strom', Icon: IconBolt },
  droplet: { label: 'Wasser', Icon: IconDroplet },
  flame: { label: 'Gas', Icon: IconFlame },
  trees: { label: 'Pellets / Holz', Icon: IconTrees },
  temperature: { label: 'Wärme', Icon: IconTemperature },
  sun: { label: 'Solar', Icon: IconSun },
  wind: { label: 'Wind', Icon: IconWind },
  charging: { label: 'E-Auto', Icon: IconChargingPile },
  car: { label: 'Kraftstoff', Icon: IconCar },
  gauge: { label: 'Allgemein', Icon: IconGauge },
};

export const DEFAULT_ICON = 'gauge';

export function getMeterIcon(key: string): Icon {
  return (METER_ICONS[key] ?? METER_ICONS[DEFAULT_ICON]).Icon;
}
