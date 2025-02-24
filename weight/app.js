class WeightTracker {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users')) || [
      { name: '使用者1', weights: [] },
      { name: '使用者2', weights: [] }
    ];
    
    this.currentTab = 0;
    this.allowDelete = false;
    this.chartPeriod = 14; // 預設顯示最近14天
    this.chartVisible = false;
    this.initializeElements();
    this.setupEventListeners();
    this.setupSoundEffects();
    this.renderTabs();
    this.renderContent();
  }

  initializeElements() {
    this.tabButtons = document.querySelector('.tab-buttons');
    this.mainContent = document.querySelector('.main-content');
    this.weightDialog = document.getElementById('weightDialog');
    this.userDialog = document.getElementById('userDialog');
    this.weightInput = document.getElementById('weightInput');
    this.weightSlider = document.getElementById('weightSlider');
    this.nameInput = document.getElementById('nameInput');
    this.fileInput = document.getElementById('fileInput');
  }

  setupEventListeners() {
    // 對話框相關事件
    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.weightDialog.close();
        this.userDialog.close();
      });
    });

    this.weightDialog.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addWeight();
    });

    this.userDialog.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.updateUserName();
    });

    // 體重滑動輸入相關事件
    this.weightSlider.addEventListener('input', () => {
      this.weightInput.value = this.weightSlider.value;
    });

    this.weightInput.addEventListener('input', () => {
      this.weightSlider.value = this.weightInput.value;
    });

    this.fileInput.addEventListener('change', (e) => {
      this.handleFileUpload(e);
    });

    // Fix the button click effect binding
    document.addEventListener('click', (event) => {
      if (event.target.matches('button')) {
        this.playButtonEffect();
      }
    });
  }

  setupSoundEffects() {
    // Create audio context for button feedback
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  playButtonEffect() {
    // Play sound effect
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 2000;
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.05);
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  renderTabs() {
    this.tabButtons.innerHTML = `
      ${this.users.map((user, index) => `
        <button class="tab-button ${this.currentTab === index ? 'active' : ''}"
                data-user="${index}"
                onclick="weightTracker.switchTab(${index})">
          ${user.name}
        </button>
      `).join('')}
      <button class="tab-button ${this.currentTab === this.users.length ? 'active' : ''}"
              onclick="weightTracker.switchTab(${this.users.length})">
        設定
      </button>
    `;
  }

  switchTab(index) {
    this.currentTab = index;
    this.renderTabs();
    this.renderContent();
  }

  renderContent() {
    if (this.currentTab === this.users.length) {
      this.renderSettings();
    } else {
      this.renderUserContent(this.currentTab);
    }
  }

  renderUserContent(userIndex) {
    const user = this.users[userIndex];
    const weights = user.weights;
    
    // Filter for last month's records
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentWeights = weights.filter(w => new Date(w.date) >= oneMonthAgo);
    const sortedWeights = [...recentWeights].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.mainContent.innerHTML = `
      <button class="action-btn" onclick="weightTracker.showWeightDialog(${userIndex})">
        記錄今日體重
      </button>
      <button class="toggle-chart-btn" onclick="weightTracker.toggleChart()">
        ${this.chartVisible ? '隱藏趨勢圖' : '顯示趨勢圖'}
      </button>
      <div class="chart-container ${this.chartVisible ? 'expanded' : ''}">
        <div class="chart-controls">
          <div class="chart-period">
            <button class="period-btn ${this.chartPeriod === 7 ? 'active' : ''}" 
                    onclick="weightTracker.setChartPeriod(7)">7天</button>
            <button class="period-btn ${this.chartPeriod === 14 ? 'active' : ''}" 
                    onclick="weightTracker.setChartPeriod(14)">14天</button>
            <button class="period-btn ${this.chartPeriod === 30 ? 'active' : ''}" 
                    onclick="weightTracker.setChartPeriod(30)">1個月</button>
            <button class="period-btn ${this.chartPeriod === 90 ? 'active' : ''}" 
                    onclick="weightTracker.setChartPeriod(90)">3個月</button>
          </div>
        </div>
        <canvas id="weightChart"></canvas>
      </div>
      <div class="weight-records">
        ${sortedWeights.map(weight => `
          <div class="weight-record ${this.allowDelete ? 'deletable' : ''}">
            <span>${new Date(weight.date).toLocaleDateString()}</span>
            <span>${weight.value} kg</span>
            ${this.allowDelete ? `
              <button class="delete-record" onclick="weightTracker.deleteWeight('${weight.date}', ${userIndex})">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;

    if (this.chartVisible) {
      this.renderChart(userIndex);
    }
  }

  toggleChart() {
    this.chartVisible = !this.chartVisible;
    this.renderContent();
  }

  renderChart(userIndex) {
    const user = this.users[userIndex];
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - this.chartPeriod);

    const recentWeights = user.weights
      .filter(w => new Date(w.date) >= periodStart)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const ctx = document.getElementById('weightChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: recentWeights.map(w => new Date(w.date).toLocaleDateString()),
        datasets: [{
          label: '體重趨勢',
          data: recentWeights.map(w => w.value),
          borderColor: this.getUserColor(userIndex),
          backgroundColor: this.getUserColor(userIndex, 0.1),
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }

  getUserColor(index, alpha = 1) {
    const colors = [
      'rgb(33, 150, 243)', // Light blue
      'rgb(255, 105, 180)', // Pink
      'rgb(156, 39, 176)',
      'rgb(255, 152, 0)'
    ];
    return alpha === 1 ? colors[index] : colors[index].replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }

  setChartPeriod(days) {
    this.chartPeriod = days;
    this.renderContent();
  }

  downloadAllRecords() {
    // Add BOM for UTF-8 encoding
    const BOM = '\uFEFF';
    let csv = BOM + '使用者,日期,體重(kg)\n';
    
    this.users.forEach(user => {
      const userRecords = user.weights.map(w => 
        `${user.name},${new Date(w.date).toLocaleDateString('zh-TW')},${w.value}`
      ).join('\n');
      csv += userRecords + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `體重記錄_${new Date().toLocaleDateString('zh-TW')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    const userIndex = parseInt(this.fileInput.dataset.userIndex);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').slice(1); // Skip header row
        
        lines.forEach(line => {
          const [name, date, value] = line.split(',');
          if (date && value) {
            // Find the user by name or use the current user
            const targetUser = this.users.find(u => u.name === name) || this.users[userIndex];
            targetUser.weights.push({
              date: new Date(date).toISOString(),
              value: parseFloat(value)
            });
          }
        });
        
        this.saveData();
        this.renderContent();
      };
      reader.readAsText(file);
    }
  }

  renderSettings() {
    this.mainContent.innerHTML = `
      <div class="settings-section">
        <h2 class="settings-title">使用者設定</h2>
        ${this.users.map((user, index) => `
          <div class="settings-item">
            <span>${user.name}</span>
            <button class="record-btn" onclick="weightTracker.showUserDialog(${index})">
              編輯名稱
            </button>
          </div>
        `).join('')}
      </div>
      <div class="settings-section">
        <h2 class="settings-title">記錄管理</h2>
        <div class="settings-item">
          <span>匯入/匯出記錄</span>
          <div class="data-controls">
            <button class="upload-btn" onclick="weightTracker.triggerFileUpload(${this.currentTab})">
              上傳紀錄
            </button>
            <button class="download-btn" onclick="weightTracker.downloadAllRecords()">
              下載紀錄
            </button>
          </div>
        </div>
        <div class="settings-item">
          <span>允許刪除記錄</span>
          <input type="checkbox" 
                 ${this.allowDelete ? 'checked' : ''} 
                 onchange="weightTracker.toggleDeleteMode(this.checked)">
        </div>
      </div>
    `;
  }

  showWeightDialog(userIndex) {
    const user = this.users[userIndex];
    const sortedWeights = [...user.weights].sort((a, b) => new Date(b.date) - new Date(a.date));
    const previousWeight = sortedWeights[0]?.value || 60;

    this.weightDialog.dataset.userIndex = userIndex;
    this.weightInput.value = previousWeight;
    this.weightSlider.value = previousWeight;
    this.weightSlider.min = previousWeight - 5;
    this.weightSlider.max = previousWeight + 5;
    
    this.weightDialog.querySelector('.previous-weight span').textContent = previousWeight;
    this.weightDialog.showModal();
  }

  showUserDialog(userIndex) {
    const user = this.users[userIndex];
    this.userDialog.dataset.userIndex = userIndex;
    this.nameInput.value = user.name;
    this.userDialog.showModal();
  }

  addWeight() {
    const weight = parseFloat(this.weightInput.value);
    const userIndex = parseInt(this.weightDialog.dataset.userIndex);
    
    if (!isNaN(weight) && weight > 0) {
      this.users[userIndex].weights.push({
        date: new Date().toISOString(),
        value: weight
      });
      this.saveData();
      this.renderContent();
      this.weightDialog.close();
    }
  }

  updateUserName() {
    const userIndex = parseInt(this.userDialog.dataset.userIndex);
    const newName = this.nameInput.value.trim();
    
    if (newName) {
      this.users[userIndex].name = newName;
      this.saveData();
      this.renderTabs();
      this.renderContent();
      this.userDialog.close();
    }
  }

  deleteWeight(date, userIndex) {
    if (confirm('確定要刪除此記錄嗎？')) {
      this.users[userIndex].weights = this.users[userIndex].weights
        .filter(w => w.date !== date);
      this.saveData();
      this.renderContent();
    }
  }

  toggleDeleteMode(enabled) {
    this.allowDelete = enabled;
    this.renderContent();
  }

  triggerFileUpload(userIndex) {
    this.fileInput.dataset.userIndex = userIndex;
    this.fileInput.click();
  }

  saveData() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }
}

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
  if (weightTracker.audioContext.state === 'suspended') {
    weightTracker.audioContext.resume();
  }
}, { once: true });

// Initialize the app
window.weightTracker = new WeightTracker();