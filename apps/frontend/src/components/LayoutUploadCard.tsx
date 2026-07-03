import { useState } from 'react';
import { Card, Modal, Upload, Typography } from 'antd';
import { InboxOutlined, FileOutlined, CloseOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

/**
 * 52 МБ — реальный лимит файла на Диск Битрикс24 (specification.md, раздел 4).
 * Адаптивное AVIF-сжатие для объёмных растровых макетов (раздел 4.1) — отдельная
 * задача на WASM-кодирование (`@jsquash/avif`), в этой итерации не реализована:
 * оба сценария (растровый/векторный) пока просто отклоняются с сообщением.
 */
const MAX_LAYOUT_FILE_BYTES = 52 * 1024 * 1024;

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`;
}

interface LayoutUploadCardProps {
  layoutFile: File | null;
  onChange: (file: File | null) => void;
}

export function LayoutUploadCard({ layoutFile, onChange }: LayoutUploadCardProps) {
  const [oversizedFile, setOversizedFile] = useState<File | null>(null);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > MAX_LAYOUT_FILE_BYTES) {
      setOversizedFile(file);
      return Upload.LIST_IGNORE;
    }
    onChange(file);
    return false;
  };

  return (
    <Card size="small" styles={{ body: { padding: '12px 16px' } }}>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6, fontSize: 13 }}>
        Макет принта
      </Typography.Text>

      {layoutFile ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            background: 'var(--ant-color-fill-tertiary)',
            borderRadius: 'var(--ant-border-radius)',
          }}
        >
          <FileOutlined style={{ color: 'var(--ant-color-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {layoutFile.name}
          </span>
          <button
            type="button"
            aria-label="Удалить макет"
            onClick={() => onChange(null)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 3, flexShrink: 0 }}
          >
            <CloseOutlined />
          </button>
        </div>
      ) : (
        <Upload.Dragger
          accept=".png,.jpg,.jpeg,.pdf,.ai,.eps"
          multiple={false}
          showUploadList={false}
          beforeUpload={beforeUpload}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p style={{ fontSize: 12, margin: '4px 0 2px' }}>Перетащите файл или выберите на компьютере</p>
          <p style={{ fontSize: 11, color: 'var(--ant-color-text-secondary)', margin: 0 }}>
            .png, .jpg, .pdf, .ai, .eps — до 52 МБ
          </p>
        </Upload.Dragger>
      )}

      <Modal
        title="Файл больше 52 МБ"
        open={oversizedFile !== null}
        onCancel={() => setOversizedFile(null)}
        onOk={() => setOversizedFile(null)}
        okText="Понятно"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>
          Макет весит <strong>{oversizedFile ? formatMB(oversizedFile.size) : ''}</strong> — это больше лимита
          загрузки на Диск Битрикс24 (52 МБ).
        </p>
        <p>Выберите файл поменьше или сожмите его перед загрузкой.</p>
      </Modal>
    </Card>
  );
}
