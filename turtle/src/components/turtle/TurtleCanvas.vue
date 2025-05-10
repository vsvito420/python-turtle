<template>
  <div 
    class="turtle-canvas-container" 
    @wheel.prevent="handleWheel" 
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas ref="turtleCanvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
    <div class="controls-overlay">
      <div class="view-controls">
        <button @click="zoomIn" title="Zoom In">➕</button>
        <button @click="zoomOut" title="Zoom Out">➖</button>
        <button @click="resetZoomAndPan" title="Reset View">🔄</button>
        <button @click="toggleGrid" :class="{ active: showGrid }" title="Toggle Grid">▦</button>
        <button @click="toggleAxes" :class="{ active: showAxes }" title="Toggle Axes">✛</button>
      </div>
      <div class="export-controls">
        <button @click="exportToPNG" title="Export as PNG">PNG</button>
        <button @click="exportToSVG" title="Export as SVG">SVG</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import turtleService, { type TurtleCommand } from '@/services/TurtleService';

const turtleCanvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

const canvasWidth = ref(600);
const canvasHeight = ref(400);

const scale = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);

const showGrid = ref(true);
const showAxes = ref(true);

let currentX = 0; 
let currentY = 0; 
let currentAngleDegrees = 0;
let isPenDown = true;
let penColor = 'black';
let animationSpeed = 5; // Animationsgeschwindigkeit
let turtlePath: TurtleCommand[] = [];

function applyTransformations(canvasCtx: CanvasRenderingContext2D, forExport: boolean = false) {
  canvasCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset
  if (forExport) {
    // Für den Export nur die zentrierende Transformation und Y-Spiegelung
    canvasCtx.translate(canvasWidth.value / 2, canvasHeight.value / 2);
    canvasCtx.scale(1, -1);
  } else {
    // Für die Anzeige: Pan, Zoom und Y-Spiegelung
    canvasCtx.translate(canvasWidth.value / 2 + panX.value, canvasHeight.value / 2 + panY.value);
    canvasCtx.scale(scale.value, scale.value);
    canvasCtx.scale(1, -1); 
  }
}

function drawGrid(canvasCtx: CanvasRenderingContext2D) {
  if (!showGrid.value) return;
  const gridSize = 50;
  const scaledGridSize = gridSize * scale.value;
  if (scaledGridSize < 5 && !ctx.value) return; // Verhindere Überlastung, aber erlaube für Export

  canvasCtx.save();
  canvasCtx.setTransform(1, 0, 0, 1, 0, 0); 

  canvasCtx.strokeStyle = '#cccccc';
  const currentLineWidth = ctx.value ? 0.5 / scale.value : 0.5; // Dünner für Export
  canvasCtx.lineWidth = Math.max(0.1, currentLineWidth); // Mindestbreite sicherstellen


  const startX = ctx.value ? (panX.value % scaledGridSize) - scaledGridSize + canvasWidth.value / 2 : 0;
  const startY = ctx.value ? (panY.value % scaledGridSize) - scaledGridSize + canvasHeight.value / 2 : 0;
  const endX = ctx.value ? canvasWidth.value + scaledGridSize : canvasWidth.value;
  const endY = ctx.value ? canvasHeight.value + scaledGridSize : canvasHeight.value;
  const step = ctx.value ? scaledGridSize : gridSize;


  for (let x = startX; x <= endX; x += step) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, 0);
    canvasCtx.lineTo(x, canvasHeight.value);
    canvasCtx.stroke();
  }
  for (let y = startY; y <= endY; y += step) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, y);
    canvasCtx.lineTo(canvasWidth.value, y);
    canvasCtx.stroke();
  }
  canvasCtx.restore();
}

