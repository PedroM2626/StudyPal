import { supabase } from '@/lib/supabase/client'
import { Tables } from './db'

export type StudySession = Tables<'study_sessions'> & {
  subject?: string
  subject_name?: string
  subject_color?: string
  planTitle?: string
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

  return (data || []).map((session: any) => ({
    ...session,
    subject_name: session.subjects?.name,
    subject_color: session.subjects?.color,
  }))
}

export const createSession = async (
  payload: Tables<'study_sessions'>['Insert'],
): Promise<Tables<'study_sessions'>> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw error
  }
  return data
}

export const updateSession = async (
  sessionId: number,
  updates: Tables<'study_sessions'>['Update'],
): Promise<Tables<'study_sessions'>> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating session:', error)
    throw error
  }
  return data
}

export const deleteSession = async (sessionId: number): Promise<void> => {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

export const updateSessionStatus = async (
  sessionId: number,
  status: 'planned' | 'done' | 'skipped',
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
