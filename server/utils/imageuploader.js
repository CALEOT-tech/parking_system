// server/utils/imageUploader.js
const fs = require('fs');
const path = require('path');

class ImageUploader {
    static async uploadImage(file, userId) {
        try {
            // Validate file type (e.g., only accept images)
            const allowedTypes = ['image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Invalid file type. Only JPEG and PNG are allowed.');
            }

            // Generate unique filename
            const ext = path.extname(file.originalname);
            const fileName = `${userId}-${Date.now()}${ext}`;
            const uploadPath = path.join(process.env.UPLOADS_DIR || './uploads/id_cards', fileName);

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