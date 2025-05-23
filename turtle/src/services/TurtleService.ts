import pythonRuntimeService from './PythonRuntimeService';

// Definiert die erwartete Struktur für Turtle-Befehle
export interface TurtleCommand {
    command: string; // z.B. 'forward', 'left', 'right', 'penup', 'pendown', 'goto', 'color'
    args: any[];    // Argumente für den Befehl
}

// Definiert die Callback-Funktion, die von der Canvas-Komponente implementiert wird
export type TurtleDrawCallback = (command: TurtleCommand) => void;

class TurtleService {
    private drawCallback: TurtleDrawCallback | null = null;
    private turtleState = {
        x: 0,
        y: 0,
        angle: 0, // In Grad, 0 ist nach rechts
        isPenDown: true,
        color: 'black',
        animationSpeed: 5, // Geschwindigkeit der Animation: 1 (langsam) bis 10 (schnell), 0 für sofort
    };

    // Cache-Keys für das Turtle-Modul
    private TURTLE_MODULE_CACHE_KEY = 'turtle-module-v1';
    private isInitializing: boolean = false;
    private initPromise: Promise<void> | null = null;

    constructor() {
        // Initialisiere die Turtle-Schnittstelle in Python, sobald Pyodide bereit ist
        this.initializePythonTurtleInterface();
    }

    // Cache-Funktionen für das Turtle-Modul
    private checkTurtleModuleCache(): boolean {
        try {
            const cacheItem = localStorage.getItem(this.TURTLE_MODULE_CACHE_KEY);
            return !!cacheItem;
        } catch (error: any) {
            console.warn('Could not access localStorage for Turtle module cache:', error);
            return false;
        }
    }

    private cacheTurtleModule(): void {
        try {
            localStorage.setItem(this.TURTLE_MODULE_CACHE_KEY, 'cached');
            console.log('Turtle module cached successfully.');
        } catch (error: any) {
            console.warn('Could not cache Turtle module:', error);
        }
    }

    public clearCache(): void {
        try {
            localStorage.removeItem(this.TURTLE_MODULE_CACHE_KEY);
            console.log('Turtle module cache cleared.');
        } catch (error: any) {
            console.warn('Could not clear Turtle module cache:', error);
        }
    }

