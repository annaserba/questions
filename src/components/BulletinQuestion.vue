<script setup lang="ts">
import { ref } from 'vue'
import type { BulletinQuestion, VoteChoice } from '../types'

defineProps<{
  question: BulletinQuestion
  questionIndex: number
  selectedVote?: VoteChoice
}>()

defineEmits<{
  select: [payload: { questionIndex: number; vote: VoteChoice }]
}>()

const expanded = ref(false)
</script>

<template>
  <li class="question-item">
    <h3>{{ question.title }}</h3>
    <p class="question-description">{{ question.description }}</p>
    <button
      v-if="question.explanation"
      type="button"
      class="explanation-toggle"
      :class="{ active: expanded }"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Скрыть пояснение' : 'Пояснение' }}
    </button>
    <p v-if="expanded && question.explanation" class="explanation-text">
      {{ question.explanation }}
    </p>
    <div class="vote-options">
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'for' }]"
        :aria-pressed="selectedVote === 'for'"
        @click="$emit('select', { questionIndex, vote: 'for' })"
      >
        <span class="vote-indicator" aria-hidden="true"></span>
        <span class="vote-label">ЗА</span>
      </button>
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'against' }]"
        :aria-pressed="selectedVote === 'against'"
        @click="$emit('select', { questionIndex, vote: 'against' })"
      >
        <span class="vote-indicator" aria-hidden="true"></span>
        <span class="vote-label">ПРОТИВ</span>
      </button>
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'abstain' }]"
        :aria-pressed="selectedVote === 'abstain'"
        @click="$emit('select', { questionIndex, vote: 'abstain' })"
      >
        <span class="vote-indicator" aria-hidden="true"></span>
        <span class="vote-label">ВОЗДЕРЖАЛСЯ</span>
      </button>
    </div>
  </li>
</template>

<style scoped>
.question-item {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--gos-line);
}

.question-item:last-child {
  border-bottom: 0;
}

.question-item h3 {
  display: inline;
  margin: 0 0 6px;
  font-size: 1.12rem;
  color: var(--gos-ink);
}

.question-item p {
  margin: 0;
}

.question-description {
  margin-bottom: 8px;
  color: #344054;
}

.explanation-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  padding: 4px 10px;
  border: 1px solid rgba(13, 76, 211, 0.2);
  border-radius: 6px;
  background: rgba(13, 76, 211, 0.04);
  color: var(--gos-blue);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 140ms ease;
}

.explanation-toggle:hover {
  background: rgba(13, 76, 211, 0.08);
}

.explanation-toggle.active {
  background: rgba(13, 76, 211, 0.1);
  border-color: var(--gos-blue);
}

.explanation-text {
  margin: 0 0 10px;
  padding: 10px 14px;
  border-left: 3px solid var(--gos-blue);
  border-radius: 0 8px 8px 0;
  background: #f0f6ff;
  color: #2d4a7a;
  font-size: 0.85rem;
  line-height: 1.5;
}

.vote-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(126px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.vote-button {
  display: inline-flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #c6d7f3;
  border-radius: 8px;
  background: #f8fbff;
  color: var(--gos-blue-dark);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}

.vote-button:hover {
  border-color: var(--gos-blue);
  background: #eef6ff;
}

.vote-button.active {
  border-color: var(--gos-blue);
  background: var(--gos-blue);
  color: #fff;
  box-shadow: 0 8px 18px rgba(13, 76, 211, 0.2);
}


.vote-indicator {
  width: 18px;
  height: 18px;
  border: 1.5px solid currentColor;
  border-radius: 5px;
  flex: 0 0 auto;
}

 .vote-button.active .vote-indicator::after {
    content: "✓";
    left: 1px;
    top: -5px;
    font-size: 16px;
    line-height: 1;
  }

.vote-label {
  min-width: 0;
  line-height: 1.1;
  overflow-wrap: anywhere;
  text-align: center;
}

@media (max-width: 980px) {
  .question-item {
    padding: 10px 12px;
  }

  .question-item h3 {
    font-size: 0.9rem;
  }

  .question-description {
    font-size: 0.82rem;
  }

  .vote-options {
    grid-template-columns: 1fr;
  }

  .vote-button {
    padding: 8px 10px;
    font-size: 0.82rem;
  }

  .explanation-toggle {
    font-size: 0.76rem;
    padding: 4px 8px;
  }

  .explanation-text {
    font-size: 0.8rem;
    padding: 8px 10px;
  }
}

@media print {
  .explanation-toggle,
  .explanation-text {
    display: none;
  }

  .question-item {
    display: list-item;
    break-inside: avoid;
    border: 1px solid #bfbfbf;
    padding: 0;
    margin-bottom: 0;
    font-family: "Times New Roman", serif;
    list-style-position: inside;
  }

  .question-item::marker {
    font-weight: 700;
    font-size: 7.6pt;
  }

  .question-item h3,
  .question-description {
    display: block;
    padding: 0.45mm 0.8mm;
  }

  .question-item h3 {
    display: inline;
    margin: 0;
    border-bottom: 0;
    font-size: 7.6pt;
    line-height: 1.05;
  }

  .question-description {
    margin: 0;
    color: #000;
    font-size: 7.3pt;
    line-height: 1.05;
  }

  .vote-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin-top: 0;
    border-top: 1px solid #bfbfbf;
    border-left: 0;
  }

  .vote-button {
    min-height: 4.2mm;
    padding: 0.35mm 0.5mm;
    border: 0;
    border-right: 1px solid #bfbfbf;
    border-radius: 0;
    background: #fff;
    color: #000;
    font-size: 6.1pt;
    box-shadow: none;
  }

  .vote-button:last-child {
    border-right: 0;
  }

  .vote-indicator {
    width: 2.3mm;
    height: 2.3mm;
    border: 1px solid #000;
    border-radius: 0;
    flex: 0 0 auto;
  }

  .vote-label {
    overflow-wrap: normal;
    white-space: nowrap;
  }

}
</style>
