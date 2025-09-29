import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type SharedPlan = Tables<'shared_plans'>

export const createShareLink = async (
  planId: number,
  ownerId: string,
): Promise<string> => {
  const { data, error } = await supabase
    .from('shared_plans')
    .insert({
      plan_id: planId,
      owner_id: ownerId,
    })
    .select('share_token')
    .single()

  if (error) {
    console.error('Error creating share link:', error)
    throw error
  }

  const shareUrl = `${window.location.origin}/shared/${data.share_token}`
  return shareUrl
}

export const getPlanByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('shared_plans')
    .select(
      `
      plan_id,
      owner_id,
      study_plans (
        *,
        profiles(display_name),
        study_sessions (*, subjects(name, color))
      )
    `,
    )
    .eq('share_token', token)
    .single()

  if (error) {
    console.error('Error fetching plan by token:', error)
    throw error
  }

  return data
}

export const revokeShare = async (shareToken: string): Promise<void> => {
  const { error } = await supabase
    .from('shared_plans')
    .delete()
    .eq('share_token', shareToken)

  if (error) {
    console.error('Error revoking share:', error)
    throw error
  }
}