function drawAxes(canvasCtx: CanvasRenderingContext2D) {
  if (!showAxes.value) return;
  canvasCtx.save();
  applyTransformations(canvasCtx, !ctx.value); // Nutze Export-Transformation wenn ctx nicht gesetzt (Offline-Canvas)

  const lineWidth = ctx.value ? 1 / scale.value : 1;
  canvasCtx.lineWidth = Math.max(0.2, lineWidth);

  // Sichtbarer Bereich im logischen Koordinatensystem
  const logicalViewWidth = canvasWidth.value / (ctx.value ? scale.value : 1);
  const logicalViewHeight = canvasHeight.value / (ctx.value ? scale.value : 1);
  const logicalPanX = ctx.value ? panX.value / scale.value : 0;
  const logicalPanY = ctx.value ? panY.value / scale.value : 0;

  const xMin = -logicalViewWidth / 2 - logicalPanX;
  const xMax = logicalViewWidth / 2 - logicalPanX;
  const yMin = -logicalViewHeight / 2 + logicalPanY; // Hier y-Achse umgekehrt denken für min/max
  const yMax = logicalViewHeight / 2 + logicalPanY;


  canvasCtx.strokeStyle = '#ff0000';
  canvasCtx.beginPath();
  canvasCtx.moveTo(xMin, 0);
  canvasCtx.lineTo(xMax, 0);
  canvasCtx.stroke();

  canvasCtx.strokeStyle = '#0000ff';
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, yMin);
  canvasCtx.lineTo(0, yMax);
  canvasCtx.stroke();
  
  const fontSize = ctx.value ? 12 / scale.value : 12;
  if (fontSize > 1) { // Nur zeichnen, wenn Schrift lesbar
    canvasCtx.fillStyle = 'black';
    canvasCtx.font = `${fontSize}px Arial`;
    canvasCtx.save(); // Für Text nicht spiegeln
    canvasCtx.scale(1, -1); 
    canvasCtx.textAlign = 'left';
    canvasCtx.fillText('X', xMax - (ctx.value ? 20 / scale.value : 20), (ctx.value ? -5 / scale.value : -5));
    canvasCtx.textAlign = 'center';
    canvasCtx.fillText('Y', (ctx.value ? 5 / scale.value : 5), -yMax + (ctx.value ? 20 / scale.value : 20));
    canvasCtx.restore();
  }
  canvasCtx.restore();
}

function drawTurtlePath(canvasCtx: CanvasRenderingContext2D, path: TurtleCommand[], isExport: boolean = false) {
  let tempX = 0, tempY = 0, tempPenDown = true, tempPenColor = 'black';
  const lineWidth = isExport ? 1 : (ctx.value ? 1 / scale.value : 1);

  path.forEach(command => {
    switch (command.command) {
      case 'lineTo': {
        const [x, y, color] = command.args;
        if (tempPenDown) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(tempX, tempY);
          canvasCtx.lineTo(x, y);
          canvasCtx.strokeStyle = color || tempPenColor;
          canvasCtx.lineWidth = Math.max(0.2, lineWidth);
          canvasCtx.stroke();
        }
        tempX = x; tempY = y;
        break;
      }
      case 'moveTo': tempX = command.args[0]; tempY = command.args[1]; break;
      case 'penup': tempPenDown = false; break;
      case 'pendown': tempPenDown = true; break;
      case 'pencolor': tempPenColor = command.args[0] as string; break;
      case 'rotate': /* Winkel wird für Pfad nicht direkt gezeichnet */ break;
    }
  });
}

function drawTurtleSymbolOnContext(canvasCtx: CanvasRenderingContext2D, x: number, y: number, angle: number, isExport: boolean = false) {
  const symbolScale = isExport ? 1 : (ctx.value ? scale.value : 1);
  const turtleSize = 10 / symbolScale; 
  canvasCtx.save();
  canvasCtx.translate(x, y);
  canvasCtx.rotate(-angle * Math.PI / 180); 

  canvasCtx.beginPath();
  canvasCtx.moveTo(turtleSize, 0);
  canvasCtx.lineTo(-turtleSize / 2, turtleSize / 2);
  canvasCtx.lineTo(-turtleSize / 2, -turtleSize / 2);
  canvasCtx.closePath();
  canvasCtx.fillStyle = 'green';
  canvasCtx.fill();
  canvasCtx.restore();
}

function redrawAll(targetCtx: CanvasRenderingContext2D | null = ctx.value, forExport: boolean = false) {
  if (!targetCtx || !turtleCanvasRef.value) return; // turtleCanvasRef für Maße benötigt

  targetCtx.save();
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
  targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
  targetCtx.restore();

  if (forExport || showGrid.value) drawGrid(targetCtx);
  
  applyTransformations(targetCtx, forExport);
  if (forExport || showAxes.value) drawAxes(targetCtx);
  
  drawTurtlePath(targetCtx, turtlePath, forExport);
  drawTurtleSymbolOnContext(targetCtx, currentX, currentY, currentAngleDegrees, forExport);
}

function resetCanvasStateAndPath() {
  currentX = 0; currentY = 0; currentAngleDegrees = 0;
  isPenDown = true; penColor = 'black';
  // Animationsgeschwindigkeit beibehalten
  turtlePath = [];
  redrawAll();
}

