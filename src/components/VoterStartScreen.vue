<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { OnlineVotePreference, VoterProfile } from '../types'

const managerPassword = import.meta.env.VITE_MANAGER_PASSWORD || ''

const props = defineProps<{
  houseAddressOptions: readonly string[]
  initialProfile: VoterProfile
}>()

const emit = defineEmits<{
  submit: [profile: VoterProfile]
}>()

const draft = reactive({
  houseAddress: props.initialProfile.houseAddress,
  ownerName: props.initialProfile.ownerName,
  apartment: props.initialProfile.apartment,
  wantsOnlineVote: props.initialProfile.wantsOnlineVote,
  password: '',
})
const passwordError = ref('')

const isManagerIdentity = computed(() =>
  normalizeValue(draft.houseAddress) === normalizeValue('пр-т. Октябрьской революции, 48/1') &&
  normalizeValue(draft.ownerName) === normalizeValue('Серба Анна Владимировна') &&
  draft.apartment.trim() === '198',
)

const canSubmit = computed(() =>
  draft.houseAddress.trim().length > 0 &&
  draft.ownerName.trim().length > 0 &&
  (draft.wantsOnlineVote === 'yes' || draft.wantsOnlineVote === 'no') &&
  (!isManagerIdentity.value || (managerPassword.length > 0 && draft.password.length > 0)),
)

watch(isManagerIdentity, () => {
  passwordError.value = ''
  draft.password = ''
})

function normalizeValue(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
}

function setOnlinePreference(value: OnlineVotePreference) {
  draft.wantsOnlineVote = value
}

function submitProfile() {
  if (!canSubmit.value) {
    return
  }

  const managerUnlocked = isManagerIdentity.value && draft.password === managerPassword

  if (isManagerIdentity.value && !managerPassword) {
    passwordError.value = 'Пароль администратора не настроен'
    return
  }

  if (isManagerIdentity.value && !managerUnlocked) {
    passwordError.value = 'Неверный пароль'
    return
  }

  emit('submit', {
    houseAddress: draft.houseAddress,
    ownerName: draft.ownerName.trim(),
    apartment: draft.apartment.trim(),
    wantsOnlineVote: draft.wantsOnlineVote,
    managerUnlocked,
  })
}
</script>

<template>
  <main class="start-page">
    <section class="start-card">
      <div class="start-head">
        <p>Документы ОСС</p>
        <h1>Заполните данные для голосования</h1>
      </div>

      <form class="start-form" @submit.prevent="submitProfile">
        <label>
          <span>Адрес дома</span>
          <select v-model="draft.houseAddress" required>
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
          <span>ФИО</span>
          <input
            v-model="draft.ownerName"
            type="text"
            autocomplete="name"
            required
          />
        </label>

        <label>
          <span>Квартира / помещение</span>
          <input
            v-model="draft.apartment"
            type="text"
            inputmode="numeric"
            placeholder="Необязательно"
          />
        </label>

        <label v-if="isManagerIdentity">
          <span>Пароль</span>
          <input
            v-model="draft.password"
            type="password"
            inputmode="numeric"
            autocomplete="current-password"
            required
          />
          <small v-if="passwordError">{{ passwordError }}</small>
          <small v-else-if="!managerPassword">Пароль администратора не настроен</small>
        </label>

        <fieldset>
          <legend>Хотите проголосовать онлайн?</legend>
          <div class="choice-row">
            <button
              type="button"
              :class="{ active: draft.wantsOnlineVote === 'yes' }"
              @click="setOnlinePreference('yes')"
            >
              Да
            </button>
            <button
              type="button"
              :class="{ active: draft.wantsOnlineVote === 'no' }"
              @click="setOnlinePreference('no')"
            >
              Нет
            </button>
          </div>
        </fieldset>

        <div v-if="draft.wantsOnlineVote === 'yes'" class="online-links">
          <a href="https://dom.gosuslugi.ru/" target="_blank" rel="noopener noreferrer">
            Голосовать в ГИС ЖКХ
          </a>
          <a
            href="https://apps.apple.com/ru/app/%D0%B3%D0%BE%D1%81%D1%83%D0%B3%D0%B8-%D0%B4%D0%BE%D0%BC/id1616550510"
            target="_blank"
            rel="noopener noreferrer"
          >
            Госуслуги Дом для iPhone
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=ru.sigma.gisgkh"
            target="_blank"
            rel="noopener noreferrer"
          >
            Госуслуги Дом для Android
          </a>
        </div>

        <button class="submit-button" type="submit" :disabled="!canSubmit">
          Продолжить
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.start-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(13, 76, 211, 0.14), transparent 34%),
    linear-gradient(180deg, #f6faff 0%, #eef5ff 100%);
}

.start-card {
  width: min(100%, 560px);
  padding: 34px;
  border: 1px solid var(--gos-line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(6, 58, 156, 0.12);
}

.start-head p {
  margin: 0 0 8px;
  color: var(--gos-blue);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.start-head h1 {
  margin: 0;
  color: var(--gos-ink);
  font-size: clamp(1.45rem, 4vw, 2rem);
  line-height: 1.15;
}

.start-form {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.start-form label,
.start-form fieldset {
  display: grid;
  gap: 8px;
}

.start-form span,
.start-form legend {
  color: var(--gos-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.start-form fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.start-form select,
.start-form input {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid #c8d7ef;
  border-radius: 8px;
  background: #fbfdff;
  color: var(--gos-ink);
}

.start-form select:focus,
.start-form input:focus {
  outline: none;
  border-color: var(--gos-blue);
  box-shadow: 0 0 0 3px rgba(13, 76, 211, 0.12);
}

.start-form small {
  color: var(--gos-red);
  font-weight: 700;
}

.choice-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.choice-row button,
.submit-button,
.online-links a {
  min-height: 44px;
  border-radius: 8px;
  font-weight: 800;
}

.choice-row button {
  border: 1px solid #c8d7ef;
  background: #f8fbff;
  color: var(--gos-blue-dark);
  cursor: pointer;
}

.choice-row button.active {
  border-color: var(--gos-blue);
  background: var(--gos-blue);
  color: #fff;
}

.online-links {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid #c8d7ef;
  border-radius: 8px;
  background: #f4f9ff;
}

.online-links a {
  display: grid;
  place-items: center;
  padding: 8px 12px;
  background: #fff;
  color: var(--gos-blue);
  text-decoration: none;
  border: 1px solid #d8e3f3;
}

.submit-button {
  border: 0;
  background: var(--gos-blue);
  color: #fff;
  cursor: pointer;
}

.submit-button:disabled {
  background: #b9c9e4;
  cursor: default;
}

@media (max-width: 560px) {
  .start-page {
    padding: 12px;
  }

  .start-card {
    padding: 22px 16px;
  }

  .choice-row {
    grid-template-columns: 1fr;
  }
}
</style>
