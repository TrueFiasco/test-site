// ==========================================
// ADMIN PANEL LOGIC - TRUE FIASCO
// Manages bookings and availability
// ==========================================

let currentUser = null;
let allBookings = [];
let allBlockedDates = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeAdmin();
});

async function initializeAdmin() {
    console.log('🚀 Initializing admin panel...');
    
    // Check if user is already logged in
    if (firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                showAdminPanel();
            } else {
                showLoginSection();
            }
        });
    } else {
        console.error('❌ Firebase Auth not initialized');
        showLoginSection();
    }
    
    // Setup login form
    setupLoginForm();
    
    // Setup block date form
    setupBlockDateForm();
}

// ==========================================
// AUTHENTICATION
// ==========================================
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            console.log('✅ Login successful');
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });
}

function logout() {
    firebase.auth().signOut();
    console.log('👋 Logged out');
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminPanel').classList.remove('active');
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').classList.add('active');
    
    // Load data
    loadBookings();
    loadBlockedDates();
}

// ==========================================
// LOAD BOOKINGS
// ==========================================
async function loadBookings() {
    if (!window.db) {
        console.error('❌ Firebase not initialized');
        return;
    }
    
    try {
        const snapshot = await db.collection('bookings')
            .orderBy('dateTime', 'desc')
            .get();
        
        allBookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('✅ Loaded bookings:', allBookings.length);
        
        // Update stats
        updateStats();
        
        // Render table
        renderBookingsTable();
        
    } catch (error) {
        console.error('❌ Failed to load bookings:', error);
        document.getElementById('bookingsLoading').textContent = 'Failed to load bookings';
    }
}

function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    const table = document.getElementById('bookingsTable');
    const loading = document.getElementById('bookingsLoading');
    
    tbody.innerHTML = '';
    
    if (allBookings.length === 0) {
        loading.textContent = 'No bookings yet';
        return;
    }
    
    allBookings.forEach(booking => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(booking.dateTime);
        const dateStr = date.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Format time
        const timeStr = `${booking.time.toString().padStart(2, '0')}:00 - ${(booking.time + 1).toString().padStart(2, '0')}:00`;
        
        // Service type
        const serviceStr = booking.service === 'discovery' ? 'Discovery Call' : 'TouchDesigner Lesson';
        
        // Status badge
        const statusClass = booking.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
        const statusBadge = `<span class="status-badge ${statusClass}">${booking.status}</span>`;
        
        // Action button (only if confirmed)
        const actionBtn = booking.status === 'confirmed' 
            ? `<button class="action-btn" onclick="cancelBooking('${booking.id}')">Cancel</button>`
            : '-';
        
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${serviceStr}</td>
            <td>${booking.name}</td>
            <td>${booking.email}</td>
            <td>${booking.phone || '-'}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    loading.style.display = 'none';
    table.style.display = 'table';
}

function updateStats() {
    const total = allBookings.length;
    const now = new Date();
    const upcoming = allBookings.filter(b => 
        new Date(b.dateTime) >= now && b.status === 'confirmed'
    ).length;
    
    document.getElementById('totalBookings').textContent = total;
    document.getElementById('upcomingBookings').textContent = upcoming;
    document.getElementById('totalBlocked').textContent = allBlockedDates.length;
}

// ==========================================
// CANCEL BOOKING
// ==========================================
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        await db.collection('bookings').doc(bookingId).update({
            status: 'cancelled'
        });
        
        console.log('✅ Booking cancelled:', bookingId);
        
        // Reload bookings
        await loadBookings();
        
    } catch (error) {
        console.error('❌ Failed to cancel booking:', error);
        alert('Failed to cancel booking. Please try again.');
    }
}

// ==========================================
// BLOCKED DATES
// ==========================================
async function loadBlockedDates() {
    if (!window.db) {
        console.error('❌ Firebase not initialized');
        return;
    }
    
    try {
        const snapshot = await db.collection('blockedDates')
            .orderBy('date', 'asc')
            .get();
        
        allBlockedDates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log('✅ Loaded blocked dates:', allBlockedDates.length);
        
        // Update stats
        updateStats();
        
        // Render list
        renderBlockedDatesList();
        
    } catch (error) {
        console.error('❌ Failed to load blocked dates:', error);
        document.getElementById('blockedLoading').textContent = 'Failed to load blocked dates';
    }
}

function renderBlockedDatesList() {
    const container = document.getElementById('blockedDatesList');
    const loading = document.getElementById('blockedLoading');
    
    container.innerHTML = '';
    
    if (allBlockedDates.length === 0) {
        loading.textContent = 'No blocked dates';
        return;
    }
    
    allBlockedDates.forEach(blocked => {
        const item = document.createElement('div');
        item.className = 'blocked-date-item';
        
        const date = new Date(blocked.date + 'T00:00:00');
        const dateStr = date.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        item.innerHTML = `
            <div>
                <div style="font-size: 1.1rem; margin-bottom: 0.3rem;">${dateStr}</div>
                <div style="opacity: 0.7; font-size: 0.9rem;">${blocked.reason || 'No reason specified'}</div>
            </div>
            <button class="action-btn" onclick="unblockDate('${blocked.id}')">Unblock</button>
        `;
        
        container.appendChild(item);
    });
    
    loading.style.display = 'none';
}

function setupBlockDateForm() {
    const form = document.getElementById('blockDateForm');
    const message = document.getElementById('blockDateMessage');
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('blockDate').setAttribute('min', today);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const date = document.getElementById('blockDate').value;
        const reason = document.getElementById('blockReason').value || null;
        
        try {
            // Check if date is already blocked
            const existing = allBlockedDates.find(b => b.date === date);
            if (existing) {
                throw new Error('This date is already blocked');
            }
            
            // Add to Firestore
            await db.collection('blockedDates').add({
                date: date,
                reason: reason,
                createdAt: new Date().toISOString()
            });
            
            console.log('✅ Date blocked:', date);
            
            // Show success message
            message.className = 'message success';
            message.textContent = `✅ Successfully blocked ${date}`;
            message.style.display = 'block';
            
            // Clear form
            form.reset();
            
            // Reload blocked dates
            await loadBlockedDates();
            
            // Hide message after 3 seconds
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);
            
        } catch (error) {
            console.error('❌ Failed to block date:', error);
            
            message.className = 'message error';
            message.textContent = `❌ ${error.message}`;
            message.style.display = 'block';
        }
    });
}

async function unblockDate(dateId) {
    if (!confirm('Are you sure you want to unblock this date?')) {
        return;
    }
    
    try {
        await db.collection('blockedDates').doc(dateId).delete();
        
        console.log('✅ Date unblocked:', dateId);
        
        // Reload blocked dates
        await loadBlockedDates();
        
    } catch (error) {
        console.error('❌ Failed to unblock date:', error);
        alert('Failed to unblock date. Please try again.');
    }
}

// ==========================================
// TAB SWITCHING
// ==========================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'bookings') {
        document.getElementById('bookingsTab').classList.add('active');
    } else if (tabName === 'blocked') {
        document.getElementById('blockedTab').classList.add('active');
    }
}

// Make functions available globally
window.cancelBooking = cancelBooking;
window.unblockDate = unblockDate;
window.switchTab = switchTab;
window.logout = logout;

console.log('✅ Admin script loaded');
