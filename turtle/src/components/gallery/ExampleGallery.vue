<template>
  <div class="example-gallery">
    <h3>Beispiel-Galerie</h3>
    
    <div class="difficulty-tabs">
      <button 
        v-for="level in difficultyLevels" 
        :key="level.id"
        :class="['tab-button', { active: selectedDifficulty === level.id }]"
        @click="selectedDifficulty = level.id"
      >
        {{ level.name }}
      </button>
    </div>
    
    <div class="examples-container">
      <div v-if="filteredExamples.length === 0" class="no-examples">
        Keine Beispiele für diese Schwierigkeitsstufe vorhanden.
      </div>
      
      <div 
        v-for="example in filteredExamples" 
        :key="example.id"
        class="example-card"
        @click="selectExample(example)"
      >
        <div class="preview" :style="{ backgroundColor: example.previewBgColor || '#f0f0f0' }">
          <img v-if="example.previewImage" :src="example.previewImage" :alt="example.title">
          <div v-else class="preview-placeholder">{{ example.title.charAt(0) }}</div>
        </div>
        <div class="example-info">
          <h4>{{ example.title }}</h4>
          <p>{{ example.description }}</p>
          <div class="tag-container">
            <span class="difficulty-tag" :class="'difficulty-' + example.difficulty">
              {{ getDifficultyName(example.difficulty) }}
            </span>
            <span 
              v-for="tag in example.tags" 
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="selectedExample" class="example-preview-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ selectedExample.title }}</h3>
          <button @click="selectedExample = null" class="close-button">×</button>
        </div>
        <div class="modal-body">
          <div class="preview-image" :style="{ backgroundColor: selectedExample.previewBgColor || '#f0f0f0' }">
            <img v-if="selectedExample.previewImage" :src="selectedExample.previewImage" :alt="selectedExample.title">
            <div v-else class="preview-placeholder large">{{ selectedExample.title.charAt(0) }}</div>
          </div>
          <div class="example-details">
            <p>{{ selectedExample.description }}</p>
            <div class="tag-container">
              <span class="difficulty-tag" :class="'difficulty-' + selectedExample.difficulty">
                {{ getDifficultyName(selectedExample.difficulty) }}
              </span>
              <span 
                v-for="tag in selectedExample.tags" 
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
            <div class="code-preview">
              <pre><code>{{ selectedExample.code }}</code></pre>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="loadExample" class="load-button">Dieses Beispiel laden</button>
          <button @click="selectedExample = null" class="cancel-button">Abbrechen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Typdefinitionen für bessere TypeScript-Unterstützung
type DifficultyLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface DifficultyOption {
  id: DifficultyLevel;
  name: string;
}

interface Example {
  id: number;
  title: string;
  description: string;
  difficulty: Exclude<DifficultyLevel, 'all'>;
  tags: string[];
  previewBgColor: string;
  previewImage?: string;
  code: string;
}

const emit = defineEmits<{
  (e: 'load-example', code: string): void
}>();

// Definition der Schwierigkeitsstufen
const difficultyLevels: DifficultyOption[] = [
  { id: 'all', name: 'Alle' },
  { id: 'beginner', name: 'Anfänger' },
  { id: 'intermediate', name: 'Mittel' },
  { id: 'advanced', name: 'Fortgeschritten' },
];

const selectedDifficulty = ref<DifficultyLevel>('all');
const selectedExample = ref<Example | null>(null);

