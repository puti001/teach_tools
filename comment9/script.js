const traits = {
    ability: [
        "聰穎靈活", "理解力強", "領悟快速", "認真專注", "勤勉好學", "主動求知",
        "善於思考", "舉一反三", "觀察力佳", "表達清晰", "善於溝通", "勇於發表",
        "尚知努力", "穩健進步", "頗有潛力", "不夠認真", "欠缺專注", "怠忽學業",
        "理解較慢", "需多練習", "有待加強", "遲交作業"
    ],
    personality: [
        "自律自覺", "中規中矩", "溫順文靜", "誠實守分", "彬彬有禮", "開朗活潑",
        "樂觀正面", "內向害羞", "負責盡職", "粗心健忘", "公務被動"
    ],
    social: [
        "待人和善", "人緣良好", "善解人意", "樂於助人", "熱心服務", "具領導力",
        "友愛同學", "願意分享", "樂於合作", "不太合群", "較少互動", "不善合作",
        "較少參與", "過於自我", "計較爭吵"
    ],
    talent: [
        "語文能力強", "寫作天賦高", "口語表達強", "數理能力佳", "邏輯思維強",
        "計算能力好", "表演才能優", "美術天分佳", "音樂感佳", "運動能力強",
        "體能活動好", "動作協調佳", "創意點子多", "想像力豐富"
    ],
    custom: []
};

let selectedStudents = new Set();
let selectedTraits = new Set();
let studentsData = [];
let generatedPrompts = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeTraitButtons();
    loadFromLocalStorage();
    setupEventListeners();
});

function initializeTraitButtons() {
    Object.entries(traits).forEach(([category, traitList]) => {
        const container = document.querySelector(`.trait-group.${category} .buttons`);
        traitList.forEach(trait => {
            const button = document.createElement('button');
            button.textContent = trait;
            button.className = 'trait-button';
            button.onclick = () => toggleTrait(button, trait);
            container.appendChild(button);
        });
    });
}

function setupEventListeners() {
    document.getElementById('generateButtons').onclick = generateStudentButtons;
    document.getElementById('generate').onclick = generatePrompt;
    document.getElementById('copy').onclick = copyPrompt;
    document.getElementById('openAI').onclick = openAIWebsite;
    document.getElementById('reset').onclick = confirmReset;
    document.getElementById('addCustomTraits').onclick = addCustomTraits;
    document.getElementById('clearCustomTraits').onclick = clearCustomTraits;
    
    // 按下 Enter 鍵也可以新增自定義特質（使用 Ctrl+Enter）
    document.getElementById('customTraitInput').addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            addCustomTraits();
        }
    });
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
    const traits = Array.from(selectedTraits).join('、');
    
    // Generate individual prompts for each selected student
    const selectedStudentArray = Array.from(selectedStudents);
    selectedStudentArray.forEach(student => {
        const prompt = `請為${grade}年級的學生${student}，以正向、溫暖、鼓勵的語氣，根據學生特質{${traits}}，生成${wordCount}字的期末評語`;
        generatedPrompts.push({
            studentId: student.split('.')[0],
            prompt: prompt
        });
    });

    // Sort prompts by student ID and display all
    generatedPrompts.sort((a, b) => a.studentId.localeCompare(b.studentId));
    const promptDisplay = generatedPrompts.map(p => p.prompt).join('\n\n');
    document.getElementById('promptPreview').textContent = promptDisplay;
    
    saveToLocalStorage();

    // Hide selected student buttons
    selectedStudents.forEach(student => {
        const buttons = document.querySelectorAll('.student-button');
        buttons.forEach(button => {
            if (button.textContent === student) {
                button.style.display = 'none';
            }
        });
    });

    // Reset trait selections
    selectedTraits.clear();
    document.querySelectorAll('.trait-button').forEach(button => {
        button.classList.remove('selected');
    });
    selectedStudents.clear();
}

function copyPrompt() {
    const prompt = document.getElementById('promptPreview').textContent;
    if (!prompt) {
        alert('沒有可複製的提示詞！');
        return;
    }
    navigator.clipboard.writeText(prompt)
        .then(() => alert('提示詞已複製到剪貼簿！'))
        .catch(() => alert('複製失敗，請手動複製。'));
}

function openAIWebsite() {
    window.open('https://student.magicschool.ai/s/join?joinCode=GYDRVQ', '_blank');
}

function confirmReset() {
    if (confirm('確定要重置所有內容嗎？此操作無法復原！')) {
        if (confirm('再次確認要重置？')) {
            resetAll();
        }
    }
}

function resetAll() {
    document.getElementById('promptPreview').textContent = '';
    document.querySelectorAll('.student-button').forEach(button => {
        button.style.display = 'inline-block';
    });
    selectedStudents.clear();
    selectedTraits.clear();
    generatedPrompts = []; // Clear generated prompts
    document.querySelectorAll('.trait-button').forEach(button => {
        button.classList.remove('selected');
    });
    document.querySelectorAll('.student-button').forEach(button => {
        button.classList.remove('selected');
    });
    
    // 清空自定義特質輸入框
    document.getElementById('customTraitInput').value = '';
    
    localStorage.removeItem('promptGeneratorState');
}

