import type {
  CareType,
  ExtraOption,
  FabricType,
  PrintMethod,
  PrintZone,
  ProductType,
} from '@garment/shared-types';

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

export const COLOR_SWATCHES: Array<{ value: string; label: string }> = [
  { value: '#f3c9d3', label: 'Бледно-розовый' },
  { value: '#ffffff', label: 'Белый' },
  { value: '#1a1a1a', label: 'Чёрный' },
  { value: '#8a8a8a', label: 'Серый' },
  { value: '#7a1f1f', label: 'Тёмно-красный' },
  { value: '#1f9e96', label: 'Бирюзовый' },
  { value: '#f2c200', label: 'Ярко-жёлтый' },
];

/** Размеры Грудь/Длина, см — справочная таблица (specification.md, раздел 3.4). */
export const SIZE_CHART: Array<{ size: string; chest: number; length: number }> = [
  { size: 'S', chest: 92, length: 66 },
  { size: 'M', chest: 96, length: 68 },
  { size: 'L', chest: 100, length: 70 },
  { size: 'XL', chest: 104, length: 72 },
  { size: '2XL', chest: 108, length: 74 },
  { size: '3XL', chest: 112, length: 76 },
  { size: '4XL', chest: 116, length: 78 },
  { size: '5XL', chest: 120, length: 80 },
  { size: '6XL', chest: 124, length: 82 },
  { size: '7XL', chest: 128, length: 84 },
];
