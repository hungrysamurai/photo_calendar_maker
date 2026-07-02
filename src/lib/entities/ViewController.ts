import { CalendarType } from '../../types';
import { createHTMLElement } from '../utils/DOM/createElement/createHTMLElement';
import { createSVGElement } from '../utils/DOM/createElement/createSVGElement';

export default class ViewController {
  calendarWrapper: HTMLDivElement;
  calendarInner: HTMLDivElement;

  constructor(
    public mainContainer: HTMLDivElement,
    public type: CalendarType,
  ) {}

  private async createOnePageSVGMockup() {
    // this.showLoader();

    this.calendarWrapper = createHTMLElement({
      elementName: 'div',
      className: 'calendar-wrapper',
      parentToAppend: this.mainContainer,
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
        viewBox: `0 0 ${this.mockupOptions.mockupWidth} ${this.mockupOptions.mockupHeight}`,
        width: this.outputDimensions[this.format].width.toString(),
        height: this.outputDimensions[this.format].height.toString(),
      },
    });

    createSVGElement({
      elementName: 'rect',
      id: 'background-rect',
      parentToAppend: mockup,
      attributes: {
        width: this.mockupOptions.mockupWidth.toString(),
        height: this.mockupOptions.mockupHeight.toString(),
        style: `fill: ${this.mockupOptions.mockupBackgroundFill}`,
      },
    });

    const imageElementGroup = createSVGElement({
      elementName: 'g',
      id: 'image-group',
      parentToAppend: mockup,
    });

    const imageInIDB: ImageObject | undefined = this.imagesFromIDB[0];

    if (imageInIDB) {
      const imageObject = await fetch(imageInIDB.image);
      const imgURL = imageObject.url;

      createSVGElement({
        elementName: 'image',
        parentToAppend: imageElementGroup,
        attributes: {
          height: this.mockupOptions.imagePlaceholderHeight.toString(),
          width: this.mockupOptions.imagePlaceholderWidth.toString(),
          x: this.mockupOptions.imagePlaceholderX.toString(),
          y: this.mockupOptions.imagePlaceholderY.toString(),
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
          x: this.mockupOptions.imagePlaceholderX.toString(),
          y: this.mockupOptions.imagePlaceholderY.toString(),
          width: this.mockupOptions.imagePlaceholderWidth.toString(),
          height: this.mockupOptions.imagePlaceholderHeight.toString(),
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

    let x = this.mockupOptions.calendarGridLeftIndent;
    let y = this.mockupOptions.calendarGridTopIndent;

    let monthCounter = this.firstMonthIndex;

    // Global loop
    for (let i = 0; i < 12; i++) {
      // if new row...
      if (i % this.mockupOptions.numberOfColumns === 0) {
        // Increment y-movement
        y += this.mockupOptions.monthCellHeight + this.mockupOptions.monthCellPadding;
        x = this.mockupOptions.calendarGridLeftIndent;
      }

      // Create month container
      const monthContainer = createSVGElement({
        elementName: 'svg',
        id: `month-container-${i}`,
        attributes: {
          x: x.toString(),
          y: y.toString(),
          width: this.mockupOptions.monthCellWidth.toString(),
          height: this.mockupOptions.monthCellHeight.toString(),
          ['data-month']: monthCounter.toString(),
          ['data-year']: this.year.toString(),
        },
      });

      // Increment x-movement
      x += this.mockupOptions.monthCellWidth + this.mockupOptions.monthCellPadding;

      createSVGElement({
        elementName: 'g',
        id: 'month-title',
        parentToAppend: monthContainer,
        content: this.getOutline(
          this.monthsNamesList[monthCounter],
          this.mockupOptions.monthTitleX,
          this.mockupOptions.monthTitleY,
          this.mockupOptions.monthTitleFontSize,
        ),
      });

      createSVGElement({
        elementName: 'g',
        id: 'year-title',
        parentToAppend: monthContainer,
        content: this.getOutline(
          `${this.year}`,
          this.mockupOptions.yearTitleX,
          this.mockupOptions.yearTitleY,
          this.mockupOptions.yearTitleFontSize,
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
      this.weekDaysNamesList.map((weekDayName, i) => {
        // исключение для 'Cр'
        const descenderException = i === 2 && this.lang === 'ru' ? true : false;

        const weekDayPath = this.getAndPlaceOutline(
          weekDayName,
          this.mockupOptions.weekDayX,
          descenderException ? this.mockupOptions.descenderException : this.mockupOptions.weekDayY,
          this.mockupOptions.weekDayFontSize,
        );

        createSVGElement({
          elementName: 'g',
          parentToAppend: daysTitles,
          attributes: {
            transform: `translate(${Number(
              this.mockupOptions.calendarGridX + this.mockupOptions.dayCellWidth * i,
            ).toFixed(2)} 0)`,
          },
          children: [weekDayPath],
        });
      });

      monthCounter++;

      if (monthCounter > 11) {
        monthCounter = 0;
        this.year++;
      }

      this.createMonthGrid(
        currentMonthGrid,
        getMonthFirstDay(monthCounter - 1, this.year) - 1,
        getDaysInMonth(monthCounter, this.year),
        getDaysInMonth(monthCounter - 1, this.year) - 1,
        this.mockupOptions.calendarGridX,
        this.mockupOptions.calendarGridY,
        this.mockupOptions.daysFontSize,
        this.mockupOptions.dayCellStyles,
      );

      // Append to main SVG
      mockup.appendChild(monthContainer);
    }

    this.cache.cacheMockup(
      this.getCurrentMockup('svg'),
      0,
      this.outputDimensions[this.format].width,
      this.outputDimensions[this.format].height,
    );

    this.hideLoader();
  }
}
