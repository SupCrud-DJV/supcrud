const cloudinary = require("../config/cloudinary.config");

async function uploadFile(fileBuffer, folder) {
    const result = await cloudinary.uploader.upload_stream({
        folder
    });
    return result; // incluye url y publicId
}

async function deleteFile(publicId) {
    return await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadFile, deleteFile };