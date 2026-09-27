# Photo calendar maker

Photo calendar templates generator.

## Setup

```sh
pnpm install
pnpm dev        # dev server
pnpm build      # production build into build/
pnpm test:run   # unit tests
```

The crop tool uses [`@hungrysamurai/cropper`](https://www.npmjs.com/package/@hungrysamurai/cropper)
from npm. `pnpm build` bundles it into `build/`, so the output is self-contained and is uploaded as
is.
