import { getState, setState, saveState, findClass, findRecord } from './storage.js';
import { renderClassList, renderClassDetail, openModal, closeModal, renderRecordForm } from './ui.js';
import { getRecordDataFromForm } from './util.js';

let audioContext;
let clickBuffer;

export function initAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fetch('click.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
        .then(decodedData => {
            clickBuffer = decodedData;
        });
}

function playClickSound() {
    if (!clickBuffer || audioContext.state === 'suspended') return;
    const source = audioContext.createBufferSource();
    source.buffer = clickBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// --- Class Handlers ---

export function handleAddClass() {
    playClickSound();
    setState({ editingRecordId: null }); // Clear editing state
    openModal(
        '新增班級',
        `<div class="form-group">
            <label for="class-name">班級-科目名稱</label>
            <input type="text" id="class-name" name="className" required placeholder="例如：三忠-自然">
         </div>`,
        '新增'
    );
}

function handleEditClass(classId) {
    const classData = findClass(classId);
    if (!classData) return;
    
    openModal(
        '編輯班級',
        `<input type="hidden" name="classId" value="${classId}">
         <div class="form-group">
            <label for="class-name">班級名稱</label>
            <input type="text" id="class-name" name="className" required value="${classData.name}">
         </div>
         <div class="form-group">
            <label>班級顏色</label>
            <div class="color-selector">
                <div class="color-dot" data-color="default" title="預設"></div>
                <div class="color-dot" data-color="1" title="淡藍"></div>
                <div class="color-dot" data-color="2" title="淡綠"></div>
                <div class="color-dot" data-color="3" title="淡橘"></div>
                <div class="color-dot" data-color="4" title="淡紫"></div>
                <div class="color-dot" data-color="5" title="淡紅"></div>
            </div>
            <input type="hidden" name="classColor" value="${classData.color || 'default'}">
         </div>
         `,
        '更新'
    );

    // Add event listeners for color dots inside the modal
    const modalContent = document.querySelector('.modal-content');
    modalContent.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            modalContent.querySelector('.color-dot.selected')?.classList.remove('selected');
            dot.classList.add('selected');
            modalContent.querySelector('input[name="classColor"]').value = dot.dataset.color;
        });
    });
    // Set initial selected state
    const currentColor = classData.color || 'default';
    modalContent.querySelector(`.color-dot[data-color="${currentColor}"]`)?.classList.add('selected');
}

function handleDeleteClass(classId) {
    const classData = findClass(classId);
    if (!classData || !confirm(`確定要刪除班級「${classData.name}」嗎？此動作無法復原。`)) {
        return;
    }
    let state = getState();
    state.classes = state.classes.filter(c => c.id !== classId);
    saveState();
    renderClassList(state.classes);
}

function handleChangeColor(classId) {
    // This function is now obsolete and replaced by the color picker in handleEditClass.
    // Kept here to avoid breaking anything, but it's no longer called.
}

export function handleClassListClick(e) {
    const target = e.target.closest('.class-card, .card-actions button');
    if (!target) return;
    
    playClickSound();

    const classCard = target.closest('.class-card');
    const classId = classCard.dataset.id;
    const action = target.dataset.action;

    if (action === 'edit-class') {
        handleEditClass(classId);
    } else if (action === 'delete-class') {
        handleDeleteClass(classId);
    } else if (classId) {
        setState({ currentClassId: classId });
        renderClassDetail(classId);
    }
}

export function handleBackToList() {
    playClickSound();
    setState({ currentClassId: null, editingRecordId: null });
    renderRecordForm(null); // Reset form
    renderClassList(getState().classes);
    document.getElementById('class-list-view').classList.remove('hidden');
    document.getElementById('class-detail-view').classList.add('hidden');
}

// --- Form Handlers ---

export function handleModalFormSubmit(e) {
    e.preventDefault();
    playClickSound();
    const formData = new FormData(e.target);
    const action = formData.get('action');

    if (action === 'copyRecord') {
        handleCopyRecordSubmit(formData);
        closeModal();
        return;
    }

    const classId = formData.get('classId');
    const className = formData.get('className').trim();
    if (!className) return;

    let state = getState();
    if (classId) { // Editing
        const classData = findClass(classId);
        if (classData) {
            classData.name = className;
            const colorValue = formData.get('classColor');
            classData.color = colorValue === 'default' ? null : parseInt(colorValue, 10);
        }
    } else { // Adding
        const newClass = { id: `c${Date.now()}`, name: className, records: [], color: null };
        state.classes.push(newClass);
    }
    
    saveState();
    renderClassList(state.classes);
    closeModal();
}

