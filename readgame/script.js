import { marked } from 'marked';

// Game state management
let gameState = {
    selectedGrade: null,
    selectedWordCount: null,
    selectedQuestionType: null,
    customTopic: '',
    apiKey: '',
    player: {
        level: '閱讀小菜鳥',
        levelProgress: 40,
        coins: 0,
        medals: 0,
        badges: [],
        completedChallenges: 0
    },
    currentChallenge: {
        content: '',
        questions: [],
        answers: [],
        explanations: [],
        startTime: null,
        endTime: null
    },
    language: localStorage.getItem('putiAI_language') || 'zh'
};

// Constants for the game
const LEVELS = [
    { name: '閱讀小菜鳥', name_en: 'Reading Rookie', threshold: 0 },
    { name: '閱讀探險家', name_en: 'Reading Explorer', threshold: 5 },
    { name: '閱讀達人', name_en: 'Reading Expert', threshold: 15 },
    { name: '閱讀專家', name_en: 'Reading Professional', threshold: 30 },
    { name: '閱讀大師', name_en: 'Reading Master', threshold: 50 }
];

const BADGES = [
    { id: 'first_win', name: '初次勝利', name_en: 'First Victory', icon: '🏆', condition: 'Win first challenge', condition_en: 'Win first challenge' },
    { id: 'streak_3', name: '三連勝', name_en: 'Three Wins Streak', icon: '🔥', condition: 'Win 3 challenges in a row', condition_en: 'Win 3 challenges in a row' },
    { id: 'perfect_score', name: '滿分成就', name_en: 'Perfect Score', icon: '⭐', condition: 'Get a perfect score', condition_en: 'Get a perfect score' },
    { id: 'speed_reader', name: '閃電閱讀', name_en: 'Speed Reader', icon: '⚡', condition: 'Complete in under 2 minutes', condition_en: 'Complete in under 2 minutes' },
    { id: 'middle_master', name: '中年級大師', name_en: 'Middle Grade Master', icon: '📘', condition: 'Master middle grade level', condition_en: 'Master middle grade level' },
    { id: 'high_master', name: '高年級大師', name_en: 'High Grade Master', icon: '📗', condition: 'Master high grade level', condition_en: 'Master high grade level' },
    { id: 'junior_master', name: '國中大師', name_en: 'Junior High Master', icon: '📙', condition: 'Master junior high level', condition_en: 'Master junior high level' },
    { id: 'senior_master', name: '高中大師', name_en: 'Senior High Master', icon: '📚', condition: 'Master senior high level', condition_en: 'Master senior high level' },
    { id: 'collector', name: '收藏家', name_en: 'Collector', icon: '🏅', condition: 'Collect 10 medals', condition_en: 'Collect 10 medals' },
    { id: 'rich_reader', name: '閱讀富翁', name_en: 'Reading Tycoon', icon: '💰', condition: 'Collect 100 coins', condition_en: 'Collect 100 coins' }
];

// PIRLS levels with descriptions
const PIRLS_LEVELS = {
    "檢索訊息": "能夠在文章中找出明確陳述的資訊",
    "直接推論": "能夠根據文章內容進行簡單的推論",
    "詮釋整合": "能夠整合文章中的不同部分，進行詮釋和理解",
    "評鑑反思": "能夠評估文章的內容、語言和元素，並連結個人經驗進行反思"
};

const PIRLS_LEVELS_EN = {
    "檢索訊息": "Retrieve Information",
    "直接推論": "Make Straightforward Inferences",
    "詮釋整合": "Interpret and Integrate Ideas",
    "評鑑反思": "Evaluate and Critique Content"
};

