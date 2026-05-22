<script setup lang="ts">
import type { BulletinForm, NumberedBulletinQuestionSection } from '../types'

defineProps<{
  form: BulletinForm
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionSections: NumberedBulletinQuestionSection[]
}>()
</script>

<template>
  <section class="notice-sheet">
    <article class="notice-card">
      <p class="document-mark">УВЕДОМЛЕНИЕ</p>
      <h2>О проведении общего собрания собственников помещений</h2>
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
        <p><strong>Управляющая компания:</strong> {{ form.managementCompany }}</p>
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
        <section
          v-for="section in questionSections"
          :key="section.title"
          class="agenda-section"
        >
          <h4>{{ section.title }}</h4>
          <ol
            class="agenda-list"
            :start="section.questions[0]?.displayNumber"
          >
            <li v-for="question in section.questions" :key="question.id">
              <strong>{{ question.title }}</strong>
              <p>{{ question.description }}</p>
            </li>
          </ol>
        </section>
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

.notice-card h2 {
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

.notice-meta,
.notice-body,
.agenda,
.notice-footer {
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid #232323;
  background: #fff;
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
  padding-bottom: 8px;
  border-bottom: 1px solid #232323;
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

.print-signature {
  display: none;
}

@media (max-width: 980px) {
  .notice-sheet {
    padding: 20px 20px 0;
  }

  .notice-card {
    padding: 24px;
  }
}

@media print {
  .notice-sheet {
    padding: 0;
  }

  .notice-card {
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

  .notice-card h2 {
    margin: 0 0 10px;
    font-size: 15pt;
  }

  .address-box,
  .notice-meta,
  .notice-body,
  .agenda,
  .notice-footer {
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

  .notice-meta,
  .notice-body,
  .agenda,
  .notice-footer {
    margin-top: 12px;
  }

  .agenda li {
    break-inside: avoid;
  }

  .agenda-section {
    gap: 8px;
  }

  .agenda h4,
  .agenda-list {
    font-size: 9.6pt;
  }

  .agenda-list > li:first-child {
    break-before: avoid-page;
    page-break-before: avoid;
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
