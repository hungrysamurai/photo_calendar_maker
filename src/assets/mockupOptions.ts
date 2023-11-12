import { CalendarType } from "../../types";

export type MockupPredefinedData = {
  [key: string]: {
    dayCellHeight: number;
    dayCellWidth: number;
    calendarGridX: number;
    calendarGridY: number;
    daysFontSize: number;
    monthCellHeight: number;
    monthCellWidth: number;
    monthCellPadding: number;
    imagePlaceholderWidth: number;
    imagePlaceholderHeight: number;
    imagePlaceholderX: number;
    imagePlaceholderY: number;
    calendarGridLeftIndent: number;
    calendarGridTopIndent: number;
  };
};

export type MockupOptions = {
  [key in CalendarType]?: MockupPredefinedData;
};

export const mockupOptions: MockupOptions = {
  [CalendarType.SinglePage]: {
    AFormatBaseA6: {
      dayCellHeight: 2.2307,
      dayCellWidth: 3.294,
      calendarGridX: 0,
      calendarGridY: 4.3468,
      daysFontSize: 1.6598,
      monthCellHeight: 18.8622,
      monthCellWidth: 22.9978,
      monthCellPadding: 1.1568,
      imagePlaceholderWidth: 94.7135,
      imagePlaceholderHeight: 77.9638,
      imagePlaceholderX: 5.4826,
      imagePlaceholderY: 5.7341,
      calendarGridLeftIndent: 5.0299,
      calendarGridTopIndent: 85.5087,
    },
  },
};
