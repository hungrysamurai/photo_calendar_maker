import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ImageCropper, { ImageCropperCallbacks } from '../lib/entities/ImageCropper';

const { FakeCropperView, CROP_RECT, CROPPED_BLOB } = vi.hoisted(() => {
  const CROP_RECT = { x: 10, y: 20, width: 300, height: 200 };
  const CROPPED_BLOB = new Blob(['cropped'], { type: 'image/jpeg' });
  type Listener = (payload: unknown) => void;

  class FakeCropperView {
    static instances: FakeCropperView[] = [];

    container: HTMLElement;
    options: unknown;
    state: 'idle' | 'loading' | 'cropping' = 'idle';
    private listeners = new Map<string, Set<Listener>>();

    start = vi.fn(async (source: unknown) => {
      void source;
      this.state = 'cropping';
    });
    accept = vi.fn(async () => {
      if (this.state !== 'cropping') return null;
      const result = { rect: CROP_RECT, blob: CROPPED_BLOB };
      this.emit('accept', result);
      this.state = 'idle';
      return result;
    });
    cancel = vi.fn(async () => {
      this.state = 'idle';
      this.emit('cancel', undefined);
    });
    destroy = vi.fn();

    constructor(container: HTMLElement, options?: unknown) {
      this.container = container;
      this.options = options;
      FakeCropperView.instances.push(this);
    }

    on(event: string, listener: Listener) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event)!.add(listener);
      return () => this.off(event, listener);
    }

    off(event: string, listener: Listener) {
      this.listeners.get(event)?.delete(listener);
    }

    emit(event: string, payload: unknown) {
      this.listeners.get(event)?.forEach((listener) => listener(payload));
    }
  }

  return { FakeCropperView, CROP_RECT, CROPPED_BLOB };
});

vi.mock('@hungrysamurai/cropper', () => ({ CropperView: FakeCropperView }));

const SVG_NS = 'http://www.w3.org/2000/svg';
const IMAGE_HREF = 'blob:http://localhost/original';
const IMAGE_RECT = { left: 12, top: 34, width: 300, height: 200 };

const createImageElement = (): SVGImageElement => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const image = document.createElementNS(SVG_NS, 'image') as SVGImageElement;
  image.setAttribute('href', IMAGE_HREF);
  image.getBoundingClientRect = () =>
    ({ ...IMAGE_RECT, x: IMAGE_RECT.left, y: IMAGE_RECT.top }) as DOMRect;
  svg.append(image);
  document.body.append(svg);
  return image;
};

const createCallbacks = () =>
  ({
    saveImage: vi.fn().mockResolvedValue(undefined),
    getCurrentMonthInViewIndex: vi.fn(() => 3),
    getMockupByIndex: vi.fn(),
    showLoader: vi.fn(),
    hideLoader: vi.fn(),
    onAfterRemove: vi.fn(),
  }) satisfies ImageCropperCallbacks;

const setup = () => {
  const cropControlsContainer = document.createElement('div');
  document.body.append(cropControlsContainer);
  const callbacks = createCallbacks();
  const cropper = new ImageCropper(cropControlsContainer, callbacks);
  const view = FakeCropperView.instances.at(-1)!;
  const overlay = document.querySelector<HTMLDivElement>('.cropper-outer-container')!;
  const image = createImageElement();
  const applyBtn = cropControlsContainer.querySelector<HTMLButtonElement>('#apply-crop')!;
  const cancelBtn = cropControlsContainer.querySelector<HTMLButtonElement>('#cancel-crop')!;

  return { cropper, callbacks, view, overlay, image, applyBtn, cancelBtn };
};

const imageBlob = new Blob(['pixels'], { type: 'image/jpeg' });
const CROPPED_URL = 'blob:http://localhost/cropped';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => (resolve = res));
  return { promise, resolve };
};

