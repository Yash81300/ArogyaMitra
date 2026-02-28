import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Zap, Brain, TrendingUp, Shield } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 + 0.3, duration: 0.4, ease: [0.23, 1, 0.32, 1] } })
}

const FEATURES = [
  { icon: Brain,      label: 'AI-Powered Plans',    desc: 'LLaMA 3.3 personalized workouts'  },
  { icon: TrendingUp, label: 'Progress Analytics',  desc: 'Charts, streaks & BMI tracking'   },
  { icon: Zap,        label: 'Smart Nutrition',      desc: 'Calorie-precise 7-day meal plans' },
  { icon: Shield,     label: 'Health Assessment',   desc: 'AI risk analysis & guidance'      },
]

const STATS = [
  { value: '7-Day', label: 'Workout Plans'  },
  { value: 'AI',    label: 'Powered Coach'  },
  { value: '12+',   label: 'Health Metrics' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(form.username, form.password)
      setToken(res.data.access_token)
      setUser(res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name || res.data.user.username}! 🏋️`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex overflow-hidden">

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <motion.img
            src="/logo.png"
            alt="ArogyaMitra"
            animate={{ scale: [1, 1.18, 1, 1.1, 1, 1, 1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
            className="w-10 h-10 object-contain"
          />
          <span className="font-display font-bold text-xl text-white tracking-tight">ArogyaMitra</span>
        </motion.div>

        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
            <h2 className="text-7xl font-display font-bold text-white leading-[1.1] mb-4">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                Health Journey
              </span>
              <br />
              with AI
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Personalized fitness plans, smart nutrition, and real-time coaching — powered by cutting-edge AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-8"
          >
            {STATS.map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <div className="text-2xl font-display font-bold text-primary-400">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-xs text-gray-600">
          Built with ❤️ for a healthier India
        </motion.p>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent self-stretch" />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8 lg:hidden"
          >
            <motion.img
              src="/logo.png"
              alt="ArogyaMitra"
              animate={{ scale: [1, 1.18, 1, 1.1, 1, 1, 1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
              className="w-14 h-14 object-contain mx-auto mb-3"
            />
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">
              ArogyaMitra
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-display font-bold text-white">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue your fitness journey</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Username or Email</label>
              <input
                type="text"
                className="input disabled:opacity-50 disabled:cursor-not-allowed w-full"
                placeholder="Enter username or email"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={loading}
                required
              />
            </motion.div>

            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="show">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={-1}
                  style={{ outline: 'none' }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="show" className="pt-1">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn-primary py-3 text-base font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </motion.button>
            </motion.div>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-gray-600">New here?</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <Link to="/register">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 rounded-xl border border-white/[0.08] text-center text-sm text-gray-300 hover:border-primary-500/40 hover:text-white transition-all cursor-pointer"
              >
                Create an account
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}