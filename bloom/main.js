import { startGame, stopGame, togglePause, handleBalloonClick, gameState, setGameMode, setGameSpeed } from './game.js';
import { playSound } from './audio.js';
import { showReportCard, hideReportCard, setupReportCardTabs, exportReport } from './report.js';
import { updateMusicButton, updateSfxButton } from './ui.js';
import { loadAllSounds } from './audio.js';

function init() {
    loadAllSounds();

    // --- Element References from UI module ---
    const startScreen = document.getElementById('start-screen');
    const endScreen = document.getElementById('end-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const modeSelection = document.getElementById('mode-selection');
    const speedSelection = document.getElementById('speed-selection');
    const gameContainer = document.getElementById('game-container');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const musicBtn = document.getElementById('music-btn');
    const sfxBtn = document.getElementById('sfx-btn');
    const reportCardButton = document.getElementById('report-card-button');
    const closeReportCardBtn = document.getElementById('close-report-card-btn');
    const reportTabs = document.querySelector('.report-tabs');
    const exportButton = document.getElementById('export-button');
    

    // Settings Selection
    modeSelection.addEventListener('click', (e) => {
        if (e.target.classList.contains('mode-btn')) {
            modeSelection.querySelector('.selected').classList.remove('selected');
            e.target.classList.add('selected');
            setGameMode(e.target.dataset.mode);
        }
    });

    speedSelection.addEventListener('click', (e) => {
        const button = e.target.closest('.speed-btn');
        if (button) {
            speedSelection.querySelector('.selected').classList.remove('selected');
            button.classList.add('selected');
            setGameSpeed(parseFloat(button.dataset.speed));
        }
    });
    
    // Set initial mode and speed from default selected buttons
    setGameMode(modeSelection.querySelector('.selected').dataset.mode);
    setGameSpeed(parseFloat(speedSelection.querySelector('.selected').dataset.speed));

    startButton.addEventListener('click', () => {
        playSound('none'); // Resume audio context on user interaction
        startGame();
    });
    restartButton.addEventListener('click', () => {
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });
    gameContainer.addEventListener('mousedown', handleBalloonClick);

    // --- Control Button Listeners ---
    pauseBtn.addEventListener('click', () => {
        if (gameState.isGameRunning) {
            togglePause();
        }
    });

    stopBtn.addEventListener('click', () => {
        if (gameState.isGameRunning) {
            stopGame();
        }
    });

    musicBtn.addEventListener('click', () => {
        gameState.isMusicOn = !gameState.isMusicOn;
        updateMusicButton(gameState.isMusicOn);
        if (gameState.isMusicOn) {
            if (gameState.isGameRunning && !gameState.isPaused) {
                playSound('background_music', { loop: true });
            }
        } else {
            playSound('background_music', { stop: true });
        }
    });

    sfxBtn.addEventListener('click', () => {
        gameState.isSfxOn = !gameState.isSfxOn;
        updateSfxButton(gameState.isSfxOn);
    });

    // --- Report Card Listeners ---
    reportCardButton.addEventListener('click', showReportCard);
    closeReportCardBtn.addEventListener('click', hideReportCard);
    
    reportTabs.addEventListener('click', (e) => {
        if (e.target.matches('.tab-btn')) {
            setupReportCardTabs(e.target);
        }
    });

    exportButton.addEventListener('click', exportReport);
}

init();