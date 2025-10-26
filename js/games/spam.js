(() => {
let POINT
ON_START["spam"] = () => {
    POINT = 0;
}
ON_MESSAGE["spam"] = (message) => {
    if (message.type !== "click") return;
    POINT += 1;
    document.getElementById("audio-click").currentTime = 0;
    document.getElementById("audio-click").play();
}
ON_DRAW["spam"] = (canvas, ctx) => {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.rect(0, 0, WINDOW_SIZE.width, WINDOW_SIZE.height);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.font = "48px sans-serif"; 
    ctx.textBaseline = "bottom";
    ctx.fillText("SPAM THE SCREEN !!", WINDOW_SIZE.width / 2, WINDOW_SIZE.height / 2 - 8);
    ctx.font = "24px sans-serif"; 
    ctx.textBaseline = "top";
    ctx.fillText(`Counter: ${POINT}`, WINDOW_SIZE.width / 2, WINDOW_SIZE.height / 2 + 8);
}
})(); // ftr this is how you namespace in JS