import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CareType,
  ExtraOption,
  FabricType,
  PrintMethod,
  PrintZone,
  ProductType,
  Size,
  SizeQuantities,
} from '@garment/shared-types';

export type ViewSide = 'front' | 'back';

export interface OrderState {
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
  view: ViewSide;
}

/** Какие доп. опции применимы к каждому типу изделия (specification.md, раздел 3.5; design/maket-6.html). */
export const TYPE_OPTIONS: Record<ProductType, ExtraOption[]> = {
  tshirt: ['trim'],
  hoodie: ['hood', 'pocket', 'zip', 'trim'],
  sweatshirt: ['zip', 'trim'],
  longsleeve: ['trim'],
};

/** Зона «Спина» показывается с видом сзади, остальные — спереди. */
export function viewForZone(zone: PrintZone): ViewSide {
  return zone === 'back' ? 'back' : 'front';
}

function isFleece(fabric: FabricType): boolean {
  return !fabric.includes('no_fleece');
}

function threadCount(fabric: FabricType): 2 | 3 {
  return fabric.includes('_2_') ? 2 : 3;
}

function fabricFor(thread: 2 | 3, fleece: boolean): FabricType {
  if (thread === 2) {
    return fleece ? 'terry_2_thread_fleece' : 'terry_2_thread_no_fleece';
  }
  return fleece ? 'terry_3_thread_fleece' : 'terry_3_thread_no_fleece';
}

const initialState: OrderState = {
  productType: 'hoodie',
  fabric: 'terry_2_thread_no_fleece',
  care: 'gentle',
  printMethod: 'dtf',
  bodyColor: '#1a1a1a',
  trimColor: '#7a1f1f',
  sizes: {},
  options: ['hood', 'pocket', 'trim'],
  printZone: 'chest_full',
  comment: '',
  view: 'front',
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setProductType(state, action: PayloadAction<ProductType>) {
      state.productType = action.payload;
      const allowed = TYPE_OPTIONS[action.payload];
      state.options = state.options.filter((option) => allowed.includes(option));
    },
    setFabric(state, action: PayloadAction<FabricType>) {
      state.fabric = action.payload;
      state.care = threadCount(action.payload) === 2 ? 'gentle' : 'durable';
    },
    setCare(state, action: PayloadAction<CareType>) {
      state.care = action.payload;
      const fleece = isFleece(state.fabric);
      state.fabric = fabricFor(action.payload === 'durable' ? 3 : 2, fleece);
    },
    setPrintMethod(state, action: PayloadAction<PrintMethod>) {
      state.printMethod = action.payload;
    },
    setBodyColor(state, action: PayloadAction<string>) {
      state.bodyColor = action.payload;
    },
    setTrimColor(state, action: PayloadAction<string>) {
      state.trimColor = action.payload;
    },
    setSizeQuantity(state, action: PayloadAction<{ size: Size; quantity: number }>) {
      const { size, quantity } = action.payload;
      if (quantity > 0) {
        state.sizes[size] = quantity;
      } else {
        delete state.sizes[size];
      }
    },
    toggleOption(state, action: PayloadAction<ExtraOption>) {
      const option = action.payload;
      if (state.options.includes(option)) {
        state.options = state.options.filter((o) => o !== option);
      } else {
        state.options.push(option);
      }
    },
    setPrintZone(state, action: PayloadAction<PrintZone>) {
      state.printZone = action.payload;
      state.view = viewForZone(action.payload);
    },
    setView(state, action: PayloadAction<ViewSide>) {
      state.view = action.payload;
    },
    setComment(state, action: PayloadAction<string>) {
      state.comment = action.payload;
    },
  },
});

export const {
  setProductType,
  setFabric,
  setCare,
  setPrintMethod,
  setBodyColor,
  setTrimColor,
  setSizeQuantity,
  toggleOption,
  setPrintZone,
  setView,
  setComment,
} = orderSlice.actions;

export default orderSlice.reducer;
