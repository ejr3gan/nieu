const vid = document.getElementById("bgvid");
const stage = document.getElementById("stage");
const splash = document.getElementById("splash");
const word = document.getElementById("word");
const subtitle = document.getElementById("subtitle");
const tallyText = document.getElementById("tally");
const originalLink = document.getElementById("originalLink");
const loopButton = document.getElementById("loop");
const bigButton = document.getElementById("nieu");

const SETUP = "Do I have any choice in this?";

// focus = where to aim object-fit: cover so faces survive the crop
// subs  = [from, to, text] in clip time
const clips = {
    nieu:    { src: "video/nieu.mp4",       rate: 1,   focus: "68% 35%", link: "https://www.youtube.com/watch?v=Ep0z9UiI5io&t=44", subs: [[0, 1.1, "Nieu."]] },
    short:   { src: "video/nooo-short.mp4", rate: 1,   focus: "68% 35%", link: "https://www.youtube.com/watch?v=Ep0z9UiI5io&t=44", subs: [[0, 1.0, SETUP], [1.01, 2.1, "Nieu."]] },
    long:    { src: "video/nooo-long.mp4",  rate: 1,   focus: "50% 40%", link: "https://www.youtube.com/watch?v=faMh6OYfuNE&t=40s", subs: [] },
    bonus:   { src: "video/nooo-bonus.mp4", rate: 1,   focus: "65% 40%", link: "https://www.youtube.com/watch?v=1IZldRSGW50&t=8s", subs: [] },
    extreme: { src: "video/nooo-short.mp4", rate: 2.7, focus: "68% 35%", link: "https://www.youtube.com/watch?v=1IZldRSGW50&t=8s", subs: [[0, 1.0, SETUP], [1.01, 2.1, "Nieu."]] }
};
let current = clips.nieu;
let looping = false;
let stretch = 0;          // extra Es while holding
let subOverride = null;   // Ask the Freeman puts the question here

// Session tally, kept per browser. Storage can be blocked, so it just starts at 0 then.
let tally = 0;
try { tally = Number(localStorage.getItem("nieu-tally")) || 0; } catch (e) {}
function bumpTally() {
    tally++;
    tallyText.textContent = "Refused " + tally + (tally === 1 ? " time" : " times");
    try { localStorage.setItem("nieu-tally", tally); } catch (e) {}
}
if (tally) tallyText.textContent = "Refused " + tally + " times";

// Pitch only bends while stretching; EXTREME stays fast but normal-pitched
function setRate(rate, bendPitch) {
    vid.playbackRate = rate;
    vid.preservesPitch = !bendPitch;
    vid.webkitPreservesPitch = !bendPitch;
}

function load(clip) {
    current = clip;
    for (const chip of document.querySelectorAll("[data-clip]")) {
        chip.setAttribute("aria-pressed", clips[chip.dataset.clip] === clip);
    }
    stage.classList.remove("is-paused");
    vid.style.objectPosition = clip.focus;
    if (!vid.currentSrc.endsWith(clip.src)) vid.src = clip.src;
    vid.currentTime = 0;
    vid.loop = looping;
    // Set the rate every time, so EXTREME never leaks into the other clips
    setRate(clip.rate, false);
    originalLink.href = clip.link;
}

function play(clip) {
    load(clip);
    vid.play().catch(function (err) {
        // A newer clip cut this one off mid-load; that's just someone mashing buttons
        if (err.name !== "AbortError") console.error("Couldn't play " + clip.src + ":", err);
    });
    bumpTally();
}

function nieuify(text) {
    return stretch ? text.replace("Nieu", "Ni" + "e".repeat(1 + stretch) + "u") : text;
}

function setStretch(n) {
    stretch = n;
    word.textContent = "NI" + "E".repeat(1 + n) + "U";
}

// Subtitles follow the video clock
(function renderSubs() {
    let text = subOverride;
    if (text === null) {
        const t = vid.currentTime;
        const cue = current.subs.find(function (c) { return t >= c[0] && t < c[1]; });
        text = cue ? nieuify(cue[2]) : "";
    }
    if (subtitle.textContent !== text) subtitle.textContent = text;
    requestAnimationFrame(renderSubs);
})();

splash.addEventListener("click", unlock);
document.addEventListener("keydown", function (e) {
    if (document.body.contains(splash) && !e.repeat) unlock();
}, { capture: true });

