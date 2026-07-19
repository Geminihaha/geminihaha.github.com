// Image to Line Art Edge Detection Filter

export function processEdgeDetection(sourceImage, previewCanvas, threshold = 70) {
  const ctx = previewCanvas.getContext('2d');
  
  // Aspect ratio maintain
  const maxDim = 600;
  let width = sourceImage.width;
  let height = sourceImage.height;

  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }

  previewCanvas.width = width;
  previewCanvas.height = height;

  // Draw original image first
  ctx.drawImage(sourceImage, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Grayscale & Contrast boost
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = g;
  }

  // 2. Sobel Edge Detection Kernels
  const outputData = ctx.createImageData(width, height);
  const out = outputData.data;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel X & Y
      const gx =
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1];

      const gy =
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
         1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1];

      const mag = Math.sqrt(gx * gx + gy * gy);

      // Inverted threshold: high edge intensity -> Black outline (#000000), else White (#FFFFFF)
      const isEdge = mag > threshold;
      const pixelIdx = (y * width + x) * 4;

      const val = isEdge ? 0 : 255;
      out[pixelIdx] = val;     // R
      out[pixelIdx + 1] = val; // G
      out[pixelIdx + 2] = val; // B
      out[pixelIdx + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(outputData, 0, 0);
  return previewCanvas;
}
