// server/utils/filehandler.js
const fs = require('fs'); // Use synchronous fs methods
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists (synchronous)
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class FileHandler {
    static readFile(filename) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(DATA_DIR, filename);
            try {
                // Create file if it doesn't exist
                if (!fs.existsSync(filePath)) {
                    let defaultData = {};
                    if (filename === 'parking_spaces.json') {
                        defaultData = { spaces: [] };
                    } else if (filename === 'reservations.json') {
                        defaultData = { reservations: [] };
                    } else if (filename === 'administrators.json') {
                        defaultData = { admins: [] };
                    } else if (filename === 'activity_log.json') {
                        defaultData = { logs: [] };
                    }
                    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
                }

                const data = fs.readFileSync(filePath, 'utf8');
                resolve(JSON.parse(data));
            } catch (error) {
                console.error(`Error reading file ${filename}:`, error);
                // Return appropriate default structure
                if (filename === 'parking_spaces.json') resolve({ spaces: [] });
                else if (filename === 'reservations.json') resolve({ reservations: [] });
                else if (filename === 'administrators.json') resolve({ admins: [] });
                else if (filename === 'activity_log.json') resolve({ logs: [] });
                else resolve({});
            }
        });
    }

    static writeFile(filename, data) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(DATA_DIR, filename);
            
            // Retry mechanism for synchronous writes
            const maxRetries = 3;
            let lastError;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                    console.log(`Successfully wrote to ${filename} on attempt ${attempt}`);
                    resolve(true);
                    return; // Exit early on success
                } catch (error) {
                    lastError = error;
                    console.error(`Synchronous write attempt ${attempt} failed for ${filename}:`, error.message);
                    if (attempt < maxRetries) {
                        // Brief pause before retry
                        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50); // ~50ms wait
                    }
                }
            }
            
            console.error(`All synchronous write attempts failed for ${filename}`);
            reject(lastError);
        });
    }

    static safeWriteFile(filename, data) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(DATA_DIR, filename);
            const tempFilePath = filePath + '.tmp';
            
            const maxRetries = 3;
            let lastError;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    // Write to temporary file first
                    fs.writeFileSync(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
                    
                    // Atomically move temp file to actual file
                    fs.renameSync(tempFilePath, filePath); // renameSync is usually fine
                    
                    console.log(`Successfully safe-wrote to ${filename} on attempt ${attempt}`);
                    resolve(true);
                    return; // Exit early on success
                } catch (error) {
                    lastError = error;
                    console.error(`Safe write attempt ${attempt} failed for ${filename}:`, error.message);
                    
                    // Clean up temp file if it exists
                    try {
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                        }
                    } catch (cleanupError) {
                        console.error('Cleanup error:', cleanupError.message);
                    }
                    
                    if (attempt < maxRetries) {
                        // Brief pause before retry
                        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50); // ~50ms wait
                    }
                }
            }
            
            console.error(`All safe write attempts failed for ${filename}`);
            reject(lastError);
        });
    }

    static async initializeParkingSpaces() {
        try {
            const parkingData = await this.readFile('parking_spaces.json');
            if (parkingData.spaces.length === 0) {
                // Initialize with 20 parking spaces
                const spaces = [];
                for (let i = 1; i <= 21; i++) {
                    spaces.push({
                        space_id: `S${i.toString().padStart(3, '0')}`,
                        space_number: `P${i}`,
                        status: 'Available',
                        vehicle_type: 'Car',
                        last_updated: new Date().toISOString()
                    });
                }
                const success = await this.safeWriteFile('parking_spaces.json', { spaces });
                if (success) {
                    console.log('Parking spaces initialized successfully');
                } else {
                    console.error('Failed to initialize parking spaces');
                }
            }
        } catch (error) {
            console.error('Error initializing parking spaces:', error);
        }
    }

    static async initializeAdmin() {
        try {
            const adminData = await this.readFile('administrators.json');
            if (adminData.admins.length === 0) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                const admins = [{
                    admin_id: 'A001',
                    username: 'admin',
                    password_hash: hashedPassword,
                    role: 'Administrator',
                    created_date: new Date().toISOString()
                }];
                const success = await this.safeWriteFile('administrators.json', { admins });
                if (success) {
                    console.log('Admin account initialized successfully');
                } else {
                    console.error('Failed to initialize admin account');
                }
            }
        } catch (error) {
            console.error('Error initializing admin:', error);
        }
    }
}

module.exports = FileHandler;