import type { BulletinForm, BulletinQuestion } from '../types'
import { houseChairman } from './bulletin'
import { gisQuestions } from './questions/gis'
import { managementQuestions } from './questions/management'
import { utilitiesQuestions } from './questions/utilities'
import { videoQuestions } from './questions/video'
import { gatesQuestions } from './questions/gates'
import { councilQuestions } from './questions/council'
import { propertyQuestions } from './questions/property'

export function buildQuestions(form: BulletinForm): BulletinQuestion[] {
  const managementCompany = form.managementCompany.trim() || 'управляющая организация'
  const previousManagementCompany =
    form.previousManagementCompany.trim() || 'действующая управляющая организация'
  const chairman = houseChairman[form.houseAddress] || '_______________'

  return [
    ...gisQuestions(chairman),
    ...managementQuestions(managementCompany, previousManagementCompany),
    ...utilitiesQuestions(),
    ...councilQuestions(chairman),
    ...gatesQuestions(managementCompany),
    ...videoQuestions(),
    ...propertyQuestions(),
  ]
}
