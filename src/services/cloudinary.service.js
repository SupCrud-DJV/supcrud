import cloudinary from "../config/cloudinary.config.js";

export async function uploadFile(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(fileBuffer);
  });
}

export async function deleteFile(publicId) {
  return cloudinary.uploader.destroy(publicId);
}
