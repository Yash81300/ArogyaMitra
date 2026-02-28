import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Plus, Zap, Target, Award, Bot, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import StatCard from '../components/ui/StatCard'
import ArogyaCoach from '../components/ArogyaCoach'
import { progressApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export default function Progress() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showLog, setShowLog] = useState(false)
  const [aromiOpen, setAromiOpen] = useState(false)
  const [logForm, setLogForm] = useState({ weight: '', calories_burned: '', workout_completed: '', notes: '' })

  const { data: history = [] } = useQuery({
    queryKey: ['progress-history'],
    queryFn: () => progressApi.getHistory(30).then(r => r.data)
  })
  const { data: stats } = useQuery({
    queryKey: ['progress-stats'],
    queryFn: () => progressApi.getStats().then(r => r.data)
  })

  const logMutation = useMutation({
    mutationFn: (data: any) => progressApi.log(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-history'] })
      queryClient.invalidateQueries({ queryKey: ['progress-stats'] })
      toast.success('Progress logged! 🎉')
      setShowLog(false)
      setLogForm({ weight: '', calories_burned: '', workout_completed: '', notes: '' })
    }
  })

  const chartData = [...history].reverse().slice(-14).map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: r.weight,
    calories: r.calories_burned
  }))

  const bmi = user?.height && user?.weight
    ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
    : '--'

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
                <TrendingUp className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
              </motion.div>
              Progress Tracking
            </h1>
            <p className="text-gray-400 mt-1">Monitor your fitness journey over time</p>
          </div>
          <motion.button
            onClick={() => setShowLog(!showLog)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 btn-primary self-start sm:self-auto text-sm"
          >
            <motion.div animate={{ rotate: showLog ? 45 : 0 }} transition={{ duration: 0.2 }}>
              <Plus className="w-4 h-4" />
            </motion.div>
            Log Progress
          </motion.button>
        </motion.div>

        {/* Log Form */}
        <AnimatePresence>
          {showLog && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden mb-6"
            >
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Log Today's Progress</h3>
                  <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowLog(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  {[
                    { label: 'Weight (kg)', key: 'weight', type: 'number', step: '0.1', placeholder: '70.5', min: '1', max: '500' },
                    { label: 'Calories Burned', key: 'calories_burned', type: 'number', placeholder: '350', min: '0', max: '5000' },
                    { label: 'Workout Completed', key: 'workout_completed', type: 'text', placeholder: 'e.g., Upper Body Day' },
                    { label: 'Notes', key: 'notes', type: 'text', placeholder: 'How did it go?' },
                  ].map(({ label, key, type, step, placeholder, min, max }) => (
                    <motion.div
                      key={key}
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                    >
                      <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
                      <input
                        className="input"
                        type={type}
                        step={(step as any)}
                        min={(min as any)}
                        max={(max as any)}
                        placeholder={placeholder}
                        value={(logForm as any)[key]}
                        onChange={e => setLogForm(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </motion.div>
                  ))}
                </motion.div>
                <div className="flex gap-3 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      // BUG 1 FIX: reject completely empty submissions
                      if (!logForm.weight && !logForm.calories_burned && !logForm.workout_completed && !logForm.notes) {
                        return toast.error('Please fill in at least one field')
                      }
                      const w = logForm.weight ? parseFloat(logForm.weight) : null
                      const c = logForm.calories_burned ? parseInt(logForm.calories_burned) : null
                      // BUG 1 FIX: reject out-of-range values on the frontend
                      if (w !== null && (w <= 0 || w > 500)) return toast.error('Weight must be between 0 and 500 kg')
                      if (c !== null && (c < 0 || c > 5000)) return toast.error('Calories must be between 0 and 5000')
                      logMutation.mutate({ weight: w, calories_burned: c, workout_completed: logForm.workout_completed || null, notes: logForm.notes || null })
                    }}
                    disabled={logMutation.isPending}
                    className="btn-primary"
                  >
                    {logMutation.isPending ? 'Saving...' : 'Save Progress'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowLog(false)} className="btn-secondary">Cancel</motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { title: 'Total Workouts', value: stats?.total_workouts || 0, icon: Zap, color: 'text-primary-400' },
            { title: 'Calories Burned', value: stats?.total_calories_burned || 0, icon: TrendingUp, color: 'text-orange-400' },
            { title: 'Current BMI', value: bmi, icon: Target, color: 'text-blue-400' },
            { title: 'Streak Points', value: user?.streak_points || 0, icon: Award, color: 'text-yellow-400' },
          ].map((card) => (
            <motion.div
              key={card.title}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
            >
              <StatCard {...card} />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        {chartData.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-6 mb-8"
          >
            {[
              { title: 'Weight Trend (kg)', dataKey: 'weight', stroke: '#22c55e' },
              { title: 'Calories Burned', dataKey: 'calories', stroke: '#f97316' },
            ].map(({ title, dataKey, stroke }) => (
              <motion.div key={title} whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="card">
                <h3 className="font-semibold text-white mb-4">{title}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2} dot={false} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="card"
        >
          <h3 className="font-semibold text-white mb-4">Recent Activity</h3>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm">No progress logged yet. Start tracking!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-left pb-3">Date</th>
                    <th className="text-left pb-3">Weight</th>
                    <th className="text-left pb-3">Calories</th>
                    <th className="text-left pb-3">Workout</th>
                    <th className="text-left pb-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {history.slice(0, 10).map((r: any, i: number) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 + 0.5 }}
                      className="text-gray-300 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-3">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="py-3">{r.weight ? `${r.weight} kg` : '--'}</td>
                      <td className="py-3 text-orange-400">{r.calories_burned || '--'}</td>
                      <td className="py-3">{r.workout_completed || '--'}</td>
                      <td className="py-3 text-gray-400">{r.notes || '--'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
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