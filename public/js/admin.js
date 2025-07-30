const API_BASE_URL = 'http://localhost:3000';
// Global variables
let currentAdmin = null;
let currentTicket = null;
let reservationsData = [];

// DOM Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');
const ticketInput = document.getElementById('ticket-input');
const verifyTicketBtn = document.getElementById('verify-ticket-btn');
const scanQrBtn = document.getElementById('scan-qr-btn');
const ticketDetails = document.getElementById('ticket-details');
const ticketInfoContent = document.getElementById('ticket-info-content');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is already logged in
    checkLoginStatus();
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Ticket verification
    if (verifyTicketBtn) {
        verifyTicketBtn.addEventListener('click', verifyTicket);
    }
    
    // QR Scan button (simulated)
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', simulateQrScan);
    }
    
    // Refresh buttons
    const refreshDashboardBtn = document.getElementById('refresh-dashboard');
    if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', loadDashboardData);
    }
    
    const refreshReservationsBtn = document.getElementById('refresh-reservations');
    if (refreshReservationsBtn) {
        refreshReservationsBtn.addEventListener('click', () => loadReservations());
    }
    
    // Reservation filter
    const reservationFilter = document.getElementById('reservation-filter');
    if (reservationFilter) {
        reservationFilter.addEventListener('change', function() {
            loadReservations(this.value);
        });
    }
});

// Check login status
function checkLoginStatus() {
    const adminData = localStorage.getItem('adminData');
    if (adminData) {
        currentAdmin = JSON.parse(adminData);
        showDashboard();
        loadDashboardData();
        loadReservations();
    }
}

// Handle admin login
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(loginForm);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentAdmin = result.admin;
            localStorage.setItem('adminData', JSON.stringify(result.admin));
            showDashboard();
            loadDashboardData();
            loadReservations();
        } else {
            showError('login-error', result.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', 'Network error. Please try again.');
    }
}

// Show dashboard
function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
}

