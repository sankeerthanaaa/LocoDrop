export const formatTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return `${formatDate(date)} · ${formatTime(date)}`
}

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`

export const statusLabel = {
  posted:    'Posted',
  accepted:  'Accepted',
  picked_up: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}