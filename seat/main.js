import { translations } from './translations.js';

class SeatingChart {
  constructor() {
    this.students = [];
    this.seats = [];
    this.isMirrored = false;  
    this.initializeElements();
    this.addEventListeners();
    this.loadStudentInput();
    this.currentLang = 'zhTW';
    this.initializeLanguageSwitch();
    this.initializeTabs();
  }

  initializeElements() {
    this.elements = {
      toggleInput: document.getElementById('toggleInput'),
      inputArea: document.getElementById('inputArea'),
      studentInput: document.getElementById('studentInput'),
      processStudents: document.getElementById('processStudents'),
      rows: document.getElementById('rows'),
      cols: document.getElementById('cols'),
      generateSeats: document.getElementById('generateSeats'),
      randomAssign: document.getElementById('randomAssign'),
      studentPool: document.getElementById('studentPool'),
      seatingChart: document.getElementById('seatingChart'),
      exportTxt: document.getElementById('exportTxt'),
      exportCsv: document.getElementById('exportCsv'),
      clearSeats: document.getElementById('clearSeats'),
      mirrorText: document.getElementById('mirrorText'),
      screenshot: document.getElementById('screenshot'),
      seatingContainer: document.getElementById('seatingContainer'),
      blackboardArea: document.querySelector('.blackboard-area'),
      bulletinBoardArea: document.querySelector('.bulletin-board-area'),
    };
  }

  addEventListeners() {
    this.elements.toggleInput.addEventListener('click', () => {
      this.elements.inputArea.style.display = 
        this.elements.inputArea.style.display === 'none' ? 'block' : 'none';
    });

    this.elements.processStudents.addEventListener('click', () => this.processStudentInput());
    this.elements.generateSeats.addEventListener('click', () => this.generateSeatingChart());
    this.elements.randomAssign.addEventListener('click', () => this.randomAssign());
    this.elements.exportTxt.addEventListener('click', () => this.exportToTxt());
    this.elements.exportCsv.addEventListener('click', () => this.exportToCsv());
    this.elements.clearSeats.addEventListener('click', () => this.clearSeats());
    
    this.elements.studentInput.addEventListener('input', () => {
      localStorage.setItem('studentInput', this.elements.studentInput.value);
    });

    this.elements.mirrorText.addEventListener('click', () => this.mirrorText());
    this.elements.screenshot.addEventListener('click', () => this.takeScreenshot());
  }

  loadStudentInput() {
    const savedInput = localStorage.getItem('studentInput');
    if (savedInput) {
      this.elements.studentInput.value = savedInput;
      this.processStudentInput();
    }
  }

  processStudentInput() {
    const input = this.elements.studentInput.value.trim();
    this.students = input.split('\n').filter(name => name.trim());
    this.updateStudentPool();
  }

  updateStudentPool() {
    this.elements.studentPool.innerHTML = '';
    this.students.forEach(student => {
      const button = this.createStudentButton(student);
      this.elements.studentPool.appendChild(button);
    });
  }

