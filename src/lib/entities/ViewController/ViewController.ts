import { icons } from '../../../assets/icons';
import { CalendarLanguage, CalendarType, FontSubfamily, FormatName } from '../../../types';
import animateControlsContainer from '../../animations/animateControlsContainer';

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

  constructor(private options: ViewControllerOptions) {
    this.monthsNamesList = getMonthsList(this.options.lang);

    this.options.showLoader();

    try {
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

      animateControlsContainer(options.controlsContainer, 'in');
    } catch (err) {
      // If error - clean up DOM containers...
      this.options.controlsContainer.innerHTML = '';
      this.options.mainContainer.innerHTML = '';

      console.log('Failed generate calendar mockup:', err);
    } finally {
      this.options.hideLoader();
    }
  }

  showPrevMonth = () => {
    this.currentMonthInView--;
    if (this.currentMonthInView < 0) {
      this.currentMonthInView = 11;
    }

    this.setVisibleMonth();
  };

  showNextMonth = () => {
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

    this.appendFontFaceStyle(mockup);

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
      // this.getAndPlaceImagePlaceholder(imageElementGroup);

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

      createSVGElement({
        elementName: 'g',
        parentToAppend: imageElementGroup,
        content: icons.uploadSingleImage,
        attributes: {
          transform: `translate(${mockupOptions.imagePlaceholderIconX} ${mockupOptions.imagePlaceholderIconY}) scale(${mockupOptions.imagePlaceholderIconScale})`,
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

      createSVGElement({
        elementName: 'g',
        id: 'month-title',
        parentToAppend: monthContainer,
        children: [
          this.createTitleText(
            this.monthsNamesList[monthCounter],
            mockupOptions.monthTitleX,
            mockupOptions.monthTitleY,
            mockupOptions.monthTitleFontSize,
          ),
        ],
      });

      createSVGElement({
        elementName: 'g',
        id: 'year-title',
        parentToAppend: monthContainer,
        children: [
          this.createTitleText(
            `${year}`,
            mockupOptions.yearTitleX,
            mockupOptions.yearTitleY,
            mockupOptions.yearTitleFontSize,
          ),
        ],
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

      // Generate week days labels
      this.weekDaysNamesList.forEach((weekDayName, i) => {
        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          attributes: {
            transform: `translate(${Number(
              mockupOptions.calendarGridX + mockupOptions.dayCellWidth * i,
            ).toFixed(2)} 0)`,
          },
          children: [
            this.createCenteredText(
              weekDayName,
              mockupOptions.weekDayX,
              mockupOptions.weekDayY,
              mockupOptions.weekDayFontSize,
            ),
          ],
        });
      });

      this.createMonthGrid(
        currentMonthGrid,
        getMonthFirstDay(monthCounter, year) - 1,
        // getDaysInMonth reads day 0 of given month, i.e. last day of the one before it
        getDaysInMonth(monthCounter + 1, year),
        getDaysInMonth(monthCounter, year),
        mockupOptions.calendarGridX,
        mockupOptions.calendarGridY,
        mockupOptions.daysFontSize,
        mockupOptions.dayCellStyles,
      );

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        year++;
      }

      // Append to main SVG
      mockup.appendChild(monthContainer);
    }

    return mockup;
  }

  private createMultiPageSVGMockups(storedImages: StoredImage[]): SVGElement[] {
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

      this.appendFontFaceStyle(monthMockup);

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

      createSVGElement({
        elementName: 'g',
        id: `month-title-${i}`,
        parentToAppend: monthTextGroup,
        children: [
          this.createTitleText(
            this.monthsNamesList[monthCounter],
            mockupOptions.monthTitleX,
            mockupOptions.monthTitleY,
            mockupOptions.monthTitleFontSize,
          ),
        ],
      });

      createSVGElement({
        elementName: 'g',
        id: `year-title-${i}`,
        parentToAppend: monthTextGroup,
        children: [
          this.createTitleText(
            `${year}`,
            mockupOptions.yearTitleX,
            mockupOptions.yearTitleY,
            mockupOptions.yearTitleFontSize,
          ),
        ],
      });

      const daysTitles = createSVGElement({
        elementName: 'g',
        id: `days-titles-${i}`,
        parentToAppend: monthTextGroup,
      });

      // Generate week days labels
      this.weekDaysNamesList.forEach((weekDayName, i) => {
        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          children: [
            this.createCenteredText(
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

        createSVGElement({
          elementName: 'g',
          parentToAppend: monthImageGroup,
          content: icons.uploadSingleImage,
          attributes: {
            transform: `translate(${mockupOptions.imagePlaceholderIconX} ${mockupOptions.imagePlaceholderIconY}) scale(${mockupOptions.imagePlaceholderIconScale})`,
          },
        });
      }

      this.createMonthGrid(
        monthTextGroup,
        getMonthFirstDay(monthCounter, year) - 1,
        // getDaysInMonth reads day 0 of given month, i.e. last day of the one before it
        getDaysInMonth(monthCounter + 1, year),
        getDaysInMonth(monthCounter, year),
        mockupOptions.calendarGridX,
        mockupOptions.calendarGridY,
        mockupOptions.daysFontSize,
        mockupOptions.dayCellStyles,
      );

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        year++;
      }

      mockups.push(monthMockup);
    }

    return mockups;
  }

  /**
   * Embed `@font-face` rules for both weights of selected font, so mockup SVG is self-describing
   */
  private appendFontFaceStyle(mockup: SVGElement): void {
    const { bold, regular } = this.options.font;

    createSVGElement({
      elementName: 'style',
      parentToAppend: mockup,
      text: `${bold.fontFace}\n${regular.fontFace}`,
    });
  }

  /**
   * Native SVG text centered (horizontally and vertically) at given point
   */
  private createCenteredText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: FontSubfamily = FontSubfamily.Bold,
    fill = '#231f20',
  ): SVGTextElement {
    return createSVGElement({
      elementName: 'text',
      text,
      attributes: {
        x: `${x}`,
        y: `${y}`,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        // svg2pdf ignores dominant-baseline and reads alignment-baseline only
        'alignment-baseline': 'central',
        'font-family': this.options.font[fontWeight].family,
        'font-size': `${fontSize}`,
        fill,
      },
    });
  }

  /**
   * Native SVG text left-aligned with baseline at given point (matches former outline `getPath(text, x, y)` placement)
   */
  private createTitleText(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontWeight: FontSubfamily = FontSubfamily.Bold,
    fill = '#231f20',
  ): SVGTextElement {
    return createSVGElement({
      elementName: 'text',
      text,
      attributes: {
        x: `${x}`,
        y: `${y}`,
        'text-anchor': 'start',
        'font-family': this.options.font[fontWeight].family,
        'font-size': `${fontSize}`,
        fill,
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
        this.createCenteredText(
          `${prev}`,
          dayCellWidth / 2,
          dayCellHeight / 2,
          fontSize,
          FontSubfamily.Regular,
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
        this.createCenteredText(`${day}`, dayCellWidth / 2, dayCellHeight / 2, fontSize),
      );

      cellIndex++;
    }

    //
    // Следующий месяц
    //

    let next = 1;

    while (cellIndex < 42) {
      cells[cellIndex].digitContainer.appendChild(
        this.createCenteredText(
          `${next}`,
          dayCellWidth / 2,
          dayCellHeight / 2,
          fontSize,
          FontSubfamily.Regular,
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
