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

  // This is a placeholder for a more complex calculation
  const subjectsWithRemaining = subjects.map((s) => ({
    ...s,
    remaining_hours: s.goal_hours * (1 - Math.random()),
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
