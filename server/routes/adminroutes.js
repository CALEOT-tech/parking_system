const express = require('express');
const AdminController = require('../controllers/admincontroller');
const { authenticateAdmin } = require('../middleware/auth');
const router = express.Router();

// Admin login
router.post('/login', authenticateAdmin, AdminController.login);

// Get dashboard data
router.get('/dashboard', AdminController.getDashboardData);

// Process vehicle entry
router.post('/entry', AdminController.processEntry);

// Process vehicle exit
router.post('/exit', AdminController.processExit);

// Get all reservations
router.get('/reservations', AdminController.getAllReservations);

// Get all logs
router.get('/logs', AdminController.getAllLogs);

// Delete reservation (using DELETE method)
router.delete('/reservation/:ticket_id', AdminController.deleteReservation);

// Mark reservation as expired
router.post('/reservation/expire', AdminController.markReservationExpired);

// Get reservation statistics
router.get('/stats', AdminController.getReservationStats);

module.exports = router;