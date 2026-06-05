<script setup lang="ts">
import { ref } from "vue";
import type { BulletinForm, DocumentView } from "../types";

defineProps<{
  form: BulletinForm;
  houseAddressOptions: readonly string[];
  currentDocument: DocumentView;
  canManageMeeting: boolean;
  latestNoticeDate: string;
  maxVotingEndDate: string;
  durationWarning: string;
  noticeWarning: string;
  gisIdentityWarning: string;
}>();

defineEmits<{
  print: [];
  "edit-profile": [];
  "update:current-document": [value: DocumentView];
}>();

const infoOpen = ref(false);
const menuOpen = ref(false);
</script>

<template>
  <aside class="control-panel">
    <div class="panel-top">
      <h1>Документы ОСС</h1>
      <button
        class="menu-toggle"
        type="button"
        aria-label="Меню"
        @click="menuOpen = !menuOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="panel-body" :class="{ open: menuOpen }">
      <button class="info-button" type="button" @click="infoOpen = true">
        О голосовании
      </button>
      <button class="info-button" type="button" @click="$emit('edit-profile')">
        Изменить данные
      </button>

      <section class="panel-block">
      <div class="block-head">
        <h2>Документ</h2>
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
        <button
          v-if="canManageMeeting"
          :class="['switch-button', { active: currentDocument === 'checklist' }]"
          type="button"
          @click="$emit('update:current-document', 'checklist')"
        >
          Чеклист
        </button>
      </div>
    </section>

    <section class="panel-block online-vote-card">
      <div class="block-head">
        <h2>Онлайн-голосование</h2>
      </div>

      <div class="online-vote-actions">
        <a
          class="online-vote-link primary"
          href="https://dom.gosuslugi.ru/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Голосовать в ГИС ЖКХ
        </a>
        <a
          class="online-vote-link"
          href="https://apps.apple.com/ru/app/%D0%B3%D0%BE%D1%81%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8-%D0%B4%D0%BE%D0%BC/id1616550510"
          target="_blank"
          rel="noopener noreferrer"
        >
          Госуслуги Дом для iPhone
        </a>
        <a
          class="online-vote-link"
          href="https://play.google.com/store/apps/details?id=ru.sigma.gisgkh"
          target="_blank"
          rel="noopener noreferrer"
        >
          Госуслуги Дом для Android
        </a>
        <a
          class="online-vote-link muted"
          href="https://cdn.dom.gosuslugi.ru/webhelp/reg/topics/public_part/mobapp/t_mobapp.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Все способы установки
        </a>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="infoOpen"
        class="info-overlay"
        @click.self="infoOpen = false"
      >
        <div class="info-modal">
          <button class="info-close" @click="infoOpen = false">&times;</button>
          <h2>О голосовании</h2>
          <p>
            Настоящее голосование проводится для принятия решений по вопросам
            управления многоквартирным домом: выбор управляющей компании,
            установка ворот и ограждений, системы видеонаблюдения, учреждение
            совета дома и другие важные вопросы благоустройства и безопасности.
          </p>
          <p>
            <strong>Почему важно проголосовать?</strong> Решения общего собрания
            собственников имеют обязательную силу для всех жильцов дома. Без
            кворума собрание будет считаться несостоявшимся, и ни одно решение
            не будет принято. Ваш голос напрямую влияет на качество жизни в
            доме.
          </p>
          <p class="info-highlight">
            По всем вопросам повестки дня рекомендуется голосовать
            <strong>«ЗА»</strong> — это позволит реализовать проект
            благоустройства в полном объёме.
          </p>
          <button class="info-ok" @click="infoOpen = false">
            Понятно
          </button>
        </div>
      </div>
    </Teleport>

    <section v-if="canManageMeeting" class="panel-block">
      <div class="block-head">
        <h2>Параметры собрания</h2>
      </div>

      <div class="grid">
        <label>
          <span>Дата уведомления</span>
          <input
            v-model="form.noticeDate"
            :max="latestNoticeDate"
            type="date"
          />
        </label>

        <label>
          <span>Дата начала голосования</span>
          <input v-model="form.votingStartDate" type="date" />
        </label>

        <label>
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
      <div class="rule-list">
        <p v-if="noticeWarning" class="warning">{{ noticeWarning }}</p>
        <p v-if="durationWarning" class="warning">{{ durationWarning }}</p>
        <p v-if="gisIdentityWarning" class="warning">
          {{ gisIdentityWarning }}
        </p>
        <p
          v-if="!noticeWarning && !durationWarning && !gisIdentityWarning"
          class="ok-status"
        >
          Даты в порядке
        </p>
      </div>
    </section>
    </div>

  </aside>
</template>

<style scoped>
.control-panel {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  padding: 24px 20px;
  background:
    radial-gradient(
      circle at 18% 0%,
      rgba(45, 183, 245, 0.22),
      transparent 26%
    ),
    linear-gradient(180deg, #0d4cd3 0%, #063a9c 100%);
  color: #ffffff;
}

.panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border: 0;
  background: none;
  cursor: pointer;
}

