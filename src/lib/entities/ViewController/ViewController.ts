import { CalendarLanguage, CalendarType, FormatName } from '../../../types';

import { createHTMLElement } from '../../utils/DOM/createElement/createHTMLElement';
import { createSVGElement } from '../../utils/DOM/createElement/createSVGElement';

import getDaysInMonth from '../../utils/getDaysInMonth';
import getMonthFirstDay from '../../utils/getMonthFirstDay';
import { getMonthsList } from '../../utils/getMonthsList';
import getWeekDays from '../../utils/getWeekDays';

import {
  MultiPageControlsCallbacks,
  BasicControlsManager,
  MultiPageControlsManager,
} from './ControlsManager';
import OutlineCache from './OutlineCache';

interface DayCell {
  root: SVGGElement;
  digitContainer: SVGGElement;
}

export type ViewControllerOptions = {
  mainContainer: HTMLDivElement;
  controlsContainer: HTMLDivElement;
  type: CalendarType;
  mockupOptions: SinglePageMockupOutputOptions | MultiPageMockupOutputOptions;
  outputDimensions: OutputDimensions;
  format: FormatName;
  firstMonthIndex: number;
  year: number;
  font: FontData;
  lang: CalendarLanguage;
  storedImages: StoredImage[];
  actionsHandlers: MultiPageControlsCallbacks;
  cleanupHandlers: (() => void)[];
  showLoader: () => void;
  hideLoader: () => void;
};

export default class ViewController {
  calendarWrapper: HTMLDivElement;
  calendarInner: HTMLDivElement;

  controlsManager: BasicControlsManager | MultiPageControlsManager;

  monthsNamesList: ReturnType<typeof getMonthsList>;
  weekDaysNamesList: string[];

  currentMonthInView: number = 0;

  svgMockups: SVGElement[] = [];
  imagesContainers: SVGGElement[] = [];

  private outlineCache: OutlineCache;

  constructor(private options: ViewControllerOptions) {
    this.outlineCache = new OutlineCache(options.font);

    this.monthsNamesList = getMonthsList(this.options.lang);

    if (options.type === CalendarType.SinglePage) {
      this.weekDaysNamesList = getWeekDays('short', options.lang);

      const generatedMockup = this.createOnePageSVGMockup(this.options.storedImages);
      this.svgMockups.push(generatedMockup);

      const imageGroup = generatedMockup.querySelector('#image-group') as SVGGElement;
      this.imagesContainers.push(imageGroup);

      this.controlsManager = new BasicControlsManager(
        options.controlsContainer,
        this.imagesContainers,
        options.actionsHandlers,
      );
      this.controlsManager.init();
    } else {
      this.weekDaysNamesList = getWeekDays('long', options.lang);

      const generatedMockups = this.createMultiPageSVGMockups(this.options.storedImages);
      generatedMockups.forEach((m) => {
        const imageGroup = m.querySelector('#image-group') as SVGGElement;

        this.imagesContainers.push(imageGroup);
        this.svgMockups.push(m);
      });

      this.controlsManager = new MultiPageControlsManager(
        options.controlsContainer,
        this.imagesContainers,
        options.actionsHandlers,
        {
          onPrevMonth: this.showPrevMonth,
          onNextMonth: this.showNextMonth,
        },
      );
      this.controlsManager.init();
    }
  }

  showPrevMonth = () => {
    this.options.cleanupHandlers.forEach((cb) => {
      cb();
    });

    this.currentMonthInView--;
    if (this.currentMonthInView < 0) {
      this.currentMonthInView = 11;
    }

    this.setVisibleMonth();
  };

  showNextMonth = () => {
    this.options.cleanupHandlers.forEach((cb) => {
      cb();
    });

    this.currentMonthInView++;

    if (this.currentMonthInView > 11) {
      this.currentMonthInView = 0;
    }

    this.setVisibleMonth();
  };

  /**
   * @property {Function} setVisibleMonth - show current month mockup in DOM by translate calendarInner container by X axis
   */
  setVisibleMonth(): void {
    this.calendarInner.style.transform = `translateX(calc(-8.333333% * ${this.currentMonthInView}))`;
  }

  /**
   * @property {Function} getCurrentMockup - Get current mockup to manipulate
   * @param {string} [element=""] element - selector string to pick specific element e.g. 'image' or 'svg'
   */
  getCurrentMockup = (element: string = ''): SVGElement | SVGImageElement => {
    if (this.options.type === CalendarType.MultiPage) {
      return this.calendarInner.querySelector(
        `#month-${this.currentMonthInView}-container ${element}`,
      ) as SVGElement;
    }

    return this.calendarInner.querySelector(`#mockup-container ${element}`) as SVGElement;
  };

  /**
   * @property {Function} getMockupByIndex - Get mockup to manipulate by index of month
   * @param {number} index
   */
  getMockupByIndex = (index: number): SVGElement => {
    return this.calendarInner.querySelector(`#mockup-${index}`) as SVGElement;
  };

  getImageGroupByIndex = (index: number): SVGGElement => {
    return this.calendarInner.querySelector(
      `#month-${index}-container #image-group`,
    ) as SVGGElement;
  };

