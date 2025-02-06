// 在文件開頭加入分頁切換函數
function switchTab(tabName) {
    // 隱藏所有分頁內容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 取消所有分頁按鈕的活動狀態
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 顯示選中的分頁
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // 設置對應按鈕的活動狀態
    event.target.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // API Key 相關功能
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiKey = document.getElementById('toggleApiKey');
    const saveApiKey = document.getElementById('saveApiKey');
    const resetApiKey = document.getElementById('resetApiKey');

    // 載入儲存的 API Key
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // 切換 API Key 顯示/隱藏
    toggleApiKey.addEventListener('click', () => {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    // 儲存 API Key
    saveApiKey.addEventListener('click', () => {
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        alert('API Key 已儲存！');
    });

    // 重設 API Key
    resetApiKey.addEventListener('click', () => {
        localStorage.removeItem('geminiApiKey');
        apiKeyInput.value = '';
        alert('API Key 已重設！');
    });

    // 生成貼文功能
    const generateBtn = document.getElementById('generateBtn');
    const postInput = document.getElementById('postInput');
    const previewContent = document.getElementById('previewContent');
    const copyBtn = document.getElementById('copyBtn');

    generateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            alert('請先輸入 API Key！');
            return;
        }

        const content = postInput.value;
        if (!content) {
            alert('請輸入貼文內容！');
            return;
        }

        try {
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';

            const prompt = `
            你是專業的社群貼文優化專家。請幫我處理以下貼文內容：
            1. 在內容中大量加入適當的表情符號（每句話至少1-2個），使內容更活潑生動
            2. 在貼文最後加入3-5個相關的主題標籤
            3. 在標籤後空一行，加入英文翻譯（英文版也要加入相同的表情符號）
            
            注意：
            - 直接輸出優化後的內容，不要加入任何標記文字
            - 確保表情符號的使用自然且符合文意
            - 英文翻譯要保留原文中所有的表情符號，位置可以靈活調整
            - 確保輸出格式為：
              中文內容（含大量表情符號）
              換行
              hashtags
              換行
              英文翻譯（含相同表情符號）
            
            待處理內容：
            ${content}`;

            const response = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error('API 呼叫失敗');
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
                previewContent.textContent = data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('無效的 API 回應格式');
            }

        } catch (error) {
            alert('處理失敗：' + error.message);
            console.error('Error:', error);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '✨ 產生貼文';
        }
    });

    // 複製結果
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(previewContent.textContent)
            .then(() => alert('已複製到剪貼板！'))
            .catch(err => alert('複製失敗：' + err));
    });
}); 