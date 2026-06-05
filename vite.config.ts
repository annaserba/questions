import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

interface AnalyzeQuestionPayload {
  houseAddress?: string
  sectionTitle?: string
  title?: string
  description?: string
  explanation?: string
}

interface ApprovedQuestionsPayload {
  questions?: string[]
}

interface MeetingSettings {
  noticeDate: string
  votingStartDate: string
  votingEndDate: string
}

const approvedQuestionsFile = resolve(process.cwd(), 'src/data/approved-questions.json')
const meetingSettingsFile = resolve(process.cwd(), 'src/data/meeting-settings.json')

function readJsonBody<T>(req: import('node:http').IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}') as T)
      } catch {
        reject(new Error('Некорректный JSON в запросе.'))
      }
    })

    req.on('error', reject)
  })
}

function sendJson(
  res: import('node:http').ServerResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function normalizeApprovedQuestionTitle(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim() || null
  }

  if (value && typeof value === 'object') {
    const title = (value as { title?: unknown }).title
    return typeof title === 'string' && title.trim() ? title.trim() : null
  }

  return null
}

async function readApprovedQuestionsStore(): Promise<string[]> {
  try {
    const rawValue = await readFile(approvedQuestionsFile, 'utf-8')
    const parsedValue = JSON.parse(rawValue) as unknown

    if (Array.isArray(parsedValue)) {
      return parsedValue
        .map(normalizeApprovedQuestionTitle)
        .filter((title): title is string => title !== null)
    }

    if (parsedValue && typeof parsedValue === 'object') {
      return Object.values(parsedValue)
        .flatMap((questions) => Array.isArray(questions) ? questions : [])
        .map(normalizeApprovedQuestionTitle)
        .filter((title): title is string => title !== null)
    }

    return []
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function writeApprovedQuestionsStore(store: string[]): Promise<void> {
  await mkdir(dirname(approvedQuestionsFile), { recursive: true })
  await writeFile(approvedQuestionsFile, `${JSON.stringify(store, null, 2)}\n`, 'utf-8')
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isMeetingSettings(value: unknown): value is MeetingSettings {
  if (!value || typeof value !== 'object') {
    return false
  }

  const settings = value as Partial<MeetingSettings>
  return isIsoDate(settings.noticeDate) &&
    isIsoDate(settings.votingStartDate) &&
    isIsoDate(settings.votingEndDate)
}

async function readMeetingSettings(): Promise<MeetingSettings | null> {
  try {
    const rawValue = await readFile(meetingSettingsFile, 'utf-8')
    const parsedValue = JSON.parse(rawValue) as unknown
    return isMeetingSettings(parsedValue) ? parsedValue : null
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function writeMeetingSettings(settings: MeetingSettings): Promise<void> {
  await mkdir(dirname(meetingSettingsFile), { recursive: true })
  await writeFile(meetingSettingsFile, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8')
}

function deepSeekAnalyzerPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'deepseek-question-analyzer',
    configureServer(server) {
      server.middlewares.use('/api/analyze-question', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Метод не поддерживается.' })
          return
        }

        const apiKey = env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY

        if (!apiKey) {
          sendJson(res, 500, {
            error: 'Не задан DEEPSEEK_API_KEY. Добавьте ключ в окружение перед запуском dev-сервера.',
          })
          return
        }

        try {
          const payload = await readJsonBody<AnalyzeQuestionPayload>(req)
          const title = payload.title?.trim()
          const description = payload.description?.trim()

          if (!title || !description) {
            sendJson(res, 400, { error: 'Передайте заголовок и текст вопроса.' })
            return
          }

          const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: env.DEEPSEEK_MODEL || process.env.DEEPSEEK_MODEL || 'deepseek-chat',
              temperature: 0.2,
              max_tokens: 900,
              messages: [
                {
                  role: 'system',
                  content:
                    'Ты помогаешь проверить вопрос повестки ОСС МКД в России. Дай краткий практический анализ: понятность формулировки, риски оспаривания, что уточнить в тексте, какие документы/реквизиты приложить. Не выдавай себя за юриста и не обещай юридическую гарантию.',
                },
                {
                  role: 'user',
                  content: [
                    `Адрес дома: ${payload.houseAddress || 'не указан'}`,
                    `Раздел: ${payload.sectionTitle || 'не указан'}`,
                    `Вопрос: ${title}`,
                    `Описание: ${description}`,
                    payload.explanation ? `Пояснение: ${payload.explanation}` : '',
                  ].filter(Boolean).join('\n'),
                },
              ],
            }),
          })

          const result = await deepSeekResponse.json() as {
            choices?: Array<{ message?: { content?: string } }>
            error?: { message?: string }
          }

          if (!deepSeekResponse.ok) {
            sendJson(res, deepSeekResponse.status, {
              error: result.error?.message || 'DeepSeek вернул ошибку.',
            })
            return
          }

          sendJson(res, 200, {
            analysis: result.choices?.[0]?.message?.content || 'DeepSeek не вернул текст анализа.',
          })
        } catch (error) {
          sendJson(res, 500, {
            error: error instanceof Error ? error.message : 'Ошибка анализа вопроса.',
          })
        }
      })
    },
  }
}

function approvedQuestionsPlugin(): Plugin {
  return {
    name: 'approved-questions-store',
    configureServer(server) {
      server.middlewares.use('/api/approved-questions', async (req, res) => {
        try {
          if (req.method === 'GET') {
            const store = await readApprovedQuestionsStore()

            sendJson(res, 200, { questions: store })
            return
          }

          if (req.method === 'POST') {
            const payload = await readJsonBody<ApprovedQuestionsPayload>(req)

            if (!Array.isArray(payload.questions) || !payload.questions.every((title) => typeof title === 'string')) {
              sendJson(res, 400, { error: 'Передайте список согласованных вопросов.' })
              return
            }

            const store = payload.questions.map((title) => title.trim()).filter(Boolean)
            await writeApprovedQuestionsStore(store)
            sendJson(res, 200, { ok: true, questions: store })
            return
          }

          sendJson(res, 405, { error: 'Метод не поддерживается.' })
        } catch (error) {
          sendJson(res, 500, {
            error: error instanceof Error ? error.message : 'Ошибка сохранения согласованных вопросов.',
          })
        }
      })
    },
  }
}

function meetingSettingsPlugin(): Plugin {
  return {
    name: 'meeting-settings-store',
    configureServer(server) {
      server.middlewares.use('/api/meeting-settings', async (req, res) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, { settings: await readMeetingSettings() })
            return
          }

          if (req.method === 'POST') {
            const payload = await readJsonBody<Partial<MeetingSettings>>(req)

            if (!isMeetingSettings(payload)) {
              sendJson(res, 400, { error: 'Передайте корректные даты собрания.' })
              return
            }

            await writeMeetingSettings(payload)
            sendJson(res, 200, { ok: true, settings: payload })
            return
          }

          sendJson(res, 405, { error: 'Метод не поддерживается.' })
        } catch (error) {
          sendJson(res, 500, {
            error: error instanceof Error ? error.message : 'Ошибка сохранения параметров собрания.',
          })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), deepSeekAnalyzerPlugin(env), approvedQuestionsPlugin(), meetingSettingsPlugin()],
  }
})
