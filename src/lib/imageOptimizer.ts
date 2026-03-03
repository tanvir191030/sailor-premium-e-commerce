import imageCompression from "browser-image-compression";

interface OptimizeOptions {
  maxWidth?: number;
  quality?: number;
}

/**
 * Optimizes an image file: resizes, compresses, and converts to WebP.
 * Returns a new File object ready for upload.
 */
export const optimizeImage = async (
  file: File,
  options: OptimizeOptions = {}
): Promise<File> => {
  const { maxWidth = 1200, quality = 0.8 } = options;

  // Step 1: Compress and resize using browser-image-compression
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: maxWidth,
    maxSizeMB: 0.2, // Target ~200KB
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: quality,
  });

  // Ensure .webp extension in filename
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const webpFile = new File([compressed], `${baseName}.webp`, {
    type: "image/webp",
  });

  return webpFile;
};

/** Product image: max 1200px width */
export const optimizeProductImage = (file: File) =>
  optimizeImage(file, { maxWidth: 1200, quality: 0.8 });

/** Hero/banner image: max 1920px width */
export const optimizeHeroImage = (file: File) =>
  optimizeImage(file, { maxWidth: 1920, quality: 0.8 });
