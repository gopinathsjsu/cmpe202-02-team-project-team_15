// Cloudinary configuration with environment variables
export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dpzhwx3xh',
    uploadPreset:
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'campusxchange',
}
