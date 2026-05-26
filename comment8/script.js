const traits = {
    ability: {
        title: "資質與態度",
        good: ["聰穎靈活", "理解力強", "領悟快速", "認真專注", "勤勉好學", "主動求知", "善於思考", "舉一反三", "觀察力佳", "表達清晰"],
        middle: ["尚知努力", "穩健進步", "頗有潛力", "表現平穩", "遵照指示", "按部就班", "反應沉穩", "有心學習"],
        bad: ["不夠認真", "欠缺專注", "怠忽學業", "理解較慢", "需多練習", "有待加強", "遲交作業", "缺乏耐心"]
    },
    personality: {
        title: "個性與品德",
        good: ["自律自覺", "誠實守分", "彬彬有禮", "負責盡職", "溫柔敦厚", "樂觀正面", "謙虛有禮", "做事細心", "開朗活潑", "勇於承擔"],
        middle: ["中規中矩", "溫順文靜", "內向害羞", "情緒穩定", "偶爾分心", "依賴性強", "隨和溫順", "不爭不搶"],
        bad: ["粗心健忘", "公務被動", "情緒浮躁", "缺乏自信", "丟三落四", "言行散漫", "常找藉口", "易受影響"]
    },
    social: {
        title: "團體與人際",
        good: ["待人和善", "人緣良好", "善解人意", "樂於助人", "熱心服務", "具領導力", "友愛同學", "願意分享", "樂於合作", "具同理心"],
        middle: ["人際和諧", "較為安靜", "較少互動", "合作被動", "遵守常規", "發言保守", "隨大流", "不常表態"],
        bad: ["不太合群", "不善合作", "較少參與", "過於自我", "計較爭吵", "言詞尖銳", "排斥團體", "易起衝突"]
    },
    talent: {
        title: "專長與才藝",
        good: ["語文能力強", "寫作天賦高", "口語表達強", "數理能力佳", "邏輯思維強", "計算能力好", "表演才能優", "美術天分佳", "音樂感佳", "運動能力強"],
        middle: ["體能活動好", "動作協調佳", "創意點子多", "想像力豐富", "美感能力佳", "具審美觀", "手作能力佳", "喜愛閱讀"],
        bad: ["技能需磨練", "藝術少興趣", "體力需加強", "邏輯常卡關", "口頭表達弱", "手作不靈巧", "寫作需引導", "偏科較明顯"]
    },
    custom: []
};

let selectedStudents = new Set();
let selectedTraits = new Set();
let studentsData = [];
let generatedPrompts = [];
let currentTheme = 'blue';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initializeTraitButtons();
    setupEventListeners();
    updateHistoryDropdown();
    renderPromptPreview();
    updateCombinedPromptDisplay();
});

function initializeTraitButtons() {
    Object.entries(traits).forEach(([category, data]) => {
        const container = document.querySelector(`.trait-group.${category} .buttons`);
        if (!container) return;
        container.innerHTML = '';

        if (category === 'custom') {
            traits.custom.forEach(trait => {
                renderCustomTraitButton(container, trait);
            });
            return;
        }

        const levels = [
            { key: 'good', label: '優質評語 (Good)', className: 'level-good', btnClass: 'level-good-btn' },
            { key: 'middle', label: '中等評語 (Middle)', className: 'level-middle', btnClass: 'level-middle-btn' },
            { key: 'bad', label: '待加強的評語 (Needs Improvement)', className: 'level-bad', btnClass: 'level-bad-btn' }
        ];

        levels.forEach(level => {
            const levelList = data[level.key];
            if (!levelList || levelList.length === 0) return;

            const row = document.createElement('div');
            row.className = `trait-level-row ${level.className}`;

            const label = document.createElement('div');
            label.className = 'trait-level-label';
            label.textContent = level.label;
            row.appendChild(label);

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'trait-level-buttons';

            levelList.forEach(trait => {
                const button = document.createElement('button');
                button.textContent = trait;
                button.className = `trait-button ${level.btnClass}`;
                button.onclick = () => toggleTrait(button, trait);
                
                if (selectedTraits.has(trait)) {
                    button.classList.add('selected');
                }
                
                buttonsContainer.appendChild(button);
            });

            row.appendChild(buttonsContainer);
            container.appendChild(row);
        });
    });
}