export function handleRecordFormSubmit(e) {
    e.preventDefault();
    playClickSound();
    const form = e.target;
    const { currentClassId, editingRecordId } = getState();
    const classData = findClass(currentClassId);
    if (!classData) return;

    const recordData = getRecordDataFromForm(form);
    recordData.id = editingRecordId || `r${Date.now()}`;

    if (editingRecordId) {
        const recordIndex = classData.records.findIndex(r => r.id === editingRecordId);
        if (recordIndex > -1) classData.records[recordIndex] = recordData;
    } else {
        classData.records.push(recordData);
    }
    
    setState({ editingRecordId: null });
    saveState();
    renderClassDetail(currentClassId); // Re-render detail view
}

// --- History Handlers ---

function handleEditRecord(recordId) {
    const { currentClassId } = getState();
    const record = findRecord(currentClassId, recordId);
    if (!record) return;

    setState({ editingRecordId: recordId });
    renderRecordForm(record);
    document.getElementById('record-form-container').scrollIntoView({ behavior: 'smooth' });
}

function handleDeleteRecord(recordId) {
    const { currentClassId } = getState();
    const classData = findClass(currentClassId);
    if (!classData) return;

    const record = findRecord(currentClassId, recordId);
    if (!record || !confirm(`確定要刪除 ${record.date} 的紀錄嗎？`)) {
        return;
    }

    classData.records = classData.records.filter(r => r.id !== recordId);
    saveState();
    renderClassDetail(currentClassId);
}

export function handleHistoryClick(e) {
    const actionButton = e.target.closest('button[data-action]');
    const recordCard = e.target.closest('.record-card');

    if (!recordCard) return;

    if (actionButton) {
        // Handle edit/delete clicks
        playClickSound();
        const recordId = recordCard.dataset.id;
        const action = actionButton.dataset.action;

        if (action === 'edit-record') {
            handleEditRecord(recordId);
        } else if (action === 'delete-record') {
            handleDeleteRecord(recordId);
        }
    } else {
        // Handle accordion toggle
        playClickSound();
        recordCard.classList.toggle('expanded');
    }
}

export function handleCopyRecord(e) {
    if (e.target.id !== 'copy-record-btn') return;

    playClickSound();

    const { classes, currentClassId } = getState();
    const otherClasses = classes.filter(c => c.id !== currentClassId);

    if (otherClasses.length === 0) {
        alert("沒有其他班級可以複製。");
        return;
    }

    const formHTML = `
        <input type="hidden" name="action" value="copyRecord">
        <p>請選擇要將此筆進度紀錄複製到哪些班級：</p>
        <div class="checkbox-group" style="flex-direction: column; align-items: flex-start; max-height: 200px; overflow-y: auto;">
            ${otherClasses.map(c => `
                <label>
                    <input type="checkbox" name="targetClassIds" value="${c.id}">
                    ${c.name}
                </label>
            `).join('')}
        </div>
    `;

    openModal('複製進度到其他班', formHTML, '確定複製');
}

function handleCopyRecordSubmit(formData) {
    const targetClassIds = formData.getAll('targetClassIds');
    if (targetClassIds.length === 0) return;

    const recordForm = document.getElementById('record-form');
    const recordData = getRecordDataFromForm(recordForm);
    
    const state = getState();
    targetClassIds.forEach(classId => {
        const targetClass = findClass(classId);
        if (targetClass) {
            const newRecord = { ...recordData, id: `r${Date.now()}-${classId}` };
            targetClass.records.push(newRecord);
        }
    });

    saveState();
    alert(`已成功複製紀錄到 ${targetClassIds.length} 個班級。`);
}

export function handleSubjectFilterChange(e) {
    playClickSound();
    const { currentClassId } = getState();
    const classData = findClass(currentClassId);
    if (classData) {
        renderClassDetail(currentClassId); // Re-rendering will apply the filter
    }
}

// --- Import/Export Handlers ---

export function handleExport() {
    playClickSound();
    const state = getState();
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `Puti-AI課程進度備份_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function handleImport(e) {
    playClickSound();
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm("匯入資料將會覆蓋現有所有資料，確定要繼續嗎？")) {
        e.target.value = ''; // Reset file input
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedState = JSON.parse(event.target.result);
            if (importedState && Array.isArray(importedState.classes)) {
                setState(importedState);
                saveState();
                alert("資料匯入成功！");
                location.reload(); // Reload to apply changes
            } else {
                alert("檔案格式錯誤，無法匯入。");
            }
        } catch (error) {
            alert("讀取檔案失敗，請確認檔案是否為正確的 JSON 格式。");
            console.error("Import error:", error);
        } finally {
            e.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}