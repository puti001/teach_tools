import * as ui from 'ui';
import * as storage from 'storage';
import * as audio from 'audio';
import { getTodayDateString, getCurrentTime } from 'utils';

let alarmInterval;
let alarmAudio;

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageId);
    });
}

function handleCheckIn(exerciseId, timeSlot) {
    if ('vibrate' in navigator) navigator.vibrate(50);
    audio.playSound('checked');
    
    const today = getTodayDateString();
    let checkInData = storage.getCheckInsForDate(today);
    
    if (!checkInData[exerciseId]) {
        checkInData[exerciseId] = [];
    }
    checkInData[exerciseId].push(timeSlot);
    
    storage.saveCheckInsForDate(today, checkInData);
    ui.renderHomePage();
}

function handleSaveAssessment(level) {
    if ('vibrate' in navigator) navigator.vibrate(50);
    audio.playSound('checked');
    
    const record = {
        timestamp: Date.now(),
        level: level,
    };
    storage.addAssessmentRecord(record);
    ui.renderAssessmentPage();
}

function handleSaveExercise(id, name) {
    if ('vibrate' in navigator) navigator.vibrate(50);
    audio.playSound('checked');
    
    const exercises = storage.getExercises();
    if (id) { // Editing
        const index = exercises.findIndex(ex => ex.id === id);
        if (index > -1) {
            exercises[index].name = name;
        }
    } else { // Adding
        exercises.push({
            id: `custom-${Date.now()}`,
            name: name,
            custom: true,
        });
    }
    storage.saveExercises(exercises);
    ui.renderHomePage();
}

function handleDeleteExercise(id) {
    if ('vibrate' in navigator) navigator.vibrate(50);
    audio.playSound('click');
    
    let exercises = storage.getExercises();
    exercises = exercises.filter(ex => ex.id !== id);
    storage.saveExercises(exercises);
    
    // Also remove check-in data for this exercise for today
    const today = getTodayDateString();
    let checkInData = storage.getCheckInsForDate(today);
    delete checkInData[id];
    storage.saveCheckInsForDate(today, checkInData);
    
    ui.renderHomePage();
}

function checkAlarms() {
    const settings = storage.getSettings();
    if (!settings.remindersEnabled) return;

    const now = getCurrentTime();
    const times = [settings.morningTime, settings.noonTime, settings.eveningTime];

    if (times.includes(now)) {
        triggerAlarm();
    }
}

function triggerAlarm() {
    ui.showAlarmModal();
    alarmAudio = audio.playSound('alarm', true); // loop alarm
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);

    setTimeout(() => {
        if (alarmAudio) {
            dismissAlarm();
        }
    }, 30000); // Stop after 30 seconds
}

function dismissAlarm() {
    if (alarmAudio) {
        alarmAudio.stop();
        alarmAudio = null;
    }
    ui.hideAlarmModal();
}

function setupEventListeners() {
    document.getElementById('app-nav').addEventListener('click', (e) => {
        const navBtn = e.target.closest('.nav-btn');
        if (navBtn) {
            audio.playSound('click');
            navigateTo(navBtn.dataset.page);
        }
    });

    // Delegated event listeners for dynamic content
    document.getElementById('app-main').addEventListener('click', (e) => {
        const checkInBtn = e.target.closest('.check-in-btn:not(.checked)');
        if (checkInBtn) {
            const { exerciseId, timeSlot } = checkInBtn.dataset;
            handleCheckIn(exerciseId, timeSlot);
        }

        const editBtn = e.target.closest('.edit-exercise-btn');
        if(editBtn) {
            audio.playSound('click');
            const exerciseId = editBtn.dataset.exerciseId;
            const exercises = storage.getExercises();
            const exercise = exercises.find(ex => ex.id === exerciseId);
            ui.showExerciseModal(exercise);
        }

        if (e.target.id === 'add-exercise-btn') {
            audio.playSound('click');
            ui.showExerciseModal();
        }

        if (e.target.id === 'add-assessment-btn') {
            audio.playSound('click');
            ui.showAssessmentModal();
        }

        if(e.target.id === 'export-data-btn') {
            audio.playSound('click');
            storage.exportData();
        }

        if(e.target.id === 'import-data-btn') {
            audio.playSound('click');
            document.getElementById('import-file-input').click();
        }
    });

    document.getElementById('import-file-input')?.addEventListener('change', (e) => {
        storage.importData(e.target.files[0]).then(() => {
            init(); // Re-initialize app with new data
            navigateTo('settings');
        });
    });

    // Modal listeners
    document.getElementById('dismiss-alarm-btn').addEventListener('click', dismissAlarm);
    
    document.getElementById('assessment-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const level = document.getElementById('numbness-level').value;
        handleSaveAssessment(level);
        ui.hideAssessmentModal();
    });
    
    document.getElementById('cancel-assessment-btn').addEventListener('click', () => {
        audio.playSound('click');
        ui.hideAssessmentModal();
    });

    document.getElementById('exercise-form').addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('exercise-id').value;
        const name = document.getElementById('exercise-name').value;
        handleSaveExercise(id, name);
        ui.hideExerciseModal();
    });

    document.getElementById('cancel-exercise-btn').addEventListener('click', () => {
        audio.playSound('click');
        ui.hideExerciseModal();
    });

    document.getElementById('delete-exercise-btn').addEventListener('click', () => {
        const id = document.getElementById('exercise-id').value;
        if(confirm('確定要刪除這個運動嗎？')) {
            handleDeleteExercise(id);
            ui.hideExerciseModal();
        }
    });

    document.getElementById('numbness-level').addEventListener('input', e => {
        document.getElementById('numbness-value').textContent = e.target.value;
    });

    // Settings listeners
    document.addEventListener('change', e => {
        if (e.target.matches('#settings-page input')) {
            audio.playSound('click');
            const settings = storage.getSettings();
            settings.remindersEnabled = document.getElementById('reminders-enabled').checked;
            settings.morningTime = document.getElementById('morning-time').value;
            settings.noonTime = document.getElementById('noon-time').value;
            settings.eveningTime = document.getElementById('evening-time').value;
            storage.saveSettings(settings);
        }
    });
}

function init() {
    storage.init();
    audio.init();
    ui.init();
    navigateTo('home');
    setupEventListeners();

    // Set up alarm checker
    if (alarmInterval) clearInterval(alarmInterval);
    // Check every minute. Use timeout to align with the start of a minute.
    const seconds = new Date().getSeconds();
    setTimeout(() => {
        checkAlarms();
        alarmInterval = setInterval(checkAlarms, 60000);
    }, (60 - seconds) * 1000);

    console.log("App Initialized");
}

document.addEventListener('DOMContentLoaded', init);

