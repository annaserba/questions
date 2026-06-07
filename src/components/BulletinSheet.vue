<script setup lang="ts">
import BulletinQuestion from './BulletinQuestion.vue'
import type {
  BulletinForm,
  BulletinQuestionSection,
  VoteChoice,
} from '../types'

defineProps<{
  form: BulletinForm
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionSections: BulletinQuestionSection[]
  questionVotes: Record<number, VoteChoice | undefined>
}>()

defineEmits<{
  'select-vote': [questionIndex: number, vote: VoteChoice]
}>()
</script>

<template>
  <main class="bulletin-sheet">
    <section class="bulletin-card">
      <p class="document-mark">РЕШЕНИЕ СОБСТВЕННИКА</p>
      <p class="document-subtitle">помещения в многоквартирном доме, расположенном по адресу:</p>
      <p class="document-address">{{ form.houseAddress }}</p>
      <p class="document-subtitle">по вопросам внеочередного общего собрания собственников</p>
      <p class="document-subtitle">с {{ formattedDates.votingStartDate }} по {{ formattedDates.votingEndDate }}</p>

      <div class="meta-list">
        <p><strong>Форма проведения:</strong> {{ form.meetingType }}</p>
        <p><strong>Дата уведомления:</strong> {{ formattedDates.noticeDate }}</p>
      </div>

      <div class="owner-block">
        <div class="owner-block-head">
          <strong>Сведения о собственнике</strong>
        </div>

        <div class="owner-grid">
          <div class="owner-field-row owner-name-row">
            <label class="owner-field">
              <span>Собственник</span>
              <input v-model="form.ownerName" type="text" autocomplete="name" />
            </label>

            <label class="owner-field">
              <span>Номер телефона</span>
              <input v-model="form.phone" type="tel" />
            </label>
          </div>

          <label class="owner-field">
            <span>Квартира / помещение</span>
            <input v-model="form.apartment" type="text" />
          </label>

          <div class="owner-field-row">
            <label class="owner-field">
              <span>Площадь</span>
              <input v-model="form.area" type="text" inputmode="decimal" />
            </label>

            <label class="owner-field">
              <span>Доля в праве собственности</span>
              <input v-model="form.share" type="text" placeholder="1/2" />
            </label>
          </div>

          <label class="owner-field owner-field-full">
            <span>Документ о праве собственности</span>
            <input v-model="form.ownershipDocument" type="text" />
          </label>

          <div class="owner-field-row">
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

          <p class="owner-hint">Можно указать один из документов: паспорт или СНИЛС</p>

        </div>
      </div>

      <div class="question-sections">
        <p v-if="questionSections.length === 0" class="empty-agenda">
          Нет согласованных вопросов. Отметьте вопросы в чеклисте.
        </p>
        <section
          v-for="section in questionSections"
          :key="section.title"
          class="question-section"
        >
          <h3 class="section-title">{{ section.title }}</h3>
          <ol
            class="question-list"
            :start="section.startNumber"
          >
            <BulletinQuestion
              v-for="(question, idx) in section.questions"
              :key="section.startNumber + idx"
              :question="question"
              :question-index="section.startNumber + idx"
              :selected-vote="questionVotes[section.startNumber + idx]"
              @select="$emit('select-vote', $event.questionIndex, $event.vote)"
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
          <p class="signature-name">{{ form.ownerName || '______________________________' }}</p>
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
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(6, 58, 156, 0.12);
}

.document-mark {
  margin: 0;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gos-blue);
}

.document-subtitle,
.document-address {
  margin: 4px 0 0;
  text-align: center;
  line-height: 1.35;
}

.document-subtitle {
  color: #344054;
}

.document-address {
  font-size: clamp(1.25rem, 2.6vw, 1.7rem);
  font-weight: 700;
  color: var(--gos-ink);
}

.meta-list,
.owner-block,
.notes {
  padding: 18px 20px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
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

.empty-agenda {
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
  color: var(--gos-muted);
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
  color: var(--gos-blue);
}

.owner-block-head span {
  max-width: 32ch;
  text-align: right;
  font-size: 0.83rem;
  color: var(--gos-muted);
}

.owner-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.owner-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
}

.owner-name-row {
  grid-template-columns: 7fr 3fr;
}

.owner-field {
  display: grid;
  gap: 6px;
}

.owner-hint {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: var(--gos-muted);
}

.owner-field-full {
  grid-column: 1 / -1;
}

.owner-field span {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gos-muted);
}

.owner-field input,
.owner-field textarea {
  width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--gos-ink);
  font: inherit;
}

.owner-field input {
  padding: 6px 0 7px;
  border-bottom: 1px solid #b7c8e8;
}

