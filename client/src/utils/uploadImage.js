const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_SIZE = 10 * 1024 * 1024;

// Unsigned upload straight to Cloudinary; resolves to the hosted image URL.
export default async function uploadImage(file) {
  if (!cloudName || !uploadPreset) {
    throw new Error("Image upload is not configured");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`${file.name} is larger than 10 MB`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Image upload failed");
  }
  return data.secure_url;
}