function setupEventListeners() {
    document.getElementById('generateButtons').onclick = generateStudentButtons;
    document.getElementById('generate').onclick = generatePrompt;
    document.getElementById('copy').onclick = copyCombinedPrompt;
    document.getElementById('copyCombinedBtn').onclick = copyCombinedPrompt;
    document.getElementById('reset').onclick = confirmReset;
    document.getElementById('addCustomTraits').onclick = addCustomTraits;
    document.getElementById('clearCustomTraits').onclick = clearCustomTraits;
    
    // 歷史紀錄相關事件
    document.getElementById('saveHistoryBtn').onclick = saveCurrentToHistory;
    document.getElementById('historySelect').onchange = loadRecordFromHistory;
    document.getElementById('deleteHistoryBtn').onclick = deleteSelectedHistory;
    document.getElementById('exportFileBtn').onclick = exportTextFile;
    document.getElementById('exportJsonBtn').onclick = exportBackupJson;
    document.getElementById('importFile').onchange = importBackupJson;

    document.getElementById('customTraitInput').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            addCustomTraits();
        }
    });

    document.querySelectorAll('.theme-opt').forEach(opt => {
        opt.onclick = () => {
            const theme = opt.getAttribute('data-theme');
            setTheme(theme);
        };
    });
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    
    document.querySelectorAll('.theme-opt').forEach(opt => {
        if (opt.getAttribute('data-theme') === theme) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
    
    saveToLocalStorage();
}

function generateStudentButtons() {
    const names = document.getElementById('studentNames').value.split('\n')
        .map(name => name.trim())
        .filter(name => name);
    
    studentsData = names.map((name, index) => ({
        id: String(index + 1).padStart(2, '0'),
        name: name
    }));

    const container = document.getElementById('studentButtons');
    container.innerHTML = '';
    
    studentsData.forEach(student => {
        const button = document.createElement('button');
        button.className = 'student-button';
        button.textContent = `${student.id}.${student.name}`;
        button.onclick = () => toggleStudent(button, student);
        container.appendChild(button);
    });
    
    saveToLocalStorage();
}

function toggleStudent(button, student) {
    const studentKey = `${student.id}.${student.name}`;
    if (selectedStudents.has(studentKey)) {
        selectedStudents.delete(studentKey);
        button.classList.remove('selected');
    } else {
        selectedStudents.add(studentKey);
        button.classList.add('selected');
    }
}

function toggleTrait(button, trait) {
    if (selectedTraits.has(trait)) {
        selectedTraits.delete(trait);
        button.classList.remove('selected');
    } else {
        selectedTraits.add(trait);
        button.classList.add('selected');
    }
}

function generatePrompt() {
    if (selectedStudents.size === 0 || selectedTraits.size === 0) {
        alert('請選擇學生和特質！');
        return;
    }

    const grade = document.getElementById('grade').value;
    const wordCount = document.getElementById('wordCount').value;
    const traitsText = Array.from(selectedTraits).join('、');
    const template = document.getElementById('promptTemplate').value;
    
    const selectedStudentArray = Array.from(selectedStudents);
    selectedStudentArray.forEach(studentKey => {
        const [id, name] = studentKey.split('.');
        
        const prompt = template
            .replace(/{grade}/g, grade)
            .replace(/{name}/g, `${id}.${name}`)
            .replace(/{traits}/g, traitsText)
            .replace(/{wordCount}/g, wordCount);
            
        const existingIndex = generatedPrompts.findIndex(p => p.studentId === id);
        const promptData = {
            studentId: id,
            studentName: name,
            prompt: prompt,
            traits: Array.from(selectedTraits)
        };
        
        if (existingIndex > -1) {
            generatedPrompts[existingIndex] = promptData;
        } else {
            generatedPrompts.push(promptData);
        }

        const buttons = document.querySelectorAll('.student-button');
        buttons.forEach(button => {
            if (button.textContent === studentKey) {
                button.classList.add('generated');
                button.style.display = 'none';
            }
        });
    });

    renderPromptPreview();
    updateCombinedPromptDisplay();
    
    selectedTraits.clear();
    document.querySelectorAll('.trait-button').forEach(btn => btn.classList.remove('selected'));
    selectedStudents.clear();
    document.querySelectorAll('.student-button').forEach(btn => btn.classList.remove('selected'));
    
    saveToLocalStorage();
}

function updateCombinedPromptDisplay() {
    const textarea = document.getElementById('combinedPromptText');
    if (!textarea) return;
    
    if (generatedPrompts.length === 0) {
        textarea.value = '';
        return;
    }
    
    const grade = document.getElementById('grade').value;
    const wordCount = document.getElementById('wordCount').value;
    const template = document.getElementById('promptTemplate').value;
    
    let header = template
        .replace(/{grade}/g, grade)
        .replace(/{name}/g, '') // 刪除「以下學生」等贅字，直接接引導語
        .replace(/{traits}/g, '各學生特質')
        .replace(/{wordCount}/g, wordCount);
        
    if (!header.endsWith('\n') && !header.endsWith('：') && !header.endsWith(':')) {
        header += '：\n';
    } else if (!header.endsWith('\n')) {
        header += '\n';
    }
    
    const studentLines = generatedPrompts.map(p => {
        const traitsStr = p.traits.join('、');
        return `${p.studentId}.${p.studentName}{${traitsStr}}`;
    }).join('\n');
    
    textarea.value = header + studentLines;
}

function renderPromptPreview() {
    generatedPrompts.sort((a, b) => a.studentId.localeCompare(b.studentId));
    const previewContainer = document.getElementById('promptPreview');
    previewContainer.innerHTML = '';

    if (generatedPrompts.length === 0) {
        previewContainer.innerHTML = '<p style="color: #64748b; text-align: center; margin: 20px 0;">暫無已排入的學生</p>';
        return;
    }

    generatedPrompts.forEach(item => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '12px 20px';
        card.innerHTML = `
            <strong>${item.studentId}. ${item.studentName}</strong>
            <div class="card-actions">
                <button class="card-btn restore" onclick="restoreStudent('${item.studentId}', '${item.studentName}')">復原</button>
            </div>
        `;
        previewContainer.appendChild(card);
    });
}

