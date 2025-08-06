// server/utils/imageUploader.js
const fs = require('fs');
const path = require('path');
const FileHandler = require('./filehandler');

class ImageUploader {
    static async uploadImage(file, userId) {
        try {
            // Validate file type (e.g., only accept images)
            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Invalid file type. Only JPEG and PNG are allowed.');
            }

             // Generate unique filename
            //const ext = path.extname(file.originalname);
            //const fileName = `${userId}-${Date.now()}${ext}`;
            
          
            // Generate unique filename
            const ext = path.extname(file.originalname);
            const fileName = `${userId}-${Date.now()}${ext}`;
            const baseUploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
            const uploadPath = path.join(baseUploadsDir, 'id_cards', fileName); // Ensure 'id_cards' matches your folder

            // Create the directory if it doesn't exist
            await FileHandler.ensureUploadsDirectoryExists("id-cards");

            // Save the file in the id-cards subdirectory
           // const uploadPath = path.join(, fileName);

            // Save the file
            await new Promise((resolve, reject) => {
                fs.writeFile(uploadPath, file.buffer, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });

            return fileName;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    static getImageUrl(fileName) {
        return `/uploads/id_cards/${fileName}`;
    }
}

module.exports = ImageUploader;