// Hide dashboard and show login
function showLogin() {
    if (loginSection) loginSection.style.display = 'flex';
    if (dashboardSection) dashboardSection.style.display = 'none';
    if (loginForm) loginForm.reset();
    const loginError = document.getElementById('login-error');
    if (loginError) loginError.style.display = 'none';
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('adminData');
    currentAdmin = null;
    showLogin();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`);
        const data = await response.json();
        
        if (data.parkingStats) {
            document.getElementById('total-spaces-stat').textContent = data.parkingStats.totalSpaces;
            document.getElementById('available-spaces-stat').textContent = data.parkingStats.availableSpaces;
            document.getElementById('occupied-spaces-stat').textContent = data.parkingStats.occupiedSpaces;
            document.getElementById('active-reservations-stat').textContent = data.reservationStats.activeReservations;
        }
        
        loadActivityLog();
        loadReservationStats();
    } catch (error) {
        console.error('Error loading dashboard ', error);
    }
}

// Load reservation statistics
async function loadReservationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
        const data = await response.json();
        
        if (data.stats) {
            const statsContainer = document.getElementById('reservation-stats');
            if (statsContainer) {
                const statsHtml = `
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h4>Reserved</h4>
                            <div class="stat-value" style="color: #3498db;">${data.stats.Reserved || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>In Use</h4>
                            <div class="stat-value" style="color: #27ae60;">${data.stats['In Use'] || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>Completed</h4>
                            <div class="stat-value" style="color: #95a5a6;">${data.stats.Completed || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>Expired</h4>
                            <div class="stat-value" style="color: #e74c3c;">${data.stats.Expired || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h4>Overdue</h4>
                            <div class="stat-value" style="color: #f39c12;">${data.overdueCount || 0}</div>
                        </div>
                    </div>
                `;
                statsContainer.innerHTML = statsHtml;
            }
        }
    } catch (error) {
        console.error('Error loading reservation stats:', error);
    }
}

// Load activity log
async function loadActivityLog() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/logs`);
        const data = await response.json();
        
        if (data.logs) {
            const activityLog = document.getElementById('activity-log');
            if (activityLog) {
                if (data.logs.length === 0) {
                    activityLog.innerHTML = '<p>No activity yet.</p>';
                    return;
                }
                
                // Sort by timestamp (newest first)
                const sortedLogs = data.logs.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                ).slice(0, 10); // Show last 10 entries
                
                let logHtml = '';
                sortedLogs.forEach(log => {
                    logHtml += `
                        <div class="log-entry">
                            <p><strong>${log.action}</strong> - Ticket: ${log.ticket_id}</p>
                            <p class="timestamp">${new Date(log.timestamp).toLocaleString()}</p>
                            <p>By: ${log.admin_id}</p>
                        </div>
                    `;
                });
                
                activityLog.innerHTML = logHtml;
            }
        }
    } catch (error) {
        console.error('Error loading activity log:', error);
        const activityLog = document.getElementById('activity-log');
        if (activityLog) {
            activityLog.innerHTML = '<p>Error loading activity log.</p>';
        }
    }
}

// Load reservations list
async function loadReservations(status = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reservations?status=${status}`);
        const data = await response.json();
        
        if (data.reservations) {
            reservationsData = data.reservations;
            displayReservations(data.reservations);
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
    }
}

// Display reservations in table
function displayReservations(reservations) {
    const container = document.getElementById('reservations-list');
    if (!container) return;
    
    if (reservations.length === 0) {
        container.innerHTML = '<p>No reservations found.</p>';
        return;
    }
    
    let html = `
        <table class="reservations-table">
            <thead>
                <tr>
                    <th>Ticket ID</th>
                    <th>Driver ID</th>
                    <th>Vehicle</th>
                    <th>Space</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Expiry</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reservations.forEach(reservation => {
        const createdTime = reservation.entry_time ? new Date(reservation.entry_time).toLocaleString() : 'N/A';
        const expiryTime = reservation.expiry_time ? new Date(reservation.expiry_time).toLocaleString() : 'N/A';
        const statusClass = getStatusClass(reservation.status);
        
        html += `
            <tr>
                <td>${reservation.ticket_id}</td>
                <td>${reservation.driver_id}</td>
                <td>${reservation.vehicle_plate}</td>
                <td>${reservation.space_assigned}</td>
                <td><span class="status-badge ${statusClass}">${reservation.status}</span></td>
                <td>${createdTime}</td>
                <td>${expiryTime}</td>
                <td>
                    <button onclick="selectReservation('${reservation.ticket_id}')" class="btn-small">View</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Get status CSS class
function getStatusClass(status) {
    switch(status) {
        case 'Reserved': return 'status-reserved';
        case 'In Use': return 'status-in-use';
        case 'Completed': return 'status-completed';
        case 'Expired': return 'status-expired';
        default: return '';
    }
}

// Select reservation for detailed view
function selectReservation(ticketId) {
    const reservation = reservationsData.find(r => r.ticket_id === ticketId);
    if (reservation) {
        currentTicket = reservation;
        displayTicketInfo(reservation);
    }
}

// Verify ticket
async function verifyTicket() {
    const ticketId = ticketInput.value.trim();
    
    if (!ticketId) {
        alert('Please enter a ticket ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/user/verify-ticket`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ticket_id: ticketId })
        });
        
        const result = await response.json();
        
        if (result.success && result.reservation) {
            currentTicket = result.reservation;
            displayTicketInfo(result.reservation);
        } else {
            alert(result.error || 'Ticket not found');
            if (ticketDetails) ticketDetails.style.display = 'none';
        }
    } catch (error) {
        console.error('Error verifying ticket:', error);
        alert('Error verifying ticket. Please try again.');
    }
}

