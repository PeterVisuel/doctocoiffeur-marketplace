// Réduction des photos dans le navigateur, avant l'envoi : une photo de téléphone (3 à 5 Mo)
// devient un JPEG d'environ 150 à 300 Ko, sans différence visible à l'écran.

export const PHOTO_MAX_SIDE = 1280; // plus grand côté, en pixels
export const PHOTO_QUALITY = 0.8;

// Ouvre l'image en respectant le sens de la prise de vue (photos de téléphone tournées)
const loadImage = async (file) => {
  if (typeof window.createImageBitmap === 'function') {
    try {
      return await window.createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) {
      // Navigateur ancien : repli sur un élément <img>
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Format de photo non pris en charge'));
    };
    img.src = url;
  });
};

// Renvoie un Blob JPEG réduit
export const compressImage = async (file, maxSide = PHOTO_MAX_SIDE, quality = PHOTO_QUALITY) => {
  const image = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; // fond blanc pour les images transparentes (PNG)
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  if (typeof image.close === 'function') image.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new Error('Réduction de la photo impossible');
  return blob;
};

// « 245 Ko », « 1,2 Mo »
export const formatSize = (bytes) => (bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
  : `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`);
