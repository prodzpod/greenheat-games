let CHANNEL_NAME = "";
let CHANNEL_ID = 0;
let GLOBAL_TRANSFORM = {x: 0, y: 0, xscale: 1, yscale: 1};
let GLOBAL_SIZE = {width: 1920, height: 1080};
let WINDOW_SIZE = {width: 1, height: 1};
let LATENCY = 0;
let CURRENT_GAME = "";
let TARGET_FPS = 60;

window.onload = async () => {
    CHANNEL_NAME = window.location.pathname.split("/")[1];
    let CHANNEL = await (await fetch("//prod.kr/api/getid?name=" + CHANNEL_NAME)).json();
    if (CHANNEL) CHANNEL_ID = CHANNEL.id;
    initializeWebsocket();
    initializeRenderer();
    window.onresize();
}

window.onresize = async () => {
    WINDOW_SIZE.width = Math.max(1, window.innerWidth);
    WINDOW_SIZE.height = Math.max(1, window.innerHeight);
    document.getElementById("main").width = WINDOW_SIZE.width;
    document.getElementById("main").height = WINDOW_SIZE.height;
    updateTransform();
    if (ON_RESIZE[CURRENT_GAME]) await ON_RESIZE[CURRENT_GAME]();
}
function updateTransform() {
    function round(n) { return (Math.round(n * 100) / 100).toString(); }
    document.getElementById("settings-transform").innerText = `Transform: P(${round(GLOBAL_TRANSFORM.x)}, ${round(GLOBAL_TRANSFORM.y)}) S(${round(GLOBAL_TRANSFORM.xscale * WINDOW_SIZE.width)}, ${round(GLOBAL_TRANSFORM.yscale * WINDOW_SIZE.height)}) T(${round(LATENCY)})`;
}

// from prodJS: parts that are Very Useful
/**
 * Inserts an Element.
 * @param { string } type - Tag name of the element.
 * @param { string | Element | null } parent - the parent element or its ID.
 * @param { string | string[] | null } classList - list of classes of the element. space-delimited if string.
 * @param { string | null } html - the innerHTML of the element.
 * @returns { Element }
 */
function insertElement(type, parent, classList, html) {
    let el;
    if (parent) {
        if (typeof(parent) == 'string') parent = document.getElementById(parent);
        if (parent && ["SVG", "G"].includes(parent.tagName)) el = document.createElementNS("http://www.w3.org/2000/svg", type);
    }
    if (!el) el = document.createElement(type);
    if (![undefined, null, false].includes(html)) el.innerHTML = html;
    if (classList) {
        if (typeof(classList) == 'string') classList = classList.split(/\s+/g);
        if (classList.length) el.classList.add(...classList);
    } 
    if (parent) parent.appendChild(el);
    return el;
}
/**
 * Applies an attribute to an Element.
 * @param { string } attribute - the name of the attribute.
 * @param { any } value - the value of the attribute.
 * @returns { Element } - returns itself for chaining.
 */
Element.prototype.with = function(attribute, value) {
    this.setAttribute(attribute, value);
    return this;
}

// events
let ON_START = {};
let ON_RESIZE = {};
let ON_MESSAGE = {};
let ON_DRAW = {};
let ON_END = {};