// Language translations
const TRANSLATIONS = {
    zh: {
        title: "Puti-AI 閱讀闖關遊戲",
        settingsTitle: "設置 AI",
        apiKeyLabel: "API Key:",
        apiKeyPlaceholder: "輸入你的 Gemini API Key",
        saveButton: "儲存",
        apiNotSet: "未設定",
        apiSet: "API Key 已設置",
        apiInvalid: "請輸入有效的 API Key",
        gradeLabel: "年級",
        gradeOptions: ["中年級", "高年級", "國中", "高中", "自訂"],
        wordCountLabel: "字數",
        customLabel: "自訂",
        questionTypeLabel: "出題方式",
        questionTypeOptions: ["AI自動出題", "自訂主題"],
        topicInputPlaceholder: "輸入主題",
        customWordsInputPlaceholder: "字數",
        confirmButton: "確定",
        startButton: "開始闖關",
        badgesTitle: "我的成就",
        backButton: "← 返回",
        readingChallengeTitle: "閱讀挑戰",
        submitButton: "提交答案",
        resultTitle: "挑戰結果",
        scoreLabel: "得分：",
        timeLabel: "用時：",
        explanationTitle: "答案與解析",
        newBadgeTitle: "獲得新徽章！",
        tryAgainButton: "再次挑戰",
        backToMenuButton: "返回主選單",
        loadingText: "AI 正在出題中...",
        answerAllPrompt: "請回答所有問題",
        correctText: "✓ 正確",
        incorrectText: "✗ 錯誤",
        correctAnswerText: "正確答案: ",
        instructionsTitle: "遊戲說明",
        instructionsGameGoal: "遊戲目標",
        instructionsGameGoalText: "Puti-AI 閱讀闖關遊戲旨在幫助學生提升閱讀理解能力，透過有趣的挑戰和獎勵機制，讓學習變得更加有趣！",
        instructionsGameFlow: "遊戲流程",
        instructionsGameFlowSteps: [
            "選擇適合的年級難度",
            "選擇文章字數",
            "選擇出題方式（AI自動或自訂主題）",
            "點擊「開始闖關」生成閱讀文章和問題",
            "閱讀文章並回答 3 個基於 PIRLS 閱讀素養評量架構的題目",
            "提交答案，獲得即時評分和獎勵"
        ],
        instructionsPIRLSTitle: "PIRLS 閱讀素養層次",
        instructionsPIRLSText: "每個問題都基於以下四個認知層次：",
        instructionsPIRLSLevels: [
            "<strong>檢索訊息</strong>：找出明確陳述的資訊",
            "<strong>直接推論</strong>：根據文章內容進行簡單的推論",
            "<strong>詮釋整合</strong>：整合文章不同部分，進行詮釋和理解",
            "<strong>評鑑反思</strong>：評估文章的內容、語言和元素，並連結個人經驗進行反思"
        ],
        instructionsLevelSystem: "等級系統",
        instructionsLevelSystemText: "完成閱讀挑戰可以積累經驗，提升你的閱讀等級：",
        instructionsLevelSystemLevels: [
            "<span class=\"instruction-icon\">🌱</span>閱讀小菜鳥（初始等級）",
            "<span class=\"instruction-icon\">🌿</span>閱讀探險家（完成 5 個挑戰）",
            "<span class=\"instruction-icon\">🌲</span>閱讀達人（完成 15 個挑戰）",
            "<span class=\"instruction-icon\">🏆</span>閱讀專家（完成 30 個挑戰）",
            "<span class=\"instruction-icon\">👑</span>閱讀大師（完成 50 個挑戰）"
        ],
        instructionsRewardSystem: "獎勵機制",
        instructionsRewardSystemText: "遊戲中有兩種主要獎勵：",
        instructionsRewardSystemRewards: [
            "<span class=\"instruction-icon\">💰</span><strong>金幣</strong>：根據得分、答題速度獲得，完美得分可獲得額外獎勵",
            "<span class=\"instruction-icon\">🏅</span><strong>勳章</strong>：獲得完美得分可獲得勳章"
        ],
        instructionsAchievementSystem: "成就系統",
        instructionsAchievementSystemText: "完成特定目標可以解鎖獨特的成就徽章：",
        instructionsAchievementSystemAchievements: [
            "<span class=\"instruction-icon\">🏆</span><strong>初次勝利</strong>：成功完成第一次挑戰",
            "<span class=\"instruction-icon\">🔥</span><strong>三連勝</strong>：連續完成三次挑戰",
            "<span class=\"instruction-icon\">⭐</span><strong>滿分成就</strong>：獲得完美得分",
            "<span class=\"instruction-icon\">⚡</span><strong>閃電閱讀</strong>：2分鐘內完成挑戰",
            "<span class=\"instruction-icon\">💰</span><strong>閱讀富翁</strong>：累積100枚金幣",
            "...以及更多等你探索！"
        ],
        instructionsTips: "小技巧",
        instructionsTipsList: [
            "仔細閱讀文章，留意關鍵細節",
            "注意每個問題的認知層次，幫助你思考答案",
            "挑戰更高難度的年級，獲得更多金幣和成就",
            "查看問題解析，了解正確答案的思考邏輯"
        ],
        apiKeyInstructions: "如何取得 Gemini API Key：",
        apiKeySteps: [
            "前往 <a href=\"https://ai.google.dev/\" target=\"_blank\">Google AI Studio</a>",
            "登入 Google 帳號",
            "點擊右上角「Get API key」",
            "創建新的 API key",
            "複製 API key 並貼上到上方輸入框"
        ],
        copyright1: "屏東縣後庄國小黃朝榮老師作品",
        copyright2: "免費分享，歡迎擴散推廣",
        copyright3: "嚴禁商用與任何侵權、不尊重著作權的行為",
        copyright4: "更多 Puti-AI 教學工具"
    },
    en: {
        title: "Puti-AI Reading Challenge Game",
        settingsTitle: "AI Settings",
        apiKeyLabel: "API Key:",
        apiKeyPlaceholder: "Enter your Gemini API Key",
        saveButton: "Save",
        apiNotSet: "Not set",
        apiSet: "API Key has been set",
        apiInvalid: "Please enter a valid API Key",
        gradeLabel: "Grade",
        gradeOptions: ["Middle Grade", "Upper Grade", "Junior High", "Senior High", "Custom"],
        wordCountLabel: "Word Count",
        customLabel: "Custom",
        questionTypeLabel: "Question Type",
        questionTypeOptions: ["AI Auto-generate", "Custom Topic"],
        topicInputPlaceholder: "Enter topic",
        customWordsInputPlaceholder: "Word count",
        confirmButton: "Confirm",
        startButton: "Start Challenge",
        badgesTitle: "My Achievements",
        backButton: "← Back",
        readingChallengeTitle: "Reading Challenge",
        submitButton: "Submit Answers",
        resultTitle: "Challenge Results",
        scoreLabel: "Score: ",
        timeLabel: "Time: ",
        explanationTitle: "Answers and Explanations",
        newBadgeTitle: "New Badge Earned!",
        tryAgainButton: "Try Again",
        backToMenuButton: "Back to Menu",
        loadingText: "AI is generating questions...",
        answerAllPrompt: "Please answer all questions",
        correctText: "✓ Correct",
        incorrectText: "✗ Incorrect",
        correctAnswerText: "Correct answer: ",
        instructionsTitle: "Game Instructions",
        instructionsGameGoal: "Game Objective",
        instructionsGameGoalText: "Puti-AI Reading Challenge Game aims to help students improve their reading comprehension skills through fun challenges and rewards!",
        instructionsGameFlow: "Game Flow",
        instructionsGameFlowSteps: [
            "Choose an appropriate grade level",
            "Select the word count",
            "Choose question type (AI auto or custom topic)",
            "Click 'Start Challenge' to generate a reading passage and questions",
            "Read the passage and answer 3 questions based on PIRLS reading literacy framework",
            "Submit answers to receive immediate scoring and rewards"
        ],
        instructionsPIRLSTitle: "PIRLS Reading Literacy Levels",
        instructionsPIRLSText: "Each question is based on the following four cognitive levels:",
        instructionsPIRLSLevels: [
            "<strong>Retrieve Information</strong>: Find explicitly stated information",
            "<strong>Make Straightforward Inferences</strong>: Make simple inferences from the text",
            "<strong>Interpret and Integrate Ideas</strong>: Interpret and integrate information from different parts of the text",
            "<strong>Evaluate and Critique Content</strong>: Evaluate the content, language, and elements of the text"
        ],
        instructionsLevelSystem: "Level System",
        instructionsLevelSystemText: "Complete reading challenges to gain experience and level up:",
        instructionsLevelSystemLevels: [
            "<span class=\"instruction-icon\">🌱</span>Reading Rookie (Starting level)",
            "<span class=\"instruction-icon\">🌿</span>Reading Explorer (Complete 5 challenges)",
            "<span class=\"instruction-icon\">🌲</span>Reading Expert (Complete 15 challenges)",
            "<span class=\"instruction-icon\">🏆</span>Reading Professional (Complete 30 challenges)",
            "<span class=\"instruction-icon\">👑</span>Reading Master (Complete 50 challenges)"
        ],
        instructionsRewardSystem: "Reward System",
        instructionsRewardSystemText: "There are two main rewards in the game:",
        instructionsRewardSystemRewards: [
            "<span class=\"instruction-icon\">💰</span><strong>Coins</strong>: Earned based on score and completion speed, with bonus for perfect scores",
            "<span class=\"instruction-icon\">🏅</span><strong>Medals</strong>: Earned for perfect scores"
        ],
        instructionsAchievementSystem: "Achievement System",
        instructionsAchievementSystemText: "Complete specific goals to unlock unique achievement badges:",
        instructionsAchievementSystemAchievements: [
            "<span class=\"instruction-icon\">🏆</span><strong>First Victory</strong>: Successfully complete your first challenge",
            "<span class=\"instruction-icon\">🔥</span><strong>Three Wins Streak</strong>: Complete three challenges in a row",
            "<span class=\"instruction-icon\">⭐</span><strong>Perfect Score</strong>: Get a perfect score",
            "<span class=\"instruction-icon\">⚡</span><strong>Speed Reader</strong>: Complete a challenge in under 2 minutes",
            "<span class=\"instruction-icon\">💰</span><strong>Reading Tycoon</strong>: Accumulate 100 coins",
            "...and more to explore!"
        ],
        instructionsTips: "Tips",
        instructionsTipsList: [
            "Read the passage carefully and pay attention to key details",
            "Note the cognitive level of each question to help you think about the answer",
            "Challenge yourself with higher grade levels to earn more coins and achievements",
            "Review the explanations to understand the reasoning behind the correct answers"
        ],
        apiKeyInstructions: "How to get a Gemini API Key:",
        apiKeySteps: [
            "Go to <a href=\"https://ai.google.dev/\" target=\"_blank\">Google AI Studio</a>",
            "Sign in with your Google account",
            "Click on \"Get API key\" in the top right corner",
            "Create a new API key",
            "Copy the API key and paste it into the input box above"
        ],
        copyright1: "Created by Teacher Huang Chao-Rong from Houzhung Elementary School, Pingtung County",
        copyright2: "Free to share, please help spread and promote",
        copyright3: "Commercial use and any copyright infringement are strictly prohibited",
        copyright4: "More Puti-AI teaching tools"
    }
};