// Display ticket information (MERGED - shows ticket details with ID card image and action buttons)
function displayTicketInfo(reservation) {
    if (!ticketDetails || !ticketInfoContent) return;

    ticketDetails.style.display = 'block';

    const entryTime = reservation.entry_time ? new Date(reservation.entry_time).toLocaleString() : 'Not yet entered';
    const expiryTime = reservation.expiry_time ? new Date(reservation.expiry_time).toLocaleString() : 'N/A';
    const exitTime = reservation.exit_time ? new Date(reservation.exit_time).toLocaleString() : 'Not exited';

    const statusClass = getStatusClass(reservation.status);

    const ticketHtml = `
        <div class="ticket-info">
            <div class="ticket-header">
                <h3>Ticket Details</h3>
                <span class="status-badge ${statusClass}">${reservation.status}</span>
            </div>
            <div class="ticket-details-grid">
                <div class="detail-item">
                    <strong>Ticket ID:</strong>
                    <span>${reservation.ticket_id}</span>
                </div>
                <div class="detail-item">
                    <strong>Driver ID:</strong>
                    <span>${reservation.driver_id}</span>
                </div>
                <div class="detail-item">
                    <strong>Vehicle Plate:</strong>
                    <span>${reservation.vehicle_plate}</span>
                </div>
                <div class="detail-item">
                    <strong>Assigned Space:</strong>
                    <span>${reservation.space_assigned}</span>
                </div>
                <div class="detail-item">
                    <strong>Vehicle Type:</strong>
                    <span>${reservation.vehicle_type}</span>
                </div>
                <div class="detail-item">
                    <strong>Entry Time:</strong>
                    <span>${entryTime}</span>
                </div>
                <div class="detail-item">
                    <strong>Expiry Time:</strong>
                    <span>${expiryTime}</span>
                </div>
                <div class="detail-item">
                    <strong>Exit Time:</strong>
                    <span>${exitTime}</span>
                </div>
            </div>
            
            <!-- Display ID card image if available -->
            ${reservation.id_card_image ? `
            <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-radius: 10px; border: 1px solid #ffeaa7;">
                <h4 style="color: #856404; margin-top: 0; margin-bottom: 15px;">ID Card/NIN Image</h4>
                <img src="${reservation.id_card_image}" alt="ID Card" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <p style="color: #856404; font-size: 12px; margin-top: 10px; text-align: center;">Uploaded ID card for verification</p>
            </div>
            ` : ''}
        </div>
    `;

    ticketInfoContent.innerHTML = ticketHtml;
    
    // Show appropriate action buttons
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        actionButtons.innerHTML = '';
        
        if (reservation.status === 'Reserved') {
            actionButtons.innerHTML = `
                <button id="process-entry-btn" class="btn-primary">Process Entry</button>
                <button id="delete-reservation-btn" class="btn-danger">Delete Reservation</button>
                <button id="expire-reservation-btn" class="btn-warning">Mark as Expired</button>
            `;
            // Reattach event listeners
            document.getElementById('process-entry-btn')?.addEventListener('click', processEntry);
            document.getElementById('delete-reservation-btn')?.addEventListener('click', showDeleteModal);
            document.getElementById('expire-reservation-btn')?.addEventListener('click', showExpireModal);
        } else if (reservation.status === 'In Use') {
            actionButtons.innerHTML = `
                <button id="process-exit-btn" class="btn-success">Process Exit</button>
            `;
            document.getElementById('process-exit-btn')?.addEventListener('click', processExit);
        } else {
            actionButtons.innerHTML = '<p>No actions available for this reservation status.</p>';
        }
    }
}

// Simulate QR scan (in real implementation, you'd use a QR scanner library)
function simulateQrScan() {
    const ticketId = prompt('Enter Ticket ID (simulating QR scan):');
    if (ticketId) {
        ticketInput.value = ticketId;
        verifyTicket();
    }
}

