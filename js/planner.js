import { auth } from './firebase.js';

const profileForm = document.getElementById('profileForm');
const subjectForm = document.getElementById('subjectForm');
const taskForm = document.getElementById('taskForm');
const generateBtn = document.getElementById('generateScheduleBtn');
const rescheduleBtn = document.getElementById('rescheduleBtn');
const resetBtn = document.getElementById('resetDataBtn');
const subjectListEl = document.getElementById('subjectList');
const taskListEl = document.getElementById('taskList');
const scheduleListEl = document.getElementById('scheduleList');
const taskSubjectSelect = document.getElementById('taskSubject');
const todayTasksEl = document.getElementById('todayTasks');
const deadlineListEl = document.getElementById('deadlineList');
const recommendationTextEl = document.getElementById('recommendationText');
const taskTitleInput = document.getElementById('taskTitle');
const dueDateInput = document.getElementById('dueDate');
const dueTimeInput = document.getElementById('dueTime');
const estimatedHoursInput = document.getElementById('estimatedHours');
const taskSubmitBtn = document.querySelector('#taskForm button[type="submit"]');
const completedCountEl = document.getElementById('completedCount');
const totalCountEl = document.getElementById('totalCount');
const progressFillEl = document.getElementById('progressFill');
const studentNameInput = document.getElementById('studentName');
const weeklyHoursInput = document.getElementById('weeklyHours');
const logoutBtn = document.getElementById('logoutBtn');
const themeSelect = document.getElementById('themeSelect');
const customAccentColor = document.getElementById('customAccentColor');
const customSurfaceColor = document.getElementById('customSurfaceColor');
const accentPreview = document.getElementById('accentPreview');
const surfacePreview = document.getElementById('surfacePreview');
const customThemeControls = document.getElementById('customThemeControls');
const userGreetingEl = document.getElementById('userGreeting');
const reminderForm = document.getElementById('reminderForm');
const reminderMessageInput = document.getElementById('reminderMessage');
const reminderMinutesInput = document.getElementById('reminderMinutes');
const reminderListEl = document.getElementById('reminderList');

const STORAGE_KEYS = {
    userProfiles: 'studyPlannerProfiles',
    currentUser: 'studyPlannerCurrentUser',
    theme: 'studyPlannerTheme'
};

let currentUserId = null;
let userProfiles = {};
let profile = { name: '', weeklyHours: 15 };
let subjects = [];
let tasks = [];
let schedule = [];
let reminders = [];
let reminderTimeouts = [];
let editingTaskId = null;

function saveUserProfiles() {
    localStorage.setItem(STORAGE_KEYS.userProfiles, JSON.stringify(userProfiles));
}

function loadUserProfiles() {
    const stored = localStorage.getItem(STORAGE_KEYS.userProfiles);
    userProfiles = stored ? JSON.parse(stored) : {};
}

function getCurrentUser() {
    return userProfiles[currentUserId];
}

function saveCurrentUser(userId) {
    localStorage.setItem(STORAGE_KEYS.currentUser, userId || '');
    currentUserId = userId;
}

function saveUserData() {
    if (!currentUserId || !userProfiles[currentUserId]) return;
    userProfiles[currentUserId].profile = profile;
    userProfiles[currentUserId].subjects = subjects;
    userProfiles[currentUserId].tasks = tasks;
    userProfiles[currentUserId].schedule = schedule;
    userProfiles[currentUserId].reminders = reminders;
    saveUserProfiles();
}

function saveState() {
    saveUserData();
}

function loadState() {
    loadUserProfiles();
    const storedUserId = localStorage.getItem(STORAGE_KEYS.currentUser);

    if (storedUserId && userProfiles[storedUserId]) {
        currentUserId = storedUserId;
        const user = getCurrentUser();
        profile = user.profile || { name: '', weeklyHours: 15 };
        subjects = user.subjects || [];
        tasks = user.tasks || [];
        schedule = user.schedule || [];
        reminders = user.reminders || [];
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
    });
}

