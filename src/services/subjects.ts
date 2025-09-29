import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type Subject = Tables<'subjects'> & {
  category_ids?: number[]
  remaining_hours?: number
}

const colors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
]

export const getSubjects = async (userId: string): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select(
      `
      *,
      subject_categories (
        category_id
      )
    `,
    )
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching subjects:', error)
    throw error
  }

  const subjects = data.map((s) => ({
    ...s,
    category_ids: s.subject_categories.map((sc) => sc.category_id),
  }))

  // Fetch completed sessions once and aggregate duration per subject
  const { data: doneSessions, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('subject_id, start_time, end_time')
    .eq('user_id', userId)
    .eq('status', 'done')

  if (sessionsError) {
    console.error(
      'Error fetching completed sessions for remaining hours:',
      sessionsError,
    )
    throw sessionsError
  }

  const completedHoursBySubject: Record<number, number> = {}
  doneSessions.forEach((s: any) => {
    const durationHours =
      (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) /
      (1000 * 60 * 60)
    completedHoursBySubject[s.subject_id] =
      (completedHoursBySubject[s.subject_id] || 0) + durationHours
  })

  const subjectsWithRemaining = subjects.map((s) => ({
    ...s,
    remaining_hours: Math.max(
      0,
      s.goal_hours - (completedHoursBySubject[s.id] || 0),
    ),
  }))

  return subjectsWithRemaining
}

export const addSubject = async (
  userId: string,
  subjectData: Omit<Subject, 'id' | 'user_id' | 'created_at' | 'color'>,
): Promise<Subject> => {
  const { category_ids, ...rest } = subjectData
  const newSubjectData = {
    ...rest,
    user_id: userId,
    color: colors[Math.floor(Math.random() * colors.length)],
  }

  const { data: subject, error } = await supabase
    .from('subjects')
    .insert(newSubjectData)
    .select()
    .single()

  if (error) {
    console.error('Error adding subject:', error)
    throw error
  }

  if (category_ids && category_ids.length > 0) {
    const relations = category_ids.map((catId) => ({
      subject_id: subject.id,
      category_id: catId,
    }))
    const { error: relationError } = await supabase
      .from('subject_categories')
      .insert(relations)
    if (relationError) {
      console.error('Error adding subject categories:', relationError)
      // Potentially delete the subject if relations fail
      throw relationError
    }
  }

  return { ...subject, category_ids }
}

export const updateSubject = async (
  subjectId: number,
  updates: Partial<Omit<Subject, 'id' | 'user_id' | 'created_at'>>,
): Promise<Subject> => {
  const { category_ids, ...rest } = updates as any
  const { data: updatedSubject, error } = await supabase
    .from('subjects')
    .update(rest)
    .eq('id', subjectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating subject:', error)
    throw error
  }

  // Update categories relations if provided
  if (category_ids) {
    // delete existing relations
    await supabase
      .from('subject_categories')
      .delete()
      .eq('subject_id', subjectId)
    if (category_ids.length > 0) {
      const relations = category_ids.map((catId: number) => ({
        subject_id: subjectId,
        category_id: catId,
      }))
      const { error: relErr } = await supabase
        .from('subject_categories')
        .insert(relations)
      if (relErr) {
        console.error('Error updating subject categories:', relErr)
        throw relErr
      }
    }
  }

  return { ...updatedSubject, category_ids }
}

export const deleteSubject = async (subjectId: number): Promise<void> => {
  // Must delete from join table first due to foreign key constraints
  await supabase.from('subject_categories').delete().eq('subject_id', subjectId)
  await supabase.from('study_sessions').delete().eq('subject_id', subjectId)

  const { error } = await supabase.from('subjects').delete().eq('id', subjectId)

  if (error) {
    console.error('Error deleting subject:', error)
    throw error
  }
}
