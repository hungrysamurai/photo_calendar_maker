export default async function getImageSize(blob: Blob) {
  const bitmap = await createImageBitmap(blob);

  return {
    width: bitmap.width,
    height: bitmap.height,
  };
}
