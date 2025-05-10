<template>
  <div id="app-container">
    <AppHeader />
    <main class="app-content">
      <RouterView />
    </main>
    <footer class="app-footer">
      <p>&copy; 2025 Python Turtle im Browser</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/layout/AppHeader.vue';
</script>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Nimmt die gesamte Bildschirmhöhe ein */
  background-color: #f4f4f4; /* Ein heller Hintergrund für den gesamten Container */
}

.app-content {
  flex-grow: 1; /* Erlaubt dem Main-Bereich zu wachsen und den Footer nach unten zu schieben */
  display: flex; /* Wichtig, damit RouterView wachsen kann */
  flex-direction: column; /* Stellt sicher, dass der Inhalt innerhalb von app-content vertikal gestapelt wird */
  padding: 0; /* Entferne Padding, damit MainApplicationView den vollen Platz nutzen kann */
  margin: 0;
}

.app-footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 10px 0;
  height: 50px; /* Feste Höhe für den Footer */
  flex-shrink: 0; /* Verhindert, dass der Footer schrumpft */
}

/* Globale Styles, die vorher in App.vue waren, könnten hier oder in main.css sein.
   Für dieses Beispiel nehmen wir an, dass globale Styles in main.css verwaltet werden. */
</style>

<style>
/* Globale Styles - setze grundlegende HTML- und Body-Styles für Konsistenz */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Arial', sans-serif; /* Beispiel für eine globale Schriftart */
}

#app { /* Standard-ID von Vue-Projekten, stelle sicher, dass sie die volle Höhe einnimmt */
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
