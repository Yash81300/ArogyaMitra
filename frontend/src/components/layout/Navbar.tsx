import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { Home, Dumbbell, Apple, TrendingUp, Heart, LogOut, Zap, Settings } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useEffect, useRef } from 'react'

const navMain = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/workouts', label: 'Workouts', icon: Dumbbell },
  { path: '/nutrition', label: 'Nutrition', icon: Apple },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/health', label: 'Health', icon: Heart },
]

const navSecondary = [
  { path: '/profile', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const badgeControls = useAnimation()
  const prevPoints = useRef<number | null>(null)

  useEffect(() => {
    const current = user?.streak_points ?? 0
    if (prevPoints.current === null) { prevPoints.current = current; return }
    if (current > prevPoints.current) {
      badgeControls.start({ scale: [1, 1.45, 0.9, 1.15, 1], transition: { duration: 0.5, ease: 'easeOut' } })
    }
    prevPoints.current = current
  }, [user?.streak_points])

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Mobile top header — hidden on desktop */}
      <header className="mobile-topbar">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="ArogyaMitra" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-[15px] text-white tracking-tight">ArogyaMitra</span>
        </Link>

        <div className="flex items-center gap-2">
          <motion.div
            animate={badgeControls}
            className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2.5 py-1"
          >
            <Zap className="w-3 h-3 text-yellow-400" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={user?.streak_points}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-bold text-yellow-400"
              >
                {user?.streak_points || 0}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          <Link to="/profile" className="flex items-center gap-2 bg-surface-100 border border-border rounded-xl px-2.5 py-1.5">
            <div className="w-6 h-6 rounded-md bg-primary-500/15 border border-primary-500/25 flex items-center justify-center text-xs font-bold text-primary-400 overflow-hidden relative flex-shrink-0">
              <span>{user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}</span>
              {user?.profile_photo_url && (
                <img src={user.profile_photo_url} alt="avatar" className="absolute inset-0 w-full h-full object-cover" />
              )}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-white truncate max-w-[100px]">{user?.full_name || user?.username}</div>
              <div className="text-[10px] text-zinc-400 capitalize">{user?.fitness_level || 'Beginner'}</div>
            </div>
          </Link>
        </div>
      </header>

    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="logo-area px-4 mb-5">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <motion.img
            src="/logo.png"
            alt="ArogyaMitra"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-10 h-10 object-contain flex-shrink-0"
          />
          <span className="font-display font-bold text-[15px] text-white tracking-tight">ArogyaMitra</span>
        </Link>
      </div>

      {/* User pill */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="user-pill mx-2.5 mb-4 px-3 py-2.5 rounded-xl bg-surface-100 border border-border flex items-center gap-2.5"
      >
        <div className="w-[30px] h-[30px] rounded-lg bg-primary-500/15 border border-primary-500/25 flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0 overflow-hidden relative">
          <span>{user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}</span>
          {user?.profile_photo_url && (
            <img
              src={user.profile_photo_url}
              alt="avatar"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-white truncate leading-tight">{user?.full_name || user?.username}</div>
          <div className="text-[11px] text-zinc-400 capitalize truncate mt-0.5">{user?.fitness_level || 'Beginner'}</div>
        </div>
        <motion.div
          animate={badgeControls}
          className="flex items-center gap-1 flex-shrink-0 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-2 py-0.5"
        >
          <Zap className="w-2.5 h-2.5 text-yellow-400" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={user?.streak_points}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-bold text-yellow-400"
            >
              {user?.streak_points || 0}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Main nav */}
      <div className="section-title">Menu</div>
      <nav className="main-nav flex flex-col gap-0.5 px-2">
        {navMain.map(({ path, label, icon: Icon }, i) => (
          <motion.div
            key={path}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i + 0.15, duration: 0.35 }}
          >
            <Link
              to={path}
              aria-current={isActive(path) ? 'page' : undefined}
              className={`nav-item rounded-xl relative ${isActive(path) ? 'active' : ''}`}
            >
              {isActive(path) && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-primary-500/15 border border-primary-500/30 rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 flex-shrink-0 relative z-10" strokeWidth={isActive(path) ? 2.5 : 2} />
              <span className="relative z-10">{label}</span>
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* Secondary nav */}
      <div className="section-title" style={{ marginTop: 'auto' }}>Account</div>
      <nav className="nav-secondary flex flex-col gap-0.5 px-2">
        {navSecondary.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} aria-current={isActive(path) ? 'page' : undefined}
            className={`nav-item rounded-xl ${isActive(path) ? 'active' : ''}`}>
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        ))}
        <motion.button
          type="button"
          onClick={handleLogout}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="nav-item rounded-xl w-full text-left hover:text-red-400 hover:bg-red-500/8 hidden sm:flex"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          <span>Sign Out</span>
        </motion.button>
      </nav>
    </aside>
    </>
  )
}