<template>
  <div ref="editorContainer" class="code-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

// Definieren der Props und Emits
const props = defineProps<{
  modelValue: string;
  language?: string;
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

// Grundlegende Turtle-Befehle für Autovervollständigung
// Ein verbessertes Array von Turtle-Befehlen für Autovervollständigung mit Beschreibungen und Beispielen
const turtleCommands = [
  {
    label: 'forward',
    detail: 'Bewegt die Schildkröte vorwärts',
    documentation: 'forward(distance) - Bewegt die Schildkröte um die angegebene Distanz vorwärts',
    insertText: 'forward(${1:distance})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'backward',
    detail: 'Bewegt die Schildkröte rückwärts',
    documentation: 'backward(distance) - Bewegt die Schildkröte um die angegebene Distanz rückwärts',
    insertText: 'backward(${1:distance})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'right',
    detail: 'Dreht die Schildkröte nach rechts',
    documentation: 'right(angle) - Dreht die Schildkröte um den angegebenen Winkel nach rechts',
    insertText: 'right(${1:angle})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'left',
    detail: 'Dreht die Schildkröte nach links',
    documentation: 'left(angle) - Dreht die Schildkröte um den angegebenen Winkel nach links',
    insertText: 'left(${1:angle})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'penup',
    detail: 'Hebt den Stift an',
    documentation: 'penup() - Hebt den Stift an, sodass die Schildkröte keine Linien mehr zeichnet',
    insertText: 'penup()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'pendown',
    detail: 'Setzt den Stift ab',
    documentation: 'pendown() - Setzt den Stift ab, sodass die Schildkröte beim Bewegen Linien zeichnet',
    insertText: 'pendown()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'speed',
    detail: 'Setzt die Zeichengeschwindigkeit',
    documentation: 'speed(s) - Setzt die Zeichengeschwindigkeit: 1=langsam, 10=schnell, 0=maximale Geschwindigkeit',
    insertText: 'speed(${1:1-10})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'pencolor',
    detail: 'Setzt die Stiftfarbe',
    documentation: 'pencolor(color) - Setzt die Stiftfarbe, z.B. "red", "blue", oder "#FF0000"',
    insertText: 'pencolor("${1:color}")',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'pensize',
    detail: 'Setzt die Stiftdicke',
    documentation: 'pensize(width) - Setzt die Breite des Stifts',
    insertText: 'pensize(${1:width})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'circle',
    detail: 'Zeichnet einen Kreis',
    documentation: 'circle(radius) - Zeichnet einen Kreis mit dem angegebenen Radius',
    insertText: 'circle(${1:radius})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'dot',
    detail: 'Zeichnet einen Punkt',
    documentation: 'dot(size, color) - Zeichnet einen Punkt mit der angegebenen Größe und Farbe',
    insertText: 'dot(${1:size}, "${2:color}")',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'begin_fill',
    detail: 'Beginnt ein Füllmuster',
    documentation: 'begin_fill() - Beginnt ein Füllmuster, das mit end_fill() abgeschlossen wird',
    insertText: 'begin_fill()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'end_fill',
    detail: 'Beendet ein Füllmuster',
    documentation: 'end_fill() - Beendet ein Füllmuster und füllt die Form',
    insertText: 'end_fill()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'fillcolor',
    detail: 'Setzt die Füllfarbe',
    documentation: 'fillcolor(color) - Setzt die Füllfarbe für begin_fill()/end_fill()',
    insertText: 'fillcolor("${1:color}")',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'goto',
    detail: 'Bewegt die Schildkröte zu einer Position',
    documentation: 'goto(x, y) - Bewegt die Schildkröte zu den angegebenen Koordinaten',
    insertText: 'goto(${1:x}, ${2:y})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'setx',
    detail: 'Setzt die X-Koordinate',
    documentation: 'setx(x) - Setzt die X-Koordinate der Schildkröte',
    insertText: 'setx(${1:x})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'sety',
    detail: 'Setzt die Y-Koordinate',
    documentation: 'sety(y) - Setzt die Y-Koordinate der Schildkröte',
    insertText: 'sety(${1:y})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'setheading',
    detail: 'Setzt die Richtung der Schildkröte',
    documentation: 'setheading(angle) - Setzt die Richtung der Schildkröte (0=Osten, 90=Norden, 180=Westen, 270=Süden)',
    insertText: 'setheading(${1:angle})',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'home',
    detail: 'Bewegt die Schildkröte zur Startposition',
    documentation: 'home() - Bewegt die Schildkröte zur Startposition (0,0) mit Richtung 0',
    insertText: 'home()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'clear',
    detail: 'Löscht die Zeichnung',
    documentation: 'clear() - Löscht alle Zeichnungen auf der Zeichenfläche',
    insertText: 'clear()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'reset',
    detail: 'Setzt alles zurück',
    documentation: 'reset() - Setzt die Schildkröte und die Zeichenfläche zurück',
    insertText: 'reset()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'hideturtle',
    detail: 'Versteckt die Schildkröte',
    documentation: 'hideturtle() - Versteckt die Schildkröte (beschleunigt die Animation)',
    insertText: 'hideturtle()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'showturtle',
    detail: 'Zeigt die Schildkröte',
    documentation: 'showturtle() - Zeigt die Schildkröte an',
    insertText: 'showturtle()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'bgcolor',
    detail: 'Setzt die Hintergrundfarbe',
    documentation: 'bgcolor(color) - Setzt die Hintergrundfarbe der Zeichenfläche',
    insertText: 'bgcolor("${1:color}")',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'undo',
    detail: 'Macht den letzten Schritt rückgängig',
    documentation: 'undo() - Macht den letzten Turtle-Befehl rückgängig',
    insertText: 'undo()',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  }
];

// Code-Snippets für häufige Turtle-Operationen
const turtleSnippets = [
  {
    label: 'turtle-square',
    detail: 'Zeichnet ein Quadrat',
    documentation: 'Zeichnet ein einfaches Quadrat mit der angegebenen Seitenlänge',
    insertText: [
      '# Zeichne ein Quadrat',
      'for i in range(4):',
      '    forward(${1:50})',
      '    right(90)'
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'turtle-triangle',
    detail: 'Zeichnet ein gleichseitiges Dreieck',
    documentation: 'Zeichnet ein gleichseitiges Dreieck mit der angegebenen Seitenlänge',
    insertText: [
      '# Zeichne ein gleichseitiges Dreieck',
      'for i in range(3):',
      '    forward(${1:100})',
      '    left(120)'
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'turtle-star',
    detail: 'Zeichnet einen Stern',
    documentation: 'Zeichnet einen fünfzackigen Stern',
    insertText: [
      '# Zeichne einen Stern',
      'for i in range(5):',
      '    forward(${1:100})',
      '    right(144)'
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'turtle-spiral',
    detail: 'Zeichnet eine Spirale',
    documentation: 'Zeichnet eine quadratische Spirale',
    insertText: [
      '# Zeichne eine Spirale',
      'size = 5',
      'for i in range(${1:30}):',
      '    forward(size)',
      '    right(90)',
      '    size += 5'
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  },
  {
    label: 'turtle-circle-pattern',
    detail: 'Zeichnet ein Kreismuster',
    documentation: 'Zeichnet ein farbiges Kreismuster',
    insertText: [
      '# Zeichne ein Kreismuster',
      'colors = ["red", "blue", "green", "yellow", "purple"]',
      'for i in range(${1:36}):',
      '    pencolor(colors[i % len(colors)])',
      '    circle(100)',
      '    left(10)'
    ].join('\n'),
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
  }
];

onMounted(() => {
  if (editorContainer.value) {
    // Python-Sprachkonfiguration für Autovervollständigung
    // Registriere die Autovervollständigung für Python mit Turtle-Befehlen und -Snippets
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        // Turtle-Befehle als CompletionItems formatieren
        const turtleSuggestions = turtleCommands.map(command => ({
          label: command.label,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: command.insertText,
          insertTextRules: command.insertTextRules,
          range: range,
          detail: command.detail,
          documentation: command.documentation
        }));
        
        // Turtle-Snippets als CompletionItems formatieren
        const snippetSuggestions = turtleSnippets.map(snippet => ({
          label: snippet.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: snippet.insertText,
          insertTextRules: snippet.insertTextRules,
          range: range,
          detail: snippet.detail,
          documentation: snippet.documentation
        }));

        // Alle Vorschläge kombinieren
        return {
          suggestions: [...turtleSuggestions, ...snippetSuggestions]
        };
      },
    });

    editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language || 'python',
      theme: 'vs-dark', // oder 'vs-light'
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      suggest: {
        // Zeige Vorschläge auch ohne Trigger-Zeichen
        showMethods: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showKeywords: true,
        showWords: true,
        showColors: true,
        showFiles: true,
        showFolders: true,
        showSnippets: true,
      }
    });

    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue();
      if (props.modelValue !== value) {
        emit('update:modelValue', value || '');
      }
    });
  }
});

watch(() => props.modelValue, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue);
  }
});

watch(() => props.language, (newLanguage) => {
  if (editor && newLanguage) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLanguage);
  }
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
});

</script>

<style scoped>
.code-editor-container {
  width: 100%;
  height: 100%;
  min-height: 300px; /* Mindesthöhe für den Editor */
  border: 1px solid #ccc;
}
</style>