import { StudySession } from '@/services/sessions'

// Formats a Date object into an iCalendar UTC string (YYYYMMDDTHHMMSSZ)
const formatDateToICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export const generateICS = (
  sessions: StudySession[],
  planTitle: string,
): string => {
  const events = sessions
    .map((session) => {
      const startDate = new Date(session.start_time)
      const endDate = new Date(session.end_time)
      const now = new Date()

      return [
        'BEGIN:VEVENT',
        `UID:session-${session.id}@studypal.com`,
        `DTSTAMP:${formatDateToICS(now)}`,
        `DTSTART:${formatDateToICS(startDate)}`,
        `DTEND:${formatDateToICS(endDate)}`,
        `SUMMARY:Estudo: ${session.subject_name}`,
        `DESCRIPTION:Sessão de estudo para ${session.subject_name} como parte do plano "${planTitle}".`,
        'END:VEVENT',
      ].join('\r\n')
    })
    .join('\r\n')

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyPal//Study Plan Generator//EN',
    `X-WR-CALNAME:${planTitle}`,
    'CALSCALE:GREGORIAN',
    events,
    'END:VCALENDAR',
  ].join('\r\n')

  return calendar
}
