// The record as audio: one buffer = one revolution. The read head moves at the
// record's speed (so a steady spin is a clean nieu), and is gently pulled
// towards where the record actually is (so scratching tracks the hand).
class ScratchProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.channels = null;
        this.pos = 0;         // read head, in samples (unbounded, wraps on read)
        this.rate = 0;        // current speed, 1 = normal, negative = backwards
        this.targetPos = 0;   // record position at targetTime, in samples
        this.targetRate = 0;  // record speed at targetTime
        this.targetTime = 0;
        this.port.onmessage = (e) => {
            if (e.data.channels) this.channels = e.data.channels;
            if (e.data.pos !== undefined) {
                this.targetPos = e.data.pos * sampleRate;
                this.targetRate = e.data.rate;
                this.targetTime = currentTime;
            }
        };
    }

    read(data, p) {
        const len = data.length;
        const i = Math.floor(p);
        const frac = p - i;
        const a = data[((i % len) + len) % len];
        const b = data[(((i + 1) % len) + len) % len];
        return a + (b - a) * frac;
    }

    process(inputs, outputs) {
        const out = outputs[0];
        if (!this.channels) return true;
        const smooth = 1 - Math.exp(-1 / (sampleRate * 0.006)); // ~6ms speed smoothing
        const pull = 1 / (sampleRate * 0.08);                    // drift correction over ~80ms
        for (let i = 0; i < out[0].length; i++) {
            const now = currentTime + i / sampleRate;
            // Where the record is now, extrapolated from the last update - no staircase
            const expected = this.targetPos + this.targetRate * sampleRate * (now - this.targetTime);
            const wanted = this.targetRate + (expected - this.pos) * pull;
            this.rate += (wanted - this.rate) * smooth;
            this.pos += this.rate;
            // A stopped record is silent; fade with speed so there's no DC thump
            const gain = Math.min(1, Math.abs(this.rate) * 3);
            for (let c = 0; c < out.length; c++) {
                const data = this.channels[c] || this.channels[0];
                out[c][i] = this.read(data, this.pos) * gain;
            }
        }
        return true;
    }
}

registerProcessor("scratch", ScratchProcessor);
