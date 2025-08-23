let audioContext;
const soundBuffers = {};

async function loadSound(name, url) {
    if (!audioContext) return;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        soundBuffers[name] = audioBuffer;
    } catch (error) {
        console.error(`Failed to load sound: ${name}`, error);
    }
}

export function init() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Unlock audio context on user interaction
            const unlock = () => {
                if(audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                document.body.removeEventListener('click', unlock);
                document.body.removeEventListener('touchend', unlock);
            };
            document.body.addEventListener('click', unlock);
            document.body.addEventListener('touchend', unlock);
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return;
        }
    }
    
    loadSound('click', './click.mp3');
    loadSound('checked', './checked.mp3');
    loadSound('alarm', './alarm.mp3');
}

export function playSound(name, loop = false) {
    if (!audioContext || !soundBuffers[name]) {
        return null;
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = soundBuffers[name];
    source.connect(audioContext.destination);
    source.loop = loop;
    source.start(0);
    return source;
}

