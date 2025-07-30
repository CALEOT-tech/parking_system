// Update server/controllers/adminController.js
const FileHandler = require('../utils/filehandler');
const { authenticateAdmin } = require('../middleware/auth');
const Validation = require('../utils/validation');

class AdminController {
    static async login(req, res) {
        try {
            // Validate input
            const validation = Validation.validateAdminLogin(req.body);
            if (!validation.isValid) {
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validation.errors 
                });
            }

            // This will be handled by middleware, but we'll return success here
            res.json({
                success: true,
                message: 'Login successful',
                admin: {
                    admin_id: req.admin.admin_id,
                    username: req.admin.username,
                    role: req.admin.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    static async login(req, res) {
        try {
            // This will be handled by middleware, but we'll return success here
            res.json({
                success: true,
                message: 'Login successful',
                admin: {
                    admin_id: req.admin.admin_id,
                    username: req.admin.username,
                    role: req.admin.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    static async getDashboardData(req, res) {
        try {
            const parkingData = await FileHandler.readFile('parking_spaces.json');
            const reservationData = await FileHandler.readFile('reservations.json');

            const totalSpaces = parkingData.spaces.length;
            const occupiedSpaces = parkingData.spaces.filter(space => space.status === 'Occupied').length;
            const availableSpaces = totalSpaces - occupiedSpaces;

            // Filter reservations by status
            const activeReservations = reservationData.reservations.filter(r => 
                r.status === 'Reserved' || r.status === 'In Use'
            ).length;
            
            const completedReservations = reservationData.reservations.filter(r => 
                r.status === 'Completed'
            ).length;
            
            const expiredReservations = reservationData.reservations.filter(r => 
                r.status === 'Expired'
            ).length;

            res.json({
                parkingStats: {
                    totalSpaces,
                    occupiedSpaces,
                    availableSpaces
                },
                reservationStats: {
                    activeReservations,
                    completedReservations,
                    expiredReservations,
                    totalReservations: reservationData.reservations.length
                }
            });
        } catch (error) {
            console.error('Error getting dashboard ', error);
            res.status(500).json({ error: 'Failed to get dashboard data' });
        }
    }

    static async processEntry(req, res) {
        try {
            const { ticket_id, verified_by } = req.body;

            if (!ticket_id || !verified_by) {
                return res.status(400).json({ error: 'Ticket ID and verifier required' });
            }

            const reservationData = await FileHandler.readFile('reservations.json');
            const reservation = reservationData.reservations.find(r => r.ticket_id === ticket_id);

            if (!reservation) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            if (reservation.status !== 'Reserved') {
                return res.status(400).json({ error: 'Invalid ticket status for entry' });
            }

            // Check if ticket is expired
            const now = new Date();
            const expiryTime = new Date(reservation.expiry_time);
            if (now > expiryTime) {
                return res.status(400).json({ error: 'Ticket has expired' });
            }

            // Update reservation status
            reservation.status = 'In Use';
            reservation.entry_time = new Date().toISOString();

            // Save updated reservation
            await FileHandler.writeFile('reservations.json', reservationData);

            // Log activity
            const logData = await FileHandler.readFile('activity_log.json');
            const logEntry = {
                log_id: `L${Date.now()}`,
                ticket_id: ticket_id,
                action: 'Entry',
                timestamp: new Date().toISOString(),
                admin_id: verified_by,
                notes: 'Vehicle entry verified'
            };
            logData.logs.push(logEntry);
            await FileHandler.writeFile('activity_log.json', logData);

            res.json({
                success: true,
                message: 'Entry processed successfully',
                reservation: reservation
            });

        } catch (error) {
            console.error('Error processing entry:', error);
            res.status(500).json({ error: 'Failed to process entry' });
        }
    }

    static async processExit(req, res) {
        try {
            const { ticket_id, verified_by } = req.body;

            if (!ticket_id || !verified_by) {
                return res.status(400).json({ error: 'Ticket ID and verifier required' });
            }

            const reservationData = await FileHandler.readFile('reservations.json');
            const reservation = reservationData.reservations.find(r => r.ticket_id === ticket_id);

            if (!reservation) {
                return res.status(404).json({ error: 'Ticket not found' });
            }

            if (reservation.status !== 'In Use') {
                return res.status(400).json({ error: 'Invalid ticket status for exit' });
            }

            // Update reservation status
            reservation.status = 'Completed';
            reservation.exit_time = new Date().toISOString();

            // Update parking space status
            const parkingData = await FileHandler.readFile('parking_spaces.json');
            const space = parkingData.spaces.find(s => s.space_number === reservation.space_assigned);
            if (space) {
                space.status = 'Available';
                space.last_updated = new Date().toISOString();
            }

            // Save updated data
            await FileHandler.writeFile('reservations.json', reservationData);
            await FileHandler.writeFile('parking_spaces.json', parkingData);

            // Log activity
            const logData = await FileHandler.readFile('activity_log.json');
            const logEntry = {
                log_id: `L${Date.now()}`,
                ticket_id: ticket_id,
                action: 'Exit',
                timestamp: new Date().toISOString(),
                admin_id: verified_by,
                notes: 'Vehicle exit verified'
            };
            logData.logs.push(logEntry);
            await FileHandler.writeFile('activity_log.json', logData);

            res.json({
                success: true,
                message: 'Exit processed successfully',
                reservation: reservation
            });

        } catch (error) {
            console.error('Error processing exit:', error);
            res.status(500).json({ error: 'Failed to process exit' });
        }
    }

    static async getAllReservations(req, res) {
        try {
            const reservationData = await FileHandler.readFile('reservations.json');
            
            // Add status filtering
            let filteredReservations = reservationData.reservations;
            
            if (req.query.status) {
                filteredReservations = filteredReservations.filter(r => r.status === req.query.status);
            }
            
            // Sort by most recent first
            filteredReservations.sort((a, b) => new Date(b.entry_time || b.reservation_id) - new Date(a.entry_time || a.reservation_id));
            
            res.json({
                success: true,
                reservations: filteredReservations
            });
        } catch (error) {
            console.error('Error getting reservations:', error);
            res.status(500).json({ error: 'Failed to get reservations' });
        }
    }

    static async getAllLogs(req, res) {
        try {
            const logData = await FileHandler.readFile('activity_log.json');
            
            // Sort by most recent first
            logData.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            res.json({
                success: true,
                logs: logData.logs
            });
        } catch (error) {
            console.error('Error getting logs:', error);
            res.status(500).json({ error: 'Failed to get logs' });
        }
    }

    // NEW: Delete/Clear reservation
   // server/controllers/adminController.js
static async deleteReservation(req, res) {
    try {
        const { ticket_id } = req.params;
        const { reason, verified_by } = req.body;

        if (!ticket_id || !reason || !verified_by) {
            return res.status(400).json({ error: 'Ticket ID, reason, and verifier required' });
        }

        // Process deletion logic here
        const parkingData = await FileHandler.readFile('parking_spaces.json');
        const reservationData = await FileHandler.readFile('reservations.json');

        // Find and remove the reservation
        const reservationIndex = reservationData.reservations.findIndex(r => r.ticket_id === ticket_id);
        if (reservationIndex === -1) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        const reservation = reservationData.reservations[reservationIndex];

        // Free up parking space
        const space = parkingData.spaces.find(s => s.space_number === reservation.space_assigned);
        if (space) {
            space.status = 'Available';
            space.last_updated = new Date().toISOString();
        }

        // Remove reservation
        reservationData.reservations.splice(reservationIndex, 1);

        // Save updated data
        await FileHandler.writeFile('reservations.json', reservationData);
        await FileHandler.writeFile('parking_spaces.json', parkingData);

        // Log the action
        const logData = await FileHandler.readFile('activity_log.json');
        const logEntry = {
            log_id: `L${Date.now()}`,
            ticket_id: ticket_id,
            action: 'Reservation Deleted',
            timestamp: new Date().toISOString(),
            admin_id: verified_by,
            notes: `Reason: ${reason}`
        };
        logData.logs.push(logEntry);
        await FileHandler.writeFile('activity_log.json', logData);

        res.json({
            success: true,
            message: 'Reservation deleted successfully and parking space freed'
        });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ error: 'Failed to delete reservation' });
    }
}

    // NEW: Mark reservation as expired (no-show)
    static async markReservationExpired(req, res) {
        try {
            const { ticket_id, reason, verified_by } = req.body;

            if (!ticket_id || !reason || !verified_by) {
                return res.status(400).json({ error: 'Ticket ID, reason, and verifier required' });
            }

            const reservationData = await FileHandler.readFile('reservations.json');
            const reservation = reservationData.reservations.find(r => r.ticket_id === ticket_id);

            if (!reservation) {
                return res.status(404).json({ error: 'Reservation not found' });
            }

            if (reservation.status !== 'Reserved') {
                return res.status(400).json({ error: 'Cannot mark active or completed reservations as expired' });
            }

            // Check if reservation is actually expired
            const now = new Date();
            const expiryTime = new Date(reservation.expiry_time);
            
            // Mark as expired regardless of time for admin override
            reservation.status = 'Expired';
            reservation.expiry_time = new Date().toISOString(); // Update expiry time to now

            // Free up the parking space
            const parkingData = await FileHandler.readFile('parking_spaces.json');
            const space = parkingData.spaces.find(s => s.space_number === reservation.space_assigned);
            if (space) {
                space.status = 'Available';
                space.last_updated = new Date().toISOString();
                await FileHandler.writeFile('parking_spaces.json', parkingData);
            }

            // Save updated reservation
            await FileHandler.writeFile('reservations.json', reservationData);

            // Log the action
            const logData = await FileHandler.readFile('activity_log.json');
            const logEntry = {
                log_id: `L${Date.now()}`,
                ticket_id: ticket_id,
                action: 'Reservation Expired',
                timestamp: new Date().toISOString(),
                admin_id: verified_by,
                notes: `Reservation marked as expired. Reason: ${reason}`
            };
            logData.logs.push(logEntry);
            await FileHandler.writeFile('activity_log.json', logData);

            res.json({
                success: true,
                message: 'Reservation marked as expired and parking space freed'
            });

        } catch (error) {
            console.error('Error marking reservation as expired:', error);
            res.status(500).json({ error: 'Failed to mark reservation as expired' });
        }
    }

    // NEW: Get reservation statistics
    static async getReservationStats(req, res) {
        try {
            const reservationData = await FileHandler.readFile('reservations.json');
            const now = new Date();
            
            // Count reservations by status
            const stats = {
                Reserved: 0,
                'In Use': 0,
                Completed: 0,
                Expired: 0
            };

            reservationData.reservations.forEach(reservation => {
                stats[reservation.status] = (stats[reservation.status] || 0) + 1;
            });

            // Count overdue reservations (Reserved but past expiry time)
            const overdueCount = reservationData.reservations.filter(r => {
                if (r.status === 'Reserved') {
                    const expiryTime = new Date(r.expiry_time);
                    return now > expiryTime;
                }
                return false;
            }).length;

            res.json({
                success: true,
                stats: stats,
                overdueCount: overdueCount
            });

        } catch (error) {
            console.error('Error getting reservation stats:', error);
            res.status(500).json({ error: 'Failed to get reservation statistics' });
        }
    }
}

module.exports = AdminController;