<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { BulletinQuestionSection } from '../types'

type AnalysisStatus = 'idle' | 'loading' | 'ready' | 'error'

interface QuestionAnalysis {
  status: AnalysisStatus
  text: string
}

const props = defineProps<{
  houseAddress: string
  questionSections: BulletinQuestionSection[]
  approvedQuestions: Record<string, boolean>
  saveStatus: string
}>()

const emit = defineEmits<{
  'toggle-approved': [questionTitle: string]
}>()

const analyses = reactive<Record<number, QuestionAnalysis>>({})
const approvedAnalysis = reactive<QuestionAnalysis>({
  status: 'idle',
  text: '',
})
const copied = ref(false)

const approvedList = computed(() =>
  props.questionSections.flatMap((section) =>
    section.questions
      .map((question, idx) => ({
        index: section.startNumber + idx,
        section: section.title,
        title: question.title,
        description: question.description,
        approved: props.approvedQuestions[question.title] === true,
      }))
      .filter((question) => question.approved),
  ),
)

function getAnalysis(questionIndex: number): QuestionAnalysis {
  if (!analyses[questionIndex]) {
    analyses[questionIndex] = {
      status: 'idle',
      text: '',
    }
  }

  return analyses[questionIndex]
}

async function analyzeQuestion(
  questionIndex: number,
  sectionTitle: string,
  title: string,
  description: string,
  explanation?: string,
) {
  const analysis = getAnalysis(questionIndex)
  analysis.status = 'loading'
  analysis.text = ''

  try {
    const response = await fetch('/api/analyze-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        houseAddress: props.houseAddress,
        sectionTitle,
        title,
        description,
        explanation,
      }),
    })

    const payload = await response.json() as { analysis?: string; error?: string }

    if (!response.ok) {
      throw new Error(payload.error || 'Не удалось выполнить анализ вопроса.')
    }

    analysis.status = 'ready'
    analysis.text = payload.analysis || 'DeepSeek не вернул текст анализа.'
  } catch (error) {
    analysis.status = 'error'
    analysis.text = error instanceof Error
      ? error.message
      : 'Не удалось выполнить анализ вопроса.'
  }
}

async function analyzeApprovedQuestions() {
  if (approvedList.value.length === 0) {
    return
  }

  approvedAnalysis.status = 'loading'
  approvedAnalysis.text = ''

  try {
    const response = await fetch('/api/analyze-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        houseAddress: props.houseAddress,
        sectionTitle: 'Согласованные вопросы ОСС',
        title: 'Общий анализ согласованных вопросов',
        description: approvedList.value
          .map((question) => [
            `${question.index}. ${question.title}`,
            `Раздел: ${question.section}`,
            `Формулировка: ${question.description}`,
          ].join('\n'))
          .join('\n\n'),
      }),
    })

    const payload = await response.json() as { analysis?: string; error?: string }

    if (!response.ok) {
      throw new Error(payload.error || 'Не удалось выполнить общий анализ.')
    }

    approvedAnalysis.status = 'ready'
    approvedAnalysis.text = payload.analysis || 'DeepSeek не вернул текст анализа.'
  } catch (error) {
    approvedAnalysis.status = 'error'
    approvedAnalysis.text = error instanceof Error
      ? error.message
      : 'Не удалось выполнить общий анализ.'
  }
}

async function copyApprovedList() {
  const text = approvedList.value
    .map((question) => `${question.index}. ${question.title}`)
    .join('\n')

  if (!text) {
    return
  }

  await navigator.clipboard.writeText(text)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
</script>

<template>
  <main class="checklist-page">
    <section class="checklist-sheet">
      <div class="checklist-head">
        <div>
          <p class="document-mark">ЧЕКЛИСТ ВОПРОСОВ ОСС</p>
          <h2>{{ houseAddress }}</h2>
        </div>
        <div class="approved-counter">
          <strong>{{ approvedList.length }}</strong>
          <span>согласовано</span>
        </div>
      </div>

      <div class="approved-panel">
        <div class="approved-panel-head">
          <h3>Согласованные вопросы</h3>
          <div class="approved-actions">
            <button
              type="button"
              :disabled="approvedList.length === 0 || approvedAnalysis.status === 'loading'"
              @click="analyzeApprovedQuestions"
            >
              {{ approvedAnalysis.status === 'loading' ? 'Анализирую...' : 'Анализ DeepSeek' }}
            </button>
            <button
              type="button"
              :disabled="approvedList.length === 0"
              @click="copyApprovedList"
            >
              {{ copied ? 'Скопировано' : 'Копировать' }}
            </button>
          </div>
        </div>
        <p v-if="saveStatus" class="save-status">{{ saveStatus }}</p>

        <p v-if="approvedList.length === 0" class="empty-state">
          Отметьте вопросы чекбоксами, чтобы собрать список согласованных.
        </p>
        <ol v-else class="approved-list">
          <li v-for="question in approvedList" :key="question.index">
            <span>{{ question.index }}</span>
            <div>
              <strong>{{ question.title }}</strong>
              <small>{{ question.section }}</small>
            </div>
          </li>
        </ol>

        <div
          v-if="approvedAnalysis.status !== 'idle'"
          class="analysis-box approved-analysis"
          :class="{ error: approvedAnalysis.status === 'error' }"
        >
          {{ approvedAnalysis.text }}
        </div>
      </div>

      <div class="checklist-sections">
        <section
          v-for="section in questionSections"
          :key="section.title"
          class="checklist-section"
        >
          <h3 class="section-title">{{ section.title }}</h3>

          <article
            v-for="(question, idx) in section.questions"
            :key="section.startNumber + idx"
            class="checklist-item"
          >
            <label class="question-check">
              <input
                type="checkbox"
                :checked="approvedQuestions[question.title] === true"
                @change="$emit('toggle-approved', question.title)"
              />
              <span></span>
              <strong>{{ section.startNumber + idx }}. {{ question.title }}</strong>
            </label>

            <p>{{ question.description }}</p>
            <p v-if="question.explanation" class="question-note">
              {{ question.explanation }}
            </p>

            <div class="item-actions">
              <button
                type="button"
                :disabled="getAnalysis(section.startNumber + idx).status === 'loading'"
                @click="analyzeQuestion(
                  section.startNumber + idx,
                  section.title,
                  question.title,
                  question.description,
                  question.explanation,
                )"
              >
                {{
                  getAnalysis(section.startNumber + idx).status === 'loading'
                    ? 'Анализирую...'
                    : 'Анализ DeepSeek'
                }}
              </button>
            </div>

            <div
              v-if="getAnalysis(section.startNumber + idx).status !== 'idle'"
              class="analysis-box"
              :class="{ error: getAnalysis(section.startNumber + idx).status === 'error' }"
            >
              {{ getAnalysis(section.startNumber + idx).text }}
            </div>
          </article>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.checklist-page {
  padding: 32px;
}

