import type { BulletinQuestion } from '../../types'

export function councilQuestions(chairman: string, council: string): BulletinQuestion[] {
  return [
    {
      title: `Переизбрать совет дома в составе: ${council} и избрать ${chairman} председателем`,
      description:
        `Переизбрать совет многоквартирного дома в составе: ${council}. Избрать председателем совета многоквартирного дома ${chairman}.`,
      explanation:
        'По ст. 161.1 ЖК РФ в доме, где нет ТСЖ и более 4 квартир, должен быть совет дома. Председатель — ключевая фигура: подписывает договоры, акты и представляет интересы дома в суде и органах власти.',
      section: 'Совет дома',
      quorum: '>50%',
    },
  ]
}