  createStudentButton(student) {
    const button = document.createElement('button');
    button.className = 'student-button';
    button.textContent = student;
    button.draggable = true;
    
    button.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', student);
      button.classList.add('dragging');
    });
    
    button.addEventListener('dragend', () => {
      button.classList.remove('dragging');
    });
    
    return button;
  }

  setupSeatDragAndDrop(seat) {
    seat.draggable = true;
    
    seat.addEventListener('dragstart', (e) => {
      if (seat.hasAttribute('data-student')) {
        e.dataTransfer.setData('text/plain', seat.getAttribute('data-student'));
        e.dataTransfer.setData('source-seat', true);
        seat.classList.add('dragging');
      } else {
        e.preventDefault();
      }
    });

    seat.addEventListener('dragend', () => {
      seat.classList.remove('dragging');
    });

    seat.addEventListener('dragover', (e) => {
      e.preventDefault();
      seat.classList.add('drag-over');
    });

    seat.addEventListener('dragleave', () => {
      seat.classList.remove('drag-over');
    });

    seat.addEventListener('drop', (e) => {
      e.preventDefault();
      const student = e.dataTransfer.getData('text/plain');
      const isFromSeat = e.dataTransfer.getData('source-seat');
      
      if (seat.getAttribute('data-student') === student) {
        seat.classList.remove('drag-over');
        return;
      }

      const row = Math.floor(seat.dataset.index / parseInt(this.elements.cols.value)) + 1;
      const col = (seat.dataset.index % parseInt(this.elements.cols.value)) + 1;

      if (seat.hasAttribute('data-student')) {
        const currentStudent = seat.getAttribute('data-student');
        
        if (isFromSeat) {
          const sourceSeat = Array.from(this.seats).find(s => 
            s.getAttribute('data-student') === student);
          if (sourceSeat) {
            sourceSeat.textContent = '';
            sourceSeat.removeAttribute('data-student');
            sourceSeat.classList.remove('occupied');
          }
        } else {
          const studentButton = Array.from(this.elements.studentPool.children)
            .find(btn => btn.textContent === student);
          if (studentButton) {
            studentButton.remove();
          }
        }

        seat.textContent = '';
        seat.removeAttribute('data-student');
        seat.classList.remove('occupied');
        const coordinates = document.createElement('div');
        coordinates.className = 'seat-coordinates';
        coordinates.textContent = `(${col}列, ${row}排)`;
        seat.appendChild(coordinates);

        seat.textContent = student;
        seat.setAttribute('data-student', student);
        const coordinates2 = document.createElement('div');
        coordinates2.className = 'seat-coordinates';
        coordinates2.textContent = `(${col}列, ${row}排)`;
        seat.appendChild(coordinates2);
        
        if (isFromSeat) {
          const button = this.createStudentButton(currentStudent);
          this.elements.studentPool.appendChild(button);
        }
      } else {
        if (isFromSeat) {
          const sourceSeat = Array.from(this.seats).find(s => 
            s.getAttribute('data-student') === student);
          if (sourceSeat) {
            sourceSeat.textContent = '';
            sourceSeat.removeAttribute('data-student');
            sourceSeat.classList.remove('occupied');
          }
        } else {
          const studentButton = Array.from(this.elements.studentPool.children)
            .find(btn => btn.textContent === student);
          if (studentButton) {
            studentButton.remove();
          }
        }
        
        seat.textContent = '';
        seat.textContent = student;
        seat.setAttribute('data-student', student);
        seat.classList.add('occupied');
        const coordinates3 = document.createElement('div');
        coordinates3.className = 'seat-coordinates';
        coordinates3.textContent = `(${col}列, ${row}排)`;
        seat.appendChild(coordinates3);
      }
      
      seat.classList.remove('drag-over');
    });
    
    seat.addEventListener('click', () => {
      if (seat.hasAttribute('data-student')) {
        seat.classList.toggle('girl');
      }
    });
  }

  setupStudentPoolDragAndDrop() {
    this.elements.studentPool.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.studentPool.classList.add('drag-over');
    });

    this.elements.studentPool.addEventListener('dragleave', () => {
      this.elements.studentPool.classList.remove('drag-over');
    });

    this.elements.studentPool.addEventListener('drop', (e) => {
      e.preventDefault();
      const student = e.dataTransfer.getData('text/plain');
      const isFromSeat = e.dataTransfer.getData('source-seat');
      
      if (isFromSeat) {
        const sourceSeat = Array.from(this.seats).find(s => 
          s.getAttribute('data-student') === student);
        if (sourceSeat) {
          sourceSeat.textContent = '';
          sourceSeat.removeAttribute('data-student');
          sourceSeat.classList.remove('occupied');
          const row = Math.floor(sourceSeat.dataset.index / parseInt(this.elements.cols.value)) + 1;
          const col = (sourceSeat.dataset.index % parseInt(this.elements.cols.value)) + 1;
          const coordinates = document.createElement('div');
          coordinates.className = 'seat-coordinates';
          coordinates.textContent = `(${col}列, ${row}排)`;
          sourceSeat.appendChild(coordinates);
          
          const button = this.createStudentButton(student);
          this.elements.studentPool.appendChild(button);
        }
      }
      
      this.elements.studentPool.classList.remove('drag-over');
    });
  }

  generateSeatingChart() {
    this.elements.seatingChart.innerHTML = '';
    
    const rows = parseInt(this.elements.rows.value);
    const cols = parseInt(this.elements.cols.value);
    
    this.elements.seatingChart.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.seats = [];

    this.returnAllStudentsToPool();
    this.setupStudentPoolDragAndDrop();

    for (let i = 0; i < rows * cols; i++) {
      const row = Math.floor(i / cols) + 1;
      const col = (i % cols) + 1;
      
      const seat = document.createElement('div');
      seat.className = 'seat';
      seat.dataset.index = i;
      
      const coordinates = document.createElement('div');
      coordinates.className = 'seat-coordinates';
      coordinates.textContent = `(${col}列, ${row}排)`;
      seat.appendChild(coordinates);
      
      this.setupSeatDragAndDrop(seat);
      this.elements.seatingChart.appendChild(seat);
      this.seats.push(seat);
    }
  }

  assignStudentToSeat(student, seat) {
    if (!seat.hasAttribute('data-student')) {
      seat.textContent = student;  
      seat.setAttribute('data-student', student);
      seat.classList.add('occupied');
      if (this.isMirrored) {
        seat.classList.add('mirrored');
      }
      
      const row = Math.floor(seat.dataset.index / parseInt(this.elements.cols.value)) + 1;
      const col = (seat.dataset.index % parseInt(this.elements.cols.value)) + 1;
      const coordinates = document.createElement('div');
      coordinates.className = 'seat-coordinates';
      coordinates.textContent = `(${col}列, ${row}排)`;
      seat.appendChild(coordinates);
      
      const studentButton = Array.from(this.elements.studentPool.children)
        .find(btn => btn.textContent === student);
      if (studentButton) {
        studentButton.remove();
      }
    }
    seat.classList.remove('girl');
  }

  returnAllStudentsToPool() {
    const assignedStudents = Array.from(this.seats || [])
      .filter(seat => seat.hasAttribute('data-student'))
      .map(seat => seat.getAttribute('data-student'));

    assignedStudents.forEach(student => {
      if (!Array.from(this.elements.studentPool.children)
          .some(btn => btn.textContent === student)) {
        const button = this.createStudentButton(student);
        this.elements.studentPool.appendChild(button);
      }
    });
  }

  clearSeats() {
    if (this.seats.length === 0) return;
    
    this.returnAllStudentsToPool();

    this.seats.forEach((seat, index) => {
      const row = Math.floor(index / parseInt(this.elements.cols.value)) + 1;
      const col = (index % parseInt(this.elements.cols.value)) + 1;
      
      seat.textContent = '';
      seat.removeAttribute('data-student');
      seat.classList.remove('occupied');
      
      const coordinates = document.createElement('div');
      coordinates.className = 'seat-coordinates';
      coordinates.textContent = `(${col}列, ${row}排)`;
      seat.appendChild(coordinates);
    });
  }

  randomAssign() {
    this.clearSeats();
    
    const emptySeats = this.seats.filter(seat => !seat.hasAttribute('data-student'));
    const unassignedStudents = Array.from(this.elements.studentPool.children)
      .map(btn => btn.textContent);
    
    const shuffledStudents = this.shuffleArray([...unassignedStudents]);
    const maxAssignments = Math.min(emptySeats.length, shuffledStudents.length);

    for (let i = 0; i < maxAssignments; i++) {
      this.assignStudentToSeat(shuffledStudents[i], emptySeats[i]);
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getSeatingData() {
    const rows = parseInt(this.elements.rows.value);
    const cols = parseInt(this.elements.cols.value);
    const data = [];
    
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j < cols; j++) {
        const seat = this.seats[i * cols + j];
        row.push(seat.getAttribute('data-student') || '');
      }
      data.push(row);
    }
    
    return data;
  }

  exportToTxt() {
    const data = this.getSeatingData();
    let content = '班級座位表\n\n';
    data.forEach(row => {
      content += row.map(cell => cell.padEnd(10, ' ')).join(' ') + '\n';
    });
    
    this.downloadFile(content, 'seating-chart.txt', 'text/plain');
  }

  exportToCsv() {
    const data = this.getSeatingData();
    const content = data.map(row => row.join(',')).join('\n');
    
    this.downloadFile(content, 'seating-chart.csv', 'text/csv');
  }

  downloadFile(content, filename, type) {
    const blob = new Blob(['\ufeff' + content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async takeScreenshot() {
    try {
      const container = this.elements.seatingContainer;
      const canvas = await html2canvas(container, {
        backgroundColor: '#fff',
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = 'seating-chart-screenshot.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }

  mirrorText() {
    this.isMirrored = !this.isMirrored;
    
    // Mirror seats with students
    this.seats.forEach(seat => {
      if (seat.hasAttribute('data-student')) {
        seat.classList.toggle('mirrored', this.isMirrored);
      }
    });

    // Mirror blackboard and bulletin board
    this.elements.blackboardArea.classList.toggle('mirrored', this.isMirrored);
    this.elements.bulletinBoardArea.classList.toggle('mirrored', this.isMirrored);
  }

  initializeLanguageSwitch() {
    document.getElementById('zhTW').addEventListener('click', () => this.switchLanguage('zhTW'));
    document.getElementById('en').addEventListener('click', () => this.switchLanguage('en'));
  }

  switchLanguage(lang) {
    this.currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(element => {
      const key = element.getAttribute('data-translate');
      element.textContent = translations[lang][key];
    });
    
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
      const key = element.getAttribute('data-translate-placeholder');
      element.placeholder = translations[lang][key];
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === lang);
    });
  }

  initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn === button);
        });
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.toggle('active', content.id === tabId);
        });
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SeatingChart();
});