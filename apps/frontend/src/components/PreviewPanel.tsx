import { Segmented, Typography } from 'antd';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setView } from '../features/order/orderSlice';
import { ZONES, zoneOutlineColor } from '../features/order/previewZones';
import { useFilePreviewUrl } from '../hooks/useFilePreviewUrl';

const BODY_PATHS = [
  'M74.5,94 Q75,88 69.2,89.6 L37.8,98.4 Q28,102 29,108 L37.2,172 Q38,178 43.7,176.1 L62.3,169.9 Q68,168 68.5,162 L74.5,94 Z',
  'M165.5,94 Q165,88 170.8,89.6 L202.2,98.4 Q212,102 211,108 L202.8,172 Q202,178 196.3,176.1 L177.7,169.9 Q172,168 171.5,162 L165.5,94 Z',
  'M81,85 L159,85 Q165,85 165,91 L172,265 Q172,278 159,278 L81,278 Q68,278 68,265 L75,91 Q75,85 81,85 Z',
];

interface PreviewPanelProps {
  layoutFile: File | null;
}

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function ZoneOverlay({
  layoutFile,
  previewUrl,
  x,
  y,
  w,
  h,
}: {
  layoutFile: File | null;
  previewUrl: string | null;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  if (!layoutFile) return null;
  if (previewUrl) {
    return <image href={previewUrl} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" />;
  }
  const ext = extensionOf(layoutFile.name);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} style={{ fill: 'var(--ant-color-fill-secondary)', stroke: 'var(--ant-color-border)', strokeWidth: 1 }} />
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fill: 'var(--ant-color-text-secondary)', fontSize: 9 }}
      >
        {ext.toUpperCase()}
      </text>
    </g>
  );
}

export function PreviewPanel({ layoutFile }: PreviewPanelProps) {
  const dispatch = useAppDispatch();
  const productType = useAppSelector((state) => state.order.productType);
  const bodyColor = useAppSelector((state) => state.order.bodyColor);
  const trimColor = useAppSelector((state) => state.order.trimColor);
  const options = useAppSelector((state) => state.order.options);
  const printZone = useAppSelector((state) => state.order.printZone);
  const view = useAppSelector((state) => state.order.view);

  const previewUrl = useFilePreviewUrl(layoutFile);

  const zone = ZONES[printZone];
  const isHoodie = productType === 'hoodie';
  const outlineColor = zoneOutlineColor(bodyColor);

  const showHood = options.includes('hood');
  const showZip = options.includes('zip');
  const showPocket = options.includes('pocket');
  const showTrimDetails = options.includes('trim');
  const splitPocket = showPocket && showZip;

  return (
    <div style={{ background: 'var(--ant-color-bg-elevated)', borderRadius: 8, padding: 8, minHeight: 0 }}>
      <Segmented
        block
        value={view}
        onChange={(value) => dispatch(setView(value as 'front' | 'back'))}
        options={[
          { label: 'Вид спереди', value: 'front' },
          { label: 'Вид со спины', value: 'back' },
        ]}
        style={{ marginBottom: 6 }}
      />

      <svg
        viewBox="0 18 240 368"
        role="img"
        style={{
          width: '100%',
          height: 'clamp(230px, calc(100vh - 144px), 440px)',
          display: 'block',
          opacity: isHoodie ? 1 : 0.35,
          transition: 'opacity .15s',
        }}
      >
        <title>Схематичное превью изделия</title>
        <g transform="scale(1,1.36)">
          <g style={{ display: view === 'front' ? undefined : 'none' }}>
            <g fill={bodyColor} stroke="var(--ant-color-border-secondary)" strokeWidth={0.8}>
              {BODY_PATHS.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g>
              {zone.view === 'front' && (
                <ZoneOverlay layoutFile={layoutFile} previewUrl={previewUrl} x={zone.x} y={zone.y} w={zone.w} h={zone.h} />
              )}
            </g>
            <g fill={trimColor} stroke="var(--ant-color-border-secondary)" strokeWidth={0.8}>
              {showHood && <path d="M82,85 Q120,18 158,85 Q150,100 120,102 Q90,100 82,85 Z" />}
              {showPocket && !splitPocket && <rect x={95} y={203} width={50} height={34} rx={8} />}
              {splitPocket && (
                <>
                  <rect x={72} y={213} width={38} height={16} rx={8} />
                  <rect x={130} y={213} width={38} height={16} rx={8} />
                </>
              )}
              {showZip && (
                <g>
                  <rect x={118} y={100} width={4} height={160} />
                  <rect x={112} y={258} width={16} height={10} rx={3} />
                </g>
              )}
              {showTrimDetails && (
                <g>
                  <rect x={28} y={160} width={42} height={16} rx={6} />
                  <rect x={170} y={160} width={42} height={16} rx={6} />
                  <rect x={68} y={262} width={104} height={18} rx={8} />
                  <rect x={103} y={95} width={3} height={45} rx={1.5} />
                  <rect x={134} y={95} width={3} height={45} rx={1.5} />
                  <circle cx={104.5} cy={142} r={3} />
                  <circle cx={135.5} cy={142} r={3} />
                </g>
              )}
            </g>
            {zone.view === 'front' && !layoutFile && (
              <g fill="none" style={{ stroke: outlineColor }} strokeDasharray="4 3" strokeWidth={1.2}>
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={4} />
              </g>
            )}
          </g>

          <g style={{ display: view === 'back' ? undefined : 'none' }}>
            <g fill={bodyColor} stroke="var(--ant-color-border-secondary)" strokeWidth={0.8}>
              {BODY_PATHS.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g>
              {zone.view === 'back' && (
                <ZoneOverlay layoutFile={layoutFile} previewUrl={previewUrl} x={zone.x} y={zone.y} w={zone.w} h={zone.h} />
              )}
            </g>
            <g fill={trimColor} stroke="var(--ant-color-border-secondary)" strokeWidth={0.8}>
              {showHood && <path d="M78,82 Q120,15 162,82 Q155,105 120,108 Q85,105 78,82 Z" />}
              {showTrimDetails && (
                <g>
                  <rect x={28} y={160} width={42} height={16} rx={6} />
                  <rect x={170} y={160} width={42} height={16} rx={6} />
                  <rect x={68} y={262} width={104} height={18} rx={8} />
                </g>
              )}
            </g>
            {zone.view === 'back' && !layoutFile && (
              <g fill="none" style={{ stroke: outlineColor }} strokeDasharray="4 3" strokeWidth={1.2}>
                <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={4} />
              </g>
            )}
          </g>
        </g>
      </svg>

      {!isHoodie && (
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '8px 0 0' }}>
          Превью показано для худи. Для этого типа изделия шаблон появится позже.
        </Typography.Paragraph>
      )}
    </div>
  );
}
