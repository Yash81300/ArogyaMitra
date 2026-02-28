import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Save, Bot, Calendar, CheckCircle, Unlink, Loader, Camera, Trash2, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import ArogyaCoach from '../components/ArogyaCoach'
import { authApi, calendarApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
}

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: user?.full_name || '', age: user?.age?.toString() || '',
    gender: user?.gender || '', height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '', fitness_level: user?.fitness_level || 'beginner',
    fitness_goal: user?.fitness_goal || 'maintenance', workout_preference: user?.workout_preference || 'home',
    diet_preference: user?.diet_preference || 'vegetarian', phone: user?.phone || '', bio: user?.bio || ''
  })
  const [aromiOpen, setAromiOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarToastShown = useRef(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Google Calendar status
  const { data: calendarStatus, refetch: refetchCalendar } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: () => calendarApi.getStatus().then(r => r.data),
  })
  const isCalendarConnected = calendarStatus?.connected

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const calendarParam = searchParams.get('calendar')
    if (!calendarParam || calendarToastShown.current) return
    calendarToastShown.current = true
    if (calendarParam === 'connected') {
      toast.success('Google Calendar connected! 🗓️')
      refetchCalendar()
    } else if (calendarParam === 'error') {
      toast.error('Failed to connect Google Calendar')
    }
    setSearchParams({})
  }, [searchParams])

  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => authApi.uploadPhoto(file).then(r => r.data),
    onSuccess: (data) => { updateUser(data); setPhotoPreview(null); toast.success('Profile photo updated! 📸') },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to upload photo'),
  })

  const deletePhotoMutation = useMutation({
    mutationFn: () => authApi.deletePhoto().then(r => r.data),
    onSuccess: (data) => { updateUser(data); setPhotoPreview(null); toast.success('Photo removed') },
    onError: () => toast.error('Failed to remove photo'),
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPhotoPreview(preview)
    uploadPhotoMutation.mutate(file)
  }

  const connectCalendarMutation = useMutation({
    mutationFn: () => calendarApi.authorize().then(r => r.data),
    onSuccess: (data) => {
      // Redirect user to Google's consent screen
      window.location.href = data.auth_url
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to connect Google Calendar')
  })

  const disconnectCalendarMutation = useMutation({
    mutationFn: () => calendarApi.disconnect(),
    onSuccess: () => { toast.success('Google Calendar disconnected'); refetchCalendar() },
    onError: () => toast.error('Failed to disconnect')
  })

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateMe({
      ...form,
      age: form.age ? parseInt(form.age) : null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
    }),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated! ✅') },
    onError: () => toast.error('Failed to update profile')
  })

  const bmi = form.height && form.weight
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : '--'

  const bmiFeedback = bmi !== '--' ? (
    parseFloat(bmi) < 18.5 ? { label: 'Underweight', color: 'text-blue-400' } :
    parseFloat(bmi) < 25 ? { label: 'Normal weight', color: 'text-primary-400' } :
    parseFloat(bmi) < 30 ? { label: 'Overweight', color: 'text-yellow-400' } :
    { label: 'Obese', color: 'text-red-400' }
  ) : null

  return (
    <BackgroundImage>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <motion.div whileHover={{ rotate: 15 }} transition={{ duration: 0.2 }}>
                <User className="w-8 h-8 text-primary-400" />
              </motion.div>
              My Profile
            </h1>
            <p className="text-gray-400 mt-1">Update your personal fitness profile</p>
          </div>
          {bmi !== '--' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <p className={`text-2xl font-bold ${bmiFeedback?.color}`}>{bmi}</p>
              <p className="text-xs text-gray-400">BMI · {bmiFeedback?.label}</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="card">
            <h3 className="font-semibold text-white mb-4">Personal Information</h3>

            {/* Profile Photo */}
            <div className="flex items-center gap-5 mb-6 pb-5 border-b border-white/10">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-primary-500/40 flex items-center justify-center">
                  {(photoPreview || user?.profile_photo_url) ? (
                    <img
                      src={photoPreview || user?.profile_photo_url || ''}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-9 h-9 text-gray-500" />
                  )}
                </div>
                {/* Camera overlay */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadPhotoMutation.isPending}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  {uploadPhotoMutation.isPending
                    ? <Loader className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />
                  }
                </motion.button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-400">@{user?.username}</p>
                <div className="flex gap-2 mt-1">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                    className="text-xs px-3 py-1 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30 rounded-lg transition-colors"
                  >
                    {uploadPhotoMutation.isPending ? 'Uploading...' : 'Change Photo'}
                  </motion.button>
                  {user?.profile_photo_url && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => deletePhotoMutation.mutate()}
                      disabled={deletePhotoMutation.isPending}
                      className="text-xs px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </motion.button>
                  )}
                </div>
                <p className="text-xs text-gray-500">JPG, PNG, WebP or GIF · max 5MB</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div className="sm:col-span-2" whileFocus={{ scale: 1.01 }}>
                <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
                <input className="input disabled:opacity-50" disabled={updateMutation.isPending} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
              </motion.div>
              {[
                { label: 'Age', key: 'age', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
                  <input className="input disabled:opacity-50" type={type} disabled={updateMutation.isPending} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Gender</label>
                <select className="input disabled:opacity-50" disabled={updateMutation.isPending} value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {[
                { label: 'Height (cm)', key: 'height' },
                { label: 'Weight (kg)', key: 'weight' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
                  <input className="input disabled:opacity-50" type="number" disabled={updateMutation.isPending} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              {/* BUG 3 FIX: phone must be type="text" — numbers strip leading zeros and reject +country codes */}
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Phone</label>
                <input className="input disabled:opacity-50" type="tel" disabled={updateMutation.isPending} placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-400 mb-1.5 block">Bio</label>
                <textarea className="input resize-none disabled:opacity-50" rows={3} disabled={updateMutation.isPending} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="card">
            <h3 className="font-semibold text-white mb-4">Fitness Preferences</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Fitness Level', key: 'fitness_level', options: ['beginner', 'intermediate', 'advanced'] },
                { label: 'Fitness Goal', key: 'fitness_goal', options: ['weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 'endurance'] },
                { label: 'Workout Preference', key: 'workout_preference', options: ['home', 'gym', 'outdoor', 'hybrid'] },
                { label: 'Diet Preference', key: 'diet_preference', options: ['vegetarian', 'non_vegetarian', 'vegan', 'keto', 'paleo'] },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="text-sm text-gray-400 mb-1.5 block">{label}</label>
                  <select className="input disabled:opacity-50" disabled={updateMutation.isPending} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}>
                    {options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Google Calendar */}
          <motion.div variants={itemVariants} className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Google Calendar
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Sync your workout and meal plans directly to your Google Calendar as events and reminders.
            </p>
            <AnimatePresence mode="wait">
              {isCalendarConnected ? (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => disconnectCalendarMutation.mutate()}
                    disabled={disconnectCalendarMutation.isPending}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                  >
                    <Unlink className="w-3 h-3" />
                    Disconnect
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="disconnected"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onClick={() => connectCalendarMutation.mutate()}
                  disabled={connectCalendarMutation.isPending}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {connectCalendarMutation.isPending ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <><Calendar className="w-4 h-4" /> Connect Google Calendar</>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 btn-primary py-3 text-base font-semibold"
            >
              <motion.div animate={updateMutation.isPending ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Save className="w-5 h-5" />
              </motion.div>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="sm:hidden">
            <motion.button
              onClick={() => { logout(); navigate('/login') }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 text-base font-semibold rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </motion.button>
          </motion.div>
        </motion.div>
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