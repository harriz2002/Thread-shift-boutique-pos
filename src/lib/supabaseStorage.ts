import { supabase } from '../supabaseClient';

export const BUCKET_NAME = 'app-files';

/**
 * High-performance browser-side image compression utility.
 * Resizes large photos to optimal dimensions and converts to JPEG/PNG Data URL.
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    // If not an image, read directly as data URL
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (!dataUri) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUri);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        } catch {
          resolve(dataUri);
        }
      };
      img.onerror = () => resolve(dataUri);
      img.src = dataUri;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Get current authenticated user ID or fallback
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const { data } = await supabase.auth.getUser();
    if (data && data.user && data.user.id) {
      return data.user.id;
    }
  } catch (e) {
    // Quiet fallback
  }
  return 'default-user';
}

/**
 * Uploads a file to Supabase Storage in bucket 'app-files'
 * If remote storage is unreachable (e.g. offline, unconfigured, or network error),
 * it seamlessly returns an optimized local Data URL without throwing.
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  featureName: string = 'products',
  itemId: string = 'new-item'
): Promise<{ path: string; signedUrl: string }> {
  // 1. Prepare high-performance local data URL as immediate guarantee
  const localDataUrl = await compressImageFile(file);

  try {
    const userId = await getCurrentUserId().catch(() => 'default-user');
    const fileExt = file.name.split('.').pop() || 'png';
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}`;
    const filePath = `${userId}/${featureName}/${itemId}/${uniqueId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error || !data?.path) {
      // Remote storage bypassed or unreachable - use fast local data URL
      return {
        path: `local/${featureName}/${itemId}/${file.name}`,
        signedUrl: localDataUrl
      };
    }

    // Generate signed URL (expires in 1 year: 31536000 seconds)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 31536000);

    if (signedError || !signedData?.signedUrl) {
      return {
        path: data.path,
        signedUrl: localDataUrl
      };
    }

    return {
      path: data.path,
      signedUrl: signedData.signedUrl
    };
  } catch {
    // Remote fetch failed (e.g. DNS or offline) - return reliable local image
    return {
      path: `local/${featureName}/${itemId}/${file.name}`,
      signedUrl: localDataUrl
    };
  }
}

/**
 * Generate a signed URL for a private storage file path
 */
export async function getSignedUrlForPath(pathOrUrl: string, expiresInSeconds: number = 31536000): Promise<string> {
  if (!pathOrUrl) return '';
  // If it's an external URL (http/data:) or local storage path
  if (
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('local/') ||
    ((pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) && !pathOrUrl.includes(`/storage/v1/object/`))
  ) {
    return pathOrUrl;
  }

  // Extract storage path if full URL was passed or use raw path
  let relativePath = pathOrUrl;
  if (pathOrUrl.includes(`${BUCKET_NAME}/`)) {
    relativePath = pathOrUrl.split(`${BUCKET_NAME}/`)[1].split('?')[0];
  } else if (pathOrUrl.includes('?')) {
    relativePath = pathOrUrl.split('?')[0];
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(relativePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return pathOrUrl;
    }
    return data.signedUrl;
  } catch {
    return pathOrUrl;
  }
}

/**
 * Delete a file from Supabase Storage 'app-files' bucket
 */
export async function deleteFileFromSupabaseStorage(pathOrUrl: string): Promise<void> {
  if (!pathOrUrl) return;

  // Extract relative path inside bucket
  let relativePath = pathOrUrl;
  if (pathOrUrl.includes(`${BUCKET_NAME}/`)) {
    relativePath = pathOrUrl.split(`${BUCKET_NAME}/`)[1].split('?')[0];
  } else if (pathOrUrl.includes('?')) {
    relativePath = pathOrUrl.split('?')[0];
  }

  if (
    relativePath.startsWith('http://') ||
    relativePath.startsWith('https://') ||
    relativePath.startsWith('data:') ||
    relativePath.startsWith('blob:') ||
    relativePath.startsWith('local/')
  ) {
    // Local / data URL, nothing to delete from storage bucket
    return;
  }

  try {
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([relativePath]);
  } catch {
    // Quietly ignore remote removal failure
  }
}

