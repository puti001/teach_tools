const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioBuffers = {};
const activeSources = {};

const soundFiles = {
    background_music: './background_music.mp3',
    pop: './pop.mp3',
    cheer: './cheer.mp3',
    wrong: './wrong.mp3',
    level_complete: './level_complete.mp3',
    instruction_red: './instruction_red.mp3',
    instruction_blue: './instruction_blue.mp3',
    instruction_green: './instruction_green.mp3',
    instruction_yellow: './instruction_yellow.mp3',
    instruction_orange: './instruction_orange.mp3',
    instruction_purple: './instruction_purple.mp3',
    instruction_reverse_red: './instruction_reverse_red.mp3',
    instruction_reverse_blue: './instruction_reverse_blue.mp3',
    instruction_reverse_green: './instruction_reverse_green.mp3',
    instruction_reverse_yellow: './instruction_reverse_yellow.mp3',
    instruction_reverse_orange: './instruction_reverse_orange.mp3',
    instruction_reverse_purple: './instruction_reverse_purple.mp3',
    instruction_multi_intro: './instruction_multi_intro.mp3',
    instruction_shape_intro: './instruction_shape_intro.mp3',
};

export function loadAllSounds() {
    loadSounds(Object.keys(soundFiles));
}

export async function loadSound(name) {
    if (audioBuffers[name]) {
        return;
    }
    try {
        const response = await fetch(soundFiles[name]);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[name] = audioBuffer;
    } catch (error) {
        console.error(`Error loading sound ${name}:`, error);
    }
}

export function loadSounds(names) {
    names.forEach(name => {
        if (soundFiles[name]) {
            loadSound(name);
        }
    });
}

export function stopSound(name) {
    if (activeSources[name]) {
        activeSources[name].stop();
        delete activeSources[name];
    }
}

export function playSound(name, { loop = false, stopPrevious = true, stop = false } = {}) {
    if (stop) {
        stopSound(name);
        return;
    }

    if (name === 'none' && audioContext.state === 'suspended') {
        audioContext.resume();
        return;
    }
    
    if (!audioBuffers[name]) {
        console.warn(`Sound not loaded: ${name}`);
        return;
    }
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (stopPrevious && activeSources[name]) {
        activeSources[name].stop();
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[name];
    source.connect(audioContext.destination);
    source.loop = loop;
    source.start(0);

    if (loop) {
        activeSources[name] = source;
    }
}