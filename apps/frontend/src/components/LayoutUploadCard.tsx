import { useEffect, useState } from 'react';
import { Button, Card, Modal, Spin, Typography, Upload } from 'antd';
import { InboxOutlined, FileOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { compressLayoutFile, LayoutCompressionError, type CompressLayoutResult } from '../features/layoutCompression/compressLayout';

/** 52 МБ — реальный лимит файла на Диск Битрикс24 (specification.md, раздел 4). */
const MAX_LAYOUT_FILE_BYTES = 52 * 1024 * 1024;
const RASTER_EXTENSIONS = ['png', 'jpg', 'jpeg'];

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`;
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type LargeFileModalState =
  | { kind: 'none' }
  | { kind: 'rasterChoice'; file: File }
  | { kind: 'compressing'; file: File }
  | { kind: 'compressSuccess'; result: CompressLayoutResult }
  | { kind: 'compressError'; file: File; message: string }
  | { kind: 'vectorOversized'; file: File };

interface LayoutUploadCardProps {
  layoutFile: File | null;
  onChange: (file: File | null) => void;
}

export function LayoutUploadCard({ layoutFile, onChange }: LayoutUploadCardProps) {
  const [modalState, setModalState] = useState<LargeFileModalState>({ kind: 'none' });

  useEffect(() => {
    if (modalState.kind === 'compressSuccess') {
      downloadFile(modalState.result.file);
    }
  }, [modalState]);

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > MAX_LAYOUT_FILE_BYTES) {
      const isRaster = RASTER_EXTENSIONS.includes(extensionOf(file.name));
      setModalState(isRaster ? { kind: 'rasterChoice', file } : { kind: 'vectorOversized', file });
      return Upload.LIST_IGNORE;
    }
    onChange(file);
    return false;
  };

  async function handleCompress(file: File) {
    setModalState({ kind: 'compressing', file });
    try {
      const result = await compressLayoutFile(file);
      setModalState({ kind: 'compressSuccess', result });
    } catch (error) {
      const message =
        error instanceof LayoutCompressionError ? error.message : 'Не удалось сжать файл. Попробуйте другой файл.';
      setModalState({ kind: 'compressError', file, message });
    }
  }

  function handleAcceptCompressed(result: CompressLayoutResult) {
    onChange(result.file);
    setModalState({ kind: 'none' });
  }

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
        title={modalState.kind === 'compressSuccess' ? 'Готово' : 'Файл больше 52 МБ'}
        open={modalState.kind !== 'none'}
        onCancel={() => setModalState({ kind: 'none' })}
        footer={null}
        closable={modalState.kind !== 'compressing'}
        maskClosable={modalState.kind !== 'compressing'}
      >
        {modalState.kind === 'rasterChoice' && (
          <>
            <p>
              Макет весит <strong>{formatMB(modalState.file.size)}</strong> — это больше лимита загрузки на Диск
              Битрикс24 (52 МБ).
            </p>
            <p>
              Можно сжать файл прямо в браузере (AVIF) и упаковать в PDF — без потери очереди на печать и без
              повторной загрузки.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button type="primary" style={{ flex: 1, minWidth: 140 }} onClick={() => handleCompress(modalState.file)}>
                Сжать файл
              </Button>
              <Button style={{ flex: 1, minWidth: 140 }} onClick={() => setModalState({ kind: 'none' })}>
                Выбрать другой файл
              </Button>
            </div>
          </>
        )}

        {modalState.kind === 'compressing' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 22 }} spin />} />
            <p style={{ fontSize: 13, margin: '10px 0 0' }}>Подбираем степень сжатия AVIF…</p>
          </div>
        )}

        {modalState.kind === 'compressSuccess' && (
          <>
            <p style={{ fontSize: 13, margin: '0 0 6px' }}>
              {formatMB(modalState.result.originalBytes)} → <strong>{formatMB(modalState.result.avifBytes)}</strong>{' '}
              (AVIF, автоматически подобранное качество).
            </p>
            <p style={{ fontSize: 13, margin: '0 0 14px' }}>
              Упаковано в PDF — <strong>{formatMB(modalState.result.pdfBytes)}</strong>. Именно этот PDF-файл выбран
              как макет и уже скачан на компьютер — он же уйдёт на Диск/в производство.
            </p>
            <Button type="primary" block onClick={() => handleAcceptCompressed(modalState.result)}>
              Готово
            </Button>
          </>
        )}

        {modalState.kind === 'compressError' && (
          <>
            <p style={{ fontSize: 13, margin: '0 0 14px' }}>{modalState.message}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button style={{ flex: 1, minWidth: 140 }} onClick={() => handleCompress(modalState.file)}>
                Повторить
              </Button>
              <Button style={{ flex: 1, minWidth: 140 }} onClick={() => setModalState({ kind: 'none' })}>
                Выбрать другой файл
              </Button>
            </div>
          </>
        )}

        {modalState.kind === 'vectorOversized' && (
          <>
            <p style={{ fontSize: 13, margin: '0 0 14px' }}>
              Макет весит <strong>{formatMB(modalState.file.size)}</strong>. Сжатие доступно только для файлов .png и
              .jpg — сконвертируйте файл в один из этих форматов или выберите другой файл.
            </p>
            <Button block onClick={() => setModalState({ kind: 'none' })}>
              Выбрать другой файл
            </Button>
          </>
        )}
      </Modal>
    </Card>
  );
}
