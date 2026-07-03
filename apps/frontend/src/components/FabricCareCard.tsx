import { Card, Radio, Select, Typography } from 'antd';
import type { CareType, FabricType } from '@garment/shared-types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCare, setFabric } from '../features/order/orderSlice';
import { CARE_LABELS, FABRIC_LABELS } from '../features/order/labels';

const FABRIC_OPTIONS = Object.entries(FABRIC_LABELS) as Array<[FabricType, string]>;
const CARE_OPTIONS = Object.entries(CARE_LABELS) as Array<[CareType, { title: string; subtitle: string }]>;

export function FabricCareCard() {
  const dispatch = useAppDispatch();
  const fabric = useAppSelector((state) => state.order.fabric);
  const care = useAppSelector((state) => state.order.care);

  return (
    <Card size="small">
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
        Ткань
      </Typography.Text>
      <Select<FabricType>
        value={fabric}
        style={{ width: '100%', marginBottom: 16 }}
        onChange={(value) => dispatch(setFabric(value))}
        options={FABRIC_OPTIONS.map(([value, label]) => ({ value, label }))}
      />

      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }} id="care-label">
        Уход за материалом
      </Typography.Text>
      <Radio.Group
        value={care}
        onChange={(e) => dispatch(setCare(e.target.value as CareType))}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}
        aria-labelledby="care-label"
      >
        {CARE_OPTIONS.map(([value, { title, subtitle }]) => (
          <Radio.Button
            key={value}
            value={value}
            style={{ textAlign: 'center', height: 'auto', padding: '8px 4px', lineHeight: 1.3 }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 13 }}>{title}</span>
              <span style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }}>{subtitle}</span>
            </span>
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  );
}
