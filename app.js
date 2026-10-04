let currentDate = new Date();
const STORAGE_KEY = 'habitTracker_days';

document.addEventListener('DOMContentLoaded', () => {
    loadCalendar();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadCalendar();
    });
}

function getStoredData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveStoredData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function loadCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Clear existing calendar
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // Get data from storage
    const storedData = getStoredData();
    
    // Calculate first day and days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for days before first day
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'day empty';
        calendar.appendChild(cell);
    }
    
    // Add days
    let completedCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.textContent = day;
        
        const dateKey = formatDateKey(year, month, day);
        
        // Check if completed
        if (storedData[dateKey]) {
            cell.classList.add('completed');
            completedCount++;
        }
        
        // Check if today
        const testDate = new Date(year, month, day);
        if (isToday(testDate)) {
            cell.classList.add('today');
        }
        
        // Click handler
        cell.addEventListener('click', () => {
            toggleDay(dateKey);
            loadCalendar();
        });
        
        calendar.appendChild(cell);
    }
    
    // Update total count
    updateTotalDays();
}

function toggleDay(dateKey) {
    const storedData = getStoredData();
    
    if (storedData[dateKey]) {
        delete storedData[dateKey];
    } else {
        storedData[dateKey] = true;
    }
    
    saveStoredData(storedData);
}

function updateTotalDays() {
    const storedData = getStoredData();
    const totalDays = Object.keys(storedData).length;
    document.getElementById('totalDays').textContent = totalDays;
}