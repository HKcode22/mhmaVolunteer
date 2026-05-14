const MAX_WIDTH = 800;
const QUALITY = 0.6;
const MAX_BASE64_SIZE = 800 * 1024; // 800KB

export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await readFile(file);
  const compressed = await compressImage(dataUrl);

  if (compressed.length > MAX_BASE64_SIZE) {
    throw new Error(
      `Compressed image is too large (${(compressed.length / 1024).toFixed(0)}KB). ` +
      `Please use a smaller image or reduce quality.`
    );
  }

  return compressed;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width);
      const width = img.width * scale;
      const height = img.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", QUALITY));
    };
    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = dataUrl;
  });
}
