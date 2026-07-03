import { ColorPicker } from 'antd';
import { COLOR_SWATCHES } from '../features/order/labels';

interface ColorSwatchGroupProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function ColorSwatchGroup({ value, onChange, label }: ColorSwatchGroupProps) {
  const isPreset = COLOR_SWATCHES.some((swatch) => swatch.value === value);

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
              width: 24,
              height: 24,
              borderRadius: '50%',
              padding: 0,
              cursor: 'pointer',
              background: swatch.value,
              border: 'none',
              boxShadow: checked
                ? 'inset 0 0 0 2px var(--ant-color-primary)'
                : 'inset 0 0 0 1px var(--ant-color-border)',
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
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: !isPreset ? value : 'var(--ant-color-fill-secondary)',
            boxShadow: !isPreset
              ? 'inset 0 0 0 2px var(--ant-color-primary)'
              : 'inset 0 0 0 1px var(--ant-color-border)',
          }}
        />
      </ColorPicker>
    </div>
  );
}
