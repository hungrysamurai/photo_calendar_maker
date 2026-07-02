import { CalendarLanguage, CalendarType, FormatName } from '../../types';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';
import { createSVGElement } from '../utils/DOM/createElement/createSVGElement';
import getDaysInMonth from '../utils/getDaysInMonth';
import getMonthFirstDay from '../utils/getMonthFirstDay';

export type ViewControllerOptions = {
  mainContainer: HTMLDivElement;
  type: CalendarType;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;
  outputDimensions: OutputDimensions;
  format: FormatName;
  firstMonthIndex: number;
  year: number;
  monthsNamesList: string[];
  weekDaysNamesList: string[];
  font: FontData;
  lang: CalendarLanguage;
  showLoader: () => void;
  hideLoader: () => void;
};

export default class ViewController {
  calendarWrapper: HTMLDivElement;
  calendarInner: HTMLDivElement;

  constructor(private options: ViewControllerOptions) {
    this.createOnePageSVGMockup();
  }

  private async createOnePageSVGMockup() {
    this.options.showLoader();

    const mockupOptions = this.options.mockupOptions as SinglePageMockupOutputOptions;
    const format = this.options.format;
    const outputDimensions = this.options.outputDimensions;
    const firstMonthIndex = this.options.firstMonthIndex;
    let year = this.options.year;
    const monthsNamesList = this.options.monthsNamesList;
    const weekDaysNamesList = this.options.weekDaysNamesList;

    this.calendarWrapper = createHTMLElement({
      elementName: 'div',
      className: 'calendar-wrapper',
      parentToAppend: this.options.mainContainer,
    });

    this.calendarInner = createHTMLElement({
      elementName: 'div',
      className: 'calendar-inner',
      parentToAppend: this.calendarWrapper,
    });

    const mockup = createSVGElement({
      elementName: 'svg',
      id: 'mockup-0',
      attributes: {
        viewBox: `0 0 ${mockupOptions.mockupWidth} ${mockupOptions.mockupHeight}`,
        width: outputDimensions[format].width.toString(),
        height: outputDimensions[format].height.toString(),
      },
    });

    createSVGElement({
      elementName: 'rect',
      id: 'background-rect',
      parentToAppend: mockup,
      attributes: {
        width: mockupOptions.mockupWidth.toString(),
        height: mockupOptions.mockupHeight.toString(),
        style: `fill: ${mockupOptions.mockupBackgroundFill}`,
      },
    });

    const imageElementGroup = createSVGElement({
      elementName: 'g',
      id: 'image-group',
      parentToAppend: mockup,
    });

    // const imageInIDB: ImageObject | undefined = this.imagesFromIDB[0];

    // if (imageInIDB) {
    //   const imageObject = await fetch(imageInIDB.image);
    //   const imgURL = imageObject.url;

    // createSVGElement({
    //   elementName: 'image',
    //   parentToAppend: imageElementGroup,
    //   attributes: {
    //     height: this.mockupOptions.imagePlaceholderHeight.toString(),
    //     width: this.mockupOptions.imagePlaceholderWidth.toString(),
    //     x: this.mockupOptions.imagePlaceholderX.toString(),
    //     y: this.mockupOptions.imagePlaceholderY.toString(),
    //   },
    //   attributesNS: {
    //     href: imgURL,
    //   },
    // });
    // } else {
    createSVGElement({
      elementName: 'rect',
      id: 'image-placeholder',
      parentToAppend: imageElementGroup,
      attributes: {
        x: mockupOptions.imagePlaceholderX.toString(),
        y: mockupOptions.imagePlaceholderY.toString(),
        width: mockupOptions.imagePlaceholderWidth.toString(),
        height: mockupOptions.imagePlaceholderHeight.toString(),
        style: 'fill: #e8e8e8',
      },
    });
    // }

    createHTMLElement({
      elementName: 'div',
      id: 'mockup-container',
      parentToAppend: this.calendarInner,
      children: [mockup],
    });

    let x = mockupOptions.calendarGridLeftIndent;
    let y = mockupOptions.calendarGridTopIndent;

    let monthCounter = firstMonthIndex;

    // Global loop
    for (let i = 0; i < 12; i++) {
      // if new row...
      if (i % mockupOptions.numberOfColumns === 0) {
        // Increment y-movement
        y += mockupOptions.monthCellHeight + mockupOptions.monthCellPadding;
        x = mockupOptions.calendarGridLeftIndent;
      }

      // Create month container
      const monthContainer = createSVGElement({
        elementName: 'svg',
        id: `month-container-${i}`,
        attributes: {
          x: x.toString(),
          y: y.toString(),
          width: mockupOptions.monthCellWidth.toString(),
          height: mockupOptions.monthCellHeight.toString(),
          ['data-month']: monthCounter.toString(),
          ['data-year']: year.toString(),
        },
      });

      // Increment x-movement
      x += mockupOptions.monthCellWidth + mockupOptions.monthCellPadding;

      createSVGElement({
        elementName: 'g',
        id: 'month-title',
        parentToAppend: monthContainer,
        content: this.getOutline(
          monthsNamesList[monthCounter],
          mockupOptions.monthTitleX,
          mockupOptions.monthTitleY,
          mockupOptions.monthTitleFontSize,
        ),
      });

      createSVGElement({
        elementName: 'g',
        id: 'year-title',
        parentToAppend: monthContainer,
        content: this.getOutline(
          `${year}`,
          mockupOptions.yearTitleX,
          mockupOptions.yearTitleY,
          mockupOptions.yearTitleFontSize,
        ),
      });

      const daysTitles = createSVGElement({
        elementName: 'g',
        id: 'week-days-titles',
        parentToAppend: monthContainer,
      });

      const currentMonthGrid = createSVGElement({
        elementName: 'g',
        id: 'days-grid',
        parentToAppend: monthContainer,
      });

      // Generate week days paths
      weekDaysNamesList.map((weekDayName, i) => {
        // исключение для 'Cр'
        const descenderException = i === 2 && this.options.lang === 'ru' ? true : false;

        const weekDayPath = this.getAndPlaceOutline(
          weekDayName,
          mockupOptions.weekDayX,
          descenderException ? mockupOptions.descenderException : mockupOptions.weekDayY,
          mockupOptions.weekDayFontSize,
        );

        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          attributes: {
            transform: `translate(${Number(
              mockupOptions.calendarGridX + mockupOptions.dayCellWidth * i,
            ).toFixed(2)} 0)`,
          },
          children: [weekDayPath],
        });
      });

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        year++;
      }

      this.createMonthGrid(
        currentMonthGrid,
        getMonthFirstDay(monthCounter - 1, year) - 1,
        getDaysInMonth(monthCounter, year),
        getDaysInMonth(monthCounter - 1, year) - 1,
        mockupOptions.calendarGridX,
        mockupOptions.calendarGridY,
        mockupOptions.daysFontSize,
        mockupOptions.dayCellStyles,
      );

      // Append to main SVG
      mockup.appendChild(monthContainer);
    }

    // this.cache.cacheMockup(
    //   this.getCurrentMockup('svg'),
    //   0,
    //   this.outputDimensions[this.format].width,
    //   this.outputDimensions[this.format].height,
    // );

    this.options.hideLoader();
  }

  /**
   * @property {Function} getOutline - create outline (<path> element) from given string, and set it x-coords, y-coords, size and fill
   * @param {string} string - text to outline
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {string} - string representation of <path> element
   */
  getOutline(
    string: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string = 'bold',
    fill: string = '#231f20',
  ): string {
    const outline = this.options.font[fontWeight].getPath(string, x, y, fontSize);
    outline.fill = fill;
    return outline.toSVG(2);
  }

  /**
   * @property {Function} getAndPlaceOutline - creates path for individual day digit in calendar grid
   * @param {string} string - text to outline (number as string)
   * @param {number} x - x-coords to place element
   * @param {number} y - y-coords to place element
   * @param {number} fontSize
   * @param {string} fontWeight
   * @param {string} fill
   * @returns {SVGPathElement} - <path>
   */
  getAndPlaceOutline(
    string: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: string = 'bold',
    fill: string = '#231f20',
  ): SVGPathElement {
    const outline = this.options.font[fontWeight].getPath(string, x, y, fontSize);

    const { x1, x2, y1, y2 } = outline.getBoundingBox();

    const xShift = Number(((x2 - x1) / 2).toFixed(2));
    const yShift = Number(((y2 - y1) / 2).toFixed(2));

    const pathElement = createSVGElement({
      elementName: 'path',
      attributes: {
        d: outline.toPathData(2),
        transform: `translate(-${xShift} ${yShift})`,
        fill,
      },
    });

    return pathElement;
  }

  /**
   * @property {Function} createMonthGrid - Generates month grid in given DOM element with provided parameters
   * @param {SVGGElement} monthGrid - element to append calendar grid
   * @param {number} startIndex - first day of month
   * @param {number} totalDays - number of days in current month
   * @param {number} prevMonthDaysNumber - number of days in prev month
   * @param {number} initialX - initial X coords to place day cell
   * @param {number} initialY - initial Y coords to place day cell
   * @param {number} fontSize - Object with SVG glyphs
   * @param {string} cellStyles - additional styles for each day cell
   */
  createMonthGrid(
    monthGrid: SVGGElement,
    startIndex: number,
    totalDays: number,
    prevMonthDaysNumber: number,
    initialX: number,
    initialY: number,
    fontSize: number,
    cellStyles: string,
  ): void {
    let x = initialX;
    let y = initialY;

    let currentDayIndex = startIndex;
    let prevMonthDaysCount = prevMonthDaysNumber;

    // Set empty grid
    for (let i = 1; i < 43; i++) {
      if (i % 7 !== 0) {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x += this.options.mockupOptions.dayCellWidth;
      } else {
        monthGrid.appendChild(this.createDayCell(x, y, i, cellStyles));
        x = initialX;
        y += this.options.mockupOptions.dayCellHeight;
      }
    }

    // All text elements in generated cells
    const cellsTextFields = monthGrid.querySelectorAll('g .cell-digit');

    // Set days digits in cells
    for (let i = 1; i < totalDays + 1; i++) {
      cellsTextFields[currentDayIndex].appendChild(
        this.getAndPlaceOutline(
          `${i}`,
          this.options.mockupOptions.dayCellWidth / 2,
          this.options.mockupOptions.dayCellHeight / 2,
          fontSize,
        ),
      );

      currentDayIndex++;
    }

    // Prepend previous month
    if (startIndex !== 0) {
      for (let i = startIndex - 1; i >= 0; i--) {
        cellsTextFields[i].appendChild(
          this.getAndPlaceOutline(
            `${prevMonthDaysCount}`,
            this.options.mockupOptions.dayCellWidth / 2,
            this.options.mockupOptions.dayCellHeight / 2,
            fontSize,
            'regular',
            '#999',
          ),
        );

        prevMonthDaysCount--;
      }
    }

    // Extend on next month
    if (currentDayIndex <= 42) {
      for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
        cellsTextFields[currentDayIndex].appendChild(
          this.getAndPlaceOutline(
            `${i}`,
            this.options.mockupOptions.dayCellWidth / 2,
            this.options.mockupOptions.dayCellHeight / 2,
            fontSize,
            'regular',
            '#999',
          ),
        );

        i++;
      }
    }
  }

  /**
   * @property {Function} createDayCell - Create individual day cell
   * @param {number} x - x coordinate of cell
   * @param {number} y - y coordinate of cell
   * @param {number} cellNumber - number of day
   * @param {string} cellStyles - addition CSS styles for cell
   * @returns {SVGGElement} - DOM element of cell
   */
  createDayCell(x: number, y: number, cellNumber: number, cellStyles: string): SVGGElement {
    const dayGroup = createSVGElement({
      elementName: 'g',
      id: `day-${cellNumber}-cell`,
      attributes: {
        width: this.options.mockupOptions.dayCellWidth.toString(),
        height: this.options.mockupOptions.dayCellHeight.toString(),
      },
    });

    createSVGElement({
      elementName: 'rect',
      parentToAppend: dayGroup,
      attributes: {
        x: x.toString(),
        y: y.toString(),
        width: this.options.mockupOptions.dayCellWidth.toString(),
        height: this.options.mockupOptions.dayCellHeight.toString(),
        style: cellStyles ? cellStyles : '',
      },
    });

    createSVGElement({
      elementName: 'g',
      parentToAppend: dayGroup,
      attributes: {
        class: 'cell-digit',
        transform: `translate(${x} ${y})`,
      },
    });

    return dayGroup;
  }
}