    private async initializePythonTurtleInterface() {
        // Verhindere parallele Initialisierungen
        if (this.isInitializing) {
            if (this.initPromise) {
                return this.initPromise;
            }
            return;
        }

        this.isInitializing = true;
        this.initPromise = new Promise<void>(async (resolve, reject) => {
            try {
                // Stelle sicher, dass Pyodide geladen ist (nutzt jetzt die optimierte lazy-loading Funktion)
                await pythonRuntimeService.initialize();

                if (!pythonRuntimeService.isReady()) {
                    throw new Error('Pyodide is not ready, cannot initialize Python Turtle interface.');
                }

                const pyodide = pythonRuntimeService.getPyodide();
                if (!pyodide) {
                    throw new Error('Pyodide instance not available.');
                }

                // Erstelle JavaScript-Funktionen, die von Python aufgerufen werden können
                (globalThis as any).js_turtle_forward = (distance: number) => this.forward(distance);
                (globalThis as any).js_turtle_backward = (distance: number) => this.backward(distance);
                (globalThis as any).js_turtle_left = (angle: number) => this.left(angle);
                (globalThis as any).js_turtle_right = (angle: number) => this.right(angle);
                (globalThis as any).js_turtle_penup = () => this.penup();
                (globalThis as any).js_turtle_pendown = () => this.pendown();
                (globalThis as any).js_turtle_goto = (x: number, y: number) => this.goto(x, y);
                (globalThis as any).js_turtle_pencolor = (color: string) => this.pencolor(color);
                (globalThis as any).js_turtle_setheading = (angle: number) => this.setheading(angle);
                (globalThis as any).js_turtle_speed = (speed: number) => this.setAnimationSpeed(speed);

                // Definiere das Python Turtle-Modul, das diese JavaScript-Funktionen aufruft
                const pythonTurtleModule = `
import js

class Turtle:
    def forward(self, distance):
        js.js_turtle_forward(distance)

    def backward(self, distance):
        js.js_turtle_backward(distance)

    def left(self, angle):
        js.js_turtle_left(angle)

    def right(self, angle):
        js.js_turtle_right(angle)

    def penup(self):
        js.js_turtle_penup()

    def pendown(self):
        js.js_turtle_pendown()

    def goto(self, x, y=None):
        if y is None: # Ermöglicht turtle.goto( (x,y) )
            try:
                x, y = x
            except TypeError:
                print("Error: goto requires two arguments (x, y) or a tuple (x,y)")
                return
        js.js_turtle_goto(x, y)

    def pencolor(self, color_string):
        js.js_turtle_pencolor(color_string)

    def setheading(self, to_angle):
        js.js_turtle_setheading(to_angle)
        
    def speed(self, speed_val):
        js.js_turtle_speed(speed_val)

    # Aliase
    fd = forward
    bk = backward
    lt = left
    rt = right
    pu = penup
    pd = pendown
    seth = setheading

# Erstelle eine globale Turtle-Instanz (ähnlich dem Standard-Turtle-Modul)
_turtle_instance = Turtle()

def forward(distance):
    _turtle_instance.forward(distance)

def backward(distance):
    _turtle_instance.backward(distance)

def left(angle):
    _turtle_instance.left(angle)

def right(angle):
    _turtle_instance.right(angle)

def penup():
    _turtle_instance.penup()

def pendown():
    _turtle_instance.pendown()

def goto(x, y=None):
    _turtle_instance.goto(x, y)

def pencolor(color_string):
    _turtle_instance.pencolor(color_string)

def setheading(to_angle):
    _turtle_instance.setheading(to_angle)

def speed(speed_val):
    _turtle_instance.speed(speed_val)

# Aliase für die globalen Funktionen
fd = forward
bk = backward
lt = left
rt = right
pu = penup
pd = pendown
seth = setheading

print("Custom Python turtle module loaded and initialized.")
`;

                // Prüfe, ob das Turtle-Modul im Cache existiert
                const isTurtleModuleCached = this.checkTurtleModuleCache();

                if (!isTurtleModuleCached) {
                    console.log('Installing Turtle module dependencies...');

                    // Lade das 'js'-Modul, das für die Kommunikation zwischen Python und JS benötigt wird
                    // Wir optimieren dies durch asynchrone Ausführung und bessere Fehlerbehandlung
                    try {
                        // Prüfen, ob micropip bereits installiert ist
                        const micropipInstalled = await pyodide.runPythonAsync(`
                            import sys
                            "micropip" in sys.modules
                        `);

                        if (!micropipInstalled) {
                            await pyodide.loadPackage('micropip');
                        }

                        const micropip = pyodide.pyimport('micropip');

                        // Prüfen, ob js-Modul bereits installiert ist
                        const jsModuleInstalled = await pyodide.runPythonAsync(`
                            import sys
                            "js" in sys.modules
                        `);

                        if (!jsModuleInstalled) {
                            await micropip.install('js');
                        }
                    } catch (error) {
                        console.error('Error installing dependencies:', error);
                        throw new Error(`Failed to install dependencies: ${error}`);
                    }

                    // Speichere das Turtle-Modul im Pyodide-Dateisystem
                    try {
                        // Erstelle das Turtle-Modul in Pyodide
                        pyodide.FS.writeFile('/lib/python3.11/site-packages/turtle.py', pythonTurtleModule);
                        console.log('Python turtle module written to Pyodide FS.');

                        // Cache das Modul
                        this.cacheTurtleModule();

                        // Importiere das Modul, um sicherzustellen, dass es geladen wird
                        await pyodide.runPythonAsync(`
                            import turtle
                            print("Python turtle module successfully imported in Pyodide.")
                        `);
                    } catch (error) {
                        console.error('Error setting up Python turtle module:', error);
                        throw new Error(`Failed to set up Python turtle module: ${error}`);
                    }
                } else {
                    console.log('Turtle module already cached, skipping installation.');

                    // Importiere das Modul, um sicherzustellen, dass es verfügbar ist
                    await pyodide.runPythonAsync(`
                        import turtle
                        print("Cached Python turtle module successfully imported.")
                    `);
                }

                resolve();
            } catch (error) {
                console.error('Error in TurtleService initialization:', error);
                reject(error);
            } finally {
                this.isInitializing = false;
                this.initPromise = null;
            }
        });

        return this.initPromise;
    }

    public registerDrawCallback(callback: TurtleDrawCallback): void {
        this.drawCallback = callback;
        console.log('Draw callback registered in TurtleService.');
    }

