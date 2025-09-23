import { supabase } from '@/lib/supabase/client'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export interface ProgressReportData {
  totalHoursStudied: number
  hoursBySubject: { name: string; hours: number }[]
  weeklyProgress: { week: string; hours: number }[]
  completionStatus: {
    planned: number
    done: number
    skipped: number
  }
}

export const getProgressReport = async (
  userId: string,
  dateRange: { from: Date; to: Date },
): Promise<ProgressReportData> => {
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('*, subjects(name)')
    .eq('user_id', userId)
    .eq('status', 'done')
    .gte('start_time', dateRange.from.toISOString())
    .lte('end_time', dateRange.to.toISOString())

  if (error) {
    console.error('Error fetching progress report data:', error)
    throw error
  }

  let totalHoursStudied = 0
  const hoursBySubject: Record<string, number> = {}

  sessions.forEach((session) => {
    const duration =
      (new Date(session.end_time).getTime() -
        new Date(session.start_time).getTime()) /
      (1000 * 60 * 60)
    totalHoursStudied += duration
    const subjectName = session.subjects?.name || 'Desconhecido'
    hoursBySubject[subjectName] = (hoursBySubject[subjectName] || 0) + duration
  })

  const { data: allSessions, error: allSessionsError } = await supabase
    .from('study_sessions')
    .select('status')
    .eq('user_id', userId)
    .gte('start_time', dateRange.from.toISOString())
    .lte('end_time', dateRange.to.toISOString())

  if (allSessionsError) throw allSessionsError

  const completionStatus = allSessions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    },
    { planned: 0, done: 0, skipped: 0 },
  )

  return {
    totalHoursStudied,
    hoursBySubject: Object.entries(hoursBySubject).map(([name, hours]) => ({
      name,
      hours,
    })),
    weeklyProgress: [],
    completionStatus,
  }
}
