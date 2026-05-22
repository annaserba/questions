<script setup lang="ts">
import BulletinQuestion from './BulletinQuestion.vue'
import type {
  BulletinForm,
  NumberedBulletinQuestionSection,
  VoteChoice,
} from '../types'

defineProps<{
  form: BulletinForm
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionSections: NumberedBulletinQuestionSection[]
  questionVotes: Record<number, VoteChoice | undefined>
}>()

defineEmits<{
  'select-vote': [questionId: number, vote: VoteChoice]
}>()
</script>

<template>
  <main class="bulletin-sheet">
    <section class="bulletin-card">
      <p class="document-mark">БЮЛЛЕТЕНЬ ДЛЯ ГОЛОСОВАНИЯ</p>
      <h2>Общее собрание собственников помещений</h2>
      <div class="address-box">
        <span>Многоквартирный дом</span>
        <strong>{{ form.houseAddress }}</strong>
      </div>

      <div class="meta-list">
        <p><strong>Форма проведения:</strong> {{ form.meetingType }}</p>
        <p><strong>Дата уведомления:</strong> {{ formattedDates.noticeDate }}</p>
        <p><strong>Дата начала голосования:</strong> {{ formattedDates.votingStartDate }}</p>
        <p><strong>Дата окончания голосования:</strong> {{ formattedDates.votingEndDate }}</p>
      </div>

      <div class="owner-block">
        <div class="owner-block-head">
          <strong>Сведения о собственнике</strong>
        </div>

        <div class="owner-grid">
          <label class="owner-field owner-field-full">
            <span>Собственник</span>
            <input v-model="form.ownerName" type="text" autocomplete="name" />
          </label>

          <label class="owner-field">
            <span>Квартира / помещение</span>
            <input v-model="form.apartment" type="text" />
          </label>

          <label class="owner-field">
            <span>Площадь</span>
            <input v-model="form.area" type="text" inputmode="decimal" />
          </label>

          <label class="owner-field owner-field-full">
            <span>Документ о праве собственности</span>
            <input v-model="form.ownershipDocument" type="text" />
          </label>

          <label class="owner-field">
            <span>Номер паспорта</span>
            <input
              v-model="form.passportNumber"
              type="text"
              spellcheck="false"
            />
          </label>

          <label class="owner-field">
            <span>СНИЛС</span>
            <input
              v-model="form.snils"
              type="text"
              spellcheck="false"
            />
          </label>

        </div>
      </div>

      <div class="question-sections">
        <section
          v-for="section in questionSections"
          :key="section.title"
          class="question-section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <ol
            class="question-list"
            :start="section.questions[0]?.displayNumber"
          >
            <BulletinQuestion
              v-for="question in section.questions"
              :key="question.id"
              :question="question"
              :selected-vote="questionVotes[question.id]"
              @select="$emit('select-vote', $event.questionId, $event.vote)"
            />
          </ol>
        </section>
      </div>

      <div class="sign-row">
        <div>
          <span>Подпись собственника</span>
          <b></b>
        </div>
        <div>
          <span>Расшифровка подписи</span>
          <b></b>
        </div>
      </div>

      <div class="print-signature">
        <div>
          <span>Подпись собственника</span>
          <b></b>
        </div>
        <div>
          <span>Расшифровка подписи</span>
          <p>{{ form.ownerName || '______________________________' }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.bulletin-sheet {
  padding: 32px;
}

.bulletin-card {
  max-width: 960px;
  margin: 0 auto;
  padding: 42px;
  border: 1px solid #232323;
  background: #fff;
  box-shadow: none;
}

.document-mark {
  margin: 0;
  text-align: center;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.bulletin-card h2 {
  margin: 16px 0 18px;
  text-align: center;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.2;
  text-transform: uppercase;
}

.address-box {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border: 2px solid #232323;
  background: #f6f6f6;
}

.address-box span {
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.address-box strong {
  font-size: 1.18rem;
  line-height: 1.3;
}

.meta-list,
.owner-block,
.notes {
  padding: 18px 20px;
  border: 1px solid #232323;
  background: #fff;
}

.meta-list p,
.notes p {
  margin: 0 0 8px;
}

.meta-list p:last-child,
.notes p:last-child {
  margin-bottom: 0;
}

.owner-block,
.question-sections,
.notes,
.sign-row {
  margin-top: 20px;
}

.question-section {
  display: grid;
  gap: 10px;
}

.question-section + .question-section {
  margin-top: 20px;
}

.owner-block {
  display: grid;
  gap: 16px;
}

.owner-block-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 12px;
}

.owner-block-head strong {
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.owner-block-head span {
  max-width: 32ch;
  text-align: right;
  font-size: 0.83rem;
  color: #516071;
}

.owner-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.owner-field {
  display: grid;
  gap: 6px;
}

.owner-field-full {
  grid-column: 1 / -1;
}

.owner-field span {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #516071;
}

.owner-field input,
.owner-field textarea {
  width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #1d232f;
  font: inherit;
}

.owner-field input {
  padding: 6px 0 7px;
  border-bottom: 1px solid #29364b;
}

.owner-field textarea {
  min-height: 88px;
  padding: 10px 12px;
  border: 1px solid #29364b;
  resize: vertical;
}

.owner-field input:focus,
.owner-field textarea:focus {
  outline: none;
  background: #fbfcff;
}

.owner-field input:focus {
  border-bottom-width: 2px;
}

.owner-field textarea:focus {
  border-width: 2px;
  padding: 9px 11px;
}

.section-title {
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #232323;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  break-after: avoid-page;
  page-break-after: avoid;
}

.question-list {
  margin: 0;
  padding-left: 22px;
}

.sign-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.sign-row div {
  display: grid;
  gap: 10px;
}

.sign-row span {
  color: #232323;
}

.sign-row b {
  display: block;
  min-height: 34px;
  border-bottom: 1px solid #29364b;
}

.print-signature {
  display: none;
}

@media (max-width: 980px) {
  .bulletin-sheet {
    padding: 20px;
  }

  .bulletin-card {
    padding: 24px;
  }
}

@media (max-width: 720px) {
  .owner-block-head,
  .sign-row {
    grid-template-columns: 1fr;
  }

  .owner-block-head {
    display: grid;
    align-items: start;
  }

  .owner-block-head span {
    text-align: left;
  }

  .owner-grid,
  .sign-row {
    grid-template-columns: 1fr;
  }
}

@media print {
  .bulletin-sheet {
    padding: 0;
  }

  .bulletin-card {
    max-width: none;
    padding: 0 0 18mm;
    border: 0;
    background: #fff;
    font-size: 10.5pt;
    line-height: 1.3;
  }

  .document-mark {
    margin-bottom: 8px;
    font-size: 8pt;
  }

  .bulletin-card h2 {
    margin: 0 0 10px;
    font-size: 15pt;
  }

  .address-box,
  .meta-list,
  .owner-block {
    padding: 0;
    border: 0;
    background: transparent;
  }

  .address-box {
    margin-bottom: 14px;
  }

  .address-box strong {
    font-size: 11pt;
  }

  .meta-list,
  .owner-block,
  .question-sections,
  .sign-row {
    margin-top: 12px;
  }

  .owner-block {
    gap: 10px;
  }

  .owner-block-head {
    display: block;
  }

  .screen-only {
    display: none;
  }

  .owner-block-head strong {
    font-size: 9.4pt;
  }

  .owner-grid {
    gap: 10px 14px;
  }

  .owner-field span {
    font-size: 8pt;
    color: #000;
  }

  .owner-field input,
  .owner-field textarea {
    appearance: none;
    -webkit-appearance: none;
    color: #000;
    box-shadow: none;
  }

  .owner-field input {
    padding: 4px 0 5px;
    border-bottom: 1px solid #000;
  }

  .owner-field textarea {
    min-height: 18mm;
    padding: 6px 8px;
    border: 1px solid #000;
  }

  .question-section + .question-section {
    margin-top: 14px;
  }

  .section-title {
    padding-bottom: 4px;
  }

  .question-list {
    padding-left: 18px;
    font-size: 9.6pt;
  }

  .section-title {
    font-size: 9.4pt;
  }

  .question-section {
    gap: 8px;
  }

  .question-list :deep(.question-item:first-child) {
    break-before: avoid-page;
    page-break-before: avoid;
  }

  .sign-row {
    display: none;
  }

  .print-signature {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    padding-top: 4mm;
    border-top: 1px solid #000;
    background: #fff;
    font-size: 9pt;
  }

  .print-signature div {
    display: grid;
    gap: 4px;
  }

  .print-signature span,
  .print-signature p {
    color: #000;
    margin: 0;
  }

  .print-signature b {
    display: block;
    min-height: 0;
    border-bottom: 1px solid #000;
  }
}
</style>
