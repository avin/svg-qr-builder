import { localeSlice } from "./locale/localeSlice";
export interface StoreState {
  locale: ReturnType<typeof localeSlice.reducer>;
}
