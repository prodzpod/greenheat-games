function initializeWebsocket() {
    let ws = new WebSocket("wss://heat.prod.kr/" + CHANNEL_NAME);
    ws.onopen = () => {
        console.log("Connected to GreenHeat!");
    }
    ws.onmessage = async (_message) => {
        let message = JSON.parse(_message.data);
        // transform obs resolution normalized to window by pixel
        message.x *= GLOBAL_SIZE.width;
        message.y *= GLOBAL_SIZE.height;
        message.x -= GLOBAL_TRANSFORM.x;
        message.y -= GLOBAL_TRANSFORM.y;
        message.x *= GLOBAL_TRANSFORM.xscale;
        message.y *= GLOBAL_TRANSFORM.yscale;
        // latency calculation
        message.timeAdjusted = message.time - (LATENCY + message.latency) * 1000;
        // isAnonymous
        message.isAnonymous = message.id.startsWith("A") || message.id.startsWith("U");
        message = await getUser(message);
        if (!message.name) message.name = message.login ?? "";
        if (!message.color) message.color = "white";
        addCursor(message);
        handleMessages(message); // mutex
    }
    ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        setTimeout(initializeWebsocket, 500);
    }
}
let queue = [];
async function handleMessages(message) {
    if (queue.length) { await new Promise(resolve => queue.push(resolve)); queue.splice(0, 1); }
    queue.splice(0, 0, "processing");
    if (ON_MESSAGE[CURRENT_GAME]) await ON_MESSAGE[CURRENT_GAME](message);
    else console.log("Message Recieved:", message);
    queue.splice(0, 1);
    if (queue.length) queue[0](); // resolve next
}

let userCache = {}
async function getUser(data) {
    if (data.isAnonymous) return data;
    if (!userCache[data.id]) userCache[data.id] = (await (await fetch("https://prod.kr/api/twitchprofilefromid?id=" + data.id)).json()).res;
    data = Object.assign(data, userCache[data.id])
    return data;
}