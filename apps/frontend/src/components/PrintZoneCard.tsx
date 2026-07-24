import { Card, Radio, Typography } from 'antd';
import type { PrintZone } from '@garment/shared-types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setPrintZone } from '../features/order/orderSlice';
import { PRINT_ZONE_LABELS } from '../features/order/labels';

const ZONES = Object.entries(PRINT_ZONE_LABELS) as Array<[PrintZone, string]>;

export function PrintZoneCard() {
  const dispatch = useAppDispatch();
  const printZone = useAppSelector((state) => state.order.printZone);

  return (
    <Card size="small">
      <Typography.Text type="secondary" id="zone-label" style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>
        Зона размещения принта
      </Typography.Text>
      <Radio.Group
        value={printZone}
        onChange={(e) => dispatch(setPrintZone(e.target.value as PrintZone))}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, width: '100%' }}
        aria-labelledby="zone-label"
      >
        {ZONES.map(([value, label]) => (
          <Radio.Button key={value} value={value} style={{ textAlign: 'center', fontSize: 11, padding: '6px 3px' }}>
            {label}
          </Radio.Button>
        ))}
      </Radio.Group>
      <Typography.Paragraph type="secondary" style={{ fontSize: 11, margin: '5px 0 0' }}>
        Пунктир на превью — граница зоны печати.
      </Typography.Paragraph>
    </Card>
  );
}
