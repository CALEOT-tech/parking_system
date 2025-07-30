const express = require('express');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./server/routes/userroutes');
const adminRoutes = require('./server/routes/adminroutes');
const FileHandler = require('./server/utils/filehandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'server', 'uploads')));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize data files
async function initializeSystem() {
    try {
        await FileHandler.initializeParkingSpaces();
        await FileHandler.initializeAdmin();
        console.log('System initialization completed');
    } catch (error) {
        console.error('Error during system initialization:', error);
    }
}

// Initialize on startup
initializeSystem();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});