// DOM Elements
const elements = {
    settingsIcon: document.getElementById('settingsIcon'),
    helpButton: document.getElementById('helpButton'),
    instructionsOverlay: document.getElementById('instructionsOverlay'),
    closeInstructions: document.getElementById('closeInstructions'),
    aiSettingsPanel: document.getElementById('aiSettingsPanel'),
    apiKey: document.getElementById('apiKey'),
    saveApiKey: document.getElementById('saveApiKey'),
    apiStatus: document.getElementById('apiStatus'),
    gradeButtons: document.getElementById('gradeButtons'),
    wordCountButtons: document.getElementById('wordCountButtons'),
    questionTypeButtons: document.getElementById('questionTypeButtons'),
    customWordsInput: document.getElementById('customWordsInput'),
    customWords: document.getElementById('customWords'),
    confirmCustomWords: document.getElementById('confirmCustomWords'),
    customTopicInput: document.getElementById('customTopicInput'),
    customTopic: document.getElementById('customTopic'),
    confirmCustomTopic: document.getElementById('confirmCustomTopic'),
    startButton: document.getElementById('startButton'),
    gameStage: document.getElementById('gameStage'),
    readingContent: document.getElementById('readingContent'),
    questionsSection: document.getElementById('questionsSection'),
    submitButton: document.getElementById('submitButton'),
    gameContainer: document.querySelector('.game-container'),
    backButton: document.getElementById('backButton'),
    timer: document.getElementById('timer'),
    resultScreen: document.getElementById('resultScreen'),
    resultScore: document.getElementById('resultScore'),
    resultTime: document.getElementById('resultTime'),
    earnedCoins: document.getElementById('earnedCoins'),
    earnedMedals: document.getElementById('earnedMedals'),
    earnedBadge: document.getElementById('earnedBadge'),
    newBadgeDisplay: document.getElementById('newBadgeDisplay'),
    tryAgainButton: document.getElementById('tryAgainButton'),
    backToMenuButton: document.getElementById('backToMenuButton'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    playerLevel: document.getElementById('playerLevel'),
    levelBar: document.getElementById('levelBar'),
    coinCount: document.getElementById('coinCount'),
    medalCount: document.getElementById('medalCount'),
    badgesContainer: document.getElementById('badgesContainer'),
    explanationContainer: document.getElementById('explanationContainer'),
    languageToggle: document.getElementById('languageToggle')
};

// Event Listeners setup
function setupEventListeners() {
    // Language toggle
    elements.languageToggle.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            const lang = e.target.dataset.lang;
            if (lang && lang !== gameState.language) {
                gameState.language = lang;
                localStorage.setItem('putiAI_language', lang);
                updateLanguage();
            }
        }
    });

    // Settings panel
    elements.settingsIcon.addEventListener('click', toggleSettingsPanel);
    elements.saveApiKey.addEventListener('click', saveApiKey);
    
    // Help/Instructions
    elements.helpButton.addEventListener('click', toggleInstructions);
    elements.closeInstructions.addEventListener('click', toggleInstructions);
    
    // Options selection
    setupOptionButtons(elements.gradeButtons, 'grade');
    setupOptionButtons(elements.wordCountButtons, 'words');
    setupOptionButtons(elements.questionTypeButtons, 'type');
    
    // Custom inputs
    elements.confirmCustomWords.addEventListener('click', confirmCustomWords);
    elements.confirmCustomTopic.addEventListener('click', confirmCustomTopic);
    
    // Game flow
    elements.startButton.addEventListener('click', startChallenge);
    elements.backButton.addEventListener('click', returnToDashboard);
    elements.submitButton.addEventListener('click', submitAnswers);
    elements.tryAgainButton.addEventListener('click', restartChallenge);
    elements.backToMenuButton.addEventListener('click', returnToDashboard);
    
    // Show custom input when "自訂" is selected
    document.querySelector('[data-words="custom"]').addEventListener('click', () => {
        elements.customWordsInput.style.display = 'flex';
    });
    
    document.querySelector('[data-type="topic"]').addEventListener('click', () => {
        elements.customTopicInput.style.display = 'flex';
    });
}

