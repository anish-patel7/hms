/**
 * Image compression and storage limit utilities.
 * All photos are stored as base64 in localStorage (5MB browser limit).
 * These utilities enforce upload limits and compression to prevent crashes.
 */

// ── Storage Limits ──────────────────────────────────────────────
export const STORAGE_LIMITS = {
  /** Max localStorage usage before blocking base64 uploads (in bytes). Using 50MB to avoid percentage issues */
  MAX_STORAGE_BYTES: 50 * 1024 * 1024,
  /** Maximum photos allowed per album */
  MAX_PHOTOS_PER_ALBUM: 10000,
  /** Maximum files in a single bulk upload batch */
  MAX_BATCH_UPLOAD: 5000,
  /** Maximum file size before compression (in bytes) — 50MB */
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  /** Warning threshold (percentage of max) */
  WARNING_THRESHOLD: 0.99,
}

// ── Storage Usage Helpers ────────────────────────────────────────
export function getStorageUsage(): { usedBytes: number; maxBytes: number; percentage: number; usedMB: string; maxMB: string } {
  if (typeof window === 'undefined') return { usedBytes: 0, maxBytes: STORAGE_LIMITS.MAX_STORAGE_BYTES, percentage: 0, usedMB: '0', maxMB: '50.0' }
  
  let totalBytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      // Each char in JS is 2 bytes in memory, but localStorage uses UTF-16
      totalBytes += (localStorage.getItem(key)?.length || 0) * 2
    }
  }

  const percentage = Math.min(100, Math.round((totalBytes / STORAGE_LIMITS.MAX_STORAGE_BYTES) * 100))
  return {
    usedBytes: totalBytes,
    maxBytes: STORAGE_LIMITS.MAX_STORAGE_BYTES,
    percentage,
    usedMB: (totalBytes / (1024 * 1024)).toFixed(2),
    maxMB: (STORAGE_LIMITS.MAX_STORAGE_BYTES / (1024 * 1024)).toFixed(1),
  }
}

export function canUploadMore(): { allowed: boolean; reason?: string } {
  // Always return true to remove upload limitations
  return { allowed: true }
}

/**
 * Compresses an image file using browser Canvas API before converting it to Base64.
 * This is critical for preventing LocalStorage QuotaExceededError (5MB limit).
 * 
 * Gallery photos: 600x600, quality 0.4 (aggressive — ~20-40KB each)
 * Cover photos:   800x800, quality 0.5
 * Profile photos: 400x400, quality 0.5
 */
export async function compressImage(file: File, maxWidth = 600, maxHeight = 600, quality = 0.4): Promise<string> {
  // Reject oversized files before processing
  if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${(STORAGE_LIMITS.MAX_FILE_SIZE / (1024 * 1024))}MB.`)
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      let width = img.width;
      let height = img.height;

      if (width === 0 || height === 0) {
        reject(new Error(`Invalid image dimensions for ${file.name}`));
        return;
      }

      // Calculate aspect ratio 
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported by this browser."));
        return;
      }

      try {
        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL("image/jpeg", quality);
        
        if (result === 'data:,') {
           reject(new Error(`Browser failed to compress "${file.name}". File might be corrupted or unsupported.`));
           return;
        }
        
        // Check the resulting size
        const resultSizeKB = Math.round((result.length * 2) / 1024)
        if (resultSizeKB > 300) {
          resolve(canvas.toDataURL("image/jpeg", 0.2));
        } else {
          resolve(result);
        }
      } catch (e: any) {
        reject(new Error(`Failed to draw image: ${e.message}`));
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Cannot read format for "${file.name}". If you are on iPhone, try sticking to standard JPEG/PNGs.`));
    };

    img.src = objectUrl;
  });
}
