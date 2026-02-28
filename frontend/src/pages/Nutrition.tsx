import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Apple, RefreshCw, ShoppingCart, Calendar, Clock, CheckCircle, Bot, Flame, Zap, Wheat, Droplets, CalendarPlus, Youtube, ExternalLink, ChevronDown } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ArogyaCoach from '../components/ArogyaCoach'
import { nutritionApi, calendarApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

interface Macros {
  protein: number
  carbs: number
  fat: number
}

interface Meal {
  name: string
  meal_type: string
  description?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  prep_time?: string
  ingredients?: string[]
  meal_key?: string
  day?: string
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  lunch: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  dinner: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  snack: 'text-green-400 bg-green-400/10 border-green-400/20',
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const diff = target - start
    if (diff === 0) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = target
    }
    requestAnimationFrame(tick)
  }, [target, duration])

  return display
}

// Macro card with animated progress bar
function MacroCard({ label, value, unit, color, bgColor, barColor, icon: Icon, target, delay }: {
  label: string; value: number; unit: string; color: string; bgColor: string; barColor: string
  icon: any; target: number; delay: number
}) {
  const animated = useAnimatedCounter(value)
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card text-center relative overflow-hidden group cursor-default"
    >
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 mx-auto ${bgColor}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{animated}</p>
      <p className="text-gray-500 text-xs">{unit}</p>
      <p className="text-gray-400 text-xs mt-0.5">{label}</p>
      <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: inView ? `${pct}%` : 0 }}
          transition={{ delay: delay + 0.3, duration: 0.9, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

// Sliding pill tab navigator
function TabNav({ active, onChange }: { active: string; onChange: (t: any) => void }) {
  const tabs = [
    { id: 'today', label: '📅 Today' },
    { id: 'week', label: '📆 Full Week' },
    { id: 'grocery', label: '🛒 Grocery' },
  ]
  return (
    <div className="flex gap-1 mb-6 bg-gray-900/60 p-1 rounded-xl border border-gray-800 w-full sm:w-fit overflow-x-auto scrollbar-none">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} className="relative px-5 py-2 rounded-lg text-sm font-medium z-10">
          {active === tab.id && (
            <motion.div
              layoutId="tab-pill"
              className="absolute inset-0 bg-primary-500 rounded-lg"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <span className={`relative z-10 transition-colors duration-200 ${active === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}

// Recipe video tutorials component
function RecipeVideos({ mealName }: { mealName: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['recipe-videos', mealName],
    queryFn: () => nutritionApi.getRecipeVideos(mealName).then(r => r.data.videos),
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-500 text-xs mt-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-3 h-3 border-2 border-gray-600 border-t-red-400 rounded-full" />
      Loading recipes...
    </div>
  )

  if (!data?.length) return null

  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Youtube className="w-3 h-3 text-red-400" /> Recipe Tutorials
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
            <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
          </motion.a>
        ))}
      </div>
    </div>
  )
}

// Meal card component
function MealCard({ meal, idx, isCompleted, onToggle, isExpanded, onExpand }: {
  meal: Meal; idx: number; isCompleted: boolean; onToggle: () => void
  isExpanded: boolean; onExpand: () => void
}) {
  const colorClass = MEAL_COLORS[meal.meal_type] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className={`card transition-all duration-300 ${isCompleted ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-2 ${colorClass}`}>
            <Calendar className="w-3 h-3" />
            {(meal.meal_type ?? 'meal').charAt(0).toUpperCase() + (meal.meal_type ?? 'meal').slice(1)}
          </div>
          <h3 className={`font-semibold transition-all duration-300 ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
            {meal.name}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{meal.description}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{meal.calories} cal</span>
            <span>P: {meal.protein}g</span>
            <span>C: {meal.carbs}g</span>
            <span>F: {meal.fat}g</span>
            {meal.prep_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meal.prep_time}</span>}
          </div>
          {meal.ingredients && (
            <div className="flex flex-wrap gap-1 mt-2">
              {meal.ingredients.slice(0, 5).map((ing: string, i: number) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.08 + i * 0.04 + 0.2 }}
                  className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs"
                >
                  {ing}
                </motion.span>
              ))}
              {meal.ingredients.length > 5 && (
                <span className="text-gray-500 text-xs self-center">+{meal.ingredients.length - 5} more</span>
              )}
            </div>
          )}

          {/* Video toggle button */}
          <motion.button
            onClick={onExpand}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Youtube className="w-3.5 h-3.5" />
            {isExpanded ? 'Hide' : 'Watch'} Recipe Tutorials
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </motion.button>

          {/* Expandable video section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <RecipeVideos mealName={meal.name} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.82 }}
          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
            isCompleted ? 'bg-primary-500 border-primary-500' : 'border-gray-600 hover:border-primary-400'
          }`}
        >
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Nutrition() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'grocery'>('today')
  const [aromiOpen, setAromiOpen] = useState(false)
  const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({})
  // BUG 5 FIX: keyed by item content not array index — regenerating the plan no longer scrambles checked state
  const [completedGrocery, setCompletedGrocery] = useState<Record<string, boolean>>({})
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)

  const { data: nutrition, isLoading } = useQuery({
    queryKey: ['current-nutrition'],
    queryFn: () => nutritionApi.getCurrent().then(r => r.data)
  })

  const completeMealMutation = useMutation({
    mutationFn: (mealKey: string) => nutritionApi.completeMeal(mealKey).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-nutrition'] })
      if (data.is_completed) updateUser({ streak_points: data.streak_points })
    },
    onError: () => toast.error('Failed to update meal')
  })

  const generateMutation = useMutation({
    mutationFn: () => nutritionApi.generate(7),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-nutrition'] })
      toast.success('🥗 New nutrition plan generated!')
    },
    onError: () => toast.error('Failed to generate nutrition plan')
  })

  const syncCalendarMutation = useMutation({
    mutationFn: () => calendarApi.syncNutrition().then(r => r.data),
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

  const calculateCompletedMacros = () => {
    if (!nutrition?.meals) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    return nutrition.meals.reduce((acc: any, meal: Meal) => {
      if (completedMeals[meal.meal_key || '']) {
        return {
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0),
        }
      }
      return acc
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  const completedMacros = calculateCompletedMacros()

  useEffect(() => {
    if (nutrition?.completed_meals) {
      const completed: Record<string, boolean> = {}
      nutrition.completed_meals.forEach((mealKey: string) => { completed[mealKey] = true })
      setCompletedMeals(completed)
    }
  }, [nutrition?.completed_meals])

  useEffect(() => {
    const saved = localStorage.getItem('completed-grocery')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // BUG 5 FIX: migrate old index-keyed data (numbers) to string keys on first load
        const migrated: Record<string, boolean> = {}
        Object.entries(parsed).forEach(([k, v]) => { migrated[String(k)] = v as boolean })
        setCompletedGrocery(migrated)
      } catch {
        localStorage.removeItem('completed-grocery')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('completed-grocery', JSON.stringify(completedGrocery))
  }, [completedGrocery])

  const transformedData = nutrition ? (() => {
    const meals: Meal[] = nutrition.meals || []
    const daysMap: Record<string, Meal[]> = {}
    meals.forEach((meal: Meal) => {
      const day = meal.day || '1'
      if (!daysMap[day]) daysMap[day] = []
      daysMap[day].push(meal)
    })
    const days = Object.entries(daysMap)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([day, dayMeals]) => ({ day, meals: dayMeals }))
    return {
      daily_calories: nutrition.daily_calories || 2000,
      macros: { protein: nutrition.protein_grams || 0, carbs: nutrition.carbs_grams || 0, fat: nutrition.fat_grams || 0 } as Macros,
      days,
      grocery_list: nutrition.grocery_list || [],
    }
  })() : null

  const plan = transformedData
  const macros = plan?.macros || { protein: 0, carbs: 0, fat: 0 }
  const days = plan?.days || []
  const grocery = plan?.grocery_list || []

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const todaysMeals: Meal[] = days.length > 0
    ? (days[Math.min(todayIdx, days.length - 1)]?.meals ?? [])
    : []

  return (
    <BackgroundImage>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ delay: 0.6, duration: 0.6 }}>
                <Apple className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
              </motion.div>
              Nutrition
            </h1>
            <p className="text-gray-400 mt-1">Personalized meal plans powered by AI</p>
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
              <span className="hidden sm:inline">{generateMutation.isPending ? 'Generating...' : 'Generate Plan'}</span>
              <span className="sm:hidden">{generateMutation.isPending ? 'Generating...' : 'Generate'}</span>
            </motion.button>
          </div>
        </motion.div>

        {isLoading ? (
          <LoadingSpinner text="Loading nutrition plan..." />
        ) : !plan || nutrition?.message ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="card text-center py-16"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
              <Apple className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-semibold text-white mb-2">No Nutrition Plan Yet</h2>
            <p className="text-gray-400 mb-6">Generate your personalized AI meal plan!</p>
            <motion.button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              whileHover={{ scale: 1.05 }}
                    className="btn-primary px-8 py-3"
            >
              🥗 Generate My Plan
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Macro Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MacroCard label="Calories" value={completedMacros.calories} unit="kcal" color="text-orange-400" bgColor="bg-orange-400/15" barColor="bg-orange-500" icon={Flame} target={plan.daily_calories} delay={0.1} />
              <MacroCard label="Protein" value={completedMacros.protein} unit="g" color="text-blue-400" bgColor="bg-blue-400/15" barColor="bg-blue-500" icon={Zap} target={macros.protein} delay={0.18} />
              <MacroCard label="Carbs" value={completedMacros.carbs} unit="g" color="text-yellow-400" bgColor="bg-yellow-400/15" barColor="bg-yellow-500" icon={Wheat} target={macros.carbs} delay={0.26} />
              <MacroCard label="Fat" value={completedMacros.fat} unit="g" color="text-pink-400" bgColor="bg-pink-400/15" barColor="bg-pink-500" icon={Droplets} target={macros.fat} delay={0.34} />
            </div>

            {/* Tab nav */}
            <TabNav active={activeTab} onChange={setActiveTab} />

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activeTab === 'grocery' ? (
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-green-400" />
                        Weekly Grocery List
                      </h3>
                      <AnimatePresence>
                        {Object.values(completedGrocery).some(Boolean) && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setCompletedGrocery({})}
                            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                          >
                            Clear Completed
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {grocery.map((item: string, idx: number) => {
                        // BUG 5 FIX: use item text as stable key, not array index
                        const itemKey = item.toLowerCase().trim()
                        const isChecked = !!completedGrocery[itemKey]
                        return (
                          <motion.button
                            key={itemKey}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.025, duration: 0.3 }}
                            onClick={() => setCompletedGrocery(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
                            whileHover={{ x: 3 }}
                            className={`flex items-center gap-2 p-3 rounded-lg transition-all text-left ${isChecked ? 'opacity-50' : 'hover:bg-gray-800/50'}`}
                          >
                            <motion.div
                              animate={isChecked ? { scale: [1, 1.4, 1] } : {}}
                              transition={{ duration: 0.25 }}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600'
                              }`}
                            >
                              <AnimatePresence>
                                {isChecked && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                  >
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            <span className={`text-sm transition-all duration-300 ${isChecked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                              {item.charAt(0).toUpperCase() + item.slice(1)}
                            </span>
                          </motion.button>
                        )
                      })}
                      {grocery.length === 0 && <p className="text-gray-400 col-span-3">No grocery list available</p>}
                    </div>
                  </div>

                ) : activeTab === 'today' && days.length > 0 ? (
                  todaysMeals.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="card text-center py-12"
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Apple className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-white font-medium mb-1">No meals planned for today</p>
                      <p className="text-gray-400 text-sm">
                        Your plan has {days.length} day{days.length !== 1 ? 's' : ''} — try the{' '}
                        <button
                          onClick={() => setActiveTab('week')}
                          className="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
                        >
                          Full Week
                        </button>
                        {' '}view or generate a new plan.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {todaysMeals.map((meal: Meal, idx: number) => {
                        const key = meal.meal_key || `0-${idx}`
                        return (
                          <MealCard
                            key={key}
                            meal={meal}
                            idx={idx}
                            isCompleted={!!completedMeals[key]}
                            onToggle={() => {
                              const isNowCompleted = !completedMeals[key]
                              setCompletedMeals(prev => ({ ...prev, [key]: isNowCompleted }))
                              completeMealMutation.mutate(key)
                            }}
                            isExpanded={expandedMeal === key}
                            onExpand={() => setExpandedMeal(expandedMeal === key ? null : key)}
                          />
                        )
                      })}
                    </div>
                  )

                ) : (
                  <div className="grid gap-4">
                    {days.map((day: any, dayIdx: number) => (
                      <motion.div
                        key={dayIdx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIdx * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="card"
                      >
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-primary-500/20 text-primary-400 rounded-md flex items-center justify-center text-xs font-bold">
                            {dayIdx + 1}
                          </span>
                          Day {day.day}
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {day.meals?.map((meal: Meal, mIdx: number) => (
                            <motion.div
                              key={mIdx}
                              initial={{ opacity: 0, scale: 0.93 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: dayIdx * 0.06 + mIdx * 0.05 + 0.1 }}
                              whileHover={{ y: -2, transition: { duration: 0.15 } }}
                              className="bg-gray-800 rounded-lg p-3"
                            >
                              <span className="text-xs text-primary-400 uppercase font-medium">
                                {(meal.meal_type ?? 'meal').charAt(0).toUpperCase() + (meal.meal_type ?? 'meal').slice(1)}
                              </span>
                              <p className="text-white text-sm font-medium mt-1">{meal.name}</p>
                              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400" />{meal.calories} cal
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
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