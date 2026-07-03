import { useState } from 'react';
import { Alert, Button, Typography } from 'antd';
import { useAppSelector } from '../hooks';
import { submitOrder } from '../features/order/submitOrder';

interface SubmitSectionProps {
  dealId: string | undefined;
  layoutFile: File | null;
}

export function SubmitSection({ dealId, layoutFile }: SubmitSectionProps) {
  const order = useAppSelector((state) => state.order);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setResult(null);
    const response = await submitOrder(order, dealId, layoutFile);
    setSubmitting(false);
    if (response.success) {
      setResult({ ok: true, message: `Сделка #${response.dealId} создана/обновлена.` });
    } else {
      setResult({ ok: false, message: response.message });
    }
  }

  return (
    <>
      <Button type="primary" block onClick={handleSubmit} loading={submitting}>
        Отправить в сделку
      </Button>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0' }}>
        Создаст сделку в Битрикс24 (или обновит текущую) и прикрепит макет.
      </Typography.Paragraph>
      {result && (
        <Alert
          style={{ marginTop: 8 }}
          type={result.ok ? 'success' : 'error'}
          message={result.message}
          showIcon
          closable
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}