const handleDrawCommand = (command: TurtleCommand) => {
  if (!ctx.value) return;
  switch (command.command) {
    case 'lineTo':
      turtlePath.push(command); currentX = command.args[0]; currentY = command.args[1];
      if (command.args[2]) penColor = command.args[2]; break;
    case 'moveTo':
      turtlePath.push(command); currentX = command.args[0]; currentY = command.args[1]; break;
    case 'penup': isPenDown = false; turtlePath.push(command); break;
    case 'pendown': isPenDown = true; turtlePath.push(command); break;
    case 'pencolor': penColor = command.args[0] as string; turtlePath.push(command); break;
    case 'rotate': currentAngleDegrees = command.args[0] as number; turtlePath.push(command); break;
    case 'animationSpeed':
      animationSpeed = command.args[0] as number;
      turtlePath.push(command);
      break;
    case 'clear': resetCanvasStateAndPath(); return;
    default: console.warn('Unknown turtle command:', command); return;
  }
  
  // Redraw mit Verzögerung basierend auf der Animationsgeschwindigkeit
  if (animationSpeed === 0) {
    // Sofortige Ausführung ohne Verzögerung
    redrawAll();
  } else {
    // Verzögerung basierend auf der Animationsgeschwindigkeit (invertiert)
    const delay = Math.max(20, 300 - animationSpeed * 30); // 20ms (schnell) bis 300ms (langsam)
    setTimeout(() => redrawAll(), delay);
  }
};

function handleWheel(event: WheelEvent) {
  const zoomIntensity = 0.1;
  const delta = event.deltaY > 0 ? -zoomIntensity : zoomIntensity;
  const oldScale = scale.value;
  
  const rect = turtleCanvasRef.value!.getBoundingClientRect();
  const mouseXCanvas = event.clientX - rect.left;
  const mouseYCanvas = event.clientY - rect.top;  
  
  const logicalMouseX = (mouseXCanvas - (canvasWidth.value / 2 + panX.value)) / oldScale;
  const logicalMouseY = ((mouseYCanvas - (canvasHeight.value / 2 + panY.value)) / oldScale) * -1;

  scale.value = Math.max(0.1, Math.min(10, scale.value * (1 + delta)));

  panX.value = mouseXCanvas - canvasWidth.value / 2 - logicalMouseX * scale.value;
  panY.value = (mouseYCanvas - canvasHeight.value / 2 - logicalMouseY * scale.value * -1) ; 

  redrawAll();
}

function handleMouseDown(event: MouseEvent) {
  if (event.button === 0) {
    isPanning.value = true; lastMouseX.value = event.clientX; lastMouseY.value = event.clientY;
    turtleCanvasRef.value!.style.cursor = 'grabbing';
  }
}
function handleMouseMove(event: MouseEvent) {
  if (isPanning.value) {
    const dx = event.clientX - lastMouseX.value; const dy = event.clientY - lastMouseY.value;
    panX.value += dx; panY.value += dy;
    lastMouseX.value = event.clientX; lastMouseY.value = event.clientY;
    redrawAll();
  }
}
function handleMouseUp() {
  if (isPanning.value) { isPanning.value = false; turtleCanvasRef.value!.style.cursor = 'grab';}
}

function zoomIn() { scale.value = Math.min(10, scale.value * 1.2); redrawAll(); }
function zoomOut() { scale.value = Math.max(0.1, scale.value / 1.2); redrawAll(); }
function resetZoomAndPan() { scale.value = 1; panX.value = 0; panY.value = 0; redrawAll(); }
function toggleGrid() { showGrid.value = !showGrid.value; redrawAll(); }
function toggleAxes() { showAxes.value = !showAxes.value; redrawAll(); }

function exportToPNG() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvasWidth.value;
  tempCanvas.height = canvasHeight.value;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    // Hintergrundfarbe für den Export setzen
    tempCtx.fillStyle = '#ffffff'; // Weißer Hintergrund
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    redrawAll(tempCtx, true); // Zeichne auf den temporären Canvas für den Export
    
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'turtle_drawing.png';
    link.click();
  }
}

function escapeSVG(value: any): string {
    return String(value).replace(/&/g, '&amp;') // & zuerst escapen, falls es bereits escaped ist
                        
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&apos;')
}

