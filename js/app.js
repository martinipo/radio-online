/**
 * app.js — Main application orchestrator.
 * Wires together Player, Playlist, Visualizer and all UI interactions.
 *
 * Keyboard shortcuts:
 *   Space        Play / Pause
 *   S            Stop
 *   Z / Alt+←   Previous
 *   B / Alt+→   Next
 *   ←/→ (5s)    Seek back/forward
 *   ↑/↓          Volume up/down
 *   R            Cycle repeat
 *   Shift+Z      Toggle shuffle
 *   L            Open URL dialog
 */
(function () {
'use strict';

/* ===================== SETUP ===================== */

const player     = new Player();
const playlist   = new Playlist();
const visualizer = new Visualizer('visualizer');

visualizer.start();

const $ = id => document.getElementById(id);

const UI = {
    /* Display */
    songTitle:      $('song-title'),
    timeDisplay:    $('time-display'),
    timeSign:       $('time-sign'),
    statKbps:       $('stat-kbps'),
    statKhz:        $('stat-khz'),
    statCh:         $('stat-ch'),
    /* Seekbar */
    seekTrack:      $('seekbar-track'),
    seekFill:       $('seekbar-fill'),
    seekThumb:      $('seekbar-thumb'),
    /* Sliders */
    volume:         $('volume'),
    balance:        $('balance'),
    /* Transport */
    btnPlay:        $('btn-play'),
    btnPause:       $('btn-pause'),
    btnStop:        $('btn-stop'),
    btnPrev:        $('btn-prev'),
    btnNext:        $('btn-next'),
    btnEject:       $('btn-eject'),
    /* Toggles */
    btnShuffle:     $('btn-shuffle'),
    btnRepeat:      $('btn-repeat'),
    cbEq:           $('cb-eq'),
    cbPl:           $('cb-pl'),
    /* Windows */
    playerWin:      $('player-window'),
    playlistWin:    $('playlist-window'),
    /* Playlist */
    plList:         $('pl-list'),
    plEmpty:        $('pl-empty'),
    plCount:        $('pl-count'),
    plBody:         $('pl-body'),
    plAddFiles:     $('pl-add-files'),
    plAddFolder:    $('pl-add-folder'),
    plAddUrl:       $('pl-add-url'),
    plRemoveSel:    $('pl-remove-sel'),
    plClear:        $('pl-clear'),
    plSave:         $('pl-save'),
    plLoadCl:       $('pl-load-cl'),
    plFilterFav:    $('pl-filter-fav'),
    plLoadMy:       $('pl-load-my'),
    /* URL dialog */
    urlDialog:      $('url-dialog'),
    urlTextarea:    $('url-textarea'),
    urlName:        $('url-name'),
    urlSaveBtn:     $('url-save-btn'),
    urlSavedSection:$('url-saved-section'),
    urlSavedList:   $('url-saved-list'),
    urlAdd:         $('url-add'),
    urlCancel:      $('url-cancel'),
    urlClose:       $('url-close'),
    /* File inputs */
    fileInput:      $('file-input'),
    folderInput:    $('folder-input'),
    /* Title close */
    btnClosePlayer: $('btn-close-player'),
    btnClosePl:     $('btn-close-pl'),
    btnMinimize:    $('btn-minimize'),
};

/* App state */
const state = {
    playing:       false,
    timeMode:      '+',      // '+' elapsed  '−' remaining
    seekDragging:  false,
    selected:      new Set(),
    scrollTimer:   null,
    showFavOnly:   false,
};

/* Saved radios — persisted in localStorage */
const savedRadios = {
    _key: 'winamp_saved_radios',
    _list: JSON.parse(localStorage.getItem('winamp_saved_radios') || '[]'),
    save(name, url) {
        this._list.push({ name, url });
        this._persist();
    },
    remove(idx) {
        this._list.splice(idx, 1);
        this._persist();
    },
    _persist() {
        localStorage.setItem(this._key, JSON.stringify(this._list));
    },
    all() { return this._list; },
};

/* Favorites — persisted in localStorage by track.src */
const favorites = {
    _key: 'winamp_favorites',
    _set: new Set(JSON.parse(localStorage.getItem('winamp_favorites') || '[]')),
    has(src)    { return this._set.has(src); },
    toggle(src) {
        this._set.has(src) ? this._set.delete(src) : this._set.add(src);
        localStorage.setItem(this._key, JSON.stringify([...this._set]));
    },
    all()       { return this._set; },
};


/* ===================== PLAYER CALLBACKS ===================== */

player.onTimeUpdate = (cur, dur) => {
    if (!state.seekDragging) syncSeekbar(cur, dur);
    syncTimeDisplay(cur, dur);
};

player.onEnded = () => {
    if (!playlist.next()) {
        state.playing = false;
        syncPlayState();
        syncTimeDisplay(0, 0);
    }
};

player.onError = () => {
    // Try to advance to next track after a brief delay
    setTimeout(() => {
        if (!playlist.next()) {
            state.playing = false;
            syncPlayState();
            setTitle('Error — no se pudo reproducir la pista');
        }
    }, 800);
};

player.onLoadStart = () => setTitle('Cargando...');

player.onCanPlay = () => {
    if (state.playing) player.play().catch(() => {});
};

player.onMetadata = dur => {
    playlist.updateDuration(playlist.currentIndex, dur);
    // Show kbps if available (HTMLAudioElement doesn't expose it, so we leave as is)
};


/* ===================== PLAYLIST CALLBACKS ===================== */

playlist.onTrackChange = (track, idx) => loadAndPlay(track, idx);
playlist.onChange      = () => { renderPlaylist(); syncCount(); };


/* ===================== TRANSPORT ===================== */

UI.btnPlay.addEventListener('click', () => {
    if (state.playing) return;
    if (!playlist.current && playlist.length > 0) { playlist.jumpTo(0); return; }
    if (playlist.current) {
        state.playing = true;
        player.play().catch(() => { state.playing = false; syncPlayState(); });
        syncPlayState();
        visualizer.setAnalyser(player.analyserNode);
    }
});

UI.btnPause.addEventListener('click', () => {
    if (!playlist.current) return;
    if (state.playing) {
        player.pause();
        state.playing = false;
    } else {
        state.playing = true;
        player.play().catch(() => { state.playing = false; });
    }
    syncPlayState();
});

UI.btnStop.addEventListener('click', () => {
    player.stop();
    state.playing = false;
    syncPlayState();
    syncSeekbar(0, 0);
    syncTimeDisplay(0, 0);
});

UI.btnPrev.addEventListener('click', () => {
    if (player.currentTime > 3) player.seek(0);
    else playlist.prev();
});

UI.btnNext.addEventListener('click', () => playlist.next());

UI.btnEject.addEventListener('click', () => UI.fileInput.click());


/* ===================== SHUFFLE / REPEAT ===================== */

UI.btnShuffle.addEventListener('click', () => {
    playlist.shuffle = !playlist.shuffle;
    UI.btnShuffle.classList.toggle('active', playlist.shuffle);
});

const REPEAT_CYCLE = ['none', 'all', 'one'];
const REPEAT_LABEL = { none: 'REP', all: 'REP ALL', one: 'REP 1' };
UI.btnRepeat.addEventListener('click', () => {
    const i = REPEAT_CYCLE.indexOf(playlist.repeat);
    playlist.repeat = REPEAT_CYCLE[(i + 1) % REPEAT_CYCLE.length];
    UI.btnRepeat.classList.toggle('active', playlist.repeat !== 'none');
    UI.btnRepeat.textContent = REPEAT_LABEL[playlist.repeat];
});


/* ===================== VOLUME & BALANCE ===================== */

UI.volume.addEventListener('input', () => player.setVolume(UI.volume.value / 100));
UI.balance.addEventListener('input', () => player.setBalance(UI.balance.value / 100));


/* ===================== SEEKBAR ===================== */

UI.seekTrack.addEventListener('mousedown', e => {
    if (UI.seekTrack.classList.contains('disabled')) return;
    state.seekDragging = true;
    applySeek(e);
});
document.addEventListener('mousemove', e => { if (state.seekDragging) applySeek(e); });
document.addEventListener('mouseup',   e => {
    if (!state.seekDragging) return;
    state.seekDragging = false;
    const rect = UI.seekTrack.getBoundingClientRect();
    const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    player.seekPct(pct);
});

function applySeek(e) {
    const rect = UI.seekTrack.getBoundingClientRect();
    const pct  = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setSeekbarPct(pct);
}


/* ===================== TIME SIGN (toggle elapsed/remaining) ===================== */

UI.timeSign.addEventListener('click', () => {
    state.timeMode = state.timeMode === '+' ? '−' : '+';
    UI.timeSign.classList.toggle('minus', state.timeMode === '−');
});


/* ===================== EQ / PL TOGGLES ===================== */

UI.cbPl.addEventListener('click', () => {
    const shown = UI.playlistWin.style.display !== 'none';
    UI.playlistWin.style.display = shown ? 'none' : 'block';
    UI.cbPl.classList.toggle('active', !shown);
});

UI.cbEq.addEventListener('click', () => {
    // EQ not implemented — just flash the button
    UI.cbEq.classList.add('active');
    setTimeout(() => UI.cbEq.classList.remove('active'), 200);
});


/* ===================== PLAYLIST BUTTONS ===================== */

UI.plAddFiles.addEventListener('click', () => UI.fileInput.click());
UI.plAddFolder.addEventListener('click', () => UI.folderInput.click());
UI.plAddUrl.addEventListener('click', openUrlDialog);

UI.plRemoveSel.addEventListener('click', () => {
    if (!state.selected.size) return;
    playlist.remove([...state.selected]);
    state.selected.clear();
});

UI.plClear.addEventListener('click', () => {
    if (!playlist.length) return;
    player.stop();
    state.playing = false;
    state.selected.clear();
    playlist.clear();
    setTitle('No hay pista cargada');
    syncPlayState();
    syncSeekbar(0, 0);
    syncTimeDisplay(0, 0);
    UI.statKbps.textContent = '---';
    UI.statKhz.textContent  = '--';
    UI.statCh.textContent   = 'stereo';
});

$('pl-filter-fav').addEventListener('click', () => {
    state.showFavOnly = !state.showFavOnly;
    $('pl-filter-fav').classList.toggle('active', state.showFavOnly);
    renderPlaylist();
});

$('pl-load-cl').addEventListener('click', () => {
    const tracks = RADIOS_CHILE.map(r => new Track(r));
    if (playlist.length > 0) {
        const replace = confirm(
            `¿Reemplazar la lista actual con las ${tracks.length} radios chilenas?\n` +
            'Cancelar = agregar al final de la lista actual.'
        );
        if (replace) {
            player.stop();
            state.playing = false;
            state.selected.clear();
            playlist.clear();
            setTitle('No hay pista cargada');
            syncPlayState();
            syncSeekbar(0, 0);
            syncTimeDisplay(0, 0);
        }
    }
    playlist.add(tracks);
    if (!playlist.current) playlist.jumpTo(0);
});

UI.plLoadMy.addEventListener('click', () => {
    const list = savedRadios.all();
    if (!list.length) { alert('No tienes radios guardadas.\nUsa el botón +URL para guardar una.'); return; }
    const tracks = list.map(r => new Track({ src: r.url, title: r.name, type: 'url' }));
    if (playlist.length > 0) {
        const replace = confirm(
            `¿Reemplazar la lista actual con tus ${tracks.length} radios guardadas?\n` +
            'Cancelar = agregar al final de la lista actual.'
        );
        if (replace) {
            player.stop();
            state.playing = false;
            state.selected.clear();
            playlist.clear();
            setTitle('No hay pista cargada');
            syncPlayState();
            syncSeekbar(0, 0);
            syncTimeDisplay(0, 0);
        }
    }
    playlist.add(tracks);
    if (!playlist.current) playlist.jumpTo(0);
});

UI.plSave.addEventListener('click', () => {
    if (!playlist.length) return;
    const blob = new Blob([playlist.toM3U()], { type: 'audio/x-mpegurl' });
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(blob),
        download: 'playlist.m3u',
    });
    a.click();
    URL.revokeObjectURL(a.href);
});


