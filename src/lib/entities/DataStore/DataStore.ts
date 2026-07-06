import {
  A_FormatMultiPageMockupOptions,
  A_FormatSinglePageMockupOptions,
} from '../../../assets/A_FormatOptions/A_FormatOptions';
import { A_outputFormats } from '../../../assets/A_FormatOptions/A_OutputDimensions';
import { CalendarType } from '../../../types';
import FontsController from './controllers/FontsController';
import IDBController from './controllers/IDBController';
import MockupsCacheController from './controllers/MockupsCacheController/MockupsCacheController';

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
      const { data, images, cachedMockups } = dataFromIDB;

      this.calendarProjectData = data;
      this.calendarImagesData = images;
      this.calendarCachedMockupsData = cachedMockups;
    }
  }

  cacheController: MockupsCacheController;

  saveDataToIDB = async (data: DataToStoreAndCache) => {
    const { width: mockupWidth, height: mockupHeight } =
      this.calendarOutputDimensions[this.calendarProjectData.format];

    const mockupBlob = await this.cacheController.cacheMockup(
      data.mockup,
      mockupWidth,
      mockupHeight,
    );

    const dataToStore: DataToStore = {
      id: data.index,
      image: data.image,
      mockup: mockupBlob,
    };

    await this.IDBController.saveToIDB(dataToStore);
  };

  setMockupsIDB = async (svgMockups: SVGElement[]) => {
    console.log(svgMockups);
    const { width: mockupWidth, height: mockupHeight } =
      this.calendarOutputDimensions[this.calendarProjectData.format];

    const cacheQueue = svgMockups.map((mockup) => {
      return this.cacheController.cacheMockup(mockup, mockupWidth, mockupHeight);
    });

    (await Promise.all(cacheQueue)).forEach((blob, i) => {
      this.IDBController.setDataIDB(blob, i);
    });
  };

  calendarProjectData: CalendarData;
  calendarImagesData: StoredImage[] = [];
  calendarCachedMockupsData: CachedMockup[] = [];

  constructor() {
    this.fontsController = new FontsController();
    this.IDBController = new IDBController();
    this.cacheController = new MockupsCacheController();
  }

  public async reset(newCalendarData: CalendarData) {
    this.calendarProjectData = newCalendarData;
    this.calendarImagesData = [];
    this.calendarCachedMockupsData = [];

    this.cacheController.reset();

    await this.IDBController.resetWithNewData(newCalendarData);
  }
}
