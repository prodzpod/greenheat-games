(() => {
// fruit ninja clone - LATENCY calibration recommended first
let LEADERBOARD = {};
ON_START["ninja"] = () => {
    SPRITES = [];
    window.SPRITES = SPRITES;
    LEADERBOARD = {};
    lastPoint = {};
    nextFruit = Date.now();
    lastTick = Date.now();
    FRUIT_TIMELINE = {};
    for (let i = 0; i < 10; i++) addInstance({
        type: "text", id: "leaderboard-" + i, 
        font: "24px sans-serif", align: {x: -1, y: -1}, 
        x: 16, y: 16 * (32 * i),
        text: "", fill: "black"
    });
}
let lastPoint = {};
ON_MESSAGE["ninja"] = (message) => {
    switch (message.type) {
        case "hover": return;
        case "click": lastPoint[message.id] = {x: message.x, y: message.y}; return;
    }
    if (!lastPoint[message.id]) return;
    addInstance({
        type: "polygon", subtype: "line", time: Date.now(), start: 1, end: 0, life: 1,
        outline: message.color, thickness: 4, z: -1,
        points: [{x: lastPoint[message.id].x, y: lastPoint[message.id].y}, {x: message.x, y: message.y}]
    });
    detectSlice(message);
    if (message.type === "release") delete lastPoint[message.id];
    else lastPoint[message.id] = {x: message.x, y: message.y};
}
const FRUITS = [
    { whole: "sprite-apple", half: "sprite-apple_half", color: null, size: 64, point: 1 },
    { whole: "sprite-orange", half: "sprite-orange_half", color: null, size: 64, point: 1 },
    { whole: "sprite-lemon", half: "sprite-lemon_half", color: null, size: 64, point: 1 },
    { whole: "sprite-lime", half: "sprite-lime_half", color: null, size: 64, point: 1 },
    { whole: "sprite-pear", half: "sprite-pear_half", color: null, size: 64, point: 1 },
    { whole: "sprite-watermelon", half: "sprite-watermelon_half", color: null, size: 128, point: 2 },
    { whole: "sprite-pea", half: "sprite-pea_half", color: null, size: 32, point: 5 },
    { whole: "sprite-tire", half: "sprite-tire_half", color: null, size: 64, point: 0 },
    { whole: "sprite-bomb", half: "sprite-bomb_half", color: "red", size: 64, point: -5},
    { whole: "sprite-bomb", half: "sprite-bomb_half", color: "red", size: 64, point: -5},
];
function detectSlice(message) {
    for (const id in FRUIT_TIMELINE) {
        let state = null;
        for (const time in FRUIT_TIMELINE[id]) {
            if (Number(time) > message.timeAdjusted) break;
            state = FRUIT_TIMELINE[id][time];
        }
        if (state === null) continue;
        let status = FRUIT_STATUS[id];
        if (status.collected.includes(message.id)) continue;
        if (pointToSegment(lastPoint[message.id], message, state) > state.r) continue;
        const angle = Math.atan2(lastPoint[message.id].y - message.y, lastPoint[message.id].x - message.x);
        for (const a of [angle, angle + Math.PI]) addInstance({
            type: "image", subtype: "fruithalf", fruit: status.fruit, src: status.fruit.half,
            x: state.x, y: state.y, angle: a,
            width: state.r * 4, height: state.r * 4,
            xspeed: random(-MAX_DISPLACE, MAX_DISPLACE), 
            yspeed: random(-MIN_VELOCITY, -MAX_VELOCITY),
            aspeed: random(-MAX_ROTATION, MAX_ROTATION),
            rspeed: 0,
        });
        const whole = getInstance(id); if (whole) whole.alpha /= 2;
        LEADERBOARD[message.id] ??= { name: message.name === "" ? `Anonymous ${message.id}` : message.name, color: message.color, point: 0 }; LEADERBOARD[message.id].point += status.fruit.point;
        addInstance({
            type: "text", subtype: "line", time: Date.now(), z: 5, start: 1, end: 0, life: 5,
            font: "24px sans-serif", align: {x: 0, y: 0}, fill: message.color,
            x: message.x, y: message.y - 16,
            text: (status.fruit.point >= 0 ? "+" + status.fruit.point : status.fruit.point).toString()
        });
        updateLeaderboard();
        status.collected.push(message.id);
    }
}
function pointToSegment(a, b, p) {
  const length = Math.hypot(a.x - b.x, a.y - b.y);
  if (length == 0.0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (length * length);
  if (t < 0) t = 0; if (t > 1) t = 1;
  const q = {x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)};
  return Math.hypot(p.x - q.x, p.y - q.y);
}
function updateLeaderboard() {
    const leaderboard = Object.values(LEADERBOARD).sort((a, b) => b.point - a.point);
    for (let i = 0; i < Math.min(10, leaderboard.length); i++) {
        const inst = getInstance("leaderboard-" + i);
        inst.text = `${i + 1}: ${leaderboard[i].name} (${leaderboard[i].point})`;
        inst.fill = leaderboard[i].color;
    }
}
let lastTick;
ON_DRAW["ninja"] = (canvas, ctx) => {
    const now = Date.now();
    spawnFruit(now);
    processLineAlpha();
    processPhysics((now - lastTick) / 1000);
    processFruitTimestamp(now);
    draw(ctx);
    lastTick = now;
}
let nextFruit;
const MAX_DISPLACE = 512, MAX_VELOCITY = 1024, MIN_VELOCITY = 512, MAX_ROTATION = 900, MAX_SIZE = 16;
function random(a, b) { return a + (b - a) * Math.random(); }
function spawnFruit(time) {
    if (nextFruit > time) return;
    nextFruit = time + random(250, 2500);
    const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const size = random(fruit.size / 2, fruit.size * 2) * 2;
    const inst = addInstance({
        type: "image", subtype: "fruit", fruit: fruit, src: fruit.whole,
        x: random(0, WINDOW_SIZE.width), y: WINDOW_SIZE.height, angle: random(0, 360),
        width: size, height: size, rspeed: random(-MAX_SIZE, MAX_SIZE),
        xspeed: random(-MAX_DISPLACE, MAX_DISPLACE), 
        yspeed: random(-MIN_VELOCITY, -MAX_VELOCITY),
        aspeed: random(-MAX_ROTATION, MAX_ROTATION)
    });
    FRUIT_TIMELINE[inst.id] = {};
    FRUIT_STATUS[inst.id] = { fruit: fruit, collected: [], prevPoint: {x: inst.x, y: inst.y}, nextLine: time + LINE_EVERY };
}
const GRAVITY = 512;
const LINE_EVERY = 150;
function processPhysics(delta) {
    const now = Date.now();
    for (const id of SPRITES.filter(x => x.subtype === "fruit" || x.subtype === "fruithalf").map(x => x.id)) {
        const sprite = getInstance(id);
        sprite.x += sprite.xspeed * delta;
        sprite.y += sprite.yspeed * delta;
        sprite.width += sprite.rspeed * delta;
        sprite.height += sprite.rspeed * delta;
        sprite.angle += sprite.aspeed * delta;
        sprite.yspeed += GRAVITY * delta;
        if (sprite.subtype === "fruit") {
            const status = FRUIT_STATUS[id];
            if (now >= status.nextLine) {
                addInstance({
                    type: "polygon", subtype: "line", time: now, start: 0.25, end: 0, life: 2,
                    outline: sprite.fruit.color, thickness: sprite.width / 4, z: -2, alpha: 0.1,
                    points: [{x: status.prevPoint.x, y: status.prevPoint.y}, {x: sprite.x, y: sprite.y}]
                });
                status.prevPoint = {x: sprite.x, y: sprite.y};
                status.nextLine = now + LINE_EVERY;
            }
        }
        if (sprite.y > WINDOW_SIZE.height && sprite.yspeed >= 0) deleteInstance(id);
        // else console.log("update: ", sprite);
    }
}
let FRUIT_TIMELINE = {};
let FRUIT_STATUS = {};
const STORE_SECONDS = 30;
function processFruitTimestamp(time) {
    for (const id of SPRITES.filter(x => x.subtype === "fruit").map(x => x.id)) {
        const sprite = getInstance(id);
        FRUIT_TIMELINE[id][time] = {
            x: sprite.x,
            y: sprite.y,
            r: sprite.width / 4
        };
    }
    for (const id of Object.keys(FRUIT_TIMELINE)) {
        const obsolete = Object.keys(FRUIT_TIMELINE[id]).filter(x => (time - Number(x)) >= STORE_SECONDS * 1000);
        for (const x of obsolete) delete FRUIT_TIMELINE[id][x];
        if (Object.keys(FRUIT_TIMELINE[id]).length === 0) {
            delete FRUIT_TIMELINE[id];
            delete FRUIT_STATUS[id];
        }
    }
}
function processLineAlpha() {
    let now = Date.now();
    for (const id of SPRITES.filter(x => x.subtype === "line").map(x => x.id)) {
        const sprite = getInstance(id);
        sprite.alpha = sprite.start + (sprite.end - sprite.start) * ((now - sprite.time) / (sprite.life * 1000));
        if (sprite.alpha <= 0) deleteInstance(id);
    }
}
// more full flesh psuedo game engine example
let SPRITES = [];
/**
 * SPRITE_IMAGE:
 * {
 *     type: "image", id: string,
 *     src: string,
 *     x: number, y: number, angle?: number,
 *     width: number, height: number,
 *     alpha?: number, blend?: color
 * }
 * SPRITE_RECTANGLE:
 * {
 *     type: "rect", id: string,
 *     fill: color, outline: color, thickness: number,
 *     x: number, y: number, angle?: number,
 *     width: number, height: number,
 *     alpha?: number
 * }
 * SPRITE_CIRCLE:
 * {
 *     type: "circle", id: string,
 *     fill: color, outline: color, thickness: number,
 *     x: number, y: number, r: number,
 *     alpha?: number, start: number, end: number
 * }
 * SPRITE_TEXT:
 * {
 *     type: "text", id: string,
 *     font: string, fill: color,
 *     align: { x: -1 | 0 | 1, y: -1 | 0 | 1 }, 
 *     x: number, y: number, width?: number, angle?: number,
 *     text: string,
 *     alpha?: number
 * }
 * SPRITE_POLYGON:
 * {
 *     type: "polygon", id: string,
 *     fill: color, outline: color, thickness: number,
 *     points: [{x: number, y: number}],
 *     alpha?: number
 * }
 */
function getInstance(id) {
    return SPRITES.find(x => x.id === id);
}
function addInstance(instance) {
    instance.id ??= "sprite-" + Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
    instance.z ??= 0;
    instance.alpha ??= 1;
    if (instance.type === "image") instance.blend ??= "white";
    else {
        instance.fill ??= "transparent";
        instance.outline ??= COLORS.text;
        instance.thickness ??= 0;
    }
    instance.angle ??= 0;
    if (instance.type === "circle") {
        instance.start ??= 0;
        instance.end ??= Math.PI * 2;
    }
    for (let i = 0; i < SPRITES.length; i++) {
        if (instance.z >= SPRITES[i].z) continue;
        SPRITES.splice(i, 0, instance);
        return instance;
    }
    SPRITES.push(instance);
    return instance;
}
function deleteInstance(id) {
    const idx = SPRITES.indexOf(getInstance(id));
    if (idx === -1) return null;
    return (SPRITES.splice(idx, 1))[0];
}
function draw(ctx) {
    for (const sprite of SPRITES) {
        if (sprite.alpha <= 0) continue;
        if (sprite.angle) {
            ctx.save();
            let x = sprite.x;
            let y = sprite.y;
            ctx.translate(x, y);
            ctx.rotate((sprite.angle * Math.PI) / 180);
            ctx.translate(-x, -y);
        }
        let filter = "";
        if (sprite.alpha < 1) filter += `opacity(${sprite.alpha * 100}%) `;
        if (sprite.type === "image" && sprite.blend !== "white") filter += rgbToFilter(sprite.blend);
        if (filter !== "") ctx.filter = filter;
        else ctx.filter = "none";
        switch (sprite.type) {
            case "image":
                ctx.drawImage(getSprite(sprite.src), sprite.x - (sprite.width / 2), sprite.y - (sprite.height / 2), sprite.width, sprite.height);
                break;
            case "rect":
                ctx.fillStyle = sprite.fill;
                ctx.strokeStyle = sprite.outline;
                ctx.lineWidth = sprite.thickness;
                ctx.beginPath();
                ctx.rect(sprite.x - (sprite.width / 2), sprite.y - (sprite.height / 2), sprite.width, sprite.height);
                if (sprite.fill !== "transparent") ctx.fill();
                if (sprite.thickness > 0 && sprite.outline !== "transparent") ctx.stroke();
                break;
            case "circle":
                ctx.fillStyle = sprite.fill;
                ctx.strokeStyle = sprite.outline;
                ctx.lineWidth = sprite.thickness;
                ctx.beginPath();
                ctx.arc(sprite.x, sprite.y, sprite.r, sprite.start, sprite.end);
                if (sprite.fill !== "transparent") ctx.fill();
                if (sprite.thickness > 0 && sprite.outline !== "transparent") ctx.stroke();
                break;
            case "text":
                ctx.font = sprite.font;
                ctx.fillStyle = sprite.fill;
                ctx.textAlign = ["left", "center", "right"][sprite.align.x + 1];
                ctx.textBaseline = ["top", "middle", "bottom"][sprite.align.y + 1];
                ctx.fillText(sprite.text, sprite.x, sprite.y, sprite.width);
                break;
            case "polygon":
                if (!sprite.points.length) break;
                if (sprite.thickness > 0 && sprite.outline !== "transparent") {
                    ctx.fillStyle = sprite.outline;
                    ctx.strokeStyle = "transparent";
                    ctx.beginPath();
                    ctx.arc(sprite.points[0].x, sprite.points[0].y, sprite.thickness / 2, 0, Math.PI * 2);
                    ctx.arc(sprite.points.at(-1).x, sprite.points.at(-1).y, sprite.thickness / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (sprite.points.length === 1) break;
                ctx.fillStyle = sprite.fill;
                ctx.strokeStyle = sprite.outline;
                ctx.lineWidth = sprite.thickness;
                ctx.beginPath();
                ctx.moveTo(sprite.points[0].x, sprite.points[0].y);
                for (const point of sprite.points) ctx.lineTo(point.x, point.y);
                if (sprite.fill !== "transparent") ctx.fill();
                if (sprite.thickness > 0 && sprite.outline !== "transparent") ctx.stroke();
                break;
        }
        if (sprite.angle) ctx.restore();
    }
    ctx.filter = "none";
}
})(); // ftr this is how you namespace in JS