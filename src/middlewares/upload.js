import multer from 'multer';

// Usaremos memoria para guardar el archivo temporalmente y luego subirlo a Cloudinary como stream
const storage = multer.memoryStorage();

// Límite de 5MB por archivo, por ejemplo
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export default upload;
