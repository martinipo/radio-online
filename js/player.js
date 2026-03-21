/**
 * Player — wraps HTMLAudioElement + Web Audio API.
 *
 * Audio graph: MediaElementSource → AnalyserNode → GainNode → StereoPannerNode → destination
 *
 * Web Audio is initialized lazily on first play() call (browser autoplay policy).
 * If CORS blocks Web Audio access, audio still plays but visualizer gets no data.
 *
 * Callbacks (set as properties):
 *   onTimeUpdate(currentTime, duration)
 *   onEnded()
 *   onError(event)
 *   onLoadStart()
 *   onCanPlay()
 *   onMetadata(duration)
 */
class Player {
    constructor() {
        this.audio      = document.getElementById('audio-el');
        this._audioCtx  = null;
        this._analyser  = null;
        this._gain      = null;
        this._panner    = null;
        this._source    = null;
        this._vol       = 0.8;
        this._pan       = 0;
        this._isStream  = false;

        // Callbacks
        this.onTimeUpdate = null;
        this.onEnded      = null;
        this.onError      = null;
        this.onLoadStart  = null;
        this.onCanPlay    = null;
        this.onMetadata   = null;

        this._bind();
    }

    /* ---- Public API ---- */

    load(track) {
        this._isStream = track.isStream;
        // For CORS-enabled streams, set crossorigin; for local files (blob:) it doesn't matter
        if (track.isStream) {
            this.audio.crossOrigin = 'anonymous';
        } else {
            this.audio.removeAttribute('crossorigin');
        }
        this.audio.src = track.src;
        this.audio.load();
    }

    async play() {
        await this._ensureAudioCtx();
        if (this._audioCtx.state === 'suspended') {
            await this._audioCtx.resume();
        }
        return this.audio.play();
    }

    pause()  { this.audio.pause(); }

    stop() {
        this.audio.pause();
        try { this.audio.currentTime = 0; } catch (_) {}
    }

    seek(seconds) {
        if (isFinite(this.audio.duration)) {
            this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration));
        }
    }

    seekPct(pct) {
        if (isFinite(this.audio.duration)) {
            this.audio.currentTime = Math.max(0, Math.min(1, pct)) * this.audio.duration;
        }
    }

    setVolume(v) {
        this._vol = Math.max(0, Math.min(1, v));
        if (this._gain) this._gain.gain.value = this._vol;
        else            this.audio.volume      = this._vol;
    }

    setBalance(b) {
        this._pan = Math.max(-1, Math.min(1, b));
        if (this._panner) this._panner.pan.value = this._pan;
    }

    /* ---- Getters ---- */
    get currentTime() { return this.audio.currentTime || 0; }
    get duration()    { return this.audio.duration    || 0; }
    get paused()      { return this.audio.paused; }
    get ended()       { return this.audio.ended; }
    get isStream()    { return this._isStream; }
    get analyserNode(){ return this._analyser; }

    /* ---- Private ---- */

    _bind() {
        const a = this.audio;
        a.addEventListener('timeupdate',    () => this.onTimeUpdate?.(this.currentTime, this.duration));
        a.addEventListener('ended',         () => this.onEnded?.());
        a.addEventListener('error',         e  => this.onError?.(e));
        a.addEventListener('loadstart',     () => this.onLoadStart?.());
        a.addEventListener('canplay',       () => this.onCanPlay?.());
        a.addEventListener('loadedmetadata',() => this.onMetadata?.(this.duration));
    }

    async _ensureAudioCtx() {
        if (this._audioCtx) return;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return; // browser doesn't support Web Audio

        this._audioCtx = new Ctx();
        this._analyser = this._audioCtx.createAnalyser();
        this._analyser.fftSize = 512;
        this._analyser.smoothingTimeConstant = 0.75;

        this._gain   = this._audioCtx.createGain();
        this._panner = this._audioCtx.createStereoPanner?.() ??
                       this._audioCtx.createPanner();   // fallback for older browsers

        try {
            this._source = this._audioCtx.createMediaElementSource(this.audio);
            this._source.connect(this._analyser);
            this._analyser.connect(this._gain);
            this._gain.connect(this._panner);
            this._panner.connect(this._audioCtx.destination);
        } catch (err) {
            // CORS or other error — audio still plays via <audio> element natively
            console.warn('Web Audio API graph not connected:', err.message);
            this._analyser = null;
            this._audioCtx.close();
            this._audioCtx = null;
            return;
        }

        // Apply current values
        this._gain.gain.value = this._vol;
        if (this._panner.pan) this._panner.pan.value = this._pan;
    }
}
