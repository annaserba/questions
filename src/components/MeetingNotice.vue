<script setup lang="ts">
import type { BulletinForm, BulletinQuestionSection } from '../types'

defineProps<{
  form: BulletinForm
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionSections: BulletinQuestionSection[]
}>()
</script>

<template>
  <section class="notice-sheet">
    <article class="notice-card">
      <p class="document-mark">УВЕДОМЛЕНИЕ</p>
      <h2>О проведении общего собрания собственников помещений</h2>
      <p class="document-subtitle">в многоквартирном доме, расположенном по адресу:</p>
      <p class="document-address">{{ form.houseAddress }}</p>
      <div class="address-box">
        <span>Многоквартирный дом</span>
        <strong>{{ form.houseAddress }}</strong>
      </div>

      <div class="notice-meta">
        <p><strong>Сообщается о проведении:</strong> общего собрания собственников помещений в многоквартирном доме</p>
        <p><strong>Форма проведения:</strong> {{ form.meetingType }}</p>
        <p><strong>Дата уведомления:</strong> {{ formattedDates.noticeDate }}</p>
        <p><strong>Дата начала голосования:</strong> {{ formattedDates.votingStartDate }}</p>
        <p><strong>Дата окончания голосования:</strong> {{ formattedDates.votingEndDate }}</p>
        <p><strong>Действующая управляющая компания:</strong> {{ form.previousManagementCompany }}</p>
        <p><strong>Новая управляющая компания:</strong> {{ form.managementCompany }}</p>
      </div>

      <div class="notice-body">
        <p>
          Голосование проводится с использованием ГИС ЖКХ. Собственникам
          помещений предлагается ознакомиться с материалами собрания и принять
          участие в голосовании по вопросам повестки дня.
        </p>
      </div>

      <div class="agenda">
        <h3>Повестка дня</h3>
        <p v-if="questionSections.length === 0" class="empty-agenda">
          Нет согласованных вопросов. Отметьте вопросы в чеклисте.
        </p>
        <section
          v-for="section in questionSections"
          :key="section.title"
          class="agenda-section"
        >
          <h4>{{ section.title }}</h4>
          <ol
            class="agenda-list"
            :start="section.startNumber"
          >
            <li v-for="(question, idx) in section.questions" :key="idx">
              <strong>{{ question.title }}</strong>
              <p>{{ question.description }}</p>
            </li>
          </ol>
        </section>
      </div>

    </article>
  </section>
</template>

<style scoped>
.notice-sheet {
  padding: 32px 32px 0;
}

.notice-card {
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

.notice-card h2 {
  margin: 16px 0 18px;
  text-align: center;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.2;
  text-transform: uppercase;
  color: var(--gos-ink);
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

.address-box {
  margin-top: 18px;
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid #b9d2ff;
  border-radius: 8px;
  background: var(--gos-blue-soft);
}

.address-box span {
  font-size: 0.84rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gos-blue);
}

.address-box strong {
  font-size: 1.18rem;
  line-height: 1.3;
}

.notice-meta,
.notice-body,
.agenda,
.notice-footer {
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
}

.notice-meta p,
.notice-body p,
.notice-footer p {
  margin: 0 0 8px;
}

.notice-meta p:last-child,
.notice-body p:last-child,
.notice-footer p:last-child {
  margin-bottom: 0;
}

.agenda h3 {
  margin: 0 0 14px;
  font-size: 1rem;
  text-transform: uppercase;
  color: var(--gos-blue);
}

.agenda-section {
  display: grid;
  gap: 10px;
}

.agenda-section + .agenda-section {
  margin-top: 18px;
}

.agenda h4 {
  margin: 0;
  padding: 10px 12px;
  border-left: 4px solid var(--gos-blue);
  border-radius: 8px;
  background: #edf5ff;
  color: var(--gos-blue-dark);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  break-after: avoid-page;
  page-break-after: avoid;
}

.agenda-list {
  margin: 0;
  padding-left: 22px;
}

.agenda-list li + li {
  margin-top: 14px;
}

.agenda p {
  margin: 6px 0 0;
}

.empty-agenda {
  margin: 0;
  color: var(--gos-muted);
}

@media (max-width: 980px) {
  .notice-sheet {
    padding: 12px 12px 0;
  }

  .notice-card {
    padding: 18px 14px;
  }

  .document-mark {
    font-size: 0.95rem;
  }

  .notice-card h2 {
    font-size: 1.15rem;
    margin: 10px 0 12px;
  }

  .document-address {
    font-size: 1.05rem;
  }

  .document-subtitle {
    font-size: 0.85rem;
  }

  .notice-meta,
  .notice-body,
  .agenda {
    padding: 12px 14px;
    margin-top: 14px;
  }

  .notice-meta p {
    font-size: 0.85rem;
  }

  .agenda h3 {
    font-size: 0.92rem;
  }

  .agenda h4 {
    font-size: 0.85rem;
    padding: 8px 10px;
  }

  .agenda-list {
    padding-left: 16px;
    font-size: 0.88rem;
  }

  .agenda-list li + li {
    margin-top: 10px;
  }
}

@media print {
  .notice-sheet {
    padding: 0;
  }

  .notice-card {
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

  .notice-card h2 {
    margin: 0;
    color: #000;
    font-family: "Times New Roman", serif;
    font-size: 9.4pt;
    line-height: 1.02;
    text-transform: uppercase;
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

  .address-box {
    display: none;
  }

  .notice-meta,
  .notice-body {
    margin-top: 2px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .notice-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0 4mm;
    font-family: "Times New Roman", serif;
    font-size: 7.4pt;
    line-height: 1;
  }

  .notice-meta p {
    margin: 0;
  }

  .notice-body {
    font-family: "Times New Roman", serif;
    font-size: 8.2pt;
    line-height: 1.02;
  }

  .notice-body p {
    margin: 0;
  }

  .agenda {
    margin-top: 2px;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .agenda h3 {
    margin: 0;
    padding: 0;
    font-size: 8.2pt;
    color: #000;
  }

  .agenda li {
    break-inside: avoid;
  }

  .agenda-section {
    gap: 1px;
  }

  .agenda-section + .agenda-section {
    margin-top: 2px;
  }

  .agenda h4 {
    padding: 0;
    border: 0;
    border-bottom: 1px solid #000;
    border-radius: 0;
    background: transparent;
    color: #000;
    font-family: "Times New Roman", serif;
    font-size: 7.9pt;
  }

  .agenda-list {
    padding-left: 0;
    font-family: "Times New Roman", serif;
    font-size: 8.4pt;
  }

  .agenda-list li + li {
    margin-top: 1px;
  }

  .agenda p {
    margin: 2px 0 0;
  }

  .agenda-list > li:first-child {
    break-before: avoid-page;
    page-break-before: avoid;
  }

}
</style>