/* ===================== FILE INPUTS ===================== */

UI.fileInput.addEventListener('change', e => {
    handleFiles([...e.target.files]);
    e.target.value = '';
});
UI.folderInput.addEventListener('change', e => {
    handleFiles([...e.target.files]);
    e.target.value = '';
});


/* ===================== DRAG & DROP ===================== */

['dragover', 'dragenter'].forEach(ev =>
    UI.plBody.addEventListener(ev, e => { e.preventDefault(); UI.plBody.classList.add('drag-over'); })
);
UI.plBody.addEventListener('dragleave', e => {
    if (!UI.plBody.contains(e.relatedTarget)) UI.plBody.classList.remove('drag-over');
});
UI.plBody.addEventListener('drop', e => {
    e.preventDefault();
    UI.plBody.classList.remove('drag-over');
    handleFiles([...e.dataTransfer.files]);
});

// Allow drop on main player window too
document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', e => {
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    if (files.length) handleFiles(files);
});


/* ===================== CLOSE / MINIMIZE ===================== */

UI.btnClosePlayer.addEventListener('click', () => UI.playerWin.style.display = 'none');
UI.btnClosePl.addEventListener('click',     () => {
    UI.playlistWin.style.display = 'none';
    UI.cbPl.classList.remove('active');
});
UI.btnMinimize.addEventListener('click', () => {
    // Re-show if hidden; effectively un-minimize by clicking again
    UI.playerWin.style.opacity = UI.playerWin.style.opacity === '0.3' ? '1' : '0.3';
});


