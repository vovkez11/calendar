let currentDate = new Date();
const STORAGE_KEY = 'habitTracker_data';
const GOAL_KEY = 'habitTracker_goal';
let currentStreak = 0;
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
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
    
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('saveGoal').addEventListener('click', saveGoal);
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', triggerImport);
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('chartModal').classList.remove('active');
    });
}

// ===== DARK MODE =====
function loadSettings() {
    const savedTheme = localStorage.getItem('habitTracker_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('habitTracker_theme', isDark ? 'dark' : 'light');
}

// ===== DATA MANAGEMENT =====
function getStoredData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveStoredData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
}

// ===== STREAK CALCULATION =====
function calculateStreaks() {
    const storedData = getStoredData();
    const sortedDates = Object.keys(storedData).sort().reverse();
    
    if (sortedDates.length === 0) {
        currentStreak = 0;
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today is completed
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    let checkDate = storedData[todayKey] ? today : new Date(today.getTime() - 86400000);
    
    let streak = 0;
    while (true) {
        const key = formatDateKey(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        if (storedData[key]) {
            streak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
            break;
        }
    }
    
    currentStreak = streak;
    document.getElementById('currentStreak').textContent = streak;
}

// ===== CALENDAR RENDERING =====
function loadCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;
    
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    const storedData = getStoredData();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'day empty';
        calendar.appendChild(cell);
    }
    
    let completedCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day';
        cell.textContent = day;
        
        const dateKey = formatDateKey(year, month, day);
        
        if (storedData[dateKey]) {
            cell.classList.add('completed');
            completedCount++;
        }
        
        const testDate = new Date(year, month, day);
        const today = new Date();
        if (testDate.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }
        
        cell.addEventListener('click', () => toggleDay(dateKey));
        calendar.appendChild(cell);
    }
    
    // Update stats
    updateStats(completedCount, daysInMonth);
    calculateStreaks();
}

function toggleDay(dateKey) {
    const storedData = getStoredData();
    
    if (storedData[dateKey]) {
        delete storedData[dateKey];
    } else {
        storedData[dateKey] = true;
    }
    
    saveStoredData(storedData);
    loadCalendar();
}

// ===== STATISTICS =====
function updateStats(completed, total) {
    document.getElementById('monthProgress').textContent = `${completed}/${total}`;
    
    const allTime = Object.keys(getStoredData()).length;
    document.getElementById('totalDays').textContent = allTime;
}

// ===== GOAL SETTING =====
function loadSettings() {
    const savedGoal = localStorage.getItem(GOAL_KEY);
    if (savedGoal) {
        document.getElementById('monthlyGoal').value = savedGoal;
    }
    
    // Also load theme
    const savedTheme = localStorage.getItem('habitTracker_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    }
}

function saveGoal() {
    const goal = document.getElementById('monthlyGoal').value;
    localStorage.setItem(GOAL_KEY, goal);
    alert(`Monthly goal set to ${goal} days!`);
}

// ===== EXPORT/IMPORT =====
function exportData() {
    const data = {
        habitTracker: getStoredData(),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function triggerImport() {
    document.getElementById('importFile').click();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.habitTracker) {
                saveStoredData(data.habitTracker);
                loadCalendar();
                alert('Data imported successfully!');
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Error reading file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// ===== YEARLY CHART =====
function showYearlyChart() {
    const storedData = getStoredData();
    const currentYear = new Date().getFullYear();
    
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        let completed = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const key = formatDateKey(currentYear, m, d);
            if (storedData[key]) completed++;
        }
        monthlyData.push(completed);
    }
    
    if (myChart) {
        myChart.destroy();
    }
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Completed Days',
                data: monthlyData,
                backgroundColor: '#4CAF50'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Yearly Progress - ${currentYear}`
                }
            }
        }
    });
}let currentDate = new Date();
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