window.restoreStudent = function(id, name) {
    generatedPrompts = generatedPrompts.filter(p => p.studentId !== id);
    renderPromptPreview();
    updateCombinedPromptDisplay();
    
    const studentKey = `${id}.${name}`;
    const buttons = document.querySelectorAll('.student-button');
    buttons.forEach(button => {
        if (button.textContent === studentKey) {
            button.classList.remove('generated');
            button.style.display = 'inline-block';
        }
    });
    saveToLocalStorage();
};

function copyCombinedPrompt() {
    const textarea = document.getElementById('combinedPromptText');
    if (!textarea || !textarea.value) {
        alert('沒有可複製的合併提示詞！');
        return;
    }
    navigator.clipboard.writeText(textarea.value)
        .then(() => showToast('全班合併提示詞已複製！'))
        .catch(() => alert('複製失敗，請手動複製。'));
}

// 歷史紀錄相關函式
function updateHistoryDropdown() {
    const select = document.getElementById('historySelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- 選擇載入歷史紀錄以進行編輯 --</option>';
    
    const savedHistory = localStorage.getItem('promptGeneratorHistory');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        Object.keys(history).sort().forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }
}

function saveCurrentToHistory() {
    const gradeVal = document.getElementById('grade').value;
    const gradeName = gradeVal ? `${gradeVal}年級` : '未指定年級';
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const baseName = `${rocYear}年${month}月{${gradeName}}評語提示詞紀錄`;
    
    let history = {};
    const savedHistory = localStorage.getItem('promptGeneratorHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }
    
    const uniqueName = getUniqueRecordName(baseName, Object.keys(history));
    
    const state = {
        grade: gradeVal,
        wordCount: document.getElementById('wordCount').value,
        template: document.getElementById('promptTemplate').value,
        studentsData: studentsData,
        generatedPrompts: generatedPrompts,
        theme: currentTheme
    };
    
    history[uniqueName] = state;
    localStorage.setItem('promptGeneratorHistory', JSON.stringify(history));
    
    updateHistoryDropdown();
    document.getElementById('historySelect').value = uniqueName;
    showToast(`已成功儲存紀錄：「${uniqueName}」`);
}

function getUniqueRecordName(baseName, existingNames) {
    if (!existingNames.includes(baseName)) {
        return baseName;
    }
    let counter = 1;
    while (existingNames.includes(`${baseName}_${counter}`)) {
        counter++;
    }
    return `${baseName}_${counter}`;
}

function loadRecordFromHistory() {
    const select = document.getElementById('historySelect');
    const selectedName = select.value;
    if (!selectedName) return;
    
    const savedHistory = localStorage.getItem('promptGeneratorHistory');
    if (savedHistory) {
        const history = JSON.parse(savedHistory);
        const state = history[selectedName];
        if (state) {
            document.getElementById('grade').value = state.grade || '';
            document.getElementById('wordCount').value = state.wordCount || '100';
            if (state.template) {
                document.getElementById('promptTemplate').value = state.template;
            }
            studentsData = state.studentsData || [];
            generatedPrompts = state.generatedPrompts || [];
            
            const studentNamesText = studentsData.map(s => s.name).join('\n');
            document.getElementById('studentNames').value = studentNamesText;
            generateStudentButtons();
            
            if (generatedPrompts.length > 0) {
                generatedPrompts.forEach(p => {
                    const studentKey = `${p.studentId}.${p.studentName}`;
                    const buttons = document.querySelectorAll('.student-button');
                    buttons.forEach(button => {
                        if (button.textContent === studentKey) {
                            button.classList.add('generated');
                            button.style.display = 'none';
                        }
                    });
                });
            }
            
            if (state.theme) {
                setTheme(state.theme);
            }
            
            renderPromptPreview();
            updateCombinedPromptDisplay();
            saveToLocalStorage();
            showToast(`已載入歷史紀錄：「${selectedName}」`);
        }
    }
}

function deleteSelectedHistory() {
    const select = document.getElementById('historySelect');
    const selectedName = select.value;
    if (!selectedName) {
        alert('請先選擇要刪除的紀錄！');
        return;
    }
    if (confirm(`確定要刪除此筆歷史紀錄嗎？「${selectedName}」`)) {
        const savedHistory = localStorage.getItem('promptGeneratorHistory');
        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            delete history[selectedName];
            localStorage.setItem('promptGeneratorHistory', JSON.stringify(history));
            updateHistoryDropdown();
            showToast(`已刪除紀錄：「${selectedName}」`);
        }
    }
}