/* ===================== URL DIALOG ===================== */

function openUrlDialog() {
    UI.urlDialog.classList.remove('hidden');
    renderSavedRadios();
    UI.urlTextarea.focus();
}
function closeUrlDialog() {
    UI.urlDialog.classList.add('hidden');
    UI.urlTextarea.value = '';
    UI.urlName.value = '';
}

function renderSavedRadios() {
    const list = savedRadios.all();
    if (!list.length) {
        UI.urlSavedSection.style.display = 'none';
        return;
    }
    UI.urlSavedSection.style.display = 'block';
    UI.urlSavedList.innerHTML = list.map((r, i) =>
        `<div class="saved-radio-item">
            <span class="saved-radio-name" title="${escHtml(r.url)}">${escHtml(r.name)}</span>
            <button class="saved-radio-add" data-i="${i}" title="Agregar a playlist">▶</button>
            <button class="saved-radio-del" data-i="${i}" title="Eliminar">✕</button>
        </div>`
    ).join('');

    UI.urlSavedList.querySelectorAll('.saved-radio-add').forEach(btn => {
        btn.addEventListener('click', () => {
            const r = savedRadios.all()[+btn.dataset.i];
            const wasEmpty = !playlist.length;
            playlist.add([new Track({ src: r.url, title: r.name, type: 'url' })]);
            if (wasEmpty) playlist.jumpTo(0);
            closeUrlDialog();
        });
    });
    UI.urlSavedList.querySelectorAll('.saved-radio-del').forEach(btn => {
        btn.addEventListener('click', () => {
            savedRadios.remove(+btn.dataset.i);
            renderSavedRadios();
        });
    });
}

