/**
 * radios-chile.js — Lista de radios chilenas con URLs de streaming directas.
 * Fuentes: StreamTheWorld CDN, DigitalProServer/DPS.live, Zeno.FM, streams directos.
 */

const RADIOS_CHILE = [

    /* ========================================================
       NOTICIAS / TALK
    ======================================================== */
    {
        title:  'Radio Cooperativa',
        artist: '93.3 FM · Noticias',
        src:    'https://redirector.dps.live/cooperativafm/mp3/icecast.audio',
        type:   'url',
    },
    {
        title:  'Radio Bío-Bío Santiago',
        artist: '98.1 FM · Noticias',
        src:    'https://unlimited1-us.digitalproserver.com/biobiosantiago/aac/icecast.audio',
        type:   'url',
    },
    {
        title:  'Radio Bío-Bío Concepción',
        artist: '99.1 FM · Noticias',
        src:    'https://redirector.dps.live/biobioconcepcion/mp3/icecast.audio',
        type:   'url',
    },
    {
        title:  'ADN Radio Chile',
        artist: '91.7 FM · Noticias / Talk',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/ADN.mp3',
        type:   'url',
    },
    {
        title:  'Radio Agricultura',
        artist: '92.1 FM · Noticias / Campo',
        src:    'https://redirector.dps.live/agricultura/mp3/icecast.audio',
        type:   'url',
    },
    {
        title:  'Tele13 Radio',
        artist: '· Noticias / Talk',
        src:    'http://mp3.t13radio.cl',
        type:   'url',
    },
    {
        title:  'Radio Duna',
        artist: '89.7 FM · Noticias / Adult Contemporary',
        src:    'https://mdstrm.com/audio/58d5b9e88f590e1c65a60f14.mp3',
        type:   'url',
    },
    {
        title:  'Radio Pauta',
        artist: '100.5 FM · Noticias / Economía',
        src:    'http://tunein.digitalproserver.com/paulafmbb.aac',
        type:   'url',
    },

    /* ========================================================
       POP / ADULT CONTEMPORARY
    ======================================================== */
    {
        title:  'Radio Imagina',
        artist: '88.1 FM · Pop / Retro 70s-90s',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/IMAGINA.mp3',
        type:   'url',
    },
    {
        title:  'Radio Pudahuel',
        artist: '90.5 FM · Pop / Romántica',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/PUDAHUEL.mp3',
        type:   'url',
    },
    {
        title:  'Radio Futuro',
        artist: '88.9 FM · Pop / Rock Clásico',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/FUTURO.mp3',
        type:   'url',
    },
    {
        title:  'Radio Infinita',
        artist: '100.1 FM · Pop',
        src:    'https://redirector.dps.live/infinita/aac/icecast.audio',
        type:   'url',
    },
    {
        title:  'Radio Universo',
        artist: '93.7 FM · Pop / Rock',
        src:    'https://redirector.dps.live/universo/mp3/icecast.audio',
        type:   'url',
    },
    {
        title:  'Los 40 Chile',
        artist: '101.7 FM · Pop / Hits Latino',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/LOS40_CHILE.mp3',
        type:   'url',
    },
    {
        title:  'Radio FM Dos',
        artist: '98.5 FM · Pop / Mix',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/FMDOS.mp3',
        type:   'url',
    },
    {
        title:  'Radio Carolina',
        artist: '99.3 FM · Pop / Dance',
        src:    'https://stream.zeno.fm/gtbn66a7rxhvv',
        type:   'url',
    },
    {
        title:  'El Conquistador FM',
        artist: '107.3 FM · Pop / Adult Contemporary',
        src:    'http://stream5.eltelon.com/el-conquistador-santiago.aac',
        type:   'url',
    },
    {
        title:  'Play FM',
        artist: '· Pop / Hits',
        src:    'http://mp3.playfm.cl',
        type:   'url',
    },
    {
        title:  'Radio Oasis',
        artist: '· Pop / Adult Contemporary',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_UNO.mp3',
        type:   'url',
    },
    {
        title:  'FM Tiempo',
        artist: '95.9 FM · Adult Contemporary',
        src:    'http://tunein.digitalproserver.com/fmtiempobb.aac',
        type:   'url',
    },

    /* ========================================================
       ROCK
    ======================================================== */
    {
        title:  'Rock & Pop',
        artist: '94.1 FM · Rock / Pop',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/ROCK_AND_POP.mp3',
        type:   'url',
    },
    {
        title:  'Radio Concierto',
        artist: '88.5 FM · Rock / Alternativo',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/CONCIERTO.mp3',
        type:   'url',
    },
    {
        title:  'Radio Rockaxis',
        artist: '· Rock',
        src:    'https://stream.zeno.fm/ta8uy80f9c8uv',
        type:   'url',
    },

    /* ========================================================
       ELECTRÓNICA / DANCE
    ======================================================== */
    {
        title:  'Sonar FM',
        artist: '105.7 FM · Electrónica / Dance',
        src:    'http://mp3.sonarfm.cl',
        type:   'url',
    },
    {
        title:  'Radio Zero',
        artist: '97.7 FM · Electrónica / Dance',
        src:    'http://tunein.digitalproserver.com/zerobb.aac',
        type:   'url',
    },

    /* ========================================================
       ROMÁNTICA / BALADAS
    ======================================================== */
    {
        title:  'Radio Romántica',
        artist: '104.1 FM · Romántica / Baladas',
        src:    'http://tunein.digitalproserver.com/romanticabb.aac',
        type:   'url',
    },
    {
        title:  'Radio Corazón',
        artist: '101.3 FM · Tropical / Latin Pop',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/CORAZON.mp3',
        type:   'url',
    },
    {
        title:  'Radio La Clave',
        artist: '92.9 FM · Pop / Baladas',
        src:    'http://tunein.digitalproserver.com/laclavebb.aac',
        type:   'url',
    },

    /* ========================================================
       URBANO / REGGAETON
    ======================================================== */
    {
        title:  'Radio Activa',
        artist: '92.5 FM · Urbano / Reggaeton',
        src:    'https://playerservices.streamtheworld.com/api/livestream-redirect/ACTIVA.mp3',
        type:   'url',
    },

    /* ========================================================
       MÚSICA CLÁSICA
    ======================================================== */
    {
        title:  'Radio Beethoven',
        artist: '97.7 FM · Música Clásica',
        src:    'https://redirector.dps.live/beethovenfm/aac/icecast.audio',
        type:   'url',
    },

    /* ========================================================
       FOLKLORE / CHILENIDAD
    ======================================================== */
    {
        title:  'Radio Folklórica',
        artist: '· Folklore / Música Chilena',
        src:    'http://listen.radionomy.com/radiofolkloricacom',
        type:   'url',
    },

    /* ========================================================
       CULTURA / UNIVERSIDADES
    ======================================================== */
    {
        title:  'Radio Universidad de Chile',
        artist: '97.1 FM · Cultura / Talk',
        src:    'http://stream.radio.uchile.cl:8000',
        type:   'url',
    },
    {
        title:  'Radio Universidad de Concepción',
        artist: '· Cultura / Educación',
        src:    'http://radio.udec.cl:8000/radioudec',
        type:   'url',
    },
    {
        title:  'Radio UTFSM',
        artist: '· Cultura / Valparaíso',
        src:    'http://mozart.usm.cl:8000',
        type:   'url',
    },

    /* ========================================================
       RELIGIOSA
    ======================================================== */
    {
        title:  'Radio María Chile',
        artist: '· Religiosa / Católica',
        src:    'https://stream.radiomaría.cl/radiomaria.aac',
        type:   'url',
    },
    {
        title:  'Radio Armonía',
        artist: '· Cristiana / Gospel',
        src:    'http://encoder.armonia.cl:3032/1.mp3',
        type:   'url',
    },

    /* ========================================================
       REGIONALES
    ======================================================== */
    {
        title:  'Radio Galaxia',
        artist: '· Pop / Viña del Mar',
        src:    'http://rv3.denialstream.com:8030/;stream/1.mp3',
        type:   'url',
    },
    {
        title:  'Radio Condell',
        artist: '· Regional / Curicó',
        src:    'http://cast2.radioservicios.cl:10000/condellbb.aac',
        type:   'url',
    },
    {
        title:  'RTL Tropical Latina',
        artist: '· Cumbia / Tropical · Curicó',
        src:    'http://radio.mediadev.cl/radio/8070/rtlcurico',
        type:   'url',
    },
    {
        title:  'Radio Digital FM',
        artist: '· Pop / Iquique',
        src:    'http://radio.digitalfm.cl:8000/iquique2',
        type:   'url',
    },
    {
        title:  'Radio Tierra',
        artist: '· Comunitaria / Alternativa',
        src:    'http://giss.tv:8000/radiotierra.ogg',
        type:   'url',
    },
];
