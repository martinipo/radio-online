/**
 * Visualizer — Spectrum analyzer with peak decay, drawn on a <canvas>.
 * Requires Web Audio API AnalyserNode.
 */
class Visualizer {
    constructor(canvasId) {
        this.canvas  = document.getElementById(canvasId);
        this.ctx     = this.canvas.getContext('2d');
        this.analyser = null;
        this.animId   = null;
        this.running  = false;
        this._peaks   = [];    // peak height per bar
        this._peakV   = [];    // peak velocity (decay)
    }

    /** Attach/detach the AnalyserNode. Call before start(). */
    setAnalyser(node) {
        this.analyser = node;
        if (node) {
            const bars = this._barCount();
            this._peaks = new Array(bars).fill(0);
            this._peakV = new Array(bars).fill(0);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this._frame();
    }

    stop() {
        this.running = false;
        if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
        this._drawIdle();
    }

    _barCount() {
        const w = this.canvas.width;
        return Math.floor(w / 4); // bar width = 3px, gap = 1px
    }

    _frame() {
        if (!this.running) return;
        this.animId = requestAnimationFrame(() => this._frame());
        this._draw();
    }

    _draw() {
        const { ctx, canvas, analyser } = this;
        const W = canvas.width;
        const H = canvas.height;

        // Background
        ctx.fillStyle = '#000a00';
        ctx.fillRect(0, 0, W, H);

        // Subtle horizontal grid lines
        ctx.fillStyle = '#001500';
        for (let y = H - 4; y > 0; y -= 4) {
            ctx.fillRect(0, y, W, 1);
        }

        if (!analyser) { this._drawIdle(); return; }

        const bins   = analyser.frequencyBinCount;
        const data   = new Uint8Array(bins);
        analyser.getByteFrequencyData(data);

        const bars    = this._barCount();
        const barW    = 3;
        const barGap  = 1;
        const step    = Math.floor(bins / bars * 0.75); // focus on audible range

        for (let i = 0; i < bars; i++) {
            // Sample a small cluster for smoother look
            let sum = 0, count = 0;
            for (let k = 0; k < 3; k++) {
                const idx = Math.min(i * step + k, bins - 1);
                sum += data[idx];
                count++;
            }
            const val  = (sum / count) / 255;
            const barH = Math.ceil(val * (H - 2));
            const x    = i * (barW + barGap);
            const y    = H - barH;

            // Bar gradient: bright green → yellow-green at top
            if (barH > 0) {
                const grad = ctx.createLinearGradient(0, y, 0, H);
                grad.addColorStop(0,   '#aaff44');
                grad.addColorStop(0.3, '#00ff9c');
                grad.addColorStop(1,   '#005535');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, barW, barH);
            }

            // Peak dot
            if (!this._peaks) continue;
            if (barH > this._peaks[i]) {
                this._peaks[i] = barH;
                this._peakV[i] = 0;
            } else {
                this._peakV[i] += 0.4;
                this._peaks[i] -= this._peakV[i];
                if (this._peaks[i] < 0) this._peaks[i] = 0;
            }

            const peakY = H - Math.ceil(this._peaks[i]) - 1;
            if (peakY < H - 1 && peakY >= 0) {
                ctx.fillStyle = '#ccffaa';
                ctx.fillRect(x, peakY, barW, 1);
            }
        }
    }

    _drawIdle() {
        const { ctx, canvas } = this;
        const W = canvas.width;
        const H = canvas.height;
        ctx.fillStyle = '#000a00';
        ctx.fillRect(0, 0, W, H);
        // Dim grid
        ctx.fillStyle = '#001500';
        for (let y = H - 4; y > 0; y -= 4) {
            ctx.fillRect(0, y, W, 1);
        }
        // Flat center line
        ctx.fillStyle = '#003520';
        ctx.fillRect(0, Math.floor(H / 2), W, 1);
    }
}