UI.urlAdd.addEventListener('click', () => {
    const lines = UI.urlTextarea.value.split('\n')
        .map(l => l.trim())
        .filter(l => l && /^https?:\/\//i.test(l));

    if (!lines.length) { alert('Ingresa al menos una URL válida (http:// o https://)'); return; }

    const wasEmpty = !playlist.length;
    const tracks = lines.map(url => {
        const name = decodeURIComponent(url.split('/').pop().split('?')[0]) || url;
        return new Track({ src: url, title: name, type: 'url' });
    });
    playlist.add(tracks);
    if (wasEmpty) playlist.jumpTo(0);
    closeUrlDialog();
});

UI.urlSaveBtn.addEventListener('click', () => {
    const url = UI.urlTextarea.value.split('\n').map(l => l.trim()).find(l => /^https?:\/\//i.test(l));
    if (!url) { alert('Ingresa una URL válida (http:// o https://) para guardar'); return; }
    const name = UI.urlName.value.trim() || decodeURIComponent(url.split('/').pop().split('?')[0]) || url;
    savedRadios.save(name, url);
    UI.urlName.value = '';
    renderSavedRadios();
});

UI.urlCancel.addEventListener('click', closeUrlDialog);
UI.urlClose.addEventListener('click',  closeUrlDialog);
UI.urlDialog.addEventListener('click', e => { if (e.target === UI.urlDialog) closeUrlDialog(); });

// Submit on Ctrl+Enter inside textarea
UI.urlTextarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) UI.urlAdd.click();
});


/* ===================== FILE HANDLING ===================== */

