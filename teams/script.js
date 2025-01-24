class StudentGrouper {
  constructor() {
    this.studentsContainer = document.getElementById('studentsContainer');
    this.groupsContainer = document.getElementById('groupsContainer');
    this.studentListInput = document.getElementById('studentList');
    this.rememberListCheckbox = document.getElementById('rememberList');
    this.saveNameInput = document.getElementById('saveName');
    this.saveBtn = document.getElementById('saveBtn');
    this.loadSelect = document.getElementById('loadSelect');
    this.loadBtn = document.getElementById('loadBtn');
    this.clearSavesBtn = document.getElementById('clearSavesBtn');

    this.targetScore = 10;
    this.setupAudio();
    this.setupTargetScore();

    this.loadStudentList();
    this.loadSavedGroups();
    this.initEventListeners();
    this.updateRaceTrack();

    // Add language change listener
    window.addEventListener('languageChanged', () => {
      this.updateLanguageSpecificContent();
    });

    this.personalScores = JSON.parse(localStorage.getItem('personalScores')) || {};
    this.isPersonalScoreVisible = false;

    this.setupPersonalScoring();
    this.setupThemeSwitcher();
  }

  initEventListeners() {
    document.getElementById('randomMode').addEventListener('click', () => this.setupRandomMode());
    document.querySelectorAll('.group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.createGroups(parseInt(e.target.dataset.groups)));
    });
    document.getElementById('customGroupBtn').addEventListener('click', () => this.handleCustomGroups());
    document.getElementById('resetBtn').addEventListener('click', () => this.reset());

    this.saveBtn.addEventListener('click', () => this.saveGroups());
    this.loadBtn.addEventListener('click', () => this.loadGroups());
    this.clearSavesBtn.addEventListener('click', () => this.clearSavedGroups());

    window.addEventListener('beforeunload', () => this.saveStudentList());

    document.getElementById('togglePersonalScores').addEventListener('click', () => {
      this.togglePersonalScoresVisibility();
    });
  }

  saveStudentList() {
    if (this.rememberListCheckbox.checked) {
      localStorage.setItem('studentList', this.studentListInput.value);
    } else {
      localStorage.removeItem('studentList');
    }
  }

  loadStudentList() {
    const savedList = localStorage.getItem('studentList');
    if (savedList) {
      this.studentListInput.value = savedList;
      this.rememberListCheckbox.checked = true;
    }
  }

  parseStudentList() {
    const students = this.studentListInput.value.split('\n')
      .filter(name => name.trim() !== '')
      .map(name => name.trim());
    return students;
  }

  createStudentButtons(students) {
    this.studentsContainer.innerHTML = '';
    students.forEach(student => {
      const btn = document.createElement('button');
      btn.textContent = student;
      btn.classList.add('student-btn');
      btn.draggable = true;
      this.studentsContainer.appendChild(btn);
    });
  }

  createGroups(groupCount) {
    this.groupsContainer.innerHTML = '';
    const students = this.parseStudentList();

    for (let i = 1; i <= groupCount; i++) {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('group');
      groupDiv.dataset.groupIndex = i - 1;

      const groupTitle = document.createElement('div');
      groupTitle.textContent = window.i18n.translate('group', [i]);
      groupTitle.classList.add('group-title');

      const scoreContainer = document.createElement('div');
      scoreContainer.classList.add('score-container');

      const subtractButton = document.createElement('button');
      subtractButton.textContent = '-1';
      subtractButton.classList.add('score-button', 'subtract-score');
      subtractButton.addEventListener('click', () => this.updateScore(groupDiv, -1));

      const scoreDisplay = document.createElement('div');
      scoreDisplay.classList.add('score-display');
      scoreDisplay.textContent = window.i18n.translate('score', [0]);
      groupDiv.dataset.score = 0;

      const addButton = document.createElement('button');
      addButton.textContent = '+1';
      addButton.classList.add('score-button', 'add-score');
      addButton.addEventListener('click', () => this.updateScore(groupDiv, 1));

      scoreContainer.appendChild(subtractButton);
      scoreContainer.appendChild(scoreDisplay);
      scoreContainer.appendChild(addButton);

      groupDiv.appendChild(groupTitle);
      groupDiv.appendChild(scoreContainer);

      this.groupsContainer.appendChild(groupDiv);
    }

    this.createStudentButtons(students);
    this.setupDragAndDrop();
  }

  updateScore(groupDiv, scoreChange) {
    let currentScore = parseInt(groupDiv.dataset.score) || 0;
    let newScore = currentScore + scoreChange;
    groupDiv.dataset.score = newScore;
    groupDiv.querySelector('.score-display').textContent = window.i18n.translate('score', [newScore]);
    
    // Play sound effect
    if (scoreChange > 0) {
      this.addScoreSound.currentTime = 0;
      this.addScoreSound.play();
    } else {
      this.subtractScoreSound.currentTime = 0;
      this.subtractScoreSound.play();
    }
    
    // Add animation class
    const scoreDisplay = groupDiv.querySelector('.score-display');
    scoreDisplay.classList.add('score-change');
    setTimeout(() => scoreDisplay.classList.remove('score-change'), 300);
    
    // Check for victory
    if (newScore >= this.targetScore) {
      const groupTitle = groupDiv.querySelector('.group-title').textContent;
      this.createVictoryModal(groupTitle);
    }
    
    this.updateRaceTrack();

    // Update personal scores
    const students = Array.from(groupDiv.querySelectorAll('.student-btn')).map(btn => btn.textContent);
    students.forEach(student => {
      if (!this.personalScores[student]) {
        this.personalScores[student] = 0;
      }
      this.personalScores[student] += scoreChange;
    });

    localStorage.setItem('personalScores', JSON.stringify(this.personalScores));
    if (this.isPersonalScoreVisible) {
      this.updatePersonalScoresList();
    }
  }

  setupDragAndDrop() {
    const students = document.querySelectorAll('.student-btn');
    const groups = document.querySelectorAll('.group');

    students.forEach(student => {
      student.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.textContent);
      });
    });

    groups.forEach(group => {
      group.addEventListener('dragover', (e) => {
        e.preventDefault();
      });

      group.addEventListener('drop', (e) => {
        e.preventDefault();
        const studentName = e.dataTransfer.getData('text/plain');
        const studentBtn = Array.from(students).find(s => s.textContent === studentName);

        if (studentBtn && !group.contains(studentBtn)) {
          group.appendChild(studentBtn);
        }
      });
    });
  }

  setupRandomMode() {
    const students = Array.from(this.studentsContainer.querySelectorAll('.student-btn')).map(btn => btn.textContent);
    const groups = document.querySelectorAll('.group');

    const shuffledStudents = students.sort(() => Math.random() - 0.5);

    groups.forEach((group, index) => {
      const groupStudents = shuffledStudents.filter((_, i) =>
        i >= index * Math.ceil(students.length / groups.length) &&
        i < (index + 1) * Math.ceil(students.length / groups.length)
      );

      groupStudents.forEach(studentName => {
        const studentBtn = document.createElement('button');
        studentBtn.textContent = studentName;
        studentBtn.classList.add('student-btn');
        group.appendChild(studentBtn);
      });
    });
    this.studentsContainer.innerHTML = '';
  }

  handleCustomGroups() {
    const customCount = prompt(window.i18n.translate('enterCustomGroups'));
    const count = parseInt(customCount);

    if (count && count > 1) {
      this.createGroups(count);
    } else {
      alert(window.i18n.translate('invalidGroupNumber'));
    }
  }

  reset() {
    if (Object.keys(this.personalScores).length > 0) {
      if (confirm(window.i18n.translate('confirmReset'))) {
        this.exportScoresToCSV();
        this.personalScores = {};
        localStorage.removeItem('personalScores');
      }
    }
    this.studentsContainer.innerHTML = '';
    this.groupsContainer.innerHTML = '';
    if (!this.rememberListCheckbox.checked) {
      this.studentListInput.value = '';
      localStorage.removeItem('studentList');
    }
    this.updatePersonalScoresList();
  }

  saveGroups() {
    const saveName = this.saveNameInput.value.trim();
    if (!saveName) {
      alert(window.i18n.translate('enterSaveName'));
      return;
    }

    const groupsData = [];
    document.querySelectorAll('.group').forEach(group => {
      const studentNames = Array.from(group.querySelectorAll('.student-btn'))
        .map(btn => btn.textContent);
      groupsData.push({
        students: studentNames,
        score: parseInt(group.dataset.score) || 0
      });
    });

    localStorage.setItem(`groups-${saveName}`, JSON.stringify(groupsData));
    this.loadSavedGroups();
    alert(window.i18n.translate('groupsSaved'));
  }

  loadGroups() {
    const selectedSave = this.loadSelect.value;
    if (!selectedSave) {
      alert(window.i18n.translate('selectSave'));
      return;
    }

    const savedGroups = localStorage.getItem(`groups-${selectedSave}`);
    if (!savedGroups) {
      alert(window.i18n.translate('saveNotFound'));
      return;
    }

    const groupsData = JSON.parse(savedGroups);
    this.createGroups(groupsData.length);

    const groups = document.querySelectorAll('.group');
    groups.forEach((group, index) => {
      group.innerHTML = ''; 

      const groupTitle = document.createElement('div');
      groupTitle.textContent = window.i18n.translate('group', [index + 1]);
      groupTitle.classList.add('group-title');
      group.appendChild(groupTitle);

      const scoreContainer = document.createElement('div');
      scoreContainer.classList.add('score-container');

      const subtractButton = document.createElement('button');
      subtractButton.textContent = '-1';
      subtractButton.classList.add('score-button', 'subtract-score');
      subtractButton.addEventListener('click', () => this.updateScore(group, -1));

      const scoreDisplay = document.createElement('div');
      scoreDisplay.classList.add('score-display');
      let score = groupsData[index].score || 0;
      scoreDisplay.textContent = window.i18n.translate('score', [score]);
      group.dataset.score = score;

      const addButton = document.createElement('button');
      addButton.textContent = '+1';
      addButton.classList.add('score-button', 'add-score');
      addButton.addEventListener('click', () => this.updateScore(group, 1));

      scoreContainer.appendChild(subtractButton);
      scoreContainer.appendChild(scoreDisplay);
      scoreContainer.appendChild(addButton);

      group.appendChild(scoreContainer);

      if (groupsData[index].students) {
        groupsData[index].students.forEach(studentName => {
          const studentBtn = document.createElement('button');
          studentBtn.textContent = studentName;
          studentBtn.classList.add('student-btn');
          group.appendChild(studentBtn);
        });
      }
    });
    this.studentsContainer.innerHTML = '';
    this.setupDragAndDrop(); 
    this.updateRaceTrack();
  }

  loadSavedGroups() {
    this.loadSelect.innerHTML = '<option value="">'+ window.i18n.translate('selectSave') +'</option>';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('groups-')) {
        const saveName = key.substring(7);
        const option = document.createElement('option');
        option.value = saveName;
        option.textContent = saveName;
        this.loadSelect.appendChild(option);
      }
    }
  }

  clearSavedGroups() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('groups-')) {
        localStorage.removeItem(key);
        i--; 
      }
    }
    this.loadSavedGroups(); 
    alert(window.i18n.translate('savesCleared'));
  }

  setupAudio() {
    this.addScoreSound = new Audio('https://puti001.github.io/teach_tools/teams/correct.wav');
    this.subtractScoreSound = new Audio('https://puti001.github.io/teach_tools/teams/error.wav');
    this.victorySound = new Audio('https://puti001.github.io/teach_tools/teams/Clap.wav');
    
    // Add hover sound effect
    this.hoverSound = new Audio('data:audio/wav;base64,UklGRlYAAABXQVZFZm10IBAAAAABAAEARK4AABCxAgACABAAZGF0YTIAAABgAIwArADEANQA5ADwAPwABAEIAQwBEAEMAQgBBAH8APgA8ADsAOgA4wDeANkA1ADQAM0A');
    
    // Preload all sounds
    [this.addScoreSound, this.subtractScoreSound, this.victorySound, this.hoverSound].forEach(sound => {
      sound.load();
      sound.volume = 0.5;
    });
  }

  setupTargetScore() {
    const container = document.createElement('div');
    container.className = 'target-score-container';
    
    const label = document.createElement('label');
    label.className = 'target-score-label';
    label.textContent = window.i18n.translate('targetScore') + ':';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'target-score-input';
    input.value = this.targetScore;
    input.min = 1;
    input.addEventListener('change', (e) => {
      this.targetScore = parseInt(e.target.value) || 10;
    });
    
    container.appendChild(label);
    container.appendChild(input);
    
    const raceTrackContainer = document.querySelector('.race-track-container');
    raceTrackContainer.insertBefore(container, raceTrackContainer.firstChild);
  }

  createVictoryModal(winningGroup) {
    const modal = document.createElement('div');
    modal.className = 'victory-modal';
    modal.style.display = 'flex';
    
    const content = document.createElement('div');
    content.className = 'victory-content';
    content.innerHTML = `
      <h2>${window.i18n.translate('congratulations', [winningGroup])}</h2>
      <p>${window.i18n.translate('reachedTarget', [this.targetScore])}</p>
      <button onclick="this.closest('.victory-modal').remove()">
        ${window.i18n.translate('close')}
      </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Create confetti effect
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      modal.appendChild(confetti);
    }

    this.victorySound.play();
  }

  updateRaceTrack() {
    const raceTrack = document.getElementById('raceTrack');
    raceTrack.innerHTML = '';
    
    const groups = Array.from(document.querySelectorAll('.group'));
    const scores = groups.map((group, index) => ({
      group: `第 ${index + 1} 組`,
      score: parseInt(group.dataset.score) || 0,
      index: index
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    scores.forEach(({group, score}, index) => {
      const racer = document.createElement('div');
      racer.className = 'racer';
      
      const label = document.createElement('div');
      label.className = 'racer-label';
      label.textContent = window.i18n.translate('group', [index + 1]);
      
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      
      const maxScore = Math.max(...scores.map(s => s.score));
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${percentage}%`;
      
      const scoreDisplay = document.createElement('div');
      scoreDisplay.className = 'racer-score';
      scoreDisplay.textContent = window.i18n.translate('score', [score]);
      
      progressBar.appendChild(progressFill);
      racer.appendChild(label);
      racer.appendChild(progressBar);
      racer.appendChild(scoreDisplay);
      raceTrack.appendChild(racer);
    });
    
    // Update podium positions
    const podiumPositions = ['first', 'second', 'third'];
    podiumPositions.forEach((position, index) => {
      const element = document.getElementById(position);
      if (scores[index]) {
        element.style.opacity = '1';
        element.textContent = window.i18n.translate('group', [scores[index].index + 1]);
      } else {
        element.style.opacity = '0.3';
      }
    });
  }

  updateLanguageSpecificContent() {
    // Update dynamic content when language changes
    this.loadSavedGroups();
    this.updateRaceTrack();
    
    // Update group titles
    document.querySelectorAll('.group-title').forEach((title, index) => {
      title.textContent = window.i18n.translate('group', [index + 1]);
    });

    // Update score displays
    document.querySelectorAll('.score-display').forEach(display => {
      const score = display.closest('.group').dataset.score || 0;
      display.textContent = window.i18n.translate('score', [score]);
    });
  }

  setupPersonalScoring() {
    const container = document.createElement('div');
    container.id = 'personalScoresContainer';
    container.style.display = 'none';
    container.className = 'personal-scores-container';

    const header = document.createElement('div');
    header.className = 'personal-scores-header';
    header.innerHTML = `
      <h3>${window.i18n.translate('personalScores')}</h3>
      <div class="header-buttons">
        <button id="exportScores">${window.i18n.translate('exportScores')}</button>
        <button id="resetPersonalScores" class="reset-button">${window.i18n.translate('reset')}</button>
      </div>
    `;
    container.appendChild(header);

    const scoresList = document.createElement('div');
    scoresList.id = 'personalScoresList';
    scoresList.className = 'personal-scores-list';
    container.appendChild(scoresList);

    // Insert after race track container
    const raceTrackContainer = document.querySelector('.race-track-container');
    raceTrackContainer.parentNode.insertBefore(container, raceTrackContainer.nextSibling);

    document.getElementById('exportScores').addEventListener('click', () => this.exportScoresToCSV());
    document.getElementById('resetPersonalScores').addEventListener('click', () => {
      if (confirm(window.i18n.translate('confirmReset'))) {
        this.exportScoresToCSV();
        this.personalScores = {};
        localStorage.removeItem('personalScores');
        this.updatePersonalScoresList();
      }
    });
    
    // Update translations when language changes
    window.addEventListener('languageChanged', () => {
      header.innerHTML = `
        <h3>${window.i18n.translate('personalScores')}</h3>
        <div class="header-buttons">
          <button id="exportScores">${window.i18n.translate('exportScores')}</button>
          <button id="resetPersonalScores" class="reset-button">${window.i18n.translate('reset')}</button>
        </div>
      `;
      document.getElementById('exportScores').addEventListener('click', () => this.exportScoresToCSV());
      document.getElementById('resetPersonalScores').addEventListener('click', () => {
        if (confirm(window.i18n.translate('confirmReset'))) {
          this.exportScoresToCSV();
          this.personalScores = {};
          localStorage.removeItem('personalScores');
          this.updatePersonalScoresList();
        }
      });
      this.updatePersonalScoresList();
    });
  }

  togglePersonalScoresVisibility() {
    const container = document.getElementById('personalScoresContainer');
    this.isPersonalScoreVisible = !this.isPersonalScoreVisible;
    container.style.display = this.isPersonalScoreVisible ? 'block' : 'none';
    
    // Update button text
    const toggleButton = document.getElementById('togglePersonalScores');
    toggleButton.textContent = window.i18n.translate(
      this.isPersonalScoreVisible ? 'hidePersonalScores' : 'showPersonalScores'
    );
    
    if (this.isPersonalScoreVisible) {
      this.updatePersonalScoresList();
    }
  }

  updatePersonalScore(student, scoreChange) {
    if (!this.personalScores[student]) {
      this.personalScores[student] = 0;
    }
    this.personalScores[student] += scoreChange;
    localStorage.setItem('personalScores', JSON.stringify(this.personalScores));
    this.updatePersonalScoresList();
  }

  updatePersonalScoresList() {
    const scoresList = document.getElementById('personalScoresList');
    scoresList.innerHTML = '';

    const sortedStudents = Object.entries(this.personalScores)
      .sort(([,a], [,b]) => b - a);

    sortedStudents.forEach(([student, score]) => {
      const studentRow = document.createElement('div');
      studentRow.className = 'personal-score-row';
      studentRow.innerHTML = `
        <span class="student-name">${student}</span>
        <span class="student-score">${window.i18n.translate('score', [score])}</span>
        <div class="score-controls">
          <button class="score-button subtract-score" onclick="grouper.updatePersonalScore('${student}', -1)">-1</button>
          <button class="score-button add-score" onclick="grouper.updatePersonalScore('${student}', 1)">+1</button>
        </div>
      `;
      scoresList.appendChild(studentRow);
    });
  }

  exportScoresToCSV() {
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      [window.i18n.translate('studentName'), window.i18n.translate('score')],
      ...Object.entries(this.personalScores).map(([name, score]) => [name, score])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'personal_scores.csv';
    link.click();
  }

  setupThemeSwitcher() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.documentElement.setAttribute('data-theme', btn.dataset.theme);
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Play hover sound
        this.hoverSound.currentTime = 0;
        this.hoverSound.play();
        
        // Save theme preference
        localStorage.setItem('preferred-theme', btn.dataset.theme);
      });
    });

    // Load saved theme preference
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      themeBtns.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  }

  setupSoundEffects() {
    // This method is now redundant since setupAudio() handles the sound setup
    // You can remove this method or keep it as a placeholder
  }

}

// Make grouper instance globally available for personal score buttons
window.grouper = null;
document.addEventListener('DOMContentLoaded', () => {
  window.grouper = new StudentGrouper();
});