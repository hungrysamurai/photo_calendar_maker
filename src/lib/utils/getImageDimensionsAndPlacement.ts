export default function getImageDimensionsAndPlacement(
  imagePlaceholderWidth: number,
  imagePlaceholderHeight: number,
  imagePlaceholderX: number,
  imagePlaceholderY: number,
  imgWidth: number,
  imgHeight: number,
) {
  // Calculate scaled dimensions (W', H') that fit in the placeholder while preserving aspect ratio
  let scaledWidth: number;
  let scaledHeight: number;

  // Check which constraint is tighter relative to the image's aspect ratio (imgWidth / imgHeight)
  const widthRatio = imagePlaceholderWidth / imgWidth; // Scale factor if limited by width
  const heightRatio = imagePlaceholderHeight / imgHeight; // Scale factor if limited by height

  if (widthRatio < heightRatio) {
    // Width is the limiting dimension. Use full placeholder width and calculate proportional height.
    scaledWidth = imagePlaceholderWidth;
    scaledHeight = Math.min(imagePlaceholderHeight, imgHeight * (imagePlaceholderWidth / imgWidth));
  } else {
    // Height is the limiting dimension or they are equal. Use full placeholder height and calculate proportional width.
    scaledHeight = imagePlaceholderHeight;
    scaledWidth = Math.min(imagePlaceholderWidth, imgWidth * (imagePlaceholderHeight / imgHeight));
  }

  // Calculate centered coordinates:
  const offsetX = imagePlaceholderX + (imagePlaceholderWidth - scaledWidth) / 2;
  const offsetY = imagePlaceholderY + (imagePlaceholderHeight - scaledHeight) / 2;

  return { scaledWidth, scaledHeight, offsetX, offsetY };
}
