(() => {
ON_START["detect-latency"] = () => {
    document.getElementById("settings-transform").innerText = "Click the circle when two of them meet.";
    LATENCY = 0;
    lastTime = Date.now();
}
ON_MESSAGE["detect-latency"] = (message) => {
    if (message.id != CHANNEL_ID || message.type !== "click") return;
    document.getElementById("audio-click").currentTime = 0;
    document.getElementById("audio-click").play();
    let w = Math.floor(WINDOW_SIZE.width / 256);
    let h = Math.floor(WINDOW_SIZE.height / 256);
    let adjustedTime = (message.timeAdjusted % (w * h * 1000)) / 1000;
    let x = Math.floor(message.x / 256);
    let y = Math.floor(message.y / 256);
    let targetTime = y * w + x + 1;
    LATENCY = adjustedTime - targetTime;
    if (LATENCY < -1) LATENCY += w * h;
    updateTransform();
    document.getElementById("settings-game").innerText = `Current Game: None`;
    setGame("");
}
let lastTime;
ON_DRAW["detect-latency"] = (canvas, ctx) => {
    let currentTime = Date.now();
    if ((currentTime % 1000) < (lastTime % 1000)) {
        document.getElementById("audio-tick").currentTime = 0;
        document.getElementById("audio-tick").play();
    }
    lastTime = currentTime;
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.text;
    ctx.fillStyle = COLORS.foreground;
    let w = Math.floor(WINDOW_SIZE.width / 256);
    let h = Math.floor(WINDOW_SIZE.height / 256);
    let time = (Date.now() % (w * h * 1000)) / 1000;
    let x = Math.floor(time) % w;
    let y = Math.floor(Math.floor(time) / w);
    let progress = time % 1;
    ctx.beginPath();
    ctx.arc(x * 256 + 128, y * 256 + 128, 48, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x * 256 + 128, y * 256 + 128, 48 + (80 - 80 * progress * progress * progress), 0, 2 * Math.PI);
    ctx.stroke();
}
})(); // ftr this is how you namespace in JS