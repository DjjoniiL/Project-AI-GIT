import { LinkOutlined } from '@ant-design/icons';

interface DealBannerProps {
  dealId: string | undefined;
}

export function DealBanner({ dealId }: DealBannerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        padding: '7px 10px',
        background: 'var(--ant-color-primary-bg)',
        borderRadius: 'var(--ant-border-radius)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LinkOutlined style={{ color: 'var(--ant-color-primary)' }} />
        <span style={{ fontSize: 13, color: 'var(--ant-color-primary-text)' }}>
          Вкладка в карточке сделки Битрикс24
        </span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ant-color-primary-text)' }}>
        {dealId ? `Сделка #${dealId}` : 'Новая сделка'}
      </span>
    </div>
  );
}
