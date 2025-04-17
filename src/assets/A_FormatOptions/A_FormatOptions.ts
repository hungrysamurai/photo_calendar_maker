import { FormatName } from "../../../types";
import { A_outputFormats } from "./A_OutputDimensions";
import A_FormatMultiplierMap from "./A_FormatMultiplierMap";

import {
  A_FormatYSinglePageInputOptions,
  A_FormatXSinglePageInputOptions,
} from "./A_FormatSinglePageInputOptions";

import {
  A_FormatYMultiPageInputOptions,
  A_FormatXMultiPageInputOptions,
} from "./A_FormatMultiPageInputOptions";

abstract class A_FormatOptions<I, O> {
  public options!: I;

  constructor(public targetFormat: FormatName) {}

  public get A6_Y(): O {
    return this.A6;
  }

  public get A6_X(): O {
    return this.A6;
  }

  public get A5_Y(): O {
    return this.getOutput();
  }

  public get A5_X(): O {
    return this.getOutput();
  }

  public get A4_Y(): O {
    return this.getOutput();
  }

  public get A4_X(): O {
    return this.getOutput();
  }

  public get A3_Y(): O {
    return this.getOutput();
  }

  public get A3_X(): O {
    return this.getOutput();
  }

  public get A2_Y(): O {
    return this.getOutput();
  }

  public get A2_X(): O {
    return this.getOutput();
  }

  protected getMockupWidth(): number {
    return Math.floor(A_outputFormats[this.targetFormat].width / 11.8);
  }

  protected getMockupHeight(): number {
    return Math.floor(A_outputFormats[this.targetFormat].height / 11.8);
  }

  protected getMultiplier(): number {
    const format = this.targetFormat.slice(0, 2);
    return Number(
      Math.pow(
        1.414285,
        A_FormatMultiplierMap[format as keyof typeof A_FormatMultiplierMap]
      ).toFixed(4)
    );
  }

  protected abstract get A6(): O;

  protected abstract getOutput(): O;
}

export class A_FormatSinglePageMockupOptions extends A_FormatOptions<
  SinglePageMockupInputOptions,
  SinglePageMockupOutputOptions
> {
  constructor(public targetFormat: FormatName) {
    super(targetFormat);

    if (targetFormat.endsWith("Y")) {
      this.options = A_FormatYSinglePageInputOptions;
    } else if (targetFormat.endsWith("X")) {
      this.options = A_FormatXSinglePageInputOptions;
    }
  }

  protected get A6() {
    return Object.assign(
      {
        pixelsDimensions: A_outputFormats[this.targetFormat],
        mockupWidth: this.getMockupWidth(),
        mockupHeight: this.getMockupHeight(),
        weekDayX: this.options.dayCellWidth / 2,
      },
      this.options
    );
  }

  protected getOutput() {
    const options = Object.assign({}, this.options);

    for (const [key, value] of Object.entries(options)) {
      if (typeof value === "number") {
        options[key] = Number((value * this.getMultiplier()).toFixed(2));
      }
    }

    return Object.assign(options, {
      pixelsDimensions: A_outputFormats[this.targetFormat],
      mockupWidth: this.getMockupWidth(),
      mockupHeight: this.getMockupHeight(),
      numberOfColumns: this.options.numberOfColumns,
      weekDayX: options.dayCellWidth / 2,
    });
  }
}

export class A_FormatMultiPageMockupOptions extends A_FormatOptions<
  MultiPageMockupInputOptions,
  MultiPageMockupOutputOptions
> {
  constructor(public targetFormat: FormatName) {
    super(targetFormat);
    if (targetFormat.endsWith("Y")) {
      this.options = A_FormatYMultiPageInputOptions;
    } else if (targetFormat.endsWith("X")) {
      this.options = A_FormatXMultiPageInputOptions;
    }
  }

  protected get A6() {
    return Object.assign(
      {
        pixelsDimensions: A_outputFormats[this.targetFormat],
        mockupWidth: this.getMockupWidth(),
        mockupHeight: this.getMockupHeight(),
        weekDayX: this.options.dayCellWidth / 2,
      },
      this.options
    );
  }

  protected getOutput() {
    const options = Object.assign({}, this.options);

    for (const [key, value] of Object.entries(options)) {
      if (typeof value === "number") {
        options[key] = Number((value * this.getMultiplier()).toFixed(2));
      }
    }

    return Object.assign(options, {
      pixelsDimensions: A_outputFormats[this.targetFormat],
      mockupWidth: this.getMockupWidth(),
      mockupHeight: this.getMockupHeight(),
      weekDayX: options.dayCellWidth / 2,
    });
  }
}
