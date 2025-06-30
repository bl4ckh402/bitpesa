// This is a data URL for a 100x100 noise PNG
// We're using this script approach since we can't directly create binary files

export function createNoiseTexture() {
  // Create a simple 100x100 canvas with noise
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Fill with black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 100, 100);
  
  // Add noise
  const imageData = ctx.getImageData(0, 0, 100, 100);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Random noise value between 0 and 255
    const noise = Math.floor(Math.random() * 100);
    
    // Set RGB values to the same value for grayscale noise
    data[i] = data[i + 1] = data[i + 2] = noise;
    
    // Keep the alpha channel fully opaque
    data[i + 3] = 255;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Export the canvas as a data URL
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
}

// Usage in browser:
// 1. Call createNoiseTexture() to get the data URL
// 2. Create an image element with this data URL as src
// 3. Or use it as a background-image in CSS
