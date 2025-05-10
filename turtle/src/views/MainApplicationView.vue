<template>
  <div class="main-application-view">
    <div class="editor-pane">
      <h3>Python Code</h3>
      <textarea v-model="pythonCode" rows="10" placeholder="Python Turtle Code hier eingeben..."></textarea>
      <!-- Ersetze textarea später durch die tatsächliche CodeEditor-Komponente -->
      <!-- <CodeEditor ref="codeEditorRef" /> -->
      <button @click="runCode" :disabled="isLoadingRuntime || isExecuting">
        {{ isLoadingRuntime ? 'Lade Python...' : (isExecuting ? 'Führe aus...' : 'Code ausführen') }}
      </button>
      <button @click="resetCanvas" :disabled="isLoadingRuntime || isExecuting">Canvas zurücksetzen</button>
      <p v-if="isLoadingRuntime">Initialisiere Python-Runtime und Turtle-Modul...</p>
      <p v-if="errorLoadingRuntime" class="error-message">Fehler beim Laden der Runtime: {{ errorLoadingRuntime }}</p>
      <p v-if="errorExecutingCode" class="error-message">Fehler bei der Code-Ausführung: {{ errorExecutingCode }}</p>
    </div>
    <div class="canvas-pane">
      <TurtleCanvas ref="turtleCanvasRef" />
    </div>
    <div class="controls-pane">
      <ControlPanel @run-code="runCode" @reset-canvas="resetCanvas" />
      <!-- ControlPanel kann Events für run und reset auslösen -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// import CodeEditor from '@/components/editor/CodeEditor.vue'; // Wird später richtig integriert
import TurtleCanvas from '@/components/turtle/TurtleCanvas.vue';
import ControlPanel from '@/components/controls/ControlPanel.vue';
import pythonRuntimeService from '@/services/PythonRuntimeService';
import turtleService from '@/services/TurtleService';

// Refs für Komponenten
// const codeEditorRef = ref<InstanceType<typeof CodeEditor> | null>(null); // Für den echten Editor
const turtleCanvasRef = ref<InstanceType<typeof TurtleCanvas> | null>(null);

// Zustand
const pythonCode = ref(`import turtle

# Zeichne ein Quadrat
turtle.forward(50)
turtle.left(90)
turtle.forward(50)
turtle.left(90)
turtle.forward(50)
turtle.left(90)
turtle.forward(50)
turtle.left(90)

turtle.penup()
turtle.goto(-100, 50)
turtle.pendown()
turtle.pencolor("blue")
turtle.circle(30)
`); // Beispielcode
const isLoadingRuntime = ref(true);
const isExecuting = ref(false);
const errorLoadingRuntime = ref<string | null>(null);
const errorExecutingCode = ref<string | null>(null);

onMounted(async () => {
  try {
    console.log('MainApplicationView: Mounting. Initializing Python Runtime...');
    await pythonRuntimeService.initialize();
    console.log('MainApplicationView: Python Runtime initialized. Initializing Turtle Service...');
    // Turtle Service wird nun intern von PythonRuntimeService initialisiert, wenn Pyodide bereit ist.
    // await turtleService.initialize(pythonRuntimeService.getPyodideInstance()); // Nicht mehr nötig, da TurtleService `ready` Event von PRS nutzt
    isLoadingRuntime.value = false;
    console.log('MainApplicationView: Python Runtime and Turtle Service should be ready.');
  } catch (error) {
    console.error('Fehler beim Initialisieren der Services:', error);
    errorLoadingRuntime.value = (error as Error).message || 'Unbekannter Fehler beim Initialisieren.';
    isLoadingRuntime.value = false;
  }
});

async function runCode() {
  if (isLoadingRuntime.value || isExecuting.value) return;

  // const codeToRun = codeEditorRef.value?.getCode(); // Wenn CodeEditor eine getCode Methode hat
  const codeToRun = pythonCode.value; // Nimmt Code aus der Textarea

  if (!codeToRun) {
    errorExecutingCode.value = 'Kein Code zum Ausführen vorhanden.';
    return;
  }

  isExecuting.value = true;
  errorExecutingCode.value = null;
  turtleCanvasRef.value?.reset(); // Canvas vor jeder Ausführung zurücksetzen

  try {
    console.log('MainApplicationView: Executing Python code...');
    const result = await pythonRuntimeService.runPythonCode(codeToRun);
    console.log('MainApplicationView: Python code execution result:', result);
    // Ergebnisbehandlung (z.B. Ausgabe in einer Konsole)
  } catch (error) {
    console.error('Fehler bei der Code-Ausführung:', error);
    errorExecutingCode.value = (error as Error).message || 'Unbekannter Fehler bei der Code-Ausführung.';
  } finally {
    isExecuting.value = false;
  }
}

function resetCanvas() {
  turtleCanvasRef.value?.reset();
  // Optional: Turtle-Zustand im Service auch zurücksetzen, falls notwendig
  // turtleService.reset(); // Bereits in TurtleCanvas.reset() enthalten
  errorExecutingCode.value = null; // Fehler bei der Codeausführung zurücksetzen
}

</script>

<style scoped>
.main-application-view {
  display: flex;
  height: calc(100vh - 60px); /* Höhe abzüglich Header, anpassen falls Header Höhe anders ist */
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  padding: 15px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.editor-pane textarea {
  width: 100%;
  flex-grow: 1;
  margin-bottom: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  font-family: monospace;
}

.editor-pane button {
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 5px;
  transition: background-color 0.2s;
}

.editor-pane button:hover {
  background-color: #0056b3;
}

.editor-pane button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.canvas-pane {
  flex: 2;
  padding: 10px;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #dee2e6;
  overflow: hidden; /* Verhindert, dass Canvas Scrollbalken im Pane erzeugt */
}

.controls-pane {
  flex: 1;
  padding: 15px;
  background-color: #f8f9fa;
  overflow-y: auto;
}

.error-message {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
}
</style>