// ==========================================
// BOOKING SYSTEM - TRUE FIASCO
// Handles calendar, time slots, and Firebase bookings
// ==========================================

// State management
const bookingState = {
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    currentMonth: new Date(),
    blockedDates: [], // Admin-blocked dates
    bookings: [] // Existing bookings
};

// Configuration
const CONFIG = {
    timezone: 'Europe/London',
    availableHours: {
        start: 9, // 9 AM
        end: 19   // 7 PM
    },
    sessionDuration: 60, // minutes
    daysAvailable: [0, 1, 2, 3, 4, 5, 6], // All days (0=Sunday, 6=Saturday)
    maxAdvanceBooking: 90 // days
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeBookingSystem();
});

async function initializeBookingSystem() {
    console.log('🚀 Initializing booking system...');
    
    // Setup service selection
    setupServiceSelection();
    
    // Setup calendar navigation
    setupCalendarNavigation();
    
    // Setup time dropdown
    setupTimeDropdown();
    
    // Setup form submission
    setupFormSubmission();
    
    // Load blocked dates and bookings from Firebase
    await loadBookingData();
    
    console.log('✅ Booking system ready');
}

// ==========================================
// SERVICE SELECTION
// ==========================================
function setupServiceSelection() {
    const serviceButtons = document.querySelectorAll('.service-btn');
    
    serviceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected from all
            serviceButtons.forEach(b => b.classList.remove('selected'));
            
            // Hide all descriptions
            document.querySelectorAll('.service-description').forEach(desc => {
                desc.classList.remove('active');
            });
            
            // Select this button
            btn.classList.add('selected');
            bookingState.selectedService = btn.dataset.service;
            
            // Show description
            const desc = document.getElementById(`desc-${btn.dataset.service}`);
            if (desc) desc.classList.add('active');
            
            // Show step 2
            document.getElementById('step2').style.display = 'block';
            
            // Render calendar
            renderCalendar();
            
            console.log('✅ Service selected:', bookingState.selectedService);
        });
    });
}

// ==========================================
// CALENDAR NAVIGATION
// ==========================================
function setupCalendarNavigation() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        bookingState.currentMonth.setMonth(bookingState.currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        bookingState.currentMonth.setMonth(bookingState.currentMonth.getMonth() + 1);
        renderCalendar();
    });
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthDisplay = document.getElementById('currentMonth');
    
    // Clear previous days (keep headers)
    const headers = calendar.querySelectorAll('.calendar-header');
    calendar.innerHTML = '';
    headers.forEach(header => calendar.appendChild(header));
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${monthNames[bookingState.currentMonth.getMonth()]} ${bookingState.currentMonth.getFullYear()}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(bookingState.currentMonth.getFullYear(), 
                             bookingState.currentMonth.getMonth(), 1);
    const lastDay = new Date(bookingState.currentMonth.getFullYear(), 
                            bookingState.currentMonth.getMonth() + 1, 0);
    const numDays = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + CONFIG.maxAdvanceBooking);
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day disabled';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= numDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const date = new Date(bookingState.currentMonth.getFullYear(), 
                             bookingState.currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        
        // Check if day is in the past
        if (date < today) {
            dayElement.classList.add('past');
        }
        // Check if day is beyond max advance booking
        else if (date > maxDate) {
            dayElement.classList.add('disabled');
        }
        // Check if day is blocked by admin
        else if (isDateBlocked(date)) {
            dayElement.classList.add('disabled');
        }
        // Check if it's today
        else if (date.getTime() === today.getTime()) {
            dayElement.classList.add('today');
        }
        
        // Check if day is available (not disabled/past)
        if (!dayElement.classList.contains('disabled') && !dayElement.classList.contains('past')) {
            dayElement.addEventListener('click', () => selectDate(date, dayElement));
        }
        
        calendar.appendChild(dayElement);
    }
}

function selectDate(date, element) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
        day.classList.remove('selected');
    });
    
    // Select new date
    element.classList.add('selected');
    bookingState.selectedDate = date;
    
    // Update display
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('selectedDateDisplay').textContent = 
        date.toLocaleDateString('en-GB', options);
    
    // Show step 3 and generate time slots
    document.getElementById('step3').style.display = 'block';
    generateTimeSlots(date);
    
    // Scroll to step 3
    document.getElementById('step3').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    console.log('✅ Date selected:', date);
}

// ==========================================
// TIME SLOT GENERATION
// ==========================================
function generateTimeSlots(date) {
    const timeOptions = document.getElementById('timeOptions');
    timeOptions.innerHTML = '';
    
    const { start, end } = CONFIG.availableHours;
    const now = new Date();
    
    for (let hour = start; hour < end; hour++) {
        const timeSlot = new Date(date);
        timeSlot.setHours(hour, 0, 0, 0);
        
        // Skip if time is in the past (for today)
        if (timeSlot <= now) {
            continue;
        }
        
        const timeOption = document.createElement('div');
        timeOption.className = 'time-option';
        
        // Format time (e.g., "14:00 - 15:00")
        const startTime = formatTime(hour);
        const endTime = formatTime(hour + 1);
        timeOption.textContent = `${startTime} - ${endTime}`;
        
        // Check if this time slot is already booked
        if (isTimeSlotBooked(date, hour)) {
            timeOption.classList.add('booked');
            timeOption.textContent += ' (Booked)';
        } else {
            timeOption.addEventListener('click', () => selectTime(timeSlot, hour, timeOption));
        }
        
        timeOptions.appendChild(timeOption);
    }
    
    if (timeOptions.children.length === 0) {
        timeOptions.innerHTML = '<div class="time-option" style="opacity: 0.6; cursor: default;">No available times for this date</div>';
    }
}

