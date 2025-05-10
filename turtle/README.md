# Python Turtle im Browser

Willkommen bei "Python Turtle im Browser"! Dieses Projekt ermöglicht es Ihnen, Python-Turtle-Grafiken direkt in Ihrem Webbrowser zu erstellen und auszuführen. Es basiert auf Vue 3, TypeScript und Vite und nutzt Pyodide, um Python-Code im Browser auszuführen.

![Screenshot der Turtle-Anwendung](placeholder_screenshot_1.png)
*(Platzhalter für einen Screenshot der Hauptansicht der Anwendung)*

## Funktionen

-   **Interaktiver Code-Editor:** Schreiben und bearbeiten Sie Python-Turtle-Code mit dem integrierten Monaco-Editor.
-   **Live-Vorschau:** Sehen Sie Ihre Turtle-Grafiken in Echtzeit auf einem speziellen Canvas.
-   **Zoom- und Schwenkfunktionen:** Untersuchen Sie Ihre Grafiken im Detail.
-   **Steuerungspanel:** Starten, stoppen und setzen Sie Ihre Turtle-Animationen zurück.
-   **Beispiel-Galerie:** Entdecken Sie vordefinierte Turtle-Beispiele und lernen Sie davon.
-   **Optimiert für die Produktion:** Lazy Loading, Asset-Komprimierung und Caching-Strategien für schnelle Ladezeiten.
-   **Offline-Unterstützung:** Dank Service Worker (Grundfunktionen).

## Empfohlene IDE-Konfiguration

