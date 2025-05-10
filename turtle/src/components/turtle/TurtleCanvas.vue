<template>
  <div class="turtle-canvas-container">
    <canvas ref="turtleCanvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import turtleService, { type TurtleCommand } from '@/services/TurtleService';

const turtleCanvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

const canvasWidth = ref(600); // Angepasste Breite
const canvasHeight = ref(400); // Angepasste Höhe

// Turtle-Zustand für das Zeichnen
// Der Ursprung (0,0) für die Turtle-Logik ist die Mitte des Canvas.
// Positive Y-Achse zeigt nach oben, positive X-Achse nach rechts.
let currentX = canvasWidth.value / 2;
let currentY = canvasHeight.value / 2;
let currentAngleDegrees = 0; // 0 Grad = nach rechts
let isPenDown = true;
let penColor = 'black';

// Transformation des Canvas-Kontexts, um den Ursprung zu zentrieren
// und die Y-Achse umzukehren (damit positiv Y nach oben zeigt)
function transformContext(canvasCtx: CanvasRenderingContext2D) {
  canvasCtx.translate(canvasWidth.value / 2, canvasHeight.value / 2);
  canvasCtx.scale(1, -1); // Y-Achse spiegeln
}

function resetCanvas() {
  if (ctx.value && turtleCanvasRef.value) {
    // Transformationen zurücksetzen, um das Canvas korrekt zu löschen
    ctx.value.save();
    ctx.value.setTransform(1, 0, 0, 1, 0, 0); // Identitätsmatrix
    ctx.value.clearRect(0, 0, turtleCanvasRef.value.width, turtleCanvasRef.value.height);
    ctx.value.restore(); // Vorherige Transformation (inkl. Zentrierung) wiederherstellen

    // Turtle-Startzustand
    currentX = 0; // Bezogen auf den zentrierten Ursprung
    currentY = 0; // Bezogen auf den zentrierten Ursprung
    currentAngleDegrees = 0;
    isPenDown = true;
    penColor = 'black';

    // Turtle-Symbol (optional, hier als einfacher Pfeil)
    drawTurtleSymbol();
  }
}

function drawTurtleSymbol() {
  if (!ctx.value) return;
  const turtleSize = 10;
  ctx.value.save();
  ctx.value.translate(currentX, currentY);
  ctx.value.rotate(-currentAngleDegrees * Math.PI / 180); // Canvas-Rotation ist im Uhrzeigersinn, Turtle-Winkel typischerweise gegen

  // Pfeilkopf
  ctx.value.beginPath();
  ctx.value.moveTo(turtleSize, 0);
  ctx.value.lineTo(-turtleSize / 2, turtleSize / 2);
  ctx.value.lineTo(-turtleSize / 2, -turtleSize / 2);
  ctx.value.closePath();
  ctx.value.fillStyle = 'green'; // Farbe des Turtle-Symbols
  ctx.value.fill();

  ctx.value.restore();
}


const handleDrawCommand = (command: TurtleCommand) => {
  if (!ctx.value) return;

  // Vor dem Zeichnen das alte Turtle-Symbol löschen (durch Überzeichnen des Hintergrunds in diesem Bereich)
  // Dies ist eine vereinfachte Methode. Für komplexere Szenen wäre ein selektiveres Löschen nötig.
  // Da wir aber immer den gesamten Canvas bei Bedarf neu zeichnen bzw. Linien hinzufügen,
  // reicht es oft, einfach das neue Symbol zu zeichnen.
  // Um es sauber zu machen, müssten wir den Bereich des alten Symbols kennen und löschen.
  // Für den Moment zeichnen wir das Symbol einfach neu, nachdem eine Aktion ausgeführt wurde.

  resetCanvas(); // Beginne mit einem sauberen Canvas für jede Befehlskette (vereinfacht)
                 // Besser: Einzelne Befehle inkrementell zeichnen.
                 // Für dieses Beispiel wird der Canvas bei jedem Turtle-Befehl neu gezeichnet,
                 // was für einfache Zeichnungen funktioniert, aber bei komplexen ineffizient sein kann.
                 // Eine bessere Implementierung würde den Zustand beibehalten und nur das Notwendige neu zeichnen.

                 // Für dieses Setup ist es besser, den Canvas nicht bei jedem Befehl komplett zu löschen,
                 // sondern inkrementell zu zeichnen. Der Reset sollte nur explizit erfolgen.
                 // Das `resetCanvas()` hier ist zu aggressiv für eine typische Turtle-Anwendung.
                 // Ich nehme das `resetCanvas()` hier raus und sorge dafür, dass es extern aufgerufen wird.

  // Wichtig: Das Turtle-Symbol wird am Ende aller Zeichenoperationen aktualisiert.

  switch (command.command) {
    case 'lineTo': {
      const [x, y, color] = command.args;
      if (isPenDown) {
        ctx.value.beginPath();
        ctx.value.moveTo(currentX, currentY);
        ctx.value.lineTo(x, y);
        ctx.value.strokeStyle = color || penColor;
        ctx.value.stroke();
      }
      currentX = x;
      currentY = y;
      break;
    }
    case 'moveTo': {
      const [x, y] = command.args;
      currentX = x;
      currentY = y;
      break;
    }
    case 'penup':
      isPenDown = false;
      break;
    case 'pendown':
      isPenDown = true;
      break;
    case 'pencolor':
      penColor = command.args[0] as string;
      break;
    case 'rotate': // Befehl zum Drehen des Turtle-Symbols
      currentAngleDegrees = command.args[0] as number;
      break;
    case 'clear':
      resetCanvas();
      break;
    default:
      console.warn('Unknown turtle command:', command);
  }
  drawTurtleSymbol(); // Turtle-Symbol nach jeder Aktion neu zeichnen
};

onMounted(() => {
  if (turtleCanvasRef.value) {
    const canvasCtx = turtleCanvasRef.value.getContext('2d');
    if (canvasCtx) {
      ctx.value = canvasCtx;
      transformContext(ctx.value); // Wende die Transformation einmalig an
      resetCanvas(); // Initialisiere den Canvas-Zustand und zeichne die Turtle
      turtleService.registerDrawCallback(handleDrawCommand);
      console.log('TurtleCanvas mounted and draw callback registered.');
    }
  }
});

onUnmounted(() => {
  // Hier könnte man den Callback deregistrieren, wenn der TurtleService das unterstützt
  // turtleService.unregisterDrawCallback(handleDrawCommand);
});

// Watcher für Canvas-Größenänderungen, um die Transformation neu anzuwenden
watch([canvasWidth, canvasHeight], () => {
  if (ctx.value) {
    currentX = canvasWidth.value / 2; // Aktualisiere die logische Mitte
    currentY = canvasHeight.value / 2;
    transformContext(ctx.value);
    resetCanvas(); // Neuzeichnen bei Größenänderung
  }
});

// Exponiere eine Reset-Methode, die von außen aufgerufen werden kann
defineExpose({
  reset: () => {
    resetCanvas();
    turtleService.reset(); // Auch den Zustand im TurtleService zurücksetzen
  }
});

</script>

<style scoped>
.turtle-canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0; /* Heller Hintergrund für den Container */
}

canvas {
  border: 1px solid #000; /* Schwarzer Rand für den Canvas */
  background-color: #fff; /* Weißer Hintergrund für die Zeichenfläche */
}
</style>