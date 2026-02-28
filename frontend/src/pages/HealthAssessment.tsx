import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, CheckCircle, ArrowRight, ArrowLeft, Bot } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import BackgroundImage from '../components/layout/BackgroundImage'
import ArogyaCoach from '../components/ArogyaCoach'
import { healthApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const QUESTIONS = [
  { id: 'h1', category: 'medical', question: 'Do you have any heart conditions?', type: 'yesno' },
  { id: 'h2', category: 'medical', question: 'Do you have diabetes?', type: 'yesno' },
  { id: 'h3', category: 'medical', question: 'Do you have high blood pressure?', type: 'yesno' },
  { id: 'i1', category: 'injuries', question: 'Do you have any knee injuries?', type: 'yesno' },
  { id: 'i2', category: 'injuries', question: 'Do you have any back/spine issues?', type: 'yesno' },
  { id: 'i3', category: 'injuries', question: 'Any shoulder or joint injuries?', type: 'yesno' },
  { id: 'a1', category: 'allergies', question: 'Any food allergies? (nuts, gluten, dairy)', type: 'text' },
  { id: 'a2', category: 'allergies', question: 'Any environmental allergies?', type: 'text' },
  { id: 'm1', category: 'medications', question: 'Are you on any regular medications?', type: 'text' },
  { id: 'm2', category: 'medications', question: 'Any supplements you currently take?', type: 'text' },
  { id: 'h_cond', category: 'health', question: 'Any other health conditions we should know?', type: 'text' },
  { id: 'goal', category: 'goals', question: 'What is your primary fitness goal?', type: 'select',
    options: ['Lose weight', 'Build muscle', 'Improve endurance', 'General fitness', 'Stress relief', 'Injury recovery'] }
]

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const rendered = parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)
    if (line.match(/^\s*[*\-]\s/)) {
      const bulletText = line.replace(/^\s*[*\-]\s/, '')
      const bParts = bulletText.split(/\*\*(.*?)\*\*/g)
      const bRendered = bParts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)
      return <li key={i} className="ml-4 list-disc text-gray-300">{bRendered}</li>
    }
    if (line.trim() === '') return <br key={i} />
    return <p key={i} className="text-gray-300">{rendered}</p>
  })
}

const CATEGORY_COLORS: Record<string, string> = {
  medical: 'text-red-400', injuries: 'text-orange-400',
  allergies: 'text-yellow-400', medications: 'text-blue-400',
  health: 'text-purple-400', goals: 'text-primary-400'
}

export default function HealthAssessment() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [aromiOpen, setAromiOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [analysis, setAnalysis] = useState('')

  const submitMutation = useMutation({
    mutationFn: async () => {
      const bmi = user?.height && user?.weight
        ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
        : null
      const data = {
        medical_history: QUESTIONS.filter(q => q.category === 'medical' && answers[q.id] === 'yes').map(q => q.question),
        injuries: QUESTIONS.filter(q => q.category === 'injuries' && answers[q.id] === 'yes').map(q => q.question),
        allergies: [answers['a1'], answers['a2']].filter(Boolean),
        medications: [answers['m1'], answers['m2']].filter(Boolean),
        health_conditions: [answers['h_cond']].filter(Boolean),
        fitness_goals: [answers['goal']].filter(Boolean),
        answers, bmi
      }
      await healthApi.submitAssessment(data)
      const analysisRes = await healthApi.analyze(data)
      return analysisRes.data.analysis
    },
    onSuccess: (analysis) => { setAnalysis(analysis || ''); setSubmitted(true); toast.success('✅ Health assessment completed!') },
    onError: () => toast.error('Failed to submit assessment')
  })

  const goNext = () => { setDirection(1); setStep(s => s + 1) }
  const goPrev = () => { setDirection(-1); setStep(s => s - 1) }

  const current = QUESTIONS[step]
  const progress = (step / QUESTIONS.length) * 100

  if (submitted) {
    return (
      <BackgroundImage>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-primary-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-2xl font-bold text-white mb-2">Assessment Complete! 🎉</h2>
            <p className="text-gray-400 mb-6">Your personalized AI health analysis is ready</p>
          </motion.div>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card text-left mb-6"
            >
              <h3 className="font-semibold text-white mb-3">Your AI Health Analysis</h3>
              <div className="text-sm leading-relaxed space-y-1">{renderMarkdown(analysis)}</div>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center"
          >
            {[
              { label: 'Generate Workout Plan →', path: '/workouts', primary: true },
              { label: 'Generate Nutrition Plan', path: '/nutrition', primary: false },
            ].map(({ label, path, primary }) => (
              <motion.button
                key={path}
                onClick={() => navigate(path)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={primary ? 'btn-primary px-6 py-3' : 'btn-secondary px-6 py-3'}
              >
                {label}
              </motion.button>
            ))}
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

  return (
    <BackgroundImage>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Heart className="w-8 h-8 text-pink-400" />
            </motion.div>
            Health Assessment
          </h1>
          <p className="text-gray-400 mt-1">Tell us about your health so we can personalize your plans</p>
          <div className="mt-4 w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary-500 h-2 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <p className="text-right text-gray-400 text-xs mt-1">{step}/{QUESTIONS.length} questions</p>
        </motion.div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="card"
          >
            <p className={`text-xs uppercase tracking-wider mb-2 font-medium ${CATEGORY_COLORS[current.category] || 'text-primary-400'}`}>
              {current.category}
            </p>
            <h2 className="text-xl font-semibold text-white mb-6">{current.question}</h2>

            {current.type === 'yesno' && (
              <div className="flex gap-4">
                {['yes', 'no'].map(opt => (
                  <motion.button
                    key={opt}
                    onClick={() => setAnswers(p => ({ ...p, [current.id]: opt }))}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-1 py-3 rounded-xl border-2 font-medium capitalize transition-colors ${
                      answers[current.id] === opt
                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {opt === 'yes' ? '✅ Yes' : '❌ No'}
                  </motion.button>
                ))}
              </div>
            )}

            {current.type === 'text' && (
              <motion.input
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="input"
                placeholder="Type your answer or leave blank..."
                value={answers[current.id] || ''}
                onChange={e => setAnswers(p => ({ ...p, [current.id]: e.target.value }))}
              />
            )}

            {current.type === 'select' && (
              <div className="grid grid-cols-2 gap-3">
                {current.options?.map((opt, i) => (
                  <motion.button
                    key={opt}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setAnswers(p => ({ ...p, [current.id]: opt }))}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`py-3 px-4 rounded-xl border text-sm text-left transition-colors ${
                      answers[current.id] === opt
                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 0 && (
                <motion.button
                  onClick={goPrev}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 btn-secondary"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </motion.button>
              )}
              <motion.button
                onClick={() => {
                  if (step < QUESTIONS.length - 1) goNext()
                  else submitMutation.mutate()
                }}
                disabled={submitMutation.isPending}
                whileHover={{ x: step < QUESTIONS.length - 1 ? 2 : 0, scale: step >= QUESTIONS.length - 1 ? 1.02 : 1 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 btn-primary py-3"
              >
                {step < QUESTIONS.length - 1 ? (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                ) : submitMutation.isPending ? 'Analyzing...' : (
                  <>Complete Assessment <CheckCircle className="w-4 h-4" /></>
                )}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
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