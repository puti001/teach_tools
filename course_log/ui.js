import { getState } from './storage.js';
import { getRecordDataFromForm } from './util.js';

const COMMON_HOMEWORK = ["寫課本", "寫習作", "改錯", "簽名", "預習"];

export function showView(viewId) {
    document.querySelectorAll('main > div').forEach(view => view.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
}

export function renderClassList(classes) {
    const classListEl = document.getElementById('class-list');
    if (classes.length === 0) {
        classListEl.innerHTML = `<p>目前沒有班級，請點擊右下角按鈕新增。</p>`;
        return;
    }
    classListEl.innerHTML = classes.map(c => {
        const lastRecord = c.records.length > 0 ? c.records[c.records.length - 1] : null;
        const summary = lastRecord 
            ? `${lastRecord.date} - ${lastRecord.textbook || lastRecord.workbook || '完成'}`
            : '尚無紀錄';
        const textColorClass = c.color ? 'light-text' : '';
        return `
            <div class="class-card ${textColorClass}" data-id="${c.id}" data-color="${c.color || 'default'}">
                <h3>${c.name}</h3>
                <p class="summary">${summary}</p>
                <div class="card-actions">
                    <button data-action="edit-class" title="編輯班級">&#9998;</button>
                    <button data-action="delete-class" title="刪除班級">&#128465;</button>
                </div>
            </div>
        `;
    }).join('');
}

export function renderClassDetail(classId) {
    const classData = getState().classes.find(c => c.id === classId);
    if (!classData) return;

    document.getElementById('class-detail-title').textContent = classData.name;
    renderRecordForm();
    renderProgressHistory(classData.records);
    showView('class-detail-view');
}

export function renderRecordForm(record) {
    const form = document.getElementById('record-form');
    const today = new Date().toISOString().substring(0, 10);
    form.innerHTML = `
        <input type="hidden" name="id" value="${record?.id || ''}">
        <div class="form-group">
            <label for="date">日期</label>
            <input type="date" id="date" name="date" value="${record?.date || today}" required>
        </div>
        <div class="form-group">
            <label for="textbook">課本進度 (如: 第3課 P.25–30)</label>
            <input type="text" id="textbook" name="textbook" value="${record?.textbook || ''}" placeholder="課次、頁數...">
        </div>
        <div class="form-group">
            <label for="workbook">習作進度</label>
            <input type="text" id="workbook" name="workbook" value="${record?.workbook || ''}" placeholder="頁數...">
        </div>
        <div class="form-group">
            <label>回家作業</label>
            <div class="checkbox-group">
                ${COMMON_HOMEWORK.map(h => `
                    <label>
                        <input type="checkbox" name="homework" value="${h}" ${record?.homework?.includes(h) ? 'checked' : ''}>
                        ${h}
                    </label>
                `).join('')}
            </div>
            <input type="text" name="homework_other" placeholder="其他作業..." value="${record?.homework?.filter(h => !COMMON_HOMEWORK.includes(h)).join(' ') || ''}">
        </div>
        <div class="form-group">
            <label for="assessment">評量</label>
            <input type="text" id="assessment" name="assessment" value="${record?.assessment || ''}" placeholder="評量名稱 (如: 小考1)">
        </div>
        <div class="form-group">
            <label for="notes">備註</label>
            <input type="text" id="notes" name="notes" value="${record?.notes || ''}" placeholder="簡短備註...">
        </div>
        <div style="display: flex; gap: 1rem;">
            <button type="submit">${record ? '更新進度' : '儲存進度'}</button>
            ${record ? '' : '<button type="button" id="copy-record-btn" class="secondary-btn" style="border-color: var(--primary-color); color: var(--primary-color);">複製到其他班</button>'}
        </div>
    `;
}

export function renderProgressHistory(records) {
    const historyEl = document.getElementById('progress-history');

    if (records.length === 0) {
        historyEl.innerHTML = `<p>尚無歷史紀錄。</p>`;
        return;
    }

    historyEl.innerHTML = [...records].reverse().map((r, index) => {
        const isExpanded = index === 0;
        return `
        <div class="record-card ${isExpanded ? 'expanded' : ''}" data-id="${r.id}">
            <div class="record-header">
                <h4>${r.date}</h4>
                <div class="card-actions">
                    <button data-action="edit-record" title="編輯紀錄">&#9998;</button>
                    <button data-action="delete-record" title="刪除紀錄">&#128465;</button>
                </div>
            </div>
            <div class="record-body">
                ${r.textbook ? `<div class="record-item"><strong>課本:</strong> ${r.textbook}</div>` : ''}
                ${r.workbook ? `<div class="record-item"><strong>習作:</strong> ${r.workbook}</div>` : ''}
                ${r.homework && r.homework.length > 0 ? `<div class="record-item"><strong>作業:</strong> ${r.homework.join(', ')}</div>` : ''}
                ${r.assessment ? `<div class="record-item"><strong>評量:</strong> ${r.assessment}</div>` : ''}
                ${r.notes ? `<div class="record-item"><strong>備註:</strong> ${r.notes}</div>` : ''}
            </div>
        </div>
    `}).join('');
}

export function openModal(title, formHTML, submitText) {
    document.getElementById('modal-title').textContent = title;
    const modalForm = document.getElementById('modal-form');
    modalForm.innerHTML = `
        ${formHTML}
        <button type="submit">${submitText}</button>
    `;
    document.getElementById('modal-container').classList.remove('hidden');
}

export function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}