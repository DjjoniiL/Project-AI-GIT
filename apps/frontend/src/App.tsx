import { useMemo, useState } from 'react';
import { getDealIdFromLocation } from './features/order/placementContext';
import { DealBanner } from './components/DealBanner';
import { FabricCareCard } from './components/FabricCareCard';
import { ColorCard } from './components/ColorCard';
import { OptionsCard } from './components/OptionsCard';
import { LayoutUploadCard } from './components/LayoutUploadCard';
import { SizesCard } from './components/SizesCard';
import { CommentCard } from './components/CommentCard';
import { SubmitSection } from './components/SubmitSection';
import { PreviewPanel } from './components/PreviewPanel';
import { PrintZoneCard } from './components/PrintZoneCard';
import { TypeMethodCard } from './components/TypeMethodCard';
import { ExportPdfButton } from './components/ExportPdfButton';

function App() {
  const dealId = useMemo(() => getDealIdFromLocation(window.location.search), []);
  const [layoutFile, setLayoutFile] = useState<File | null>(null);

  return (
    <main style={{ padding: '1rem', maxWidth: 960, margin: '0 auto' }}>
      <h2 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Конструктор заказов одежды с принтом
      </h2>
      <DealBanner dealId={dealId} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <FabricCareCard />
          <ColorCard />
          <OptionsCard />
          <LayoutUploadCard layoutFile={layoutFile} onChange={setLayoutFile} />
          <SizesCard />
          <CommentCard />
          <SubmitSection dealId={dealId} layoutFile={layoutFile} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, position: 'sticky', top: 0 }}>
          <PreviewPanel layoutFile={layoutFile} />
          <PrintZoneCard />
          <TypeMethodCard />
          <ExportPdfButton layoutFile={layoutFile} />
        </div>
      </div>
    </main>
  );
}

export default App;
