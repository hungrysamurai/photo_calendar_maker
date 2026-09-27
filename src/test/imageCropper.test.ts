import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ImageCropper, { ImageCropperCallbacks } from '../lib/entities/ImageCropper';

const { FakeCropperView } = vi.hoisted(() => {
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
    accept = vi.fn(async () => null);
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

  return { FakeCropperView };
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

describe('ImageCropper', () => {
  beforeEach(() => {
    FakeCropperView.instances = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ blob: async () => imageBlob })),
    );
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

  it('the apply button asks the view to accept', async () => {
    const { cropper, view, image, applyBtn } = setup();
    await cropper.start(image);

    applyBtn.click();

    expect(view.accept).toHaveBeenCalledTimes(1);
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
