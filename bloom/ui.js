import confetti from 'canvas-confetti';
import { colors } from './constants.js';

// DOM Elements
export const gameContainer = document.getElementById('game-container');
export const instructionBar = document.getElementById('instruction-bar');
export const instructionText = document.getElementById('instruction-text');
export const prohibitedIcon = document.getElementById('prohibited-icon');
export const scoreDisplay = document.getElementById('score');
export const targetScoreDisplay = document.getElementById('target-score');
export const startScreen = document.getElementById('start-screen');
export const endScreen = document.getElementById('end-screen');
export const pauseOverlay = document.getElementById('pause-overlay');
export const reportCardScreen = document.getElementById('report-card-screen');
export const pauseBtn = document.getElementById('pause-btn');
export const musicBtn = document.getElementById('music-btn');
export const sfxBtn = document.getElementById('sfx-btn');

export function updateScoreUI(score, target) {
    scoreDisplay.textContent = score;
    if (target) {
        targetScoreDisplay.textContent = target;
    }
}

export function updateInstructionUI({ text, html, color, showProhibited = false }) {
    instructionText.textContent = '';
    instructionText.innerHTML = '';
    if (text) {
        instructionText.textContent = text;
    } else if (html) {
        instructionText.innerHTML = html;
    }
    
    instructionBar.style.backgroundColor = color;
    
    if (showProhibited) {
        prohibitedIcon.src = './prohibited_icon.png';
        prohibitedIcon.classList.remove('hidden');
    } else {
        prohibitedIcon.classList.add('hidden');
    }
}

export function createBalloonElement(colorKey, shapeKey) {
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');

    balloon.dataset.color = colorKey;
    balloon.dataset.shape = shapeKey;
    balloon.style.backgroundImage = `url(./${colorKey}_balloon.png)`;
    balloon.style.left = `${Math.random() * (window.innerWidth - 100)}px`;

    gameContainer.appendChild(balloon);
    return balloon;
}

function getAssetPath(color, shape = 'balloon') {
    if (shape === 'balloon') {
        return `./${color}_balloon.png`;
    }
    return `./${color}_${shape}.png`;
}

export function animateBalloon(balloon, speed) {
    const duration = (10 / speed) * 1000;
    const animation = balloon.animate([
        { bottom: '-150px' },
        { bottom: '100vh' }
    ], {
        duration: duration,
        easing: 'linear'
    });
    return animation;
}

export function createPopEffect(balloon) {
    const popEffect = document.createElement('div');
    popEffect.classList.add('pop-effect');
    popEffect.style.left = `${balloon.offsetLeft - 25}px`;
    popEffect.style.top = `${balloon.offsetTop - 15}px`;
    gameContainer.appendChild(popEffect);

    setTimeout(() => {
        popEffect.remove();
    }, 300);

    const rect = balloon.getBoundingClientRect();
    const origin = {
        x: (rect.left + rect.right) / 2 / window.innerWidth,
        y: (rect.top + rect.bottom) / 2 / window.innerHeight
    };

    let confettiColors = ['#FFFFFF'];
    const popColor = colors[balloon.dataset.color]?.value;
    if (popColor) {
        confettiColors.push(popColor);
    }

    confetti({
        particleCount: 50,
        spread: 70,
        origin: origin,
        colors: confettiColors
    });
}

export function createEndGameConfetti() {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
}

export function clearBalloons() {
    gameContainer.querySelectorAll('.balloon').forEach(b => b.remove());
}

export function togglePauseUI(isPaused) {
    const pauseIcon = pauseBtn.querySelector('img');
    if (isPaused) {
        document.querySelectorAll('.balloon').forEach(b => b.getAnimations().forEach(anim => anim.pause()));
        pauseOverlay.classList.remove('hidden');
        pauseIcon.src = './play_icon.png';
        pauseIcon.alt = '繼續';
    } else {
        document.querySelectorAll('.balloon').forEach(b => b.getAnimations().forEach(anim => anim.play()));
        pauseOverlay.classList.add('hidden');
        pauseIcon.src = './pause_icon.png';
        pauseIcon.alt = '暫停';
    }
}

export function makeBalloonFlyAway(balloon) {
    balloon.style.transition = 'transform 0.5s ease-in, opacity 0.5s ease-in';
    const flyDirection = Math.random() > 0.5 ? 1 : -1;
    balloon.style.transform = `translateX(${flyDirection * 200}px) translateY(-200px) rotate(${flyDirection * 45}deg)`;
    balloon.style.opacity = '0';
    balloon.style.pointerEvents = 'none';
}

export function updateMusicButton(isMusicOn) {
    const musicIcon = musicBtn.querySelector('img');
    musicIcon.src = isMusicOn ? './music_on_icon.png' : './music_off_icon.png';
}

export function updateSfxButton(isSfxOn) {
    const sfxIcon = sfxBtn.querySelector('img');
    sfxIcon.src = isSfxOn ? './sfx_on_icon.png' : './sfx_off_icon.png';
}