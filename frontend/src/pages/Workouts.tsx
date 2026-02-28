import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Check, Clock, Zap, RefreshCw, Youtube, ChevronDown, Bot, ExternalLink, CalendarPlus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ArogyaCoach from '../components/ArogyaCoach'
import { workoutApi, calendarApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

function ExerciseVideos({ exerciseName }: { exerciseName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['exercise-videos', exerciseName],
    queryFn: () => workoutApi.getVideos(exerciseName).then(r => r.data.videos),
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-3 h-3 border-2 border-gray-600 border-t-primary-400 rounded-full" />
      Loading tutorials...
    </div>
  )

  if (!data?.length) return null

  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Youtube className="w-3 h-3 text-red-400" /> Tutorials
      </p>
      <div className="grid gap-2">
        {data.map((v: any, i: number) => (
          <motion.a
            key={v.video_id}
            href={`https://www.youtube.com/watch?v=${v.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ x: 3 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-colors group"
          >
            <img src={v.thumbnail} alt={v.title} className="w-20 h-12 object-cover rounded-md flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{v.title}</p>
              <p className="text-gray-500 text-xs mt-0.5">{v.channel}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
          </motion.a>
        ))}
      </div>
    </div>
  )
}

export default function Workouts() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()
  const [activeDay, setActiveDay] = useState(0)
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({})
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [aromiOpen, setAromiOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: workout, isLoading } = useQuery({
    queryKey: ['current-workout'],
    queryFn: () => workoutApi.getCurrent().then(r => r.data)
  })

  useEffect(() => {
    if (workout?.id) {
      workoutApi.getCompleted().then(r => {
        setCompletedWorkouts(r.data.completed_exercises || {})
      }).catch(() => {})
    }
  }, [workout?.id])

  const syncCalendarMutation = useMutation({
    mutationFn: () => calendarApi.syncWorkout().then(r => r.data),
    onSuccess: (data) => toast.success(data.message),
    onError: (err: any) => {
      const detail = err.response?.data?.detail || 'Failed to sync'
      if (detail.includes('not connected')) {
        toast.error('Connect Google Calendar first in Settings')
      } else {
        toast.error(detail)
      }
    }
  })

  const generateMutation = useMutation({
    mutationFn: () => workoutApi.generate(7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-workout'] })
      setActiveDay(0)  // BUG 3 FIX: reset to Day 1 so activeDay never points out-of-bounds
      toast.success('🎉 New workout plan generated!')
    },
    onError: () => toast.error('Failed to generate workout')
  })

  const plan = workout?.plan
  const days = plan?.days || []

  const toggleComplete = (key: string, ex: any) => {
    const nowCompleted = !completedWorkouts[key]
    const updated = { ...completedWorkouts, [key]: nowCompleted }
    setCompletedWorkouts(updated)
    if (nowCompleted) {
      const calories = ex.calories_burn || 0
      workoutApi.completeExercise({ exercise_key: key, exercise_name: ex.name, calories_burned: calories })
        .then((r) => {
          if (!r.data.already_counted) {
            toast.success(`💪 ${ex.name} done! 🔥 ${calories} kcal burned`)
            updateUser({ streak_points: r.data.streak_points, total_workouts: r.data.total_workouts })
            queryClient.invalidateQueries({ queryKey: ['progress-stats'] })
          }
        }).catch(() => {
          toast.error(`Failed to save ${ex.name} — please try again`)
          setCompletedWorkouts(prev => ({ ...prev, [key]: false }))
        })
    }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      workoutApi.saveCompleted(updated).catch(() => {})
    }, 500)
  }

  return (
    <BackgroundImage>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ delay: 0.5, duration: 0.5 }}>
                <Dumbbell className="w-7 h-7 sm:w-8 sm:h-8 text-primary-400" />
              </motion.div>
              Workouts
            </h1>
            <p className="text-gray-400 mt-1">AI-generated personalized training plan</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.button
              onClick={() => syncCalendarMutation.mutate()}
              disabled={syncCalendarMutation.isPending}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 btn-secondary border border-gray-700 px-3 sm:px-4 py-2.5 rounded-xl text-sm"
            >
              <CalendarPlus className={`w-4 h-4 text-blue-400 ${syncCalendarMutation.isPending ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{syncCalendarMutation.isPending ? 'Syncing...' : 'Sync to Calendar'}</span>
              <span className="sm:hidden">{syncCalendarMutation.isPending ? 'Syncing...' : 'Sync'}</span>
            </motion.button>
            <motion.button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 btn-primary text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{generateMutation.isPending ? 'Generating...' : 'Generate New Plan'}</span>
              <span className="sm:hidden">{generateMutation.isPending ? 'Generating...' : 'Generate'}</span>
            </motion.button>
          </div>
        </motion.div>

        {isLoading ? (
          <LoadingSpinner text="Loading your workout plan..." />
        ) : !plan || workout?.message ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="card text-center py-16"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <Dumbbell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-semibold text-white mb-2">No Workout Plan Yet</h2>
            <p className="text-gray-400 mb-6">Generate your personalized AI workout plan to get started!</p>
            <motion.button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              whileHover={{ scale: 1.05 }}
                    className="btn-primary px-8 py-3"
            >
              {generateMutation.isPending ? 'Generating...' : '🚀 Generate My Plan'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Day selector */}
            <div className="lg:col-span-1">
              <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Week Schedule</h3>
              <div className="space-y-2">
                {days.map((day: any, idx: number) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                    onClick={() => setActiveDay(idx)}
                    whileHover={{ x: 3 }}
                    className={`relative w-full text-left p-3 rounded-xl border transition-colors ${
                      activeDay === idx
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {activeDay === idx && (
                      <motion.div
                        layoutId="day-active"
                        className="absolute inset-0 border border-primary-500/40 rounded-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="font-medium">Day {day.day}</div>
                    <div className="text-xs opacity-70">{day.focus || day.name}</div>
                    <div className="text-xs opacity-50 mt-1">{day.total_duration_minutes}min • ~{day.total_calories}cal</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Exercise list */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {days[activeDay] && (
                  <motion.div
                    key={activeDay}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card mb-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-white">{days[activeDay].name}</h2>
                          <p className="text-primary-400">{days[activeDay].focus}</p>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{days[activeDay].total_duration_minutes} min</span>
                          <span className="flex items-center gap-1"><Zap className="w-4 h-4" />~{days[activeDay].total_calories} cal</span>
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-3">
                      {days[activeDay].exercises?.map((ex: any, exIdx: number) => {
                        const key = `day${days[activeDay].day}-${ex.name.toLowerCase().replace(/\s+/g, '_')}`
                        const isCompleted = completedWorkouts[key]
                        const isExpanded = expandedExercise === key

                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: exIdx * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            whileHover={{ x: 3, transition: { duration: 0.15 } }}
                            className={`card transition-all ${isCompleted ? 'border-primary-800 bg-primary-950/20' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <motion.button
                                onClick={() => toggleComplete(key, ex)}
                                whileHover={{ scale: 1.12 }}
                                whileTap={{ scale: 0.82 }}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-600 hover:border-primary-400'
                                }`}
                              >
                                <AnimatePresence mode="wait">
                                  {isCompleted && (
                                    <motion.div
                                      key="check"
                                      initial={{ scale: 0, rotate: -90 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                    >
                                      <Check className="w-4 h-4 text-white" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.button>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className={`font-semibold transition-all duration-300 ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                                    {ex.name}
                                  </h3>
                                  <motion.button
                                    onClick={() => setExpandedExercise(isExpanded ? null : key)}
                                                                whileTap={{ scale: 0.9 }}
                                    className="text-gray-400 p-1"
                                  >
                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                      <ChevronDown className="w-4 h-4" />
                                    </motion.div>
                                  </motion.button>
                                </div>
                                <div className="flex gap-4 text-sm text-gray-400 mt-1">
                                  <span>{ex.sets} sets × {ex.reps} reps</span>
                                  <span>Rest: {ex.rest_seconds}s</span>
                                  <span className="text-orange-400">{ex.calories_burn} cal</span>
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.25, ease: 'easeOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-gray-800">
                                    <p className="text-gray-300 text-sm">{ex.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{ex.muscle_group}</span>
                                    </div>
                                    <ExerciseVideos exerciseName={ex.name} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <motion.button
        onClick={() => setAromiOpen(true)}
                whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(34,197,94,0.35)' }}
        transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-surface-100 border border-primary-500/40 rounded-full flex items-center justify-center z-40"
      >
        <Bot className="w-6 h-6 text-primary-400" />
      </motion.button>
      <ArogyaCoach isOpen={aromiOpen} onClose={() => setAromiOpen(false)} />
    </BackgroundImage>
  )
}