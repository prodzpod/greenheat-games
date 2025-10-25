(() => {
let LAST_PRESSED = {};
ON_START["piano"] = () => {
    LAST_PRESSED = {};
}
let BUTTONS = [];
for (let i = 2; i < 8; i++) initializeOctave(i, 0);
function initializeOctave(octave, y) {
    const CHORDS = [
        { text: "", offset: [0, 4, 7] }, // major
        { text: "-", offset: [0, 3, 7] }, // minor
        { text: "+", offset: [0, 4, 8] }, // augmented
        { text: "o", offset: [0, 3, 6] }, // diminished
    ];
    const CHORDS2 = [
        { text: "7", offset: [0, 4, 7, 10] }, // 7th
        { text: "-7", offset: [0, 3, 7, 10] }, // minor 7th
        { text: "M7", offset: [0, 4, 7, 11] }, // major 7th
        { text: "Mm7", offset: [0, 3, 6, 11] }, // mm 7th
    ];
    // bunch of margins and offsets (placing buttons, not relevant to functionality)
    const x = (96 * 7) * ((octave + y) - 5);
    const FIRST_MARGIN = (384 / 2) + 8 + 32;
    for (let i = 0; i < 7; i++) {
        const note = (["C", "D", "E", "F", "G", "A", "B"])[i];
        const _x = x + (96 * i), _y = (384 * y);
        BUTTONS.push({
            type: "square", color: "white", outline: "black", 
            x: _x, y: _y, width: 96, height: 384, 
            text: note + (i === 0 ? octave : ""), note: note + octave
        });
        let idx = 0;
        for (const chord of CHORDS) {
            addChordButton(note, octave, chord.text, chord.offset, _x - 16, _y + FIRST_MARGIN, idx, 32);
            idx += 1;
        }
        idx = 0;
        for (const chord of CHORDS2) {
            addChordButton(note, octave, chord.text, chord.offset, _x + 16, _y + FIRST_MARGIN + 32, idx, 32);
            idx += 1;
        }
    }
    for (let i = 0; i < 7; i++) {
        const note = (["C#", "D#", "", "F#", "G#", "A#", ""])[i];
        if (note === "") continue;
        const _x = x + 48 + (96 * i), _y = -64 + (384 * y);
        BUTTONS.push({
            type: "square", color: "black", outline: "white", 
            x: _x, y: _y, width: 64, height: 256, 
            text: note + (i === 0 ? octave : ""), note: note + octave
        });
        let idx = 0;
        for (const chord of CHORDS) {
            addChordButton(note, octave, chord.text, chord.offset, _x - 16, _y + 64 - FIRST_MARGIN, idx, 32);
            idx -= 1;
        }
        idx = 0;
        for (const chord of CHORDS2) {
            addChordButton(note, octave, chord.text, chord.offset, _x + 16, _y + 64 - FIRST_MARGIN - 32, idx, 32);
            idx -= 1;
        }
    }
}
function addChordButton(note, octave, text, offset, x, y, idx, r) {
    const step = note_to_half_step(note + octave);
    const notes = offset.map(x => half_step_to_note(x + step));
    BUTTONS.push({
        type: "circle", color: COLORS.foreground, outline: COLORS.text, 
        x: x, y: y + (idx * (r * 2 + 8)), r: r, 
        text: note + text, note: notes
    });
}
// actual functionality
ON_MESSAGE["piano"] = (message) => {
    // LAST_PRESSED: used so dragging doesnt spam same note
    if (message.type === "release") delete LAST_PRESSED[message.id];
    if (message.type === "hover" || message.type === "release") return;
    // hitbox detection
    for (let i = BUTTONS.length - 1; i >= 0; i--) {
        const button = BUTTONS[i];
        let detected = false;
        let x = button.x + WINDOW_SIZE.width / 2;
        let y = button.y + WINDOW_SIZE.height / 2;
        if (button.type === "square") {
            detected = x - (button.width / 2) <= message.x && message.x < x + (button.width / 2)
                && y - (button.height / 2) <= message.y && message.y < y + (button.height / 2);
        } else if (button.type === "circle") {
            detected = Math.hypot(message.x - x, message.y - y) <= button.r;
        }
        // play
        if (detected) { 
            if (LAST_PRESSED[message.id] !== button) play(button.note); 
            LAST_PRESSED[message.id] = button;
            break; 
        }
    }
}
ON_DRAW["piano"] = (canvas, ctx) => {
    ctx.lineWidth = 1;
    for (const button of BUTTONS) {
        let x = button.x + WINDOW_SIZE.width / 2;
        let y = button.y + WINDOW_SIZE.height / 2;
        ctx.strokeStyle = button.outline;
        ctx.fillStyle = button.color;
        ctx.beginPath();
        if (button.type === "square") {
            ctx.rect(x - (button.width / 2), y - (button.height / 2), button.width, button.height);
        } else if (button.type === "circle") {
            ctx.arc(x, y, button.r, 0, 2 * Math.PI);
        }
        ctx.fill();
        ctx.stroke();
        ctx.font = "24px sans-serif";
        ctx.fillStyle = button.outline; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (button.type === "square") {
            ctx.fillText(button.text, x, y + (button.height / 2) - 24);
        } else if (button.type === "circle") {
            ctx.fillText(button.text, x, y);
        }
    }
}

// from dbkai which probably is from original bellsize which probably is from bezelea
let oscs = new Array();
const audio_ctx = new(window.AudioContext || window.webkitAudioContext)();
const play = note => {
    if (Array.isArray(note)) { note.map(x => play(x)); return; }
    let osc = make_oscillator();
    osc.frequency.value = note_to_frequency(note);
    osc.start();
    oscs.push(osc);
    setTimeout(() => {
        oscs.splice(oscs.indexOf(osc), 1);
        osc.stop();
    }, 15000 / 75);
};
function make_oscillator() {
    let oscillator = audio_ctx.createOscillator();
    let gain_node = audio_ctx.createGain();

    gain_node.gain.value = 0.01;
    oscillator.type = "square";
    oscillator.connect(gain_node);
    gain_node.connect(audio_ctx.destination);
    return oscillator;
}
function note_to_frequency(note) {
    const step = note_to_half_step(note);
    return 440 * Math.pow(2, step / 12);
}
function note_to_half_step(note) {
    const re = /\d+$/.exec(note);
    const octave = re ? Number(re[0]) : 4; const symbol = re ? note.slice(0, -re[0].length) : note;
    const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return chromatic.indexOf(symbol.toUpperCase()) - 9 + 12 * (octave - 4);
}
function half_step_to_note(step) {
    const chromatic = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return chromatic[((step % 12) + 12 - 3) % 12] + (Math.floor((step - 3) / 12) + 5);
}
})(); // ftr this is how you namespace in JS