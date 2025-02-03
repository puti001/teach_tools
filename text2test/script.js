class QuizManager {
  constructor() {
    this.apiKey = localStorage.getItem('apiKey') || '';
    this.wrongQuestions = JSON.parse(localStorage.getItem('wrongQuestions') || '[]');
    this.currentQuestions = [];
    this.fileContents = new Map(); // Store file contents
    this.initializeElements();
    this.addEventListeners();
    this.loadSavedText();
    this.loadSavedSettings();
    this.initializeFileSystem();
    
    // Add language support
    this.currentLang = 'zh';
    this.translations = {
      zh: {
        title: 'Puti-AI 文本轉測驗題',
        mainTab: '主要功能',
        helpTab: '使用說明',
        apiKeyLabel: 'Google Gemini API Key:',
        showBtn: '顯示',
        saveBtn: '儲存',
        resetBtn: '重設',
        selectFolderBtn: '選擇資料夾',
        textareaPlaceholder: '請輸入要轉換成題目的文本內容...',
        questionCountLabel: '題數:',
        difficultyLabel: '難度:',
        questionLengthLabel: '題幹長度:',
        customLengthPlaceholder: '自訂字數',
        questionStyleLabel: '題目風格:',
        generateBtn: '產生題目',
        downloadContentBtn: '下載內容',
        downloadPromptBtn: '下載提示詞',
        submitBtn: '提交答案',
        resultsTitle: '測驗結果',
        wrongQuestionsTitle: '錯題記錄',
        reviewWrongBtn: '複習錯題',
        scoreLabel: '得分:',
        correctAnswer: '正確答案:',
        yourAnswer: '你的答案:',
        difficultyOptions: {
          easy: '容易',
          medium: '中等',
          hard: '困難'
        },
        lengthOptions: {
          25: '約25字',
          35: '約35字',
          45: '約45字',
          55: '約55字',
          custom: '自訂'
        },
        styleOptions: {
          default: '一般題型',
          scenario: '生活情境',
          professional: '專業學術',
          simple: '淺白易懂'
        },
        footer: {
          credit: '屏東縣後庄國小黃朝榮老師作品,免費分享,歡迎擴散推廣',
          copyright: '嚴禁商用與任何侵權、不尊重著作權的行為',
          more: '更多 Puti-AI教學工具:'
        }
      },
      en: {
        title: 'Puti-AI Text to Quiz',
        mainTab: 'Main',
        helpTab: 'Help',
        apiKeyLabel: 'Google Gemini API Key:',
        showBtn: 'Show',
        saveBtn: 'Save',
        resetBtn: 'Reset',
        selectFolderBtn: 'Select Folder',
        textareaPlaceholder: 'Enter the text content to convert into quiz questions...',
        questionCountLabel: 'Questions:',
        difficultyLabel: 'Difficulty:',
        questionLengthLabel: 'Question Length:',
        customLengthPlaceholder: 'Custom length',
        questionStyleLabel: 'Question Style:',
        generateBtn: 'Generate Questions',
        downloadContentBtn: 'Download Content',
        downloadPromptBtn: 'Download Prompt',
        submitBtn: 'Submit Answers',
        resultsTitle: 'Quiz Results',
        wrongQuestionsTitle: 'Wrong Questions',
        reviewWrongBtn: 'Review Wrong Questions',
        scoreLabel: 'Score:',
        correctAnswer: 'Correct Answer:',
        yourAnswer: 'Your Answer:',
        difficultyOptions: {
          easy: 'Easy',
          medium: 'Medium',
          hard: 'Hard'
        },
        lengthOptions: {
          25: 'About 25 words',
          35: 'About 35 words',
          45: 'About 45 words',
          55: 'About 55 words',
          custom: 'Custom'
        },
        styleOptions: {
          default: 'Default',
          scenario: 'Real-life Scenario',
          professional: 'Professional',
          simple: 'Simple'
        },
        footer: {
          credit: 'Created by Teacher Huang Chaorong from Houzhuang Elementary School, Pingtung County. Free to share and distribute.',
          copyright: 'Commercial use and copyright infringement are strictly prohibited.',
          more: 'More Puti-AI Teaching Tools:'
        }
      }
    };
    
    this.initializeTabs();
    this.initializeLanguageSwitch();
  }

  initializeElements() {
    // API Key related elements
    this.apiKeyInput = document.getElementById('apiKey');
    this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
    this.saveApiKeyBtn = document.getElementById('saveApiKey');
    this.resetApiKeyBtn = document.getElementById('resetApiKey');

    // Quiz related elements
    this.textInput = document.getElementById('textInput');
    this.questionCount = document.getElementById('questionCount');
    this.generateQuestionsBtn = document.getElementById('generateQuestions');
    this.quizContainer = document.getElementById('quizContainer');
    this.questionsContainer = document.getElementById('questions');
    this.submitQuizBtn = document.getElementById('submitQuiz');
    this.resultsContainer = document.getElementById('results');
    this.scoreContainer = document.getElementById('score');
    this.explanationsContainer = document.getElementById('explanations');
    this.wrongQuestionsContainer = document.getElementById('wrongQuestions');
    this.wrongQuestionsList = document.getElementById('wrongQuestionsList');
    this.reviewWrongQuestionsBtn = document.getElementById('reviewWrongQuestions');

    // New elements
    this.difficultySelect = document.getElementById('difficulty');
    this.questionLengthSelect = document.getElementById('questionLength');
    this.customLengthInput = document.getElementById('customLength');
    this.questionStyle = document.getElementById('questionStyle');

    // File-related elements
    this.fileInput = document.getElementById('fileInput');
    this.selectFolderBtn = document.getElementById('selectFolder');
    this.fileList = document.getElementById('fileList');

    // Set saved API key if exists
    if (this.apiKey) {
      this.apiKeyInput.value = this.apiKey;
    }

    // Load saved text if exists
    const savedText = localStorage.getItem('savedText');
    if (savedText) {
      this.textInput.value = savedText;
    }
    
    this.downloadContentBtn = document.getElementById('downloadContent');
    this.downloadPromptBtn = document.getElementById('downloadPrompt');
  }

  addEventListeners() {
    this.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
    this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
    this.resetApiKeyBtn.addEventListener('click', () => this.resetApiKey());
    this.generateQuestionsBtn.addEventListener('click', () => this.generateQuestions());
    this.submitQuizBtn.addEventListener('click', () => this.submitQuiz());
    this.reviewWrongQuestionsBtn.addEventListener('click', () => this.reviewWrongQuestions());

    // Add text saving functionality
    this.textInput.addEventListener('input', () => {
      localStorage.setItem('savedText', this.textInput.value);
    });

    // Add new event listeners
    this.questionLengthSelect.addEventListener('change', () => {
      const isCustom = this.questionLengthSelect.value === 'custom';
      this.customLengthInput.classList.toggle('hidden', !isCustom);
    });

    // Save settings on change
    [this.difficultySelect, this.questionLengthSelect, this.customLengthInput, this.questionStyle].forEach(element => {
      element.addEventListener('change', () => this.saveSettings());
    });
    
    this.downloadContentBtn.addEventListener('click', () => this.downloadContent());
    this.downloadPromptBtn.addEventListener('click', () => this.downloadPrompt());

    // Add file-related listeners
    this.selectFolderBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
  }

  loadSavedText() {
    const savedText = localStorage.getItem('savedText');
    if (savedText) {
      this.textInput.value = savedText;
    }
  }

  loadSavedSettings() {
    const settings = JSON.parse(localStorage.getItem('quizSettings') || '{}');
    if (settings.difficulty) {
      this.difficultySelect.value = settings.difficulty;
    }
    if (settings.questionLength) {
      this.questionLengthSelect.value = settings.questionLength;
    }
    if (settings.customLength) {
      this.customLengthInput.value = settings.customLength;
    }
    if (settings.questionStyle) {
      this.questionStyle.value = settings.questionStyle;
    }
    
    // Show/hide custom length input
    const isCustom = this.questionLengthSelect.value === 'custom';
    this.customLengthInput.classList.toggle('hidden', !isCustom);
  }

  saveSettings() {
    const settings = {
      difficulty: this.difficultySelect.value,
      questionLength: this.questionLengthSelect.value,
      customLength: this.customLengthInput.value,
      questionStyle: this.questionStyle.value
    };
    localStorage.setItem('quizSettings', JSON.stringify(settings));
  }

  toggleApiKeyVisibility() {
    const isPassword = this.apiKeyInput.type === 'password';
    this.apiKeyInput.type = isPassword ? 'text' : 'password';
    this.toggleApiKeyBtn.textContent = isPassword ? '隱藏' : '顯示';
  }

  saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    if (apiKey) {
      this.apiKey = apiKey;
      localStorage.setItem('apiKey', apiKey);
      alert('API Key 已儲存!');
    }
  }

  resetApiKey() {
    this.apiKey = '';
    this.apiKeyInput.value = '';
    localStorage.removeItem('apiKey');
    alert('API Key 已重設!');
  }

  async generateQuestions() {
    if (!this.apiKey) {
      alert('請先輸入 API Key!');
      return;
    }

    const text = this.textInput.value.trim();
    if (!text) {
      alert('請輸入文本內容!');
      return;
    }

    const count = parseInt(this.questionCount.value);
    
    try {
      // 顯示載入中的提示,包含預計時間
      const estimatedTime = Math.ceil(count * 2); // 預估每題約需2秒
      this.questionsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p>正在生成題目,請耐心等待...</p>
          <p>預計需要 ${estimatedTime} 秒</p>
          <div style="margin: 20px auto; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </div>
      `;
      this.quizContainer.classList.remove('hidden');

      // 設定較長的 timeout
      const timeout = count * 5000; // 每題給予5秒的緩衝時間
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const questions = await this.callGeminiAPI(text, count, controller.signal);
      clearTimeout(timeoutId);
      
      this.currentQuestions = questions;
      this.displayQuestions();
    } catch (error) {
      if (error.name === 'AbortError') {
        alert('生成題目時間較長,請稍後重試');
      } else {
        alert(`生成題目時發生錯誤: ${error.message}`);
      }
      console.error('Generation Error:', error);
      this.questionsContainer.innerHTML = '';
      this.quizContainer.classList.add('hidden');
    }
  }

  generatePromptText(count) {
    const difficulty = this.difficultySelect.value;
    const lengthType = this.questionLengthSelect.value;
    const targetLength = lengthType === 'custom' 
      ? this.customLengthInput.value 
      : lengthType;
    const style = this.questionStyle.value;

    let difficultyPrompt = '';
    switch(difficulty) {
      case 'easy':
        difficultyPrompt = '簡單難度(適合初學者,題目較為直觀)';
        break;
      case 'medium':
        difficultyPrompt = '中等難度(需要較深入的理解和思考)';
        break;
      case 'hard':
        difficultyPrompt = '困難難度(需要深入理解和綜合分析能力)';
        break;
    }

    let stylePrompt = '';
    switch(style) {
      case 'scenario':
        stylePrompt = '題目要融入日常生活情境,讓考題更貼近實際應用';
        break;
      case 'professional':
        stylePrompt = '題目要採用專業學術的表達方式,突出理論概念';
        break;
      case 'simple':
        stylePrompt = '題目要用最淺白易懂的方式表達,適合初學者理解';
        break;
      default:
        stylePrompt = '使用一般的題型表達方式';
    }

    const text = this.textInput.value.trim();
    
    return `請根據以下文本生成 ${count} 個${difficultyPrompt}的單選題。
每個題目需包含4個選項(A、B、C、D)。
題幹長度要求:每題約${targetLength}字左右。
題目風格要求:${stylePrompt}

請嚴格按照以下JSON格式回答,不要加入任何其他文字:
{
  "questions": [
    {
      "question": "題目內容",
      "options": [
        "A. 選項1",
        "B. 選項2",
        "C. 選項3",
        "D. 選項4"
      ],
      "correctAnswer": 0,
      "explanation": "答案解釋"
    }
  ]
}

文本內容:
${text}`;
  }

  async callGeminiAPI(text, count, signal) {
    try {
      const batchSize = 10;
      const batches = Math.ceil(count / batchSize);
      let allQuestions = [];

      for (let i = 0; i < batches; i++) {
        const currentBatchCount = Math.min(batchSize, count - i * batchSize);
        if (currentBatchCount <= 0) break;

        const prompt = this.generatePromptText(currentBatchCount);

        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=' + this.apiKey, {
          method: 'POST',
          signal: signal,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API 請求失敗: ${errorData.error?.message || '未知錯誤'}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error('API 回應格式無效');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json\s*|\s*```/g, '');
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          console.error('No JSON found in response:', responseText);
          throw new Error('無法在回應中找到JSON格式');
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
          throw new Error('JSON格式不符合預期結構');
        }

        allQuestions = [...allQuestions, ...parsedData.questions];

        // Update loading message
        const progress = Math.round((allQuestions.length / count) * 100);
        this.questionsContainer.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <p>正在生成題目,請耐心等待...</p>
            <p>進度: ${progress}%</p>
            <div style="margin: 20px auto; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          </div>
        `;

        // Add a small delay between batches to avoid rate limiting
        if (i < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return allQuestions;
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  }

  displayQuestions() {
    this.questionsContainer.innerHTML = this.currentQuestions.map((q, index) => `
      <div class="question">
        <p>${q.question}</p>
        ${q.options.map((option, i) => `
          <div>
            <input type="radio" name="q${index}" value="${i}" id="q${index}o${i}">
            <label for="q${index}o${i}">${option}</label>
          </div>
        `).join('')}
      </div>
    `).join('');

    this.quizContainer.classList.remove('hidden');
    this.resultsContainer.classList.add('hidden');
    this.wrongQuestionsContainer.classList.add('hidden');
  }

  submitQuiz() {
    const answers = this.currentQuestions.map((_, index) => {
      const selected = document.querySelector(`input[name="q${index}"]:checked`);
      return selected ? parseInt(selected.value) : -1;
    });

    const results = this.currentQuestions.map((q, index) => ({
      ...q,
      userAnswer: answers[index],
      isCorrect: answers[index] === q.correctAnswer
    }));

    this.displayResults(results);
    this.updateWrongQuestions(results);
  }

  displayResults(results) {
    const score = results.filter(r => r.isCorrect).length;
    this.scoreContainer.innerHTML = `得分: ${score}/${results.length}`;

    this.explanationsContainer.innerHTML = results.map(r => `
      <div class="question ${r.isCorrect ? 'correct' : 'incorrect'}">
        <p>${r.question}</p>
        <p>你的答案: ${r.options[r.userAnswer]}</p>
        <p>正確答案: ${r.options[r.correctAnswer]}</p>
        <div class="explanation">${r.explanation}</div>
      </div>
    `).join('');

    this.resultsContainer.classList.remove('hidden');
  }

  updateWrongQuestions(results) {
    const wrongOnes = results.filter(r => !r.isCorrect);
    this.wrongQuestions = [...this.wrongQuestions, ...wrongOnes];
    localStorage.setItem('wrongQuestions', JSON.stringify(this.wrongQuestions));

    if (wrongOnes.length > 0) {
      this.displayWrongQuestions();
    }
  }

  displayWrongQuestions() {
    this.wrongQuestionsList.innerHTML = this.wrongQuestions.map(q => `
      <div class="question">
        <p>${q.question}</p>
        <p>正確答案: ${q.options[q.correctAnswer]}</p>
        <div class="explanation">${q.explanation}</div>
      </div>
    `).join('');

    this.wrongQuestionsContainer.classList.remove('hidden');
  }

  reviewWrongQuestions() {
    this.currentQuestions = [...this.wrongQuestions];
    this.displayQuestions();
    this.wrongQuestions = [];
    localStorage.setItem('wrongQuestions', '[]');
  }

  downloadContent() {
    const text = this.textInput.value.trim();
    let content = '# 學習文本\n\n' + text + '\n\n';
    
    if (this.currentQuestions && this.currentQuestions.length > 0) {
      content += '# 練習題目\n\n';
      this.currentQuestions.forEach((q, index) => {
        content += `## 題目 ${index + 1}\n\n`;
        content += q.question + '\n\n';
        q.options.forEach(option => {
          content += option + '\n';
        });
        content += `\n正確答案: ${q.options[q.correctAnswer]}\n`;
        content += `詳解: ${q.explanation}\n\n`;
      });
    }

    // Create wrong questions section if exists
    if (this.wrongQuestions && this.wrongQuestions.length > 0) {
      content += '# 錯題記錄\n\n';
      this.wrongQuestions.forEach((q, index) => {
        content += `## 錯題 ${index + 1}\n\n`;
        content += q.question + '\n\n';
        q.options.forEach(option => {
          content += option + '\n';
        });
        content += `\n正確答案: ${q.options[q.correctAnswer]}\n`;
        content += `詳解: ${q.explanation}\n\n`;
      });
    }

    // Get current date and time for filename
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-TW').replace(/:/g, '-');
    
    // Create and trigger download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `學習內容_${dateStr}_${timeStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  downloadPrompt() {
    const count = parseInt(this.questionCount.value);
    const promptText = this.generatePromptText(count);
    
    // Get current date and time for filename
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-TW').replace(/:/g, '-');
    
    // Create and trigger download
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `題目生成提示詞_${dateStr}_${timeStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async handleFileSelect(event) {
    const files = Array.from(event.target.files).filter(file => file.name.endsWith('.txt'));
    this.fileList.innerHTML = '';
    this.fileContents.clear();

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const fileName = file.name.replace('.txt', '');
        this.fileContents.set(fileName, content);
        
        const button = document.createElement('button');
        button.className = 'file-button';
        button.textContent = fileName;
        button.addEventListener('click', () => this.loadFileContent(fileName));
        
        this.fileList.appendChild(button);
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  loadFileContent(fileName) {
    // Remove active class from all buttons
    this.fileList.querySelectorAll('.file-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to selected button
    const selectedBtn = Array.from(this.fileList.children)
      .find(btn => btn.textContent === fileName);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }

    // Load content to textarea
    const content = this.fileContents.get(fileName);
    if (content) {
      this.textInput.value = content;
      localStorage.setItem('savedText', content);
    }
  }

  initializeFileSystem() {
    // Handle drag and drop
    const dropZone = document.querySelector('.file-section');
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const items = e.dataTransfer.items;
      if (items) {
        const files = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry();
          if (item) {
            this.traverseFileTree(item, files);
          }
        }
      }
    });
  }

  async traverseFileTree(item, files) {
    if (item.isFile) {
      if (item.name.endsWith('.txt')) {
        const file = await new Promise((resolve) => item.file(resolve));
        files.push(file);
        const content = await this.readFile(file);
        const fileName = file.name.replace('.txt', '');
        this.fileContents.set(fileName, content);
        
        const button = document.createElement('button');
        button.className = 'file-button';
        button.textContent = fileName;
        button.addEventListener('click', () => this.loadFileContent(fileName));
        
        this.fileList.appendChild(button);
      }
    } else if (item.isDirectory) {
      const reader = item.createReader();
      const entries = await new Promise((resolve) => {
        reader.readEntries(resolve);
      });
      for (const entry of entries) {
        await this.traverseFileTree(entry, files);
      }
    }
  }

  initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tabId = btn.dataset.tab;
        contents.forEach(content => {
          content.style.display = content.id === `${tabId}Content` ? 'block' : 'none';
        });
      });
    });
  }

  initializeLanguageSwitch() {
    const langBtn = document.getElementById('langToggle');
    langBtn.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
      this.updateLanguage();
      langBtn.textContent = this.currentLang === 'zh' ? 'English' : '中文';
    });
  }

  updateLanguage() {
    const translations = this.translations[this.currentLang];
    
    // Update all text content
    document.title = translations.title;
    document.querySelector('h1').textContent = translations.title;
    document.querySelector('[data-tab="main"]').textContent = translations.mainTab;
    document.querySelector('[data-tab="help"]').textContent = translations.helpTab;
    
    // Update API key section
    document.querySelector('label[for="apiKey"]').textContent = translations.apiKeyLabel;
    document.getElementById('toggleApiKey').textContent = translations.showBtn;
    document.getElementById('saveApiKey').textContent = translations.saveBtn;
    document.getElementById('resetApiKey').textContent = translations.resetBtn;
    
    // Update file section
    document.getElementById('selectFolder').textContent = translations.selectFolderBtn;
    
    // Update textarea
    document.getElementById('textInput').placeholder = translations.textareaPlaceholder;
    
    // Update options section
    document.querySelector('label[for="questionCount"]').textContent = translations.questionCountLabel;
    document.querySelector('label[for="difficulty"]').textContent = translations.difficultyLabel;
    document.querySelector('label[for="questionLength"]').textContent = translations.questionLengthLabel;
    document.querySelector('label[for="questionStyle"]').textContent = translations.questionStyleLabel;
    
    // Update buttons
    document.getElementById('generateQuestions').textContent = translations.generateBtn;
    document.getElementById('downloadContent').textContent = translations.downloadContentBtn;
    document.getElementById('downloadPrompt').textContent = translations.downloadPromptBtn;
    document.getElementById('submitQuiz').textContent = translations.submitBtn;
    document.getElementById('reviewWrongQuestions').textContent = translations.reviewWrongBtn;
    
    // Update select options
    const difficultySelect = document.getElementById('difficulty');
    Array.from(difficultySelect.options).forEach(option => {
      option.textContent = translations.difficultyOptions[option.value];
    });
    
    const lengthSelect = document.getElementById('questionLength');
    Array.from(lengthSelect.options).forEach(option => {
      option.textContent = translations.lengthOptions[option.value];
    });
    
    const styleSelect = document.getElementById('questionStyle');
    Array.from(styleSelect.options).forEach(option => {
      option.textContent = translations.styleOptions[option.value];
    });
    
    // Update footer
    const footerParagraphs = document.querySelectorAll('.footer p');
    footerParagraphs[0].textContent = translations.footer.credit;
    footerParagraphs[1].textContent = translations.footer.copyright;
    footerParagraphs[2].innerHTML = `${translations.footer.more}<a href="https://padlet.com/clongwh/puti_ai_tools" target="_blank">https://padlet.com/clongwh/puti_ai_tools</a>`;
  }

}

document.addEventListener('DOMContentLoaded', () => {
  new QuizManager();
});