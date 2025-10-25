(() => {
let temp = { x: 0, y: 0 };
ON_START["detect-corner-1"] = () => {
    temp = { x: 0, y: 0 };
    GLOBAL_TRANSFORM = {x: 0, y: 0, xscale: 1, yscale: 1};
    document.getElementById("settings-transform").innerText = "Click the TOP LEFT CORNER through GreenHeat.";
}
ON_MESSAGE["detect-corner-1"] = (message) => {
    if (message.id != CHANNEL_ID || message.type !== "click") return;
    temp.x = message.x; temp.y = message.y;
    setGame("detect-corner-2");
}
ON_START["detect-corner-2"] = () => {
    document.getElementById("settings-transform").innerText = "Click the BOTTOM RIGHT CORNER through GreenHeat.";
}
ON_MESSAGE["detect-corner-2"] = (message) => {
    if (message.id != CHANNEL_ID || message.type !== "click") return;
    GLOBAL_TRANSFORM.x = temp.x;
    GLOBAL_TRANSFORM.y = temp.y;
    GLOBAL_TRANSFORM.xscale = (message.x - temp.x) / WINDOW_SIZE.width;
    GLOBAL_TRANSFORM.yscale = (message.y - temp.y) / WINDOW_SIZE.height;
    updateTransform();
    document.getElementById("settings-game").innerText = `Current Game: None`;
    setGame("");
}
})(); // ftr this is how you namespace in JS