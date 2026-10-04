/* ===== STATE & CONFIG ===== */
const STORAGE_KEY = 'neonHabitHero_data';
const XP_PER_DAY = 10;
const LEVEL_THRESHOLD = 100;
let currentDate = new Date();
let myChart = null;

/* ===== DOM ELEMENTS ===== */
const elements = {
    calendar: document.getElementById('calendar'),
    currentMonth: document.getElementById('currentMonth'),
    xpBar: document.getElementById('xpBar'),
    currentXP: document.getElementById('currentXP'),
    nextLevelXP: document.getElementById('nextLevelXP'),
    userLevel: document.getElementById('userLevel'),
    streak: document.getElementById('currentStreak'),
    weeklyCompletion: document.getElementById('weeklyCompletion'),
    badgesEarned: document.getElementById('badgesEarned'),
    completionRate: document.getElementById('completionRate'),
    missionBar: document.getElementById('dailyMissionBar'),
    missionText: document.getElementById('missionText'),
    celebrationOverlay: document.getElementById('celebrationOverlay'),
    celebrateStreakNum: document.getElementById('celebrateStreakNum'),
    achievementsModal: document.getElementById('achievementsModal'),
    achievementsGrid: document.getElementById('achievementsGrid')
};

/* ===== INITIALIZATION ===== */
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    loadCalendar();
    setupEventListeners();
    updateAllStats();
    checkUnlockedAchievements();
});

function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
    }
}

function setupEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadCalendar();
        playSound('transition');
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadCalendar();
        playSound('transition');
    });
    
    document.getElementById('checkInBtn').addEventListener('click', () => {
        const todayKey = getTodayKey();
        const storedData = getData();
        if (!storedData[todayKey]) {
            toggleDay(todayKey);
            showCelebration();
        }
    });
    
    document.getElementById('statsBtn').addEventListener('click', () => showAnalytics());
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    document.getElementById('closeAchievements').addEventListener('click', () => elements.achievementsModal.classList.remove('active'));
    document.getElementById('closeAnalytics').addEventListener('click', () => document.getElementById('analyticsModal').classList.remove('active'));
}

/* ===== DATA MANAGEMENT ===== */
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayKey() {
    const today = new Date();
    return formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

/* ===== USER PROGRESSION ===== */
function getUserProgress() {
    const storedData = getData();
    const totalDays = Object.keys(storedData).length;
    const level = Math.floor(totalDays / 10) + 1;
    const currentXP = totalDays * XP_PER_DAY;
    const nextLevelXP = level * LEVEL_THRESHOLD;
    const xpPercentage = ((totalDays % 10) / 10) * 100;
    
    return { level, currentXP, nextLevelXP, xpPercentage, totalDays };
}

function updateUserDisplay() {
    const progress = getUserProgress();
    elements.userLevel.textContent = progress.level;
    elements.currentXP.textContent = progress.currentXP;
    elements.nextLevelXP.textContent = progress.nextLevelXP;
    elements.xpBar.style.width = progress.xpPercentage + '%';
}

/* ===== STREAK CALCULATION ===== */
function calculateStreak() {
    const storedData = getData();
    const sortedDates = Object.keys(storedData).sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDates.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    
    let checkDate = storedData[todayKey] ? today : yesterday;
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
    
    return streak;
}

/* ===== CALENDAR RENDERING ===== */
function loadCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                       'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
    
    elements.calendar.innerHTML = '';
    const storedData = getData();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell empty';
        elements.calendar.appendChild(cell);
    }
    
    // Day cells
    const streakDays = getLastNDays(calculateStreak(), 10);
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        
        const dateKey = formatDateKey(year, month, day);
        const testDate = new Date(year, month, day);
        
        if (storedData[dateKey]) {
            cell.classList.add('completed');
            if (streakDays.includes(dateKey)) {
                cell.classList.add('streak-day');
            }
        }
        
        if (testDate.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }
        
        // Touch events for mobile
        let touchStartTime;
        cell.addEventListener('touchstart', () => { touchStartTime = Date.now(); });
        cell.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (Date.now() - touchStartTime < 300) {
                toggleDay(dateKey);
            }
        });
        
        cell.addEventListener('dblclick', () => {
            showNoteDialog(dateKey);
        });
        
        cell.addEventListener('click', (e) => {
            // Skip if double-click was registered
            if (e.detail === 1) {
                setTimeout(() => toggleDay(dateKey), 200);
            }
        });
        
        elements.calendar.appendChild(cell);
    }
    
    updateUserDisplay();
}

function getLastNDays(streakCount, limit) {
    const dates = [];
    const storedData = getData();
    const sortedDates = Object.keys(storedData).sort().reverse();
    
    for (let i = 0; i < Math.min(sortedDates.length, limit); i++) {
        dates.push(sortedDates[i]);
    }
    
    return dates;
}

function toggleDay(dateKey) {
    const storedData = getData();
    
    if (storedData[dateKey]) {
        delete storedData[dateKey];
        playSound('remove');
    } else {
        storedData[dateKey] = true;
        playSound('success');
        createConfetti(dateKey);
        saveData(storedData);
        
        // Check for milestone
        const streak = calculateStreak();
        if ([3, 7, 14, 21, 30].includes(streak)) {
            showStreakCelebration(streak);
        }
    }
    
    saveData(storedData);
    loadCalendar();
    updateAllStats();
}

