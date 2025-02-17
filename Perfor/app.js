// Constants
const CLASSES = ['一忠', '二忠', '三忠', '四忠', '五忠', '六忠'];
const STORAGE_KEY = 'studentScores';
const PASSWORD_KEY = 'rememberedPassword';

// Password configuration
const PASSWORDS = {
  '101': { class: '一忠', message: '歡迎一忠導師登入' },
  '201': { class: '二忠', message: '歡迎二忠導師登入' },
  '301': { class: '三忠', message: '歡迎三忠導師登入' },
  '401': { class: '四忠', message: '歡迎四忠導師登入' },
  '501': { class: '五忠', message: '歡迎五忠導師登入' },
  '601': { class: '六忠', message: '歡迎六忠導師登入' },
  '701': { class: 'admin', message: '歡迎行政人員登入' }
};

// State management
let currentClass = null;
let selectedStudents = new Set();
let studentScores = {};
let isAuthenticated = false;
let userRole = null;

// Sound effects manager
const soundManager = {
  click: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3']
  }),
  success: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3']
  }),
  select: new Howl({
    src: ['https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3']
  })
};

// Load scores from localStorage
function loadScores() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    studentScores = JSON.parse(saved);
  }
}

// Save scores to localStorage
function saveScores() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studentScores));
}

// Initialize class data
async function initializeClass(className) {
  try {
    const response = await fetch(`${className}.txt`);
    const text = await response.text();
    return text.trim().split('\n').map(name => name.trim());
  } catch (error) {
    console.error(`Error loading ${className}:`, error);
    return [];
  }
}

// Update student cards
async function updateStudentCards(className) {
  const container = document.getElementById('student-cards');
  container.innerHTML = '';
  
  const students = await initializeClass(className);
  if (!students.length) return;

  // Add "All Students" card
  const totalScore = Object.values(studentScores[className] || {}).reduce((a, b) => a + b, 0);
  createStudentCard('全班學生', totalScore, container, true);

  // Add individual student cards
  students.forEach(student => {
    const score = (studentScores[className] || {})[student] || 0;
    createStudentCard(student, score, container);
  });
}

// Create student card
function createStudentCard(name, score, container, isAllStudents = false) {
  const card = document.createElement('div');
  card.className = 'student-card';
  if (isAllStudents) card.dataset.allStudents = 'true';
  
  const scoreClass = score < 0 ? 'student-score negative' : 'student-score';
  
  card.innerHTML = `
    <div class="student-name">${name}</div>
    <div class="${scoreClass}">${score}</div>
  `;

  card.addEventListener('click', () => {
    soundManager.select.play();
    if (isAllStudents) {
      const allCards = document.querySelectorAll('.student-card:not([data-all-students])');
      if (selectedStudents.size === allCards.length) {
        selectedStudents.clear();
        allCards.forEach(c => c.classList.remove('selected'));
      } else {
        allCards.forEach(c => {
          c.classList.add('selected');
          selectedStudents.add(c.querySelector('.student-name').textContent);
        });
      }
    } else {
      card.classList.toggle('selected');
      const studentName = card.querySelector('.student-name').textContent;
      if (selectedStudents.has(studentName)) {
        selectedStudents.delete(studentName);
      } else {
        selectedStudents.add(studentName);
      }
    }
  });

  container.appendChild(card);
}

// Update score history
function updateScoreHistory(className) {
  const container = document.getElementById('score-history');
  const history = [];
  
  if (studentScores[className]) {
    Object.entries(studentScores[className]).forEach(([student, score]) => {
      history.push(`${student}: ${score}分`);
    });
    const totalScore = Object.values(studentScores[className]).reduce((a, b) => a + b, 0);
    history.push(`全班總分：${totalScore}分`);
  }
  
  container.innerHTML = history.join('<br>');
}

// Authentication functions
function togglePasswordForm() {
  const form = document.getElementById('password-form');
  form.classList.toggle('visible');
}

function checkRememberedPassword() {
  const remembered = localStorage.getItem(PASSWORD_KEY);
  if (remembered) {
    document.getElementById('password').value = remembered;
    document.getElementById('remember-password').checked = true;
    authenticateUser(remembered);
  }
}

function authenticateUser(password) {
  const auth = PASSWORDS[password];
  const messageElement = document.getElementById('login-message');
  
  if (auth) {
    isAuthenticated = true;
    userRole = auth.class;
    messageElement.textContent = auth.message;
    
    if (document.getElementById('remember-password').checked) {
      localStorage.setItem(PASSWORD_KEY, password);
    } else {
      localStorage.removeItem(PASSWORD_KEY);
    }
    
    updateUIAfterAuth();
    return true;
  } else {
    messageElement.textContent = '密碼錯誤，請洽網管';
    return false;
  }
}

function updateUIAfterAuth() {
  const classButtons = document.getElementById('class-buttons');
  
  if (userRole === 'admin') {
    classButtons.classList.remove('hidden');
  } else {
    classButtons.classList.remove('hidden');
    document.querySelectorAll('#class-buttons button').forEach(btn => {
      if (btn.dataset.class !== userRole) {
        btn.style.display = 'none';
      } else {
        btn.click();
      }
    });
  }
  
  document.getElementById('password-form').classList.remove('visible');
}

// Initialize UI
function initializeUI() {
  loadScores();
  
  // Hide class buttons initially
  document.getElementById('class-buttons').classList.add('hidden');
  
  // Password toggle handler
  document.getElementById('password-toggle').addEventListener('click', () => {
    soundManager.click.play();
    togglePasswordForm();
  });
  
  // Password form handler
  document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    authenticateUser(password);
  });
  
  // Check for remembered password
  checkRememberedPassword();
  
  // Class button handlers
  document.getElementById('class-buttons').addEventListener('click', async (e) => {
    if (e.target.matches('button')) {
      soundManager.click.play();
      document.querySelectorAll('#class-buttons button').forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
      currentClass = e.target.dataset.class;
      selectedStudents.clear();
      await updateStudentCards(currentClass);
      updateScoreHistory(currentClass);
    }
  });

  // Score button handlers
  document.getElementById('scoring-controls').addEventListener('click', async (e) => {
    if (e.target.matches('.score-btn')) {
      soundManager.click.play();
      if (e.target.id === 'custom-score') {
        const score = prompt('請輸入分數：');
        if (score && !isNaN(score)) {
          applyScore(Number(score));
        }
      } else if (e.target.dataset.score) {
        applyScore(Number(e.target.dataset.score));
      }
    }
  });

  // Submit score handler
  document.getElementById('submit-score').addEventListener('click', () => {
    soundManager.success.play();
    saveScores();
    updateScoreHistory(currentClass);
    selectedStudents.clear();
    document.querySelectorAll('.student-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
  });

  // Export CSV handler
  document.getElementById('export-csv').addEventListener('click', () => {
    if (!currentClass || !studentScores[currentClass]) return;
    
    const rows = [['學生', '分數']];
    Object.entries(studentScores[currentClass]).forEach(([student, score]) => {
      rows.push([student, score]);
    });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `${date}學生表現紀錄表.csv`;
    link.click();
  });
}

// Apply score to selected students
function applyScore(score) {
  if (!currentClass || !selectedStudents.size) return;
  
  if (!studentScores[currentClass]) {
    studentScores[currentClass] = {};
  }
  
  selectedStudents.forEach(student => {
    if (student !== '全班學生') {
      studentScores[currentClass][student] = (studentScores[currentClass][student] || 0) + score;
    }
  });
  
  updateStudentCards(currentClass);
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeUI);