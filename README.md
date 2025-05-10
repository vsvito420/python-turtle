# Python Turtle im Browser

Eine moderne Webanwendung zur Ausführung von Python-Turtle-Code direkt im Browser. Gebaut mit Vue 3, TypeScript und Pyodide, optimiert für Cloudflare Pages.

![Python Turtle im Browser](https://via.placeholder.com/800x400?text=Python+Turtle+im+Browser)

## Inhaltsverzeichnis

- [Projektübersicht](#projektübersicht)
- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [Lokales Entwickeln](#lokales-entwickeln)
- [Deployment](#deployment)
- [Optimierungen](#optimierungen)
- [Projektstruktur](#projektstruktur)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)
- [Zukünftige Verbesserungen](#zukünftige-verbesserungen)
- [Mitwirken](#mitwirken)
- [Lizenz](#lizenz)

## Projektübersicht

Diese Anwendung ermöglicht es Benutzern, Python-Turtle-Code direkt im Browser zu schreiben und zu visualisieren. Die Anwendung verwendet Pyodide, eine WebAssembly-basierte Python-Implementierung, um authentische Python-Code-Ausführung im Browser zu ermöglichen, ohne dass ein Server erforderlich ist.

### Hauptfunktionen

- Monaco Code-Editor mit Syntax-Highlighting und Autovervollständigung für Python
- Interaktiver Turtle-Canvas zum Anzeigen der Zeichnungen
- Steuerungspanel für Code-Ausführung, Zurücksetzen und Animationsgeschwindigkeit
- Beispiel-Galerie mit vorgefertigten Turtle-Programmen
- Optimierte Leistung durch Lazy-Loading und Code-Splitting
- Offline-Unterstützung durch PWA-Funktionalität

## Features

- **Code-Editor**: Monaco Editor mit Python-Syntax-Highlighting und Turtle-spezifischer Autovervollständigung
- **Turtle-Canvas**: HTML5 Canvas mit Unterstützung für gängige Turtle-Befehle wie forward, left, right, penup, pendown usw.
- **Steuerungspanel**: Steuere die Ausführung des Codes, setze den Canvas zurück, passe die Animationsgeschwindigkeit an
- **Beispiel-Galerie**: Wähle aus einer Reihe vorgefertigter Beispiele für schnellen Einstieg
- **Offline-Unterstützung**: Progressive Web App (PWA) mit Service Worker für Offline-Nutzung
- **Optimierte Ladezeit**: Lazy-Loading von großen Bibliotheken (Pyodide, Monaco Editor) für schnelleres initiales Laden
- **Responsive Design**: Funktioniert auf Desktop und mobilen Geräten

## Technologie-Stack

- **Frontend**: Vue 3 + TypeScript
- **UI-Framework**: Reines CSS mit modularem Design
- **Code-Editor**: Monaco Editor
- **Python-Runtime**: Pyodide (WebAssembly-basierte Python-Implementierung)
- **Build-Tool**: Vite
- **Deployment**: Cloudflare Pages + Workers

## Installation

Klone das Repository und installiere die Abhängigkeiten:

```bash
# Repository klonen
git clone https://github.com/yourusername/python-turtle-browser.git
cd python-turtle-browser

# In das Projektverzeichnis wechseln
cd turtle

# Abhängigkeiten installieren
npm install
```

## Lokales Entwickeln

Starte den Entwicklungsserver:

```bash
npm run dev
```

Die Anwendung ist dann unter http://localhost:5173 verfügbar.

### Andere nützliche Skripte

```bash
# Typprüfung ausführen
npm run type-check

# Build für Produktion erstellen
npm run build

# Build mit Bundle-Analyse erstellen
npm run build-analyze

# Cache löschen
npm run cache:clear

# Tests ausführen
npm run test
```

## Deployment

### Voraussetzungen

- Ein Cloudflare-Konto
- Wrangler CLI installiert und konfiguriert (`npm install -g wrangler`)
- Authentifizierung mit Cloudflare (`wrangler login`)

### Deployment auf Cloudflare Pages

```bash
# Entwicklungs-Deployment
npm run deploy

# Produktions-Deployment
npm run deploy:prod
```

### Konfiguration von Cloudflare Workers

Die Anwendung verwendet Cloudflare Workers für einige serverseitige Funktionen. Die Konfiguration befindet sich in `wrangler.jsonc`.

```json
{
  "name": "turtle",
  "compatibility_date": "2025-05-10",
  "main": "server/index.ts",
  "assets": {
    "not_found_handling": "single-page-application"
  },
  "observability": {
    "enabled": true
  }
}
```

## Optimierungen

Die Anwendung enthält mehrere Optimierungen für verbesserte Leistung und Benutzererfahrung:

### 1. Code-Splitting und Lazy-Loading

- **Pyodide**: Die Python-Runtime wird erst bei Bedarf geladen (Code in `PythonRuntimeService.ts`)
- **Monaco Editor**: Der Code-Editor wird asynchron geladen (Code in `MainApplicationView.vue`)
- **Komponenten**: Nur benötigte Komponenten werden bei Bedarf geladen

### 2. Caching-Strategien

- **Service Worker**: PWA-Implementierung für Offline-Unterstützung
- **LocalStorage-Caching**: Der Turtle-Module-Status wird zwischen den Sitzungen gespeichert
- **Cloudflare CDN**: Statische Assets werden vom globalen Cloudflare-Netzwerk ausgeliefert

### 3. Leistungsoptimierungen

- **Minified Assets**: JavaScript, CSS und Bilder werden für die Produktion optimiert
- **Terser-Komprimierung**: Entfernt nicht verwendeten Code und minimiert die Dateigröße
- **Optimierte Lizenzgrößen**: Verbesserte Asset-Optimierung durch Cloudflare's Autominify

## Projektstruktur

```
turtle/
├── public/                 # Statische Dateien
├── server/                 # Cloudflare Workers Funktionen
├── src/
│   ├── assets/             # Bilder, Schriftarten und Styles
│   ├── components/
│   │   ├── controls/       # UI-Steuerelemente
│   │   ├── editor/         # Code-Editor Komponenten
│   │   ├── gallery/        # Beispielgalerie
│   │   ├── layout/         # Layout-Komponenten
│   │   └── turtle/         # Turtle-Canvas Komponenten
│   ├── router/             # Vue Router Konfiguration
│   ├── services/
│   │   ├── PythonRuntimeService.ts  # Pyodide Integration
│   │   └── TurtleService.ts         # Turtle-Implementierung
│   ├── views/              # Hauptansichten der Anwendung
│   ├── App.vue             # Hauptkomponente
│   └── main.ts             # Einstiegspunkt
├── package.json            # Abhängigkeiten und Skripte
├── tsconfig.json           # TypeScript Konfiguration
├── vite.config.ts          # Vite Konfiguration
└── wrangler.jsonc          # Cloudflare Workers Konfiguration
```

## Bekannte Einschränkungen

- **Browser-Kompatibilität**: Die Anwendung erfordert einen modernen Browser mit WebAssembly-Unterstützung.
- **Initialer Download**: Das erste Laden von Pyodide kann auf langsamen Verbindungen einige Zeit dauern (etwa 10-12MB).
- **Python-Bibliotheken**: Nicht alle Python-Bibliotheken sind im Browser verfügbar. Hauptsächlich nur Standard-Python wird unterstützt.
- **Speicherlimits**: Browser haben Speicherbeschränkungen, komplexe Programme könnten an Grenzen stoßen.
- **Langsame Ausführung**: Sehr komplexe Turtle-Programme können die Browser-Performance beeinträchtigen.

## Zukünftige Verbesserungen

- **Verbesserte Offline-Unterstützung**: Vorkonfigurierte Pyodide-Versionen im Service Worker cachen
- **Mehrbenutzerunterstützung**: Kollaborative Funktionen für gemeinsames Programmieren
- **Export-Optionen**: SVG/PNG-Export von Turtle-Zeichnungen
- **Erweiterter Beispielkatalog**: Mehr Beispiele und Tutorials
- **Integrierte Dokumentation**: Kontextbezogene Hilfe und Turtle-API-Dokumentation
- **Erweitertes Debugging**: Schritt-für-Schritt-Ausführung und bessere Fehlerberichte
- **Unterstützung für mobile Geräte**: Verbesserte Touchscreen-Eingabe für Mobilgeräte

## Mitwirken

Beiträge sind willkommen! Bitte lies zunächst die Mitwirkungsrichtlinien.

1. Fork das Projekt
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull-Request

## Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe die LICENSE-Datei für Details.
