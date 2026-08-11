import api from './api';
import { supabase } from './supabase';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Upload a file to a Supabase signed upload URL minted by our backend.
 *
 * This mirrors what supabase-js `uploadToSignedUrl` does over the wire (PUT a
 * multipart body to /object/upload/sign/...), but goes through XHR so we can
 * report progress — `supabase.storage.upload()` gives no progress events, and a
 * silent one-minute upload on mobile data reads as a hang.
 *
 * Falls back to the SDK call if the XHR attempt fails outright.
 *
 * @param {{bucket: string, path: string, token: string, signed_url: string}} target
 * @param {File|Blob} file
 * @param {(percent: number) => void} [onProgress]
 */
export function uploadToSignedUrl(target, file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', target.signed_url, true);
        xhr.setRequestHeader('x-upsert', 'false');
        if (ANON_KEY) {
            xhr.setRequestHeader('apikey', ANON_KEY);
            xhr.setRequestHeader('Authorization', `Bearer ${ANON_KEY}`);
        }

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(target.path);
            else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(Object.assign(new Error('Upload cancelled'), { aborted: true }));

        // Field name is intentionally empty — that is what storage-js sends.
        const body = new FormData();
        body.append('cacheControl', '3600');
        body.append('', file);
        xhr.send(body);
    }).catch(async (xhrError) => {
        // Retrying re-sends the whole file, so don't do it when the user
        // cancelled on purpose — that would push a second 25 MB up the wire.
        if (xhrError?.aborted) throw xhrError;

        const { error } = await supabase.storage
            .from(target.bucket)
            .uploadToSignedUrl(target.path, target.token, file);
        if (error) throw new Error(error.message || xhrError?.message || 'Upload failed');
        return target.path;
    });
}

/**
 * Admin helper: mint a signed upload URL for one of the admin-writable buckets
 * ('chairman' | 'announcements' | 'ads') and upload the file to it.
 * Resolves to `{ url, path }` for storing on the record.
 */
export async function uploadAdminAsset(bucket, file, onProgress) {
    const { data: target } = await api.post('/site/upload-url', {
        bucket,
        file_name: file.name,
    });
    await uploadToSignedUrl(target, file, onProgress);
    return { url: target.public_url, path: target.path };
}