.owner-field textarea {
  min-height: 88px;
  padding: 10px 12px;
  border: 1px solid #b7c8e8;
  border-radius: 8px;
  resize: vertical;
}

.owner-field input:focus,
.owner-field textarea:focus {
  outline: none;
  background: #f4f9ff;
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
  padding: 10px 12px;
  border-left: 4px solid var(--gos-blue);
  border-radius: 8px;
  background: #edf5ff;
  color: var(--gos-blue-dark);
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  break-after: avoid-page;
  page-break-after: avoid;
}

.question-list {
  margin: 0;
  padding-left: 0;
  list-style-position: inside;
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
  color: var(--gos-muted);
}

.sign-row b {
  display: block;
  min-height: 34px;
  border-bottom: 1px solid #b7c8e8;
}

.signature-name {
  min-height: 34px;
  margin: 0;
  padding-top: 8px;
  border-bottom: 1px solid #b7c8e8;
  color: var(--gos-ink);
  font-weight: 600;
}

.print-signature {
  display: none;
}

@media (max-width: 980px) {
  .bulletin-sheet {
    padding: 12px;
  }

  .bulletin-card {
    padding: 18px 14px;
  }

  .document-mark {
    font-size: 0.95rem;
  }

  .document-address {
    font-size: 1.05rem;
  }

  .document-subtitle {
    font-size: 0.85rem;
  }

  .meta-list,
  .owner-block,
  .notes {
    padding: 12px 14px;
  }

  .owner-block-head,
  .sign-row {
    grid-template-columns: 1fr;
  }

  .owner-block-head {
    display: grid;
    align-items: start;
    gap: 6px;
  }

  .owner-block-head span {
    text-align: left;
  }

  .owner-grid,
  .sign-row {
    grid-template-columns: 1fr;
  }

  .owner-field span {
    font-size: 0.72rem;
  }

  .section-title {
    font-size: 0.9rem;
    padding: 8px 10px;
  }
}

@media print {
  .bulletin-sheet {
    padding: 0;
  }

  .bulletin-card {
    max-width: none;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: #fff;
    box-shadow: none;
    font-size: 8.2pt;
    line-height: 1.02;
  }

  .document-mark {
    margin-bottom: 0;
    color: #000;
    font-family: "Times New Roman", serif;
    font-size: 9.4pt;
    letter-spacing: 0;
  }

  .document-subtitle,
  .document-address {
    margin: 0;
    color: #000;
    font-family: "Times New Roman", serif;
    display: inline;
    font-size: 8pt;
    line-height: 1;
  }

  .document-subtitle::after,
  .document-address::after {
    content: " ";
  }

  .meta-list,
  .owner-block {
    padding: 0;
    border: 0;
    background: transparent;
  }

  .meta-list,
  .owner-block,
  .question-sections,
  .sign-row {
    margin-top: 2px;
  }

  .meta-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0 4mm;
    padding: 0;
    border: 0;
    font-family: "Times New Roman", serif;
    font-size: 7.4pt;
    line-height: 1;
  }

  .meta-list p {
    margin: 0;
  }

  .owner-block {
    padding: 0.6mm 1mm;
    border: 1px solid #bfbfbf;
    font-family: "Times New Roman", serif;
  }

  .owner-block {
    gap: 2px;
  }

  .owner-block-head {
    display: block;
  }

  .screen-only {
    display: none;
  }

  .owner-block-head strong {
    font-size: 8.4pt;
  }

  .owner-grid {
    gap: 1px 6px;
  }

  .owner-field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px 6px;
  }

  .owner-name-row {
    grid-template-columns: 7fr 3fr;
  }

  .owner-field span {
    font-size: 7.4pt;
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
    padding: 0 0 1px;
    border-bottom: 1px solid #000;
  }

  .owner-field textarea {
    min-height: 8mm;
    padding: 2px 4px;
    border: 1px solid #000;
  }

  .question-section + .question-section {
    margin-top: 2px;
  }

  .section-title {
    padding: 0;
    border: 0;
    border-bottom: 1px solid #000;
    border-radius: 0;
    background: transparent;
    color: #000;
    text-align: center;
  }

  .question-list {
    padding-left: 0;
    font-size: 8.4pt;
    list-style-position: inside;
  }

  .section-title {
    font-size: 7.9pt;
  }

  .question-section {
    gap: 1px;
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
    gap: 8mm;
    padding: 2mm 0 4mm;
    border-top: 1px solid #000;
    background: #fff;
    font-size: 7pt;
  }

  .print-signature div {
    display: grid;
    gap: 1mm;
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
