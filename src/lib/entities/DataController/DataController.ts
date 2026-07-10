import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../../../assets/A_FormatOptions/A_FormatOptions';
import { A_outputFormats } from '../../../assets/A_FormatOptions/A_OutputDimensions';
import fontsData from '../../../assets/sourceFontsData';
import { CalendarType } from '../../../types';
import FontsController from './controllers/FontsController';
import IDBController from './controllers/IDBController';

export default class DataController {
  calendarProjectData: CalendarData;
  calendarImagesData: StoredImage[] = [];
  /**
   * Dimensions of document (px)
   */
  calendarOutputDimensions: OutputDimensions = A_outputFormats;

  fontsController: FontsController;

  get currentFont(): FontData {
    return this.fontsController.getFont(this.calendarProjectData.font);
  }

  async loadFonts() {
    await this.fontsController.loadFonts(fontsData);
  }

  get currentMockupOptions(): SinglePageMockupOutputOptions | MultiPageMockupOutputOptions {
    if (this.calendarProjectData.type === CalendarType.SinglePage) {
      return new A_FormatSinglePageMockupOptions(this.calendarProjectData.format)[
        this.calendarProjectData.format
      ];
    } else {
      return new A_FormatMultiPageMockupOptions(this.calendarProjectData.format)[
        this.calendarProjectData.format
      ];
    }
  }

  private IDBController: IDBController;

  async retrieveDataFromIDB() {
    const dataFromIDB = await this.IDBController.initIDB();

    if (dataFromIDB) {
      const { data, images } = dataFromIDB;

      images.forEach((image) => {
        this.calendarImagesData.push(image);
      });

      this.calendarProjectData = data;
    }
  }

  saveImageToIDB = async (image: Blob, index: number) => {
    await this.IDBController.saveToIDB(image, index);

    const oldImageIndex = this.calendarImagesData.findIndex((el) => el.id === index);

    if (oldImageIndex >= 0) {
      this.calendarImagesData[oldImageIndex] = { id: index, image };
    } else {
      this.calendarImagesData.push({ id: index, image });
    }
  };

  constructor() {
    this.fontsController = new FontsController();
    this.IDBController = new IDBController();
  }

  async reset(newCalendarData: CalendarData) {
    this.calendarProjectData = newCalendarData;
    this.calendarImagesData = [];

    await this.IDBController.resetWithNewData(newCalendarData);
  }
}
