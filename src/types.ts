import { Font } from 'opentype.js';

export enum CalendarLanguage {
  RU = 'ru',
  EN = 'en',
}

export enum FormatName {
  A6_Y = 'A6_Y',
  A6_X = 'A6_X',
  A5_Y = 'A5_Y',
  A5_X = 'A5_X',
  A4_Y = 'A4_Y',
  A4_X = 'A4_X',
  A3_Y = 'A3_Y',
  A3_X = 'A3_X',
  A2_Y = 'A2_Y',
  A2_X = 'A2_X',
}

export enum CalendarType {
  SinglePage = 'single-page',
  MultiPage = 'multi-page',
}

export enum FontSubfamily {
  Bold = 'bold',
  Regular = 'regular',
}

export enum PDFPagesRangeToDownload {
  Current = 'current',
  All = 'all',
}

declare global {
  interface Window {
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    shimIndexedDB: IDBFactory;
  }

  type ProvidedDOMElements = {
    calendarContainer: HTMLDivElement;
    controlsContainer: HTMLDivElement;
    cropControlsContainer: HTMLDivElement;
  };

  type AnimationDirection = 'in' | 'out';

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

  type StoredImage = {
    id: number;
    image: Blob;
  };

  type SourceFontData = {
    fontNameBold: string;
    fontNameRegular: string;
  };

  type SourceFontsData = {
    'EB Garamond': SourceFontData;
    Montserrat: SourceFontData;
    Caveat: SourceFontData;
  };

  /**
   * Data needed to register single font weight in jsPDF virtual file system
   */
  type VFSFontData = {
    /** Font family name to reference from SVG `font-family` */
    family: string;
    /** Virtual file name inside jsPDF VFS */
    fileName: string;
    base64: string;
  };

  /**
   * Single font weight ready to be embedded into SVG / PDF
   */
  type EmbeddableFont = {
    /** CSS font-family name (equals TTF file base name) */
    family: string;
    bytes: ArrayBuffer;
    base64: string;
    /** Ready-to-inject `@font-face` rule for this weight */
    fontFace: string;
    /** Ready-to-register jsPDF VFS font data for this weight */
    vfs: VFSFontData;
    /** Parsed outline font — temporary, until all text is rendered natively */
    font: Font;
  };

  type FontData = {
    [key in FontSubfamily]: EmbeddableFont;
  };

  type LoadedFontsObject = {
    [key: string]: FontData;
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
    imagePlaceholderIconScale: number;
    imagePlaceholderIconX: number;
    imagePlaceholderIconY: number;
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
