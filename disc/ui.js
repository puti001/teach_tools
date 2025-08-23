import * as storage from 'storage';
import { getTodayDateString, getFormattedDate } from 'utils';

const mainContent = document.getElementById('app-main');

const createHomePage = () => {
    const page = document.createElement('div');
    page.id = 'home';
    page.className = 'page';
    page.innerHTML = `
        <div id="home-status-bar"></div>
        <div class="exercise-list" id="exercise-list-container"></div>
        <button id="add-exercise-btn" class="btn-primary">+ 新增運動</button>
    `;
    mainContent.appendChild(page);
    renderHomePage();
};

const createAssessmentPage = () => {
    const page = document.createElement('div');
    page.id = 'assessment';
    page.className = 'page';
    page.innerHTML = `
        <h2>評估記錄</h2>
        <button id="add-assessment-btn" class="btn btn-primary">記錄麻木狀況</button>
        <div class="assessment-log" id="assessment-log-container" style="margin-top: 1rem;"></div>
    `;
    mainContent.appendChild(page);
    renderAssessmentPage();
};

const createSettingsPage = () => {
    const page = document.createElement('div');
    page.id = 'settings';
    page.className = 'page';
    page.innerHTML = `
        <h2>設定</h2>
        <div class="settings-group">
            <h3>鬧鐘提醒</h3>
            <div class="setting-item">
                <label for="reminders-enabled">開啟提醒</label>
                <label class="switch">
                    <input type="checkbox" id="reminders-enabled">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="setting-item">
                <label for="morning-time">早上</label>
                <input type="time" id="morning-time">
            </div>
            <div class="setting-item">
                <label for="noon-time">中午</label>
                <input type="time" id="noon-time">
            </div>
            <div class="setting-item">
                <label for="evening-time">晚上</label>
                <input type="time" id="evening-time">
            </div>
        </div>
        <div class="settings-group">
            <h3>資料管理</h3>
            <div class="assessment-actions">
                 <button id="export-data-btn" class="btn btn-secondary">匯出資料</button>
                 <button id="import-data-btn" class="btn btn-secondary">匯入資料</button>
                 <input type="file" id="import-file-input" class="hidden" accept=".json">
            </div>
        </div>
    `;
    mainContent.appendChild(page);
    renderSettingsPage();
};

export function renderHomePage() {
    // Render Status Bar
    const statusBar = document.getElementById('home-status-bar');
    if (statusBar) {
        const today = new Date();
        const formattedDate = getFormattedDate(today);

        const exercises = storage.getExercises();
        const checkIns = storage.getCheckInsForDate(getTodayDateString());

        const totalTasks = exercises.length * 3;
        const completedTasks = Object.values(checkIns).reduce((acc, val) => acc + val.length, 0);

        statusBar.innerHTML = `
            <div class="status-date">${formattedDate}</div>
            <div class="status-progress">${completedTasks}/${totalTasks} 運動打卡完成</div>
        `;
    }

    const container = document.getElementById('exercise-list-container');
    if (!container) return;
    
    const exercises = storage.getExercises();
    const checkIns = storage.getCheckInsForDate(getTodayDateString());
    
    container.innerHTML = exercises.map(ex => {
        const isChecked = (timeSlot) => checkIns[ex.id] && checkIns[ex.id].includes(timeSlot);
        return `
            <div class="exercise-item">
                <div class="exercise-header">
                    <span>${ex.name}</span>
                    ${ex.custom ? `<button class="edit-exercise-btn" data-exercise-id="${ex.id}"><img src="icon-edit.png" alt="編輯"></button>` : ''}
                </div>
                <div class="check-in-buttons">
                    <button class="check-in-btn ${isChecked('morning') ? 'checked' : ''}" data-exercise-id="${ex.id}" data-time-slot="morning">早</button>
                    <button class="check-in-btn ${isChecked('noon') ? 'checked' : ''}" data-exercise-id="${ex.id}" data-time-slot="noon">中</button>
                    <button class="check-in-btn ${isChecked('evening') ? 'checked' : ''}" data-exercise-id="${ex.id}" data-time-slot="evening">晚</button>
                </div>
            </div>
        `;
    }).join('');
}

export function renderAssessmentPage() {
    const container = document.getElementById('assessment-log-container');
    if (!container) return;
    
    const records = storage.getAssessmentRecords();
    if (records.length === 0) {
        container.innerHTML = `<p>目前沒有記錄。</p>`;
        return;
    }

    container.innerHTML = records.slice().reverse().map(rec => {
        const date = new Date(rec.timestamp);
        const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return `
            <div class="log-item">
                <span class="log-item-date">${formattedDate}</span>
                <span class="log-item-level">程度: ${rec.level}</span>
            </div>
        `;
    }).join('');
}

export function renderSettingsPage() {
    const settings = storage.getSettings();
    const remindersEnabled = document.getElementById('reminders-enabled');
    const morningTime = document.getElementById('morning-time');
    const noonTime = document.getElementById('noon-time');
    const eveningTime = document.getElementById('evening-time');

    if(remindersEnabled) remindersEnabled.checked = settings.remindersEnabled;
    if(morningTime) morningTime.value = settings.morningTime;
    if(noonTime) noonTime.value = settings.noonTime;
    if(eveningTime) eveningTime.value = settings.eveningTime;
}

const modalContainer = document.getElementById('modal-container');
const alarmModal = document.getElementById('alarm-modal');
const assessmentModal = document.getElementById('assessment-modal');
const exerciseModal = document.getElementById('exercise-modal');

export function showAlarmModal() {
    modalContainer.classList.remove('hidden');
    alarmModal.classList.remove('hidden');
}

export function hideAlarmModal() {
    modalContainer.classList.add('hidden');
    alarmModal.classList.add('hidden');
}

export function showAssessmentModal() {
    document.getElementById('numbness-level').value = 5;
    document.getElementById('numbness-value').textContent = 5;
    modalContainer.classList.remove('hidden');
    assessmentModal.classList.remove('hidden');
}

export function hideAssessmentModal() {
    modalContainer.classList.add('hidden');
    assessmentModal.classList.add('hidden');
}

export function showExerciseModal(exercise = null) {
    const title = document.getElementById('exercise-modal-title');
    const idInput = document.getElementById('exercise-id');
    const nameInput = document.getElementById('exercise-name');
    const deleteBtn = document.getElementById('delete-exercise-btn');

    if (exercise) {
        title.textContent = '編輯運動';
        idInput.value = exercise.id;
        nameInput.value = exercise.name;
        deleteBtn.classList.remove('hidden');
    } else {
        title.textContent = '新增運動';
        idInput.value = '';
        nameInput.value = '';
        deleteBtn.classList.add('hidden');
    }

    modalContainer.classList.remove('hidden');
    exerciseModal.classList.remove('hidden');
}

export function hideExerciseModal() {
    modalContainer.classList.add('hidden');
    exerciseModal.classList.add('hidden');
}

export function init() {
    mainContent.innerHTML = '';
    createHomePage();
    createAssessmentPage();
    createSettingsPage();
}