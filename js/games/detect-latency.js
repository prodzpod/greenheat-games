(() => {
ON_START["detect-latency"] = () => {
    document.getElementById("settings-transform").innerText = "Click the circle when two of them meet.";
    LATENCY = 0;
}
ON_MESSAGE["detect-latency"] = (message) => {
    if (message.type !== "click") return;
    let w = Math.floor(WINDOW_SIZE.width / 256);
    let h = Math.floor(WINDOW_SIZE.height / 256);
    let adjustedTime = (message.timeAdjusted % (w * h * 1000)) / 1000;
    let x = Math.floor(message.x / 256);
    let y = Math.floor(message.y / 256);
    let targetTime = y * w + x + 1;
    LATENCY = adjustedTime - targetTime;
    if (LATENCY < 0) LATENCY += w * h;
    updateTransform();
    document.getElementById("settings-game").innerText = `Current Game: None`;
    setGame("");
}
ON_DRAW["detect-latency"] = (canvas, ctx) => {
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