  private createOnePageSVGMockup(storedImages: StoredImage[]): SVGElement {
    this.options.showLoader();

    const mockupOptions = this.options.mockupOptions as SinglePageMockupOutputOptions;
    let year = this.options.year;
    const { format, outputDimensions, firstMonthIndex } = this.options;

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

    const imageInIDB: StoredImage | undefined = storedImages[0];

    if (imageInIDB) {
      const imgURL = URL.createObjectURL(imageInIDB.image);

      createSVGElement({
        elementName: 'image',
        parentToAppend: imageElementGroup,
        attributes: {
          height: mockupOptions.imagePlaceholderHeight.toString(),
          width: mockupOptions.imagePlaceholderWidth.toString(),
          x: mockupOptions.imagePlaceholderX.toString(),
          y: mockupOptions.imagePlaceholderY.toString(),
        },
        attributesNS: {
          href: imgURL,
        },
      });
    } else {
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
    }

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

      const monthOutline = this.options.font['bold'].getPath(
        this.monthsNamesList[monthCounter],
        mockupOptions.monthTitleX,
        mockupOptions.monthTitleY,
        mockupOptions.monthTitleFontSize,
      );
      monthOutline.fill = '#231f20';
      const monthSVG = monthOutline.toSVG(2);

      createSVGElement({
        elementName: 'g',
        id: 'month-title',
        parentToAppend: monthContainer,
        content: monthSVG,
      });

      const yearOutline = this.options.font['bold'].getPath(
        `${year}`,
        mockupOptions.yearTitleX,
        mockupOptions.yearTitleY,
        mockupOptions.yearTitleFontSize,
      );
      yearOutline.fill = '#231f20';
      const yearSVG = yearOutline.toSVG(2);

      createSVGElement({
        elementName: 'g',
        id: 'year-title',
        parentToAppend: monthContainer,
        content: yearSVG,
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
      this.weekDaysNamesList.map((weekDayName, i) => {
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

    this.options.hideLoader();
    return mockup;
  }

  private createMultiPageSVGMockups(storedImages: StoredImage[]): SVGElement[] {
    this.options.showLoader();

    const mockups: SVGElement[] = [];

    const mockupOptions = this.options.mockupOptions as MultiPageMockupOutputOptions;
    let year = this.options.year;
    const { format, outputDimensions, firstMonthIndex } = this.options;

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

    this.setVisibleMonth();

    let monthCounter = firstMonthIndex;

    // Create months templates
    for (let i = 0; i < 12; i++) {
      const monthContainer = createHTMLElement({
        elementName: 'div',
        className: 'month-container',
        id: `month-${i}-container`,
        parentToAppend: this.calendarInner,
        attributes: {
          ['data-month']: monthCounter.toString(),
          ['data-year']: year.toString(),
        },
      });

      const monthMockup = createSVGElement({
        elementName: 'svg',
        parentToAppend: monthContainer,
        id: `mockup-${i}`,
        attributes: {
          viewBox: `0 0 ${mockupOptions.mockupWidth} ${mockupOptions.mockupHeight}`,
          width: outputDimensions[format].width.toString(),
          height: outputDimensions[format].height.toString(),
        },
      });

      createSVGElement({
        elementName: 'rect',
        id: `background-rect-${i}`,
        parentToAppend: monthMockup,
        attributes: {
          width: mockupOptions.mockupWidth.toString(),
          height: mockupOptions.mockupHeight.toString(),
          style: `fill: ${mockupOptions.mockupBackgroundFill}`,
        },
      });

      const monthTextGroup = createSVGElement({
        elementName: 'g',
        id: `days-grid-${i}`,
        parentToAppend: monthMockup,
      });

      const monthOutline = this.options.font['bold'].getPath(
        this.monthsNamesList[monthCounter],
        mockupOptions.monthTitleX,
        mockupOptions.monthTitleY,
        mockupOptions.monthTitleFontSize,
      );
      monthOutline.fill = '#231f20';
      const monthSVG = monthOutline.toSVG(2);

      createSVGElement({
        elementName: 'g',
        id: `#month-title-${i}`,
        parentToAppend: monthTextGroup,
        content: monthSVG,
      });

      const yearOutline = this.options.font['bold'].getPath(
        `${year}`,
        mockupOptions.yearTitleX,
        mockupOptions.yearTitleY,
        mockupOptions.yearTitleFontSize,
      );
      yearOutline.fill = '#231f20';
      const yearSVG = yearOutline.toSVG(2);

      createSVGElement({
        elementName: 'g',
        id: `#year-title-${i}`,
        parentToAppend: monthTextGroup,
        content: yearSVG,
      });

      const daysTitles = createSVGElement({
        elementName: 'g',
        id: `days-titles-${i}`,
        parentToAppend: monthTextGroup,
      });

      // Generate week days paths
      this.weekDaysNamesList.map((weekDayName, i) => {
        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          children: [
            this.getAndPlaceOutline(
              weekDayName,
              mockupOptions.weekDayX,
              mockupOptions.weekDayY,
              mockupOptions.weekDayFontSize,
            ),
          ],
          attributes: {
            transform: `translate(
                ${mockupOptions.calendarGridX + mockupOptions.dayCellWidth * i} ${mockupOptions.weekDaysY})`,
          },
        });
      });

      const monthImageGroup = createSVGElement({
        elementName: 'g',
        id: 'image-group',
        parentToAppend: monthMockup,
      });

      // Check if current month have a corresponding saved in IDB image
      const imageInIDB = storedImages.find((el) => el.id === i);

      if (imageInIDB) {
        // ...fetch stored image and place it on mockup
        const imgURL = URL.createObjectURL(imageInIDB.image);

        createSVGElement({
          elementName: 'image',
          parentToAppend: monthImageGroup,
          attributes: {
            height: mockupOptions.imagePlaceholderHeight.toString(),
            width: mockupOptions.imagePlaceholderWidth.toString(),
            x: mockupOptions.imagePlaceholderX.toString(),
            y: mockupOptions.imagePlaceholderY.toString(),
          },
          attributesNS: {
            href: imgURL,
          },
        });
      } else {
        // if no saved image - just put placeholder
        createSVGElement({
          elementName: 'rect',
          id: `image-placeholder-${i}`,
          parentToAppend: monthImageGroup,
          attributes: {
            width: mockupOptions.imagePlaceholderWidth.toString(),
            height: mockupOptions.imagePlaceholderHeight.toString(),
            x: mockupOptions.imagePlaceholderX.toString(),
            y: mockupOptions.imagePlaceholderY.toString(),
            style: 'fill: #e8e8e8',
          },
        });
      }

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        year++;
      }

      this.createMonthGrid(
        monthTextGroup,
        getMonthFirstDay(monthCounter - 1, year) - 1,
        getDaysInMonth(monthCounter, year),
        getDaysInMonth(monthCounter - 1, year),
        mockupOptions.calendarGridX,
        mockupOptions.calendarGridY,
        mockupOptions.daysFontSize,
        mockupOptions.dayCellStyles,
      );

      mockups.push(monthMockup);
    }

    this.options.hideLoader();

    return mockups;
  }

  getAndPlaceOutline(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: 'bold' | 'regular' = 'bold',
    fill = '#231f20',
  ): SVGPathElement {
    const outline = this.outlineCache.get(text, fontSize, fontWeight);

    return createSVGElement({
      elementName: 'path',
      attributes: {
        d: outline.d,
        fill,
        transform: `translate(${(x - outline.xShift).toFixed(3)} ${(y + outline.yShift).toFixed(3)})`,
      },
    });
  }

  private createMonthGrid(
    monthGrid: SVGGElement,
    startIndex: number,
    totalDays: number,
    prevMonthDays: number,
    initialX: number,
    initialY: number,
    fontSize: number,
    cellStyles: string,
  ): void {
    const { dayCellWidth, dayCellHeight } = this.options.mockupOptions;

    const cells: DayCell[] = [];

    let x = initialX;
    let y = initialY;

    //
    // Создаем сетку
    //

    for (let i = 0; i < 42; i++) {
      const cell = this.createDayCell(x, y, cellStyles);

      cells.push(cell);

      monthGrid.appendChild(cell.root);

      x += dayCellWidth;

      if ((i + 1) % 7 === 0) {
        x = initialX;
        y += dayCellHeight;
      }
    }

    //
    // Предыдущий месяц
    //

    let prev = prevMonthDays;

    for (let i = startIndex - 1; i >= 0; i--) {
      cells[i].digitContainer.appendChild(
        this.getAndPlaceOutline(
          `${prev}`,
          dayCellWidth / 2,
          dayCellHeight / 2,
          fontSize,
          'regular',
          '#999',
        ),
      );

      prev--;
    }

    //
    // Текущий месяц
    //

    let cellIndex = startIndex;

    for (let day = 1; day <= totalDays; day++) {
      cells[cellIndex].digitContainer.appendChild(
        this.getAndPlaceOutline(`${day}`, dayCellWidth / 2, dayCellHeight / 2, fontSize),
      );

      cellIndex++;
    }

    //
    // Следующий месяц
    //

    let next = 1;

    while (cellIndex < 42) {
      cells[cellIndex].digitContainer.appendChild(
        this.getAndPlaceOutline(
          `${next}`,
          dayCellWidth / 2,
          dayCellHeight / 2,
          fontSize,
          'regular',
          '#999',
        ),
      );

      next++;
      cellIndex++;
    }
  }

  private createDayCell(x: number, y: number, styles: string): DayCell {
    const root = createSVGElement({
      elementName: 'g',
    });

    createSVGElement({
      elementName: 'rect',
      parentToAppend: root,
      attributes: {
        x: `${x}`,
        y: `${y}`,
        width: `${this.options.mockupOptions.dayCellWidth}`,
        height: `${this.options.mockupOptions.dayCellHeight}`,
        style: styles,
      },
    });

    const digitContainer = createSVGElement({
      elementName: 'g',
      parentToAppend: root,
      attributes: {
        transform: `translate(${x} ${y})`,
      },
    });

    return {
      root,
      digitContainer,
    };
  }
}
