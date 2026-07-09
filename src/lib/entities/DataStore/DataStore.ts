import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../../../assets/A_FormatOptions/A_FormatOptions';
import { A_outputFormats } from '../../../assets/A_FormatOptions/A_OutputDimensions';
import { CalendarType } from '../../../types';
import FontsController from './controllers/FontsController';
import IDBController from './controllers/IDBController';

export default class DataStore {
  /**
   * Dimensions of document (px)
   */
  calendarOutputDimensions: OutputDimensions = A_outputFormats;

  fontsController: FontsController;

  get currentFont(): FontData {
    return this.fontsController.getFont(this.calendarProjectData.font);
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
      // this.calendarImagesData = images;
    }
  }

  saveImageToIDB = async (image: Blob, index: number) => {
    console.log('save');

    await this.IDBController.saveToIDB(image, index);

    this.calendarImagesData[index] = { id: index, image };
  };

  calendarProjectData: CalendarData;
  calendarImagesData: StoredImage[] = [];

  constructor() {
    this.fontsController = new FontsController();
    this.IDBController = new IDBController();
  }

  public async reset(newCalendarData: CalendarData) {
    this.calendarProjectData = newCalendarData;
    this.calendarImagesData = [];

    await this.IDBController.resetWithNewData(newCalendarData);
  }
}
