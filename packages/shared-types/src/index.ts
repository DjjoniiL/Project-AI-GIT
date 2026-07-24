export const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL'] as const;
export type Size = (typeof SIZES)[number];

/** JSON-структура размеров/количества, зафиксированная на Этапе 0 (specification.md, раздел 8). */
export type SizeQuantities = Partial<Record<Size, number>>;

export type ProductType = 'tshirt' | 'hoodie' | 'sweatshirt' | 'longsleeve';

export type FabricType =
  | 'terry_2_thread_no_fleece'
  | 'terry_2_thread_fleece'
  | 'terry_3_thread_no_fleece'
  | 'terry_3_thread_fleece';

/** Уход за материалом: долговечный (стирка 60°) / бережный (стирка 40°). */
export type CareType = 'durable' | 'gentle';

export type PrintMethod = 'dtf' | 'sublimation' | 'embroidery';

export type PrintZone = 'chest_left' | 'chest_full' | 'sleeve' | 'back';

export type ExtraOption = 'hood' | 'pocket' | 'zip' | 'trim';

export interface OrderFormData {
  productType: ProductType;
  fabric: FabricType;
  care: CareType;
  printMethod: PrintMethod;
  bodyColor: string;
  trimColor: string;
  sizes: SizeQuantities;
  options: ExtraOption[];
  printZone: PrintZone;
  comment: string;
  /** ID/ссылка на файл макета на Диске Битрикс24, заполняется после загрузки. */
  designFileId?: string;
}

/**
 * Маппинг полей формы на пользовательские поля сделки Битрикс24 (UF_CRM_*).
 * Коды подтверждены живыми полями на актуальном портале (specification.md, раздел 6).
 */
export const UF_FIELD_MAP: Record<keyof OrderFormData, string> = {
  productType: 'UF_CRM_PRODUCT_TYPE',
  fabric: 'UF_CRM_FABRIC',
  care: 'UF_CRM_CARE',
  printMethod: 'UF_CRM_PRINT_METHOD',
  bodyColor: 'UF_CRM_BODY_COLOR',
  trimColor: 'UF_CRM_TRIM_COLOR',
  sizes: 'UF_CRM_SIZES_JSON',
  options: 'UF_CRM_OPTIONS',
  printZone: 'UF_CRM_PRINT_ZONE',
  comment: 'UF_CRM_COMMENT',
  designFileId: 'UF_CRM_DESIGN_FILE_ID',
};

/**
 * Человекочитаемые подписи значений формы заказа — общие для фронтенда (карточки выбора)
 * и бэкенда (HTML-шаблон PDF-бланка заказа, specification.md раздел 5), единственный
 * источник истины, чтобы тексты не разъезжались между `apps/frontend` и `apps/backend`.
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  tshirt: 'Футболка',
  hoodie: 'Худи',
  sweatshirt: 'Свитшот',
  longsleeve: 'Лонгслив',
};

export const FABRIC_LABELS: Record<FabricType, string> = {
  terry_2_thread_no_fleece: 'Футер 2-х нитка, без начёса',
  terry_2_thread_fleece: 'Футер 2-х нитка, с начёсом',
  terry_3_thread_no_fleece: 'Футер 3-х нитка, без начёса',
  terry_3_thread_fleece: 'Футер 3-х нитка, с начёсом',
};

export const CARE_LABELS: Record<CareType, { title: string; subtitle: string }> = {
  durable: { title: 'Долговечный', subtitle: 'стирка 60°' },
  gentle: { title: 'Бережный уход', subtitle: 'стирка 40°' },
};

export const PRINT_METHOD_LABELS: Record<PrintMethod, string> = {
  dtf: 'ДТФ',
  sublimation: 'Сублимация',
  embroidery: 'Вышивка',
};

export const PRINT_ZONE_LABELS: Record<PrintZone, string> = {
  chest_left: 'Грудь слева',
  chest_full: 'Вся грудь',
  sleeve: 'Рукав',
  back: 'Спина',
};

export const OPTION_LABELS: Record<ExtraOption, string> = {
  hood: 'Капюшон',
  pocket: 'Карман',
  zip: 'Молния',
  trim: 'Отделка',
};
