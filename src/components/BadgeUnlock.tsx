import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Locale } from '../types'
import { BADGES } from '../lib/constants'

interface BadgeUnlockProps {
  badgeTypes: string[]
  locale: Locale
  onClose: () => void
}

export default function BadgeUnlock({ badgeTypes, locale, onClose }: BadgeUnlockProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (badgeTypes.length === 0) return null

  const badgeType = badgeTypes[currentIndex]
  const badge = BADGES.find(b => b.type === badgeType)
  if (!badge) return null

  const isLast = currentIndex >= badgeTypes.length - 1

  const handleNext = () => {
    if (isLast) {
      onClose()
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5"
      onClick={handleNext}
    >
      <motion.div
        key={badgeType}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="bg-bg-mid border border-white/10 rounded-3xl p-8 max-w-xs w-full text-center"
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 10, delay: 0.2 }}
          className="text-6xl mb-4"
        >
          {badge.emoji}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-gold uppercase tracking-wider font-bold mb-2">
            {locale === 'de' ? 'Neues Badge!' : 'New Badge!'}
          </p>
          <h2 className="text-xl font-extrabold text-text-primary mb-2">
            {badge.title[locale]}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {badge.description[locale]}
          </p>
        </motion.div>

        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
        >
          {isLast ? (locale === 'de' ? 'Weiter' : 'Continue') : (locale === 'de' ? 'Nächstes Badge' : 'Next Badge')}
        </button>

        {badgeTypes.length > 1 && (
          <p className="text-xs text-text-muted mt-3">
            {currentIndex + 1} / {badgeTypes.length}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
