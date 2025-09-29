import { supabase } from '@/lib/supabase/client'
import { Tables } from './db'

export type StudySession = Tables<'study_sessions'> & {
  subject: string
  planTitle: string
}

export const getSessionsForPlan = async (
  planId: number,
): Promise<StudySession[]> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select(
      `
      *,
      subjects (
        name,
        color
      )
    `,
    )
    .eq('plan_id', planId)

  if (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }

  return data.map((session) => ({
    ...session,
    subject_name: session.subjects.name,
    subject_color: session.subjects.color,
  }))
}

export const updateSessionStatus = async (
  sessionId: number,
  status: 'done' | 'skipped',
): Promise<Tables<'study_sessions'>> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({ status })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating session status:', error)
    throw error
  }
  return data
}

export const getNextSession = async (userId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*, subjects(name)')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Error fetching next session:', error)
    throw error
  }

  return data && data.length > 0 ? data[0] : null
}
