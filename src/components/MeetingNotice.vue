<script setup lang="ts">
import type { BulletinForm, BulletinQuestionSection } from '../types'

export interface NoticeMaterial {
  src: string
  label: string
}

defineProps<{
  form: BulletinForm
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionSections: BulletinQuestionSection[]
  materials: NoticeMaterial[]
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

      <div v-if="materials.length > 0" class="notice-materials">
        <h3>Приложения</h3>
        <ol class="attachments-list">
          <li
            v-for="(mat, idx) in materials"
            :key="`attachment-${idx}`"
          >
            Приложение {{ idx + 1 }}. {{ mat.label }}
          </li>
        </ol>
        <div class="materials-grid">
          <figure
            v-for="(mat, idx) in materials"
            :key="idx"
            class="mat-item"
          >
            <img :src="mat.src" :alt="mat.label" />
            <figcaption>Приложение {{ idx + 1 }}. {{ mat.label }}</figcaption>
          </figure>
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
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(6, 58, 156, 0.12);
}

.document-mark {
  margin: 0 0 4px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gos-blue);
}

.notice-card h2 {
  margin: 0 0 8px;
  text-align: center;
  font-size: clamp(1.35rem, 2.6vw, 1.75rem);
  line-height: 1.25;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--gos-ink);
}

.document-subtitle {
  margin: 0;
  text-align: center;
  font-size: 0.92rem;
  color: var(--gos-muted);
  line-height: 1.4;
}

.document-address {
  margin: 2px 0 12px;
  text-align: center;
  font-size: clamp(1.2rem, 2.4vw, 1.55rem);
  font-weight: 700;
  color: var(--gos-ink);
  line-height: 1.3;
}

.address-box {
  margin-top: 14px;
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
.agenda {
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
}

.notice-meta p,
.notice-body p {
  margin: 0 0 6px;
  line-height: 1.45;
}

.notice-meta p:last-child,
.notice-body p:last-child {
  margin-bottom: 0;
}

.notice-body p {
  text-indent: 1.5em;
}

.agenda h3 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gos-blue);
}

.agenda-section {
  display: grid;
  gap: 8px;
}

.agenda-section + .agenda-section {
  margin-top: 16px;
}

.agenda h4 {
  margin: 0;
  padding: 8px 12px;
  border-left: 4px solid var(--gos-blue);
  border-radius: 0 6px 6px 0;
  background: #edf5ff;
  color: var(--gos-blue-dark);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.04em;
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

.notice-materials {
  margin-top: 16px;
  padding: 18px 20px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fbfdff;
}

.notice-materials h3 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gos-blue);
}

.attachments-list {
  margin: 0 0 14px;
  padding-left: 22px;
  color: var(--gos-ink);
  line-height: 1.45;
}

.attachments-list li + li {
  margin-top: 4px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.mat-item {
  margin: 0;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.mat-item img {
  display: block;
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.mat-item figcaption {
  padding: 8px 10px;
  font-size: 0.78rem;
  color: var(--gos-muted);
  text-align: center;
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
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.15;
    color: #000;
  }

  .document-mark {
    margin: 0 0 4pt;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #000;
  }

  .notice-card h2 {
    margin: 0 0 6pt;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
    color: #000;
  }

  .document-subtitle {
    margin: 0;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    color: #000;
  }

  .document-address {
    margin: 2pt 0 8pt;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 11pt;
    font-weight: 700;
    color: #000;
  }

  .address-box {
    display: none;
  }

  .notice-meta {
    margin: 6pt 0 4pt;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.2;
  }

  .notice-meta p {
    margin: 0;
  }

  .notice-body {
    margin: 6pt 0;
    padding: 0;
    border: 0;
    background: transparent;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.2;
    text-indent: 12.5mm;
  }

  .notice-body p {
    margin: 0;
  }

  .agenda {
    margin-top: 8pt;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .agenda h3 {
    margin: 0 0 6pt;
    padding: 0;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
  }

  .agenda li {
    break-inside: avoid;
  }

  .agenda-section {
    gap: 1pt;
  }

  .agenda-section + .agenda-section {
    margin-top: 4pt;
  }

  .agenda h4 {
    margin: 0;
    padding: 2pt 0;
    border: 0;
    border-bottom: 1px solid #000;
    border-radius: 0;
    background: transparent;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
    text-transform: none;
    letter-spacing: 0;
  }

  .agenda-list {
    margin: 2pt 0 0;
    padding-left: 0;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.15;
    list-style-position: inside;
  }

  .agenda-list li + li {
    margin-top: 2pt;
  }

  .agenda-list strong {
    font-size: 10pt;
  }

  .agenda p {
    margin: 1pt 0 0;
  }

  .agenda-list > li:first-child {
    break-before: avoid-page;
    page-break-before: avoid;
  }

  .notice-materials {
    margin-top: 8pt;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .notice-materials h3 {
    margin: 0 0 6pt;
    padding: 0;
    text-align: center;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
  }

  .attachments-list {
    margin: 0 0 6pt;
    padding-left: 0;
    font-family: "Times New Roman", serif;
    font-size: 10pt;
    line-height: 1.15;
    list-style: none;
  }

  .attachments-list li + li {
    margin-top: 1pt;
  }

  .materials-grid {
    display: block;
  }

  .mat-item {
    display: block;
    margin: 0 0 4pt;
    border: 1px solid #000;
    border-radius: 0;
    break-inside: avoid;
  }

  .mat-item img {
    display: block;
    width: 100%;
    height: auto;
  }

  .mat-item figcaption {
    padding: 2pt 4pt;
    font-family: "Times New Roman", serif;
    font-size: 9pt;
    color: #000;
    text-align: center;
  }
}
</style>
