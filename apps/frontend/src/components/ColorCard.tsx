import { Card, Col, Row, Typography } from 'antd';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setBodyColor, setTrimColor } from '../features/order/orderSlice';
import { ColorSwatchGroup } from './ColorSwatchGroup';

export function ColorCard() {
  const dispatch = useAppDispatch();
  const bodyColor = useAppSelector((state) => state.order.bodyColor);
  const trimColor = useAppSelector((state) => state.order.trimColor);

  return (
    <Card size="small">
      <Row gutter={10}>
        <Col span={12}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>
            Основной цвет
          </Typography.Text>
          <ColorSwatchGroup value={bodyColor} onChange={(v) => dispatch(setBodyColor(v))} label="Основной цвет" />
        </Col>
        <Col span={12}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 5, fontSize: 12 }}>
            Цвет отделки
          </Typography.Text>
          <ColorSwatchGroup value={trimColor} onChange={(v) => dispatch(setTrimColor(v))} label="Цвет отделки" />
        </Col>
      </Row>
    </Card>
  );
}
