/**
 * Подписи значений формы заказа общие с бэкендом (PDF-бланк заказа, specification.md
 * раздел 5) — единственный источник истины в `@garment/shared-types`, здесь только реэкспорт.
 */
export {
  PRODUCT_TYPE_LABELS,
  FABRIC_LABELS,
  CARE_LABELS,
  PRINT_METHOD_LABELS,
  PRINT_ZONE_LABELS,
  OPTION_LABELS,
} from '@garment/shared-types';

export const COLOR_SWATCHES: Array<{ value: string; label: string }> = [
  { value: '#f3c9d3', label: 'Бледно-розовый' },
  { value: '#ffffff', label: 'Белый' },
  { value: '#1a1a1a', label: 'Чёрный' },
  { value: '#6f6f6f', label: 'Серый' },
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
