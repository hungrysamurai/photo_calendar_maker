import { Font } from "opentype.js";

export enum CalendarLanguage {
  RU = "ru",
  EN = "en",
}

export enum FormatName {
  A6_Y = "A6_Y",
  A6_X = "A6_X",
  A5_Y = "A5_Y",
  A5_X = "A5_X",
  A4_Y = "A4_Y",
  A4_X = "A4_X",
  A3_Y = "A3_Y",
  A3_X = "A3_X",
  A2_Y = "A2_Y",
  A2_X = "A2_X",
}

export enum CalendarType {
  SinglePage = "single-page",
  MultiPage = "multi-page",
}

export enum FontSubfamily {
  Bold = "bold",
  Regular = "regular",
}

export enum LoadingState {
  Show = "show",
  Hide = "hide",
}

export enum PDFPagesRangeToDownload {
  Current = "current",
  All = "all",
}

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    shimIndexedDB: IDBFactory;
  }

  interface Cropper {
    initialZoomRatio: number;
    initialCanvasData: Cropper.CanvasData;
    zoomRatio: number;
    options: Cropper.Options;
  }

  type CalendarData = {
    startYear: number;
    firstMonthIndex: number;
    lang: CalendarLanguage;
    font: string;
    format: FormatName;
    type: CalendarType;
  };

  type ImageObject = {
    id: number;
    image: string;
  };

  type FontArray = Font[];

  type LoadedFontsObject = {
    [key: string]: FontArray;
  };

  type FontData = {
    [key: string]: Font
  };

  interface CreateHTMLElementParams<TagName> {
    elementName: TagName;
    id?: string;
    className?: string;
    content?: string;
    text?: string;
    parentToAppend?: HTMLElement;
    children?: SVGElement[] | HTMLElement[];
    insertTo?: {
      element: HTMLElement;
      position: InsertPosition;
    };
    attributes?: {
      [key: string]: string;
    };
  }

  interface CreateSVGElementParams<TagName> {
    elementName: TagName;
    id?: string;
    className?: string;
    content?: string;
    text?: string;
    parentToAppend?: HTMLElement | SVGElement;
    children?: SVGElement[];
    insertTo?: {
      element: HTMLElement;
      position: InsertPosition;
    };
    attributes?: {
      [key: string]: string;
    };
    attributesNS?: {
      [key: string]: string;
    };
  }

  type FormatWidthHeigth = {
    width: number;
    height: number;
  };

  type OutputDimensions = {
    [key in FormatName]: FormatWidthHeigth;
  };

  interface MockupInputOptions {
    mockupBackgroundFill: string;
    dayCellHeight: number;
    dayCellWidth: number;
    calendarGridX: number;
    calendarGridY: number;
    daysFontSize: number;
    dayCellStyles: string;
    imagePlaceholderWidth: number;
    imagePlaceholderHeight: number;
    imagePlaceholderX: number;
    imagePlaceholderY: number;
    monthTitleX: number;
    monthTitleY: number;
    monthTitleFontSize: number;
    yearTitleX: number;
    yearTitleY: number;
    yearTitleFontSize: number;
    weekDayY: number;
    weekDayFontSize: number;
  }

  interface SinglePageMockupInputOptions extends MockupInputOptions {
    monthCellHeight: number;
    monthCellWidth: number;
    monthCellPadding: number;
    calendarGridLeftIndent: number;
    calendarGridTopIndent: number;
    descenderException: number;
    numberOfColumns: number;
    [key: string]: string | number | FormatWidthHeigth;
  }

  interface SinglePageMockupOutputOptions extends SinglePageMockupInputOptions {
    pixelsDimensions: FormatWidthHeigth;
    mockupHeight: number;
    mockupWidth: number;
    weekDayX: number;
  }

  interface MultiPageMockupInputOptions extends MockupInputOptions {
    weekDaysY: number;
    [key: string]: string | number | FormatWidthHeigth;
  }

  interface MultiPageMockupOutputOptions extends MultiPageMockupInputOptions {
    pixelsDimensions: FormatWidthHeigth;
    mockupHeight: number;
    mockupWidth: number;
    weekDayX: number;
  }
}
