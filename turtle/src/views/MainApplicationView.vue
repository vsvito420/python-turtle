<template>
  <div class="main-application-view">
    <div class="left-panel">
      <div class="tabs">
        <button
          :class="['tab-button', { active: activeTab === 'editor' }]"
          @click="activeTab = 'editor'"
        >
          Editor
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'gallery' }]"
          @click="activeTab = 'gallery'"
        >
          Galerie
        </button>
      </div>

      <div v-if="activeTab === 'editor'" class="editor-pane">
        <h3>Python Code</h3>
        <CodeEditor v-model="pythonCode" language="python" class="code-editor-component" />
        <div class="execution-status" v-if="executionStatus">
          <div :class="['status-message', executionStatus.type]">
            <span class="status-icon">{{ executionStatus.type === 'error' ? '❌' : '✅' }}</span>
            <span>{{ executionStatus.message }}</span>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'gallery'" class="gallery-pane">
        <ExampleGallery @load-example="loadExampleCode" />
      </div>
    </div>

    <div class="right-panel">
      <div class="canvas-pane">
        <TurtleCanvas ref="turtleCanvasRef" />
      </div>
      <div class="controls-pane">
        <ControlPanel
          :is-executing="isExecuting"
          :is-step-mode="executionMode === 'step'"
          :execution-status="executionStatus"
          @run-code="runCode"
          @reset-canvas="resetCanvas"
          @stop-execution="stopExecution"
          @update-animation-speed="updateAnimationSpeed"
          @change-execution-mode="changeExecutionMode"
          @next-step="executeNextStep"
        />
      </div>
    </div>

    <div v-if="isLoadingRuntime" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Initialisiere Python-Runtime und Turtle-Modul...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
// Lazy-loaded Komponenten für bessere Performance
const CodeEditor = defineAsyncComponent(() => import('@/components/editor/CodeEditor.vue'));
import TurtleCanvas from '@/components/turtle/TurtleCanvas.vue';
import ControlPanel from '@/components/controls/ControlPanel.vue';
import ExampleGallery from '@/components/gallery/ExampleGallery.vue';
import pythonRuntimeService from '@/services/PythonRuntimeService';
import turtleService from '@/services/TurtleService';

// Refs für Komponenten
const turtleCanvasRef = ref<InstanceType<typeof TurtleCanvas> | null>(null);

// UI-Zustand
const activeTab = ref<'editor' | 'gallery'>('editor');
const animationSpeed = ref(5);
const executionMode = ref<'normal' | 'step'>('normal');

// Ausführungszustand
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
const isExecutionPaused = ref(false);
const currentStepIndex = ref(0);
const totalSteps = ref(0);
const executionSteps = ref<string[]>([]);

// Status und Fehlerhandling
const errorLoadingRuntime = ref<string | null>(null);
const errorExecutingCode = ref<string | null>(null);

// Berechneter Eigenschaftswert für den Ausführungsstatus
const executionStatus = computed(() => {
  if (errorExecutingCode.value) {
    return {
      type: 'error' as const,
      message: errorExecutingCode.value
    };
  }
  
  if (isExecuting.value) {
    return {
      type: 'info' as const,
      message: executionMode.value === 'step'
        ? `Schrittweise Ausführung: Schritt ${currentStepIndex.value} von ${totalSteps.value}`
        : 'Code wird ausgeführt...'
    };
  }
  
  return null;
});

// Hilfsfunktion zum Verzögern des Ladens (verbessert UX, indem ein zu schneller Loader vermieden wird)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

