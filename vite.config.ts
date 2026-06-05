import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'

interface AnalyzeQuestionPayload {
  houseAddress?: string
  sectionTitle?: string
  title?: string
  description?: string
  explanation?: string
}

function readJsonBody(req: import('node:http').IncomingMessage): Promise<AnalyzeQuestionPayload> {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}') as AnalyzeQuestionPayload)
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
          const payload = await readJsonBody(req)
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), deepSeekAnalyzerPlugin(env)],
  }
})
