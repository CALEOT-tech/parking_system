// Update server/controllers/userController.js
const FileHandler = require('../utils/filehandler');
const TicketGenerator = require('../utils/ticketgenerator');
const Validation = require('../utils/validation');

class UserController {
    static async getAvailableSpaces(req, res) {
        try {
            const parkingData = await FileHandler.readFile('parking_spaces.json');
            const availableSpaces = parkingData.spaces.filter(space => space.status === 'Available');
            
            res.json({
                totalSpaces: parkingData.spaces.length,
                availableSpaces: availableSpaces.length,
                spaces: availableSpaces
            });
        } catch (error) {
            console.error('Error getting available spaces:', error);
            res.status(500).json({ error: 'Failed to get parking information' });
        }
    }

    static async createReservation(req, res) {
        try {
            const { driver_id, vehicle_plate, vehicle_type, duration } = req.body;

            // Validate input
            if (!driver_id || !vehicle_plate || !vehicle_type || !duration) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // Check available spaces
            const parkingData = await FileHandler.readFile('parking_spaces.json');
            const availableSpace = parkingData.spaces.find(space => space.status === 'Available');

            if (!availableSpace) {
                return res.status(400).json({ error: 'No parking spaces available' });
            }

            // Handle ID card upload
            let idCardFileName = null;
            if (req.file) {
                try {
                    // Create uploads directory if it doesn't exist
                    const uploadDir = path.join(__dirname, '..', 'uploads', 'id_cards');
                    await fs.mkdir(uploadDir, { recursive: true });
                    
                    // Generate unique filename
                    const ext = path.extname(req.file.originalname);
                    idCardFileName = `${driver_id}-${Date.now()}${ext}`;
                    const uploadPath = path.join(uploadDir, idCardFileName);
                    
                    // Save the file
                    await fs.writeFile(uploadPath, req.file.buffer);
                } catch (uploadError) {
                    console.error('Error saving uploaded file:', uploadError);
                    // Continue with reservation even if file upload fails
                }
            }

            // Generate ticket
            const ticketId = TicketGenerator.generateTicketId();
            const expiryTime = TicketGenerator.calculateExpiryTime(duration);

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
                expiry_time: expiryTime,
                status: 'Reserved',
                id_card_image: idCardFileName ? `/uploads/id_cards/${idCardFileName}` : null
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
            const qrCode = await TicketGenerator.generateQRCode(ticketId);

            res.json({
                success: true,
                ticket: {
                    ...reservation,
                    qr_code: qrCode
                },
                message: 'Reservation created successfully'
            });

        } catch (error) {
            console.error('Error creating reservation:', error);
            res.status(500).json({ error: 'Failed to create reservation' });
        }
    }

    static async verifyTicket(req, res) {
        try {
            const { ticket_id } = req.body;

            // Validate input
            const validation = Validation.validateTicketVerification({ ticket_id });
            if (!validation.isValid) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validation.errors 
                });
            }

            const reservationData = await FileHandler.readFile('reservations.json');
            const reservation = reservationData.reservations.find(r => r.ticket_id === ticket_id);

            if (!reservation) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            res.json({
                success: true,
                reservation: reservation
            });

        } catch (error) {
            console.error('Error verifying ticket:', error);
            res.status(500).json({ error: 'Failed to verify ticket' });
        }
    }
}

module.exports = UserController;