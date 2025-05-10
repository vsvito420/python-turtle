import { loadPyodide, type PyodideInterface } from 'pyodide';

class PythonRuntimeService {
    private pyodide: PyodideInterface | null = null;
    private isLoading: boolean = false;
    private isLoaded: boolean = false;

    public async initialize(): Promise<void> {
        if (this.isLoaded || this.isLoading) {
            return;
        }

        this.isLoading = true;
        console.log('Initializing Pyodide...');
        try {
            // Pyodide lädt seine Pakete von einer CDN.
            // Für die lokale Entwicklung oder Offline-Nutzung müssen die Pyodide-Dateien
            // manuell bereitgestellt und der Index-URL entsprechend angepasst werden.
            // Für dieses Beispiel verwenden wir die Standard-CDN.
            this.pyodide = await loadPyodide({
                // indexURL: '/pyodide/', // Beispiel für lokale Bereitstellung
            });
            this.isLoaded = true;
            this.isLoading = false;
            console.log('Pyodide initialized successfully.');

            // Hier könnten globale Python-Funktionen oder -Variablen für JavaScript zugänglich gemacht werden.
            // Beispiel:
            // this.pyodide.globals.set('my_js_variable', 'Hello from JavaScript');
        } catch (error) {
            this.isLoading = false;
            console.error('Error initializing Pyodide:', error);
            throw error;
        }
    }

    public async runPythonCode(code: string): Promise<any> {
        if (!this.pyodide || !this.isLoaded) {
            throw new Error('Pyodide is not initialized. Call initialize() first.');
        }

        console.log('Running Python code:', code);
        try {
            // Führe den Python-Code aus
            const result = await this.pyodide.runPythonAsync(code);
            console.log('Python code execution result:', result);
            return result;
        } catch (error) {
            console.error('Error running Python code:', error);
            throw error;
        }
    }

    public isReady(): boolean {
        return this.isLoaded;
    }

    public getPyodide(): PyodideInterface | null {
        return this.pyodide;
    }
}

// Singleton-Instanz des Service
const pythonRuntimeService = new PythonRuntimeService();
export default pythonRuntimeService;