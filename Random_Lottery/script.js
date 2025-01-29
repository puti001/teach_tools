document.addEventListener('DOMContentLoaded', () => {
  const ballCount = document.getElementById('ballCount');
  const drawCount = document.getElementById('drawCount');
  const drawAllAtOnce = document.getElementById('drawAllAtOnce');
  const generateBtn = document.getElementById('generateBtn');
  const drawBtn = document.getElementById('drawBtn');
  const circularContainer = document.getElementById('circularContainer');
  const drawnNumbers = document.getElementById('drawnNumbers');
  const remainingNumbers = document.getElementById('remainingNumbers');

  // Audio Context setup
  let audioContext;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API is not supported in this browser');
  }

  function playBounceSound(velocity = 1) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400 + Math.random() * 200, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1 * velocity, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  function playFallSound() {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  let balls = [];
  let isDrawing = false;
  let animationFrameId;
  let animationStartTime = 0;
  let lastTimestamp = 0;
  let currentDrawCount = 0;
  let targetDrawCount = 1;
  let drawingInProgress = false;
  let autoDrawInterval = null;
  let lastBounceSoundTime = 0;

  function moveBalls(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    if (!animationStartTime) animationStartTime = timestamp;
    
    const elapsedTime = timestamp - animationStartTime;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const containerRect = circularContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const radius = (containerRect.width / 2) - 25;

    const intensityMultiplier = isDrawing ? 2.5 : 1;

    balls.forEach(ball => {
      if (!ball.selected) {
        if (isDrawing || Math.random() < 0.1) {
          ball.vx += (Math.random() - 0.5) * 1.2 * intensityMultiplier;
          ball.vy += (Math.random() - 0.5) * 1.2 * intensityMultiplier;
        }

        ball.vx *= isDrawing ? 0.995 : 0.99;
        ball.vy *= isDrawing ? 0.995 : 0.99;

        const maxSpeed = isDrawing ? 12 : 8;
        const minSpeed = isDrawing ? 4 : 2;
        
        const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (currentSpeed > maxSpeed) {
          ball.vx = (ball.vx / currentSpeed) * maxSpeed;
          ball.vy = (ball.vy / currentSpeed) * maxSpeed;
        }
        if (currentSpeed < minSpeed) {
          ball.vx *= minSpeed / currentSpeed;
          ball.vy *= minSpeed / currentSpeed;
        }

        ball.x += ball.vx * (deltaTime / 16);
        ball.y += ball.vy * (deltaTime / 16);

        const dx = ball.x - centerX;
        const dy = ball.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {
          const angle = Math.atan2(dy, dx);
          ball.x = centerX + Math.cos(angle) * radius;
          ball.y = centerY + Math.sin(angle) * radius;
          
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const dot = ball.vx * normalX + ball.vy * normalY;
          ball.vx = ball.vx - 2 * dot * normalX;
          ball.vy = ball.vy - 2 * dot * normalY;
          
          const bounceRandom = isDrawing ? 3 : 2;
          ball.vx += (Math.random() - 0.5) * bounceRandom;
          ball.vy += (Math.random() - 0.5) * bounceRandom;

          // Play bounce sound with velocity-based volume
          if (timestamp - lastBounceSoundTime > 50) { // Limit sound frequency
            const bounceVelocity = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) / maxSpeed;
            playBounceSound(bounceVelocity);
            lastBounceSoundTime = timestamp;
          }
        }

        ball.element.style.transform = `translate(${ball.x}px, ${ball.y}px)`;
      }
    });

    if (isDrawing && elapsedTime >= 3000) {
      selectBall();
    } else {
      animationFrameId = requestAnimationFrame(moveBalls);
    }
  }

  function selectBall() {
    const unselectedBalls = balls.filter(ball => !ball.selected);
    if (unselectedBalls.length > 0) { 
      const selectedBalls = [];
      const remainingDraws = Math.min(targetDrawCount, unselectedBalls.length);

      for (let i = 0; i < remainingDraws; i++) {
        const availableBalls = unselectedBalls.filter(
          ball => !selectedBalls.includes(ball)
        );
        const selectedBall = availableBalls[Math.floor(Math.random() * availableBalls.length)];
        selectedBalls.push(selectedBall);
      }

      selectedBalls.forEach((selectedBall, index) => {
        selectedBall.selected = true;
        selectedBall.element.classList.add('selected');
        selectedBall.element.style.setProperty('--x', `${selectedBall.x}px`);
        selectedBall.element.style.setProperty('--y', `${selectedBall.y}px`);
        selectedBall.element.style.setProperty('--container-height', `${circularContainer.offsetHeight}px`);
        
        // Delay fall sound for each ball
        setTimeout(() => {
          playFallSound();
        }, index * 200);
      });
      
      updateResults(selectedBalls.map(ball => ball.number));

      isDrawing = false;
      drawingInProgress = false;
      animationStartTime = 0;
      lastTimestamp = 0;
      animationFrameId = requestAnimationFrame(moveBalls);

      const remainingAfterDraw = balls.filter(ball => !ball.selected).length;
      
      if (drawAllAtOnce.checked && remainingAfterDraw > 0) {
        setTimeout(() => {
          drawNumber();
        }, 3000);
      } else {
        drawBtn.disabled = false;
        if (autoDrawInterval) {
          clearInterval(autoDrawInterval);
          autoDrawInterval = null;
        }
      }
    } else {
      isDrawing = false;
      drawingInProgress = false;
      drawBtn.disabled = false;
      animationStartTime = 0;
      lastTimestamp = 0;
      animationFrameId = requestAnimationFrame(moveBalls);
      if (autoDrawInterval) {
        clearInterval(autoDrawInterval);
        autoDrawInterval = null;
      }
    }
  }

  function generateBalls(count) {
    circularContainer.innerHTML = '<div class="exit-gate"></div>';
    balls = [];
    
    const containerRect = circularContainer.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    for (let i = 1; i <= count; i++) {
      const ball = document.createElement('div');
      ball.className = 'ball';
      ball.textContent = i;
      
      const angle = (Math.PI * 2 * i) / count;
      const radius = (containerRect.width / 2) - 25;
      const x = centerX + Math.cos(angle) * (radius * 0.8);
      const y = centerY + Math.sin(angle) * (radius * 0.8);

      balls.push({
        element: ball,
        number: i,
        selected: false,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4
      });
      
      circularContainer.appendChild(ball);
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animationStartTime = 0;
    lastTimestamp = 0;
    moveBalls(performance.now());
  }

  function drawNumber() {
    if (drawingInProgress) return;
    
    const drawCountValue = parseInt(drawCount.value);
    const remainingCount = balls.filter(ball => !ball.selected).length;
    
    if (isNaN(drawCountValue) || drawCountValue < 1) {
      alert('請輸入要抽取的號碼數量！');
      return;
    }
    
    if (drawCountValue > remainingCount) {
      alert(`只剩下 ${remainingCount} 個號碼可以抽取！`);
      return;
    }

    targetDrawCount = drawCountValue;
    isDrawing = true;
    drawingInProgress = true;
    drawBtn.disabled = true;
    animationStartTime = 0;
    lastTimestamp = 0;
    
    balls.forEach(ball => {
      if (!ball.selected) {
        ball.vx = (Math.random() - 0.5) * 10;
        ball.vy = (Math.random() - 0.5) * 10;
      }
    });
    moveBalls(performance.now());
  }

  function updateResults(latestNumbers = null) {
    const drawn = balls.filter(ball => ball.selected);
    const remaining = balls.filter(ball => !ball.selected);

    drawnNumbers.innerHTML = drawn
      .map(ball => {
        const isLatest = latestNumbers ? latestNumbers.includes(ball.number) : false;
        return `<span class="number-item${isLatest ? ' latest' : ''}">${ball.number}</span>`;
      })
      .join('');

    if (latestNumbers !== null) {
      const latestElements = drawnNumbers.querySelectorAll('.latest');
      latestElements.forEach(element => {
        setTimeout(() => {
          element.classList.remove('latest');
        }, 3000);
      });
    }

    remainingNumbers.innerHTML = remaining
      .map(ball => `<span class="number-item">${ball.number}</span>`)
      .join('');
  }

  // Language switching functionality
  const translations = {
    en: {
      title: 'Puti-AI Random Lottery',
      ballCountPlaceholder: 'Enter number of balls (1-100)',
      drawCountPlaceholder: 'How many numbers to draw',
      drawAllAtOnceLabel: 'Draw all at once',
      generateBtn: 'Generate Balls',
      drawBtn: 'Start Drawing',
      drawnNumbers: 'Drawn Numbers',
      remainingNumbers: 'Remaining Numbers',
      instructions: 'Instructions',
      instructionsList: [
        'Enter the total number of balls (1-100)',
        'Enter how many numbers to draw each time',
        'Optional: Check "Draw all at once" to automatically draw all numbers',
        'Click "Generate Balls" to create the number balls',
        'Click "Start Drawing" to begin the lottery',
        'Latest drawn numbers will be highlighted in yellow for 3 seconds'
      ],
      copyright: 'Created by Teacher Huang Chao-Jung from Houchuang Elementary School, Pingtung County, Taiwan. Free to share and promote. Commercial use and any copyright infringement are strictly prohibited.',
      switchLang: '中文'
    },
    zh: {
      title: 'Puti-AI 隨機抽籤器',
      ballCountPlaceholder: '請輸入號碼球數量(1-100)',
      drawCountPlaceholder: '一次抽幾個號碼',
      drawAllAtOnceLabel: '一次抽完',
      generateBtn: '產生號碼球',
      drawBtn: '開始抽籤',
      drawnNumbers: '已抽中的號碼',
      remainingNumbers: '未抽中的號碼',
      instructions: '使用說明',
      instructionsList: [
        '輸入要產生的號碼球總數（1-100）',
        '輸入每次要抽取的號碼數量',
        '可選擇勾選「一次抽完」自動連續抽取所有號碼',
        '點擊「產生號碼球」產生號碼',
        '點擊「開始抽籤」開始抽取號碼',
        '最新抽中的號碼會以黃色底色突顯3秒鐘'
      ],
      copyright: '屏東縣後庄國小黃朝榮老師作品，免費分享，歡迎推廣。嚴禁商用與任何侵權、不尊重著作權的行為。',
      switchLang: 'English'
    }
  };

  let currentLang = 'zh';

  function updateLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    document.title = t.title;
    document.querySelector('h1').textContent = t.title;
    document.getElementById('ballCount').placeholder = t.ballCountPlaceholder;
    document.getElementById('drawCount').placeholder = t.drawCountPlaceholder;
    document.querySelector('.checkbox-text').textContent = t.drawAllAtOnceLabel;
    document.getElementById('generateBtn').textContent = t.generateBtn;
    document.getElementById('drawBtn').textContent = t.drawBtn;
    document.querySelectorAll('.result-section h2')[0].textContent = t.drawnNumbers;
    document.querySelectorAll('.result-section h2')[1].textContent = t.remainingNumbers;
    document.querySelector('.language-btn').textContent = t.switchLang;
    
    // Update instructions
    document.querySelector('.instructions h2').textContent = t.instructions;
    const instructionsList = document.querySelector('.instructions ul');
    instructionsList.innerHTML = t.instructionsList
      .map(instruction => `<li>${instruction}</li>`)
      .join('');
    
    // Update copyright
    document.querySelector('.copyright').textContent = t.copyright;
  }

  document.querySelector('.language-btn').addEventListener('click', () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage(newLang);
  });

  // Initialize with Chinese language
  updateLanguage('zh');

  generateBtn.addEventListener('click', () => {
    // Initialize audio context on first user interaction
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API is not supported in this browser');
      }
    }
    
    const count = parseInt(ballCount.value);
    if (count >= 1 && count <= 100) {
      generateBalls(count);
      drawBtn.disabled = false;
      updateResults();
      currentDrawCount = 0;
    } else {
      alert('請輸入1到100之間的數字！');
    }
  });

  drawBtn.addEventListener('click', () => {
    // Resume audio context on user interaction
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    drawNumber();
  });

  drawAllAtOnce.addEventListener('change', (e) => {
    if (!e.target.checked && autoDrawInterval) {
      clearInterval(autoDrawInterval);
      autoDrawInterval = null;
    }
  });
});