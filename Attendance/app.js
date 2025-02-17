class AbsenceTracker {
  constructor() {
    this.students = [];
    this.records = [];
    this.selectedStudents = new Set();
    
    this.initElements();
    this.loadData();
    this.bindEvents();
    this.setupSoundEffects();
    this.password = 'a7750861';
  }

  initElements() {
    // Buttons
    this.confirmBtn = document.getElementById('confirm');
    this.viewRecordsBtn = document.getElementById('viewRecords');
    this.downloadCSVBtn = document.getElementById('downloadCSV');
    this.customLeaveBtn = document.getElementById('customLeave');
    this.deleteButton = document.getElementById('deleteRecords');
    
    // Areas
    this.studentCards = document.getElementById('studentCards');
    this.recordsArea = document.getElementById('records');
    this.recordsList = document.getElementById('recordsList');

    // Sound
    this.clickSound = document.getElementById('clickSound');
  }

  setupSoundEffects() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.playClickSound();
      });
    });
  }

  playClickSound() {
    this.clickSound.currentTime = 0;
    this.clickSound.play().catch(e => console.log('Sound playback failed:', e));
  }

  bindEvents() {
    this.confirmBtn.addEventListener('click', () => {
      this.promptForLeaveType();
    });

    this.viewRecordsBtn.addEventListener('click', () => {
      this.toggleRecords();
    });

    this.downloadCSVBtn.addEventListener('click', () => {
      this.downloadCSV();
    });

    this.customLeaveBtn.addEventListener('click', () => {
      const customType = prompt('請輸入假別：');
      if (customType) {
        this.addRecord(customType);
      }
    });

    document.querySelectorAll('.leave-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.addRecord(e.target.dataset.type);
      });
    });

    this.deleteButton.addEventListener('click', () => {
      this.handleDeleteRecords();
    });
  }

  async loadData() {
    try {
      const response = await fetch('st.txt');
      if (response.ok) {
        const text = await response.text();
        this.students = text.split('\n').map(s => s.trim()).filter(s => s);
      } else {
        console.error('Failed to load st.txt');
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }

    const savedRecords = localStorage.getItem('records');
    if (savedRecords) {
      this.records = JSON.parse(savedRecords);
    }

    this.renderStudentCards();
  }

  renderStudentCards() {
    this.studentCards.innerHTML = '';
    
    this.students.forEach(student => {
      const card = document.createElement('div');
      card.className = 'student-card';
      card.textContent = student;
      
      if (this.selectedStudents.has(student)) {
        card.classList.add('selected');
      }
      
      card.addEventListener('click', () => {
        this.playClickSound();
        this.toggleStudent(student, card);
      });
      
      this.studentCards.appendChild(card);
    });
  }

  toggleStudent(student, card) {
    if (this.selectedStudents.has(student)) {
      this.selectedStudents.delete(student);
      card.classList.remove('selected');
    } else {
      this.selectedStudents.add(student);
      card.classList.add('selected');
    }
  }

  addRecord(leaveType) {
    if (this.selectedStudents.size === 0) {
      alert('請選擇學生');
      return;
    }

    const date = new Date().toLocaleDateString('zh-TW');
    const students = Array.from(this.selectedStudents);
    
    students.forEach(student => {
      this.records.push({
        date,
        student,
        type: leaveType
      });
    });

    localStorage.setItem('records', JSON.stringify(this.records));
    this.selectedStudents.clear();
    this.renderStudentCards();
    this.showRecords();
  }

  showRecords() {
    this.recordsList.innerHTML = '';
    this.recordsArea.classList.remove('hidden');
    
    if (this.records.length === 0) {
      const noRecords = document.createElement('div');
      noRecords.className = 'record-item';
      noRecords.textContent = '目前沒有紀錄';
      this.recordsList.appendChild(noRecords);
      return;
    }
    
    // Add select all checkbox
    const selectAllContainer = document.createElement('div');
    selectAllContainer.className = 'record-item select-all';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'selectAll';
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'selectAll';
    selectAllLabel.textContent = '全選';
    
    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    this.recordsList.appendChild(selectAllContainer);
    
    // Add records with checkboxes
    this.records.forEach((record, index) => {
      const item = document.createElement('div');
      item.className = 'record-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'record-checkbox';
      checkbox.dataset.index = index;
      
      const text = document.createElement('span');
      text.textContent = `${record.date} - ${record.student} - ${record.type}`;
      
      item.appendChild(checkbox);
      item.appendChild(text);
      this.recordsList.appendChild(item);
    });

    // Handle select all functionality
    selectAllCheckbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.record-checkbox');
      checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
      });
    });
  }

  toggleRecords() {
    this.recordsArea.classList.toggle('hidden');
    if (!this.recordsArea.classList.contains('hidden')) {
      this.showRecords();
    }
  }

  downloadCSV() {
    const headers = ['日期', '學生', '假別'];
    const rows = [headers];
    
    this.records.forEach(record => {
      rows.push([record.date, record.student, record.type]);
    });
    
    const csvContent = rows
      .map(row => row.join(','))
      .join('\n');
    
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dateStr}請假紀錄表.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  promptForLeaveType() {
    const leaveType = prompt('請輸入假別：');
    if (leaveType) {
      this.addRecord(leaveType);
    }
  }

  handleDeleteRecords() {
    const selectedRecords = document.querySelectorAll('.record-checkbox:checked');
    
    if (selectedRecords.length === 0) {
      alert('請選擇要刪除的紀錄');
      return;
    }

    const inputPassword = prompt('請輸入管理員密碼：');
    if (inputPassword === this.password) {
      if (confirm(`確定要刪除選取的 ${selectedRecords.length} 筆紀錄嗎？這個動作無法還原。`)) {
        const indicesToRemove = Array.from(selectedRecords)
          .map(checkbox => parseInt(checkbox.dataset.index))
          .sort((a, b) => b - a); // Sort in descending order to remove from end first
        
        indicesToRemove.forEach(index => {
          this.records.splice(index, 1);
        });
        
        localStorage.setItem('records', JSON.stringify(this.records));
        this.showRecords();
        alert('已刪除選取的紀錄');
      }
    } else {
      alert('密碼錯誤！');
    }
  }
}

// Initialize the app
new AbsenceTracker();