onMounted(async () => {
  try {
    console.log('MainApplicationView: Mounting. Initializing Python Runtime...');
    
    // Starte die Initialisierung des Python-Runtimes asynchron
    // Das Laden passiert jetzt lazy bei Bedarf dank der Optimierungen im PythonRuntimeService
    const runtimeInitPromise = pythonRuntimeService.initialize();
    
    // Zeige den Ladebildschirm für mindestens 500ms an, auch wenn das Laden schneller geht
    // Dies verhindert ein Flackern des Ladebildschirms bei schnellem Laden aus dem Cache
    await Promise.all([
      runtimeInitPromise,
      delay(500) // Minimale Anzeigezeit für den Ladebildschirm
    ]);
    
    console.log('MainApplicationView: Python Runtime initialized. Initializing Turtle Service...');
    isLoadingRuntime.value = false;
    
    // Animation-Geschwindigkeit setzen
    turtleService.setAnimationSpeed(animationSpeed.value);
    
    console.log('MainApplicationView: Python Runtime and Turtle Service ready.');
  } catch (error) {
    console.error('Fehler beim Initialisieren der Services:', error);
    errorLoadingRuntime.value = (error as Error).message || 'Unbekannter Fehler beim Initialisieren.';
    isLoadingRuntime.value = false;
  }
});

// Grundlegende Funktionen
async function runCode(options?: { mode?: 'normal' | 'step' }) {
  if (isLoadingRuntime.value || isExecuting.value) return;

  const codeToRun = pythonCode.value;
  if (!codeToRun) {
    errorExecutingCode.value = 'Kein Code zum Ausführen vorhanden.';
    return;
  }

  // Ausführungsmodus setzen
  if (options?.mode) {
    executionMode.value = options.mode;
  }

  isExecuting.value = true;
  errorExecutingCode.value = null;
  turtleCanvasRef.value?.reset(); // Canvas vor jeder Ausführung zurücksetzen

  try {
    console.log(`MainApplicationView: Executing Python code in ${executionMode.value} mode...`);
    
    if (executionMode.value === 'step') {
      // Code in Schritte aufteilen und den ersten Schritt ausführen
      executionSteps.value = codeToRun.split('\n').filter(line => line.trim() !== '');
      totalSteps.value = executionSteps.value.length;
      currentStepIndex.value = 0;
      await executeNextStep();
    } else {
      // Normaler Ausführungsmodus
      const result = await pythonRuntimeService.runPythonCode(codeToRun);
      console.log('MainApplicationView: Python code execution result:', result);
    }
  } catch (error) {
    console.error('Fehler bei der Code-Ausführung:', error);
    errorExecutingCode.value = (error as Error).message || 'Unbekannter Fehler bei der Code-Ausführung.';
  } finally {
    if (executionMode.value !== 'step') {
      isExecuting.value = false;
    }
  }
}

function resetCanvas() {
  turtleCanvasRef.value?.reset();
  errorExecutingCode.value = null;
}

// Erweiterte Funktionen
async function executeNextStep() {
  if (currentStepIndex.value >= executionSteps.value.length) {
    isExecuting.value = false;
    return;
  }

  try {
    const step = executionSteps.value[currentStepIndex.value];
    await pythonRuntimeService.runPythonCode(step);
    currentStepIndex.value++;
    
    // Prüfen, ob wir am Ende angelangt sind
    if (currentStepIndex.value >= executionSteps.value.length) {
      isExecuting.value = false;
    }
  } catch (error) {
    console.error('Fehler bei der schrittweisen Ausführung:', error);
    errorExecutingCode.value = (error as Error).message || 'Fehler bei der schrittweisen Ausführung.';
    isExecuting.value = false;
  }
}

function stopExecution() {
  if (!isExecuting.value) return;
  
  isExecuting.value = false;
  if (executionMode.value === 'step') {
    currentStepIndex.value = 0;
    totalSteps.value = 0;
    executionSteps.value = [];
  }
  // TODO: Implementiere eine echte Stopp-Funktionalität für die Python-Ausführung,
  // falls die laufende Ausführung tatsächlich unterbrochen werden kann
}

function updateAnimationSpeed(speed: number) {
  animationSpeed.value = speed;
  turtleService.setAnimationSpeed(speed);
}

function changeExecutionMode(mode: 'normal' | 'step') {
  executionMode.value = mode;
}

function loadExampleCode(code: string) {
  pythonCode.value = code;
  activeTab.value = 'editor'; // Wechsel zum Editor nach Laden eines Beispiels
}

</script>

<style scoped>
/* Loading-Animation für bessere UX */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}
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

.code-editor-component {
  width: 100%;
  flex-grow: 1;
  margin-bottom: 10px;
  /* Stile werden von der CodeEditor Komponente selbst gehandhabt oder hier angepasst */
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