// Process vehicle entry
async function processEntry() {
    if (!currentTicket || !currentAdmin) return;
    
    if (!confirm('Process entry for this vehicle?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/entry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: currentTicket.ticket_id,
                verified_by: currentAdmin.admin_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Entry processed successfully!');
            if (ticketDetails) ticketDetails.style.display = 'none';
            ticketInput.value = '';
            currentTicket = null;
            loadDashboardData(); // Refresh dashboard
            loadReservations();
        } else {
            alert(result.error || 'Failed to process entry');
        }
    } catch (error) {
        console.error('Error processing entry:', error);
        alert('Error processing entry. Please try again.');
    }
}

// Process vehicle exit
async function processExit() {
    if (!currentTicket || !currentAdmin) return;
    
    if (!confirm('Process exit for this vehicle?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/exit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: currentTicket.ticket_id,
                verified_by: currentAdmin.admin_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Exit processed successfully!');
            if (ticketDetails) ticketDetails.style.display = 'none';
            ticketInput.value = '';
            currentTicket = null;
            loadDashboardData(); // Refresh dashboard
            loadReservations();
        } else {
            alert(result.error || 'Failed to process exit');
        }
    } catch (error) {
        console.error('Error processing exit:', error);
        alert('Error processing exit. Please try again.');
    }
}

// Show delete confirmation modal
function showDeleteModal() {
    if (!currentTicket) return;
    
    const deleteTicketId = document.getElementById('delete-ticket-id');
    const deleteReason = document.getElementById('delete-reason');
    
    if (deleteTicketId) deleteTicketId.textContent = currentTicket.ticket_id;
    if (deleteReason) deleteReason.value = '';
    
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) deleteModal.style.display = 'block';
}

// Show expire confirmation modal
function showExpireModal() {
    if (!currentTicket) return;
    
    const expireTicketId = document.getElementById('expire-ticket-id');
    const expireReason = document.getElementById('expire-reason');
    
    if (expireTicketId) expireTicketId.textContent = currentTicket.ticket_id;
    if (expireReason) expireReason.value = '';
    
    const expireModal = document.getElementById('expire-modal');
    if (expireModal) expireModal.style.display = 'block';
}

// Close all modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Delete reservation
async function deleteReservation() {
    if (!currentTicket || !currentAdmin) return;
    
    const deleteReason = document.getElementById('delete-reason');
    if (!deleteReason) return;
    
    const reason = deleteReason.value.trim();
    if (!reason) {
        alert('Please provide a reason for deletion');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reservation/${currentTicket.ticket_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason,
                verified_by: currentAdmin.admin_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Reservation deleted successfully!');
            if (ticketDetails) ticketDetails.style.display = 'none';
            currentTicket = null;
            loadDashboardData();
            loadReservations();
            closeModals();
        } else {
            alert(result.error || 'Failed to delete reservation');
        }
    } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Error deleting reservation. Please try again.');
    }
}

// Expire reservation
async function expireReservation() {
    if (!currentTicket || !currentAdmin) return;
    
    const expireReason = document.getElementById('expire-reason');
    if (!expireReason) return;
    
    const reason = expireReason.value.trim();
    if (!reason) {
        alert('Please provide a reason for marking as expired');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reservation/expire`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_id: currentTicket.ticket_id,
                reason: reason,
                verified_by: currentAdmin.admin_id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Reservation marked as expired successfully!');
            if (ticketDetails) ticketDetails.style.display = 'none';
            currentTicket = null;
            loadDashboardData();
            loadReservations();
            closeModals();
        } else {
            alert(result.error || 'Failed to mark reservation as expired');
        }
    } catch (error) {
        console.error('Error marking reservation as expired:', error);
        alert('Error marking reservation as expired. Please try again.');
    }
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Auto-refresh dashboard data every 30 seconds
setInterval(() => {
    if (currentAdmin) {
        loadDashboardData();
    }
}, 30000);

// Add event listeners for modal buttons
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for modal confirmation buttons
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteReservation);
    }
    
    const confirmExpireBtn = document.getElementById('confirm-expire-btn');
    if (confirmExpireBtn) {
        confirmExpireBtn.addEventListener('click', expireReservation);
    }
    
    // Add event listeners for closing modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});