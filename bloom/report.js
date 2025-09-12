import { getGameData } from './analytics.js';
import { colors } from './constants.js';
import { reportCardScreen } from './ui.js';

export function showReportCard() {
    updateReportCardUI();
    reportCardScreen.classList.remove('hidden');
}

export function hideReportCard() {
    reportCardScreen.classList.add('hidden');
}

export function setupReportCardTabs(targetTab) {
    document.querySelector('.tab-btn.active').classList.remove('active');
    document.querySelector('.tab-content.active').classList.remove('active');
    targetTab.classList.add('active');
    document.getElementById(targetTab.dataset.tab).classList.add('active');
}

function updateReportCardUI() {
    const gameData = getGameData();
    if (!gameData.stats) return; // Not loaded yet

    // High Score
    document.getElementById('high-score-display').textContent = gameData.stats.highScore;

    // Calendar
    renderCalendar();

    // Trophies
    renderTrophies();

    // Analytics
    const totalMinutes = Math.floor(gameData.stats.totalPlayTime / 60);
    document.getElementById('total-play-time').textContent = `${totalMinutes} 分鐘`;

    if (gameData.detailedStats.reactionTimes && gameData.detailedStats.reactionTimes.length > 0) {
        const avgReaction = gameData.detailedStats.reactionTimes.reduce((a, b) => a + b, 0) / gameData.detailedStats.reactionTimes.length;
        document.getElementById('avg-reaction-time').textContent = `${avgReaction.toFixed(2)} 秒`;
    } else {
        document.getElementById('avg-reaction-time').textContent = 'N/A';
    }

    const colorAccuracyContainer = document.getElementById('color-accuracy');
    colorAccuracyContainer.innerHTML = '';
    for (const colorKey in gameData.detailedStats.colorAccuracy) {
        const stats = gameData.detailedStats.colorAccuracy[colorKey];
        const total = stats.correct + stats.incorrect;
        if (total === 0) continue;
        const accuracy = Math.round((stats.correct / total) * 100);
        const p = document.createElement('p');
        p.innerHTML = `<strong style="color:${colors[colorKey].value}; text-shadow: 1px 1px 1px #ccc;">${colors[colorKey].name}</strong>: ${accuracy}%`;
        colorAccuracyContainer.appendChild(p);
    }
}

function renderCalendar() {
    const gameData = getGameData();
    const container = document.getElementById('calendar-container');
    container.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day', 'calendar-day-header');
        dayEl.textContent = day;
        container.appendChild(dayEl);
    });

    for (let i = 0; i < firstDay; i++) {
        container.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day');
        dayEl.textContent = i;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        if (gameData.playHistory && gameData.playHistory.some(entry => entry.date === dateStr)) {
            dayEl.classList.add('played');
        }
        container.appendChild(dayEl);
    }
}

function renderTrophies() {
    const gameData = getGameData();
    const trophyCase = document.getElementById('trophy-case');
    trophyCase.innerHTML = '';
    const trophies = [
        { id: 'colorMaster', name: '顏色大師', icon: 'color_master_trophy.png', desc: '連續5天遊玩' },
        { id: 'quickHands', name: '快手俠', icon: 'quick_hands_trophy.png', desc: '一分鐘內戳對20顆' },
        { id: 'focusedKid', name: '專注好寶寶', icon: 'focused_kid_trophy.png', desc: '反向模式連續答對10次' }
    ];

    trophies.forEach(trophy => {
        const isUnlocked = gameData.achievements && gameData.achievements[trophy.id]?.unlocked;
        const trophyEl = document.createElement('div');
        trophyEl.classList.add('trophy');
        if (isUnlocked) trophyEl.classList.add('unlocked');
        trophyEl.innerHTML = `
            <img src="./${trophy.icon}" alt="${trophy.name}">
            <p>${trophy.name}</p>
        `;
        trophyEl.title = trophy.desc + (isUnlocked ? ' (已解鎖)' : ' (未解鎖)');
        trophyCase.appendChild(trophyEl);
    });
}

export function exportReport() {
    const gameData = getGameData();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyPlayHistory = gameData.playHistory.filter(entry => new Date(entry.date) >= weekAgo);
    
    let report = `彩色氣球派對 - 週報表 (${new Date().toLocaleDateString()})\n`;
    report += '================================\n\n';
    report += `總遊玩時間: ${Math.floor(gameData.stats.totalPlayTime / 60)} 分鐘\n`;
    report += `最高分紀錄: ${gameData.stats.highScore} 顆氣球\n`;
    
    if (gameData.detailedStats.reactionTimes && gameData.detailedStats.reactionTimes.length > 0) {
        const avgReaction = gameData.detailedStats.reactionTimes.reduce((a, b) => a + b, 0) / gameData.detailedStats.reactionTimes.length;
        report += `平均反應時間: ${avgReaction.toFixed(2)} 秒\n`;
    }
    
    report += `\n--- 本週遊玩紀錄 ---\n`;
    if (weeklyPlayHistory.length > 0) {
        weeklyPlayHistory.forEach(entry => {
            report += `${entry.date}: ${Math.floor(entry.duration / 60)} 分鐘\n`;
        });
    } else {
        report += '本週沒有遊玩紀錄。\n';
    }
    
    report += '\n--- 顏色正確率 ---\n';
    for (const colorKey in gameData.detailedStats.colorAccuracy) {
        const stats = gameData.detailedStats.colorAccuracy[colorKey];
        const total = stats.correct + stats.incorrect;
        if (total > 0) {
            const accuracy = Math.round((stats.correct / total) * 100);
            report += `${colors[colorKey].name}: ${accuracy}% (${stats.correct}/${total})\n`;
        }
    }
    
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write('<pre>' + report + '</pre>');
    reportWindow.document.title = '氣球派對週報表';
}