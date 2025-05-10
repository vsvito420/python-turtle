<template>
  <div class="control-panel">
    <p>Steuerung</p>
    <button @click="emitRunCode">Code ausführen</button>
    <button @click="emitResetCanvas">Canvas zurücksetzen</button>
    <button disabled>Stop (zukünftig)</button>
    <div>
      <label for="speed">Geschwindigkeit:</label>
      <input type="range" id="speed" name="speed" min="1" max="10" value="5" disabled>
      <span>(zukünftig)</span>
    </div>
    <!-- Zukünftige Steuerelemente können hier hinzugefügt werden -->
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['run-code', 'reset-canvas']);

function emitRunCode() {
  emit('run-code');
}

function emitResetCanvas() {
  emit('reset-canvas');
}

// Zukünftige Logik für das Steuerungspanel, z.B. für Geschwindigkeit, Stop-Funktion etc.
</script>

<style scoped>
.control-panel {
  width: 100%;
  padding: 15px;
  box-sizing: border-box; /* Stellt sicher, dass Padding die Gesamtbreite nicht erhöht */
  display: flex;
  flex-direction: column;
  align-items: stretch; /* Buttons sollen sich der Breite anpassen, wenn gewünscht, oder zentriert bleiben */
  gap: 10px; /* Abstand zwischen den Elementen */
  background-color: #f8f9fa; /* Konsistent mit editor-pane */
}

.control-panel p {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  color: #343a40;
}

.control-panel button {
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-panel button:hover:not(:disabled) {
  background-color: #5a6268;
}

.control-panel button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
}

.control-panel div {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Label und Input/span verteilen */
}

.control-panel label {
  margin-right: 10px;
  color: #495057;
}

.control-panel input[type="range"] {
  flex-grow: 1;
}

.control-panel span {
  font-size: 0.8em;
  color: #6c757d;
}
</style>