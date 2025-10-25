let canvas, ctx;
function initializeRenderer() {
    canvas = document.getElementById("main");
    ctx = canvas.getContext("2d");
    loopRender();
}

let framesThisSecond = 0;
let nextSecond = 1000;
function loopRender() {
    // start
    let start = Date.now();
    framesThisSecond += 1;
    // do the actual thing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
    if (ON_DRAW[CURRENT_GAME]) ON_DRAW[CURRENT_GAME](canvas, ctx);
    // cursor
    for (const k of Object.keys(cursors)) if (start - cursors[k].time >= 1000) delete cursors[k];
    for (const cursor of Object.values(cursors)) {
        let filter = `opacity(${100 - ((start - cursor.time) / 10)}%)`;
        if (cursor.color) filter += " " + rgbToFilter(cursor.color);
        ctx.filter = filter;
        ctx.drawImage(getSprite("sprite-cursor"), cursor.x, cursor.y);
        if (cursor.name !== "") {
            ctx.fillStyle = cursor.color;
            ctx.fillText(cursor.name, cursor.x + 32, cursor.y + 32);
        }
    }
    // end
    let end = Date.now();
    if (performance.now() >= nextSecond) {
        nextSecond += 1000;
        updateFPS();
        framesThisSecond = 0;
    }
    let timeLeft = (1000 / TARGET_FPS) - (end - start);
    if (timeLeft <= 0) setTimeout(loopRender, 1);
    else setTimeout(loopRender, timeLeft);
}

let SPRITE_CACHE = {};
function getSprite(id) {
    SPRITE_CACHE[id] ??= document.getElementById(id);
    return SPRITE_CACHE[id];
}

function updateFPS() {
    if (getComputedStyle(document.getElementById("settings")).opacity > 0.25) return;
    document.getElementById("settings-fps").innerText = `(Current FPS: ${framesThisSecond})`;
}

// ID: { name: string, color: color, time: number, x: number, y: number }
let cursors = {};
function addCursor(message) {
    cursors[message.id] = {
        name: message.name,
        color: message.color,
        time: message.time,
        x: message.x,
        y: message.y
    };
}

function rgbToFilter(color) {
    if (color.startsWith("#")) color = color.slice(1);
    let rgb = parseInt(color, 16);
    let r = ((rgb >> 8) & 0xFF) / 255;
    let g = ((rgb >> 16) & 0xFF) / 255;
    let b = (rgb & 0xFF) / 255;
    return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="${color}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 1 0"/></filter></defs></svg>#${color}');`;
}