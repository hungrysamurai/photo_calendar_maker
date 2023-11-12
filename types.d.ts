import { Font } from "opentype.js";

export enum CalendarLanguage {
  RU = "ru",
  EN = "en",
}

export enum FormatNames {
  A5 = "A5",
  A4 = "A4",
  A3 = "A3",
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
    [key in FontSubfamily]?: Font;
  };

  type FormatWidthHeigth = {
    width: number;
    height: number;
  };

  type OutputDimensions = {
    [key in FormatNames]: FormatWidthHeigth;
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
}
