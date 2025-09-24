import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type Profile = Tables<'profiles'>

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!navigator.onLine) {
    // Don't attempt network requests while offline
    // eslint-disable-next-line no-console
    console.debug('getProfile skipped while offline')
    return null
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // Better logging for objects returned by Supabase
      try {
        const serialized = JSON.stringify(
          error,
          Object.getOwnPropertyNames(error),
        )
        // eslint-disable-next-line no-console
        console.error('Error fetching profile:', serialized)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching profile:', error)
      }
      return null
    }
    return data
  } catch (err) {
    // Network-level error (e.g. failed to fetch)
    // eslint-disable-next-line no-console
    console.warn('Network error when fetching profile, returning null', err)
    return null
  }
}

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
): Promise<Profile | null> => {
  // Use upsert so that a profile row is created if it doesn't exist yet.
  // Ensure 'id' is set for the upsert key.
  const payload = { id: userId, ...updates }
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }
  // upsert returns an array of rows
  return data?.[0] || null
}

export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return data.publicUrl
}
