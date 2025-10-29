import React, { useState, useRef } from 'react';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (images: Array<{ url: string; alt: string }>) => void;
  existingImages?: Array<{ url: string; alt: string }>;
}

interface UploadedImage {
  url: string;
  alt: string;
  key: string;
  preview?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  maxImages = 5,
  onImagesChange,
  existingImages = [],
}) => {
  const [images, setImages] = useState<UploadedImage[]>(
    existingImages.map(img => ({ ...img, key: '' }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.';
    }

    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit.';
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError('');

    // Check if adding these files would exceed max images
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Maximum ${maxImages} images allowed.`);
      return;
    }

    // Validate all files first
    const filesArray = Array.from(files);
    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);

    try {
      // Import API service
      const { apiService } = await import('../services/api');

      console.log('📤 Starting upload for', filesArray.length, 'files');

      // Upload files
      const uploadedData = await apiService.uploadMultipleImages(filesArray, 'listings');

      console.log('✅ Upload successful:', uploadedData);

      // Create new image objects
      const newImages: UploadedImage[] = uploadedData.map((data, index) => ({
        url: data.fileUrl,
        alt: filesArray[index].name,
        key: data.key,
        preview: URL.createObjectURL(filesArray[index]),
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);

      // Notify parent component
      onImagesChange(updatedImages.map(({ url, alt }) => ({ url, alt })));
    } catch (err: any) {
      console.error('❌ Upload error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Determine error message
      let errorMessage = 'Failed to upload images. Please try again.';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove image
  const handleRemoveImage = async (index: number) => {
    const imageToRemove = images[index];

    // Delete from S3 if it has a key
    if (imageToRemove.key) {
      try {
        const { apiService } = await import('../services/api');
        await apiService.deleteFileFromS3(imageToRemove.key);
      } catch (err) {
        console.error('Failed to delete image from S3:', err);
      }
    }

    // Remove from state
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);

    // Notify parent component
    onImagesChange(updatedImages.map(({ url, alt }) => ({ url, alt })));

    // Revoke preview URL
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
  };

  // Trigger file input
  const handleUploadClick = () => {
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-gray-400" size={48} />
            <p className="text-gray-600 font-medium">Uploading images...</p>
          </div>
        ) : (
          <>
            <ImagePlus className="mx-auto text-gray-400 mb-3" size={48} />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={images.length >= maxImages}
              className="flex items-center gap-2 mx-auto text-gray-700 font-medium hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              Upload Images
            </button>
            <p className="text-sm text-gray-500 mt-2">
              {images.length >= maxImages
                ? `Maximum ${maxImages} images reached`
                : `JPG, PNG, GIF, WebP up to 5MB (${images.length}/${maxImages} images)`}
            </p>
          </>
        )}
      </div>

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.preview || image.url}
                alt={image.alt}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove image"
              >
                <X size={16} />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;


