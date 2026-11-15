import type { BulletinQuestion } from '../../types'
import gatesAgenda from './gates.json'

export function gatesQuestions(): BulletinQuestion[] {
  return gatesAgenda.questions.map((question) => ({
    ...question,
    section: gatesAgenda.section,
  }))
}