// Beispiel-Daten
const examples: Example[] = [
  {
    id: 1,
    title: 'Einfaches Quadrat',
    description: 'Zeichnet ein einfaches Quadrat mit der Turtle.',
    difficulty: 'beginner',
    tags: ['Grundformen', 'Schleifen'],
    previewBgColor: '#e6f7ff',
    code: `import turtle

# Zeichne ein einfaches Quadrat
for i in range(4):
    turtle.forward(100)
    turtle.right(90)
`
  },
  {
    id: 2,
    title: 'Bunte Spirale',
    description: 'Erstellt eine bunte Spirale mit zunehmender Größe.',
    difficulty: 'beginner',
    tags: ['Farben', 'Schleifen'],
    previewBgColor: '#fff0f6',
    code: `import turtle

# Bunte Spirale
colors = ['red', 'blue', 'green', 'purple', 'orange']
size = 1

for i in range(100):
    turtle.pencolor(colors[i % len(colors)])
    turtle.forward(size)
    turtle.right(91)
    size += 1
`
  },
  {
    id: 3,
    title: 'Sternenmuster',
    description: 'Zeichnet einen 5-zackigen Stern.',
    difficulty: 'beginner',
    tags: ['Grundformen', 'Winkel'],
    previewBgColor: '#fffbe6',
    code: `import turtle

# Zeichne einen 5-zackigen Stern
turtle.pencolor('gold')
turtle.pensize(3)

for i in range(5):
    turtle.forward(100)
    turtle.right(144)
`
  },
  {
    id: 4,
    title: 'Verschachtelte Quadrate',
    description: 'Zeichnet ineinander verschachtelte Quadrate in verschiedenen Farben.',
    difficulty: 'intermediate',
    tags: ['Verschachtelung', 'Farben'],
    previewBgColor: '#f0f5ff',
    code: `import turtle

# Verschachtelte Quadrate
colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']

for i in range(6):
    turtle.pencolor(colors[i])
    
    for j in range(4):
        turtle.forward(100 - i * 15)
        turtle.right(90)
    
    turtle.penup()
    turtle.forward(7.5)
    turtle.right(90)
    turtle.forward(7.5)
    turtle.left(90)
    turtle.pendown()
`
  },
  {
    id: 5,
    title: 'Regenbogen-Blume',
    description: 'Eine Blume aus Kreisen in Regenbogenfarben.',
    difficulty: 'intermediate',
    tags: ['Kreise', 'Farben'],
    previewBgColor: '#e6fffb',
    code: `import turtle

# Regenbogen-Blume
colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
turtle.speed(0)  # Maximale Geschwindigkeit

for i in range(70):
    turtle.pencolor(colors[i % len(colors)])
    turtle.circle(100)
    turtle.left(5)
`
  },
  {
    id: 6,
    title: 'Fraktaler Baum',
    description: 'Zeichnet einen fraktalen Baum mit rekursiver Funktion.',
    difficulty: 'advanced',
    tags: ['Rekursion', 'Fraktale'],
    previewBgColor: '#f0fff0',
    code: `import turtle

# Fraktaler Baum-Code
turtle.left(90)
turtle.penup()
turtle.goto(0, -200)
turtle.pendown()

def draw_branch(branch_length, level):
    if level > 0:
        # Farbe des Astes basierend auf der Ebene
        turtle.pencolor('brown' if level < 3 else 'green')
        turtle.pensize(level * 2)
        
        turtle.forward(branch_length)
        turtle.right(30)
        draw_branch(branch_length * 0.7, level - 1)
        turtle.left(60)
        draw_branch(branch_length * 0.7, level - 1)
        turtle.right(30)
        turtle.penup()
        turtle.backward(branch_length)
        turtle.pendown()

# Baum mit 5 Rekursionsstufen zeichnen
turtle.pencolor('brown')
draw_branch(80, 5)
`
  },
  {
    id: 7,
    title: 'Sierpinski-Dreieck',
    description: 'Ein fraktales Muster aus sich wiederholenden Dreiecken.',
    difficulty: 'advanced',
    tags: ['Rekursion', 'Fraktale', 'Mathematik'],
    previewBgColor: '#f9f0ff',
    code: `import turtle

# Sierpinski-Dreieck
turtle.speed(0)
turtle.penup()
turtle.goto(-150, -130)
turtle.pendown()

def draw_sierpinski(length, depth):
    if depth == 0:
        # Zeichne ein ausgefülltes Dreieck
        turtle.begin_fill()
        for i in range(3):
            turtle.forward(length)
            turtle.left(120)
        turtle.end_fill()
    else:
        # Rekursive Aufrufe für die Unterteilungen
        draw_sierpinski(length/2, depth-1)
        turtle.penup()
        turtle.forward(length/2)
        turtle.pendown()
        draw_sierpinski(length/2, depth-1)
        turtle.penup()
        turtle.left(120)
        turtle.forward(length/2)
        turtle.right(120)
        turtle.pendown()
        draw_sierpinski(length/2, depth-1)
        turtle.penup()
        turtle.right(120)
        turtle.forward(length/2)
        turtle.left(120)
        turtle.pendown()

# Zeichne das Sierpinski-Dreieck mit Tiefe 4
turtle.fillcolor('purple')
draw_sierpinski(300, 4)
`
  },
];

