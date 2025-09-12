import { playSound } from './audio.js';
import { TARGET_SCORE, INITIAL_SPAWN_RATE, colors, colorKeys } from './constants.js';
import * as ui from './ui.js';
import * as analytics from './analytics.js';

let MIN_SPEED = 1;
let MAX_SPEED = 3;

export let gameState = {
    score: 0,
    gameMode: 'color', // color, reverse
    baseSpeed: 1.5,
    currentSpeed: 1.5,
    spawnRate: INITIAL_SPAWN_RATE,
    targetColor: '',
    gameInterval: null,
    isGameRunning: false,
    isPaused: false,
    isMusicOn: true,
    isSfxOn: true
};

function playSfx(name) {
    if (gameState.isSfxOn) {
        playSound(name);
    }
}

function playInstruction(name) {
    if (gameState.isSfxOn) {
        playSound(name, { stopPrevious: true });
    }
}

function setupGame() {
    gameState.score = 0;
    gameState.currentSpeed = gameState.baseSpeed;
    gameState.spawnRate = INITIAL_SPAWN_RATE / (gameState.baseSpeed / 1.5);
    ui.updateScoreUI(gameState.score, TARGET_SCORE);
    ui.endScreen.classList.add('hidden');
    ui.pauseOverlay.classList.add('hidden');
    ui.prohibitedIcon.classList.add('hidden');
    document.getElementById('controls-container').classList.remove('hidden');
    ui.clearBalloons();
}

export function startGame() {
    if (gameState.isGameRunning) return;
    analytics.loadGameData();
    gameState.isGameRunning = true;
    ui.startScreen.classList.add('hidden');
    setupGame();
    if (gameState.isMusicOn) playSound('background_music', { loop: true });
    analytics.startSessionTracking();

    if (gameState.gameInterval) clearInterval(gameState.gameInterval);
    gameState.gameInterval = setInterval(createBalloon, gameState.spawnRate);

    chooseNewTarget();
}

function endGame() {
    gameState.isGameRunning = false;
    clearInterval(gameState.gameInterval);
    playSound('background_music', { stop: true });
    playSfx('level_complete');
    ui.endScreen.classList.remove('hidden');
    analytics.endSessionTracking(gameState.score, gameState.gameMode);
    ui.createEndGameConfetti();
}

export function stopGame() {
    gameState.isGameRunning = false;
    clearInterval(gameState.gameInterval);
    playSound('background_music', { stop: true });
    analytics.endSessionTracking(gameState.score, gameState.gameMode);

    ui.clearBalloons();
    ui.startScreen.classList.remove('hidden');
    ui.endScreen.classList.add('hidden');
    ui.pauseOverlay.classList.add('hidden');
    document.getElementById('controls-container').classList.add('hidden');
    
    // Reset pause button icon in case game is stopped while paused
    if (gameState.isPaused) {
        gameState.isPaused = false;
        ui.togglePauseUI(false);
    }
}

function chooseNewTarget() {
    analytics.getSessionData().instructionTime = Date.now();

    switch (gameState.gameMode) {
        case 'color':
            gameState.targetColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
            const colorInfo = colors[gameState.targetColor];
            ui.updateInstructionUI({ text: `請戳破${colorInfo.name}的氣球！`, color: colorInfo.value });
            playInstruction(`instruction_${gameState.targetColor}`);
            break;
        case 'reverse':
            gameState.targetColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
            const reverseColorInfo = colors[gameState.targetColor];
            ui.updateInstructionUI({ text: `不要戳破${reverseColorInfo.name}的氣球！`, color: reverseColorInfo.value, showProhibited: true });
            playInstruction(`instruction_reverse_${gameState.targetColor}`);
            break;
    }
}

function updateMultiInstruction() {
    const nextColor = gameState.targetSequence[gameState.sequenceIndex];
    const colorInfo = colors[nextColor];
    const remainingColors = gameState.targetSequence.slice(gameState.sequenceIndex).map(c => colors[c].name).join('，再戳');
    ui.updateInstructionUI({ text: `請先戳破${remainingColors}的氣球！`, color: colorInfo.value });
}

function createBalloon() {
    if (!gameState.isGameRunning || gameState.isPaused) return;
    const colorKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];

    const balloon = ui.createBalloonElement(colorKey, 'balloon');
    const animation = ui.animateBalloon(balloon, gameState.currentSpeed);
    animation.onfinish = () => {
        balloon.remove();
    };
}

export function handleBalloonClick(e) {
    if (!e.target.classList.contains('balloon') || !gameState.isGameRunning || gameState.isPaused) return;

    const balloon = e.target;
    const color = balloon.dataset.color;
    const sessionData = analytics.getSessionData();
    let isCorrect = false;

    switch (gameState.gameMode) {
        case 'color':
            isCorrect = (color === gameState.targetColor);
            sessionData.colorStats[color][isCorrect ? 'correct' : 'incorrect']++;
            break;
        case 'reverse':
            isCorrect = (color !== gameState.targetColor);
            sessionData.colorStats[color][isCorrect ? 'correct' : 'incorrect']++;
            break;
    }

    if (isCorrect) onCorrect(balloon);
    else onWrong(balloon);
}

function onCorrect(balloon) {
    const sessionData = analytics.getSessionData();
    const gameData = analytics.getGameData();

    if (sessionData.instructionTime) {
        const reactionTime = (Date.now() - sessionData.instructionTime) / 1000;
        gameData.detailedStats.reactionTimes.push(reactionTime);
        if (gameData.detailedStats.reactionTimes.length > 50) gameData.detailedStats.reactionTimes.shift();
        sessionData.instructionTime = null;
    }

    sessionData.correctPops++;
    sessionData.popsThisMinute++;
    sessionData.consecutiveCorrect++;

    if (sessionData.popsThisMinute >= 20 && !gameData.achievements.quickHands.unlocked) {
        gameData.achievements.quickHands.unlocked = true;
    }

    gameState.score++;
    ui.updateScoreUI(gameState.score);
    playSfx('pop');
    playSfx('cheer');
    ui.createPopEffect(balloon);

    gameState.currentSpeed = Math.min(MAX_SPEED, gameState.currentSpeed + 0.1);
    balloon.remove();

    if (gameState.score >= TARGET_SCORE) {
        endGame();
    } else {
        let shouldChooseNew = ['reverse'].includes(gameState.gameMode);
        if (gameState.gameMode === 'color' && !document.querySelector(`.balloon[data-color=\"${gameState.targetColor}\"]`)) {
            shouldChooseNew = true;
        }
        if (shouldChooseNew) setTimeout(chooseNewTarget, 500);
    }
}

function onWrong(balloon) {
    const sessionData = analytics.getSessionData();
    playSfx('wrong');
    gameState.currentSpeed = gameState.baseSpeed;
    sessionData.incorrectPops++;
    sessionData.consecutiveCorrect = 0;
    ui.makeBalloonFlyAway(balloon);
}

export function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    ui.togglePauseUI(gameState.isPaused);

    if (gameState.isPaused) {
        clearInterval(gameState.gameInterval);
        playSound('background_music', { stop: true });
    } else {
        gameState.gameInterval = setInterval(createBalloon, gameState.spawnRate);
        if (gameState.isMusicOn) playSound('background_music', { loop: true });
    }
}

export function setGameMode(mode) {
    gameState.gameMode = mode;
}

export function setGameSpeed(speed) {
    gameState.baseSpeed = speed;
    MIN_SPEED = speed;
    MAX_SPEED = speed + 1.5;
}