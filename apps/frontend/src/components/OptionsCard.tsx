import { Card, Checkbox, Typography } from 'antd';
import type { ExtraOption } from '@garment/shared-types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { TYPE_OPTIONS, toggleOption } from '../features/order/orderSlice';
import { OPTION_LABELS } from '../features/order/labels';

const ALL_OPTIONS = Object.keys(OPTION_LABELS) as ExtraOption[];

export function OptionsCard() {
  const dispatch = useAppDispatch();
  const productType = useAppSelector((state) => state.order.productType);
  const options = useAppSelector((state) => state.order.options);
  const allowed = TYPE_OPTIONS[productType];

  const visibleOptions = ALL_OPTIONS.filter((option) => allowed.includes(option));

  return (
    <Card size="small">
      <Typography.Text
        type="secondary"
        id="options-label"
        style={{ display: 'block', marginBottom: 5, fontSize: 12 }}
      >
        Дополнительные опции
      </Typography.Text>
      <div role="group" aria-labelledby="options-label" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
        {visibleOptions.map((option) => (
          <Checkbox
            key={option}
            checked={options.includes(option)}
            onChange={() => dispatch(toggleOption(option))}
          >
            {OPTION_LABELS[option]}
          </Checkbox>
        ))}
      </div>
      {allowed.includes('pocket') && allowed.includes('zip') && (
        <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: '5px 0 0' }}>
          При выборе кармана и молнии — кармана будет два.
        </Typography.Paragraph>
      )}
    </Card>
  );
}
