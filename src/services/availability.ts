import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'

export type Availability = Tables<'availability'>
export type AvailabilityRecord = Record<
  string,
  { start: string; end: string }[]
>

const weekdays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export const getAvailability = async (
  userId: string,
): Promise<AvailabilityRecord> => {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching availability:', error)
    throw error
  }

  const availabilityRecord: AvailabilityRecord = weekdays.reduce(
    (acc, day) => ({ ...acc, [day]: [] }),
    {},
  )

  data.forEach((item) => {
    const dayName = weekdays[item.weekday]
    availabilityRecord[dayName].push({
      start: item.start_time,
      end: item.end_time,
    })
  })

  return availabilityRecord
}

export const updateAvailability = async (
  userId: string,
  availability: AvailabilityRecord,
): Promise<void> => {
  // First, delete all existing availability for the user
  const { error: deleteError } = await supabase
    .from('availability')
    .delete()
    .eq('user_id', userId)

  if (deleteError) {
    console.error('Error clearing old availability:', deleteError)
    throw deleteError
  }

  // Then, insert the new availability
  const newAvailability: Tables<'availability'>['Insert'][] = []
  for (const dayName in availability) {
    const weekdayIndex = weekdays.indexOf(dayName)
    if (weekdayIndex !== -1) {
      availability[dayName].forEach((interval) => {
        if (interval.start && interval.end) {
          newAvailability.push({
            user_id: userId,
            weekday: weekdayIndex,
            start_time: interval.start,
            end_time: interval.end,
          })
        }
      })
    }
  }

  if (newAvailability.length > 0) {
    const { error: insertError } = await supabase
      .from('availability')
      .insert(newAvailability)
    if (insertError) {
      console.error('Error inserting new availability:', insertError)
      throw insertError
    }
  }
}