/* ===== STATISTICS ===== */
function updateAllStats() {
    const streak = calculateStreak();
    const storedData = getData();
    
    // Streak
    elements.streak.textContent = streak;
    
    // Weekly completion
    const last7Days = getLastNKeys(7);
    let completedLast7 = 0;
    last7Days.forEach(key => { if (storedData[key]) completedLast7++; });
    elements.weeklyCompletion.textContent = Math.round((completedLast7 / 7) * 100) + '%';
    
    // Badges (mock calculation)
    elements.badgesEarned.textContent = countBadges();
    
    // Completion rate
    const allCompletions = Object.keys(storedData).length;
    const estimatedTotal = Math.max(allCompletions, 30);
    elements.completionRate.textContent = Math.min(Math.round((allCompletions / estimatedTotal) * 100), 100) + '%';
    
    // Mission bar
    const todayKey = getTodayKey();
    const percentage = storedData[todayKey] ? 100 : 0;
    elements.missionBar.style.width = percentage + '%';
    elements.missionText.textContent = storedData[todayKey] ? '🎉 MISSION COMPLETE! +10 XP EARNED!' : 'Complete your habit to earn +10 XP!';
}

function getLastNKeys(n) {
    const keys = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
        const date = new Date(today.getTime() - i * 86400000);
        keys.push(formatDateKey(date.getFullYear(), date.getMonth(), date.getDate()));
    }
    return keys;
}

function countBadges() {
    const streak = calculateStreak();
    const total = Object.keys(getData()).length;
    let badges = 0;
    if (streak >= 3) badges++;
    if (streak >= 7) badges++;
    if (total >= 30) badges++;
    if (total >= 100) badges++;
    return badges;
}

/* ===== ACHIEVEMENTS SYSTEM ===== */
const ACHIEVEMENTS = [
    { id: 'first_day', icon: '🎯', name: 'First Step', desc: 'Mark your first day' },
    { id: 'week_streak', icon: '🔥', name: 'Week Warrior', desc: '7 day streak' },
    { id: 'month_master', icon: '🏆', name: 'Month Master', desc: '30 completions' },
    { id: 'century_club', icon: '💎', name: 'Century Club', desc: '100 completions' },
    { id: 'legend', icon: '⭐', name: 'Legend', desc: '365 completions' },
    { id: 'never_give_up', icon: '🦾', name: 'Never Give Up', desc: '30 day streak' }
];

function checkUnlockedAchievements() {
    const storedData = getData();
    const total = Object.keys(storedData).length;
    const streak = calculateStreak();
    
    elements.achievementsGrid.innerHTML = ACHIEVEMENTS.map(ach => {
        let unlocked = false;
        if (ach.id === 'first_day' && total >= 1) unlocked = true;
        if (ach.id === 'week_streak' && streak >= 7) unlocked = true;
        if (ach.id === 'month_master' && total >= 30) unlocked = true;
        if (ach.id === 'century_club' && total >= 100) unlocked = true;
        if (ach.id === 'legend' && total >= 365) unlocked = true;
        if (ach.id === 'never_give_up' && streak >= 30) unlocked = true;
        
        return `
            <div class="achievement-item ${unlocked ? 'unlocked' : ''}" title="${ach.desc}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
            </div>
        `;
    }).join('');
}

/* ===== ANIMATIONS & EFFECTS ===== */
function createConfetti(dateKey) {
    const confettiColors = ['#00f3ff', '#ff00ff', '#00ff9d', '#ffee00', '#bc13fe'];
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${confettiColors[Math.floor(Math.random() * confettiColors.length)]};
            left: ${Math.random() * window.innerWidth}px;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            pointer-events: none;
            z-index: 9999;
            animation: fall ${Math.random() * 2 + 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
    
    // Add falling animation dynamically
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to { transform: translateY(${window.innerHeight}px) rotate(720deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    setTimeout(() => style.remove(), 4000);
}

function showCelebration() {
    const celebration = document.querySelector('.celebration-overlay');
    if (celebration) {
        celebration.classList.add('active');
        setTimeout(() => celebration.classList.remove('active'), 2000);
    }
}

function showStreakCelebration(days) {
    elements.celebrationOverlay.classList.add('active');
    elements.celebrateStreakNum.textContent = days;
    setTimeout(() => {
        elements.celebrationOverlay.classList.remove('active');
    }, 3000);
}

/* ===== ANALYTICS & MISCELLANEOUS ===== */
function showAnalytics() {
    const modal = document.getElementById('analyticsModal');
    modal.classList.add('active');
    
    const canvas = document.getElementById('yearlyChart');
    const ctx = canvas.getContext('2d');
    const storedData = getData();
    const currentYear = new Date().getFullYear();
    
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
    
    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Completed Days',
                data: monthlyData,
                backgroundColor: ['#00f3ff', '#ff00ff', '#00ff9d', '#ffee00', '#bc13fe', '#ff6b00',
                                 '#00f3ff', '#ff00ff', '#00ff9d', '#ffee00', '#bc13fe', '#ff6b00']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function showNoteDialog(dateKey) {
    const note = prompt('Add a note for this day:');
    if (note) {
        const storedData = getData();
        storedData[dateKey] = storedData[dateKey] || {};
        if (typeof storedData[dateKey] === 'boolean') {
            storedData[dateKey] = { completed: true, note };
        } else {
            storedData[dateKey].note = note;
        }
        saveData(storedData);
    }
}

function clearAllData() {
    if (confirm('⚠️ WARNING: This will erase ALL progress! Are you sure?')) {
        if (confirm('Are you REALLY sure? This cannot be undone!')) {
            localStorage.removeItem(STORAGE_KEY);
            loadCalendar();
            updateAllStats();
        }
    }
}

/* ===== SOUND EFFECTS (Simulated) ===== */
function playSound(type) {
    // Placeholder for actual sound implementation
    // Could integrate Howler.js or Web Audio API here
    console.log(`Sound effect: ${type}`);
}let currentDate = new Date();
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