// Helper functions
function toggleSettingsPanel() {
    if (elements.aiSettingsPanel.style.display === 'block') {
        elements.aiSettingsPanel.style.display = 'none';
    } else {
        elements.aiSettingsPanel.style.display = 'block';
    }
}

function saveApiKey() {
    const key = elements.apiKey.value.trim();
    if (key) {
        gameState.apiKey = key;
        localStorage.setItem('putiAI_apiKey', key);
        elements.apiStatus.textContent = 'API Key 已設置';
        elements.apiStatus.style.color = 'green';
        elements.aiSettingsPanel.style.display = 'none';
    } else {
        elements.apiStatus.textContent = '請輸入有效的 API Key';
        elements.apiStatus.style.color = 'red';
    }
}

function setupOptionButtons(container, dataType) {
    const buttons = container.querySelectorAll('.option-button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Deselect all buttons in this group
            buttons.forEach(btn => btn.classList.remove('selected'));
            
            // Select the clicked button
            button.classList.add('selected');
            
            // Update game state
            const value = button.dataset[dataType];
            
            if (dataType === 'grade') {
                gameState.selectedGrade = value;
            } else if (dataType === 'words') {
                if (value !== 'custom') {
                    gameState.selectedWordCount = parseInt(value);
                    elements.customWordsInput.style.display = 'none';
                }
            } else if (dataType === 'type') {
                gameState.selectedQuestionType = value;
                if (value !== 'topic') {
                    elements.customTopicInput.style.display = 'none';
                }
            }
        });
    });
}

function confirmCustomWords() {
    const wordCount = parseInt(elements.customWords.value);
    if (wordCount && wordCount >= 100 && wordCount <= 2000) {
        gameState.selectedWordCount = wordCount;
        elements.customWordsInput.style.display = 'none';
        
        // Update the "自訂" button text
        const customButton = document.querySelector('[data-words="custom"]');
        customButton.textContent = wordCount.toString();
    }
}

function confirmCustomTopic() {
    const topic = elements.customTopic.value.trim();
    if (topic) {
        gameState.customTopic = topic;
        elements.customTopicInput.style.display = 'none';
        
        // Update the "自訂主題" button text
        const customButton = document.querySelector('[data-type="topic"]');
        customButton.textContent = '主題: ' + topic;
    }
}

async function startChallenge() {
    // Validate selections
    if (!gameState.selectedGrade) {
        alert('請選擇年級');
        return;
    }
    
    if (!gameState.selectedWordCount) {
        alert('請選擇字數');
        return;
    }
    
    if (!gameState.selectedQuestionType) {
        alert('請選擇出題方式');
        return;
    }
    
    if (gameState.selectedQuestionType === 'topic' && !gameState.customTopic) {
        alert('請輸入自訂主題');
        return;
    }
    
    if (!gameState.apiKey) {
        alert('請先設置 API Key');
        toggleSettingsPanel();
        return;
    }
    
    // Show loading overlay
    elements.loadingOverlay.style.display = 'flex';
    
    try {
        // Generate content and questions using AI
        await generateChallengeContent();
        
        // Hide dashboard and show game stage
        elements.gameContainer.querySelector('.game-dashboard').style.display = 'none';
        elements.gameStage.style.display = 'block';
        
        // Start the timer
        gameState.currentChallenge.startTime = new Date();
        startTimer();
        
    } catch (error) {
        console.error('Error generating challenge:', error);
        alert('生成挑戰失敗，請檢查 API Key 或稍後再試');
    } finally {
        elements.loadingOverlay.style.display = 'none';
    }
}

