class Validation {
    static isValidDriverId(driverId) {
        // Accept Driver's License (DL) or National ID (NIN) formats
        const dlPattern = /^DL\d{9}$/i; // DL followed by 9 digits
        const ninPattern = /^\d{11}$/;  // 11 digits for NIN
        return dlPattern.test(driverId) || ninPattern.test(driverId);
    }

    static isValidVehiclePlate(plate) {
        // Basic vehicle plate validation (alphanumeric with optional hyphens)
        const platePattern = /^[A-Z0-9]{2,3}[-]?[A-Z0-9]{2,4}$/i;
        return platePattern.test(plate);
    }

    static isValidDuration(duration) {
        const validDurations = ['1', '2', '4', '8'];
        return validDurations.includes(duration.toString());
    }

    static isValidVehicleType(type) {
        const validTypes = ['Car', 'Motorcycle', 'Truck', 'Van'];
        return validTypes.includes(type);
    }

    static validateReservationData(data) {
        const errors = [];

        if (!data.driver_id) {
            errors.push('Driver ID is required');
        } else if (!this.isValidDriverId(data.driver_id)) {
            errors.push('Invalid Driver ID format. Use DL followed by 9 digits or 11-digit NIN');
        }

        if (!data.vehicle_plate) {
            errors.push('Vehicle plate is required');
        } else if (!this.isValidVehiclePlate(data.vehicle_plate)) {
            errors.push('Invalid vehicle plate format');
        }

        if (!data.vehicle_type) {
            errors.push('Vehicle type is required');
        } else if (!this.isValidVehicleType(data.vehicle_type)) {
            errors.push('Invalid vehicle type');
        }

        if (!data.duration) {
            errors.push('Duration is required');
        } else if (!this.isValidDuration(data.duration)) {
            errors.push('Invalid duration. Choose 1, 2, 4, or 8 hours');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static validateAdminLogin(data) {
        const errors = [];

        if (!data.username) {
            errors.push('Username is required');
        }

        if (!data.password) {
            errors.push('Password is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static validateTicketVerification(data) {
        const errors = [];

        if (!data.ticket_id) {
            errors.push('Ticket ID is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = Validation;