function saveToLocalStorage() {
    const state = {
        grade: document.getElementById('grade').value,
        wordCount: document.getElementById('wordCount').value,
        prompt: document.getElementById('promptPreview').textContent,
        studentsData: studentsData,
        selectedStudents: Array.from(selectedStudents),
        generatedPrompts: generatedPrompts // Save generated prompts
    };
    localStorage.setItem('promptGeneratorState', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('promptGeneratorState');
    if (saved) {
        const state = JSON.parse(saved);
        document.getElementById('grade').value = state.grade;
        document.getElementById('wordCount').value = state.wordCount;
        document.getElementById('promptPreview').textContent = state.prompt;
        if (state.generatedPrompts) {
            generatedPrompts = state.generatedPrompts;
        }
        if (state.studentsData) {
            studentsData = state.studentsData;
            const studentNamesText = studentsData.map(s => s.name).join('\n');
            document.getElementById('studentNames').value = studentNamesText;
            generateStudentButtons();
            
            // Hide previously selected students
            if (state.selectedStudents) {
                state.selectedStudents.forEach(student => {
                    const buttons = document.querySelectorAll('.student-button');
                    buttons.forEach(button => {
                        if (button.textContent === student) {
                            button.style.display = 'none';
                        }
                    });
                });
            }
        }
    }
    
    // 載入自定義特質
    loadCustomTraitsFromStorage();
}

function addCustomTraits() {
    const input = document.getElementById('customTraitInput');
    const inputText = input.value.trim();
    
    if (!inputText) {
        alert('請輸入特質內容！');
        return;
    }
    
    // 分割文字，每行一個特質
    const newTraits = inputText.split('\n')
        .map(trait => trait.trim())
        .filter(trait => trait); // 過濾空行
    
    if (newTraits.length === 0) {
        alert('請輸入有效的特質內容！');
        return;
    }
    
    // 檢查總數量限制（現有 + 新增不超過60個）
    if (traits.custom.length + newTraits.length > 60) {
        alert(`新增後將超過60個特質限制！\n目前有 ${traits.custom.length} 個，嘗試新增 ${newTraits.length} 個`);
        return;
    }
    
    const container = document.querySelector('.trait-group.custom .buttons');
    let addedCount = 0;
    
    // 批量新增特質
    newTraits.forEach(traitText => {
        // 新增到自定義特質陣列
        traits.custom.push(traitText);
        
        // 建立按鈕
        const button = document.createElement('button');
        button.textContent = traitText;
        button.className = 'trait-button custom-trait-button';
        button.onclick = () => toggleTrait(button, traitText);
        
        // 新增刪除按鈕
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = '×';
        deleteBtn.className = 'delete-trait';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            removeCustomTrait(traitText, button);
        };
        button.appendChild(deleteBtn);
        
        container.appendChild(button);
        addedCount++;
    });
    
    // 清空輸入框
    input.value = '';
    
    // 儲存到localStorage
    saveCustomTraitsToStorage();
    
    alert(`成功新增 ${addedCount} 個自定義特質！\n目前總共有 ${traits.custom.length} 個自定義特質`);
}

function removeCustomTrait(trait, button) {
    if (confirm(`確定要刪除「${trait}」嗎？`)) {
        // 從陣列中移除
        const index = traits.custom.indexOf(trait);
        if (index > -1) {
            traits.custom.splice(index, 1);
        }
        
        // 從選中的特質中移除
        selectedTraits.delete(trait);
        
        // 移除按鈕
        button.remove();
        
        // 更新localStorage
        saveCustomTraitsToStorage();
    }
}

function clearCustomTraits() {
    if (traits.custom.length === 0) {
        alert('沒有自定義特質可以清空！');
        return;
    }
    
    if (confirm('確定要清空所有自定義特質嗎？此操作無法復原！')) {
        // 清空陣列
        traits.custom = [];
        
        // 移除所有自定義特質按鈕
        const container = document.querySelector('.trait-group.custom .buttons');
        container.innerHTML = '';
        
        // 從選中的特質中移除所有自定義特質
        traits.custom.forEach(trait => selectedTraits.delete(trait));
        
        // 更新localStorage
        saveCustomTraitsToStorage();
        
        alert('已清空所有自定義特質！');
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
        
        // 重新建立自定義特質按鈕
        const container = document.querySelector('.trait-group.custom .buttons');
        container.innerHTML = '';
        
        customTraits.forEach(trait => {
            const button = document.createElement('button');
            button.textContent = trait;
            button.className = 'trait-button custom-trait-button';
            button.onclick = () => toggleTrait(button, trait);
            
            // 新增刪除按鈕
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-trait';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                removeCustomTrait(trait, button);
            };
            button.appendChild(deleteBtn);
            
            container.appendChild(button);
        });
    }
}