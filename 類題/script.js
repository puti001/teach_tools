const GEMINI_API_KEY = 'AIzaSyCBIbo5vf1OcRlj8-Ti8fvi9eytR0AAGCE';

// 頁面加載時從localStorage讀取上次的輸入
window.onload = function() {
    const savedInput = localStorage.getItem('lastQuestionInput');
    if (savedInput) {
        document.getElementById('questionInput').value = savedInput;
        updateWordCount(savedInput);
    }

    // 添加輸入監聽器
    document.getElementById('questionInput').addEventListener('input', function(e) {
        updateWordCount(e.target.value);
    });
};

// 添加字數統計函數
function updateWordCount(text) {
    const wordCount = text.length;
    const wordCountElement = document.querySelector('.word-count');
    
    wordCountElement.textContent = `字數：${wordCount} (建議：3,000-5,000字)`;
    
    // 根據字數改變提示顏色
    if (wordCount > 5000) {
        wordCountElement.classList.add('warning');
    } else {
        wordCountElement.classList.remove('warning');
    }
}

async function generateSimilarQuestions() {
    const questionInput = document.getElementById('questionInput').value.trim();
    if (!questionInput) {
        alert('請輸入題目文本');
        return;
    }

    // 添加字數檢查
    if (questionInput.length > 5000) {
        alert('輸入文字過長，請限制在 5,000 字以內');
        return;
    }

    // 保存當前輸入到localStorage
    localStorage.setItem('lastQuestionInput', questionInput);

    const generateBtn = document.querySelector('.generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = '生成中...';

    try {
        // 第一階段：生成類似題目
        const questionPrompt = `請協助改寫以下試題，要求如下：

關於題型格式：
1. 必須完全保持與原題相同的題型（例如：選擇題必須生成選擇題，問答題必須生成問答題）
2. 選項數量、格式必須與原題完全一致（例如：四選一必須生成四選一）
3. 作答方式必須與原題完全相同
4. 配分方式必須與原題一致
5. 選項標記方式必須與原題一致（例如：A.B.C.D. 或 (1)(2)(3)(4)）

關於內容改寫：
1. 必須有創意，完全更換題目情境、數字和主角，確保與原題有顯著差異
2. 保持原本的知識點、難度與評量目標不變
3. 內容必須與原題有至少95%以上的差異
4. 如果原題包含計算，新題目的計算難度必須相近
5. 確保新情境具有現實意義和邏輯性
6. 不得只是簡單替換數字或人名

關於排版格式：
1. 必須完全遵循原題的排版格式
2. 包含完整標題、作答說明
3. 保持原有的段落縮排和分行方式

原始題目：
${questionInput}

請生成新的試題（嚴格遵循以上所有要求）`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: questionPrompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(`API請求失敗: ${data.error?.message || response.statusText || '未知錯誤'}`);
        }

        const data = await response.json();
        const generatedQuestion = data.candidates[0].content.parts[0].text;

        // 第二階段：生成答案和解析
        const answerPrompt = `請針對以下試題提供詳細的答案和解析：

${generatedQuestion}

請提供：
1. 完整答案
2. 詳細的解題步驟
3. 關鍵解題概念說明
4. 重要知識點標註`;

        const answerResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: answerPrompt
                    }]
                }]
            })
        });

        if (!answerResponse.ok) {
            const data = await answerResponse.json();
            throw new Error(`API請求失敗: ${data.error?.message || answerResponse.statusText || '未知錯誤'}`);
        }

        const answerData = await answerResponse.json();
        const generatedAnswer = answerData.candidates[0].content.parts[0].text;

        // 顯示結果
        document.getElementById('questionResult').textContent = generatedQuestion;
        document.getElementById('answerResult').textContent = generatedAnswer;
        document.getElementById('resultSection').style.display = 'block';

        // 添加複製和下載按鈕
        addActionButtons();

        // 顯示成功通知
        alert('類似題目生成成功！');

    } catch (error) {
        console.error('Error:', error);
        alert('生成過程中發生錯誤，請稍後再試');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '生成類似題';
    }
}

function addActionButtons() {
    const resultSection = document.getElementById('resultSection');
    
    // 移除舊的按鈕（如果有）
    const oldButtons = resultSection.querySelectorAll('.action-buttons');
    oldButtons.forEach(button => button.remove());

    // 創建按鈕容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-buttons';
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    // 複製按鈕
    const copyButton = createActionButton('複製全部內容', async () => {
        const questionPart = document.getElementById('questionResult').textContent;
        const answerPart = document.getElementById('answerResult').textContent;
        const fullContent = `試題卷：\n${questionPart}\n\n答案卷：\n${answerPart}`;
        
        try {
            await navigator.clipboard.writeText(fullContent);
            alert('已複製到剪貼簿！');
        } catch (err) {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製');
        }
    });

    // 下載按鈕
    const downloadButton = createActionButton('下載文件', () => {
        const questionPart = document.getElementById('questionResult').textContent;
        const answerPart = document.getElementById('answerResult').textContent;
        const fullContent = `試題卷：\n${questionPart}\n\n答案卷：\n${answerPart}`;
        
        const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '類似題目.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(downloadButton);
    resultSection.appendChild(buttonContainer);
}

function createActionButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'generate-btn';
    button.style.width = 'auto';
    button.style.flex = '1';
    button.onclick = onClick;
    return button;
}