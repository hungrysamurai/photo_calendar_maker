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

export type FontData = {
  [key in FontSubfamily]: Font
}

export enum Languages {
  RU = 'ru',
  EN = 'en'
}

export enum CalendarType {
  SinglePage = 'single-page',
  MultiPage = 'multi-page'
}

export enum FontSubfamily {
  Bold = 'bold',
  Regular = 'regular'
}

export type FormatWidthHeigth = {
  width: number,
  height: number
}

export enum FormatNames {
  A5 = 'A5',
  A4 = 'A4',
  A3 = 'A3'
}

export type OutputDimensions = {
  [key in FormatNames]: FormatWidthHeigth
}
