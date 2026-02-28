import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function CharityImpactCard() {
  const { user } = useAuthStore()
  const donations = Math.floor((user?.streak_points || 0) / 100)
  const pointsNeeded = 100 - ((user?.streak_points || 0) % 100)
  const pct = Math.min(((user?.streak_points || 0) % 100), 100)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="card border-pink-900/50 bg-gradient-to-br from-gray-900 to-pink-950/20"
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="p-2 bg-pink-900/30 rounded-lg flex-shrink-0"
        >
          <Heart className="w-5 h-5 text-pink-400" />
        </motion.div>
        <div className="flex-1">
          <h3 className="font-semibold text-pink-300">Charity Impact</h3>
          <p className="text-gray-400 text-sm mt-1">
            Every 100 streak points = ₹10 donation to health NGOs
          </p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress to next donation</span>
              <motion.span
                key={pointsNeeded}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {pointsNeeded} points left
              </motion.span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: inView ? `${pct}%` : 0 }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
          <motion.p
            key={donations}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-pink-400 font-medium text-sm mt-2"
          >
            Total donated: ₹{donations * 10}
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}