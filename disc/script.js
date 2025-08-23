document.addEventListener('DOMContentLoaded', () => {
    const feedback = {
        audioContext: null,
        soundBuffers: {},

        init() {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.preloadSounds();
        },

        preloadSounds() {
            const sounds = {
                click: 'click.mp3',
                checkIn: 'check-in.mp3',
                delete: 'delete.mp3'
            };
            for (const key in sounds) {
                this.loadSound(key, sounds[key]);
            }
        },

        async loadSound(name, url) {
            if (!this.audioContext) return;
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.soundBuffers[name] = audioBuffer;
            } catch (error) {
                console.error(`Error loading sound: ${name}`, error);
            }
        },

        playSound(name) {
            if (!this.audioContext || !this.soundBuffers[name]) return;
            // Resume context on user gesture
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            const source = this.audioContext.createBufferSource();
            source.buffer = this.soundBuffers[name];
            source.connect(this.audioContext.destination);
            source.start(0);
        },

        vibrate(pattern = 50) {
            if ('vibrate' in navigator) {
                try {
                    navigator.vibrate(pattern);
                } catch (e) {
                    console.warn("Vibration failed", e);
                }
            }
        }
    };
    feedback.init();

    const app = {
        // --- DOM ELEMENTS ---
        navExercises: document.getElementById('nav-exercises'),
        navAssessments: document.getElementById('nav-assessments'),
        exercisesView: document.getElementById('exercises-view'),
        assessmentsView: document.getElementById('assessments-view'),
        exerciseList: document.getElementById('exercise-list'),
        assessmentForm: document.getElementById('assessment-form'),
        assessmentList: document.getElementById('assessment-list'),
        numbnessDatetimeInput: document.getElementById('numbness-datetime'),
        numbnessSeverityInput: document.getElementById('numbness-severity'),
        numbnessSeverityValue: document.getElementById('numbness-severity-value'),
        exportBtn: document.getElementById('export-data'),
        importBtn: document.getElementById('import-data'),
        importFileInput: document.getElementById('import-file-input'),

        // --- APP DATA & STATE ---
        exercises: [
            '減壓運動', '神經滑動', '骨盆後傾', '橋式', 
            '鳥狗式', '蚌式', '死蟲式', '伸展'
        ],
        checkInData: {},
        assessments: [],

        // --- INITIALIZATION ---
        init() {
            this.loadData();
            this.setupEventListeners();
            this.renderExercises();
            this.renderAssessments();
            this.setDefaultDateTime();
            this.showView('exercises');
        },
        
        // --- DATA HANDLING ---
        loadData() {
            const checkIns = localStorage.getItem('rehabCheckIns');
            this.checkInData = checkIns ? JSON.parse(checkIns) : {};

            const assessmentsData = localStorage.getItem('rehabAssessments');
            this.assessments = assessmentsData ? JSON.parse(assessmentsData) : [];
        },

        saveData() {
            localStorage.setItem('rehabCheckIns', JSON.stringify(this.checkInData));
            localStorage.setItem('rehabAssessments', JSON.stringify(this.assessments));
        },

        // --- VIEW MANAGEMENT ---
        setupEventListeners() {
            this.navExercises.addEventListener('click', () => {
                feedback.playSound('click');
                this.showView('exercises');
            });
            this.navAssessments.addEventListener('click', () => {
                feedback.playSound('click');
                this.showView('assessments');
            });
            this.assessmentForm.addEventListener('submit', (e) => this.addAssessment(e));
            this.exportBtn.addEventListener('click', () => {
                feedback.playSound('click');
                this.exportData();
            });
            this.importBtn.addEventListener('click', () => {
                feedback.playSound('click');
                this.importFileInput.click();
            });
            this.importFileInput.addEventListener('change', (e) => this.importData(e));
            this.assessmentList.addEventListener('click', (e) => {
                 const deleteButton = e.target.closest('.record-delete-btn');
                 if (deleteButton) {
                    const recordId = deleteButton.dataset.id;
                    this.deleteAssessment(recordId);
                }
            });
            this.numbnessSeverityInput.addEventListener('input', () => {
                this.numbnessSeverityValue.textContent = this.numbnessSeverityInput.value;
            });
        },

        showView(viewName) {
            this.exercisesView.classList.add('hidden');
            this.assessmentsView.classList.add('hidden');
            this.navExercises.classList.remove('active');
            this.navAssessments.classList.remove('active');

            if (viewName === 'exercises') {
                this.exercisesView.classList.remove('hidden');
                this.navExercises.classList.add('active');
            } else {
                this.assessmentsView.classList.remove('hidden');
                this.navAssessments.classList.add('active');
            }
        },

        // --- EXERCISE LOGIC ---
        renderExercises() {
            this.exerciseList.innerHTML = '';
            const today = new Date().toISOString().slice(0, 10);

            this.exercises.forEach(name => {
                const li = document.createElement('li');
                li.className = 'exercise-item';
                li.dataset.name = name;

                const span = document.createElement('span');
                span.textContent = name;

                const button = document.createElement('button');
                button.className = 'check-in-btn';

                const lastCheckIn = this.checkInData[name];
                if (lastCheckIn === today) {
                    li.classList.add('checked');
                    button.innerHTML = '&#10003; 已完成';
                    button.disabled = true;
                } else {
                    button.textContent = '打卡';
                    button.addEventListener('click', () => this.checkIn(name));
                }
                
                li.appendChild(span);
                li.appendChild(button);
                this.exerciseList.appendChild(li);
            });
        },

        checkIn(exerciseName) {
            const today = new Date().toISOString().slice(0, 10);
            this.checkInData[exerciseName] = today;
            this.saveData();
            this.renderExercises(); // Re-render to update the state
            feedback.playSound('checkIn');
            feedback.vibrate();
        },
        
        // --- ASSESSMENT LOGIC ---
        setDefaultDateTime() {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            this.numbnessDatetimeInput.value = now.toISOString().slice(0, 16);
        },

        renderAssessments() {
            if (this.assessments.length === 0) {
                this.assessmentList.innerHTML = '<p>目前沒有記錄。</p>';
                return;
            }

            this.assessmentList.innerHTML = '';
            // Sort assessments by date, newest first
            const sortedAssessments = [...this.assessments].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

            sortedAssessments.forEach(record => {
                const el = document.createElement('div');
                el.className = 'assessment-record';
                
                const displayDate = new Date(record.datetime).toLocaleString('zh-TW', {
                    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                }).replace(/\//g, '-');

                el.innerHTML = `
                    <div class="record-main">
                        <p class="record-meta">${displayDate}</p>
                        <p><strong>麻木程度: ${record.severity}/10</strong></p>
                        ${record.notes ? `<p class="record-notes">${this.escapeHTML(record.notes)}</p>` : ''}
                    </div>
                    <button class="record-delete-btn" data-id="${record.id}" title="刪除記錄" aria-label="刪除此筆記錄">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                    </button>
                `;
                this.assessmentList.appendChild(el);
            });
        },
        
        escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;', '<': '&lt;', '>': '&gt;',
                    "'": '&#39;', '"': '&quot;'
                }[tag] || tag)
            );
        },

        addAssessment(e) {
            e.preventDefault();
            const datetime = this.numbnessDatetimeInput.value;
            const severity = this.numbnessSeverityInput.value;
            const notes = document.getElementById('numbness-notes').value.trim();

            if (!datetime) {
                alert('請選擇日期與時間');
                return;
            }

            const newRecord = {
                id: Date.now().toString(),
                datetime,
                severity,
                notes,
            };

            this.assessments.push(newRecord);
            this.saveData();
            this.renderAssessments();
            this.assessmentForm.reset();
            this.numbnessSeverityValue.textContent = '5'; // Reset slider value display
            this.setDefaultDateTime();
            feedback.playSound('checkIn');
            feedback.vibrate([100, 30, 100]);
        },

        deleteAssessment(recordId) {
            if (confirm('確定要刪除這筆記錄嗎？')) {
                this.assessments = this.assessments.filter(record => record.id !== recordId);
                this.saveData();
                this.renderAssessments();
                feedback.playSound('delete');
                feedback.vibrate();
            }
        },

        // --- IMPORT/EXPORT LOGIC ---
        exportData() {
            const dataToExport = {
                checkInData: this.checkInData,
                assessments: this.assessments
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().slice(0, 10);
            link.download = `puti-ai-rehab-backup-${date}.json`;
            link.click();
            URL.revokeObjectURL(url);
        },

        importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData.checkInData && importedData.assessments) {
                        if (confirm('確定要匯入資料嗎？這將會覆蓋現有資料。')) {
                            this.checkInData = importedData.checkInData;
                            this.assessments = importedData.assessments;
                            this.saveData();
                            this.renderExercises();
                            this.renderAssessments();
                            alert('資料匯入成功！');
                        }
                    } else {
                        alert('檔案格式不符，匯入失敗。');
                    }
                } catch (error) {
                    alert('讀取檔案時發生錯誤，請確認檔案是否正確。');
                    console.error('Import error:', error);
                } finally {
                    // Reset file input to allow re-importing the same file
                    this.importFileInput.value = '';
                }
            };
            reader.readAsText(file);
        }
    };

    app.init();
});