// Gefilterte Beispiele basierend auf Schwierigkeitsgrad
const filteredExamples = computed<Example[]>(() => {
  if (selectedDifficulty.value === 'all') {
    return examples;
  }
  return examples.filter(example => example.difficulty === selectedDifficulty.value);
});

function getDifficultyName(difficulty: DifficultyLevel): string {
  const level = difficultyLevels.find(level => level.id === difficulty);
  return level ? level.name : difficulty;
}

function selectExample(example: Example): void {
  selectedExample.value = example;
}

function loadExample(): void {
  if (selectedExample.value) {
    emit('load-example', selectedExample.value.code);
    selectedExample.value = null;
  }
}
</script>

<style scoped>
.example-gallery {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.example-gallery h3 {
  margin-top: 0;
  text-align: center;
  color: #343a40;
  margin-bottom: 15px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 10px;
}

.difficulty-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
  justify-content: center;
}

.tab-button {
  padding: 8px 12px;
  background-color: #e9ecef;
  color: #495057;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: #dee2e6;
}

.tab-button.active {
  background-color: #28a745;
  color: white;
}

.examples-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  overflow-y: auto;
}

.example-card {
  width: calc(50% - 10px);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .example-card {
    width: 100%;
  }
}

.example-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #28a745;
  color: white;
  font-size: 30px;
  border-radius: 50%;
  font-weight: bold;
}

.preview-placeholder.large {
  width: 100px;
  height: 100px;
  font-size: 50px;
}

.preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.example-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.example-info h4 {
  margin: 0;
  color: #343a40;
}

.example-info p {
  margin: 5px 0 10px;
  color: #6c757d;
  font-size: 0.9em;
  line-height: 1.3;
}

.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.tag {
  padding: 2px 8px;
  background-color: #e9ecef;
  color: #495057;
  border-radius: 20px;
  font-size: 0.8em;
}

.difficulty-tag {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.8em;
}

.difficulty-beginner {
  background-color: #d4edda;
  color: #155724;
}

.difficulty-intermediate {
  background-color: #fff3cd;
  color: #856404;
}

.difficulty-advanced {
  background-color: #f8d7da;
  color: #721c24;
}

.no-examples {
  width: 100%;
  padding: 20px;
  text-align: center;
  color: #6c757d;
  background-color: white;
  border-radius: 8px;
}

/* Modal Styles */
.example-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
  color: #343a40;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
}

.close-button:hover {
  color: #343a40;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.preview-image {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.example-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.code-preview {
  background-color: #282c34;
  border-radius: 8px;
  overflow: auto;
  padding: 15px;
  margin-top: 10px;
}

.code-preview pre {
  margin: 0;
}

.code-preview code {
  color: #abb2bf;
  font-family: monospace;
  white-space: pre;
}

.modal-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #dee2e6;
}

.load-button {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-button:hover {
  background-color: #218838;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #5a6268;
}
</style>