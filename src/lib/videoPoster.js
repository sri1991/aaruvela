/**
 * Grab a poster frame and duration from a video file, entirely in the browser.
 *
 * The poster lets the videos grid render thumbnails without the browser
 * downloading any video bytes — the single biggest bandwidth saving available
 * on a page that lists many clips.
 *
 * Some browsers (notably older iOS Safari) refuse to decode frames without a
 * user gesture; failure is expected and non-fatal, so this always resolves.
 *
 * @returns {Promise<{blob: Blob|null, durationSecs: number|null}>}
 */
export async function captureVideoPoster(file, { seekTo = 1, maxWidth = 640, quality = 0.7 } = {}) {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const waitFor = (event, timeoutMs) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
        video.addEventListener(event, () => { clearTimeout(timer); resolve(); }, { once: true });
        video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Video decode failed')); }, { once: true });
    });

    try {
        video.src = objectUrl;
        await waitFor('loadedmetadata', 10000);

        const durationSecs = Number.isFinite(video.duration) ? Math.round(video.duration) : null;

        video.currentTime = Math.min(seekTo, Math.max(0, (video.duration || 0) - 0.1));
        await waitFor('seeked', 10000);

        const scale = Math.min(1, maxWidth / (video.videoWidth || maxWidth));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round((video.videoWidth || maxWidth) * scale);
        canvas.height = Math.round((video.videoHeight || maxWidth * 0.5625) * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        return { blob, durationSecs };
    } catch {
        return { blob: null, durationSecs: null };
    } finally {
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(objectUrl);
    }
}
