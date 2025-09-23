import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type Category = Tables<'categories'>

const colors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
]

export const getCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
  return data || []
}

export const addCategory = async (
  userId: string,
  categoryData: { name: string },
): Promise<Category> => {
  const newCategory = {
    ...categoryData,
    user_id: userId,
    color: colors[Math.floor(Math.random() * colors.length)],
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(newCategory)
    .select()
    .single()

  if (error) {
    console.error('Error adding category:', error)
    throw error
  }
  return data
}

export const deleteCategory = async (categoryId: number): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}
