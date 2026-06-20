import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from 'docx'
import type { BulletinForm, BulletinQuestionSection, VoteChoice } from '../types'

interface ExportData {
  form: BulletinForm
  questionSections: BulletinQuestionSection[]
  formattedDates: {
    noticeDate: string
    votingStartDate: string
    votingEndDate: string
  }
  questionVotes: Record<number, VoteChoice | undefined>
}

const voteLabel: Record<string, string> = {
  for: '✓ ЗА',
  against: '✗ ПРОТИВ',
  abstain: '— ВОЗДЕРЖАЛСЯ',
}

function thinBorder() {
  return {
    style: BorderStyle.SINGLE,
    size: 1,
    color: '000000',
  }
}

function noBorder() {
  return {
    style: BorderStyle.NONE,
    size: 0,
  }
}

export async function exportBulletinToWord(data: ExportData): Promise<void> {
  const { form, questionSections, formattedDates } = data

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              bottom: convertInchesToTwip(1.2),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(0.6),
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'БЮЛЛЕТЕНЬ',
                bold: true,
                size: 28,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'для голосования на общем собрании собственников помещений',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `в многоквартирном доме по адресу: ${form.houseAddress}`,
                bold: true,
                size: 24,
                font: 'Times New Roman',
              }),
            ],
          }),

          // Meeting info
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Форма проведения: ', bold: true, font: 'Times New Roman' }),
              new TextRun({ text: form.meetingType, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Дата уведомления: ', bold: true, font: 'Times New Roman' }),
              new TextRun({ text: formattedDates.noticeDate, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: 'Дата начала голосования: ', bold: true, font: 'Times New Roman' }),
              new TextRun({ text: formattedDates.votingStartDate, font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'Дата окончания голосования: ', bold: true, font: 'Times New Roman' }),
              new TextRun({ text: formattedDates.votingEndDate, font: 'Times New Roman' }),
            ],
          }),

          // Owner info table
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: 'Сведения о собственнике', bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),

          ...buildOwnerTable(form),

          // Questions
          new Paragraph({
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({ text: 'Вопросы повестки дня', bold: true, size: 24, font: 'Times New Roman' }),
            ],
          }),

          ...questionSections.flatMap((section) => buildSection(section, data.questionVotes)),

          // Signature
          new Paragraph({ spacing: { before: 300 }, children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Подпись собственника ____________________', font: 'Times New Roman' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({ text: `Расшифровка подписи ${form.ownerName || '______________________________'}`, font: 'Times New Roman' }),
            ],
          }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Бюллетень_${form.houseAddress.replace(/[\/\\]/g, '_')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildOwnerTable(form: BulletinForm): Table[] {
  const rows: TableRow[] = [
    buildRow('ФИО собственника', form.ownerName),
    buildRow('Помещение (квартира/офис)', form.apartment),
    buildRow('Вид помещения', form.propertyType === 'жилое' ? 'Жилое' : 'Нежилое'),
    buildRow('Площадь, кв. м', form.area),
    buildRow('Доля в праве', form.share),
    buildRow('Документ о собственности', form.ownershipDocument),
    buildRow('Паспорт', form.passportNumber),
    buildRow('СНИЛС', form.snils),
    buildRow('Телефон', form.phone),
  ]

  if (form.isRepresentative) {
    rows.push(
      buildRow('Представитель (ФИО)', form.representativeName),
      buildRow('Паспорт представителя', form.representativePassport),
      buildRow('СНИЛС представителя', form.representativeSnils),
      buildRow('Телефон представителя', form.representativePhone),
    )
  }

  if (form.extraNotes) {
    rows.push(buildRow('Примечания', form.extraNotes))
  }

  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
      cantSplit: true,
    }),
  ]
}

function buildRow(label: string, value: string): TableRow {
  return new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders: { top: thinBorder(), bottom: thinBorder(), left: thinBorder(), right: thinBorder() },
        children: [
          new Paragraph({
            children: [new TextRun({ text: value || '____________________', size: 20, font: 'Times New Roman' })],
          }),
        ],
      }),
    ],
  })
}

function buildSection(
  section: BulletinQuestionSection,
  votes: Record<number, VoteChoice | undefined>,
): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { before: 160, after: 80 },
      keepLines: true,
      children: [
        new TextRun({ text: section.title, bold: true, size: 22, font: 'Times New Roman' }),
      ],
    }),
  ]

  for (const question of section.questions) {
    // Placeholder for section.startNumber + idx logic — needs idx
  }

  // Rebuild with proper numbering
  const questionParagraphs = section.questions.map((question, idx) => {
    const num = section.startNumber + idx
    const vote = votes[num]

    return new Paragraph({
      spacing: { after: 100 },
      keepLines: true,
      children: [
        new TextRun({ text: `${num}. `, bold: true, font: 'Times New Roman' }),
        new TextRun({ text: question.title, bold: true, font: 'Times New Roman' }),
        new TextRun({ text: '', break: 1 }),
        new TextRun({ text: question.description, size: 20, font: 'Times New Roman' }),
        ...(vote ? [
          new TextRun({ text: '', break: 1 }),
          new TextRun({ text: `  ${voteLabel[vote] || ''}`, bold: true, font: 'Times New Roman' }),
        ] : []),
      ],
    })
  })

  children.push(...questionParagraphs)
  return children
}