.checklist-sheet {
  max-width: 1040px;
  margin: 0 auto;
  padding: 34px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(6, 58, 156, 0.12);
}

.checklist-head,
.approved-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.document-mark {
  margin: 0 0 6px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--gos-blue);
}

.checklist-head h2,
.approved-panel h3 {
  margin: 0;
  color: var(--gos-ink);
}

.approved-counter {
  display: grid;
  place-items: center;
  min-width: 112px;
  padding: 12px;
  border: 1px solid #c8d7ef;
  border-radius: 8px;
  background: #f4f9ff;
}

.approved-counter strong {
  color: var(--gos-blue);
  font-size: 1.6rem;
  line-height: 1;
}

.approved-counter span {
  color: var(--gos-muted);
  font-size: 0.78rem;
}

.approved-panel {
  margin-top: 22px;
  padding: 18px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
}

.approved-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.approved-panel button,
.item-actions button {
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid var(--gos-blue);
  border-radius: 8px;
  background: var(--gos-blue);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.approved-panel button:disabled,
.item-actions button:disabled {
  border-color: #c8d7ef;
  background: #d9e5f6;
  cursor: default;
}

.empty-state {
  margin: 12px 0 0;
  color: var(--gos-muted);
}

.save-status {
  margin: 10px 0 0;
  color: var(--gos-muted);
  font-size: 0.88rem;
  font-weight: 700;
}

.approved-list {
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.approved-list li {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.approved-list li > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eaf5ef;
  color: #13734d;
  font-weight: 800;
}

.approved-list strong,
.approved-list small {
  display: block;
}

.approved-list small {
  color: var(--gos-muted);
}

.checklist-sections {
  display: grid;
  gap: 22px;
  margin-top: 24px;
}

.checklist-section {
  display: grid;
  gap: 12px;
}

.section-title {
  margin: 0;
  padding: 10px 12px;
  border-left: 4px solid var(--gos-blue);
  border-radius: 8px;
  background: #edf5ff;
  color: var(--gos-blue-dark);
  font-size: 1.02rem;
  text-transform: uppercase;
}

.checklist-item {
  padding: 16px;
  border: 1px solid #d7e4f5;
  border-radius: 8px;
  background: #ffffff;
}

.question-check {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  cursor: pointer;
}

.question-check input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.question-check span {
  position: relative;
  width: 22px;
  height: 22px;
  border: 1.5px solid #9bb5da;
  border-radius: 6px;
  background: #fff;
}

.question-check input:checked + span {
  border-color: var(--gos-mint);
  background: var(--gos-mint);
}

.question-check input:checked + span::after {
  content: "";
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.question-check strong {
  color: var(--gos-ink);
}

.checklist-item p {
  margin: 10px 0 0 34px;
  color: #344054;
}

.question-note {
  padding: 10px 12px;
  border-left: 3px solid var(--gos-blue);
  border-radius: 0 8px 8px 0;
  background: #f0f6ff;
  color: #2d4a7a;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.analysis-box {
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px solid #cfe0f6;
  border-radius: 8px;
  background: #f8fbff;
  color: #243b5f;
  white-space: pre-wrap;
}

.analysis-box.error {
  border-color: #fac1c8;
  background: #fff5f6;
  color: #9f1f2e;
}

.approved-analysis {
  margin-top: 16px;
}

@media (max-width: 980px) {
  .checklist-page {
    padding: 12px;
  }

  .checklist-sheet {
    padding: 18px 14px;
  }

  .checklist-head,
  .approved-panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .approved-counter {
    width: 100%;
  }

  .checklist-item p {
    margin-left: 0;
  }
}

@media print {
  .checklist-page {
    padding: 0;
  }

  .checklist-sheet {
    max-width: none;
    padding: 0;
    border: 0;
    box-shadow: none;
  }

  .item-actions,
  .analysis-box,
  .approved-panel button {
    display: none;
  }
}
</style>
