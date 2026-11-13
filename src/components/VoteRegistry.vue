<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PreviousVoteStatus, VoteProgressSettings, VoteRegistry, VoteRegistryStatus } from '../types'

const props = defineProps<{
  houseAddress: string
  registry: VoteRegistry
  houseProgress: VoteProgressSettings
  saving: boolean
  saveStatus: string
  isPage?: boolean
}>()

const emit = defineEmits<{
  close: []
  'update-status': [house: string, entrance: string, floor: string, apartment: string, status: VoteRegistryStatus]
  'update-note': [house: string, entrance: string, floor: string, apartment: string, note: string]
  'update-house-progress': [house: string, area: number]
}>()

const selectedHouse = ref(props.houseAddress)
const selectedEntrance = ref('')
const selectedFloor = ref('')
const houses = computed(() => Object.keys(props.registry))

const activeHouse = computed(() => {
  return houses.value.includes(selectedHouse.value)
    ? selectedHouse.value
    : houses.value[0] || ''
})

const entrances = computed(() => Object.keys(props.registry[activeHouse.value] || {}).sort((a, b) => Number(a) - Number(b)))
const activeEntrance = computed(() => {
  return entrances.value.includes(selectedEntrance.value)
    ? selectedEntrance.value
    : entrances.value[0] || ''
})

const floors = computed(() => Object.keys(props.registry[activeHouse.value]?.[activeEntrance.value] || {}).sort((a, b) => Number(a) - Number(b)))
const isCommercial = computed(() => activeEntrance.value === 'commercial')
const activeFloor = computed(() => {
  return floors.value.includes(selectedFloor.value)
    ? selectedFloor.value
    : floors.value[0] || ''
})

const entries = computed(() => props.registry[activeHouse.value]?.[activeEntrance.value]?.[activeFloor.value] || [])
const entranceFloors = computed(() => props.registry[activeHouse.value]?.[activeEntrance.value] || {})
const commercialEntries = computed(() => props.registry[activeHouse.value]?.commercial?.commercial || [])
const houseEntries = computed(() => Object.values(props.registry[activeHouse.value] || {})
  .flatMap((floors) => Object.values(floors).flat()))
const votedArea = computed(() => houseEntries.value
  .filter((entry) => entry.status !== 'pending')
  .reduce((sum, entry) => sum + (Number(String(entry.area).replace(',', '.')) || 0), 0))
const totalHouseArea = computed(() => props.houseProgress[activeHouse.value] || 0)
const houseAreaProgress = computed(() => totalHouseArea.value > 0
  ? Math.min(100, votedArea.value / totalHouseArea.value * 100)
  : 0)
const completedCount = computed(() => entries.value.filter((entry) => entry.status !== 'pending').length)
const progress = computed(() => entries.value.length ? (completedCount.value / entries.value.length) * 100 : 0)

const labels: Record<VoteRegistryStatus, string> = {
  pending: 'Не отмечено',
  online: 'Голос в ГИС ЖКХ',
  paper: 'Бумажный бланк',
}

const previousVoteLabels: Record<PreviousVoteStatus, string> = {
  none: '',
  online: 'Онлайн',
  paper: 'Бланк',
  online_and_paper: 'Онлайн и бланк',
}

