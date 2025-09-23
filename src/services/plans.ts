import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/supabase/types'
import { getSubjects } from './subjects'
import { getAvailability } from './availability'
import { addDays, differenceInDays, eachDayOfInterval } from 'date-fns'

export type StudyPlan = Tables<'study_plans'>
export type StudyPlanWithSummary = StudyPlan & {
  summary: string
  dateRange: string
}

export const getPlans = async (
  userId: string,
): Promise<StudyPlanWithSummary[]> => {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching plans:', error)
    throw error
  }

  return data.map((plan) => ({
    ...plan,
    summary: 'Detalhes do plano a serem implementados.',
    dateRange: `${new Date(plan.start_date).toLocaleDateString('pt-BR')} a ${new Date(plan.end_date).toLocaleDateString('pt-BR')}`,
  }))
}

export const getPlanById = async (
  planId: number,
): Promise<StudyPlan | null> => {
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (error) {
    console.error('Error fetching plan by ID:', error)
    throw error
  }
  return data
}

export const deletePlan = async (planId: number): Promise<void> => {
  await supabase.from('study_sessions').delete().eq('plan_id', planId)
  await supabase.from('study_plan_subjects').delete().eq('plan_id', planId)
  const { error } = await supabase.from('study_plans').delete().eq('id', planId)
  if (error) {
    console.error('Error deleting plan:', error)
    throw error
  }
}

interface CreatePlanData {
  title: string
  startDate: Date
  endDate: Date
  subjects: number[]
  sessionDuration: number
  breakDuration: number
}

export const createPlan = async (
  userId: string,
  planData: CreatePlanData,
): Promise<StudyPlan> => {
  const { data: newPlan, error: planError } = await supabase
    .from('study_plans')
    .insert({
      user_id: userId,
      title: planData.title,
      start_date: planData.startDate.toISOString(),
      end_date: planData.endDate.toISOString(),
      session_duration: planData.sessionDuration,
      break_duration: planData.breakDuration,
    })
    .select()
    .single()

  if (planError) throw planError

  const subjectRelations = planData.subjects.map((subId) => ({
    plan_id: newPlan.id,
    subject_id: subId,
  }))
  const { error: subjectError } = await supabase
    .from('study_plan_subjects')
    .insert(subjectRelations)
  if (subjectError) throw subjectError

  await generateSessionsForPlan(userId, newPlan.id)

  return newPlan
}

// Simplified session generation logic
const generateSessionsForPlan = async (userId: string, planId: number) => {
  const plan = await getPlanById(planId)
  if (!plan) return

  const allUserSubjects = await getSubjects(userId)
  const planSubjectIds = (
    await supabase
      .from('study_plan_subjects')
      .select('subject_id')
      .eq('plan_id', planId)
  ).data?.map((s) => s.subject_id)
  if (!planSubjectIds) return

  const subjectsForPlan = allUserSubjects.filter((s) =>
    planSubjectIds.includes(s.id),
  )
  const availability = await getAvailability(userId)
  const weekdays = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ]

  const interval = {
    start: new Date(plan.start_date),
    end: new Date(plan.end_date),
  }
  const planDays = eachDayOfInterval(interval)
  const sessionsToInsert: Tables<'study_sessions'>['Insert'][] = []
  let subjectIndex = 0

  planDays.forEach((day) => {
    const dayName = weekdays[day.getDay()]
    const dayAvailability = availability[dayName]

    dayAvailability?.forEach((slot) => {
      const [startHour, startMinute] = slot.start.split(':').map(Number)
      let currentStartTime = new Date(day)
      currentStartTime.setHours(startHour, startMinute, 0, 0)

      const [endHour, endMinute] = slot.end.split(':').map(Number)
      const slotEndTime = new Date(day)
      slotEndTime.setHours(endHour, endMinute, 0, 0)

      while (currentStartTime < slotEndTime) {
        const currentSubject =
          subjectsForPlan[subjectIndex % subjectsForPlan.length]
        const sessionEndTime = new Date(
          currentStartTime.getTime() + plan.session_duration * 60000,
        )

        if (sessionEndTime > slotEndTime) break

        sessionsToInsert.push({
          plan_id: plan.id,
          subject_id: currentSubject.id,
          user_id: userId,
          start_time: currentStartTime.toISOString(),
          end_time: sessionEndTime.toISOString(),
          status: 'planned',
        })

        currentStartTime = new Date(
          sessionEndTime.getTime() + plan.break_duration * 60000,
        )
        subjectIndex++
      }
    })
  })

  if (sessionsToInsert.length > 0) {
    const { error } = await supabase
      .from('study_sessions')
      .insert(sessionsToInsert)
    if (error) {
      console.error('Error generating sessions:', error)
      throw error
    }
  }
}
