import type { BulletinForm, BulletinQuestion } from '../types'
import { houseAdministrator } from './bulletin'
import { gisQuestions } from './questions/gis'
import { managementQuestions } from './questions/management'
import { utilitiesQuestions } from './questions/utilities'
import { videoQuestions } from './questions/video'
import { gatesQuestions } from './questions/gates'
import { propertyQuestions } from './questions/property'

export function buildQuestions(form: BulletinForm): BulletinQuestion[] {
  const managementCompany = form.managementCompany.trim() || 'управляющая организация'
  const previousManagementCompany =
    form.previousManagementCompany.trim() || 'действующая управляющая организация'
  const administrator = houseAdministrator[form.houseAddress] || '_______________'

  return [
    ...gisQuestions(administrator),
    ...managementQuestions(managementCompany, previousManagementCompany),
    ...utilitiesQuestions(),
    ...gatesQuestions(),
    ...videoQuestions(),
    ...propertyQuestions(form.houseAddress, managementCompany),
  ]
}
