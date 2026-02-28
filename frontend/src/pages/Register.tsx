import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, CheckCircle, Dumbbell, Apple, BarChart2 } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const FITNESS_GOALS = ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'endurance']
const WORKOUT_PREFS = ['home', 'gym', 'outdoor', 'hybrid']
const DIET_PREFS = ['vegetarian', 'non_vegetarian', 'vegan', 'keto', 'paleo']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PERKS = [
  { icon: Dumbbell,    text: 'AI workout plan in seconds'    },
  { icon: Apple,       text: 'Smart 7-day meal plans'        },
  { icon: BarChart2,   text: 'Real-time progress analytics'  },
  { icon: CheckCircle, text: 'Personalized health assessment' },
]

export default function Register() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({
    email: '', username: '', password: '',
    confirmPassword: '',
    full_name: '',
    age: '', gender: '', height: '', weight: '',
    fitness_level: 'beginner', fitness_goal: 'maintenance',
    workout_preference: 'home', diet_preference: 'vegetarian'
  })

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const goToStep2 = () => {
    if (!form.full_name.trim() || !form.email || !form.username || !form.password)
      return toast.error('Please fill in all fields')
    if (!EMAIL_RE.test(form.email))
      return toast.error('Please enter a valid email address')
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters')
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match')
    setDirection(1)
    setStep(2)
  }

  const goToStep1 = () => { setDirection(-1); setStep(1) }

  const handleSubmit = async () => {
    const age    = form.age    ? parseInt(form.age)      : null
    const height = form.height ? parseFloat(form.height) : null
    const weight = form.weight ? parseFloat(form.weight) : null

    if (age    !== null && (age    <   5 || age    > 120)) return toast.error('Age must be between 5 and 120')
    if (height !== null && (height <  50 || height > 300)) return toast.error('Height must be between 50 and 300 cm')
    if (weight !== null && (weight <  10 || weight > 500)) return toast.error('Weight must be between 10 and 500 kg')

    setLoading(true)
    try {
      const res = await authApi.register({ ...form, age, height, weight })
      setToken(res.data.access_token)
      setUser(res.data.user)
      toast.success('Welcome to ArogyaMitra! 🎉')
      navigate('/health')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const stepVariants = {
    enter:  (dir: number) => ({ opacity: 0, x: dir * 40 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir: number) => ({ opacity: 0, x: dir * -40 }),
  }

  return (
    <div className="min-h-screen bg-[#080808] flex overflow-hidden">

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-0 right-1/3 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative">

        {/* Child 1 — Logo at top */}
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
          <span className="text-xl font-bold text-white tracking-tight">ArogyaMitra</span>
        </motion.div>

        {/* Child 2 — Hero content */}
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
            <h2 className="text-7xl font-display font-bold text-white leading-[1.1] mb-4">
              Start Your
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                Fitness Journey
              </span>
              <br />
              Today
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Join ArogyaMitra and get a fully personalized AI fitness experience built around your unique body and goals.
            </p>
          </motion.div>

          {/* Stats row — unique to Register */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-8"
          >
            {[
              { value: '100%', label: 'Personalized'   },
              { value: '₹ 0',   label: 'Always Free'    },
              { value: '∞',    label: 'Your Potential' },
            ].map(({ value, label }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <div className="text-2xl font-display font-bold text-primary-400">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Perks grid */}
          <div className="grid grid-cols-2 gap-3">
            {PERKS.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-sm text-gray-300">{text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-gray-600"
          >
            ‎
        </motion.p>

        {/* Child 3 — Footer at bottom */}
        <div className="space-y-3 mb-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-3"
          >
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <motion.div
                  animate={{ backgroundColor: step >= s ? '#22c55e' : '#374151', scale: step === s ? 1.1 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ color: step >= s ? '#000' : '#6b7280' }}
                >
                  {step > s ? '✓' : s}
                </motion.div>
                <span className={`text-xs ${step === s ? 'text-white' : 'text-gray-600'}`}>
                  {s === 1 ? 'Account' : 'Preferences'}
                </span>
                {s < 2 && <div className="w-8 h-px bg-gray-700 ml-1" />}
              </div>
            ))}
          </motion.div>
        </div>

      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent self-stretch" />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6 lg:hidden"
          >
            <motion.img
              src="/logo.png"
              alt="ArogyaMitra"
              animate={{ scale: [1, 1.18, 1, 1.1, 1, 1, 1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.8, 1] }}
              className="w-12 h-12 object-contain mx-auto mb-3"
            />
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">
              Join ArogyaMitra
            </h1>
          </motion.div>

          {/* Form header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-2xl font-display font-bold text-white">
                {step === 1 ? 'Create account' : 'Your preferences'}
              </h2>
              <span className="text-xs text-gray-500 bg-white/[0.05] px-2.5 py-1 rounded-full">Step {step} of 2</span>
            </div>
            <p className="text-gray-500 text-sm">
              {step === 1 ? 'Fill in your details to get started' : 'Help us personalize your experience'}
            </p>
            <div className="mt-3 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: step === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full bg-primary-500 rounded-full"
              />
            </div>
          </motion.div>

          {/* Form card */}
          <div className="card overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {step === 1 ? (
                  <div className="space-y-3">
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 }}>
                      <input className="input w-full" type="text" placeholder="Full Name"
                        value={form.full_name} onChange={e => update('full_name', e.target.value)} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 }}>
                      <input className="input w-full" type="text" placeholder="Username"
                        value={form.username} onChange={e => update('username', e.target.value)} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
                      <input className="input w-full" type="email" placeholder="Email"
                        value={form.email} onChange={e => update('email', e.target.value)} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                      <div className="relative">
                        <input className="input w-full pr-10" type={showPass ? 'text' : 'password'}
                          placeholder="Password (min. 8 characters)" value={form.password}
                          onChange={e => update('password', e.target.value)} />
                        <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                          onMouseDown={e => e.preventDefault()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 }}>
                      <div className="relative">
                        <input
                          className={`input w-full pr-10 ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500/60 focus:border-red-500' : ''}`}
                          type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password"
                          value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                          onMouseDown={e => e.preventDefault()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {form.confirmPassword && form.confirmPassword !== form.password && (
                        <p className="text-xs text-red-400 mt-1 ml-1">Passwords do not match</p>
                      )}
                    </motion.div>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                        className="input" placeholder="Age" type="number" min={5} max={120}
                        value={form.age} onChange={e => update('age', e.target.value)} />
                      <motion.select initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="input" value={form.gender} onChange={e => update('gender', e.target.value)}>
                        <option value="">Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </motion.select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.33 }}
                        className="input" placeholder="Height (cm)" type="number" min={50} max={300}
                        value={form.height} onChange={e => update('height', e.target.value)} />
                      <motion.input initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}
                        className="input" placeholder="Weight (kg)" type="number" min={10} max={500}
                        value={form.weight} onChange={e => update('weight', e.target.value)} />
                    </div>
                    <motion.button
                      onClick={goToStep2}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full btn-primary py-3 mt-1"
                    >
                      Continue →
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">Fitness Level</label>
                      <div className="flex gap-2">
                        {['beginner', 'intermediate', 'advanced'].map((l, i) => (
                          <motion.button
                            key={l}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => update('fitness_level', l)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className={`flex-1 py-2 rounded-lg text-sm capitalize border transition-colors ${
                              form.fitness_level === l ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400'
                            }`}
                          >{l}</motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block uppercase tracking-wider">Fitness Goal</label>
                      <select className="input w-full" value={form.fitness_goal} onChange={e => update('fitness_goal', e.target.value)}>
                        {FITNESS_GOALS.map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-2 block uppercase tracking-wider">Workout Preference</label>
                      <div className="grid grid-cols-2 gap-2">
                        {WORKOUT_PREFS.map((p, i) => (
                          <motion.button key={p}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 + 0.1 }}
                            onClick={() => update('workout_preference', p)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`py-2 rounded-lg text-sm capitalize border transition-colors ${
                              form.workout_preference === p ? 'border-primary-500 bg-primary-500/20 text-primary-300' : 'border-gray-700 text-gray-400'
                            }`}
                          >{p}</motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 mb-1.5 block uppercase tracking-wider">Diet Preference</label>
                      <select className="input w-full" value={form.diet_preference} onChange={e => update('diet_preference', e.target.value)}>
                        {DIET_PREFS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <motion.button
                        onClick={goToStep1}
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 btn-secondary py-3"
                      >← Back</motion.button>
                      <motion.button
                        onClick={handleSubmit}
                        disabled={loading}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full" />Creating...</>
                        ) : 'Create Account →'}
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-gray-600">Have an account?</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>
            <Link to="/login">
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full py-2.5 rounded-xl border border-white/[0.08] text-center text-sm text-gray-300 hover:border-primary-500/40 hover:text-white transition-all cursor-pointer"
              >
                Sign in instead
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  )
}