.menu-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  border-radius: 1px;
  background: #fff;
  transition: transform 200ms ease, opacity 200ms ease;
}

.panel-body {
  display: contents;
}

.info-button {
  width: 100%;
  margin-bottom: 12px;
  padding: 11px 16px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: #eef6ff;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 140ms ease;
}

.info-button:hover {
  background: rgba(255, 255, 255, 0.18);
}

.info-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.7);
}

.info-modal {
  position: relative;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px 28px 24px;
  border-radius: 14px;
  background: #fff;
  color: #1a202c;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.info-modal h2 {
  margin: 0 0 16px;
  font-size: 1.25rem;
  color: var(--gos-blue, #0d4cd3);
}

.info-modal p {
  margin: 0 0 14px;
  font-size: 0.94rem;
  line-height: 1.55;
}

.info-highlight {
  padding: 14px 16px;
  border-radius: 10px;
  background: #eef6ff;
  border-left: 4px solid var(--gos-blue, #0d4cd3);
  font-weight: 500;
}

.info-highlight strong {
  color: var(--gos-blue, #0d4cd3);
}

.info-close {
  position: absolute;
  top: 10px;
  right: 14px;
  border: 0;
  background: none;
  font-size: 1.6rem;
  color: #888;
  cursor: pointer;
}

.info-ok {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: var(--gos-blue, #0d4cd3);
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

.control-panel h1 {
  margin: 0;
  font-size: clamp(1.45rem, 2.4vw, 1.9rem);
  line-height: 1.05;
}

.panel-block {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(207, 227, 255, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.block-head {
  margin-bottom: 10px;
}

.block-head h2 {
  margin: 0;
  font-size: 1rem;
  color: #ffffff;
}

.document-switch {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  gap: 10px;
}

.switch-button {
  border: 1px solid rgba(207, 227, 255, 0.26);
  border-radius: 10px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.08);
  color: #eef6ff;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background 140ms ease;
}

.switch-button:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.5);
}

.switch-button.active {
  background: #ffffff;
  color: #0d4cd3;
  border-color: transparent;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.grid label {
  display: grid;
  gap: 6px;
}

.grid span {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.76);
}

.grid input,
.grid select,
.grid textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(207, 227, 255, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.grid input:focus,
.grid select:focus,
.grid textarea:focus {
  outline: 2px solid rgba(255, 255, 255, 0.72);
  outline-offset: 1px;
}

.rule-list {
  display: grid;
  gap: 8px;
}

.rule-list p {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
}

.warning {
  color: #ffe3e6;
  font-weight: 600;
  background: rgba(233, 66, 82, 0.14);
  border: 1px solid rgba(255, 227, 230, 0.28);
  border-radius: 10px;
  padding: 10px 12px;
}

.ok-status {
  color: #d8f7e7;
  font-weight: 700;
}

.print-button {
  width: 100%;
  margin-top: 12px;
  border: 0;
  border-radius: 10px;
  padding: 15px 20px;
  background: #ffffff;
  color: #0d4cd3;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(3, 34, 90, 0.22);
}

.online-vote-card {
  background: rgba(255, 255, 255, 0.08);
}

.online-vote-actions {
  display: grid;
  gap: 8px;
}

.online-vote-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid rgba(207, 227, 255, 0.3);
  border-radius: 10px;
  color: #eef6ff;
  font-weight: 700;
  text-decoration: none;
}

.online-vote-link.primary {
  background: #ffffff;
  color: #0d4cd3;
  border-color: transparent;
}

.online-vote-link.muted {
  min-height: 36px;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(238, 246, 255, 0.86);
}

@media (max-width: 980px) {
  .control-panel {
    position: sticky;
    top: 0;
    z-index: 20;
    height: auto;
    overflow: visible;
    padding: 14px 14px;
  }

  .control-panel h1 {
    font-size: 1.15rem;
  }

  .panel-top {
    margin-bottom: 0;
  }

  .menu-toggle {
    display: flex;
  }

  .panel-body {
    display: none;
  }

  .panel-body.open {
    display: block;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
    padding-bottom: 20px;
  }

  .info-button {
    margin-top: 12px;
  }

  .panel-block {
    padding: 12px;
    margin-top: 10px;
  }

  .block-head h2 {
    font-size: 0.92rem;
  }

  .document-switch,
  .grid {
    grid-template-columns: 1fr;
  }

  .switch-button {
    padding: 10px 12px;
    font-size: 0.88rem;
  }

  .grid input,
  .grid select,
  .grid textarea {
    padding: 8px 10px;
  }

  .online-vote-link {
    font-size: 0.85rem;
    min-height: 38px;
    padding: 8px 12px;
  }

  .info-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
    padding: 24px 18px 20px;
  }

  .info-modal h2 {
    font-size: 1.1rem;
  }

  .info-modal p {
    font-size: 0.88rem;
  }
}

@media print {
  .control-panel {
    display: none;
  }
}
</style>
