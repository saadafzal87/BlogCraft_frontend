import api from '../lib/api-client';

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export const uploadService = {
  uploadImages: async (files: File[]): Promise<UploadedImage[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('image', file));

    const response = await api.post<{ success: boolean; images: UploadedImage[] }>(
      '/upload/image',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.images;
  },

  deleteImage: async (publicId: string): Promise<void> => {
    await api.delete('/upload/image', { data: { publicId } });
  },
};