async function generateChallengeContent() {
    const gradeMap = {
        'middle': '中年級',
        'high': '高年級',
        'junior': '國中',
        'senior': '高中',
        'custom': '自訂'
    };
    
    const prompt = `請生成一篇適合${gradeMap[gameState.selectedGrade]}學生的繁體中文閱讀文章，字數控制在${gameState.selectedWordCount}字左右。
    ${gameState.selectedQuestionType === 'topic' ? '文章主題為：' + gameState.customTopic : ''}
    
    接著，請根據PIRLS閱讀素養評量架構的四個認知層次，針對這篇文章出3題四選一單選題，每題須標明屬於哪個認知層次。
    請確保每一個問題和選項都直接基於文章內容，不要出與文章無關的題目。
    
    每個題目須提供詳細解析，說明為何正確答案是正確的，以及其他選項錯在哪裡。
    
    四個認知層次分別是：
    1. 檢索訊息：找出明確陳述的資訊（直接從文本找出特定事實或細節）
    2. 直接推論：根據文章內容進行簡單的推論（連結文章中的線索，得出文章未直接陳述的結論）
    3. 詮釋整合：整合文章不同部分，進行詮釋和理解（綜合分析多個段落的信息，理解文章主旨或作者意圖）
    4. 評鑑反思：評估文章內容，連結個人經驗進行反思（批判性思考文章觀點，將文章與自身經驗或其他文本連結）
    
    請使用以下嚴格格式輸出，以便程式正確解析：
    ---文章---
    (文章內容)
    
    ---題目---
    [層次: 檢索訊息/直接推論/詮釋整合/評鑑反思]
    1. 問題？
    A. 選項A
    B. 選項B
    C. 選項C
    D. 選項D
    正確答案: A/B/C/D
    解析: (解析內容)
    
    [層次: 檢索訊息/直接推論/詮釋整合/評鑑反思]
    2. 問題？
    A. 選項A
    B. 選項B
    C. 選項C
    D. 選項D
    正確答案: A/B/C/D
    解析: (解析內容)
    
    [層次: 檢索訊息/直接推論/詮釋整合/評鑑反思]
    3. 問題？
    A. 選項A
    B. 選項B
    C. 選項C
    D. 選項D
    正確答案: A/B/C/D
    解析: (解析內容)`;

    // For development/testing, use a simulated API response
    if (gameState.apiKey === 'test') {
        return simulateAIResponse();
    }
    
    try {
        // Replace with actual Gemini API call
        const response = await callGeminiAPI(prompt);
        
        // Parse AI response into article and questions
        parseAIResponse(response);
    } catch (error) {
        console.error('API call failed:', error);
        throw new Error('API call failed');
    }
}

