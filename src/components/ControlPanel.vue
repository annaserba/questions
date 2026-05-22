<script setup lang="ts">
import type { BulletinForm, BulletinQuestionVoteNoteSection } from '../types'

type DocumentView = 'bulletin' | 'notice'

defineProps<{
  form: BulletinForm
  houseAddressOptions: readonly string[]
  currentDocument: DocumentView
  latestNoticeDate: string
  maxVotingEndDate: string
  durationWarning: string
  noticeWarning: string
  gisIdentityWarning: string
  voteNoteSections: BulletinQuestionVoteNoteSection[]
}>()

defineEmits<{
  print: []
  'update:current-document': [value: DocumentView]
}>()
</script>

<template>
  <aside class="control-panel">
    <div class="panel-top">
      <h1>Генератор документов для голосования</h1>
      <p class="intro">
        Заполните данные дома и сроки голосования. Сведения о собственнике
        вносятся прямо в бюллетене и сохраняются в cookie текущего браузера.
      </p>
      <div class="summary-strip">
        <span class="summary-chip">Электронное голосование</span>
        <span class="summary-chip">Повестка по разделам</span>
      </div>
    </div>

    <section class="panel-block">
      <div class="block-head">
        <h2>Документ</h2>
        <p>Выберите шаблон, который нужно показать и распечатать.</p>
      </div>

      <div class="document-switch" role="tablist" aria-label="Выбор документа">
        <button
          :class="['switch-button', { active: currentDocument === 'bulletin' }]"
          type="button"
          @click="$emit('update:current-document', 'bulletin')"
        >
          Бюллетень
        </button>
        <button
          :class="['switch-button', { active: currentDocument === 'notice' }]"
          type="button"
          @click="$emit('update:current-document', 'notice')"
        >
          Уведомление
        </button>
      </div>
    </section>

    <section class="panel-block">
      <div class="block-head">
        <h2>Параметры собрания</h2>
        <p>Дом, управляющая компания и ключевые сроки проведения голосования.</p>
      </div>

      <div class="grid">
        <label class="full">
          <span>Адрес дома</span>
          <select v-model="form.houseAddress">
            <option
              v-for="address in houseAddressOptions"
              :key="address"
              :value="address"
            >
              {{ address }}
            </option>
          </select>
        </label>

        <label>
          <span>Управляющая компания</span>
          <input v-model="form.managementCompany" type="text" />
        </label>

        <label>
          <span>Форма собрания</span>
          <input v-model="form.meetingType" type="text" />
        </label>

        <label>
          <span>Дата уведомления</span>
          <input v-model="form.noticeDate" :max="latestNoticeDate" type="date" />
        </label>

        <label>
          <span>Дата начала голосования</span>
          <input v-model="form.votingStartDate" type="date" />
        </label>

        <label class="full">
          <span>Дата окончания голосования</span>
          <input
            v-model="form.votingEndDate"
            :min="form.votingStartDate"
            :max="maxVotingEndDate"
            type="date"
          />
        </label>
      </div>
    </section>

    <section class="panel-block rules-card">
      <div class="block-head">
        <h2>Контроль сроков</h2>
        <p>Проверьте условия перед публикацией и печатью.</p>
      </div>

      <div class="rule-list">
        <p>Уведомление должно быть направлено не позднее чем за 10 дней до начала голосования.</p>
        <p>Продолжительность голосования не может превышать 2 месяца.</p>
        <p>Уведомление следует подготовить к печати за 2 дня до даты уведомления.</p>
        <p>Для голосования в ГИС ЖКХ в бюллетене нужно указать номер паспорта или СНИЛС собственника.</p>
        <p v-if="noticeWarning" class="warning">{{ noticeWarning }}</p>
        <p v-if="durationWarning" class="warning">{{ durationWarning }}</p>
        <p v-if="gisIdentityWarning" class="warning">{{ gisIdentityWarning }}</p>
      </div>
    </section>

    <section class="panel-block vote-notes-card">
      <div class="block-head">
        <h2>Примечания по голосам</h2>
        <p>Служебные пометки для подготовки собрания. В печать не попадают.</p>
      </div>

      <div class="vote-note-sections">
        <section
          v-for="section in voteNoteSections"
          :key="section.title"
          class="vote-note-section"
        >
          <h3>{{ section.title }}</h3>
          <ul class="vote-note-list">
            <li v-for="item in section.items" :key="item.id">
              <strong>Вопрос {{ item.displayNumber }}.</strong>
              <span>{{ item.note }}</span>
            </li>
          </ul>
        </section>
      </div>
    </section>

    <button class="print-button" type="button" @click="$emit('print')">
      Печать текущего документа
    </button>
  </aside>
