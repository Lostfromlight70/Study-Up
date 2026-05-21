// Firebase auth via CDN (loaded in index.html)
const auth = window.firebaseAuth;

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
const estimatedHoursInput = document.getElementById('estimatedHours');
const taskSubmitBtn = document.querySelector('#taskForm button[type="submit"]');
const completedCountEl = document.getElementById('completedCount');
const totalCountEl = document.getElementById('totalCount');
const progressFillEl = document.getElementById('progressFill');
const studentNameInput = document.getElementById('studentName');
const weeklyHoursInput = document.getElementById('weeklyHours');
const logoutBtn = document.getElementById('logoutBtn');
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
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
        item.innerHTML = `
      <div>
        <strong>${task.title}</strong>
        <span>${task.subjectName} • due ${formatDate(task.dueDate)} • ${task.hours}h</span>
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

function addTask(title, subjectId, dueDate, hours) {
    const subject = subjects.find(sub => sub.id === subjectId);
    if (!subject) return;

    const newTask = {
        id: `task-${Date.now()}`,
        title,
        subjectId,
        subjectName: subject.name,
        dueDate,
        hours: Number(hours),
        completed: false
    };
    tasks.push(newTask);
    saveState();
    renderTasks();
    generateSchedule();
}

function updateTask(id, title, subjectId, dueDate, hours) {
    const task = tasks.find(item => item.id === id);
    const subject = subjects.find(sub => sub.id === subjectId);
    if (!task || !subject) return;

    task.title = title;
    task.subjectId = subjectId;
    task.subjectName = subject.name;
    task.dueDate = dueDate;
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

function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', nextTheme === 'dark');
    toggleThemeBtn.textContent = nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    applyTheme(isDark ? 'light' : 'dark');
}

function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    applyTheme(theme);
}

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
    const hours = estimatedHoursInput.value;
    if (!title || !subjectId || !dueDate) return;

    if (editingTaskId) {
        updateTask(editingTaskId, title, subjectId, dueDate, hours);
    } else {
        addTask(title, subjectId, dueDate, hours);
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
if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', toggleTheme);
} else {
    console.warn('Toggle theme button not found.');
}

loadTheme();

// Check Firebase authentication and load planner
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
        requestNotificationPermission();
        notifyTodaySession();
        notifyUpcomingDeadlines();
    } else {
        // User is not logged in
        window.location.href = 'login.html';
    }
});
