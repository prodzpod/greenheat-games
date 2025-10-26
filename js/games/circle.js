(() => {
let POINTS, LEADERBOARD;
ON_START["circle"] = () => {
    POINTS = {};
    LEADERBOARD = {};
}
ON_MESSAGE["circle"] = (message) => {
    if (message.type === "hover") return;
    POINTS[message.id] ??= []; POINTS[message.id].push({ x: message.x, y: message.y });
    if (message.type === "release") {
        if (POINTS[message.id].length <= 1) { delete POINTS[message.id]; return; }
        let percentage = getCircularness(POINTS[message.id]);
        CIRCLES.push({
            name: message.name,
            color: message.color,
            points: POINTS[message.id],
            center: getCenter(POINTS[message.id]),
            percentage: percentage,
            time: Date.now()
        });
        document.getElementById("audio-click").currentTime = 0;
        document.getElementById("audio-click").play();
        if (!LEADERBOARD[message.id] || LEADERBOARD[message.id].percentage < percentage) {
            LEADERBOARD[message.id] = { name: message.name === "" ? `Anonymous ${message.id}` : message.name, color: message.color, percentage: percentage };
            LEADERBOARD_TOP = Object.values(LEADERBOARD).sort((a, b) => b.percentage - a.percentage).slice(0, 10);
        }
        delete POINTS[message.id];
    }
}
// i have no idea how this works (this was written Live on stream) but trust:tm:
const SAMPLE_AMOUNT = 100;
function getCircularness(points) {
    let center = getCenter(points);
    let lengths = points.map((_, i) => getLineLength(points, i));
    let totalLength = lengths.reduce((p, c) => p + c, 0);
    let samples = [];
    let i = 0; let length = 0;
    for (let _ = 0; _ < SAMPLE_AMOUNT; _++) {
        length += totalLength / SAMPLE_AMOUNT;
        while (length >= lengths[i]) {
            length -= lengths[i];
            i += 1;
            if (i >= points.length) break;
        }
        if (i >= points.length) break;
        let t = length / lengths[i];
        let a = points[i]; let b = points[(i + 1) % points.length];
        samples.push(Math.hypot(lerp(a.x, b.x, t) - center.x, lerp(a.y, b.y, t) - center.y));
    }
    let averageDistance = samples.reduce((a, r) => a + r, 0) / samples.length;
    return 100 - (samples.reduce((a, r) => a + Math.abs(r - averageDistance), 0) / samples.length / averageDistance * 100);
}
function lerp(a, b, t) { return a + (b - a) * t; }
function getLineLength(points, i) { return Math.hypot(points[i].x - points[(i + 1) % points.length].x, points[i].y - points[(i + 1) % points.length].y); }
function getCenter(points) {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    return {x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2};
}

let CIRCLES = []; // { points: [{x: number, y: number}], percentage: number, name: string, color: color, time: number };
let LEADERBOARD_TOP = [];
ON_DRAW["circle"] = (canvas, ctx) => {
    let idx = 1;
    for (const entry of LEADERBOARD_TOP) {
        ctx.font = "24px sans-serif"; 
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = entry.color;
        ctx.fillText(`${idx}: ${entry.name} (${round(entry.percentage)}%)`, 16, 32 * idx - 16);
        idx += 1;
    }
    const now = Date.now()
    CIRCLES = CIRCLES.filter(x => now - x.time < 5000);
    for (const circle of CIRCLES) {
        // draw the circle
        ctx.filter = `opacity(${100 - ((now - circle.time) / 50)}%)`;
        ctx.strokeStyle = circle.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(circle.points.at(-1).x, circle.points.at(-1).y);
        for (const p of circle.points) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        // percentage and name
        ctx.font = "24px sans-serif";
        ctx.fillStyle = COLORS.text; 
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${round(circle.percentage)}%`, circle.center.x, circle.center.y - 4);
        ctx.textBaseline = "top";
        ctx.fillText(circle.name, circle.center.x, circle.center.y + 4);
    }
}
function round(n) { return (Math.round(n * 100) / 100).toString(); }
})(); // ftr this is how you namespace in JS