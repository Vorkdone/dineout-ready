export type AppView = 'customer' | 'restaurant'
export type MenuCategory = 'Starters' | 'Main Course' | 'Desserts'
export type ReservationStatus = 'confirmed'
export type PreOrderStatus = 'draft' | 'confirmed' | 'needs_attention'
export type AvailabilityStatus = 'available' | 'limited' | 'sold_out' | 'paused'
export type KitchenItemStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'needs_attention' | 'removed'
export type TravelMode = 'Driving'

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  servingSize: string
  preparationMinutes: number
  batchCapacity: number
  additionalBatchMinutes: number
  lowStockThreshold: number
  manuallyPaused: boolean
  category: MenuCategory
  availability: AvailabilityStatus
  availablePortions: number
}

export type Restaurant = {
  id: string
  name: string
  location: string
  fictional: boolean
  menu: MenuItem[]
}

export type Reservation = {
  restaurantId: string
  date: string
  time: string
  guests: number
  status: ReservationStatus
  hostName: string
}

export type SelectedDish = {
  itemId: string
  quantity: number
}

export type RouteState = {
  started: boolean
  distanceKm: number
  travelMinutes: number
  expectedArrival: string
  currentEta: string
  remainingEtaMinutes: number
  mode: TravelMode
  arrived: boolean
  seated: boolean
}

export type KitchenItem = {
  itemId: string
  quantity: number
  status: KitchenItemStatus
  plannedRelease: string | null
  plannedReleaseMinute: number | null
  preparationStartedAt: number | null
  preparationCompletedAt: number | null
  manualHold: boolean
  manualOverride: boolean
}

export type CourseProgression = {
  startersServed: boolean
  mainRequested: boolean
  dessertRequested: boolean
}

export type ItemException = {
  itemId: string
  reason: string
  alternatives: string[]
}

export type DemoBooking = {
  reservation: Reservation
  menu: MenuItem[]
  selectedDishes: SelectedDish[]
  preOrderStatus: PreOrderStatus
  route: RouteState
  kitchenItems: KitchenItem[]
  courseProgression: CourseProgression
  itemExceptions: ItemException[]
  simulatedMinutes: number
}
