let COLORS = {
    "background": "transparent",
    "foreground": "rgba(0, 0, 0, 0.25)",
    "text": "black"
};
function setBackground(color) {
    COLORS.background = color;
    COLORS.foreground = color === "black" ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.25)";
    COLORS.text = color === "black" ? "white" : "black";
    document.querySelector(':root').style.setProperty(`--background`, COLORS.background);
    document.querySelector(':root').style.setProperty(`--foreground`, COLORS.foreground);
    document.querySelector(':root').style.setProperty(`--text`, COLORS.text);
}

async function setGame(game, el) {
    if (ON_END[CURRENT_GAME]) await ON_END[CURRENT_GAME]();
    CURRENT_GAME = game;
    if (ON_START[CURRENT_GAME]) await ON_START[CURRENT_GAME]();
    if (ON_RESIZE[CURRENT_GAME]) await ON_RESIZE[CURRENT_GAME]();
    if (el) document.getElementById("settings-game").innerText = `Current Game: ${el.innerText}`;
}

function setResolution() {
    GLOBAL_SIZE.width = Number(document.getElementById("settings-width").value);
    GLOBAL_SIZE.height = Number(document.getElementById("settings-height").value);
    updateTransform();
}