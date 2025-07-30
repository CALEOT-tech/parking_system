const FileHandler = require('../utils/filehandler');
const bcrypt = require('bcryptjs');

const authenticateAdmin = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const adminData = await FileHandler.readFile('administrators.json');
        const admin = adminData.admins.find(a => a.username === username);

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = { authenticateAdmin };