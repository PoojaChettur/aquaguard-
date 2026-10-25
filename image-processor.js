/**
 * Scyld DeepSea Sonar - Acoustic Image Preprocessing Engine
 * Implements real-time CLAHE, Speckle Noise Reduction, and False-Color Sonar Palettes
 */

class SonarImageProcessor {
  constructor() {
    this.rawCanvas = document.createElement("canvas");
    this.rawCtx = this.rawCanvas.getContext("2d", { willReadFrequently: true });
    
    this.processedCanvas = document.createElement("canvas");
    this.processedCtx = this.processedCanvas.getContext("2d", { willReadFrequently: true });

    this.currentImage = null;
    this.activeColormap = "amber"; // amber, phosphor, cyan, greyscale
    this.claheEnabled = true;
    this.speckleFilterEnabled = true;
    this.gain = 1.15; // 0.5 to 2.0
    this.clipLimit = 3.0; // CLAHE clip limit
    this.tileGridSize = 8; // 8x8 tiles for CLAHE
    this.isProcessing = false;
  }

  /**
   * Load an image from URL or data URI
   */
  async loadImage(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.currentImage = img;
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        this.rawCanvas.width = width;
        this.rawCanvas.height = height;
        this.processedCanvas.width = width;
        this.processedCanvas.height = height;

        this.rawCtx.drawImage(img, 0, 0, width, height);
        this.processImage();
        resolve(this);
      };
      img.onerror = (err) => reject(err);
      img.src = imageSrc;
    });
  }

  /**
   * Run the full preprocessing pipeline: Speckle Reduction -> CLAHE -> Colormap & Gain
   */
  processImage() {
    if (!this.currentImage || this.rawCanvas.width === 0) return;
    this.isProcessing = true;

    const width = this.rawCanvas.width;
    const height = this.rawCanvas.height;

    // 1. Get raw pixel buffer
    const srcImageData = this.rawCtx.getImageData(0, 0, width, height);
    const srcData = srcImageData.data;

    // Create working luminance buffer (0-255)
    let luminance = new Uint8ClampedArray(width * height);
    for (let i = 0, j = 0; i < srcData.length; i += 4, j++) {
      // Perceptual luminance calculation: Y = 0.299R + 0.587G + 0.114B
      luminance[j] = Math.round(0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2]);
    }

    // 2. Speckle Noise Reduction (3x3 Fast Median Filter)
    if (this.speckleFilterEnabled) {
      luminance = this.applyMedianFilter(luminance, width, height);
    }

    // 3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
    if (this.claheEnabled) {
      luminance = this.applyCLAHE(luminance, width, height, this.tileGridSize, this.clipLimit);
    }

    // 4. Gain / Contrast Stretching & Colormap Shader Application
    const processedImageData = this.processedCtx.createImageData(width, height);
    const dstData = processedImageData.data;
    const colormap = this.getColormapLUT(this.activeColormap);

    const gainVal = this.gain;
    for (let i = 0, j = 0; i < dstData.length; i += 4, j++) {
      let val = luminance[j];
      // Apply Gain & Soft Sigmoid Contrast Curve
      if (gainVal !== 1.0) {
        let normalized = val / 255.0;
        // Non-linear s-curve enhancement for sonar highlight separation
        normalized = Math.pow(normalized, 1.0 / (gainVal * 0.9 + 0.1));
        val = Math.min(255, Math.max(0, Math.round(normalized * 255)));
      }

      // Map to selected false-color palette
      const lutIndex = val * 3;
      dstData[i]     = colormap[lutIndex];     // R
      dstData[i + 1] = colormap[lutIndex + 1]; // G
      dstData[i + 2] = colormap[lutIndex + 2]; // B
      dstData[i + 3] = 255;                    // Alpha
    }

    this.processedCtx.putImageData(processedImageData, 0, 0);
    this.isProcessing = false;
  }

  /**
   * 3x3 Median Filter for acoustic speckle noise reduction
   */
  applyMedianFilter(src, width, height) {
    const dst = new Uint8ClampedArray(width * height);
    const window = new Uint8Array(9);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let idx = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            window[idx++] = src[(y + dy) * width + (x + dx)];
          }
        }
        // Small 9-element in-place insertion sort
        for (let i = 1; i < 9; i++) {
          let key = window[i];
          let j = i - 1;
          while (j >= 0 && window[j] > key) {
            window[j + 1] = window[j];
            j--;
          }
          window[j + 1] = key;
        }
        dst[y * width + x] = window[4]; // median value
      }
    }

    // Preserve borders
    for (let x = 0; x < width; x++) {
      dst[x] = src[x];
      dst[(height - 1) * width + x] = src[(height - 1) * width + x];
    }
    for (let y = 0; y < height; y++) {
      dst[y * width] = src[y * width];
      dst[y * width + (width - 1)] = src[y * width + (width - 1)];
    }

    return dst;
  }

  /**
   * CLAHE implementation with bilinear interpolation across contextual grid
   */
  applyCLAHE(src, width, height, gridTiles, clipLimitFactor) {
    const dst = new Uint8ClampedArray(width * height);
    const tileW = Math.floor(width / gridTiles);
    const tileH = Math.floor(height / gridTiles);

    if (tileW === 0 || tileH === 0) return src;

    // Allocate CDF lookup tables for each grid tile
    const numTilesX = gridTiles;
    const numTilesY = gridTiles;
    const cdfs = new Array(numTilesY);

    for (let ty = 0; ty < numTilesY; ty++) {
      cdfs[ty] = new Array(numTilesX);
      for (let tx = 0; tx < numTilesX; tx++) {
        const startX = tx * tileW;
        const startY = ty * tileH;
        const endX = (tx === numTilesX - 1) ? width : (tx + 1) * tileW;
        const endY = (ty === numTilesY - 1) ? height : (ty + 1) * tileH;
        const tileSize = (endX - startX) * (endY - startY);

        // 1. Calculate tile histogram (256 bins)
        const hist = new Int32Array(256);
        for (let y = startY; y < endY; y++) {
          const rowOffset = y * width;
          for (let x = startX; x < endX; x++) {
            hist[src[rowOffset + x]]++;
          }
        }

        // 2. Clip histogram above threshold and redistribute excess
        const clipLimit = Math.max(1, Math.floor((clipLimitFactor * tileSize) / 256));
        let excess = 0;
        for (let b = 0; b < 256; b++) {
          if (hist[b] > clipLimit) {
            excess += (hist[b] - clipLimit);
            hist[b] = clipLimit;
          }
        }

        const bonus = Math.floor(excess / 256);
        const remainder = excess % 256;
        for (let b = 0; b < 256; b++) {
          hist[b] += bonus;
          if (b < remainder) hist[b]++;
        }

        // 3. Compute normalized CDF
        const cdf = new Uint8ClampedArray(256);
        let sum = 0;
        for (let b = 0; b < 256; b++) {
          sum += hist[b];
          cdf[b] = Math.min(255, Math.max(0, Math.round((sum * 255) / tileSize)));
        }
        cdfs[ty][tx] = cdf;
      }
    }

    // 4. Bilinear interpolation between contextual tile centers
    for (let y = 0; y < height; y++) {
      const tyF = (y - tileH / 2) / tileH;
      const ty0 = Math.max(0, Math.min(numTilesY - 1, Math.floor(tyF)));
      const ty1 = Math.max(0, Math.min(numTilesY - 1, ty0 + 1));
      const dy = Math.max(0, Math.min(1, tyF - ty0));

      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const txF = (x - tileW / 2) / tileW;
        const tx0 = Math.max(0, Math.min(numTilesX - 1, Math.floor(txF)));
        const tx1 = Math.max(0, Math.min(numTilesX - 1, tx0 + 1));
        const dx = Math.max(0, Math.min(1, txF - tx0));

        const pixelVal = src[rowOffset + x];

        const c00 = cdfs[ty0][tx0][pixelVal];
        const c01 = cdfs[ty0][tx1][pixelVal];
        const c10 = cdfs[ty1][tx0][pixelVal];
        const c11 = cdfs[ty1][tx1][pixelVal];

        // Bilinear blend: top & bottom interpolated values
        const top = (1 - dx) * c00 + dx * c01;
        const bottom = (1 - dx) * c10 + dx * c11;
        dst[rowOffset + x] = Math.round((1 - dy) * top + dy * bottom);
      }
    }

    return dst;
  }

  /**
   * Generate 256-color RGB Look-Up Table (LUT) for sonar colormaps
   */
  getColormapLUT(paletteName) {
    const lut = new Uint8Array(256 * 3);

    for (let i = 0; i < 256; i++) {
      const t = i / 255.0; // normalized 0.0 to 1.0
      let r = 0, g = 0, b = 0;

      switch (paletteName) {
        case "amber": // Classic Side-Scan Sonar Copper / Amber
          if (t < 0.35) {
            r = Math.round(t / 0.35 * 110);
            g = Math.round(t / 0.35 * 45);
            b = Math.round(t / 0.35 * 10);
          } else if (t < 0.75) {
            const nt = (t - 0.35) / 0.4;
            r = Math.round(110 + nt * (245 - 110));
            g = Math.round(45 + nt * (158 - 45));
            b = Math.round(10 + nt * (20 - 10));
          } else {
            const nt = (t - 0.75) / 0.25;
            r = Math.round(245 + nt * (255 - 245));
            g = Math.round(158 + nt * (240 - 158));
            b = Math.round(20 + nt * (180 - 20));
          }
          break;

        case "phosphor": // Tactical CRT Green Sonar
          if (t < 0.4) {
            r = Math.round(t / 0.4 * 10);
            g = Math.round(t / 0.4 * 120);
            b = Math.round(t / 0.4 * 20);
          } else if (t < 0.8) {
            const nt = (t - 0.4) / 0.4;
            r = Math.round(10 + nt * 80);
            g = Math.round(120 + nt * (255 - 120));
            b = Math.round(20 + nt * 40);
          } else {
            const nt = (t - 0.8) / 0.2;
            r = Math.round(90 + nt * 165);
            g = 255;
            b = Math.round(60 + nt * 195);
          }
          break;

        case "cyan": // Deep Abyss High-Contrast Cyan / Ocean
          if (t < 0.3) {
            r = Math.round(t / 0.3 * 8);
            g = Math.round(t / 0.3 * 35);
            b = Math.round(t / 0.3 * 90);
          } else if (t < 0.7) {
            const nt = (t - 0.3) / 0.4;
            r = Math.round(8 + nt * 20);
            g = Math.round(35 + nt * (210 - 35));
            b = Math.round(90 + nt * (255 - 90));
          } else {
            const nt = (t - 0.7) / 0.3;
            r = Math.round(28 + nt * (255 - 28));
            g = Math.round(210 + nt * (255 - 210));
            b = 255;
          }
          break;

        case "greyscale": // Pure Linear Backscatter Intensity
        default:
          r = i;
          g = i;
          b = i;
          break;
      }

      lut[i * 3]     = r;
      lut[i * 3 + 1] = g;
      lut[i * 3 + 2] = b;
    }

    return lut;
  }

  /**
   * Render before/after split view onto a target container canvas
   */
  renderSplitView(targetCanvas, splitPercent = 50) {
    if (!this.currentImage) return;

    const ctx = targetCanvas.getContext("2d");
    const width = targetCanvas.width;
    const height = targetCanvas.height;

    ctx.clearRect(0, 0, width, height);

    const splitX = Math.round((splitPercent / 100) * width);

    // Left half: Raw Sonar Image
    if (splitX > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();
      ctx.drawImage(this.rawCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // Right half: Enhanced / CLAHE Processed Image
    if (splitX < width) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();
      ctx.drawImage(this.processedCanvas, 0, 0, width, height);
      ctx.restore();
    }

    // Draw Divider Line with Glow
    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();

    // Draw handle circles
    ctx.fillStyle = "#00f0ff";
    ctx.beginPath();
    ctx.arc(splitX, height / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0b1329";
    ctx.beginPath();
    ctx.arc(splitX, height / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.SonarImageProcessor = SonarImageProcessor;
