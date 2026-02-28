import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { chatApi } from '../services/api'

interface Message {
  id: string
  type: 'user' | 'aromi'
  content: string
  timestamp: Date
}

interface ArogyaCoachProps {
  isOpen: boolean
  onClose: () => void
}

// BUG 9 FIX: defined outside the component so it's a stable reference — not re-created on every render
const GREETING: Message = {
  id: '1', type: 'aromi',
  content: "🙏 Namaste! I'm AROMI, your personal health companion powered by ArogyaMitra! 💚\n\nI can help you with:\n• Workout advice & modifications\n• Nutrition guidance\n• Motivation & accountability\n• Health tips & wellness coaching\n\nHow can I help you today?",
  timestamp: new Date()
}

const ArogyaCoach: React.FC<ArogyaCoachProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load history from backend when chat first opens
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      chatApi.getHistory().then(res => {
        const history: Message[] = res.data.messages
          .filter((m: any) => m.content)
          .map((m: any, i: number) => ({
            id: `history-${i}`,
            type: m.role === 'user' ? 'user' : 'aromi',
            content: m.content,
            timestamp: new Date(m.timestamp || Date.now())
          }))
        if (history.length > 0) setMessages([GREETING, ...history])
        setHistoryLoaded(true)
      }).catch(() => setHistoryLoaded(true))
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: Message = { id: Date.now().toString(), type: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const res = await chatApi.sendMessage(input.trim())
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), type: 'aromi', content: res.data.response, timestamp: new Date() }])
    } catch {
      toast.error('Failed to get response from AROMI')
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    "Give me a quick 15-min workout",
    "What should I eat for energy?",
    "I'm feeling unmotivated today",
    "I'm traveling, adjust my plan"
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30, originX: 1, originY: 1 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-96 max-h-[calc(100dvh-6rem)] sm:max-h-[500px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{ height: 'min(500px, calc(100dvh - 6rem))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/95">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-lg"
              >
                🤖
              </motion.div>
              <div>
                <h3 className="font-semibold text-white">AROMI AI Coach</h3>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-primary-400 rounded-full"
                  />
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.type === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-2 h-2 bg-primary-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <AnimatePresence>
            {messages.length <= 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2 flex flex-wrap gap-2"
              >
                {quickPrompts.map((prompt, i) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setInput(prompt)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full border border-gray-700 transition-colors"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}  // BUG 6 FIX: onKeyPress is deprecated
                placeholder="Ask AROMI anything..."
                className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 placeholder-gray-500 transition-colors"
              />
              <motion.button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ArogyaCoach