function getTodayKey() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
}

function buildSubjectOptions() {
    taskSubjectSelect.innerHTML = '';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = `${subject.name} (${subject.priorityText})`;
        taskSubjectSelect.appendChild(option);
    });
}

function renderSubjects() {
    subjectListEl.innerHTML = '';
    subjects.forEach(subject => {
        const item = document.createElement('li');
        item.innerHTML = `
      <div>
        <strong>${subject.name}</strong>
        <span>${subject.priorityText}</span>
      </div>
      <button class="secondary" data-action="remove" data-id="${subject.id}">Remove</button>
    `;
        subjectListEl.appendChild(item);
    });
    buildSubjectOptions();
}

function renderTasks() {
    taskListEl.innerHTML = '';
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    tasks.forEach(task => {
        const item = document.createElement('li');
        item.className = task.completed ? 'completed-task' : '';
        const timeDisplay = task.dueTime ? ` at ${task.dueTime}` : '';
        item.innerHTML = `
      <div>
        <strong>${task.title}</strong>
        <span>${task.subjectName} • due ${formatDate(task.dueDate)}${timeDisplay} • ${task.hours}h</span>
      </div>
      <div class="task-actions">
        <button class="secondary" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="secondary" data-action="complete" data-id="${task.id}">${task.completed ? 'Undo' : 'Complete'}</button>
        <button class="secondary" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    `;
        taskListEl.appendChild(item);
    });
}

