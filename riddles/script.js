// Sky lantern background
const createSkyLanterns = () => {
  const container = document.createElement('div');
  container.className = 'sky-lanterns';
  document.body.appendChild(container);

  const createLantern = () => {
    const lantern = document.createElement('div');
    lantern.className = 'sky-lantern';
    
    // Random properties for natural movement
    const duration = 20 + Math.random() * 20; // 20-40 seconds
    const scale = 0.5 + Math.random() * 1.5; // 0.5-2.0 size
    const startX = Math.random() * window.innerWidth;
    const drift = -100 + Math.random() * 200; // -100px to 100px horizontal drift
    
    lantern.style.cssText = `
      left: ${startX}px;
      --duration: ${duration}s;
      --scale: ${scale};
      --drift: ${drift}px;
    `;
    
    container.appendChild(lantern);
    
    // Remove lantern after animation
    lantern.addEventListener('animationend', () => {
      lantern.remove();
    });
  };

  // Create initial lanterns
  for (let i = 0; i < 5; i++) {
    setTimeout(() => createLantern(), Math.random() * 5000);
  }

  // Continuously create new lanterns
  setInterval(() => {
    if (container.children.length < 10) { // Limit max lanterns
      createLantern();
    }
  }, 3000);
};

let riddleSets = {};
let currentSetName = '';
let currentRiddleIndex = -1;
let currentAnswer = '';

// Default riddle sets to load
const defaultRiddleSets = [
  '文字篇.txt',
  '動物篇.txt',
  '腦筋急轉彎篇.txt',
  '台灣地名篇.txt',
  '成語篇.txt',
  '物品篇.txt',
  '食物篇.txt'
];

// Load saved riddle sets from localStorage
const loadSavedRiddleSets = async () => {
  const saved = localStorage.getItem('riddleSets');
  if (saved) {
    riddleSets = JSON.parse(saved);
    updateRiddleSetButtons();
  } else {
    // Load default riddle sets if no saved data
    await loadDefaultRiddleSets();
  }
};

// Load default riddle sets
const loadDefaultRiddleSets = async () => {
  for (const fileName of defaultRiddleSets) {
    try {
      const response = await fetch(fileName);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      const riddles = [];
      
      for (let i = 0; i < lines.length; i += 2) {
        if (i + 1 < lines.length) {
          riddles.push({
            question: lines[i].trim(),
            answer: lines[i + 1].trim()
          });
        }
      }
      
      if (riddles.length > 0) {
        const setName = fileName.replace('.txt', '');
        riddleSets[setName] = riddles;
      }
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error);
    }
  }
  
  saveRiddleSets();
  updateRiddleSetButtons();
};

// Save riddle sets to localStorage
const saveRiddleSets = () => {
  localStorage.setItem('riddleSets', JSON.stringify(riddleSets));
};

// Audio context setup
let audioContext;
const initAudio = () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
};

// Sound effects
const playSound = (frequency, type, duration) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

const playCorrectSound = () => {
  playSound(523.25, 'sine', 0.1); // C5
  setTimeout(() => playSound(659.25, 'sine', 0.1), 100); // E5
  setTimeout(() => playSound(783.99, 'sine', 0.2), 200); // G5
};

const playIncorrectSound = () => {
  playSound(392.00, 'square', 0.2); // G4
  setTimeout(() => playSound(369.99, 'square', 0.3), 200); // F#4
};

// Fireworks effect
const createFirework = (x, y, color) => {
  const firework = document.createElement('div');
  firework.className = 'firework';
  firework.style.left = x + 'px';
  firework.style.top = y + 'px';
  firework.style.backgroundColor = color;
  
  document.querySelector('.fireworks').appendChild(firework);
  
  setTimeout(() => {
    firework.remove();
  }, 1000);
};

const createFireworks = () => {
  const colors = ['#ff0', '#f0f', '#0ff', '#ff4d4d', '#90ff90'];
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      createFirework(x, y, colors[Math.floor(Math.random() * colors.length)]);
    }, i * 100);
  }
};

// Music player functionality
let currentMusic = null;
let musicPlayer = null;

// DOM Elements
const elements = {
  toggleInput: document.getElementById('toggleInput'),
  riddleInput: document.getElementById('riddleInput'),
  fileInput: document.getElementById('fileInput'),
  riddleSets: document.getElementById('riddleSets'),
  currentRiddle: document.getElementById('currentRiddle'),
  nextRiddle: document.getElementById('nextRiddle'),
  showAnswer: document.getElementById('showAnswer'),
  answerButtons: document.querySelector('.answer-buttons'),
  correct: document.getElementById('correct'),
  incorrect: document.getElementById('incorrect'),
  result: document.getElementById('result'),
  helpButton: document.getElementById('helpButton'),
  backToGame: document.getElementById('backToGame'),
  mainContent: document.getElementById('mainContent'),
  helpContent: document.getElementById('helpContent'),
  toggleMusic: document.getElementById('toggleMusic'),
  musicSection: document.getElementById('musicSection'),
  musicInput: document.getElementById('musicInput'),
  playMusic: document.getElementById('playMusic'),
  stopMusic: document.getElementById('stopMusic'),
  currentMusic: document.getElementById('currentMusic')
};