function unlock() {
    if (!document.body.contains(splash)) return;
    splash.remove();
    vid.muted = false;
    play(clips.nieu);
    initDecks(); // audio can only start from a user gesture, and this is the first one
}

for (const chip of document.querySelectorAll("[data-clip]")) {
    chip.addEventListener("click", function () {
        subOverride = null;
        play(clips[chip.dataset.clip]);
    });
}

loopButton.addEventListener("click", function () {
    looping = !looping;
    vid.loop = looping;
    loopButton.setAttribute("aria-pressed", looping);
    if (looping && vid.ended) vid.play();
});

function toggleStage() {
    if (vid.ended) {
        play(current);
    } else if (vid.paused) {
        vid.play();
    } else {
        vid.pause();
    }
}
stage.addEventListener("click", toggleStage);
stage.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleStage();
    }
});
vid.addEventListener("pause", function () { stage.classList.toggle("is-paused", !vid.ended && subOverride === null); });
vid.addEventListener("play", function () { stage.classList.remove("is-paused"); });

// Hold to stretch: the longer you hold, the slower and deeper it gets
let holding = false;
let holdDelay = null;
let holdTimer = null;

function pressStart() {
    if (holding) return;
    holding = true;
    subOverride = null;
    bigButton.classList.add("is-held");
    setStretch(0);
    play(clips.nieu);
    holdDelay = setTimeout(function () {
        holdTimer = setInterval(function () {
            const rate = Math.max(0.3, vid.playbackRate - 0.04);
            setRate(rate, true);
            setStretch(Math.round((1 - rate) / 0.7 * 9));
            if (vid.ended) vid.play();
        }, 60);
    }, 200);
}

function pressEnd() {
    if (!holding) return;
    holding = false;
    clearTimeout(holdDelay);
    clearInterval(holdTimer);
    bigButton.classList.remove("is-held");
    setRate(current.rate, false);
    setStretch(0);
}

bigButton.addEventListener("pointerdown", function (e) {
    bigButton.setPointerCapture(e.pointerId);
    pressStart();
});
bigButton.addEventListener("pointerup", pressEnd);
bigButton.addEventListener("pointercancel", pressEnd);
bigButton.addEventListener("contextmenu", function (e) { e.preventDefault(); });
bigButton.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
        e.preventDefault();
        pressStart();
    }
});
bigButton.addEventListener("keyup", function (e) {
    if (e.key === "Enter" || e.key === " ") pressEnd();
});

document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() !== "n" || e.repeat || e.target.matches("input, textarea")) return;
    pressStart();
});
document.addEventListener("keyup", function (e) {
    if (e.key.toLowerCase() === "n") pressEnd();
});

// Ask the Freeman: your question becomes the setup line, he gives the only answer he has
const askForm = document.getElementById("ask");
const questionInput = document.getElementById("question");
const answer = document.getElementById("answer");
const verdicts = [
    "The Freeman has considered your request.",
    "The Freeman has consulted the council.",
    "The Freeman has checked the roadmap.",
    "The Freeman ran it past legal.",
    "The Freeman slept on it."
];
let askTimer = null;

askForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const question = questionInput.value.trim();
    if (!question) return;
    questionInput.blur(); // drop the phone keyboard so the video is visible
    if (window.matchMedia("(max-width: 899px)").matches) {
        stage.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    clearTimeout(askTimer);
    load(clips.nieu);
    vid.pause();
    subOverride = "“" + question + "”";
    answer.textContent = "The Freeman is thinking…";
    askTimer = setTimeout(function () {
        subOverride = null;
        play(clips.nieu);
        answer.textContent = verdicts[Math.floor(Math.random() * verdicts.length)] + " NIEU.";
        questionInput.value = "";
    }, 1600);
});

// The decks: the record's angle *is* the playhead, so dragging it scratches
const record = document.getElementById("record");
const motorButton = document.getElementById("motor");
const deckError = document.getElementById("deckError");
const REV_SECONDS = 1.8;  // one turn at 33 1/3 rpm
let audioCtx = null;
let scratchNode = null;
let decksReady = null;
let angle = 0;            // degrees, unbounded
let motorOn = false;
let motorSpeed = 0;       // eases between 0 and 1 like a real platter
let scratching = false;
let lastPointerAngle = 0;

