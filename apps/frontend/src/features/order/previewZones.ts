import type { PrintZone } from '@garment/shared-types';
import type { ViewSide } from './orderSlice';

export interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
  view: ViewSide;
}

/** Координаты зон печати на SVG-превью (design/maket-6.html). */
export const ZONES: Record<PrintZone, ZoneRect> = {
  chest_left: { x: 130, y: 115, w: 28, h: 28, view: 'front' },
  chest_full: { x: 80, y: 108, w: 80, h: 95, view: 'front' },
  sleeve: { x: 38, y: 115, w: 26, h: 45, view: 'front' },
  back: { x: 80, y: 108, w: 80, h: 95, view: 'back' },
};

const LIGHT_BODY_COLORS = ['#ffffff', '#f3c9d3'];

export function zoneOutlineColor(bodyColor: string): string {
  return LIGHT_BODY_COLORS.includes(bodyColor.toLowerCase()) ? '#4a4a4a' : '#ffffff';
}
