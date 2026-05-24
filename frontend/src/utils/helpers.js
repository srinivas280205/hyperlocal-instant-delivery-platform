export const PACKAGE_TYPES = [
  { value: 'medicine', label: 'Medicine', icon: '💊', color: '#ef4444' },
  { value: 'food', label: 'Food', icon: '🍱', color: '#f97316' },
  { value: 'tea_snacks', label: 'Tea / Snacks', icon: '☕', color: '#eab308' },
  { value: 'documents', label: 'Documents', icon: '📄', color: '#3b82f6' },
  { value: 'fragile', label: 'Fragile Item', icon: '🔮', color: '#8b5cf6' },
  { value: 'gift', label: 'Gift', icon: '🎁', color: '#ec4899' },
  { value: 'grocery', label: 'Grocery', icon: '🛍️', color: '#22c55e' },
  { value: 'electronics', label: 'Electronics', icon: '📱', color: '#64748b' },
  { value: 'household', label: 'Household', icon: '🏠', color: '#a16207' },
  { value: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
];

export const STATUS_COLORS = {
  pending: '#eab308',
  accepted: '#3b82f6',
  picked_up: '#8b5cf6',
  on_the_way: '#f97316',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Rider Accepted',
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_ICONS = {
  pending: '⏳',
  accepted: '✅',
  picked_up: '📦',
  on_the_way: '🛵',
  delivered: '🎉',
  cancelled: '❌',
};

export function formatCurrency(amount) {
  return `₹${amount}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getPackageInfo(type) {
  return PACKAGE_TYPES.find(p => p.value === type) || PACKAGE_TYPES[PACKAGE_TYPES.length - 1];
}

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
