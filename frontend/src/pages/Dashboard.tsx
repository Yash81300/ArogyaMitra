import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, TrendingUp, Target, Calendar, Heart, Zap, Award, Clock, ArrowRight, Plus, Play, Bot, Apple } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import ArogyaCoach from '../components/ArogyaCoach'
import CharityImpactCard from '../components/CharityImpactCard'
import StatCard from '../components/ui/StatCard'
import { progressApi, workoutApi, nutritionApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } }
}

export default function Dashboard() {
  const { user, refreshUser, lastRefresh } = useAuthStore()
  const [aromiOpen, setAromiOpen] = useState(false)

  // BUG 7 FIX: include actual dependencies so the effect never closes over stale refs
  useEffect(() => {
    const STALE_MS = 5 * 60 * 1000
    if (!lastRefresh || Date.now() - lastRefresh > STALE_MS) refreshUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefresh, refreshUser])

  const { data: stats } = useQuery({
    queryKey: ['progress-stats'],
    queryFn: () => progressApi.getStats().then(r => r.data)
  })
  const { data: currentWorkout } = useQuery({
    queryKey: ['current-workout'],
    queryFn: () => workoutApi.getCurrent().then(r => r.data)
  })
  const { data: currentNutrition } = useQuery({
    queryKey: ['current-nutrition'],
    queryFn: () => nutritionApi.getCurrent().then(r => r.data)
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const bmi = user?.height && user?.weight
    ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
    : null

  return (
    <BackgroundImage>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
                {greeting()}, {user?.full_name?.split(' ')[0] || user?.username}! 👋
              </h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Ready to crush your fitness goals today?</p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 sm:px-4 py-2 flex-shrink-0"
            >
              <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ delay: 1, duration: 0.5 }}>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </motion.div>
              <div>
                <p className="text-yellow-400 font-bold text-sm sm:text-base">{user?.streak_points || 0}</p>
                <p className="text-xs text-gray-400">Streak Points</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { title: 'Total Workouts', value: stats?.total_workouts || 0, icon: Zap, color: 'text-primary-400', subtitle: 'All time' },
            { title: 'Calories Burned', value: stats?.total_calories_burned || 0, icon: TrendingUp, color: 'text-orange-400', subtitle: 'Total' },
            { title: 'BMI', value: bmi || '--', icon: Target, color: 'text-blue-400', subtitle: bmi ? (parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese') : 'Set profile' },
            { title: 'Streak Points', value: user?.streak_points || 0, icon: Award, color: 'text-yellow-400', subtitle: 'Keep going!' },
          ].map((card, i) => (
            <motion.div key={card.title} variants={itemVariants}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg font-semibold text-white flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-primary-400" />
              Quick Actions
            </motion.h2>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 gap-4"
            >
              {[
                { label: 'Generate Workout', desc: 'AI-powered 7-day plan', icon: Plus, color: 'from-primary-600 to-primary-800', path: '/workouts' },
                { label: 'View Workouts', desc: 'Your current plan', icon: Play, color: 'from-blue-600 to-blue-800', path: '/workouts' },
                { label: 'Nutrition Plan', desc: 'Personalized meals', icon: Calendar, color: 'from-orange-600 to-orange-800', path: '/nutrition' },
                { label: 'Health Assessment', desc: 'AI health analysis', icon: Heart, color: 'from-pink-600 to-pink-800', path: '/health' },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Link to={item.path}>
                    <motion.div
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className={`block p-5 bg-gradient-to-br ${item.color} rounded-xl`}
                    >
                      <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.2 }}>
                        <item.icon className="w-6 h-6 text-white mb-2" />
                      </motion.div>
                      <h3 className="font-semibold text-white">{item.label}</h3>
                      <p className="text-white/70 text-sm">{item.desc}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* Today's Workout Preview */}
            {currentWorkout?.plan && (() => {
              const days = currentWorkout.plan?.days || []
              // 0=Sun,1=Mon,...6=Sat → map to day index (cycle if plan < 7 days)
              const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
              const todaysDay = days[todayIdx % days.length]
              return todaysDay ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Today's Workout</h3>
                    <Link to="/workouts" className="text-primary-400 text-sm flex items-center gap-1 hover:gap-2 transition-all">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-primary-400 font-medium">{todaysDay.name}</p>
                  <p className="text-gray-400 text-sm">{todaysDay.focus}</p>
                  <div className="mt-3 flex gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{todaysDay.total_duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />~{todaysDay.total_calories} cal</span>
                  </div>
                </motion.div>
              ) : null
            })()}

            {/* Today's Meals Preview */}
            {currentNutrition?.meals && (() => {
              const hour = new Date().getHours()

              // Which meal type is "current" based on time of day
              const currentMealType =
                hour >= 5  && hour < 10 ? 'breakfast' :
                hour >= 10 && hour < 14 ? 'lunch' :
                hour >= 14 && hour < 18 ? 'snack' :
                hour >= 18 && hour < 22 ? 'dinner' : 'breakfast'

              // Ordered priority: current meal first, then the rest in natural order
              const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner']
              const orderedTypes = [
                currentMealType,
                ...mealOrder.filter(t => t !== currentMealType)
              ]

              const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
              const todayMeals = currentNutrition.meals.filter((m: any) => {
                const dayNum = parseInt(m.day || '1') - 1
                return dayNum === todayIdx % 7
              })

              // Only show the current meal
              const sortedMeals = todayMeals.filter((m: any) => m.meal_type === currentMealType)

              return sortedMeals.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Apple className="w-4 h-4 text-green-400" />
                      Today's Meals
                    </h3>
                    <Link to="/nutrition" className="text-primary-400 text-sm flex items-center gap-1 hover:gap-2 transition-all">
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {sortedMeals.map((meal: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.65 + i * 0.06 }}
                          className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <motion.span
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"
                            />
                            <div>
                              <p className="text-white text-sm font-medium">{meal.name}</p>
                              <p className="text-gray-500 text-xs capitalize">{meal.meal_type}</p>
                            </div>
                          </div>
                          <span className="text-orange-400 text-xs font-medium">{meal.calories} cal</span>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              ) : null
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="card bg-gradient-to-br from-gray-900 to-gray-800"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-gradient-to-br from-primary-500 to-saffron-500 rounded-full flex items-center justify-center text-xl font-bold text-white overflow-hidden relative"
                >
                  <span>{user?.full_name?.[0] || user?.username?.[0]}</span>
                  {user?.profile_photo_url && (
                    <img
                      src={user.profile_photo_url}
                      alt="avatar"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </motion.div>
                <div>
                  <h3 className="font-semibold text-white">{user?.full_name || user?.username}</h3>
                  <p className="text-gray-400 text-sm capitalize">{user?.fitness_level} • {user?.fitness_goal?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {user?.height && (
                  <motion.div whileHover={{ scale: 1.03 }} className="bg-gray-800 rounded-lg p-2.5 text-center">
                    <p className="text-gray-400">Height</p>
                    <p className="font-medium text-white">{user.height} cm</p>
                  </motion.div>
                )}
                {user?.weight && (
                  <motion.div whileHover={{ scale: 1.03 }} className="bg-gray-800 rounded-lg p-2.5 text-center">
                    <p className="text-gray-400">Weight</p>
                    <p className="font-medium text-white">{user.weight} kg</p>
                  </motion.div>
                )}
              </div>
              <Link to="/profile" className="mt-4 block text-center text-primary-400 text-sm hover:text-primary-300 transition-colors">
                Edit Profile →
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
            >
              <CharityImpactCard />
            </motion.div>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(34,197,94,0.35)' }}
        whileTap={{ scale: 0.95 }}
        animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0.15)', '0 0 18px rgba(34,197,94,0.25)', '0 0 0px rgba(34,197,94,0.15)'] }}
        transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
        onClick={() => setAromiOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-surface-100 border border-primary-500/40 rounded-full flex items-center justify-center z-40"
      >
        <Bot className="w-6 h-6 text-primary-400" />
      </motion.button>
      <ArogyaCoach isOpen={aromiOpen} onClose={() => setAromiOpen(false)} />
    </BackgroundImage>
  )
}