/**
 * Track — a single audio entry (local file or remote URL/stream).
 */
class Track {
    constructor({ src, title, artist = '', duration = 0, type = 'file' }) {
        this.id       = Track._uid++;
        this.src      = src;
        this.title    = title || 'Pista desconocida';
        this.artist   = artist;
        this.duration = duration;  // seconds (may be 0 for streams)
        this.type     = type;      // 'file' | 'url' | 'stream'
    }

    get displayTitle() {
        return this.artist ? `${this.artist} - ${this.title}` : this.title;
    }

    get durationStr() {
        const d = this.duration;
        if (!d || !isFinite(d) || isNaN(d)) return '--:--';
        const m = Math.floor(d / 60);
        const s = Math.floor(d % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    get isStream() {
        return this.type === 'stream' || this.type === 'url';
    }
}
Track._uid = 1;


/**
 * Playlist — ordered collection of Tracks with shuffle/repeat support.
 *
 * Events (set as properties):
 *   onTrackChange(track, index)  — fired when currentIndex changes
 *   onChange()                   — fired when track list changes
 */
class Playlist {
    constructor() {
        this.tracks        = [];
        this.currentIndex  = -1;
        this._shuffle      = false;
        this._repeat       = 'none';   // 'none' | 'all' | 'one'
        this._order        = [];       // shuffled play order

        this.onTrackChange = null;
        this.onChange      = null;
    }

    /* ---- State ---- */
    get length()   { return this.tracks.length; }
    get current()  { return this.tracks[this.currentIndex] ?? null; }
    get shuffle()  { return this._shuffle; }
    get repeat()   { return this._repeat; }

    set shuffle(val) {
        this._shuffle = val;
        if (val) this._buildOrder();
    }
    set repeat(val) { this._repeat = val; }

    /* ---- Mutation ---- */
    add(tracks) {
        this.tracks.push(...tracks);
        if (this._shuffle) this._buildOrder();
        this._emit();
    }

    remove(indices) {
        const sorted = [...new Set(indices)].sort((a, b) => b - a);
        for (const i of sorted) {
            if (i === this.currentIndex) this.currentIndex = -1;
            else if (i < this.currentIndex)  this.currentIndex--;
            this.tracks.splice(i, 1);
        }
        if (this._shuffle) this._buildOrder();
        this._emit();
    }

    clear() {
        this.tracks       = [];
        this.currentIndex = -1;
        this._order       = [];
        this._emit();
    }

    updateDuration(index, seconds) {
        if (this.tracks[index]) {
            this.tracks[index].duration = seconds;
            this._emit();
        }
    }

    /* ---- Navigation ---- */
    jumpTo(index) {
        if (index < 0 || index >= this.tracks.length) return false;
        this.currentIndex = index;
        if (this.onTrackChange) this.onTrackChange(this.current, index);
        return true;
    }

    next() {
        if (!this.tracks.length) return false;
        if (this._repeat === 'one') {
            if (this.onTrackChange) this.onTrackChange(this.current, this.currentIndex);
            return true;
        }

        let nextIdx;
        if (this._shuffle && this._order.length) {
            const pos = this._order.indexOf(this.currentIndex);
            const np  = pos + 1;
            if (np >= this._order.length) {
                if (this._repeat !== 'all') return false;
                this._buildOrder();
                nextIdx = this._order[0];
            } else {
                nextIdx = this._order[np];
            }
        } else {
            nextIdx = this.currentIndex + 1;
            if (nextIdx >= this.tracks.length) {
                if (this._repeat !== 'all') return false;
                nextIdx = 0;
            }
        }

        this.currentIndex = nextIdx;
        if (this.onTrackChange) this.onTrackChange(this.current, nextIdx);
        return true;
    }

    prev() {
        if (!this.tracks.length) return false;
        if (this._shuffle && this._order.length) {
            const pos  = this._order.indexOf(this.currentIndex);
            const prev = this._order[(pos - 1 + this._order.length) % this._order.length];
            this.currentIndex = prev;
        } else {
            this.currentIndex = Math.max(0, this.currentIndex - 1);
        }
        if (this.onTrackChange) this.onTrackChange(this.current, this.currentIndex);
        return true;
    }

    /* ---- Persistence ---- */
    toM3U() {
        const lines = ['#EXTM3U'];
        for (const t of this.tracks) {
            lines.push(`#EXTINF:${Math.floor(t.duration || 0)},${t.displayTitle}`);
            lines.push(t.src);
        }
        return lines.join('\n');
    }

    static parseM3U(text) {
        const lines   = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const tracks  = [];
        let pendingTitle = null;
        let pendingDur   = 0;

        for (const line of lines) {
            if (line.startsWith('#EXTINF:')) {
                const m = line.match(/#EXTINF:(-?\d+),(.+)/);
                if (m) { pendingDur = parseInt(m[1]); pendingTitle = m[2].trim(); }
            } else if (!line.startsWith('#')) {
                const isUrl = /^https?:\/\//i.test(line);
                tracks.push(new Track({
                    src:      line,
                    title:    pendingTitle || decodeURIComponent(line.split('/').pop().split('?')[0]) || line,
                    duration: pendingDur > 0 ? pendingDur : 0,
                    type:     isUrl ? 'url' : 'file',
                }));
                pendingTitle = null;
                pendingDur   = 0;
            }
        }
        return tracks;
    }

    /* ---- Private ---- */
    _buildOrder() {
        this._order = Array.from({ length: this.tracks.length }, (_, i) => i);
        for (let i = this._order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._order[i], this._order[j]] = [this._order[j], this._order[i]];
        }
    }

    _emit() {
        if (this.onChange) this.onChange();
    }
}
