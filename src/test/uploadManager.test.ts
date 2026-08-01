import { describe, expect, it, vi } from 'vitest';

import UploadManager from '../lib/entities/UploadManager';
import { FormatName } from '../types';

const createMockOptions = () => ({
  format: FormatName.A4_Y,
  mockupOptions: {
    imagePlaceholderWidth: 100,
    imagePlaceholderHeight: 80,
    imagePlaceholderX: 10,
    imagePlaceholderY: 20,
  },
  outputDimensions: {
    A4_Y: { width: 100, height: 100 },
  },
  getCurrentMonthInViewIndex: () => 0,
  getCurrentMockup: vi.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'g')),
  getMockupByIndex: vi.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'g')),
  getImageGroupByIndex: vi.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'g')),
  saveImage: vi.fn().mockResolvedValue(undefined),
  showLoader: vi.fn(),
  hideLoader: vi.fn(),
});

describe('UploadManager', () => {
  it('creates an instance with the expected options shape', () => {
    const options = createMockOptions();
    const manager = new UploadManager(options as never);

    expect(manager).toBeInstanceOf(UploadManager);
  });

  it('returns early when no input files are provided', async () => {
    const manager = new UploadManager(createMockOptions() as never);
    const input = document.createElement('input');
    input.type = 'file';

    await expect(
      manager.uploadSingleImage({ target: input } as unknown as Event),
    ).resolves.toBeUndefined();
  });

  it('returns early when no image group is available for multiple upload', async () => {
    const options = createMockOptions();
    const manager = new UploadManager(options as never);
    const input = document.createElement('input');
    input.type = 'file';

    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });

    options.getImageGroupByIndex = vi.fn(() => null as never);

    await expect(
      manager.uploadMultipleImages({ target: input } as unknown as Event, 2),
    ).resolves.toBeUndefined();
  });
});
