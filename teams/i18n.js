class I18nManager {
  constructor() {
    this.currentLang = 'zh-TW';
    this.translations = {
      'zh-TW': {
        'title': 'Puti-Ai 學生分組與計分器',
        'studentListPlaceholder': '請輸入學生名單（每行一個）',
        'rememberList': '記憶清單',
        'groupingMode': '分組模式',
        'randomMode': '隨機分組',
        'numberOfGroups': '分組數量',
        'groups2': '2組',
        'groups3': '3組',
        'groups4': '4組',
        'groups5': '5組',
        'custom': '自訂',
        'saveLoad': '儲存/載入分組',
        'saveName': '儲存名稱',
        'save': '儲存',
        'loadGroups': '載入分組',
        'load': '載入',
        'reset': '重置',
        'clearMemory': '清除分組記憶',
        'raceTitle': '🏁 競賽排行榜 🏁',
        'targetScore': '目標分數：',
        'group': '第 {0} 組',
        'score': '分數: {0}',
        'congratulations': '🎉 恭喜 {0} 獲勝！🎉',
        'reachedTarget': '成功達到目標分數 {0} 分！',
        'close': '關閉',
        'enterCustomGroups': '請輸入自訂分組數量：',
        'invalidGroupNumber': '請輸入有效的分組數量',
        'enterSaveName': '請輸入儲存名稱',
        'groupsSaved': '分組已儲存！',
        'selectGroupToLoad': '請選擇要載入的分組',
        'groupsNotFound': '找不到儲存的分組',
        'clearedAllGroups': '已清除所有儲存的分組！',
        'instructions': '使用說明',
        'instruction1': '在文字框中輸入學生名單（每行一個名字）',
        'instruction2': '可勾選「記憶清單」以保存名單',
        'instruction3': '選擇分組數量（2-5組或自訂）',
        'instruction4': '點擊「隨機分組」進行自動分組',
        'instruction5': '使用 +1/-1 按鈕為各組加減分數',
        'instruction6': '可設定目標分數，首先達到的組別獲勝',
        'instruction7': '可儲存分組結果，方便下次載入使用',
        'instruction8': '可手動拖曳學生名單至各組，或先手動拖曳組長後再隨機分配其他成員',
        'instruction9': '點擊「個人得分」按鈕可查看/隱藏個人累積得分',
        'instruction10': '個人得分區可針對個人加減分數，並自動儲存',
        'copyright': '屏東縣後庄國小黃朝榮老師作品，免費分享，歡迎推廣。嚴禁商用與任何侵權、不尊重著作權的行為。',
        'personalScores': '個人得分',
        'exportScores': '匯出成績',
        'studentName': '學生姓名',
        'confirmReset': '重置將清除所有個人分數，是否要先匯出成績檔案？',
        'showPersonalScores': '顯示個人得分',
        'hidePersonalScores': '隱藏個人得分'
      },
      'en': {
        'title': 'Puti-Ai Student Grouping & Scoring System',
        'studentListPlaceholder': 'Enter student names (one per line)',
        'rememberList': 'Remember List',
        'groupingMode': 'Grouping Mode',
        'randomMode': 'Random Groups',
        'numberOfGroups': 'Number of Groups',
        'groups2': '2 Groups',
        'groups3': '3 Groups',
        'groups4': '4 Groups',
        'groups5': '5 Groups',
        'custom': 'Custom',
        'saveLoad': 'Save/Load Groups',
        'saveName': 'Save Name',
        'save': 'Save',
        'loadGroups': 'Load Groups',
        'load': 'Load',
        'reset': 'Reset',
        'clearMemory': 'Clear Saved Groups',
        'raceTitle': '🏁 Race Leaderboard 🏁',
        'targetScore': 'Target Score:',
        'group': 'Group {0}',
        'score': 'Score: {0}',
        'congratulations': '🎉 Congratulations {0} Wins! 🎉',
        'reachedTarget': 'Successfully reached the target score of {0}!',
        'close': 'Close',
        'enterCustomGroups': 'Enter number of custom groups:',
        'invalidGroupNumber': 'Please enter a valid number of groups',
        'enterSaveName': 'Please enter a save name',
        'groupsSaved': 'Groups saved successfully!',
        'selectGroupToLoad': 'Please select groups to load',
        'groupsNotFound': 'Saved groups not found',
        'clearedAllGroups': 'All saved groups have been cleared!',
        'instructions': 'Instructions',
        'instruction1': 'Enter student names in the text box (one name per line)',
        'instruction2': 'Check "Remember List" to save the list',
        'instruction3': 'Choose number of groups (2-5 or custom)',
        'instruction4': 'Click "Random Groups" for automatic grouping',
        'instruction5': 'Use +1/-1 buttons to adjust group scores',
        'instruction6': 'Set a target score - first group to reach it wins',
        'instruction7': 'Save group arrangements for future use',
        'instruction8': 'Manually drag students to groups, or drag team leaders first then randomize remaining members',
        'instruction9': 'Click "Personal Scores" button to show/hide individual cumulative scores',
        'instruction10': 'Personal scores section allows individual score adjustments and auto-saves',
        'copyright': 'Created by Teacher Huang Chao-Jung from Houchuang Elementary School, Pingtung County. Free to share and promote. Commercial use and any copyright infringement are strictly prohibited.',
        'personalScores': 'Personal Scores',
        'exportScores': 'Export Scores',
        'studentName': 'Student Name',
        'confirmReset': 'Reset will clear all personal scores. Do you want to export scores first?',
        'showPersonalScores': 'Show Personal Scores',
        'hidePersonalScores': 'Hide Personal Scores'
      }
    };
    
    this.init();
  }

  init() {
    this.setupLanguageSwitcher();
    this.updateContent();
  }

  setupLanguageSwitcher() {
    document.querySelectorAll('.language-switcher button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setLanguage(e.target.dataset.lang);
        document.querySelectorAll('.language-switcher button').forEach(b => 
          b.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }

  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    this.updateContent();
  }

  translate(key, params = []) {
    let text = this.translations[this.currentLang][key] || key;
    params.forEach((param, index) => {
      text = text.replace(`{${index}}`, param);
    });
    return text;
  }

  updateContent() {
    // Update title
    document.title = this.translate('title');
    document.querySelector('h1').textContent = this.translate('title');

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = this.translate(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      element.placeholder = this.translate(key);
    });

    // Update student list placeholder
    document.getElementById('studentList').placeholder = 
      this.translate('studentListPlaceholder');

    // Dispatch event for dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLang }
    }));
  }
}

// Initialize I18n manager
window.i18n = new I18nManager();