function selectTime(dateTime, hour, element) {
    bookingState.selectedTime = {
        dateTime: dateTime,
        hour: hour
    };
    
    // Update display
    const startTime = formatTime(hour);
    const endTime = formatTime(hour + 1);
    document.getElementById('selectedTimeDisplay').textContent = `${startTime} - ${endTime}`;
    
    // Close dropdown
    document.getElementById('timeOptions').classList.remove('open');
    document.getElementById('timeDropdownBtn').classList.remove('open');
    
    // Show step 4
    document.getElementById('step4').style.display = 'block';
    
    // Scroll to step 4
    setTimeout(() => {
        document.getElementById('step4').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    console.log('✅ Time selected:', dateTime);
}

function formatTime(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
}

// ==========================================
// TIME DROPDOWN
// ==========================================
function setupTimeDropdown() {
    const dropdownBtn = document.getElementById('timeDropdownBtn');
    const timeOptions = document.getElementById('timeOptions');
    
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        timeOptions.classList.toggle('open');
        dropdownBtn.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.time-dropdown')) {
            timeOptions.classList.remove('open');
            dropdownBtn.classList.remove('open');
        }
    });
}

// ==========================================
// FORM SUBMISSION
// ==========================================
function setupFormSubmission() {
    const form = document.getElementById('bookingForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all steps
        if (!bookingState.selectedService) {
            alert('Please select a service type');
            return;
        }
        if (!bookingState.selectedDate) {
            alert('Please select a date');
            return;
        }
        if (!bookingState.selectedTime) {
            alert('Please select a time');
            return;
        }
        
        // Get form data
        const bookingData = {
            service: bookingState.selectedService,
            date: bookingState.selectedDate.toISOString().split('T')[0],
            time: bookingState.selectedTime.hour,
            dateTime: bookingState.selectedTime.dateTime.toISOString(),
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value || null,
            notes: document.getElementById('notes').value || null,
            createdAt: new Date().toISOString(),
            status: 'confirmed'
        };
        
        console.log('📤 Submitting booking:', bookingData);
        
        // Show loading
        document.querySelector('.booking-container').style.display = 'none';
        document.getElementById('loadingMessage').style.display = 'block';
        
        try {
            // Submit to Firebase
            await submitBooking(bookingData);
            
            // Show success
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            
            console.log('✅ Booking successful!');
            
        } catch (error) {
            console.error('❌ Booking failed:', error);
            
            // Show error
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorText').textContent = error.message || 'Something went wrong. Please try again.';
        }
    });
}

// ==========================================
// FIREBASE INTEGRATION
// ==========================================
async function loadBookingData() {
    if (!window.db) {
        console.warn('⚠️ Firebase not initialized - using demo mode');
        return;
    }
    
    try {
        // Load existing bookings
        const bookingsSnapshot = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();
        
        bookingState.bookings = bookingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Load blocked dates
        const blockedSnapshot = await db.collection('blockedDates').get();
        bookingState.blockedDates = blockedSnapshot.docs.map(doc => doc.data().date);
        
        console.log('✅ Loaded booking data:', {
            bookings: bookingState.bookings.length,
            blockedDates: bookingState.blockedDates.length
        });
        
    } catch (error) {
        console.error('❌ Failed to load booking data:', error);
    }
}

async function submitBooking(bookingData) {
    if (!window.db) {
        throw new Error('Firebase not initialized. Please contact support.');
    }
    
    try {
        // Double-check that slot is still available
        const existingBooking = await db.collection('bookings')
            .where('date', '==', bookingData.date)
            .where('time', '==', bookingData.time)
            .where('status', '==', 'confirmed')
            .get();
        
        if (!existingBooking.empty) {
            throw new Error('This time slot was just booked. Please choose another time.');
        }
        
        // Create booking in Firebase
        await db.collection('bookings').add(bookingData);
        
        console.log('✅ Booking saved to Firebase');
        
        // Send email notification via Formspree (same method as contact form)
        try {
            const serviceType = bookingData.service === 'discovery' ? 'Discovery Call' : 'TouchDesigner Lesson';
            const bookingDate = new Date(bookingData.dateTime);
            const dateStr = bookingDate.toLocaleString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/London'
            });
            
            const formData = new FormData();
            formData.append('_subject', `🎉 New Booking: ${serviceType}`);
            formData.append('Service', serviceType);
            formData.append('Date & Time', dateStr);
            formData.append('Client Name', bookingData.name);
            formData.append('Client Email', bookingData.email);
            formData.append('Client Phone', bookingData.phone || 'Not provided');
            formData.append('Notes', bookingData.notes || 'None');
            formData.append('_replyto', bookingData.email);
            
            // ⚠️ REPLACE 'YOUR_FORMSPREE_ID' with your actual Formspree form ID
            await fetch('https://formspree.io/f/xeopoqag', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('✅ Email notification sent via Formspree');
        } catch (emailError) {
            console.warn('⚠️ Email notification failed (booking still saved):', emailError);
            // Don't throw - booking is already saved, email is just a bonus
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase error:', error);
        throw error;
    }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function isDateBlocked(date) {
    const dateString = date.toISOString().split('T')[0];
    return bookingState.blockedDates.includes(dateString);
}

function isTimeSlotBooked(date, hour) {
    const dateString = date.toISOString().split('T')[0];
    
    return bookingState.bookings.some(booking => 
        booking.date === dateString && 
        booking.time === hour &&
        booking.status === 'confirmed'
    );
}

// Export for potential external use
if (typeof window !== 'undefined') {
    window.bookingSystem = {
        state: bookingState,
        config: CONFIG,
        reload: loadBookingData
    };
}

console.log('✅ Booking system script loaded');