function initDecks() {
    if (decksReady) return decksReady;
    decksReady = (async function () {
        audioCtx = new AudioContext();
        await audioCtx.audioWorklet.addModule("js/scratch-worklet.js");
        const res = await fetch(clips.nieu.src);
        if (!res.ok) throw new Error("couldn't fetch the nieu (" + res.status + ")");
        const buffer = await audioCtx.decodeAudioData(await res.arrayBuffer());
        scratchNode = new AudioWorkletNode(audioCtx, "scratch", { outputChannelCount: [2] });
        // Press the record: one nieu per revolution, then silence until the label comes round again
        const length = Math.round(REV_SECONDS * buffer.sampleRate);
        const channels = [];
        for (let c = 0; c < buffer.numberOfChannels; c++) {
            const groove = new Float32Array(length);
            groove.set(buffer.getChannelData(c).subarray(0, length));
            channels.push(groove);
        }
        scratchNode.port.postMessage({ channels: channels });
        scratchNode.connect(audioCtx.destination);
    })().catch(function (err) {
        deckError.hidden = false;
        deckError.textContent = location.protocol === "file:"
            ? "The decks need a web server: browsers block audio worklets on file:// pages. Run “npx serve” in the repo, or use the live site."
            : "The decks are broken: " + err.message;
        throw err;
    });
    return decksReady;
}

function pointerAngle(e) {
    const r = record.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
}

record.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    record.setPointerCapture(e.pointerId);
    initDecks();
    if (audioCtx) audioCtx.resume();
    scratching = true;
    lastPointerAngle = pointerAngle(e);
    record.classList.add("is-scratching");
    // Hijack the video so his face scrubs along with the record
    if (current !== clips.nieu) load(clips.nieu);
    vid.pause();
    subOverride = "N-n-n-nieu.";
    bumpTally();
});

record.addEventListener("pointermove", function (e) {
    if (!scratching) return;
    const a = pointerAngle(e);
    let delta = a - lastPointerAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    angle += delta;
    lastPointerAngle = a;
});

function endScratch() {
    if (!scratching) return;
    scratching = false;
    record.classList.remove("is-scratching");
    subOverride = null;
}
record.addEventListener("pointerup", endScratch);
record.addEventListener("pointercancel", endScratch);

// Arrow keys nudge the record, for keyboard DJs
record.addEventListener("keydown", function (e) {
    const step = { ArrowLeft: -25, ArrowDown: -25, ArrowRight: 25, ArrowUp: 25 }[e.key];
    if (!step) return;
    e.preventDefault();
    initDecks();
    if (audioCtx) audioCtx.resume();
    angle += step;
});

motorButton.addEventListener("click", function () {
    initDecks();
    if (audioCtx) audioCtx.resume();
    motorOn = !motorOn;
    motorButton.setAttribute("aria-pressed", motorOn);
    motorButton.innerHTML = motorOn ? "&#9632; Stop" : "&#9654; Start";
    record.closest(".deck").classList.toggle("is-spinning", motorOn);
});

let lastFrame = performance.now();
let lastAngle = 0;
let handRate = 0;
(function spin(now) {
    const dt = Math.max(0.001, Math.min(0.1, (now - lastFrame) / 1000));
    lastFrame = now;
    motorSpeed += ((motorOn ? 1 : 0) - motorSpeed) * Math.min(1, dt * 4);
    let rate;
    if (scratching) {
        // Pointer events are lumpy, so smooth the hand's speed a little
        const raw = (angle - lastAngle) / 360 * REV_SECONDS / dt;
        handRate += (raw - handRate) * 0.5;
        rate = handRate;
    } else {
        angle += motorSpeed * dt * 360 / REV_SECONDS;
        rate = handRate = motorSpeed;
    }
    lastAngle = angle;
    record.style.transform = "rotate(" + angle + "deg)";
    const seconds = angle / 360 * REV_SECONDS;
    if (scratchNode) scratchNode.port.postMessage({ pos: seconds, rate: rate });
    if (scratching && !vid.seeking && vid.duration) {
        const groove = ((seconds % REV_SECONDS) + REV_SECONDS) % REV_SECONDS;
        vid.currentTime = Math.min(groove, vid.duration - 0.05);
    }
    requestAnimationFrame(spin);
})(lastFrame);

// Ewok easter egg
const ewok = document.getElementById("ewok");
document.getElementById("myImg").addEventListener("click", function () {
    ewok.showModal();
});
ewok.querySelector(".close").addEventListener("click", function () {
    ewok.close();
});
ewok.addEventListener("click", function (e) {
    if (e.target === ewok) ewok.close();
});
