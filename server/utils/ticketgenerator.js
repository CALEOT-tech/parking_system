const QRCode = require('qrcode');

class TicketGenerator {
    static generateTicketId() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `T${timestamp.slice(-6)}${random}`;
    }

    static generateQRCode(data) {
        return new Promise((resolve, reject) => {
            QRCode.toDataURL(data, (err, url) => {
                if (err) reject(err);
                else resolve(url);
            });
        });
    }

    static calculateExpiryTime(durationHours) {
        const now = new Date();
        now.setHours(now.getHours() + parseInt(durationHours));
        return now.toISOString();
    }
}

module.exports = TicketGenerator;