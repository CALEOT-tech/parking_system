const express = require('express');
const UserController = require('../controllers/usercontroller');
const multer = require('multer');
const FileHandler = require('../utils/filehandler');
const ImageUploader = require('../utils/imageuploader');
const { isValidDriverId } = require('../utils/validation');

const router = express.Router();

// Middleware for parsing multipart/form-data
const upload = multer({ 
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Get available parking spaces
router.get('/spaces', UserController.getAvailableSpaces);

// Create new reservation with file upload
router.post('/reserve', upload.single('id_card'), async (req, res) => {
    try {
        const { driver_id, vehicle_plate, vehicle_type, duration } = req.body;

        // Validate input
        if (!driver_id || !vehicle_plate || !vehicle_type || !duration) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!isValidDriverId(driver_id)) {
            return res.status(400).json({ error: 'Invalid Driver ID format' });
        }

        // Upload ID card/NIN image
        let idCardFileName = null;
        if (req.file) {
            idCardFileName = await ImageUploader.uploadImage(req.file, driver_id);
        }

        // Check available spaces
        const parkingData = await FileHandler.readFile('parking_spaces.json');
        const availableSpace = parkingData.spaces.find(space => space.status === 'Available');

        if (!availableSpace) {
            return res.status(400).json({ error: 'No parking spaces available' });
        }

        // Generate ticket and expiry time
        const ticketId = `T${Date.now().toString().slice(-8)}`;
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + parseInt(duration));

        // Create reservation
        const reservation = {
            reservation_id: `R${Date.now()}`,
            ticket_id: ticketId,
            driver_id: driver_id,
            vehicle_plate: vehicle_plate.toUpperCase(),
            vehicle_type: vehicle_type,
            space_assigned: availableSpace.space_number,
            entry_time: new Date().toISOString(),
            exit_time: null,
            expiry_time: expiryTime.toISOString(),
            status: 'Reserved',
            id_card_image: idCardFileName ? ImageUploader.getImageUrl(idCardFileName) : null
        };

        // Update parking space status
        availableSpace.status = 'Occupied';
        availableSpace.last_updated = new Date().toISOString();

        // Save reservation
        const reservationData = await FileHandler.readFile('reservations.json');
        reservationData.reservations.push(reservation);
        await FileHandler.writeFile('reservations.json', reservationData);

        // Save updated parking space
        await FileHandler.writeFile('parking_spaces.json', parkingData);

        // Generate QR code
        const qrCode = await require('../utils/ticketgenerator').generateQRCode(ticketId);

        res.json({
            success: true,
            ticket: {
                ...reservation,
                qr_code: qrCode
            }
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// Verify ticket
router.post('/verify-ticket', UserController.verifyTicket);

module.exports = router;