</template>

<style scoped>
.control-panel {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  padding: 28px 22px 24px;
  background:
    radial-gradient(circle at top, rgba(232, 189, 103, 0.15), transparent 28%),
    linear-gradient(180deg, #102748 0%, #18355d 100%);
  color: #f7f4ec;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f8cf79;
}

.panel-top {
  margin-bottom: 18px;
}

.control-panel h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.8rem);
  line-height: 0.98;
}

.intro {
  margin: 14px 0 16px;
  max-width: 36ch;
  color: rgba(247, 244, 236, 0.82);
}

.summary-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-chip {
  padding: 7px 12px;
  border: 1px solid rgba(248, 207, 121, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f6e3b4;
  font-size: 0.84rem;
}

.panel-block {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.block-head {
  margin-bottom: 14px;
}

.block-head h2 {
  margin: 0;
  font-size: 1rem;
  color: #fff8ea;
}

.block-head p {
  margin: 6px 0 0;
  font-size: 0.9rem;
  color: rgba(247, 244, 236, 0.7);
}

.vote-notes-card {
  border-color: rgba(248, 207, 121, 0.24);
  background: rgba(248, 207, 121, 0.08);
}

.document-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.switch-button {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #f6f1e4;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background 140ms ease;
}

.switch-button:hover {
  transform: translateY(-1px);
  border-color: rgba(248, 207, 121, 0.35);
}

.switch-button.active {
  background: linear-gradient(135deg, #f8cf79, #dda247);
  color: #152235;
  border-color: transparent;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.grid label {
  display: grid;
  gap: 6px;
}

.grid label.full {
  grid-column: 1 / -1;
}

.grid span {
  font-size: 0.85rem;
  color: rgba(247, 244, 236, 0.74);
}

.grid input,
.grid select,
.grid textarea {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  background: rgba(7, 18, 35, 0.3);
  color: #fffaf0;
}

.grid input:focus,
.grid select:focus,
.grid textarea:focus {
  outline: 2px solid rgba(248, 207, 121, 0.65);
  outline-offset: 1px;
}

.grid textarea {
  resize: vertical;
  min-height: 110px;
}

.rule-list {
  display: grid;
  gap: 8px;
}

.owner-note {
  margin: 0;
  color: rgba(247, 244, 236, 0.84);
  line-height: 1.55;
}

.owner-note strong {
  color: #fff8ea;
}

.rule-list p {
  margin: 0 0 8px;
  color: rgba(247, 244, 236, 0.84);
}

.rule-list p:last-child {
  margin-bottom: 0;
}

.vote-note-sections {
  display: grid;
  gap: 14px;
}

.vote-note-section h3 {
  margin: 0 0 10px;
  font-size: 0.92rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #fff2cd;
}

.vote-note-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
}

.vote-note-list li {
  color: rgba(247, 244, 236, 0.88);
}

.vote-note-list strong {
  color: #fff8ea;
  margin-right: 6px;
}

.warning {
  color: #ffd1b0;
  font-weight: 600;
  background: rgba(255, 161, 122, 0.08);
  border: 1px solid rgba(255, 161, 122, 0.18);
  border-radius: 12px;
  padding: 10px 12px;
}

.print-button {
  width: 100%;
  margin-top: 18px;
  border: 0;
  border-radius: 999px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f8cf79, #e7a53b);
  color: #142033;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(10, 16, 28, 0.24);
}

@media (max-width: 720px) {
  .control-panel {
    position: static;
    height: auto;
    overflow: visible;
  }

  .document-switch,
  .grid {
    grid-template-columns: 1fr;
  }
}

@media print {
  .control-panel {
    display: none;
  }
}
</style>
