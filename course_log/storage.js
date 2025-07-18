let state = {
    classes: [],
    currentClassId: null,
    editingRecordId: null,
};

const DEFAULT_STATE = {
    classes: [
        { id: `c${Date.now()}`, name: "範例班級", records: [], color: 1 }
    ],
    currentClassId: null,
    editingRecordId: null,
};

export function loadData() {
    const data = localStorage.getItem('classProgressData');
    if (data) {
        Object.assign(state, JSON.parse(data));
    } else {
        Object.assign(state, DEFAULT_STATE);
        saveState();
    }
}

export function saveState() {
    localStorage.setItem('classProgressData', JSON.stringify(state));
}

export function getState() {
    return state;
}

export function setState(newState) {
    Object.assign(state, newState);
}

export function findClass(classId) {
    return state.classes.find(c => c.id === classId);
}

export function findRecord(classId, recordId) {
    const classData = findClass(classId);
    return classData ? classData.records.find(r => r.id === recordId) : null;
}