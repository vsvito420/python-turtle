import { type PyodideInterface } from 'pyodide';

// Konfigurieren von Pyodide für das dynamische Importieren
const PYODIDE_VERSION = '0.27.5'; // Aktuelle Version, die wir verwenden
const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Da das Caching von Pyodide-Assets nun effektiv durch den Service Worker (VitePWA)
// gehandhabt wird, werden die manuelle Cache-Logik (getFromCache, saveToCache, CacheEntry, PYODIDE_CACHE_KEY)
// und die cacheExpirationTime hier entfernt, um Redundanz zu vermeiden und die Komplexität zu reduzieren.
// Der Service Worker bietet eine robustere Lösung für das Netzwerk-Caching.

class PythonRuntimeService {
    private pyodide: PyodideInterface | null = null;
    private isLoading: boolean = false;
    private isLoaded: boolean = false;
    private loadingPromise: Promise<void> | null = null;
    private loadingResolvers: { resolve: () => void; reject: (error: Error) => void }[] = [];

    // Lazy-load Pyodide nur wenn nötig
    public async initialize(): Promise<void> {
        if (this.isLoaded) {
            return; // Bereits geladen
        }

        if (this.loadingPromise) {
            // Wenn bereits ein Ladevorgang läuft, warte auf dessen Abschluss
            return this.loadingPromise;
        }

        this.isLoading = true;
        console.log('Initializing Pyodide...');

        // Erstelle ein neues Promise für den Ladevorgang
        this.loadingPromise = new Promise<void>((resolve, reject) => {
            this.loadingResolvers.push({ resolve, reject });
        });

        try {
            // Dynamisch Importieren von Pyodide (für Code-Splitting)
            const { loadPyodide } = await import('pyodide');

            // Pyodide laden
            this.pyodide = await loadPyodide({
                indexURL: PYODIDE_CDN_URL,
            });

            this.isLoaded = true;
            this.isLoading = false;
            this.resolveAllLoaders();
            console.log('Pyodide initialized successfully.');

        } catch (error) {
            this.isLoading = false;
            this.loadingPromise = null;
            this.rejectAllLoaders(error as Error);
            console.error('Error initializing Pyodide:', error);
            throw error;
        }

        // Das ursprüngliche 'return this.loadingPromise;' hier könnte dazu führen, dass Aufrufer
        // auf ein Promise warten, das möglicherweise bereits resolved/rejected und auf null gesetzt wurde.
        // Stattdessen sollte die Methode implizit ein Promise<void> zurückgeben,
        // das resolved, wenn der Ladevorgang abgeschlossen ist, oder rejected, wenn ein Fehler auftritt.
        // Da die Logik nun synchroner nach dem await ist (oder der Fehler geworfen wird),
        // ist ein explizites return des Promises nicht mehr so kritisch, aber die Struktur
        // mit loadingPromise stellt sicher, dass parallele Aufrufe korrekt behandelt werden.
        // Die resolveAllLoaders/rejectAllLoaders kümmern sich um die Benachrichtigung der Wartenden.
        if (this.loadingPromise) { // Überprüfen, ob es noch existiert (im Fehlerfall wird es null)
            return this.loadingPromise;
        }
    }

    private resolveAllLoaders() {
        for (const { resolve } of this.loadingResolvers) {
            resolve();
        }
        this.loadingResolvers = [];
        // Set loadingPromise to null *after* resolving,
        // to allow subsequent calls to initialize() to create a new one if needed.
        this.loadingPromise = null;
    }

    private rejectAllLoaders(error: Error) {
        for (const { reject } of this.loadingResolvers) {
            reject(error);
        }
        this.loadingResolvers = [];
        this.loadingPromise = null;
    }

    // Die Methoden saveToCache, getFromCache und clearCache wurden entfernt,
    // da das Caching nun vom Service Worker via VitePWA übernommen wird.

    public async runPythonCode(code: string): Promise<any> {
        // Automatische Initialisierung, wenn noch nicht geschehen
        if (!this.isLoaded && !this.isLoading) {
            await this.initialize();
        } else if (this.isLoading) {
            // Warten auf Abschluss des Ladevorgangs, wenn er bereits läuft
            await this.loadingPromise;
        }

        if (!this.pyodide) {
            throw new Error('Pyodide is not initialized. Call initialize() first.');
        }

        try {
            // Führe den Python-Code aus
            const result = await this.pyodide.runPythonAsync(code);
            return result;
        } catch (error) {
            console.error('Error running Python code:', error);
            throw error;
        }
    }

    public isReady(): boolean {
        return this.isLoaded;
    }

    public isInitializing(): boolean {
        return this.isLoading;
    }

    public getPyodide(): PyodideInterface | null {
        return this.pyodide;
    }

    // Die Methode clearCache wurde entfernt. Das Leeren des Service Worker Caches
    // erfolgt durch Mechanismen von VitePWA (z.B. bei Aktualisierung des Service Workers).
}

// Singleton-Instanz des Service
const pythonRuntimeService = new PythonRuntimeService();
export default pythonRuntimeService;