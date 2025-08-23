const KEYS = {
    EXERCISES: 'rehab_exercises',
    CHECK_INS: 'rehab_check_ins',
    ASSESSMENT: 'rehab_assessment',
    SETTINGS: 'rehab_settings',
};

const DEFAULT_EXERCISES = [
    { id: 'decompression', name: '減壓運動', custom: false },
    { id: 'nerve-gliding', name: '神經滑動', custom: false },
    { id: 'pelvic-tilt', name: '骨盆後傾', custom: false },
    { id: 'bridge', name: '橋式', custom: false },
    { id: 'bird-dog', name: '鳥狗式', custom: false },
    { id: 'clamshell', name: '蚌式', custom: false },
    { id: 'dead-bug', name: '死蟲式', custom: false },
    { id: 'stretch', name: '身伸長', custom: false },
    { id: 'stretching-bench', name: '拉筋凳', custom: false },
];

const DEFAULT_SETTINGS = {
    remindersEnabled: true,
    morningTime: '10:20',
    noonTime: '16:00',
    eveningTime: '19:30',
};

function getItem(key, defaultValue) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
}

function setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function init() {
    if (!localStorage.getItem(KEYS.EXERCISES)) {
        setItem(KEYS.EXERCISES, DEFAULT_EXERCISES);
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
        setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
}

// Exercises
export const getExercises = () => getItem(KEYS.EXERCISES, []);
export const saveExercises = (exercises) => setItem(KEYS.EXERCISES, exercises);

// Check-ins
export function getCheckInsForDate(dateString) {
    const allCheckIns = getItem(KEYS.CHECK_INS, {});
    return allCheckIns[dateString] || {};
}

export function saveCheckInsForDate(dateString, data) {
    const allCheckIns = getItem(KEYS.CHECK_INS, {});
    allCheckIns[dateString] = data;
    setItem(KEYS.CHECK_INS, allCheckIns);
}

// Assessment Records
export const getAssessmentRecords = () => getItem(KEYS.ASSESSMENT, []);
export const addAssessmentRecord = (record) => {
    const records = getAssessmentRecords();
    records.push(record);
    setItem(KEYS.ASSESSMENT, records);
};

// Settings
export const getSettings = () => getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
export const saveSettings = (settings) => setItem(KEYS.SETTINGS, settings);

// Data Management
export function exportData() {
    const data = {
        exercises: getExercises(),
        checkIns: getItem(KEYS.CHECK_INS, {}),
        assessment: getAssessmentRecords(),
        settings: getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `puti-ai-rehab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importData(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject('No file selected');
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.exercises) setItem(KEYS.EXERCISES, data.exercises);
                if (data.checkIns) setItem(KEYS.CHECK_INS, data.checkIns);
                if (data.assessment) setItem(KEYS.ASSESSMENT, data.assessment);
                if (data.settings) setItem(KEYS.SETTINGS, data.settings);
                alert('資料匯入成功！');
                resolve();
            } catch (error) {
                alert('匯入失敗，檔案格式錯誤。');
                reject(error);
            }
        };
        reader.onerror = (error) => {
            alert('讀取檔案失敗。');
            reject(error);
        };
        reader.readAsText(file);
    });
}