<template>
  <div class="control-panel">
    <h3>Steuerung</h3>
    
    <div class="button-group">
      <button @click="emitRunCode" class="primary-button" :disabled="isExecuting">
        <div class="button-content">
          <span v-if="isExecuting" class="loading-spinner"></span>
          <span>{{ isExecuting ? 'Ausführung läuft...' : 'Code ausführen' }}</span>
        </div>
      </button>
      <button @click="emitStopExecution" class="stop-button" :disabled="!isExecuting">
        <div class="button-content">
          <span class="icon">⏹</span>
          <span>Stop</span>
        </div>
      </button>
      <button @click="emitResetCanvas" :disabled="isExecuting">
        <div class="button-content">
          <span class="icon">🔄</span>
          <span>Zurücksetzen</span>
        </div>
      </button>
    </div>

    <div class="control-group">
      <label for="speed">Animation:</label>
      <div class="speed-control">
        <span>Langsam</span>
        <input
          type="range"
          id="speed"
          name="speed"
          v-model="animationSpeed"
          min="1"
          max="10"
          @change="updateAnimationSpeed"
        >
        <span>Schnell</span>
      </div>
      <div class="speed-value">{{ animationSpeed }}</div>
    </div>
    
    <div class="control-group">
      <label>Ausführungsmodus:</label>
      <div class="execution-mode">
        <label class="radio-label">
          <input type="radio" v-model="executionMode" value="normal" :disabled="isExecuting">
          <span>Normal</span>
        </label>
        <label class="radio-label">
          <input type="radio" v-model="executionMode" value="step" :disabled="isExecuting">
          <span>Schrittweise</span>
        </label>
      </div>
      <button
        v-if="executionMode === 'step' && isStepMode"
        class="step-button"
        @click="emitNextStep"
        :disabled="!isExecuting"
      >
        Nächster Schritt
      </button>
    </div>

    <div class="status-panel" v-if="executionStatus">
      <div :class="['status-message', executionStatus.type]">
        <span class="status-icon">{{ executionStatus.type === 'error' ? '❌' : '✅' }}</span>
        <span>{{ executionStatus.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  isExecuting?: boolean;
  isStepMode?: boolean;
  executionStatus?: { type: 'error' | 'success' | 'info'; message: string } | null;
}>();

const emit = defineEmits([
  'run-code',
  'reset-canvas',
  'stop-execution',
  'update-animation-speed',
  'change-execution-mode',
  'next-step'
]);

const animationSpeed = ref(5);
const executionMode = ref('normal');

function emitRunCode() {
  emit('run-code', { mode: executionMode.value });
}

function emitResetCanvas() {
  emit('reset-canvas');
}

function emitStopExecution() {
  emit('stop-execution');
}

function updateAnimationSpeed() {
  emit('update-animation-speed', animationSpeed.value);
}

function emitNextStep() {
  emit('next-step');
}

watch(executionMode, (newMode) => {
  emit('change-execution-mode', newMode);
});
</script>

<style scoped>
/* Neues verbesserte CSS für das Kontrollpanel */
.control-panel {
  width: 100%;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.control-panel h3 {
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 10px;
  color: #343a40;
  text-align: center;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 0;
}

.control-panel button {
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 110px;
  font-weight: 500;
  display: flex;
  justify-content: center;
}

.control-panel button.primary-button {
  background-color: #28a745;
  flex: 2;
}

.control-panel button.stop-button {
  background-color: #dc3545;
}

.control-panel button.step-button {
  background-color: #0d6efd;
  margin-top: 8px;
  width: 100%;
}

.control-panel button:hover:not(:disabled) {
  filter: brightness(110%);
  transform: translateY(-1px);
}

.control-panel button:active:not(:disabled) {
  transform: translateY(0);
}

.control-panel button:disabled {
  background-color: #ced4da;
  cursor: not-allowed;
  opacity: 0.7;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.icon {
  font-size: 14px;
}

.control-group {
  margin-top: 0 !important;
  background-color: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  color: #495057;
  font-weight: 500;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.speed-control span {
  font-size: 0.8em;
  color: #6c757d;
  width: 50px;
}

.speed-control input[type="range"] {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #e9ecef;
  border-radius: 4px;
  outline: none;
}

.speed-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #0d6efd;
  border-radius: 50%;
  cursor: pointer;
}

.speed-value {
  text-align: center;
  font-weight: bold;
  padding: 4px;
  color: #0d6efd;
  margin-top: 6px;
  align-self: center;
}

.execution-mode {
  display: flex;
  gap: 20px;
  margin-top: 8px;
  justify-content: center;
  width: 100%;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  cursor: pointer;
}

.status-panel {
  margin-top: 0;
  padding: 10px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #e9ecef;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
}

.status-message.info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>