-   [VSCode](https://code.visualstudio.com/)
-   [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Deaktivieren Sie Vetur, falls installiert)

## TypeScript-Unterstützung für `.vue`-Importe

TypeScript benötigt zusätzliche Konfiguration, um Typinformationen für `.vue`-Importe zu verarbeiten. Wir verwenden `vue-tsc` für die Typüberprüfung über die Kommandozeile. In Editoren sorgt Volar dafür, dass der TypeScript-Sprachdienst `.vue`-Typen erkennt.

Weitere Informationen finden Sie in der [Vite-Konfigurationsreferenz](https://vite.dev/config/).

## Projekt-Setup und lokale Entwicklung

### Voraussetzungen

-   Node.js (Version 18.x oder höher empfohlen)
-   npm (wird mit Node.js geliefert)

### Installation

1.  Klonen Sie das Repository:
    ```sh
    git clone https://github.com/IhrBenutzername/python-turtle-im-browser.git
    cd python-turtle-im-browser/turtle
    ```

2.  Installieren Sie die Abhängigkeiten:
    ```sh
    npm install
    ```

### Lokalen Entwicklungsserver starten

Führen Sie den folgenden Befehl im Verzeichnis `turtle` aus:
```sh
npm run dev
```
Dies startet den Vite-Entwicklungsserver, normalerweise unter `http://localhost:5173`. Die Anwendung wird bei Code-Änderungen automatisch neu geladen.

## Beispiel: Grundlegende Turtle-Operationen

Hier ist ein einfacher Python-Turtle-Code, den Sie im Editor ausprobieren können:

```python
import turtle

# Bildschirm einrichten
screen = turtle.Screen()
screen.setup(width=600, height=600)
screen.bgcolor("lightblue")

# Turtle erstellen
stift = turtle.Turtle()
stift.shape("turtle")
stift.color("green")
stift.speed(3) # 1 (langsam) bis 10 (schnell), 0 (am schnellsten)

# Ein Quadrat zeichnen
for _ in range(4):
    stift.forward(100)
    stift.left(90)

# Turtle verstecken, wenn fertig
stift.hideturtle()

turtle.done()
```

## Build für die Produktion

Führen Sie den folgenden Befehl im Verzeichnis `turtle` aus, um die Anwendung für die Produktion zu kompilieren und zu minimieren:
```sh
npm run build
```
Dieser Befehl generiert optimierte statische Assets im Verzeichnis `turtle/dist`.

## Deployment auf Cloudflare Pages

Dieses Projekt ist so konfiguriert, dass es einfach auf Cloudflare Pages deployed werden kann.

### Voraussetzungen

-   Ein Cloudflare-Konto.
-   `wrangler` CLI installiert und konfiguriert (optional für manuelle Deployments, aber empfohlen).
    ```sh
    npm install -g wrangler
    wrangler login
    ```

### Deployment-Schritte

1.  **Forken und Klonen:** Forken Sie dieses Repository auf Ihr GitHub-Konto und klonen Sie es lokal.
2.  **Mit Cloudflare Pages verbinden:**
    *   Melden Sie sich bei Ihrem Cloudflare-Dashboard an.
    *   Gehen Sie zu "Workers & Pages" und klicken Sie auf "Create application".
    *   Wählen Sie "Pages" und dann "Connect to Git".
    *   Wählen Sie Ihr geforktes Repository aus.
    *   **Build-Einstellungen konfigurieren:**
        *   **Framework preset:** `Vite`
        *   **Build command:** `npm run build` (oder `cd turtle && npm run build`, falls das Stammverzeichnis des Repos ausgewählt wurde)
        *   **Build output directory:** `dist` (oder `turtle/dist`)
        *   **Root directory (optional):** `/turtle` (falls Ihr Projekt im Unterordner `turtle` liegt und Sie das Stammverzeichnis des Repos in Cloudflare ausgewählt haben)
        *   **Umgebungsvariablen (falls nötig):**
            *   `NODE_VERSION`: `18` (oder eine kompatible Version)

3.  **Speichern und Deployen:** Klicken Sie auf "Save and Deploy". Cloudflare Pages wird Ihre Anwendung builden und deployen.

### `wrangler.jsonc` Konfiguration

Die Datei [`wrangler.jsonc`](turtle/wrangler.jsonc:0) im `turtle`-Verzeichnis enthält grundlegende Konfigurationen für Cloudflare Workers, falls Sie fortgeschrittenere Funktionen oder serverseitige Logik mit Workers implementieren möchten, die Ihre Pages-Site ergänzen. Für ein reines Static Site Hosting über Cloudflare Pages ist sie nicht primär für den Build-Prozess der statischen Assets zuständig, kann aber für die Entwicklung von Workers-Funktionen genutzt werden.

Die relevanten npm-Skripte für das Deployment sind in [`package.json`](turtle/package.json:1) definiert:
-   `npm run build`: Erstellt den Produktions-Build.
-   `npm run deploy`: (Beispiel, muss ggf. angepasst werden) `wrangler pages deploy dist`

### Lokales Testen des Produktions-Builds

Nachdem Sie `npm run build` ausgeführt haben, können Sie den Inhalt des `dist`-Ordners lokal testen, z.B. mit einem einfachen HTTP-Server:
```sh
npx serve dist
```

## Bekannte Einschränkungen

-   **Pyodide-Ladezeit:** Obwohl Optimierungen implementiert wurden, kann das erstmalige Laden von Pyodide je nach Netzwerkgeschwindigkeit einige Sekunden dauern.
-   **Komplexität der Turtle-Grafiken:** Sehr komplexe oder lang andauernde Turtle-Animationen können die Browserleistung beeinträchtigen.
-   **Browser-Kompatibilität:** Getestet auf modernen Browsern (Chrome, Firefox, Edge). Ältere Browser werden möglicherweise nicht vollständig unterstützt.
-   **Dateisystemzugriff:** Direkter Dateisystemzugriff aus dem Python-Code ist aus Sicherheitsgründen nicht möglich.

## Zukünftige Verbesserungen

-   **Speichern und Laden von Code:** Möglichkeit, Python-Skripte im Browser zu speichern oder vom lokalen System zu laden.
-   **Export von Grafiken:** Funktion zum Exportieren der Turtle-Canvas als Bild (PNG, SVG).
-   **Erweiterte Beispiel-Galerie:** Mehr Beispiele und Kategorien.
-   **Kollaborativer Modus:** Gemeinsames Bearbeiten von Turtle-Code.
-   **Verbesserte Fehlerbehandlung:** Detailliertere Fehlermeldungen aus der Python-Runtime.
-   **Integration weiterer Python-Bibliotheken:** Unterstützung für andere bildungsrelevante Python-Module.
-   **Fortgeschrittene CI/CD-Pipeline:** Automatisierte Tests und Deployments mit GitHub Actions oder ähnlichen Werkzeugen.

## Mitwirken

Beiträge sind willkommen! Bitte erstellen Sie einen Fork des Repositories, nehmen Sie Ihre Änderungen vor und öffnen Sie einen Pull Request.

---

*Fügen Sie hier ggf. weitere Screenshots ein, z.B. vom Editor oder der Beispiel-Galerie.*
![Beispiel-Editor](placeholder_screenshot_editor.png)
![Beispiel-Galerie](placeholder_screenshot_gallery.png)
