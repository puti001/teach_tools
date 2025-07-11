document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let classes = {};
    let classDrawPools = {};
    let history = [];
    let currentDrawingClass = null;

    // --- Audio Context ---
    let audioCtx;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    document.body.addEventListener('click', initAudio, { once: true });

    // --- Sound Effects ---
    const sounds = {
        click: createSound('click.mp3'),
        success: createSound('success.mp3'),
        draw: createSound('draw.mp3'),
        error: createSound('error.mp3'),
        trash: createSound('trash.mp3'),
    };

    function createSound(url) {
        return async () => {
            if (!audioCtx) return;
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.start();
            } catch (e) {
                console.error("Error playing sound", e);
            }
        };
    }

    // --- DOM Elements ---
    const showAddClassPanelBtn = document.getElementById('show-add-class-panel-btn');
    const addClassPanel = document.getElementById('add-class-panel');
    const classNameInput = document.getElementById('class-name-input');
    const studentNamesInput = document.getElementById('student-names-input');
    const addClassBtn = document.getElementById('add-class-btn');
    const csvFileInput = document.getElementById('csv-file-input');
    const importCsvBtn = document.getElementById('import-csv-btn');
    const classListDiv = document.getElementById('class-list');
    
    const drawingModal = document.getElementById('drawing-modal');
    const drawingModalTitle = document.getElementById('drawing-modal-title');
    const numToDrawInput = document.getElementById('num-to-draw-input');
    const startDrawBtn = document.getElementById('start-draw-btn');
    const resetPoolBtn = document.getElementById('reset-pool-btn');
    const closeDrawingModalBtn = document.getElementById('close-drawing-modal-btn');
    const poolInfo = document.getElementById('pool-info');
    
    const resultOverlay = document.getElementById('result-overlay');
    const resultCard = document.getElementById('result-card');
    
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // --- Local Storage ---
    const saveState = () => {
        localStorage.setItem('putiAiPickerClasses', JSON.stringify(classes));
        localStorage.setItem('putiAiPickerHistory', JSON.stringify(history));
        localStorage.setItem('putiAiPickerPools', JSON.stringify(classDrawPools));
    };

    const loadState = () => {
        const savedClasses = localStorage.getItem('putiAiPickerClasses');
        const savedHistory = localStorage.getItem('putiAiPickerHistory');
        const savedPools = localStorage.getItem('putiAiPickerPools');
        if (savedClasses) {
            classes = JSON.parse(savedClasses);
        }
        if (savedHistory) {
            history = JSON.parse(savedHistory);
        }
        if (savedPools) {
            classDrawPools = JSON.parse(savedPools);
        }
    };

    // --- UI Rendering ---
    const renderClassCards = () => {
        classListDiv.innerHTML = '';
        if (Object.keys(classes).length === 0) {
            classListDiv.innerHTML = '<p style="text-align:center; color: #777; grid-column: 1 / -1;">尚未建立任何班級，請點擊上方按鈕新增。</p>';
            return;
        }

        const sortedClassNames = Object.keys(classes).sort();

        sortedClassNames.forEach(className => {
            const students = classes[className];
            const card = document.createElement('div');
            card.className = 'class-card';
            card.dataset.className = className;
            card.innerHTML = `
                <div class="class-card-header">
                    <h2>${className}</h2>
                    <button class="delete-class-btn" title="刪除班級"><i class="fas fa-times-circle"></i></button>
                </div>
                <div class="class-card-body">
                    <div class="student-count">${students.length}</div>
                    <div class="student-count-label">位學生</div>
                </div>
                <div class="class-card-footer">
                    <button class="action-btn draw-btn"><i class="fas fa-ticket-alt"></i> 抽籤</button>
                </div>
            `;
            classListDiv.appendChild(card);
        });
    };
    
    const renderHistory = () => {
        if (history.length === 0) {
            historySection.classList.add('hidden');
            return;
        }
        historySection.classList.remove('hidden');
        historyList.innerHTML = '';
        [...history].reverse().forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.timestamp}: [${item.className}] 抽中 ${item.students.join(', ')}`;
            historyList.appendChild(li);
        });
    };

    const updatePoolInfo = () => {
        const total = classes[currentDrawingClass]?.length || 0;
        const currentPool = classDrawPools[currentDrawingClass] || [];
        poolInfo.textContent = `籤筒狀態： ${currentPool.length} / ${total}`;
    };

    // --- Core Logic ---
    const handleAddClass = () => {
        const className = classNameInput.value.trim();
        const studentNames = studentNamesInput.value.trim().split('\n').map(s => s.trim()).filter(Boolean);

        if (!className || studentNames.length === 0) {
            alert('請輸入班級名稱和至少一位學生姓名！');
            sounds.error();
            return;
        }

        classes[className] = studentNames;
        classDrawPools[className] = [...studentNames]; // Initialize pool on creation
        saveState();
        renderClassCards();
        sounds.success();
        classNameInput.value = '';
        studentNamesInput.value = '';
        addClassPanel.classList.add('hidden');
    };

    const handleImportCsv = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            const rows = text.split('\n').filter(Boolean);
            let importedCount = 0;
            try {
                rows.forEach(row => {
                    const [className, studentName] = row.split(',').map(s => s.trim());
                    if (className && studentName) {
                        if (!classes[className]) {
                            classes[className] = [];
                            classDrawPools[className] = []; // Initialize pool for new class
                        }
                        if (!classes[className].includes(studentName)) {
                            classes[className].push(studentName);
                            classDrawPools[className].push(studentName); // Add to pool as well
                            importedCount++;
                        }
                    }
                });
                if (importedCount > 0) {
                    saveState();
                    renderClassCards();
                    sounds.success();
                    alert(`成功匯入 ${importedCount} 筆學生資料！`);
                } else {
                    alert('未找到可匯入的新資料，或格式不符 (應為：班級,姓名)。');
                    sounds.error();
                }
            } catch (err) {
                alert('匯入失敗，請檢查檔案格式。');
                sounds.error();
            }
            csvFileInput.value = ''; // Reset file input
            addClassPanel.classList.add('hidden');
        };
        reader.readAsText(file);
    };

    const handleDeleteClass = (className) => {
        if (confirm(`確定要刪除「${className}」嗎？此操作無法復原。`)) {
            delete classes[className];
            delete classDrawPools[className]; // Also delete the class pool
            sounds.trash();
            saveState();
            renderClassCards();
        }
    };

    const openDrawingModal = (className) => {
        currentDrawingClass = className;
        // If a pool for the class doesn't exist, or is empty, reset it.
        if (!classDrawPools[className] || classDrawPools[className].length === 0) {
            classDrawPools[className] = [...(classes[className] || [])];
            // Don't save state here, let reset button be explicit
        }
        drawingModalTitle.textContent = `從「${className}」抽籤`;
        numToDrawInput.max = classDrawPools[className].length;
        updatePoolInfo();
        drawingModal.classList.remove('hidden');
    };
    
    const closeDrawingModal = () => {
        drawingModal.classList.add('hidden');
        currentDrawingClass = null;
    };

    const handleDraw = () => {
        const numToDraw = parseInt(numToDrawInput.value, 10);
        const withReplacement = document.getElementById('draw-with-replacement').checked;
        const currentPool = classDrawPools[currentDrawingClass];

        if (numToDraw <= 0) {
            alert('請輸入有效的抽籤數量。');
            sounds.error();
            return;
        }
        if (!withReplacement && numToDraw > currentPool.length) {
            alert('籤筒中的學生數量不足！');
            sounds.error();
            return;
        }
        
        sounds.draw();

        let drawnStudents = [];
        let tempPoolForDrawing = [...currentPool]; // Create a copy to draw from

        for (let i = 0; i < numToDraw; i++) {
            if (tempPoolForDrawing.length === 0) break;
            const randomIndex = Math.floor(Math.random() * tempPoolForDrawing.length);
            const student = tempPoolForDrawing[randomIndex];
            drawnStudents.push(student);
            
            // Always remove from the temporary pool to avoid drawing the same person in a single multi-draw
            tempPoolForDrawing.splice(randomIndex, 1);
        }
        
        // If drawing without replacement, update the actual persistent pool
        if (!withReplacement) {
            drawnStudents.forEach(student => {
                const indexInOriginalPool = currentPool.indexOf(student);
                if (indexInOriginalPool > -1) {
                    currentPool.splice(indexInOriginalPool, 1);
                }
            });
        }
        
        displayResults(drawnStudents);
        
        const timestamp = new Date().toLocaleString('zh-TW', { hour12: false });
        history.push({ className: currentDrawingClass, students: drawnStudents, timestamp });
        saveState();
        renderHistory();
        updatePoolInfo();
    };

    const displayResults = (students) => {
        closeDrawingModal();
        let studentIndex = 0;
        
        const showNextStudent = () => {
            if (studentIndex >= students.length) {
                resultOverlay.classList.add('hidden');
                resultCard.classList.remove('show');
                return;
            }

            const student = students[studentIndex];
            resultCard.textContent = student;
            resultOverlay.classList.remove('hidden');
            
            // Force reflow for animation restart
            resultCard.classList.remove('show');
            void resultCard.offsetWidth;
            resultCard.classList.add('show');
            
            studentIndex++;
            setTimeout(showNextStudent, 2500); // Display each student for 2.5 seconds
        };
        
        showNextStudent();
    };


    const handleResetPool = () => {
        if (currentDrawingClass) {
            classDrawPools[currentDrawingClass] = [...classes[currentDrawingClass]];
            updatePoolInfo();
            saveState(); // Save the reset pool state
            sounds.success();
            alert(`「${currentDrawingClass}」的籤筒已重置！`);
        }
    };

    const handleClearHistory = () => {
        if (confirm('確定要清除所有歷史紀錄嗎？')) {
            history = [];
            sounds.trash();
            saveState();
            renderHistory();
        }
    };

    // --- Event Listeners ---
    showAddClassPanelBtn.addEventListener('click', () => {
        sounds.click();
        addClassPanel.classList.toggle('hidden');
    });

    addClassBtn.addEventListener('click', handleAddClass);
    importCsvBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', handleImportCsv);
    
    classListDiv.addEventListener('click', e => {
        const card = e.target.closest('.class-card');
        if (!card) return;

        const className = card.dataset.className;
        if (e.target.closest('.delete-class-btn')) {
            handleDeleteClass(className);
        } else if (e.target.closest('.draw-btn')) {
            sounds.click();
            openDrawingModal(className);
        }
    });

    startDrawBtn.addEventListener('click', handleDraw);
    resetPoolBtn.addEventListener('click', handleResetPool);
    closeDrawingModalBtn.addEventListener('click', closeDrawingModal);
    clearHistoryBtn.addEventListener('click', handleClearHistory);
    resultOverlay.addEventListener('click', () => { // Allow clicking overlay to close result
        resultOverlay.classList.add('hidden');
        resultCard.classList.remove('show');
    });
    
    // --- Tabs ---
    window.openTab = (evt, tabName) => {
        sounds.click();
        let i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tab-link");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";
    }

    // --- Initialization ---
    loadState();
    renderClassCards();
    renderHistory();
});