function exportTextFile() {
    const textarea = document.getElementById('combinedPromptText');
    if (!textarea || !textarea.value) {
        alert('沒有可匯出的提示詞內容！');
        return;
    }
    
    const gradeVal = document.getElementById('grade').value;
    const gradeName = gradeVal ? `${gradeVal}年級` : '未指定年級';
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const filename = `${rocYear}年${month}月{${gradeName}}評語提示詞紀錄.txt`;
    
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`已下載純文字檔`);
}

function exportBackupJson() {
    const savedHistory = localStorage.getItem('promptGeneratorHistory') || '{}';
    const gradeVal = document.getElementById('grade').value;
    const gradeName = gradeVal ? `${gradeVal}年級` : '未指定年級';
    const now = new Date();
    const rocYear = now.getFullYear() - 1911;
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const filename = `${rocYear}年${month}月{${gradeName}}評語提示詞備份.json`;
    
    const blob = new Blob([savedHistory], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast(`已下載備份檔`);
}

function importBackupJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            let history = {};
            const savedHistory = localStorage.getItem('promptGeneratorHistory');
            if (savedHistory) {
                history = JSON.parse(savedHistory);
            }
            
            Object.assign(history, imported);
            localStorage.setItem('promptGeneratorHistory', JSON.stringify(history));
            updateHistoryDropdown();
            
            // 自動選取並載入匯入的第一筆紀錄
            const importedKeys = Object.keys(imported);
            if (importedKeys.length > 0) {
                const firstKey = importedKeys.sort()[0];
                document.getElementById('historySelect').value = firstKey;
                loadRecordFromHistory();
                showToast(`匯入成功，已自動載入紀錄：「${firstKey}」`);
            } else {
                showToast('匯入備份紀錄成功！');
            }
        } catch (err) {
            alert('匯入失敗：檔案格式不正確！');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function confirmReset() {
    if (confirm('確定要重置所有內容嗎？此操作無法復原！')) {
        if (confirm('再次確認要重置？')) {
            resetAll();
        }
    }
}

function resetAll() {
    document.getElementById('promptPreview').innerHTML = '<p style="color: #64748b; text-align: center; margin: 20px 0;">暫無已排入的學生</p>';
    const combinedText = document.getElementById('combinedPromptText');
    if (combinedText) combinedText.value = '';
    
    document.querySelectorAll('.student-button').forEach(button => {
        button.style.display = 'inline-block';
        button.classList.remove('selected', 'generated');
    });
    selectedStudents.clear();
    selectedTraits.clear();
    generatedPrompts = [];
    document.querySelectorAll('.trait-button').forEach(button => {
        button.classList.remove('selected');
    });
    
    document.getElementById('customTraitInput').value = '';
    localStorage.removeItem('promptGeneratorState');
    showToast('已重置所有資料');
}

function saveToLocalStorage() {
    const state = {
        grade: document.getElementById('grade').value,
        wordCount: document.getElementById('wordCount').value,
        template: document.getElementById('promptTemplate').value,
        studentsData: studentsData,
        generatedPrompts: generatedPrompts,
        theme: currentTheme
    };
    localStorage.setItem('promptGeneratorState', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('promptGeneratorState');
    if (saved) {
        const state = JSON.parse(saved);
        document.getElementById('grade').value = state.grade || '';
        document.getElementById('wordCount').value = state.wordCount || '100';
        if (state.template) {
            document.getElementById('promptTemplate').value = state.template;
        }
        if (state.generatedPrompts) {
            generatedPrompts = state.generatedPrompts;
        }
        if (state.theme) {
            setTheme(state.theme);
        } else {
            setTheme('blue');
        }
        if (state.studentsData) {
            studentsData = state.studentsData;
            const studentNamesText = studentsData.map(s => s.name).join('\n');
            document.getElementById('studentNames').value = studentNamesText;
            generateStudentButtons();
            
            if (generatedPrompts.length > 0) {
                generatedPrompts.forEach(p => {
                    const studentKey = `${p.studentId}.${p.studentName}`;
                    const buttons = document.querySelectorAll('.student-button');
                    buttons.forEach(button => {
                        if (button.textContent === studentKey) {
                            button.classList.add('generated');
                            button.style.display = 'none';
                        }
                    });
                });
            }
        }
    } else {
        setTheme('blue');
    }
    
    loadCustomTraitsFromStorage();
}

function addCustomTraits() {
    const input = document.getElementById('customTraitInput');
    const inputText = input.value.trim();
    
    if (!inputText) {
        alert('請輸入特質內容！');
        return;
    }
    
    const newTraits = inputText.split('\n')
        .map(trait => trait.trim())
        .filter(trait => trait);
    
    if (newTraits.length === 0) {
        alert('請輸入有效的特質內容！');
        return;
    }
    
    if (traits.custom.length + newTraits.length > 60) {
        alert(`新增後將超過60個特質限制！\n目前有 ${traits.custom.length} 個，嘗試新增 ${newTraits.length} 個`);
        return;
    }
    
    const container = document.querySelector('.trait-group.custom .buttons');
    if (!container) return;
    let addedCount = 0;
    
    newTraits.forEach(traitText => {
        traits.custom.push(traitText);
        renderCustomTraitButton(container, traitText);
        addedCount++;
    });
    
    input.value = '';
    saveCustomTraitsToStorage();
    showToast(`成功新增 ${addedCount} 個自定義特質！`);
}

function renderCustomTraitButton(container, traitText) {
    const button = document.createElement('button');
    button.textContent = traitText;
    button.className = 'trait-button custom-trait-button';
    button.onclick = () => toggleTrait(button, traitText);
    
    if (selectedTraits.has(traitText)) {
        button.classList.add('selected');
    }
    
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-trait';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        removeCustomTrait(traitText, button);
    };
    button.appendChild(deleteBtn);
    container.appendChild(button);
}

function removeCustomTrait(trait, button) {
    if (confirm(`確定要刪除「${trait}」嗎？`)) {
        const index = traits.custom.indexOf(trait);
        if (index > -1) {
            traits.custom.splice(index, 1);
        }
        selectedTraits.delete(trait);
        button.remove();
        saveCustomTraitsToStorage();
        showToast(`已刪除特質「${trait}」`);
    }
}

function clearCustomTraits() {
    if (traits.custom.length === 0) {
        alert('沒有自定義特質可以清空！');
        return;
    }
    
    if (confirm('確定要清空所有自定義特質嗎？此操作無法復原！')) {
        traits.custom.forEach(trait => selectedTraits.delete(trait));
        traits.custom = [];
        
        const container = document.querySelector('.trait-group.custom .buttons');
        if (container) container.innerHTML = '';
        
        saveCustomTraitsToStorage();
        showToast('已清空所有自定義特質');
    }
}

function saveCustomTraitsToStorage() {
    localStorage.setItem('customTraits', JSON.stringify(traits.custom));
}

function loadCustomTraitsFromStorage() {
    const saved = localStorage.getItem('customTraits');
    if (saved) {
        const customTraits = JSON.parse(saved);
        traits.custom = customTraits;
        
        const container = document.querySelector('.trait-group.custom .buttons');
        if (!container) return;
        container.innerHTML = '';
        
        customTraits.forEach(trait => {
            renderCustomTraitButton(container, trait);
        });
    }
}

function showToast(msg) {
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    toast.offsetHeight; // force reflow
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}

window.switchTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    if (tabId === 'generator') {
        document.getElementById('generatorTab').classList.add('active');
        document.getElementById('tabBtnGenerator').classList.add('active');
    } else {
        document.getElementById('guideTab').classList.add('active');
        document.getElementById('tabBtnGuide').classList.add('active');
    }
};