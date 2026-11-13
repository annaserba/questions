import type { BulletinQuestion } from '../../types'
import propertyAgenda from './property.json'

const questionsByHouse = new Map(Object.entries(propertyAgenda.byHouse))

export function propertyQuestions(houseAddress: string, managementCompany: string): BulletinQuestion[] {
  return [...propertyAgenda.common, ...(questionsByHouse.get(houseAddress) ?? [])].map((question) => ({
    ...question,
    description: question.description.replace(/\{managementCompany\}/g, () => managementCompany),
    section: propertyAgenda.section,
  }))
}