async function handleFiles(files) {
    const AUDIO_EXT = new Set(['mp3','flac','ogg','wav','aac','m4a','opus','wma','mp4','webm']);
    const M3U_EXT   = new Set(['m3u','m3u8','pls']);

    const audio = [];
    const playlists = [];

    for (const f of files) {
        const ext = f.name.split('.').pop().toLowerCase();
        if (M3U_EXT.has(ext)) playlists.push(f);
        else if (f.type.startsWith('audio/') || f.type.startsWith('video/') || AUDIO_EXT.has(ext)) audio.push(f);
    }

    // Parse playlist files first
    for (const f of playlists) {
        const text   = await f.text();
        const tracks = Playlist.parseM3U(text);
        if (tracks.length) playlist.add(tracks);
    }

    // Add audio files
    if (audio.length) {
        audio.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const wasEmpty = !playlist.length;
        const tracks = audio.map(f => {
            const blobUrl  = URL.createObjectURL(f);
            const base     = f.name.replace(/\.[^.]+$/, '');
            const dashIdx  = base.indexOf(' - ');
            const artist   = dashIdx > 0 ? base.slice(0, dashIdx).trim() : '';
            const title    = dashIdx > 0 ? base.slice(dashIdx + 3).trim() : base;
            return new Track({ src: blobUrl, title, artist, type: 'file' });
        });

        playlist.add(tracks);
        if (wasEmpty && playlist.length) playlist.jumpTo(0);
    }
}


/* ===================== PLAY A TRACK ===================== */

function loadAndPlay(track, idx) {
    if (!track) return;

    player.load(track);
    state.playing = true;
    player.play().catch(err => {
        // play() may reject until canplay fires — that's OK, onCanPlay will retry
        if (err.name !== 'AbortError') console.warn('play():', err.message);
    });

    const isStream = track.isStream;
    setTitle(track.displayTitle, isStream);
    UI.seekTrack.classList.toggle('disabled', isStream);
    UI.statKbps.textContent = isStream ? 'LIVE' : '---';
    UI.statKhz.textContent  = '44';
    UI.statCh.textContent   = 'stereo';

    syncPlayState();
    syncSeekbar(0, 0);
    renderPlaylist();
    visualizer.setAnalyser(player.analyserNode);
    visualizer.start();
}


/* ===================== RENDER PLAYLIST ===================== */

