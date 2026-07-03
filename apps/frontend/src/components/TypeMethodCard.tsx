import { Card, Radio, Typography } from 'antd';
import type { PrintMethod, ProductType } from '@garment/shared-types';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setPrintMethod, setProductType } from '../features/order/orderSlice';
import { PRINT_METHOD_LABELS, PRODUCT_TYPE_LABELS } from '../features/order/labels';

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS) as Array<[ProductType, string]>;
const PRINT_METHODS = Object.entries(PRINT_METHOD_LABELS) as Array<[PrintMethod, string]>;

export function TypeMethodCard() {
  const dispatch = useAppDispatch();
  const productType = useAppSelector((state) => state.order.productType);
  const printMethod = useAppSelector((state) => state.order.printMethod);

  return (
    <Card size="small">
      <Typography.Text type="secondary" id="type-label" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
        Тип изделия
      </Typography.Text>
      <Radio.Group
        value={productType}
        onChange={(e) => dispatch(setProductType(e.target.value as ProductType))}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
          gap: 8,
          width: '100%',
          marginBottom: 16,
        }}
        aria-labelledby="type-label"
      >
        {PRODUCT_TYPES.map(([value, label]) => (
          <Radio.Button key={value} value={value} style={{ textAlign: 'center', height: 'auto', padding: '10px 4px' }}>
            <span style={{ fontSize: 11 }}>{label}</span>
          </Radio.Button>
        ))}
      </Radio.Group>

      <Typography.Text type="secondary" id="method-label" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
        Способ нанесения принта
      </Typography.Text>
      <Radio.Group
        value={printMethod}
        onChange={(e) => dispatch(setPrintMethod(e.target.value as PrintMethod))}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}
        aria-labelledby="method-label"
      >
        {PRINT_METHODS.map(([value, label]) => (
          <Radio.Button key={value} value={value} style={{ textAlign: 'center' }}>
            {label}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Card>
  );
}
