import { SimpleGrid, ActionIcon, Tooltip, Input } from '@mantine/core';
import { METER_ICONS } from '../lib/icons';

interface Props {
  value: string;
  onChange: (key: string) => void;
  label?: string;
}

export function IconPicker({ value, onChange, label = 'Icon' }: Props) {
  return (
    <Input.Wrapper label={label}>
      <SimpleGrid cols={{ base: 5, sm: 6 }} spacing="xs" mt={4}>
        {Object.entries(METER_ICONS).map(([key, { label: iconLabel, Icon }]) => (
          <Tooltip key={key} label={iconLabel} withArrow>
            <ActionIcon
              variant={value === key ? 'filled' : 'default'}
              size="lg"
              onClick={() => onChange(key)}
              aria-label={iconLabel}
            >
              <Icon size={20} />
            </ActionIcon>
          </Tooltip>
        ))}
      </SimpleGrid>
    </Input.Wrapper>
  );
}
