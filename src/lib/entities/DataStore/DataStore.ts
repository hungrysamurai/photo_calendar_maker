import FontsController from './controllers/FontsController';
import IDBController from './controllers/IDBController';

export default class DataStore {
  fontsController: FontsController;

  get currentFont(): FontData {
    return this.fontsController.getFont(this.calendarProjectData.font);
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

  calendarProjectData: CalendarData;
  calendarImagesData: ImageObject[] = [];
  calendarCachedMockupsData: CachedMockupObject[] = [];

  constructor() {
    this.fontsController = new FontsController();
    this.IDBController = new IDBController();
  }

  public async reset(newCalendarData: CalendarData) {
    this.calendarProjectData = newCalendarData;
    this.calendarImagesData = [];
    this.calendarCachedMockupsData = [];

    await this.IDBController.resetWithNewData(newCalendarData);
  }
}
