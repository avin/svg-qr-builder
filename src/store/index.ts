import { configureStore } from "@reduxjs/toolkit";
import type { Action, ThunkAction, ThunkDispatch } from "@reduxjs/toolkit";
import { localeSlice } from "./locale/localeSlice";

export const store = configureStore({
  reducer: { locale: localeSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunkAction<T> = ThunkAction<T, RootState, unknown, Action<string>>;

export type AppThunkDispatch = ThunkDispatch<RootState, unknown, Action<string>>;