async function callGeminiAPI(prompt) {
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
    
    try {
        const response = await fetch(`${API_URL}?key=${gameState.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4096
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Unexpected API response format");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

function parseAIResponse(response) {
    // Split the response into article and questions
    const articleMatch = response.match(/---文章---([\s\S]+?)---題目---/);
    const questionsSection = response.split('---題目---')[1];
    
    if (!articleMatch || !questionsSection) {
        console.error('AI response format is invalid:', response);
        throw new Error('AI response format is invalid');
    }
    
    // Get article content
    const articleContent = articleMatch[1].trim();
    gameState.currentChallenge.content = articleContent;
    
    // Parse questions
    const questionRegex = /\[層次:\s*([^\]]+)\]\s*(\d+)\.\s*([^\n]+)((?:\s*[A-D]\.\s*[^\n]+\n*)+)\s*正確答案:\s*([A-D])(?:\s*解析:\s*([^\[]+))?/g;
    const questions = [];
    const answers = [];
    const explanations = [];
    
    let match;
    while ((match = questionRegex.exec(questionsSection)) !== null) {
        const level = match[1].trim();
        const number = match[2];
        const question = match[3].trim();
        const optionsText = match[4].trim();
        const correctAnswer = match[5].trim();
        const explanation = match[6] ? match[6].trim() : "無解析";
        
        // Parse options
        const options = [];
        const optionRegex = /([A-D])\.\s*([^\n]+)/g;
        let optionMatch;
        while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
            options.push({
                marker: optionMatch[1],
                text: optionMatch[2].trim()
            });
        }
        
        questions.push({
            number: parseInt(number),
            level: level,
            text: question,
            options: options
        });
        
        answers.push(correctAnswer);
        explanations.push(explanation);
    }
    
    // If we didn't get exactly 3 questions with proper options, try alternate parsing or use fallback
    if (questions.length !== 3 || questions.some(q => q.options.length !== 4)) {
        console.error('Failed to parse questions properly:', questions);
        const fallbackQuestions = generateFallbackQuestions(articleContent);
        gameState.currentChallenge.questions = fallbackQuestions.questions;
        gameState.currentChallenge.answers = fallbackQuestions.answers;
        gameState.currentChallenge.explanations = fallbackQuestions.explanations;
    } else {
        gameState.currentChallenge.questions = questions;
        gameState.currentChallenge.answers = answers;
        gameState.currentChallenge.explanations = explanations;
    }
    
    // Render the article and questions in the UI
    renderChallenge();
}

function generateFallbackQuestions(articleContent) {
    // Fallback questions in case AI parsing fails
    const fallbackLevels = Object.keys(PIRLS_LEVELS);
    const questions = [];
    const answers = [];
    const explanations = [];
    
    for (let i = 0; i < 3; i++) {
        const level = fallbackLevels[i % fallbackLevels.length];
        questions.push({
            number: i + 1,
            level: level,
            text: `請根據文章回答問題 ${i + 1}。（${level}層次問題）`,
            options: [
                { marker: 'A', text: '選項 A' },
                { marker: 'B', text: '選項 B' },
                { marker: 'C', text: '選項 C' },
                { marker: 'D', text: '選項 D' }
            ]
        });
        answers.push('A'); // Default correct answer
        explanations.push('系統無法產生解析，請參考文章內容。'); // Default explanation
    }
    
    return { questions, answers, explanations };
}

function renderChallenge() {
    // Render article content
    elements.readingContent.innerHTML = marked.parse(gameState.currentChallenge.content);
    
    // Render questions
    elements.questionsSection.innerHTML = '';
    
    gameState.currentChallenge.questions.forEach(question => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        questionElement.dataset.number = question.number;
        
        const levelDisplay = gameState.language === 'zh' ? 
            question.level : 
            PIRLS_LEVELS_EN[question.level] || question.level;
        
        questionElement.innerHTML = `
            <div class="question-header">
                <h3>${gameState.language === 'zh' ? '問題' : 'Question'} ${question.number}</h3>
                <span class="question-level" title="${PIRLS_LEVELS[question.level]}">${levelDisplay}</span>
            </div>
            <div class="question-text">${question.text}</div>
            <div class="options-list">
                ${question.options.map(option => `
                    <div class="option-item" data-marker="${option.marker}">
                        <div class="option-marker">${option.marker}</div>
                        <div class="option-text">${option.text}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        elements.questionsSection.appendChild(questionElement);
    });
    
    // Add click event for options
    document.querySelectorAll('.option-item').forEach(option => {
        option.addEventListener('click', () => {
            // Get parent question
            const questionItem = option.closest('.question-item');
            
            // Deselect all options in this question
            questionItem.querySelectorAll('.option-item').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select this option
            option.classList.add('selected');
        });
    });
}

function startTimer() {
    const startTime = gameState.currentChallenge.startTime;
    
    const timerInterval = setInterval(() => {
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Check if we're still in the game stage
        if (elements.gameStage.style.display === 'none') {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function submitAnswers() {
    // End the timer
    gameState.currentChallenge.endTime = new Date();
    
    // Collect user answers
    const userAnswers = [];
    const questions = document.querySelectorAll('.question-item');
    
    questions.forEach(question => {
        const selected = question.querySelector('.option-item.selected');
        if (selected) {
            userAnswers.push(selected.dataset.marker);
        } else {
            userAnswers.push(null);
        }
    });
    
    // Check if all questions are answered
    if (userAnswers.includes(null)) {
        alert(TRANSLATIONS[gameState.language].answerAllPrompt);
        return;
    }
    
    // Calculate score
    let score = 0;
    const results = [];
    for (let i = 0; i < userAnswers.length; i++) {
        const isCorrect = userAnswers[i] === gameState.currentChallenge.answers[i];
        if (isCorrect) {
            score++;
        }
        results.push({
            questionNumber: i + 1,
            userAnswer: userAnswers[i],
            correctAnswer: gameState.currentChallenge.answers[i],
            isCorrect: isCorrect,
            explanation: gameState.currentChallenge.explanations[i]
        });
    }
    
    // Calculate time spent
    const timeSpent = Math.floor((gameState.currentChallenge.endTime - gameState.currentChallenge.startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate rewards
    const earnedCoins = calculateCoins(score, timeSpent);
    const earnedMedals = calculateMedals(score, timeSpent);
    
    // Update player stats
    gameState.player.coins += earnedCoins;
    gameState.player.medals += earnedMedals;
    gameState.player.completedChallenges++;
    
    // Update level progress
    updatePlayerLevel();
    
    // Check for badges
    const newBadge = checkForNewBadges(score, timeSpent);
    
    // Show results
    elements.resultScore.textContent = `${score}/3`;
    elements.resultTime.textContent = timeString;
    elements.earnedCoins.textContent = `+${earnedCoins}`;
    elements.earnedMedals.textContent = `+${earnedMedals}`;
    
    // Display answers and explanations
    const explanationContainer = document.getElementById('explanationContainer');
    explanationContainer.innerHTML = '';
    
    const translations = TRANSLATIONS[gameState.language];
    
    results.forEach(result => {
        const answerItem = document.createElement('div');
        answerItem.className = 'answer-item';
        
        answerItem.innerHTML = `
            <div class="answer-header">
                <div>${translations.scoreLabel.replace('：', '')} ${result.questionNumber}: ${result.isCorrect ? 
                    `<span class="correct">${translations.correctText}</span>` : 
                    `<span class="incorrect">${translations.incorrectText}</span> (${translations.correctAnswerText}${result.correctAnswer})`}</div>
            </div>
            <div class="answer-explanation">${result.explanation}</div>
        `;
        
        explanationContainer.appendChild(answerItem);
    });
    
    if (newBadge) {
        elements.earnedBadge.style.display = 'block';
        elements.newBadgeDisplay.innerHTML = `
            <div class="badge-item unlocked">
                <span style="font-size: 36px;">${newBadge.icon}</span>
            </div>
            <div>${gameState.language === 'zh' ? newBadge.name : newBadge.name_en}</div>
        `;
    } else {
        elements.earnedBadge.style.display = 'none';
    }
    
    elements.resultScreen.style.display = 'flex';
    
    // Save game state
    saveGameState();
}

function calculateCoins(score, timeSpent) {
    // Base coins based on score
    let coins = score * 10;
    
    // Bonus for speed
    if (timeSpent < 60) { // Under 1 minute
        coins += 15;
    } else if (timeSpent < 120) { // Under 2 minutes
        coins += 10;
    } else if (timeSpent < 180) { // Under 3 minutes
        coins += 5;
    }
    
    // Perfect score bonus
    if (score === 3) {
        coins += 10;
    }
    
    return coins;
}

function calculateMedals(score, timeSpent) {
    if (score === 3) {
        return 1; // Perfect score earns a medal
    }
    return 0;
}

function updatePlayerLevel() {
    // Calculate level progress
    const completedChallenges = gameState.player.completedChallenges;
    let currentLevel = LEVELS[0];
    
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (completedChallenges >= LEVELS[i].threshold) {
            currentLevel = LEVELS[i];
            break;
        }
    }
    
    // Update level name
    gameState.player.level = currentLevel.name;
    
    // Calculate progress to next level
    let nextLevelIndex = LEVELS.findIndex(level => level.name === currentLevel.name) + 1;
    if (nextLevelIndex >= LEVELS.length) {
        nextLevelIndex = LEVELS.length - 1;
    }
    
    const nextLevel = LEVELS[nextLevelIndex];
    const progressPercentage = nextLevel.threshold === currentLevel.threshold 
        ? 100 
        : ((completedChallenges - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100;
    
    gameState.player.levelProgress = Math.min(Math.max(progressPercentage, 0), 100);
}

function checkForNewBadges(score, timeSpent) {
    const existingBadgeIds = gameState.player.badges.map(badge => badge.id);
    let newBadge = null;
    
    // Check each badge condition
    BADGES.forEach(badge => {
        if (existingBadgeIds.includes(badge.id)) {
            return; // Already has this badge
        }
        
        let earned = false;
        
        switch(badge.id) {
            case 'first_win':
                earned = gameState.player.completedChallenges === 1 && score > 0;
                break;
            case 'streak_3':
                // This would require tracking consecutive wins, simplified here
                earned = gameState.player.completedChallenges >= 3;
                break;
            case 'perfect_score':
                earned = score === 3;
                break;
            case 'speed_reader':
                earned = timeSpent < 120 && score === 3; // Under 2 minutes with perfect score
                break;
            case 'middle_master':
                earned = gameState.selectedGrade === 'middle' && score === 3;
                break;
            case 'high_master':
                earned = gameState.selectedGrade === 'high' && score === 3;
                break;
            case 'junior_master':
                earned = gameState.selectedGrade === 'junior' && score === 3;
                break;
            case 'senior_master':
                earned = gameState.selectedGrade === 'senior' && score === 3;
                break;
            case 'collector':
                earned = gameState.player.medals >= 10;
                break;
            case 'rich_reader':
                earned = gameState.player.coins >= 100;
                break;
        }
        
        if (earned) {
            gameState.player.badges.push(badge);
            newBadge = badge;
        }
    });
    
    return newBadge;
}

function restartChallenge() {
    elements.resultScreen.style.display = 'none';
    returnToDashboard();
    startChallenge();
}

function returnToDashboard() {
    elements.gameStage.style.display = 'none';
    elements.resultScreen.style.display = 'none';
    elements.gameContainer.querySelector('.game-dashboard').style.display = 'block';
    
    // Update UI with player stats
    updatePlayerStats();
}

function updatePlayerStats() {
    // Get player level in correct language
    const currentLevel = LEVELS.find(level => level.name === gameState.player.level);
    elements.playerLevel.textContent = gameState.language === 'zh' ? currentLevel.name : currentLevel.name_en;
    
    elements.levelBar.style.width = `${gameState.player.levelProgress}%`;
    elements.coinCount.textContent = gameState.player.coins;
    elements.medalCount.textContent = gameState.player.medals;
    
    // Update badges
    renderBadges();
}

function renderBadges() {
    elements.badgesContainer.innerHTML = '';
    
    // Create all badge slots
    BADGES.forEach(badge => {
        const isBadgeEarned = gameState.player.badges.some(b => b.id === badge.id);
        
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge-item ${isBadgeEarned ? 'unlocked' : ''}`;
        badgeElement.title = gameState.language === 'zh' ? badge.condition : badge.condition_en;
        
        if (isBadgeEarned) {
            badgeElement.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-name">${gameState.language === 'zh' ? badge.name : badge.name_en}</span>
            `;
        } else {
            badgeElement.innerHTML = `
                <span class="badge-icon" style="opacity: 0.3;">?</span>
                <span class="badge-name">???</span>
            `;
        }
        
        elements.badgesContainer.appendChild(badgeElement);
    });
}

function saveGameState() {
    localStorage.setItem('putiAI_gameState', JSON.stringify({
        player: gameState.player
    }));
}

function loadGameState() {
    const savedApiKey = localStorage.getItem('putiAI_apiKey');
    if (savedApiKey) {
        gameState.apiKey = savedApiKey;
        elements.apiStatus.textContent = 'API Key 已設置';
        elements.apiStatus.style.color = 'green';
    }
    
    const savedState = localStorage.getItem('putiAI_gameState');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            if (parsedState.player) {
                gameState.player = parsedState.player;
            }
        } catch (error) {
            console.error('Error parsing saved game state:', error);
        }
    }
    
    // Update UI with loaded stats
    updatePlayerStats();
}

function toggleInstructions() {
    if (elements.instructionsOverlay.style.display === 'flex') {
        elements.instructionsOverlay.style.display = 'none';
    } else {
        elements.instructionsOverlay.style.display = 'flex';
    }
}

// Function to update UI language
function updateLanguage() {
    const lang = gameState.language;
    const translations = TRANSLATIONS[lang];
    
    // Update language toggle UI
    document.querySelectorAll('#languageToggle span').forEach(span => {
        span.classList.toggle('active', span.dataset.lang === lang);
    });
    
    // Update document title
    document.title = translations.title;
    
    // Update header
    document.querySelector('header h1').textContent = translations.title;
    
    // Update settings panel
    document.querySelector('#aiSettingsPanel h2').textContent = translations.settingsTitle;
    document.querySelector('label[for="apiKey"]').textContent = translations.apiKeyLabel;
    elements.apiKey.placeholder = translations.apiKeyPlaceholder;
    elements.saveApiKey.textContent = translations.saveButton;
    
    if (elements.apiStatus.textContent === "未設定") {
        elements.apiStatus.textContent = translations.apiNotSet;
    } else if (elements.apiStatus.textContent === "API Key 已設置") {
        elements.apiStatus.textContent = translations.apiSet;
    }
    
    // Update control panel sections
    const sectionTitles = document.querySelectorAll('.panel-section h3');
    sectionTitles[0].textContent = translations.gradeLabel;
    sectionTitles[1].textContent = translations.wordCountLabel;
    sectionTitles[2].textContent = translations.questionTypeLabel;
    
    // Update grade buttons
    const gradeButtons = elements.gradeButtons.querySelectorAll('.option-button');
    for (let i = 0; i < gradeButtons.length - 1; i++) {
        gradeButtons[i].textContent = translations.gradeOptions[i];
    }
    gradeButtons[gradeButtons.length - 1].textContent = translations.customLabel;
    
    // Update word count buttons - only update the custom button
    document.querySelector('[data-words="custom"]').textContent = translations.customLabel;
    
    // Update question type buttons
    const typeButtons = elements.questionTypeButtons.querySelectorAll('.option-button');
    for (let i = 0; i < typeButtons.length; i++) {
        typeButtons[i].textContent = translations.questionTypeOptions[i];
    }
    
    // Update custom inputs
    elements.customWords.placeholder = translations.customWordsInputPlaceholder;
    elements.confirmCustomWords.textContent = translations.confirmButton;
    elements.customTopic.placeholder = translations.topicInputPlaceholder;
    elements.confirmCustomTopic.textContent = translations.confirmButton;
    
    // Update start button
    elements.startButton.textContent = translations.startButton;
    
    // Update badges showcase
    document.querySelector('.badges-showcase h3').textContent = translations.badgesTitle;
    
    // Update game stage
    elements.backButton.textContent = translations.backButton;
    document.querySelector('.stage-header h2').textContent = translations.readingChallengeTitle;
    elements.submitButton.textContent = translations.submitButton;
    
    // Update result screen
    document.querySelector('#resultScreen h2').textContent = translations.resultTitle;
    document.querySelector('.result-score span:first-child').textContent = translations.scoreLabel;
    document.querySelector('.result-time span:first-child').textContent = translations.timeLabel;
    document.querySelector('#resultScreen h3').textContent = translations.explanationTitle;
    
    if (elements.earnedBadge.style.display !== 'none') {
        document.querySelector('#earnedBadge h3').textContent = translations.newBadgeTitle;
    }
    
    elements.tryAgainButton.textContent = translations.tryAgainButton;
    elements.backToMenuButton.textContent = translations.backToMenuButton;
    
    // Update loading overlay
    document.querySelector('#loadingOverlay p').textContent = translations.loadingText;
    
    // Update instructions overlay
    updateInstructionsLanguage(translations);
    
    // Update API instructions
    document.getElementById('apiInstructionsText').textContent = translations.apiKeyInstructions;
    const instructionSteps = document.querySelectorAll('.api-instructions ol li');
    for (let i = 0; i < instructionSteps.length; i++) {
        instructionSteps[i].innerHTML = translations.apiKeySteps[i];
    }
    
    // Update copyright footer
    const copyrightText = document.querySelectorAll('.copyright-footer p');
    copyrightText[0].textContent = translations.copyright1;
    copyrightText[1].textContent = translations.copyright2;
    copyrightText[2].textContent = translations.copyright3;
    copyrightText[3].textContent = translations.copyright4;
    
    // Update player level
    updatePlayerStats();
    
    // If game is in challenge mode, update UI
    if (elements.gameStage.style.display === 'block') {
        renderChallenge();
    }
}

function updateInstructionsLanguage(translations) {
    const instructionsContainer = document.querySelector('.instructions-container');
    const sections = instructionsContainer.querySelectorAll('.instruction-section');
    
    // Update title
    document.querySelector('.instructions-header h2').textContent = translations.instructionsTitle;
    
    // Game goal section
    sections[0].querySelector('h3').textContent = translations.instructionsGameGoal;
    sections[0].querySelector('p').textContent = translations.instructionsGameGoalText;
    
    // Game flow section
    sections[1].querySelector('h3').textContent = translations.instructionsGameFlow;
    const gameFlowSteps = sections[1].querySelectorAll('ol li');
    for (let i = 0; i < gameFlowSteps.length; i++) {
        gameFlowSteps[i].textContent = translations.instructionsGameFlowSteps[i];
    }
    
    // PIRLS section
    sections[2].querySelector('h3').textContent = translations.instructionsPIRLSTitle;
    sections[2].querySelector('p').textContent = translations.instructionsPIRLSText;
    const pirlsLevels = sections[2].querySelectorAll('ul li');
    for (let i = 0; i < pirlsLevels.length; i++) {
        pirlsLevels[i].innerHTML = translations.instructionsPIRLSLevels[i];
    }
    
    // Level system section
    sections[3].querySelector('h3').textContent = translations.instructionsLevelSystem;
    sections[3].querySelector('p').textContent = translations.instructionsLevelSystemText;
    const levelSystemLevels = sections[3].querySelectorAll('ul li');
    for (let i = 0; i < levelSystemLevels.length; i++) {
        levelSystemLevels[i].innerHTML = translations.instructionsLevelSystemLevels[i];
    }
    
    // Reward system section
    sections[4].querySelector('h3').textContent = translations.instructionsRewardSystem;
    sections[4].querySelector('p').textContent = translations.instructionsRewardSystemText;
    const rewardSystemItems = sections[4].querySelectorAll('ul li');
    for (let i = 0; i < rewardSystemItems.length; i++) {
        rewardSystemItems[i].innerHTML = translations.instructionsRewardSystemRewards[i];
    }
    
    // Achievement system section
    sections[5].querySelector('h3').textContent = translations.instructionsAchievementSystem;
    sections[5].querySelector('p').textContent = translations.instructionsAchievementSystemText;
    const achievementSystemItems = sections[5].querySelectorAll('ul li');
    for (let i = 0; i < achievementSystemItems.length; i++) {
        achievementSystemItems[i].innerHTML = translations.instructionsAchievementSystemAchievements[i];
    }
    
    // Tips section
    sections[6].querySelector('h3').textContent = translations.instructionsTips;
    const tipsItems = sections[6].querySelectorAll('ul li');
    for (let i = 0; i < tipsItems.length; i++) {
        tipsItems[i].textContent = translations.instructionsTipsList[i];
    }
}

// Initialize the game
function init() {
    setupEventListeners();
    loadGameState();
    updatePlayerStats();
    updateLanguage(); // Apply initial language
}

// Start the game
init();