import { useState } from 'react';
import { Alert, Button, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks';
import { exportOrderPdf } from '../features/order/exportOrderPdf';

interface ExportPdfButtonProps {
  layoutFile: File | null;
}

export function ExportPdfButton({ layoutFile }: ExportPdfButtonProps) {
  const order = useAppSelector((state) => state.order);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    const result = await exportOrderPdf(order, layoutFile);
    setExporting(false);
    if (!result.success) {
      setError(result.message ?? 'Не удалось сформировать PDF бланка заказа');
    }
  }

  return (
    <>
      <Button icon={<DownloadOutlined />} block onClick={handleExport} loading={exporting}>
        Скачать файл заказа в PDF
      </Button>
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0' }}>
        Сводная спецификация: параметры заказа и файл макета.
      </Typography.Paragraph>
      {error && (
        <Alert
          style={{ marginTop: 8 }}
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