    private executeDrawCommand(command: TurtleCommand): void {
        if (this.drawCallback) {
            this.drawCallback(command);
        } else {
            console.warn('No draw callback registered. Turtle command ignored:', command);
        }
    }

    // Turtle-Methoden, die von Python via JS-Bridge aufgerufen werden
    public forward(distance: number): void {
        console.log(`TurtleService: forward(${distance})`);
        const newX = this.turtleState.x + distance * Math.cos((this.turtleState.angle * Math.PI) / 180);
        const newY = this.turtleState.y + distance * Math.sin((this.turtleState.angle * Math.PI) / 180);
        if (this.turtleState.isPenDown) {
            this.executeDrawCommand({ command: 'lineTo', args: [newX, newY, this.turtleState.color] });
        } else {
            this.executeDrawCommand({ command: 'moveTo', args: [newX, newY] });
        }
        this.turtleState.x = newX;
        this.turtleState.y = newY;
    }

    public backward(distance: number): void {
        this.forward(-distance); // Implementiere backward als forward mit negativer Distanz
    }

    public left(angle: number): void {
        console.log(`TurtleService: left(${angle})`);
        this.turtleState.angle = (this.turtleState.angle - angle + 360) % 360; // Winkel nach links (gegen Uhrzeigersinn)
        this.executeDrawCommand({ command: 'rotate', args: [this.turtleState.angle] }); // Optional: Befehl zum Drehen des Turtle-Symbols
    }

    public right(angle: number): void {
        console.log(`TurtleService: right(${angle})`);
        this.turtleState.angle = (this.turtleState.angle + angle) % 360; // Winkel nach rechts (im Uhrzeigersinn)
        this.executeDrawCommand({ command: 'rotate', args: [this.turtleState.angle] }); // Optional
    }

    public penup(): void {
        console.log('TurtleService: penup()');
        this.turtleState.isPenDown = false;
        this.executeDrawCommand({ command: 'penup', args: [] });
    }

    public pendown(): void {
        console.log('TurtleService: pendown()');
        this.turtleState.isPenDown = true;
        this.executeDrawCommand({ command: 'pendown', args: [] });
    }

    public goto(x: number, y: number): void {
        console.log(`TurtleService: goto(${x}, ${y})`);
        if (this.turtleState.isPenDown) {
            this.executeDrawCommand({ command: 'lineTo', args: [x, y, this.turtleState.color] });
        } else {
            this.executeDrawCommand({ command: 'moveTo', args: [x, y] });
        }
        this.turtleState.x = x;
        this.turtleState.y = y;
    }

    public pencolor(color: string): void {
        console.log(`TurtleService: pencolor(${color})`);
        this.turtleState.color = color;
        this.executeDrawCommand({ command: 'pencolor', args: [color] });
    }

    public setheading(angle: number): void {
        console.log(`TurtleService: setheading(${angle})`);
        this.turtleState.angle = angle % 360;
        this.executeDrawCommand({ command: 'rotate', args: [this.turtleState.angle] }); // Optional
    }

    public reset(): void {
        console.log('TurtleService: reset()');
        this.turtleState = {
            x: 0,
            y: 0,
            angle: 0,
            isPenDown: true,
            color: 'black',
            animationSpeed: this.turtleState.animationSpeed, // Animation speed beibehalten
        };
        this.executeDrawCommand({ command: 'clear', args: [] }); // Canvas leeren
        this.executeDrawCommand({ command: 'moveTo', args: [0, 0] }); // Turtle zur Startposition
        this.executeDrawCommand({ command: 'rotate', args: [0] }); // Turtle-Ausrichtung zurücksetzen
    }

    public getTurtleState() {
        return { ...this.turtleState };
    }

    public setAnimationSpeed(speed: number): void {
        console.log(`TurtleService: setAnimationSpeed(${speed})`);
        // Begrenze Speed auf gültigen Bereich (0-10)
        const validSpeed = Math.max(0, Math.min(10, speed));
        this.turtleState.animationSpeed = validSpeed;
        // Sende Animationsgeschwindigkeitsbefehl an die Canvas
        this.executeDrawCommand({ command: 'animationSpeed', args: [validSpeed] });
    }
}

// Singleton-Instanz des Service
const turtleService = new TurtleService();
export default turtleService;