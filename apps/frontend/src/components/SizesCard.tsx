import { useState } from 'react';
import { Card, InputNumber, Modal, Table, Typography } from 'antd';
import type { Size } from '@garment/shared-types';
import { SIZES } from '@garment/shared-types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setSizeQuantity } from '../features/order/orderSlice';
import { SIZE_CHART } from '../features/order/labels';

export function SizesCard() {
  const dispatch = useAppDispatch();
  const sizes = useAppSelector((state) => state.order.sizes);
  const [chartOpen, setChartOpen] = useState(false);

  const total = Object.values(sizes).reduce((sum, qty) => sum + (qty ?? 0), 0);

  return (
    <Card size="small">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text type="secondary" id="sizes-label" style={{ fontSize: 12 }}>
            Размеры и количество
          </Typography.Text>
          <a onClick={() => setChartOpen(true)} style={{ fontSize: 11 }}>
            Таблица размеров
          </a>
        </div>
        <Typography.Text strong style={{ fontSize: 12 }} aria-live="polite">
          Итого: {total} шт.
        </Typography.Text>
      </div>

      <div
        role="group"
        aria-labelledby="sizes-label"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZES.length}, 1fr)`, gap: 3 }}
      >
        {SIZES.map((size) => (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <label htmlFor={`qty-${size}`} style={{ fontSize: 11, color: 'var(--ant-color-text-tertiary)' }}>
              {size}
            </label>
            <InputNumber
              id={`qty-${size}`}
              min={0}
              value={sizes[size] ?? 0}
              onChange={(value) => dispatch(setSizeQuantity({ size: size as Size, quantity: value ?? 0 }))}
              controls={false}
              style={{ width: '100%', textAlign: 'center' }}
            />
          </div>
        ))}
      </div>

      <Modal
        title="Таблица размеров"
        open={chartOpen}
        onCancel={() => setChartOpen(false)}
        footer={null}
      >
        <Table
          size="small"
          pagination={false}
          dataSource={SIZE_CHART}
          rowKey="size"
          columns={[
            { title: 'Размер', dataIndex: 'size' },
            { title: 'Грудь, см', dataIndex: 'chest', align: 'right' },
            { title: 'Длина, см', dataIndex: 'length', align: 'right' },
          ]}
        />
        <Typography.Paragraph type="secondary" style={{ fontSize: 11, marginTop: 10, marginBottom: 0 }}>
          Замеры приблизительные, для ориентира при выборе размера.
        </Typography.Paragraph>
      </Modal>
    </Card>
  );
}
