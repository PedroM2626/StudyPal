import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type StudySession = Tables<'study_sessions'> & {
  subject_name: string
  subject_color: string
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