function renderPlaylist() {
    const { tracks, currentIndex } = playlist;

    // En modo favoritos solo mostramos las pistas marcadas
    const visible = state.showFavOnly
        ? tracks.map((t, i) => ({ t, i })).filter(({ t }) => favorites.has(t.src))
        : tracks.map((t, i) => ({ t, i }));

    if (!visible.length) {
        UI.plList.innerHTML = '';
        UI.plEmpty.style.display = 'block';
        UI.plEmpty.textContent = state.showFavOnly
            ? 'No hay favoritos aún\nClic en ★ para agregar'
            : 'Arrastra archivos de audio aquí\no usa los botones de abajo';
        return;
    }
    UI.plEmpty.style.display = 'none';

    UI.plList.innerHTML = visible.map(({ t, i }) => {
        const isFav = favorites.has(t.src);
        const cls = ['pl-item',
            i === currentIndex      ? 'active'   : '',
            state.selected.has(i)   ? 'selected' : '',
            isFav                   ? 'fav'      : '',
        ].join(' ').trim();

        return `<div class="${cls}" data-i="${i}">
            <button class="fav-btn${isFav ? ' is-fav' : ''}" data-src="${escHtml(t.src)}" title="Favorito">★</button>
            <span class="pl-num">${i + 1}.</span>
            <span class="pl-name">${escHtml(t.displayTitle)}</span>
            <span class="pl-dur">${t.durationStr}</span>
        </div>`;
    }).join('');

    // Events
    UI.plList.querySelectorAll('.pl-item').forEach(el => {
        const i = parseInt(el.dataset.i, 10);

        // Botón estrella — no propaga al clic de la fila
        el.querySelector('.fav-btn').addEventListener('click', e => {
            e.stopPropagation();
            const src = e.currentTarget.dataset.src;
            favorites.toggle(src);
            renderPlaylist();
        });

        el.addEventListener('click', e => {
            if (e.ctrlKey || e.metaKey) {
                state.selected.has(i) ? state.selected.delete(i) : state.selected.add(i);
                renderPlaylist();
            } else if (e.shiftKey && state.selected.size) {
                const anchor = Math.max(...state.selected);
                const [lo, hi] = [Math.min(anchor, i), Math.max(anchor, i)];
                state.selected.clear();
                for (let k = lo; k <= hi; k++) state.selected.add(k);
                renderPlaylist();
            } else {
                state.selected.clear();
                state.selected.add(i);
                playlist.jumpTo(i);
            }
        });
    });

    // Keep active item visible
    const active = UI.plList.querySelector('.pl-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
}


/* ===================== UI SYNC HELPERS ===================== */

function syncPlayState() {
    UI.btnPlay.style.opacity  = state.playing ? '0.5' : '1';
    UI.btnPause.style.opacity = (!state.playing && playlist.current) ? '0.5' : '1';
    if (!state.playing) visualizer.stop();
    else                visualizer.start();
}

function syncSeekbar(cur, dur) {
    const pct = (dur && isFinite(dur)) ? cur / dur : 0;
    setSeekbarPct(pct);
}

function setSeekbarPct(pct) {
    const p = clamp(pct, 0, 1) * 100;
    UI.seekFill.style.width  = p + '%';
    UI.seekThumb.style.left  = p + '%';
}

function syncTimeDisplay(cur, dur) {
    let t = state.timeMode === '+' ? cur : Math.max(0, dur - cur);
    UI.timeDisplay.textContent = fmtTime(t);
}

function syncCount() {
    const n = playlist.length;
    UI.plCount.textContent = `${n} ${n === 1 ? 'pista' : 'pistas'}`;
}

/* Title marquee scroll */
function setTitle(text, isStream = false) {
    clearInterval(state.scrollTimer);
    state.scrollTimer = null;

    let display = text;
    if (isStream) display = '⬤ ' + text;

    UI.songTitle.style.transform = 'translateX(0)';
    UI.songTitle.textContent = display + '    ';

    // Start scroll after a short delay so the title is readable first
    setTimeout(() => {
        const wrap  = UI.songTitle.parentElement;
        const titleW = UI.songTitle.scrollWidth;
        const wrapW  = wrap.offsetWidth;
        if (titleW <= wrapW) return;

        let x = 0;
        state.scrollTimer = setInterval(() => {
            x -= 1;
            if (x < -(titleW - wrapW + 20)) x = wrapW;
            UI.songTitle.style.transform = `translateX(${x}px)`;
        }, 35);
    }, 2500);
}


/* ===================== KEYBOARD SHORTCUTS ===================== */

document.addEventListener('keydown', e => {
    if (['TEXTAREA','INPUT'].includes(e.target.tagName)) return;

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            if (state.playing) UI.btnPause.click(); else UI.btnPlay.click();
            break;
        case 'KeyS': UI.btnStop.click(); break;
        case 'KeyZ':
            if (e.shiftKey) UI.btnShuffle.click();
            else            UI.btnPrev.click();
            break;
        case 'KeyB': UI.btnNext.click(); break;
        case 'ArrowLeft':
            e.preventDefault();
            if (e.altKey) UI.btnPrev.click();
            else player.seek(player.currentTime - 5);
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (e.altKey) UI.btnNext.click();
            else player.seek(player.currentTime + 5);
            break;
        case 'ArrowUp':
            e.preventDefault();
            UI.volume.value = Math.min(100, +UI.volume.value + 5);
            player.setVolume(UI.volume.value / 100);
            break;
        case 'ArrowDown':
            e.preventDefault();
            UI.volume.value = Math.max(0, +UI.volume.value - 5);
            player.setVolume(UI.volume.value / 100);
            break;
        case 'KeyR': UI.btnRepeat.click(); break;
        case 'KeyL': openUrlDialog(); break;
    }
});


/* ===================== DRAGGABLE WINDOWS ===================== */

