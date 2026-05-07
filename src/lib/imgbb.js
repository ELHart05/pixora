/**
 * Upload a base64 data-URL image to ImageBB and return the hosted URL.
 * Requires VITE_IMGBB_API_KEY env variable.
 *
 * @param {string} dataUrl  — e.g. "data:image/png;base64,iVBOR..."
 * @returns {Promise<string>} — public https URL of the uploaded image
 */
export async function uploadToImgBB(dataUrl) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('VITE_IMGBB_API_KEY is not set');

  // Strip the data URL prefix to get pure base64
  const base64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');

  const body = new FormData();
  body.append('key', apiKey);
  body.append('image', base64);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImageBB upload failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error('ImageBB upload unsuccessful');

  return json.data.url; // permanent https URL
}
