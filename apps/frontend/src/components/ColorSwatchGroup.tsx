import { ColorPicker } from 'antd';
import { COLOR_SWATCHES } from '../features/order/labels';

interface ColorSwatchGroupProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function ColorSwatchGroup({ value, onChange, label }: ColorSwatchGroupProps) {
  const isPreset = COLOR_SWATCHES.some((swatch) => swatch.value === value);
  const baseRing = '0 0 0 1px rgba(0,0,0,.38), inset 0 0 0 1px rgba(255,255,255,.55)';
  const activeRing = '0 0 0 2px var(--ant-color-primary), 0 0 0 4px var(--ant-color-bg-container), 0 0 0 5px rgba(0,0,0,.34)';

  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {COLOR_SWATCHES.map((swatch) => {
        const checked = value.toLowerCase() === swatch.value.toLowerCase();
        return (
          <button
            key={swatch.value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={swatch.label}
            title={swatch.label}
            onClick={() => onChange(swatch.value)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              padding: 0,
              cursor: 'pointer',
              background: swatch.value,
              border: 'none',
              boxShadow: checked ? activeRing : baseRing,
            }}
          />
        );
      })}
      <ColorPicker value={value} onChangeComplete={(color) => onChange(color.toHexString())} size="small">
        <button
          type="button"
          aria-label={`Свой цвет — ${label}`}
          title="Свой цвет"
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: !isPreset ? value : 'var(--ant-color-fill-secondary)',
            boxShadow: !isPreset ? activeRing : baseRing,
          }}
        />
      </ColorPicker>
    </div>
  );
}
