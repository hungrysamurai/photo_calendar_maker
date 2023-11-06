import { Font } from "opentype.js";

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    shimIndexedDB: IDBFactory;
  }
}

export type CalendarData = {
  startYear: number;
  firstMonthIndex: number;
  lang: string;
  font: string;
  mode: string;
};

export type ImageObject = {
  id: number;
  image: string;
};

export type FontArray = Font[];

export type LoadedFontsObject = {
  [key: string]: FontArray
};