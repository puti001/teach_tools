const GEMINI_API_KEY = 'AIzaSyCBIbo5vf1OcRlj8-Ti8fvi9eytR0AAGCE';
const DEEPSEEK_API_KEY = 'sk-OQAQrg-kKjtU3TlFgEyK4A';

// DeepSeek API配置
const DEEPSEEK_CONFIG = {
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'application/json'
    }
};

// 頁面加載時從localStorage讀取上次的輸入
window.onload = function() {
    const savedInput = localStorage.getItem('lastQuestionInput');
    if (savedInput) {
        document.getElementById('questionInput').value = savedInput;
    }
};

async function generateSimilarQuestions() {
    const questionInput = document.getElementById('questionInput').value.trim();
    if (!questionInput) {
        alert('請輸入題目文本');
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
1. 必須完全更換題目情境、數字和主角，確保與原題有顯著差異
2. 保持原本的知識點、難度與評量目標不變
3. 題目內容必須與原題有至少90%以上的差異
4. 嚴格保持與原題完全相同的題型格式，包括題目結構、選項格式（如果有）和作答方式
5. 如果原題包含計算，新題目的計算難度必須相近
6. 確保新情境具有現實意義和邏輯性
7. 不得只是簡單替換數字或人名
8. 必須完全遵循原題的排版和格式要求

原始題目：
${questionInput}

請生成新的試題（包含完整標題、作答說明，嚴格依照原本版面配置）`;

        const apiSelect = document.getElementById('apiSelect').value;
        let questionResponses = [];
        
        if (apiSelect === 'gemini' || apiSelect === 'all') {
            const geminiResponse = fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
            questionResponses.push({ type: 'gemini', promise: geminiResponse });
        }

        if (apiSelect === 'deepseek' || apiSelect === 'all') {
            const deepseekResponse = fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: DEEPSEEK_CONFIG.headers,
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{
                        role: 'user',
                        content: questionPrompt
                    }]
                })
            });
            questionResponses.push({ type: 'deepseek', promise: deepseekResponse });
        }

        const responses = await Promise.all(questionResponses.map(async ({ type, promise }) => {
            try {
                const response = await promise;
                const errorData = await response.json().catch(() => ({}));
                
                if (!response.ok) {
                    if (type === 'deepseek' && errorData.error) {
                        throw new Error(`DeepSeek API請求失敗: ${errorData.error.message || errorData.error.type || '未知錯誤'}`);
                    }
                    throw new Error(`${type} API請求失敗: ${errorData.error?.message || response.statusText || '未知錯誤'}`);
                }
                
                return { type, data: errorData };
            } catch (error) {
                console.error(`${type} API Error:`, error);
                throw new Error(`${type} API請求失敗: ${error.message}`);
            }
        }));

        let generatedQuestions = [];
        for (const { type, data } of responses) {
            if (type === 'gemini') {
                generatedQuestions.push(data.candidates[0].content.parts[0].text);
            } else if (type === 'deepseek') {
                generatedQuestions.push(data.choices[0].message.content);
            }
        }

        // 第二階段：為每個生成的題目生成答案和解析
        let answerResponses = [];
        for (const generatedQuestion of generatedQuestions) {
            const answerPrompt = `請針對以下試題提供詳細的答案和解析：

${generatedQuestion}

請提供：
1. 完整答案
2. 詳細的解題步驟
3. 關鍵解題概念說明
4. 重要知識點標註`;

            if (apiSelect === 'gemini' || apiSelect === 'all') {
                const geminiAnswerResponse = fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
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
                answerResponses.push({ type: 'gemini', promise: geminiAnswerResponse });
            }

            if (apiSelect === 'deepseek' || apiSelect === 'all') {
                const deepseekAnswerResponse = fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: DEEPSEEK_CONFIG.headers,
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [{
                            role: 'user',
                            content: answerPrompt
                        }],
                        stream: false
                    })
                });
                answerResponses.push({ type: 'deepseek', promise: deepseekAnswerResponse });
            }
        }

        const answerResults = await Promise.all(answerResponses.map(async ({ type, promise }) => {
            const response = await promise;
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`${type} API請求失敗: ${errorData.error?.message || response.statusText || '未知錯誤'}`);
            }
            return { type, data: await response.json() };
        }));

        let generatedAnswers = [];
        for (const { type, data } of answerResults) {
            if (type === 'gemini') {
                generatedAnswers.push(data.candidates[0].content.parts[0].text);
            } else if (type === 'deepseek') {
                generatedAnswers.push(data.choices[0].message.content);
            }
        }

        // 顯示結果
        const combinedQuestions = generatedQuestions.join('\n\n=== 分隔線 ===\n\n');
        const combinedAnswers = generatedAnswers.join('\n\n=== 分隔線 ===\n\n');
        document.getElementById('questionResult').textContent = combinedQuestions;
        document.getElementById('answerResult').textContent = combinedAnswers;
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

function processGeneratedText(text) {
    // 尋找試題卷和答案卷的分隔點
    const sections = text.split(/[AB]./i).filter(section => section.trim());
    
    if (sections.length >= 2) {
        return [sections[0].trim(), sections[1].trim()];
    }
    
    // 如果無法正確分割，返回原始文本
    return [text, ''];
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