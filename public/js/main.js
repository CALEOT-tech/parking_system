const API_BASE_URL = 'http://localhost:3000';


// Enhanced version with simplified ticket display
document.addEventListener('DOMContentLoaded', function() {
    loadParkingInfo();
    document.getElementById('reservation-form').addEventListener('submit', handleReservation);
    
    // Add real-time validation
    addRealTimeValidation();
});

// Load parking information
async function loadParkingInfo() {
    try {
        showLoading('available-spaces', true);
        showLoading('total-spaces', true);
        
        const response = await fetch(`${API_BASE_URL}/api/user/spaces`);
        const data = await response.json();
        
        if (data.totalSpaces !== undefined) {
            document.getElementById('total-spaces').textContent = data.totalSpaces;
            document.getElementById('available-spaces').textContent = data.availableSpaces;
            
            // Add color coding based on availability
            const availableElement = document.getElementById('available-spaces');
            if (data.availableSpaces === 0) {
                availableElement.style.color = '#e74c3c';
                availableElement.style.fontWeight = 'bold';
            } else if (data.availableSpaces <= 3) {
                availableElement.style.color = '#f39c12';
            } else {
                availableElement.style.color = '#27ae60';
            }
        }
    } catch (error) {
        console.error('Error loading parking info:', error);
        document.getElementById('available-spaces').textContent = 'Error';
        document.getElementById('total-spaces').textContent = 'Error';
    }
}

// public/js/main.js
async function handleReservation(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('reservation-form'));
    const reservationData = {
        driver_id: formData.get('driver_id').trim(),
        vehicle_plate: formData.get('vehicle_plate').trim(),
        vehicle_type: formData.get('vehicle_type'),
        duration: formData.get('duration')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/user/reserve`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            displayTicket(result.ticket);
        } else {
            showError(result.error || 'Failed to create reservation');
        }
    } catch (error) {
        console.error('Error creating reservation:', error);
        showError('Network error. Please try again.');
    }
}

// Display ticket (MERGED - shows ticket with QR code and ID card image)
function displayTicket(ticket) {
    console.log('displayTicket called', ticket);
    
    // Completely hide the reservation form
    document.querySelector('.reservation-form').style.display = 'none';
    
    // Hide the parking info section to make more room
    document.querySelector('.parking-info').style.display = 'none';
    
    // Show only the ticket in the main area
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="ticket-display">
            <h2 style="text-align: center; color: white; margin-bottom: 20px;">🎫 Your Parking Ticket</h2>
            <div class="ticket-content" style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 500px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${ticket.qr_code}" alt="QR Code" style="max-width: 200px; height: auto; border: 2px solid #eee; padding: 10px;">
                    <p style="margin-top: 10px; color: #666;">Show this QR code at parking entrance</p>
                </div>
                
                <div style="text-align: left; background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Reservation Details</h3>
                    <p><strong>🎫 Ticket ID:</strong> ${ticket.ticket_id}</p>
                    <p><strong>👤 Driver ID:</strong> ${ticket.driver_id}</p>
                    <p><strong>🚗 Vehicle Plate:</strong> ${ticket.vehicle_plate}</p>
                    <p><strong>🅿️ Parking Space:</strong> ${ticket.space_assigned}</p>
                    <p><strong>⏰ Entry Time:</strong> ${new Date(ticket.entry_time).toLocaleString()}</p>
                    <p><strong>⏱️ Expiry Time:</strong> ${new Date(ticket.expiry_time).toLocaleString()}</p>
                    <p><strong>📊 Status:</strong> <span style="color: #3498db; font-weight: bold;">${ticket.status}</span></p>
                </div>
                
                <!-- Display ID card image if available -->
                ${ticket.id_card_image ? `
                <div style="text-align: center; margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 10px; border: 1px solid #ffeaa7;">
                    <h4 style="color: #856404; margin-top: 0;">ID Card/NIN Image</h4>
                    <img src="${ticket.id_card_image}" alt="ID Card" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <p style="color: #856404; font-size: 12px; margin-top: 10px;">This image will be verified by security</p>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="printTicket()" style="background: #27ae60; color: white; padding: 12px 25px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">🖨️ Print Ticket</button>
                    <button onclick="makeNewReservation()" style="background: #3498db; color: white; padding: 12px 25px; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">🚗 New Reservation</button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #3498db;">
                    <h4 style="margin-top: 0; color: #2c3e50;">📋 Instructions:</h4>
                    <ul style="text-align: left; padding-left: 20px; color: #555;">
                        <li>Show this ticket at the parking entrance</li>
                        <li>Security will verify your identity and vehicle</li>
                        <li>Keep this ticket safe for exit</li>
                        <li>Parking expires at ${new Date(ticket.expiry_time).toLocaleTimeString()}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Print ticket function
function printTicket() {
    window.print();
}

// Make new reservation function
function makeNewReservation() {
    location.reload(); // Simple reload to reset everything
}

// Add real-time validation
function addRealTimeValidation() {
    const driverIdInput = document.getElementById('driver_id');
    const vehiclePlateInput = document.getElementById('vehicle_plate');
    
    if (driverIdInput) {
        driverIdInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && !isValidDriverId(value)) {
                this.style.borderColor = '#e74c3c';
                showFieldError('driver_id', 'Invalid format. Use DL + 9 digits or 11-digit NIN');
            } else {
                this.style.borderColor = '#27ae60';
                hideFieldError('driver_id');
            }
        });
    }
    
    if (vehiclePlateInput) {
        vehiclePlateInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && !isValidVehiclePlate(value)) {
                this.style.borderColor = '#e74c3c';
                showFieldError('vehicle_plate', 'Invalid plate format');
            } else {
                this.style.borderColor = '#27ae60';
                hideFieldError('vehicle_plate');
            }
        });
    }
}

// Validation helpers
function isValidDriverId(driverId) {
    const dlPattern = /^DL\d{9}$/i;
    const ninPattern = /^\d{11}$/;
    return dlPattern.test(driverId) || ninPattern.test(driverId);
}

function isValidVehiclePlate(plate) {
    const platePattern = /^[A-Z0-9]{2,3}[-]?[A-Z0-9]{2,4}$/i;
    return platePattern.test(plate);
}

// UI Helper functions
function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (show) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #fadbd8;
        color: #e74c3c;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
        border-left: 4px solid #e74c3c;
        animation: slideIn 0.3s ease;
    `;
    
    const form = document.getElementById('reservation-form');
    form.parentNode.insertBefore(errorDiv, form);
    
    // Remove error after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showFieldError(fieldId, message) {
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'field-error';
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 12px;
            margin-top: 5px;
        `;
        const field = document.getElementById(fieldId);
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function hideFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .loading {
        color: #3498db;
        font-style: italic;
    }
`;
document.head.appendChild(style);