function makeDraggable(win, handle) {
    let dragging = false, ox = 0, oy = 0;

    function startDrag(clientX, clientY) {
        dragging = true;
        ox = clientX - win.offsetLeft;
        oy = clientY - win.offsetTop;
        win.style.zIndex = 10;
    }
    function moveDrag(clientX, clientY) {
        if (!dragging) return;
        win.style.left = clamp(clientX - ox, 0, window.innerWidth  - win.offsetWidth)  + 'px';
        win.style.top  = clamp(clientY - oy, 0, window.innerHeight - win.offsetHeight) + 'px';
    }

    handle.addEventListener('mousedown', e => {
        if (e.target.tagName === 'BUTTON') return;
        startDrag(e.clientX, e.clientY);
        e.preventDefault();
    });
    document.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { dragging = false; });

    handle.addEventListener('touchstart', e => {
        if (e.target.tagName === 'BUTTON') return;
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    document.addEventListener('touchmove', e => {
        if (!dragging) return;
        e.preventDefault();
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', () => { dragging = false; });

    win.addEventListener('mousedown', () => {
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = '1');
        win.style.zIndex = '2';
    });
    win.addEventListener('touchstart', () => {
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = '1');
        win.style.zIndex = '2';
    }, { passive: true });
}


/* ===================== RESIZABLE PLAYLIST ===================== */

function makeResizable(win, handle) {
    let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

    function startResize(clientX, clientY) {
        resizing = true;
        startX = clientX;
        startY = clientY;
        startW = win.offsetWidth;
        startH = win.offsetHeight;
        win.style.zIndex = 10;
    }
    function doResize(clientX, clientY) {
        if (!resizing) return;
        const newW = clamp(startW + (clientX - startX), 220, window.innerWidth  - win.offsetLeft - 10);
        const newH = clamp(startH + (clientY - startY), 140, window.innerHeight - win.offsetTop  - 10);
        win.style.width  = newW + 'px';
        win.style.height = newH + 'px';
    }

    handle.addEventListener('mousedown', e => {
        startResize(e.clientX, e.clientY);
        e.preventDefault();
        e.stopPropagation();
    });
    document.addEventListener('mousemove', e => doResize(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { resizing = false; });

    handle.addEventListener('touchstart', e => {
        startResize(e.touches[0].clientX, e.touches[0].clientY);
        e.stopPropagation();
    }, { passive: true });
    document.addEventListener('touchmove', e => {
        if (!resizing) return;
        e.preventDefault();
        doResize(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    document.addEventListener('touchend', () => { resizing = false; });
}


/* ===================== LAYOUT PERSISTENCE ===================== */

const layout = {
    _key: 'winamp_layout',

    save() {
        const data = {
            player: {
                left: UI.playerWin.style.left,
                top:  UI.playerWin.style.top,
            },
            playlist: {
                left:    UI.playlistWin.style.left,
                top:     UI.playlistWin.style.top,
                width:   UI.playlistWin.style.width,
                height:  UI.playlistWin.style.height,
                visible: UI.playlistWin.style.display !== 'none',
            },
        };
        localStorage.setItem(this._key, JSON.stringify(data));
    },

    restore() {
        try {
            const data = JSON.parse(localStorage.getItem(this._key));
            if (!data) return false;

            const set = (win, s) => {
                if (s.left)   win.style.left   = s.left;
                if (s.top)    win.style.top    = s.top;
                if (s.width)  win.style.width  = s.width;
                if (s.height) win.style.height = s.height;
            };

            set(UI.playerWin,   data.player);
            set(UI.playlistWin, data.playlist);

            if (data.playlist.visible === false) {
                UI.playlistWin.style.display = 'none';
                UI.cbPl.classList.remove('active');
            }
            return true;
        } catch (_) { return false; }
    },
};

// Guarda posición al soltar el mouse después de mover o redimensionar
document.addEventListener('mouseup',  () => layout.save());
document.addEventListener('touchend', () => layout.save());


/* ===================== INIT ===================== */

function init() {
    const restored = layout.restore();

    if (!restored) {
        // Primera vez: posicionar centrado
        const cx = Math.max(0, Math.round(window.innerWidth / 2 - 139));
        UI.playerWin.style.left  = cx + 'px';
        UI.playerWin.style.top   = '80px';

        requestAnimationFrame(() => {
            const ph = UI.playerWin.offsetHeight;
            UI.playlistWin.style.left = cx + 'px';
            UI.playlistWin.style.top  = (80 + ph + 3) + 'px';
        });
    }

    makeDraggable(UI.playerWin,  $('player-titlebar'));
    makeDraggable(UI.playlistWin, $('playlist-titlebar'));
    makeResizable(UI.playlistWin, $('pl-resize'));

    player.setVolume(0.8);
    player.setBalance(0);

    setTitle('No hay pista cargada');
    renderPlaylist();
    syncCount();
    syncPlayState();
    visualizer.start();
}

/* ===================== UTILS ===================== */

function fmtTime(s) {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

init();

})();