// Help page navigation
elements.helpButton.addEventListener('click', () => {
  elements.mainContent.classList.add('hidden');
  elements.riddleInput.classList.add('hidden');
  elements.helpContent.classList.remove('hidden');
});

elements.backToGame.addEventListener('click', () => {
  elements.helpContent.classList.add('hidden');
  elements.mainContent.classList.remove('hidden');
});

// File handling
elements.fileInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  
  for (let file of files) {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const riddles = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (i + 1 < lines.length) {
        riddles.push({
          question: lines[i].trim(),
          answer: lines[i + 1].trim()
        });
      }
    }
    
    if (riddles.length > 0) {
      const setName = file.name.replace('.txt', '');
      riddleSets[setName] = riddles;
    }
  }
  
  saveRiddleSets();
  updateRiddleSetButtons();
  elements.fileInput.value = '';
});

// Music handling
elements.toggleMusic.addEventListener('click', () => {
  elements.musicSection.classList.toggle('hidden');
});

elements.musicInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // Stop current music if playing
    if (musicPlayer) {
      musicPlayer.pause();
      musicPlayer = null;
    }

    // Create new music player
    currentMusic = file;
    musicPlayer = new Audio(URL.createObjectURL(file));
    musicPlayer.loop = true;

    // Update UI
    elements.currentMusic.textContent = `當前音樂：${file.name}`;
    elements.playMusic.classList.remove('hidden');
    elements.stopMusic.classList.add('hidden');
  }
});

elements.playMusic.addEventListener('click', () => {
  if (musicPlayer) {
    musicPlayer.play();
    elements.playMusic.classList.add('hidden');
    elements.stopMusic.classList.remove('hidden');
  }
});

elements.stopMusic.addEventListener('click', () => {
  if (musicPlayer) {
    musicPlayer.pause();
    elements.playMusic.classList.remove('hidden');
    elements.stopMusic.classList.add('hidden');
  }
});

const updateRiddleSetButtons = () => {
  elements.riddleSets.innerHTML = '';
  
  Object.keys(riddleSets).forEach(setName => {
    const setContainer = document.createElement('div');
    
    const button = document.createElement('button');
    button.textContent = setName;
    button.className = `riddle-set-btn ${setName === currentSetName ? 'active' : ''}`;
    button.addEventListener('click', () => {
      currentSetName = setName;
      currentRiddleIndex = -1;
      updateRiddleSetButtons();
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      delete riddleSets[setName];
      if (currentSetName === setName) {
        currentSetName = '';
        currentRiddleIndex = -1;
      }
      saveRiddleSets();
      updateRiddleSetButtons();
    });
    
    setContainer.appendChild(button);
    setContainer.appendChild(removeBtn);
    elements.riddleSets.appendChild(setContainer);
  });
};

// Event Listeners
elements.toggleInput.addEventListener('click', () => {
  elements.riddleInput.classList.toggle('hidden');
});

elements.nextRiddle.addEventListener('click', () => {
  if (!audioContext) initAudio();
  
  if (!currentSetName || !riddleSets[currentSetName]) {
    alert('請先選擇題庫！');
    return;
  }
  
  const riddles = riddleSets[currentSetName];
  currentRiddleIndex = (currentRiddleIndex + 1) % riddles.length;
  elements.currentRiddle.textContent = riddles[currentRiddleIndex].question;
  currentAnswer = riddles[currentRiddleIndex].answer;
  elements.answerButtons.classList.add('hidden');
  elements.result.classList.add('hidden');
});

elements.showAnswer.addEventListener('click', () => {
  if (currentRiddleIndex === -1) {
    alert('請先出題！');
    return;
  }
  
  elements.currentRiddle.textContent = `答案是：${currentAnswer}`;
  elements.answerButtons.classList.remove('hidden');
});

elements.correct.addEventListener('click', () => {
  playCorrectSound();
  createFireworks();
  showResult('答對了！', '#90ff90');
});

elements.incorrect.addEventListener('click', () => {
  playIncorrectSound();
  showResult('答錯了！', '#ff4d4d');
});

const showResult = (text, color) => {
  elements.result.classList.remove('hidden');
  elements.result.querySelector('.result-text').textContent = text;
  elements.result.querySelector('.result-text').style.color = color;
  
  setTimeout(() => {
    elements.result.classList.add('hidden');
  }, 2000);
};

// Clean up audio resources when leaving page
window.addEventListener('beforeunload', () => {
  if (musicPlayer) {
    musicPlayer.pause();
    musicPlayer = null;
  }
});

// Initialize
loadSavedRiddleSets();
createSkyLanterns();