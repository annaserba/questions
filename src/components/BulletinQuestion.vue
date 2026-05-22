<script setup lang="ts">
import type { BulletinQuestion, VoteChoice } from '../types'

defineProps<{
  question: BulletinQuestion
  selectedVote?: VoteChoice
}>()

defineEmits<{
  select: [payload: { questionId: number; vote: VoteChoice }]
}>()
</script>

<template>
  <li class="question-item">
    <h3>{{ question.title }}</h3>
    <p class="question-description">{{ question.description }}</p>
    <div class="vote-options">
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'for' }]"
        :aria-pressed="selectedVote === 'for'"
        @click="$emit('select', { questionId: question.id, vote: 'for' })"
      >
        <span class="vote-indicator" aria-hidden="true"></span>
        <span class="vote-label">ЗА</span>
      </button>
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'against' }]"
        :aria-pressed="selectedVote === 'against'"
        @click="$emit('select', { questionId: question.id, vote: 'against' })"
      >
        <span class="vote-indicator" aria-hidden="true"></span>
        <span class="vote-label">ПРОТИВ</span>
      </button>
      <button
        type="button"
        :class="['vote-button', { active: selectedVote === 'abstain' }]"
        :aria-pressed="selectedVote === 'abstain'"
        @click="$emit('select', { questionId: question.id, vote: 'abstain' })"
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
  border-bottom: 1px solid #e4ebf4;
}

.question-item:last-child {
  border-bottom: 0;
}

.question-item h3 {
  margin: 0 0 6px;
  font-size: 1.12rem;
}

.question-item p {
  margin: 0;
}

.question-description {
  margin-bottom: 8px;
}

.vote-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(90px, 140px));
  gap: 12px;
  margin-top: 12px;
}

.vote-button {
  display: inline-flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: #fff;
  color: #22324a;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
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
  line-height: 1;
}

@media (max-width: 720px) {
  .vote-options {
    grid-template-columns: 1fr;
  }
}

@media print {
  .question-item {
    break-inside: avoid;
    border-bottom: 0;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }

  .vote-options {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 10px;
  }

}
</style>