function updatedLabel(value: string): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`))
}

function formatArea(value: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)
}

function printRegistry(): void {
  const pageStyle = document.createElement('style')
  const printHeader = `Реестр участия в голосовании | ${activeHouse.value}`
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  pageStyle.textContent = `@media print { @page { size: A4 portrait; margin: 16mm 10mm 10mm; @top-left { content: "${printHeader}"; font-family: Arial, sans-serif; font-size: 5.7pt; color: #5c7188; } @bottom-left { content: none; } @bottom-right { content: none; } } }`
  document.head.appendChild(pageStyle)
  document.body.classList.add('printing-vote-registry')
  const cleanup = () => {
    document.body.classList.remove('printing-vote-registry')
    pageStyle.remove()
  }
  window.addEventListener('afterprint', cleanup, { once: true })
  window.print()
}
</script>

<template>
  <Teleport to="body" :disabled="isPage">
    <div class="registry-overlay" :class="{ 'registry-page': isPage }" @click.self="!isPage && $emit('close')">
      <section class="registry-dialog" aria-modal="true" role="dialog" aria-label="Реестр голосования">
        <header class="registry-header">
          <div>
            <p class="registry-kicker">Реестр участия</p>
            <h2>{{ activeHouse }}</h2>
          </div>
          <button v-if="!isPage" class="icon-button" type="button" aria-label="Закрыть" title="Закрыть" @click="$emit('close')">×</button>
        </header>

        <template v-if="floors.length">
          <section class="house-progress-card">
            <div class="house-progress-title">
              <div>
                <p>Прогресс дома по площади</p>
                <strong>{{ formatArea(votedArea) }} м² из {{ formatArea(totalHouseArea) }} м²</strong>
              </div>
              <b>{{ houseAreaProgress.toFixed(1).replace('.', ',') }}%</b>
            </div>
            <div class="house-progress-track" aria-hidden="true"><span :style="{ width: `${houseAreaProgress}%` }"></span></div>
            <label class="house-area-input">
              <span>Общая площадь для расчета, м²</span>
              <input
                :value="totalHouseArea || ''"
                inputmode="decimal"
                type="number"
                min="0"
                step="0.1"
                @change="$emit('update-house-progress', activeHouse, Number(($event.target as HTMLInputElement).value))"
              />
            </label>
          </section>
          <div class="house-tabs" role="tablist" aria-label="Дом">
            <button
              v-for="house in houses"
              :key="house"
              class="house-tab"
              :class="{ active: activeHouse === house }"
              type="button"
              @click="selectedHouse = house"
            >
              {{ house.replace('пр-т. Октябрьской революции, ', 'ПОР ') }}
            </button>
          </div>
          <div class="floor-tabs" role="tablist" aria-label="Подъезд">
            <button
              v-for="entrance in entrances"
              :key="entrance"
              class="floor-tab"
              :class="{ active: activeEntrance === entrance }"
              type="button"
              @click="selectedEntrance = entrance"
            >
              {{ entrance === 'commercial' ? 'Коммерческие помещения' : `Подъезд ${entrance}` }}
            </button>
          </div>
          <div v-if="!isCommercial" class="floor-tabs" role="tablist" aria-label="Этаж">
            <button
              v-for="floor in floors"
              :key="floor"
              class="floor-tab"
              :class="{ active: activeFloor === floor }"
              type="button"
              @click="selectedFloor = floor"
            >
              {{ floor }} этаж
            </button>
          </div>

          <div class="registry-summary">
            <div>
              <p>{{ isCommercial ? 'Коммерческие помещения' : `Подъезд ${activeEntrance}, ${activeFloor} этаж` }}</p>
              <strong>{{ completedCount }} из {{ entries.length }}</strong>
              <span>квартир отметили участие</span>
            </div>
            <div class="progress-track" aria-hidden="true"><span :style="{ width: `${progress}%` }"></span></div>
          </div>

          <div class="registry-table-wrap">
            <table class="registry-table">
              <thead>
                <tr><th>{{ isCommercial ? 'Помещение' : 'Квартира' }}</th><th>Собственник</th><th>Телефон</th><th>Площадь</th><th>Кадастровый номер</th><th>Предыдущее голосование</th><th>Статус</th><th>Отметка</th><th>Заметка</th></tr>
              </thead>
              <tbody>
                <tr v-for="entry in entries" :key="entry.apartment" :class="`status-${entry.status}`">
                  <td><strong>{{ isCommercial ? 'Помещение' : 'Квартира' }} № {{ entry.apartment }}</strong></td>
                  <td>{{ entry.ownerName || '—' }}</td>
                  <td>{{ entry.phone || '—' }}</td>
                  <td>{{ entry.area ? `${entry.area} м²` : '—' }}</td>
                  <td class="cadastral-cell">{{ entry.cadastral || '—' }}</td>
                  <td>{{ previousVoteLabels[entry.previousVote] || '—' }}</td>
                  <td>
                    <select :value="entry.status" @change="$emit('update-status', activeHouse, activeEntrance, activeFloor, entry.apartment, ($event.target as HTMLSelectElement).value as VoteRegistryStatus)">
                      <option v-for="(label, status) in labels" :key="status" :value="status">{{ label }}</option>
                    </select>
                  </td>
                  <td>{{ updatedLabel(entry.updatedAt) || '—' }}</td>
                  <td><input :value="entry.note" aria-label="Заметка" placeholder="Необязательно" @change="$emit('update-note', activeHouse, activeEntrance, activeFloor, entry.apartment, ($event.target as HTMLInputElement).value)" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <section class="print-entrance" aria-hidden="true">
            <header>
              <p>Реестр участия в голосовании</p>
              <h2>{{ activeHouse }}</h2>
              <strong>{{ isCommercial ? 'Коммерческие помещения' : `Подъезд ${activeEntrance}` }}</strong>
            </header>
            <section v-for="floor in floors" :key="`print-${floor}`" class="print-floor">
              <h3 v-if="!isCommercial">{{ floor }} этаж</h3>
              <div class="print-apartment-cards">
                <article v-for="entry in entranceFloors[floor]" :key="`print-${floor}-${entry.apartment}`" class="print-apartment-card">
                  <strong>{{ isCommercial ? 'Помещение' : 'Квартира' }} {{ entry.apartment }}</strong>
                  <span v-if="isCommercial && entry.ownerName">{{ entry.ownerName }}</span>
                  <span v-else class="manual-name">____________________________</span>
                  <span class="data-slot">{{ entry.phone }}</span>
                  <span class="data-slot">{{ entry.area ? `${entry.area} м²` : '' }}</span>
                  <span class="data-slot">{{ entry.cadastral }}</span>
                  <span class="data-slot">{{ entry.previousVote !== 'none' ? `Предыдущее голосование: ${previousVoteLabels[entry.previousVote]}` : '' }}</span>
                  <span class="data-slot">{{ entry.status !== 'pending' ? `${labels[entry.status]}${updatedLabel(entry.updatedAt) ? `, ${updatedLabel(entry.updatedAt)}` : ''}` : '' }}</span>
                  <span class="data-slot">{{ entry.note }}</span>
                  <div class="manual-marks">
                    <span>□ ГИС ЖКХ</span>
                    <span>□ Бланк</span>
                    <span>□ Связались</span>
                  </div>
                </article>
              </div>
            </section>
            <section v-if="!isCommercial && commercialEntries.length" class="print-floor print-commercial">
              <h3>Коммерческие помещения</h3>
              <div class="print-apartment-cards">
                <article v-for="entry in commercialEntries" :key="`print-commercial-${entry.apartment}`" class="print-apartment-card">
                  <strong>Помещение {{ entry.apartment }}</strong>
                  <span v-if="entry.ownerName">{{ entry.ownerName }}</span>
                  <span v-else class="manual-name">____________________________</span>
                  <span class="data-slot">{{ entry.phone }}</span>
                  <span class="data-slot">{{ entry.area ? `${entry.area} м²` : '' }}</span>
                  <span class="data-slot">{{ entry.cadastral }}</span>
                  <span class="data-slot">{{ entry.previousVote !== 'none' ? `Предыдущее голосование: ${previousVoteLabels[entry.previousVote]}` : '' }}</span>
                  <span class="data-slot">{{ entry.status !== 'pending' ? `${labels[entry.status]}${updatedLabel(entry.updatedAt) ? `, ${updatedLabel(entry.updatedAt)}` : ''}` : '' }}</span>
                  <span class="data-slot">{{ entry.note }}</span>
                  <div class="manual-marks">
                    <span>□ ГИС ЖКХ</span>
                    <span>□ Бланк</span>
                    <span>□ Связались</span>
                  </div>
                </article>
              </div>
            </section>
          </section>
        </template>
        <p v-else class="registry-empty">Для этого дома этажи пока не заведены в реестре.</p>

        <footer class="registry-footer">
          <span>{{ saveStatus || (saving ? 'Сохраняю...' : 'Изменения сохраняются в проект') }}</span>
          <div class="registry-actions">
            <button type="button" class="print-button" @click="printRegistry">Печать подъезда / PDF</button>
            <button type="button" class="close-button" @click="$emit('close')">Готово</button>
          </div>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.registry-overlay { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 24px; background: rgba(8, 24, 56, .56); }
.registry-overlay.registry-page { position: static; display: block; padding: 0; background: none; }
.registry-dialog { width: min(940px, 100%); max-height: min(780px, 92vh); overflow: auto; border-radius: 8px; background: #fff; color: #17243a; box-shadow: 0 22px 70px rgba(0, 0, 0, .28); }
.registry-page .registry-dialog { width: 100%; max-height: none; min-height: 100%; border-radius: 0; box-shadow: none; }
.registry-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 24px 28px 18px; border-bottom: 1px solid #d9e2ef; }
.registry-kicker { margin: 0 0 5px; color: #52708e; font-size: .84rem; font-weight: 700; text-transform: uppercase; }
.registry-header h2 { margin: 0; font-size: 1.25rem; }
.icon-button { width: 36px; height: 36px; border: 0; background: #edf2f8; color: #26435f; font-size: 1.7rem; line-height: 1; cursor: pointer; }
.floor-tabs { display: flex; gap: 8px; padding: 18px 28px 0; overflow-x: auto; }
.house-tabs { display: flex; gap: 8px; padding: 18px 28px 0; overflow-x: auto; border-bottom: 1px solid #e0e7ef; padding-bottom: 14px; }
.house-tab { flex: 0 0 auto; padding: 9px 14px; border: 1px solid #b9c9dc; border-radius: 6px; background: #fff; color: #34506e; font-weight: 700; cursor: pointer; }
.house-tab.active { border-color: #0d4cd3; background: #0d4cd3; color: #fff; }
.house-progress-card { margin: 18px 28px 0; padding: 16px; border: 1px solid #cbd8e6; border-radius: 6px; background: #f8fbfe; }
.house-progress-title { display: flex; align-items: end; justify-content: space-between; gap: 16px; }
.house-progress-title p { margin: 0 0 4px; color: #526b84; font-size: .84rem; font-weight: 700; }
.house-progress-title strong { font-size: 1.05rem; }
.house-progress-title b { color: #087553; font-size: 1.2rem; }
.house-progress-track { height: 10px; overflow: hidden; margin: 12px 0; border-radius: 5px; background: #dfe8f0; }
.house-progress-track span { display: block; height: 100%; background: #14a06f; transition: width .18s ease; }
.house-area-input { display: flex; align-items: center; gap: 9px; color: #536b84; font-size: .82rem; }
.house-area-input input { width: 120px; min-height: 34px; border: 1px solid #b9c9dc; border-radius: 5px; padding: 6px 8px; background: #fff; color: #223a55; font: inherit; }
.floor-tab { flex: 0 0 auto; padding: 9px 14px; border: 1px solid #b9c9dc; border-radius: 6px; background: #fff; color: #34506e; font-weight: 700; cursor: pointer; }
.floor-tab.active { border-color: #0d4cd3; background: #0d4cd3; color: #fff; }
.registry-summary { display: grid; grid-template-columns: minmax(170px, auto) 1fr; align-items: center; gap: 20px; padding: 22px 28px; }
.registry-summary div:first-child { display: grid; gap: 3px; }
.registry-summary p { margin: 0 0 3px; color: #4d6680; font-size: .86rem; font-weight: 700; }
.registry-summary strong { font-size: 1.15rem; }
.registry-summary span { color: #60768d; font-size: .9rem; }
.progress-track { height: 10px; overflow: hidden; border-radius: 5px; background: #e7edf4; }
.progress-track span { display: block; height: 100%; background: #14a06f; transition: width .18s ease; }
.registry-table-wrap { padding: 0 28px 20px; overflow-x: auto; }
.registry-table { width: 100%; border-collapse: collapse; font-size: .94rem; }
.registry-table th { padding: 10px 12px; background: #f1f5f9; color: #4a6077; text-align: left; font-size: .78rem; text-transform: uppercase; }
.registry-table td { padding: 11px 12px; border-bottom: 1px solid #e0e7ef; }
.cadastral-cell { max-width: 180px; overflow-wrap: anywhere; }
.print-entrance { display: none; }
.registry-table tr.status-online td:first-child { border-left: 4px solid #0d70d3; }
.registry-table tr.status-paper td:first-child { border-left: 4px solid #16a46e; }
.registry-table select, .registry-table input { box-sizing: border-box; min-height: 36px; border: 1px solid #bdcddd; border-radius: 5px; padding: 7px 9px; background: #fff; color: #223a55; font: inherit; }
.registry-table input { width: 100%; min-width: 160px; }
.registry-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 28px; border-top: 1px solid #d9e2ef; color: #5c738a; font-size: .9rem; }
.registry-actions { display: flex; gap: 8px; }
.close-button, .print-button { padding: 10px 18px; border: 0; border-radius: 6px; font-weight: 700; cursor: pointer; }
.close-button { background: #0d4cd3; color: #fff; }
.print-button { background: #edf2f8; color: #23415d; }
.registry-empty { padding: 28px; color: #5c738a; }
@media (max-width: 620px) { .registry-overlay { padding: 0; } .registry-dialog { max-height: 100vh; min-height: 100vh; border-radius: 0; } .registry-header, .registry-summary, .registry-footer { padding-left: 16px; padding-right: 16px; } .floor-tabs, .house-tabs { padding-left: 16px; padding-right: 16px; } .house-progress-card { margin-left: 16px; margin-right: 16px; } .house-progress-title, .house-area-input { align-items: start; flex-direction: column; } .registry-summary { grid-template-columns: 1fr; gap: 12px; } .registry-table-wrap { padding-left: 16px; padding-right: 16px; } }
</style>

<style>
@media print {
  body.printing-vote-registry .page-shell { display: block !important; }
  body.printing-vote-registry .page-shell > .control-panel { display: none !important; }
  body.printing-vote-registry .documents > :not(.registry-overlay) { display: none !important; }
  body.printing-vote-registry .registry-overlay { position: static; display: block; padding: 0; background: none; }
  body.printing-vote-registry .registry-dialog { width: 100%; max-height: none; overflow: visible; border-radius: 0; box-shadow: none; }
  body.printing-vote-registry .icon-button,
  body.printing-vote-registry .registry-header,
  body.printing-vote-registry .floor-tabs,
  body.printing-vote-registry .house-tabs,
  body.printing-vote-registry .house-progress-card,
  body.printing-vote-registry .registry-summary,
  body.printing-vote-registry .registry-table-wrap,
  body.printing-vote-registry .registry-actions,
  body.printing-vote-registry .registry-footer > span { display: none; }
  body.printing-vote-registry .print-entrance { display: block; padding-top: 0; }
  body.printing-vote-registry .print-entrance header { display: none; }
  body.printing-vote-registry .print-floor { display: block; clear: both; width: 100%; break-inside: avoid; margin: 0 0 4mm; }
  body.printing-vote-registry .print-floor + .print-floor { margin-top: 5mm; }
  body.printing-vote-registry .print-floor:nth-of-type(even) { break-after: page; }
  body.printing-vote-registry .print-floor h3 { margin: 0 0 1.5mm; font-size: 9pt; }
  body.printing-vote-registry .print-apartment-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(58mm, max-content)); justify-content: start; gap: .8mm; }
  body.printing-vote-registry .print-apartment-card { display: grid; align-content: start; gap: .5mm; min-width: 58mm; min-height: 26mm; padding: 1.2mm 1.5mm; border: .35mm solid #8fa6be; color: #17243a; font-size: 7pt; break-inside: avoid; }
  body.printing-vote-registry .print-apartment-card strong { font-size: 8.4pt; }
  body.printing-vote-registry .print-apartment-card span { overflow-wrap: anywhere; }
  body.printing-vote-registry .print-apartment-card .data-slot { display: block; min-height: 2.7mm; }
  body.printing-vote-registry .manual-marks { display: flex; flex-wrap: wrap; gap: 1.5mm 3mm; margin-top: 1mm; font-size: 6.5pt; }
  body.printing-vote-registry .registry-table-wrap { padding: 0; overflow: visible; }
  body.printing-vote-registry .registry-table { font-size: 7pt; }
  body.printing-vote-registry .registry-table th { padding: 1.2mm 1.5mm; background: #eef2f6 !important; font-size: 6.4pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body.printing-vote-registry .registry-table td { padding: 1.1mm 1.5mm; border-bottom: 0; }
  body.printing-vote-registry .registry-table select,
  body.printing-vote-registry .registry-table input { border: 0; padding: 0; min-height: auto; appearance: none; }
  body.printing-vote-registry .registry-footer { display: none; }
}
</style>
