(() => {
let LEADERBOARD = {};
let LEADERBOARD_ORDER = [];
ON_START["pizza"] = () => {
    // LEADERBOARD = {};
    // LEADERBOARD_ORDER = [];
}
ON_MESSAGE["pizza"] = (message) => {
    const BUTTON = { x: WINDOW_SIZE.width - 80, y: 80, r: 64 };
    if (message.type !== "click") return;
    if (Math.hypot(message.x - BUTTON.x, message.y - BUTTON.y) > BUTTON.r) return;
    LEADERBOARD[message.id] ??= { name: message.name === "" ? `Anonymous ${message.id}` : message.name, color: message.color, point: 0 };
    LEADERBOARD[message.id].point += 1;
    LEADERBOARD_ORDER = Object.keys(LEADERBOARD).sort((a, b) => LEADERBOARD[b].point - LEADERBOARD[a].point);
    document.getElementById("audio-pizza").currentTime = 0;
    document.getElementById("audio-pizza").play();
}
ON_DRAW["pizza"] = (canvas, ctx) => {
    const BUTTON = { x: WINDOW_SIZE.width - 80, y: 80, r: 64 };
    let idx = 1;
    for (const id of LEADERBOARD_ORDER) {
        const entry = LEADERBOARD[id];
        ctx.font = "24px sans-serif"; 
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = entry.color;
        ctx.fillText(`${idx}: ${entry.name} (${entry.point})`, 16, 32 * idx - 16);
        idx += 1;
    }
    ctx.fillStyle = COLORS.foreground;
    ctx.beginPath();
    ctx.arc(BUTTON.x, BUTTON.y, BUTTON.r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.font = "24px sans-serif"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLORS.text;
    ctx.fillText("Free Pizza", BUTTON.x, BUTTON.y);
}
})(); // ftr this is how you namespace in JS