function renderDashboard() {
    const completedCount = tasks.filter(task => task.completed).length;
    const totalCount = tasks.length;
    completedCountEl.textContent = completedCount;
    totalCountEl.textContent = totalCount;
    progressFillEl.style.width = totalCount === 0 ? '0%' : `${Math.round((completedCount / totalCount) * 100)}%`;

    todayTasksEl.innerHTML = '';
    const todayKey = getTodayKey();
    const todayItems = schedule.filter(item => item.date === todayKey && !item.completed);
    if (todayItems.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No study sessions scheduled for today.';
        todayTasksEl.appendChild(emptyItem);
    } else {
        todayItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.subjectName}: ${item.taskTitle} (${item.hours}h)`;
            todayTasksEl.appendChild(li);
        });
    }

    deadlineListEl.innerHTML = '';
    const deadlines = tasks.filter(task => !task.completed).slice(0, 5);
    if (deadlines.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'No pending deadlines.';
        deadlineListEl.appendChild(emptyItem);
    } else {
        deadlines.forEach(task => {
            const li = document.createElement('li');
            li.textContent = `${task.subjectName}: ${task.title} — due ${formatDate(task.dueDate)}`;
            deadlineListEl.appendChild(li);
        });
    }

    recommendationTextEl.textContent = getRecommendation();
}

function getRecommendation() {
    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length === 0) {
        return 'You are all caught up! Add new tasks to keep planning your study sessions.';
    }

    const urgentTasks = pendingTasks
        .map(task => ({
            ...task,
            daysToDue: Math.max(0, Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
        }))
        .sort((a, b) => a.daysToDue - b.daysToDue || b.priority - a.priority);

    const nextTask = urgentTasks[0];
    if (nextTask.daysToDue <= 2) {
        return `Focus on ${nextTask.subjectName}. ${nextTask.title} is due in ${nextTask.daysToDue} day(s).`;
    }

    const hoursBySubject = pendingTasks.reduce((acc, task) => {
        acc[task.subjectName] = (acc[task.subjectName] || 0) + task.hours;
        return acc;
    }, {});

    const topSubject = Object.entries(hoursBySubject).sort((a, b) => b[1] - a[1])[0];
    return topSubject ? `Spend more time on ${topSubject[0]} (${topSubject[1]} hours pending).` : 'Keep up the steady study routine!';
}

function renderSchedule() {
    scheduleListEl.innerHTML = '';
    if (schedule.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.textContent = 'Generate your personalized schedule to see sessions here.';
        scheduleListEl.appendChild(emptyItem);
        return;
    }

    schedule.slice(0, 14).forEach(entry => {
        const item = document.createElement('li');
        item.innerHTML = `
      <strong>${formatDate(entry.date)}</strong>
      <div>${entry.subjectName}: ${entry.taskTitle} • ${entry.hours}h</div>
    `;
        scheduleListEl.appendChild(item);
    });
}

function syncProfile() {
    studentNameInput.value = profile.name;
    weeklyHoursInput.value = profile.weeklyHours;
    userGreetingEl.textContent = profile.name ? `Hi, ${profile.name}!` : '';
}

function getPriorityText(priority) {
    if (priority >= 3) return 'High';
    if (priority === 2) return 'Medium';
    return 'Low';
}

function generateSchedule() {
    if (subjects.length === 0 || tasks.length === 0) {
        schedule = [];
        saveState();
        renderSchedule();
        renderDashboard();
        return;
    }

    const availableHours = Math.max(1, profile.weeklyHours / 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingTasks = tasks
        .filter(task => !task.completed)
        .map(task => {
            const dueDateObj = new Date(task.dueDate);
            dueDateObj.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));
            return {
                ...task,
                dueDateObj,
                daysLeft,
                urgency: Math.max(0, 14 - daysLeft),
                remainingHours: task.hours
            };
        });

    const newSchedule = [];
    for (let day = 0; day < 14; day += 1) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);
        const currentKey = currentDate.toISOString().slice(0, 10);
        let remainingHours = availableHours;

        const dayTasks = pendingTasks
            .filter(task => task.remainingHours > 0)
            .sort((a, b) => {
                const scoreA = (a.daysLeft <= 0 ? 200 : (14 - a.daysLeft) * 6) + a.priority * 10 + a.hours;
                const scoreB = (b.daysLeft <= 0 ? 200 : (14 - b.daysLeft) * 6) + b.priority * 10 + b.hours;
                return scoreB - scoreA;
            });

        for (const task of dayTasks) {
            if (remainingHours <= 0) break;

            const allocation = Math.min(task.remainingHours, remainingHours, 2);
            if (allocation <= 0) continue;

            task.remainingHours -= allocation;
            remainingHours -= allocation;

            newSchedule.push({
                date: currentKey,
                taskId: task.id,
                taskTitle: task.title,
                subjectName: task.subjectName,
                hours: allocation,
                completed: false
            });
        }
    }

    schedule = newSchedule;
    saveState();
    renderSchedule();
    renderDashboard();
    notifyUpcomingDeadlines();
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function notifyTodaySession() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const todayKey = getTodayKey();
    const todayItems = schedule.filter(item => item.date === todayKey && !item.completed);
    if (todayItems.length === 0) return;

    const message = `You have ${todayItems.length} study session(s) today.`;
    new Notification('Study Planner Reminder', { body: message });
}

function notifyUpcomingDeadlines() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const upcoming = tasks.filter(task => {
        if (task.completed) return false;
        const dueDate = new Date(task.dueDate);
        const daysToDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysToDue >= 0 && daysToDue <= 2;
    });

    if (upcoming.length === 0) return;
    const important = upcoming.filter(task => task.priority >= 3).length;
    const title = important > 0 ? 'Urgent deadline soon' : 'Upcoming deadline reminder';
    const body = `${upcoming.length} task(s) due soon. Check your schedule and stay on track.`;
    new Notification(title, { body });
}

function renderReminders() {
    reminderListEl.innerHTML = '';
    if (reminders.length === 0) {
        const item = document.createElement('li');
        item.textContent = 'No reminders scheduled.';
        reminderListEl.appendChild(item);
        return;
    }

    reminders.sort((a, b) => a.time - b.time).forEach(reminder => {
        const item = document.createElement('li');
        const reminderTime = new Date(reminder.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        item.innerHTML = `
            <div>
              <strong>${reminder.message}</strong>
              <span>${reminderTime}</span>
            </div>
            <button class="secondary" data-action="cancel" data-id="${reminder.id}">Cancel</button>
        `;
        reminderListEl.appendChild(item);
    });
}

function schedulePendingReminders() {
    reminderTimeouts.forEach(timeout => clearTimeout(timeout));
    reminderTimeouts = [];

    const now = Date.now();
    reminders = reminders.filter(reminder => reminder.time > now);
    reminders.forEach(reminder => {
        const delay = reminder.time - now;
        const timeoutId = setTimeout(() => {
            showReminderNotification(reminder);
            reminders = reminders.filter(item => item.id !== reminder.id);
            saveState();
            renderReminders();
        }, delay);
        reminderTimeouts.push(timeoutId);
    });
    renderReminders();
}

function showReminderNotification(reminder) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        alert(`Reminder: ${reminder.message}`);
        return;
    }
    new Notification('Study Planner Reminder', {
        body: reminder.message
    });
}

function addReminder(message, minutes) {
    const reminder = {
        id: `reminder-${Date.now()}`,
        message,
        time: Date.now() + Number(minutes) * 60 * 1000
    };
    reminders.push(reminder);
    saveState();
    schedulePendingReminders();
}

function removeReminder(id) {
    reminders = reminders.filter(reminder => reminder.id !== id);
    saveState();
    schedulePendingReminders();
}

function handleReminderSubmit(event) {
    event.preventDefault();
    const message = reminderMessageInput.value.trim();
    const minutes = reminderMinutesInput.value;
    if (!message || !minutes) return;
    requestNotificationPermission();
    addReminder(message, minutes);
    reminderForm.reset();
}

function addSubject(name, priority) {
    const newSubject = {
        id: `sub-${Date.now()}`,
        name,
        priority: Number(priority),
        priorityText: getPriorityText(Number(priority))
    };
    subjects.push(newSubject);
    saveState();
    renderSubjects();
    generateSchedule();
}

function addTask(title, subjectId, dueDate, hours, dueTime = '') {
    const subject = subjects.find(sub => sub.id === subjectId);
    if (!subject) return;

    const newTask = {
        id: `task-${Date.now()}`,
        title,
        subjectId,
        subjectName: subject.name,
        dueDate,
        dueTime,
        hours: Number(hours),
        completed: false
    };
    tasks.push(newTask);
    saveState();
    renderTasks();
    generateSchedule();
}

function updateTask(id, title, subjectId, dueDate, hours, dueTime = '') {
    const task = tasks.find(item => item.id === id);
    const subject = subjects.find(sub => sub.id === subjectId);
    if (!task || !subject) return;

    task.title = title;
    task.subjectId = subjectId;
    task.subjectName = subject.name;
    task.dueDate = dueDate;
    task.dueTime = dueTime;
    task.hours = Number(hours);
    saveState();
    clearEditMode();
    renderTasks();
    generateSchedule();
}

function clearEditMode() {
    editingTaskId = null;
    taskSubmitBtn.textContent = 'Add Task';
    taskForm.reset();
}

function removeTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveState();
    renderTasks();
    generateSchedule();
}

function toggleTaskCompletion(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveState();
    renderTasks();
    generateSchedule();
}

function removeSubject(id) {
    subjects = subjects.filter(subject => subject.id !== id);
    tasks = tasks.filter(task => task.subjectId !== id);
    saveState();
    renderSubjects();
    renderTasks();
    generateSchedule();
}

function logout() {
    saveState();
    saveCurrentUser('');
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch(error => {
        console.error('Logout error:', error);
        window.location.href = 'login.html';
    });
}

function setThemeControls(themeConfig) {
    const themeName = themeConfig?.name || 'light';
    const showCustomControls = themeName === 'custom';
    themeSelect.value = themeName;
    customAccentColor.value = themeConfig?.accentColor || '#4f46e5';
    customSurfaceColor.value = themeConfig?.surfaceColor || '#eef2ff';
    accentPreview.style.backgroundColor = customAccentColor.value;
    surfacePreview.style.backgroundColor = customSurfaceColor.value;
    customThemeControls.classList.toggle('visible', showCustomControls);
}

function isLightColor(hex) {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
}

function adjustLightness(hex, delta) {
    const normalized = hex.replace('#', '');
    let r = parseInt(normalized.slice(0, 2), 16) / 255;
    let g = parseInt(normalized.slice(2, 4), 16) / 255;
    let b = parseInt(normalized.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const newL = Math.max(0, Math.min(100, (l * 100) + delta)) / 100;
    const scale = l === 0 ? 0 : newL / l;
    r = Math.min(1, r * scale);
    g = Math.min(1, g * scale);
    b = Math.min(1, b * scale);
    const toHex = n => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lightenHexColor(hex, amount) {
    const normalized = hex.replace('#', '');
    const num = parseInt(normalized, 16);
    const r = Math.min(255, Math.round(((num >> 16) & 0xff) + (255 - ((num >> 16) & 0xff)) * amount));
    const g = Math.min(255, Math.round((((num >> 8) & 0xff) + (255 - ((num >> 8) & 0xff)) * amount)));
    const b = Math.min(255, Math.round(((num & 0xff) + (255 - (num & 0xff)) * amount)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darkenHexColor(hex, amount) {
    const normalized = hex.replace('#', '');
    const num = parseInt(normalized, 16);
    const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
    const g = Math.max(0, Math.round((((num >> 8) & 0xff) * (1 - amount))));
    const b = Math.max(0, Math.round(((num & 0xff) * (1 - amount))));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
}

function clearThemeOverrides() {
    const root = document.documentElement;
    const customVars = [
        '--custom-accent',
        '--custom-border',
        '--custom-secondary-bg',
        '--custom-secondary-text',
        '--custom-text',
        '--custom-muted',
        '--custom-panel',
        '--custom-bg'
    ];
    customVars.forEach(name => root.style.removeProperty(name));

    const darkVars = [
        '--accent',
        '--accent-strong',
        '--border',
        '--secondary-bg',
        '--secondary-text'
    ];
    darkVars.forEach(name => root.style.removeProperty(name));
    // also clear any overrides set on the body element
    const body = document.body;
    if (body) {
        customVars.forEach(name => body.style.removeProperty(name));
        darkVars.forEach(name => body.style.removeProperty(name));
        body.style.removeProperty('--dark-accent');
        body.style.removeProperty('--dark-accent-strong');
        body.style.removeProperty('--accent-rgb');
        body.style.removeProperty('--custom-accent-rgb');
    }
}

function applyTheme(themeConfig, persist = true) {
    const themeName = themeConfig?.name || 'light';
    document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('theme-'))
        .concat(`theme-${themeName}`)
        .join(' ');

    clearThemeOverrides();

    const accent = themeConfig?.accentColor || '#4f46e5';
    const surface = themeConfig?.surfaceColor || '#eef2ff';
    const darkAccent = themeConfig?.darkAccentColor || '#1f2937';
    const accentRgb = hexToRgb(accent);
    const darkAccentRgb = hexToRgb(darkAccent);
    const isLightSurface = isLightColor(surface);
    const panelSurface = isLightSurface ? lightenHexColor(surface, 0.12) : adjustLightness(surface, 12);
    const elevatedSurface = isLightSurface ? '#ffffff' : adjustLightness(surface, 20);
    const borderSurface = isLightSurface ? lightenHexColor(surface, 0.20) : adjustLightness(surface, 25);
    const secondarySurface = isLightSurface ? lightenHexColor(surface, 0.08) : adjustLightness(surface, 8);
    const textColor = isLightSurface ? '#1f2937' : '#e5e7eb';
    const mutedColor = isLightSurface ? '#4b5563' : '#94a3b8';
    const accentStrong = darkenHexColor(accent, 0.15);

    const body = document.body;
    if (themeName === 'custom') {
        if (body) {
            body.style.setProperty('--custom-accent', accent);
            body.style.setProperty('--custom-accent-strong', accentStrong);
            body.style.setProperty('--custom-accent-rgb', accentRgb);
            body.style.setProperty('--custom-bg', surface);
            body.style.setProperty('--custom-panel', panelSurface);
            body.style.setProperty('--custom-elevated', elevatedSurface);
            body.style.setProperty('--custom-text', textColor);
            body.style.setProperty('--custom-muted', mutedColor);
            body.style.setProperty('--custom-border', borderSurface);
            body.style.setProperty('--custom-secondary-bg', secondarySurface);
            body.style.setProperty('--custom-secondary-text', textColor);
            body.style.setProperty('--accent-rgb', accentRgb);
        } else {
            document.documentElement.style.setProperty('--custom-accent', accent);
        }
    }

    if (themeName === 'dark') {
        // set dark accent variables on the body element so they take precedence
        if (body) {
            body.style.setProperty('--dark-accent', darkAccent);
            body.style.setProperty('--dark-accent-strong', darkenHexColor(darkAccent, 0.15));
            body.style.setProperty('--accent', darkAccent);
            body.style.setProperty('--accent-strong', darkenHexColor(darkAccent, 0.15));
            body.style.setProperty('--accent-rgb', darkAccentRgb);
            body.style.setProperty('--border', darkenHexColor(darkAccent, 0.45));
            body.style.setProperty('--secondary-bg', darkenHexColor(darkAccent, 0.75));
            body.style.setProperty('--secondary-text', '#e5e7eb');
        } else {
            document.documentElement.style.setProperty('--dark-accent', darkAccent);
        }
    }

    setThemeControls(themeConfig);
    if (persist) {
        localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(themeConfig));
    }
}

function loadTheme() {
    let themeConfig = { name: 'light', accentColor: '#4f46e5', surfaceColor: '#eef2ff' };
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    try {
        if (storedTheme) {
            themeConfig = JSON.parse(storedTheme);
        }
    } catch (err) {
        console.warn('Failed to parse stored theme config, resetting to default.', err);
    }
    applyTheme(themeConfig, true);
}

function getPreviewThemeConfig() {
    const themeName = themeSelect.value;
    const config = { name: themeName };
    if (themeName === 'custom') {
        config.accentColor = customAccentColor.value;
        config.surfaceColor = customSurfaceColor.value;
    }
    return config;
}

themeSelect.addEventListener('change', () => {
    const themeConfig = getPreviewThemeConfig();
    applyTheme(themeConfig, true);
});

customAccentColor.addEventListener('input', () => {
    accentPreview.style.backgroundColor = customAccentColor.value;
    if (themeSelect.value === 'custom') {
        applyTheme(getPreviewThemeConfig(), true);
    }
});

customSurfaceColor.addEventListener('input', () => {
    surfacePreview.style.backgroundColor = customSurfaceColor.value;
    if (themeSelect.value === 'custom') {
        applyTheme(getPreviewThemeConfig(), true);
    }
});

profileForm.addEventListener('submit', event => {
    event.preventDefault();
    profile.name = studentNameInput.value.trim();
    profile.weeklyHours = Number(weeklyHoursInput.value) || 15;
    saveState();
    syncProfile();
    alert('Profile saved successfully.');
    generateSchedule();
});

subjectForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('subjectName').value.trim();
    const priority = document.getElementById('priority').value;
    if (!name) return;
    addSubject(name, priority);
    subjectForm.reset();
});

taskForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = taskTitleInput.value.trim();
    const subjectId = taskSubjectSelect.value;
    const dueDate = dueDateInput.value;
    const dueTime = dueTimeInput.value;
    const hours = estimatedHoursInput.value;
    if (!title || !subjectId || !dueDate) return;

    if (editingTaskId) {
        updateTask(editingTaskId, title, subjectId, dueDate, hours, dueTime);
    } else {
        addTask(title, subjectId, dueDate, hours, dueTime);
    }
    clearEditMode();
});

reminderForm.addEventListener('submit', handleReminderSubmit);

taskListEl.addEventListener('click', event => {
    const action = event.target.dataset.action;
    const taskId = event.target.dataset.id;
    if (!action || !taskId) return;

    if (action === 'delete') removeTask(taskId);
    if (action === 'complete') toggleTaskCompletion(taskId);
    if (action === 'edit') {
        const task = tasks.find(item => item.id === taskId);
        if (!task) return;
        editingTaskId = taskId;
        taskTitleInput.value = task.title;
        taskSubjectSelect.value = task.subjectId;
        dueDateInput.value = task.dueDate;
        dueTimeInput.value = task.dueTime || '';
        estimatedHoursInput.value = task.hours;
        taskSubmitBtn.textContent = 'Save Task';
    }
});

reminderListEl.addEventListener('click', event => {
    const action = event.target.dataset.action;
    const reminderId = event.target.dataset.id;
    if (!action || !reminderId) return;
    if (action === 'cancel') removeReminder(reminderId);
});

subjectListEl.addEventListener('click', event => {
    const action = event.target.dataset.action;
    const subjectId = event.target.dataset.id;
    if (!action || !subjectId) return;
    if (action === 'remove') removeSubject(subjectId);
});

generateBtn.addEventListener('click', generateSchedule);
rescheduleBtn.addEventListener('click', generateSchedule);
resetBtn.addEventListener('click', () => {
    if (!confirm('Reset current user planner data?')) return;
    profile = { name: '', weeklyHours: 15 };
    subjects = [];
    tasks = [];
    schedule = [];
    saveState();
    syncProfile();
    renderSubjects();
    renderTasks();
    renderSchedule();
    renderDashboard();
});

logoutBtn.addEventListener('click', logout);

loadTheme();

// Check Firebase authentication and load planner
// Demo mode for UI testing - enable if demoMode query param is set
const urlParams = new URLSearchParams(window.location.search);
const DEMO_MODE = urlParams.get('demo') === 'true' || localStorage.getItem('demoMode') === 'true';
const mockUser = {
    uid: 'demo-user-123',
    email: 'demo@example.com',
    displayName: 'Demo User'
};

if (DEMO_MODE) {
    // Load in demo mode without waiting for Firebase
    saveCurrentUser(mockUser.uid);
    if (!userProfiles[mockUser.uid]) {
        userProfiles[mockUser.uid] = {
            uid: mockUser.uid,
            name: mockUser.displayName,
            email: mockUser.email,
            profile: { name: mockUser.displayName, weeklyHours: 15 },
            subjects: [],
            tasks: [],
            schedule: [],
            reminders: []
        };
        saveUserProfiles();
    }
    loadTheme();
    clearEditMode();
    syncProfile();
    renderSubjects();
    renderTasks();
    renderReminders();
    generateSchedule();
    renderDashboard();
    schedulePendingReminders();
    notifyTodaySession();
    notifyUpcomingDeadlines();
} else {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is logged in
            saveCurrentUser(user.uid);
            loadState();

            // Ensure user profile exists
            if (!userProfiles[user.uid]) {
                userProfiles[user.uid] = {
                    uid: user.uid,
                    name: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    profile: { name: user.displayName || user.email.split('@')[0], weeklyHours: 15 },
                    subjects: [],
                    tasks: [],
                    schedule: [],
                    reminders: []
                };
                saveUserProfiles();
                loadState();
            }

            loadTheme();
            clearEditMode();
            syncProfile();
            renderSubjects();
            renderTasks();
            renderReminders();
            generateSchedule();
            renderDashboard();
            schedulePendingReminders();
            notifyTodaySession();
            notifyUpcomingDeadlines();
        } else {
            // User is not logged in
            window.location.href = 'login.html';
        }
    });
}
