import { colorKeys } from './constants.js';

let sessionData = {};
let gameData = {};

const defaultGameData = {
    stats: {
        highScore: 0,
        totalPlayTime: 0, // in seconds
    },
    achievements: {
        colorMaster: { unlocked: false },
        quickHands: { unlocked: false },
        focusedKid: { unlocked: false },
    },
    playHistory: [], // [ { date: "YYYY-MM-DD", duration: seconds } ]
    detailedStats: {
        reactionTimes: [],
        colorAccuracy: {}
    },
    consecutiveDays: 1,
    lastPlayDate: null
};

export function loadGameData() {
    const savedData = localStorage.getItem('balloonPopGameData');
    gameData = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(defaultGameData));
    // Ensure nested objects exist to prevent errors with old data structures
    gameData.stats = gameData.stats || defaultGameData.stats;
    gameData.achievements = gameData.achievements || defaultGameData.achievements;
    gameData.playHistory = gameData.playHistory || defaultGameData.playHistory;
    gameData.detailedStats = gameData.detailedStats || defaultGameData.detailedStats;
    gameData.detailedStats.colorAccuracy = gameData.detailedStats.colorAccuracy || {};
    gameData.detailedStats.reactionTimes = gameData.detailedStats.reactionTimes || [];
}

function saveGameData() {
    localStorage.setItem('balloonPopGameData', JSON.stringify(gameData));
}

export function startSessionTracking() {
    sessionData = {
        startTime: Date.now(),
        popsThisMinute: 0,
        minuteInterval: setInterval(() => { sessionData.popsThisMinute = 0; }, 60000),
        instructionTime: null,
        consecutiveCorrect: 0,
        correctPops: 0,
        incorrectPops: 0,
        colorStats: {}
    };
    colorKeys.forEach(c => {
        sessionData.colorStats[c] = { correct: 0, incorrect: 0 };
    });
}

export function endSessionTracking(finalScore, gameMode) {
    if (!sessionData.startTime) return;
    clearInterval(sessionData.minuteInterval);

    const duration = Math.round((Date.now() - sessionData.startTime) / 1000); // in seconds
    gameData.stats.totalPlayTime += duration;

    // Update play history for calendar
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = gameData.playHistory.find(entry => entry.date === today);
    if (todayEntry) {
        todayEntry.duration += duration;
    } else {
        gameData.playHistory.push({ date: today, duration: duration });
    }
    
    // Check for consecutive days
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if(gameData.lastPlayDate === yesterday){
        gameData.consecutiveDays = (gameData.consecutiveDays || 1) + 1;
    } else if (gameData.lastPlayDate !== today) {
        gameData.consecutiveDays = 1;
    }
    gameData.lastPlayDate = today;

    // Update high score
    if (finalScore > gameData.stats.highScore) {
        gameData.stats.highScore = finalScore;
    }
    
    // Merge color accuracy stats
    for (const color in sessionData.colorStats) {
        if (!gameData.detailedStats.colorAccuracy[color]) {
            gameData.detailedStats.colorAccuracy[color] = { correct: 0, incorrect: 0 };
        }
        gameData.detailedStats.colorAccuracy[color].correct += sessionData.colorStats[color].correct;
        gameData.detailedStats.colorAccuracy[color].incorrect += sessionData.colorStats[color].incorrect;
    }

    checkAchievements(gameMode);
    saveGameData();
}

function checkAchievements(gameMode) {
    // Color Master: 5 consecutive days
    if(gameData.consecutiveDays >= 5 && !gameData.achievements.colorMaster.unlocked) {
        gameData.achievements.colorMaster.unlocked = true;
    }
    // Focused Kid: 10 consecutive correct in reverse mode
    if (sessionData.consecutiveCorrect >= 10 && gameMode === 'reverse' && !gameData.achievements.focusedKid.unlocked) {
        gameData.achievements.focusedKid.unlocked = true;
    }
     // Quick Hands achievement check: 20 correct pops in a minute
    if(sessionData.popsThisMinute >= 20 && !gameData.achievements.quickHands.unlocked) {
        gameData.achievements.quickHands.unlocked = true;
    }
}

export function getGameData() {
    return gameData;
}

export function getSessionData() {
    return sessionData;
}