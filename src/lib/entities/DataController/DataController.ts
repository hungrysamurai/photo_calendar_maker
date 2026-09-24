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

  /**
   * Id of the project currently loaded into memory (`null` when no project is open)
   */
  activeProjectId: number | null = null;

  constructor() {
    this.fontsController = new FontsController();
    this.IDBController = new IDBController();
  }

  listProjects(): Promise<StoredProject[]> {
    return this.IDBController.listProjects();
  }

  /**
   * Persist a new project and make it the active one
   * @returns id of the created project
   */
  async createProject(data: CalendarData): Promise<number> {
    const id = await this.IDBController.createProject(data);

    this.setActive(id, data, []);

    return id;
  }

  /**
   * Load project record + images into memory and mark it as last opened
   */
  async loadProject(id: number): Promise<void> {
    const project = await this.IDBController.getProject(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const images = await this.IDBController.getProjectImages(id);
    const lastOpenedAt = Date.now();
    await this.IDBController.touchProject(id, lastOpenedAt);

    this.setActive(id, this.toCalendarData({ ...project, lastOpenedAt }), images);
  }

  /**
   * Open the most recently opened project, if any
   * @returns whether a project was restored
   */
  async restoreLastOpened(): Promise<boolean> {
    const [latest] = await this.IDBController.listProjects();

    if (!latest) return false;

    await this.loadProject(latest.id);
    return true;
  }

  /**
   * Delete project with all of its images; clears in-memory state if it was active
   */
  async deleteProject(id: number): Promise<void> {
    await this.IDBController.deleteProject(id);

    if (this.activeProjectId === id) {
      this.clearActive();
    }
  }

  /**
   * Save edited settings of a project and make it the active one;
   * nothing is written when the settings are unchanged
   * @returns whether anything was changed
   */
  async updateProject(id: number, settings: EditableProjectSettings): Promise<boolean> {
    const project = await this.IDBController.getProject(id);

    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    const isChanged = (Object.keys(settings) as (keyof EditableProjectSettings)[]).some(
      (key) => settings[key] !== project[key],
    );

    if (!isChanged) return false;

    // Stored image indices are page positions: keep each photo on its calendar month.
    // A single-page project has only one photo, which stays put.
    const reindexShift =
      project.type === CalendarType.MultiPage &&
      settings.firstMonthIndex !== project.firstMonthIndex
        ? project.firstMonthIndex - settings.firstMonthIndex
        : undefined;

    const updated = await this.IDBController.updateProject(id, settings, reindexShift);
    const images = await this.IDBController.getProjectImages(id);

    this.setActive(id, this.toCalendarData(updated), images);

    return true;
  }

  saveImageToIDB = async (image: Blob, index: number) => {
    if (this.activeProjectId === null) {
      throw new Error('No active project to save image to');
    }

    await this.IDBController.saveImage(this.activeProjectId, index, image);

    const oldImageIndex = this.calendarImagesData.findIndex((el) => el.id === index);

    // Replace image in calendarImagesData if already exist by index
    if (oldImageIndex >= 0) {
      this.calendarImagesData[oldImageIndex] = { id: index, image };

      // ...or add new
    } else {
      this.calendarImagesData.push({ id: index, image });
    }
  };

  /**
   * Strip the storage key from a stored record
   */
  private toCalendarData(project: StoredProject): CalendarData {
    const data: CalendarData & { id?: number } = { ...project };
    delete data.id;
    return data;
  }

  private setActive(id: number, data: CalendarData, images: StoredImage[]) {
    this.activeProjectId = id;
    this.calendarProjectData = data;
    this.calendarImagesData = images;
  }

  private clearActive() {
    this.activeProjectId = null;
    this.calendarProjectData = undefined as unknown as CalendarData;
    this.calendarImagesData = [];
  }
}
