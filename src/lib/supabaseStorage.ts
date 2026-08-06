import { supabase } from '../supabaseClient';

export const BUCKET_NAME = 'app-files';

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
    console.warn('Error fetching auth user ID:', e);
  }
  return 'default-user';
}

/**
 * Uploads a file to Supabase Storage in bucket 'app-files'
 * Path structure: ${userId}/${featureName}/${itemId}/${uuid}.${ext}
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  featureName: string = 'products',
  itemId: string = 'new-item'
): Promise<{ path: string; signedUrl: string }> {
  const userId = await getCurrentUserId();
  const fileExt = file.name.split('.').pop() || 'png';
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}`;
  const filePath = `${userId}/${featureName}/${itemId}/${uniqueId}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading file to Supabase Storage:', error);
    throw error;
  }

  // Generate signed URL (expires in 1 year: 31536000 seconds)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(data.path, 31536000);

  if (signedError) {
    console.warn('Could not generate signed URL:', signedError.message);
  }

  return {
    path: data.path,
    signedUrl: signedData?.signedUrl || ''
  };
}

/**
 * Generate a signed URL for a private storage file path
 */
export async function getSignedUrlForPath(pathOrUrl: string, expiresInSeconds: number = 31536000): Promise<string> {
  if (!pathOrUrl) return '';
  // If it's an external URL (http/data:) that is NOT a Supabase relative path
  if ((pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) && !pathOrUrl.includes(`/storage/v1/object/`)) {
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
  } catch (err) {
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

  if (relativePath.startsWith('http://') || relativePath.startsWith('https://') || relativePath.startsWith('data:')) {
    // External image URL, nothing to delete from storage bucket
    return;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([relativePath]);

    if (error) {
      console.warn('Error deleting file from Supabase Storage:', error.message);
    }
  } catch (err) {
    console.error('Failed to remove file from Supabase Storage:', err);
  }
}