describe('ImageCropper', () => {
  beforeEach(() => {
    FakeCropperView.instances = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => imageBlob })),
    );
    URL.createObjectURL = vi.fn(() => CROPPED_URL);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructs one view on the overlay with the agreed config', () => {
    const { view, overlay } = setup();

    expect(FakeCropperView.instances).toHaveLength(1);
    expect(view.container).toBe(overlay);
    expect(view.options).toMatchObject({
      fit: 'contain',
      maxScale: 8,
      grid: false,
      output: {
        type: 'image/jpeg',
        minWidth: 256,
        minHeight: 256,
        maxWidth: 4096,
        maxHeight: 4096,
        clipToImage: true,
      },
    });
    expect((view.options as { output: object }).output).not.toHaveProperty('fillColor');
  });

  it('renders the apply and cancel buttons into the crop controls container', () => {
    const { applyBtn, cancelBtn } = setup();

    expect(applyBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
  });

  it('start() positions the overlay over the image and hides the SVG photo', async () => {
    const { cropper, view, overlay, image } = setup();

    await cropper.start(image);

    expect(overlay.style.left).toBe('12px');
    expect(overlay.style.top).toBe('34px');
    expect(overlay.style.width).toBe('300px');
    expect(overlay.style.height).toBe('200px');
    expect(fetch).toHaveBeenCalledWith(IMAGE_HREF);
    expect(view.start).toHaveBeenCalledWith(imageBlob);
    expect(image.style.visibility).toBe('hidden');
    expect(overlay.style.pointerEvents).toBe('auto');
    expect(cropper.isActive).toBe(true);
  });

  it('start() shows the loader, then hides it once the view is ready', async () => {
    const { cropper, callbacks, view, image } = setup();
    let loaderShownDuringStart = false;
    view.start.mockImplementationOnce(async () => {
      loaderShownDuringStart =
        callbacks.showLoader.mock.calls.length === 1 &&
        callbacks.hideLoader.mock.calls.length === 0;
      view.state = 'cropping';
    });

    await cropper.start(image);

    expect(loaderShownDuringStart).toBe(true);
    expect(callbacks.hideLoader).toHaveBeenCalledTimes(1);
  });

  it('start() while active does nothing', async () => {
    const { cropper, callbacks, view, image } = setup();
    await cropper.start(image);

    await cropper.start(image);

    expect(view.start).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(callbacks.showLoader).toHaveBeenCalledTimes(1);
  });

  it('the cancel button closes the tool without saving', async () => {
    const { cropper, callbacks, view, overlay, image, cancelBtn } = setup();
    await cropper.start(image);

    cancelBtn.click();
    await vi.waitFor(() => expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1));

    expect(view.cancel).toHaveBeenCalledTimes(1);
    expect(image.style.visibility).toBe('visible');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(image.getAttribute('href')).toBe(IMAGE_HREF);
    expect(callbacks.saveImage).not.toHaveBeenCalled();
    expect(cropper.isActive).toBe(false);
  });

  it('a cancel event from the view (Esc) closes the tool without saving', async () => {
    const { cropper, callbacks, view, overlay, image } = setup();
    await cropper.start(image);

    view.state = 'idle';
    view.emit('cancel', undefined);

    expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1);
    expect(image.style.visibility).toBe('visible');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(callbacks.saveImage).not.toHaveBeenCalled();
  });

  it('the apply button swaps in the cropped image, saves it, then closes the tool', async () => {
    const { cropper, callbacks, view, overlay, image, applyBtn } = setup();
    await cropper.start(image);

    applyBtn.click();
    await vi.waitFor(() => expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1));

    expect(view.accept).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(CROPPED_BLOB);
    expect(image.getAttribute('href')).toBe(CROPPED_URL);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(IMAGE_HREF);
    expect(callbacks.saveImage).toHaveBeenCalledExactlyOnceWith(CROPPED_BLOB, 3);
    expect(image.style.visibility).toBe('visible');
    expect(overlay.style.pointerEvents).toBe('none');
    expect(cropper.isActive).toBe(false);
  });

  it('an accept event from the view (Enter) saves the same way as the apply button', async () => {
    const { cropper, callbacks, view, image } = setup();
    await cropper.start(image);

    view.emit('accept', { rect: CROP_RECT, blob: CROPPED_BLOB });
    view.state = 'idle';
    await vi.waitFor(() => expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1));

    expect(image.getAttribute('href')).toBe(CROPPED_URL);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(IMAGE_HREF);
    expect(callbacks.saveImage).toHaveBeenCalledExactlyOnceWith(CROPPED_BLOB, 3);
  });

  it('closes the tool only after the save resolves', async () => {
    const { cropper, callbacks, image, applyBtn } = setup();
    const save = deferred();
    callbacks.saveImage.mockReturnValueOnce(save.promise);
    await cropper.start(image);

    applyBtn.click();
    await vi.waitFor(() => expect(callbacks.saveImage).toHaveBeenCalledTimes(1));

    expect(image.getAttribute('href')).toBe(CROPPED_URL);
    expect(callbacks.onAfterRemove).not.toHaveBeenCalled();
    expect(image.style.visibility).toBe('hidden');
    expect(cropper.isActive).toBe(true);

    save.resolve();
    await vi.waitFor(() => expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1));
    expect(image.style.visibility).toBe('visible');
    expect(cropper.isActive).toBe(false);
  });

  it('start() while a save is pending does nothing', async () => {
    const { cropper, callbacks, view, image, applyBtn } = setup();
    const save = deferred();
    callbacks.saveImage.mockReturnValueOnce(save.promise);
    await cropper.start(image);
    applyBtn.click();
    await vi.waitFor(() => expect(callbacks.saveImage).toHaveBeenCalledTimes(1));

    await cropper.start(image);

    expect(view.start).toHaveBeenCalledTimes(1);
    save.resolve();
  });

  it('closes the tool even if the save fails', async () => {
    const { callbacks, image, applyBtn, cropper } = setup();
    const error = new Error('quota');
    callbacks.saveImage.mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await cropper.start(image);

    applyBtn.click();
    await vi.waitFor(() => expect(callbacks.onAfterRemove).toHaveBeenCalledTimes(1));

    expect(image.style.visibility).toBe('visible');
    expect(log).toHaveBeenCalledWith('Failed to save cropped image:', error);
    log.mockRestore();
  });

  it('can be started again after a cancel', async () => {
    const { cropper, view, image } = setup();
    await cropper.start(image);
    view.state = 'idle';
    view.emit('cancel', undefined);

    await cropper.start(image);

    expect(view.start).toHaveBeenCalledTimes(2);
    expect(cropper.isActive).toBe(true);
  });
});
