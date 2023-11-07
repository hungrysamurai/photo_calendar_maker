import { Font } from "opentype.js";

export enum Languages {
 RU = 'ru',
 EN = 'en'
}

export enum FormatNames {
 A5 = 'A5',
 A4 = 'A4',
 A3 = 'A3'
}

export enum CalendarType {
 SinglePage = 'single-page',
 MultiPage = 'multi-page'
}

export enum FontSubfamily {
 Bold = 'bold',
 Regular = 'regular'
}

export enum LoadingState {
 Show = 'show',
 Hide = 'hide'
}

declare global {
 interface Window {
  mozIndexedDB: IDBFactory;
  webkitIndexedDB: IDBFactory;
  msIndexedDB: IDBFactory;
  shimIndexedDB: IDBFactory;
 }

 type CalendarData = {
  startYear: number;
  firstMonthIndex: number;
  lang: string;
  font: string;
  mode: string;
 };

 type ImageObject = {
  id: number;
  image: string;
 };

 type FontArray = Font[];

 type LoadedFontsObject = {
  [key: string]: FontArray
 };

 type FontData = {
  [key in FontSubfamily]: Font
 }

 type FormatWidthHeigth = {
  width: number,
  height: number
 }

 type OutputDimensions = {
  [key in FormatNames]: FormatWidthHeigth
 }

 interface CreateHTMLElementParams<TagName> {
  elementName: TagName;
  id?: string;
  className?: string;
  content?: string;
  parentToAppend?: HTMLElement;
  insertTo?: {
   element: HTMLElement,
   position: InsertPosition
  }
  attributes?: {
   [key: string]: string;
  };
 }
}

