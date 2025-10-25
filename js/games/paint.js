(() => {
let canvas, ctx;
ON_START["paint"] = () => {
    // create a new "persistent" canvas that does not clear itself every frame behind the "overlay"
    canvas = insertElement("canvas").with("id", "paint-canvas");
    document.body.insertBefore(canvas, document.getElementById("main"));
    ctx = canvas.getContext("2d");
    lastPoint = {};
}
ON_RESIZE["paint"] = () => {
    canvas.width = WINDOW_SIZE.width;
    canvas.height = WINDOW_SIZE.height;
}
ON_END["paint"] = () => {
    document.body.removeChild(canvas);
}

let lastPoint = {};
let brush = {};
ON_MESSAGE["paint"] = (message) => {
    brush[message.id] ??= { brush: true, thickness: 4, color: message.color };
    // (!lastPoint[message.id] && message.type !== "click") IFF the "click" was from a button (no draw)
    if (message.type === "hover" || (!lastPoint[message.id] && message.type !== "click")) return;
    if (checkButtons(message)) return;
    // "source-over": default, "destination-out": erase mode
    ctx.globalCompositeOperation = brush[message.id].brush ? "source-over" : "destination-out";
    // draw end circles (smooth tip)
    if (message.type === "click" || message.type === "release") { 
        ctx.fillStyle = brush[message.id].color;
        ctx.beginPath();
        ctx.arc(message.x, message.y, brush[message.id].thickness / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
    // draw line
    if (message.type === "release" || message.type === "drag") {
        ctx.strokeStyle = brush[message.id].color;
        ctx.lineWidth = brush[message.id].thickness;
        ctx.beginPath();
        ctx.moveTo(lastPoint[message.id].x, lastPoint[message.id].y);
        ctx.lineTo(message.x, message.y);
        ctx.stroke();
    }
    // set lastPoint
    if (message.type === "click" || message.type === "drag") lastPoint[message.id] = { x: message.x, y: message.y };  
    if (message.type === "release") delete lastPoint[message.id];
}
// check if button is pressed. returns if the button was pressed
function checkButtons(message) {
    if (message.type !== "click") return false;
    let found = false;
    for (const button of BUTTONS) {
        const x = button.x - message.x;
        const y = button.y - message.y;
        if (Math.hypot(x, y) <= button.r) {
            found = true;
            button.onclick(message);
        }
    }
    return found;
}

// draws circular buttons of size BUTTON_RADIUS in a grid, offset 16x16, margin BUTTON_MARGIN with centered text
// can be way simpler since were drawing the exact same buttons but its extendable
ON_DRAW["paint"] = (canvas, ctx) => {
    for (const button of BUTTONS) {
        ctx.beginPath();
        ctx.arc(button.x, button.y, button.r, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.foreground;
        ctx.fill();
        button.draw(canvas, ctx, button);
    }
}
function buttonPosition(i) { return 16 + ((BUTTON_RADIUS * 2 + BUTTON_MARGIN) * i) + BUTTON_RADIUS; }
const BUTTON_RADIUS = 48;
const BUTTON_MARGIN = 8;
const BUTTONS = [
    { 
        x: buttonPosition(0), y: buttonPosition(0), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Brush", ctx, button); },
        onclick: (message) => { brush[message.id].brush = true; }
    },
    { 
        x: buttonPosition(1), y: buttonPosition(0), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Erase", ctx, button); },
        onclick: (message) => { brush[message.id].brush = false; }
    },
    { 
        x: buttonPosition(0), y: buttonPosition(1), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("White", ctx, button); },
        onclick: (message) => { brush[message.id].color = `color-mix(in oklab, ${message.color} 10%, white 90%)`; }
    },
    { 
        x: buttonPosition(0), y: buttonPosition(2), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Light", ctx, button); },
        onclick: (message) => { brush[message.id].color = message.color; }
    },
    { 
        x: buttonPosition(0), y: buttonPosition(3), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Dark", ctx, button); },
        onclick: (message) => { brush[message.id].color = `color-mix(in oklab, ${message.color} 50%, black 50%)`; }
    },
    { 
        x: buttonPosition(0), y: buttonPosition(4), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Black", ctx, button); },
        onclick: (message) => { brush[message.id].color = `color-mix(in oklab, ${message.color} 10%, black 90%)`; }
    },
    { 
        x: buttonPosition(1), y: buttonPosition(1), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("16px", ctx, button); },
        onclick: (message) => { brush[message.id].thickness = 16; }
    },
    { 
        x: buttonPosition(1), y: buttonPosition(2), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("8px", ctx, button); },
        onclick: (message) => { brush[message.id].thickness = 8; }
    },
    { 
        x: buttonPosition(1), y: buttonPosition(3), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("4px", ctx, button); },
        onclick: (message) => { brush[message.id].thickness = 4; }
    },
    { 
        x: buttonPosition(1), y: buttonPosition(4), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("2px", ctx, button); },
        onclick: (message) => { brush[message.id].thickness = 2; }
    },
    { 
        x: buttonPosition(0), y: buttonPosition(5), r: BUTTON_RADIUS, 
        draw: (_, ctx, button) => { drawText("Clear", ctx, button); },
        onclick: (message) => { 
            if (message.id !== CHANNEL_ID) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
];
function drawText(text, ctx, button) {
    ctx.font = "24px sans-serif";
    ctx.fillStyle = COLORS.text; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, button.x, button.y);
}
})(); // ftr this is how you namespace in JS