function exportToSVG() {
  let svgContent = `<svg width="${canvasWidth.value}" height="${canvasHeight.value}" xmlns="http://www.w3.org/2000/svg">`;
  // Hintergrund
  svgContent += `<rect width="100%" height="100%" fill="#ffffff"/>`;

  // Transformation für das SVG-Koordinatensystem (Ursprung in der Mitte, Y nach oben)
  const transform = `translate(${canvasWidth.value / 2}, ${canvasHeight.value / 2}) scale(1, -1)`;
  svgContent += `<g transform="${transform}">`;

  // Grid (optional, kann SVG sehr groß machen)
  if (showGrid.value) {
    const gridSize = 50;
    svgContent += `<g stroke="#cccccc" stroke-width="0.5">`;
    for (let x = -canvasWidth.value / 2; x < canvasWidth.value / 2; x += gridSize) {
      svgContent += `<line x1="${x}" y1="${-canvasHeight.value / 2}" x2="${x}" y2="${canvasHeight.value / 2}" />`;
    }
    for (let y = -canvasHeight.value / 2; y < canvasHeight.value / 2; y += gridSize) {
      svgContent += `<line x1="${-canvasWidth.value / 2}" y1="${y}" x2="${canvasWidth.value / 2}" y2="${y}" />`;
    }
    svgContent += `</g>`;
  }

  // Axes
  if (showAxes.value) {
    svgContent += `<g stroke-width="1">`;
    svgContent += `<line x1="${-canvasWidth.value / 2}" y1="0" x2="${canvasWidth.value / 2}" y2="0" stroke="#ff0000" />`; // X-Achse
    svgContent += `<line x1="0" y1="${-canvasHeight.value / 2}" x2="0" y2="${canvasHeight.value / 2}" stroke="#0000ff" />`; // Y-Achse
    // Achsenbeschriftungen (einfach)
    svgContent += `<text x="${canvasWidth.value / 2 - 20}" y="-5" style="font-family: Arial; font-size: 12px; transform: scale(1, -1);">X</text>`;
    svgContent += `<text x="5" y="${-(canvasHeight.value / 2 - 20)}" style="font-family: Arial; font-size: 12px; transform: scale(1, -1);">Y</text>`;
    svgContent += `</g>`;
  }
  
  // Turtle Path
  let tempX = 0, tempY = 0, tempPenDown = true, tempPenColor = 'black';
  turtlePath.forEach(command => {
    switch (command.command) {
      case 'lineTo': {
        const [x, y, color] = command.args;
        if (tempPenDown) {
          svgContent += `<line x1="${tempX}" y1="${tempY}" x2="${x}" y2="${y}" stroke="${escapeSVG(color || tempPenColor)}" stroke-width="1" />`;
        }
        tempX = x; tempY = y;
        break;
      }
      case 'moveTo': tempX = command.args[0]; tempY = command.args[1]; break;
      case 'penup': tempPenDown = false; break;
      case 'pendown': tempPenDown = true; break;
      case 'pencolor': tempPenColor = command.args[0] as string; break;
    }
  });

  // Turtle Symbol
  const turtleSize = 10;
  svgContent += `<g transform="translate(${currentX}, ${currentY}) rotate(${-currentAngleDegrees})">`;
  svgContent += `<polygon points="${turtleSize},0 -${turtleSize/2},${turtleSize/2} -${turtleSize/2},-${turtleSize/2}" fill="green" />`;
  svgContent += `</g>`;

  svgContent += `</g></svg>`;

  const dataURL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent);
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'turtle_drawing.svg';
  link.click();
}


onMounted(() => {
  if (turtleCanvasRef.value) {
    const canvasCtx = turtleCanvasRef.value.getContext('2d');
    if (canvasCtx) {
      ctx.value = canvasCtx;
      turtleCanvasRef.value.style.cursor = 'grab';
      resetZoomAndPan(); resetCanvasStateAndPath();
      turtleService.registerDrawCallback(handleDrawCommand);
    }
  }
});
onUnmounted(() => {});
watch([canvasWidth, canvasHeight], () => { resetZoomAndPan(); resetCanvasStateAndPath(); });

defineExpose({ reset: () => { resetZoomAndPan(); resetCanvasStateAndPath(); turtleService.reset(); }});
</script>

<style scoped>
.turtle-canvas-container {
  width: 100%; height: 100%; display: flex; align-items: center;
  justify-content: center; background-color: #e0e0e0;
  position: relative; overflow: hidden; 
}
canvas { border: 1px solid #333; background-color: #fff; }

.controls-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px; /* Größerer Abstand zwischen den Gruppen */
  z-index: 10;
}

.view-controls, .export-controls {
  display: flex;
  flex-direction: column; /* Buttons untereinander in Gruppen */
  gap: 6px; /* Kleinerer Abstand innerhalb der Gruppen */
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.8); /* Halbtransparenter Hintergrund */
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.controls-overlay button {
  padding: 7px 10px; background-color: #007bff; color: white;
  border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;
  transition: background-color 0.2s ease;
  display: flex; /* Für bessere Ausrichtung von Icon/Text */
  align-items: center;
  justify-content: center;
}
.controls-overlay button:hover { background-color: #0056b3; }
.controls-overlay button.active { background-color: #0056b3; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); }
</style>