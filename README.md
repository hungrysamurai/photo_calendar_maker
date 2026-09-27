# Photo calendar maker

Photo calendar templates generator.

## Setup

The crop tool uses [`@hungrysamurai/cropper`](../../../../standalone/cropper), consumed as a
`link:` dependency on the sibling standalone checkout (`../../../../standalone/cropper`). It is not
published to npm, and its `dist/` is gitignored, so build it on this machine first:

```sh
cd ../../../../standalone/cropper
pnpm install
pnpm build
```

Then, in this project:

```sh
pnpm install
pnpm dev        # dev server
pnpm build      # production build into build/
pnpm test:run   # unit tests
```

Rebuild the library (`pnpm build` there) whenever it changes; the dev server and the production
build both read its `dist/`.

`pnpm build` bundles the library into `build/`, so the output is self-contained and is uploaded as
is. The `link:` dependency never has to resolve on the server.
