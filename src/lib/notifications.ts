const REMINDER_KEY = 'shift-happens-reminder'
const SW_PATH = '/mindset-shift/sw.js'

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_PATH)
  } catch {
    return null
  }
}

export function canNotify(): boolean {
  return 'Notification' in window
}

export function notificationPermission(): NotificationPermission {
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!canNotify()) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function isReminderEnabled(): boolean {
  return localStorage.getItem(REMINDER_KEY) === 'true'
}

export function setReminderEnabled(enabled: boolean): void {
  localStorage.setItem(REMINDER_KEY, enabled ? 'true' : 'false')
}

export function scheduleLocalReminder(): void {
  if (!isReminderEnabled() || !canNotify() || Notification.permission !== 'granted') return

  // Check every hour if it's a weekday and user hasn't played today
  const checkInterval = 60 * 60 * 1000 // 1 hour

  const existingTimer = (window as any).__shiftReminderTimer
  if (existingTimer) clearInterval(existingTimer)

  ;(window as any).__shiftReminderTimer = setInterval(() => {
    const now = new Date()
    const day = now.getDay()
    const hour = now.getHours()

    // Only remind on weekdays between 9-18
    if (day === 0 || day === 6) return
    if (hour < 9 || hour > 18) return

    // Check if already played today
    const lastPlayed = localStorage.getItem('shift-happens-last-played')
    const today = now.toISOString().split('T')[0]
    if (lastPlayed === today) return

    // Check if already reminded today
    const lastReminder = localStorage.getItem('shift-happens-last-reminder')
    if (lastReminder === today) return

    // Send reminder
    localStorage.setItem('shift-happens-last-reminder', today)
    new Notification('AI-Shift Happens 🧠', {
      body: 'Dein Daily Quiz wartet! Halte deinen Streak am Leben.',
      icon: '/mindset-shift/favicon.svg',
      tag: 'daily-reminder',
    })
  }, checkInterval)
}

export function markPlayedToday(): void {
  localStorage.setItem('shift-happens-last-played', new Date().toISOString().split('T')[0])
}
