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
    <main className="constructor-shell">
      <h2 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        Конструктор заказов одежды с принтом
      </h2>
      <DealBanner dealId={dealId} />

      <div className="constructor-grid">
        <section className="constructor-column">
          <FabricCareCard />
          <ColorCard />
          <LayoutUploadCard layoutFile={layoutFile} onChange={setLayoutFile} />
          <CommentCard />
        </section>

        <section className="constructor-column">
          <TypeMethodCard />
          <PrintZoneCard />
          <OptionsCard />
          <SizesCard />
          <SubmitSection dealId={dealId} layoutFile={layoutFile} />
        </section>

        <section className="constructor-preview-column">
          <PreviewPanel layoutFile={layoutFile} />
          <ExportPdfButton layoutFile={layoutFile} />
        </section>
      </div>
    </main>
  );
}

export default App;
