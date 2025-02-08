const translations = {
  zh: {
    title: 'Puti-AI 簡易文本簡報產生器',
    editor: '編輯器',
    help: '使用說明',
    editorDesc: '貼上文本，以空行分段，每段就是一頁投影片（第一行為標題）',
    placeholder: '在此貼上文本...\n\n範例：\n\n第一張投影片標題\n這是第一張投影片的內容\n可以分行\n自由排版\n\n第二張投影片標題\n這是第二張投影片的內容',
    startBtn: '播放簡報',
    exportBtn: '匯出簡報',
    importBtn: '匯入簡報',
    prevSlide: '上一頁',
    nextSlide: '下一頁',
    endPresentation: '結束播放',
    helpTitle: '使用說明',
    basicOps: '基本操作',
    helpBasic1: '將文本貼入編輯區，使用空行分隔不同頁面',
    helpBasic2: '每個段落的第一行會自動成為該頁標題',
    helpBasic3: '點擊「播放簡報」開始播放',
    playbackControls: '播放控制',
    helpControl1: '使用畫面上方的按鈕或下拉選單切換頁面',
    helpControl2: '鍵盤快捷鍵：',
    helpControl3: '→ / 空格鍵 / Enter：下一頁',
    helpControl4: '← / Backspace：上一頁',
    helpControl5: 'ESC：結束播放',
    helpControl6: '觸控裝置可左右滑動切換頁面',
    display: '簡報顯示',
    helpDisplay1: '簡報畫面可自由調整大小：',
    helpDisplay2: '拖曳簡報框右下角可調整尺寸',
    helpDisplay3: '文字會自動隨簡報大小縮放',
    helpDisplay4: '保持 4:3 比例以確保最佳顯示效果',
    helpDisplay5: '文字排版會依照原始文本的分行方式呈現',
    dataManagement: '資料管理',
    helpData1: '編輯器內容會自動儲存在本機',
    helpData2: '匯出功能：將目前的簡報內容儲存為檔案',
    helpData3: '匯入功能：讀取先前儲存的簡報檔案',
    copyright1: '屏東縣後庄國小黃朝榮老師作品',
    copyright2: '免費分享，歡迎擴散推廣',
    copyright3: '嚴禁商用與任何侵權、不尊重著作權的行為',
    copyright4: '更多 Puti-AI教學工具:',
    importSuccess: '簡報已成功匯入！',
    importError: '無法讀取檔案。請確保是有效的簡報檔案。',
    noContent: '請先輸入簡報內容！',
    noValidContent: '未找到有效的簡報內容！'
  },
  en: {
    title: 'Puti-AI Simple Text Presentation Generator',
    editor: 'Editor',
    help: 'Help',
    editorDesc: 'Paste text, separate slides with blank lines (first line becomes the title)',
    placeholder: 'Paste your text here...\n\nExample:\n\nFirst Slide Title\nThis is the content of the first slide\nYou can use multiple lines\nFor formatting\n\nSecond Slide Title\nThis is the content of the second slide',
    startBtn: 'Start Presentation',
    exportBtn: 'Export',
    importBtn: 'Import',
    prevSlide: 'Previous',
    nextSlide: 'Next',
    endPresentation: 'End Presentation',
    helpTitle: 'User Guide',
    basicOps: 'Basic Operations',
    helpBasic1: 'Paste text into the editor, separate slides with blank lines',
    helpBasic2: 'The first line of each section becomes the slide title',
    helpBasic3: 'Click "Start Presentation" to begin',
    playbackControls: 'Playback Controls',
    helpControl1: 'Use the buttons or dropdown menu to navigate slides',
    helpControl2: 'Keyboard shortcuts:',
    helpControl3: '→ / Space / Enter: Next slide',
    helpControl4: '← / Backspace: Previous slide',
    helpControl5: 'ESC: End presentation',
    helpControl6: 'Swipe left/right on touch devices to navigate',
    display: 'Presentation Display',
    helpDisplay1: 'Presentation size can be adjusted:',
    helpDisplay2: 'Drag the bottom-right corner to resize',
    helpDisplay3: 'Text automatically scales with slide size',
    helpDisplay4: 'Maintains 4:3 ratio for optimal display',
    helpDisplay5: 'Text formatting follows original line breaks',
    dataManagement: 'Data Management',
    helpData1: 'Editor content is automatically saved locally',
    helpData2: 'Export: Save presentation content to file',
    helpData3: 'Import: Load previously saved presentations',
    copyright1: 'Created by Teacher Huang Chao-Jung, Houzhuang Elementary School, Pingtung County',
    copyright2: 'Free to share and distribute',
    copyright3: 'Commercial use and copyright infringement strictly prohibited',
    copyright4: 'More Puti-AI Teaching Tools:',
    importSuccess: 'Presentation imported successfully!',
    importError: 'Unable to read file. Please ensure it is a valid presentation file.',
    noContent: 'Please enter presentation content first!',
    noValidContent: 'No valid presentation content found!'
  }
};

class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'zh';
    this.init();
  }

  init() {
    this.updateLanguage(this.currentLang);
    this.setupLanguageSwitcher();
  }

  setupLanguageSwitcher() {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        this.updateLanguage(lang);
        localStorage.setItem('language', lang);
        
        langBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      
      if (btn.dataset.lang === this.currentLang) {
        btn.classList.add('active');
      }
    });
  }

  updateLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.dataset.i18n;
      if (translations[lang][key]) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = translations[lang][key];
        } else {
          element.textContent = translations[lang][key];
        }
      }
    });
  }

  t(key) {
    return translations[this.currentLang][key] || key;
  }
}

const i18n = new I18n();