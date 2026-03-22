# 📻 Radio Online — Winamp-style Player

Reproductor de música y radio en el navegador, inspirado en Winamp 2.x. Sin dependencias, sin build step — abre `index.html` y listo.

![screenshot](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-green) ![license](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Características

- 🎨 Interfaz fiel al estilo Winamp 2.x
- 📊 Visualizador de espectro en tiempo real (Web Audio API)
- 🎵 Reproducción de archivos locales y streams de radio (HTTP/HTTPS)
- 📋 Playlist con arrastrar y soltar, selección múltiple, shuffle y repeat
- ⭐ Favoritos persistentes por dispositivo
- 🇨🇱 Radios chilenas precargadas (50+ estaciones)
- 💾 Guardar radios propias con nombre personalizado
- ☁️ Sincronización en la nube entre dispositivos (via JSONBin.io)
- 📱 Soporte táctil — mover y redimensionar paneles en móvil
- 📁 Carga de listas `.m3u` / `.pls` y exportación M3U

---

## 🚀 Uso

### Abrir directo en el navegador
```bash
# Solo abre el archivo
open index.html
```

### Servidor local (para streams con CORS)
```bash
python -m http.server 8080
# o
npx serve .
```

---

## ⌨️ Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `S` | Detener |
| `Z` / `B` | Anterior / Siguiente |
| `Alt+←` / `Alt+→` | Anterior / Siguiente |
| `←` / `→` | Retroceder / Avanzar 5s |
| `↑` / `↓` | Volumen +5 / -5 |
| `R` | Ciclar repetición (ninguno → todo → uno) |
| `Shift+Z` | Alternar aleatorio |
| `L` | Abrir diálogo URL |

---

## ☁️ Sincronización entre dispositivos

Las radios guardadas se pueden sincronizar entre dispositivos usando **JSONBin.io** (gratuito):

1. Crea cuenta en [jsonbin.io](https://jsonbin.io)
2. Copia tu **Master Key** desde API Keys
3. Crea un **Bin** nuevo con contenido `{"radios":[]}` y copia su **ID**
4. En el player: clic en **☁ NUBE** → ingresa Key y Bin ID → **Guardar y Sincronizar**

Una vez configurado, las radios se sincronizan automáticamente al guardar o eliminar.

---

## 🏗️ Arquitectura

```
index.html
├── css/
│   └── winamp.css          — Estilos retro Winamp
└── js/
    ├── visualizer.js       — Canvas spectrum analyzer (AnalyserNode)
    ├── playlist.js         — Modelo de datos: Track, Playlist, M3U parser
    ├── player.js           — Web Audio graph + HTMLAudioElement wrapper
    ├── radios-chile.js     — Lista de radios chilenas precargadas
    └── app.js              — Orquestador: UI, eventos, sync, drag&drop
```

### Grafo Web Audio

```
MediaElementSource → AnalyserNode → GainNode → StereoPannerNode → destination
```

---

## 📄 Licencia

MIT
