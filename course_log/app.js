import { loadData, getState, setState, saveState } from './storage.js';
import { renderClassList, showView, renderClassDetail, closeModal } from './ui.js';
import {
    handleClassListClick,
    handleAddClass,
    handleBackToList,
    handleModalFormSubmit,
    handleRecordFormSubmit,
    handleHistoryClick,
    handleCopyRecord,
    handleImport,
    handleExport,
    initAudio,
} from './handlers.js';

document.addEventListener('DOMContentLoaded', () => {
    // 初始化應用程式
    loadData();
    initAudio();

    // 初始渲染
    renderClassList(getState().classes);
    showView('class-list-view');

    // 設定事件監聽器
    document.getElementById('class-list').addEventListener('click', handleClassListClick);
    document.getElementById('add-class-btn').addEventListener('click', handleAddClass);
    document.getElementById('back-to-list-btn').addEventListener('click', handleBackToList);
    document.getElementById('modal-form').addEventListener('submit', handleModalFormSubmit);
    document.getElementById('record-form').addEventListener('submit', handleRecordFormSubmit);
    document.getElementById('record-form-container').addEventListener('click', handleCopyRecord);
    document.getElementById('progress-history').addEventListener('click', handleHistoryClick);
    document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', handleImport);
    document.getElementById('export-btn').addEventListener('click', handleExport);
    document.querySelector('.modal-close-btn').addEventListener('click', closeModal);
});