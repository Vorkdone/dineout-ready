import type { DemoBooking, MenuItem, Restaurant } from '../types'

export const demoMenu: MenuItem[] = [
  { id: 'citrus-burrata', name: 'Citrus Burrata', description: 'Creamy burrata, orange, basil oil and toasted sourdough.', price: 349, servingSize: 'Serves 1 person', preparationMinutes: 10, batchCapacity: 4, additionalBatchMinutes: 6, lowStockThreshold: 4, manuallyPaused: false, category: 'Starters', availability: 'available', availablePortions: 12 },
  { id: 'pepper-prawns', name: 'Coastal Pepper Prawns', description: 'Charred prawns with coastal pepper masala and lime.', price: 449, servingSize: 'Serves 1 person', preparationMinutes: 15, batchCapacity: 4, additionalBatchMinutes: 8, lowStockThreshold: 4, manuallyPaused: false, category: 'Starters', availability: 'limited', availablePortions: 6 },
  { id: 'paneer-tikka', name: 'Paneer Tikka', description: 'Charred paneer, peppers and coriander mint chutney.', price: 329, servingSize: 'Serves 2–3 people', preparationMinutes: 14, batchCapacity: 6, additionalBatchMinutes: 7, lowStockThreshold: 5, manuallyPaused: false, category: 'Starters', availability: 'available', availablePortions: 18 },
  { id: 'sweet-corn-soup', name: 'Sweet Corn Soup', description: 'Silky corn broth with spring onion and toasted sesame.', price: 279, servingSize: 'Serves 1 person', preparationMinutes: 8, batchCapacity: 8, additionalBatchMinutes: 4, lowStockThreshold: 5, manuallyPaused: false, category: 'Starters', availability: 'available', availablePortions: 20 },
  { id: 'coconut-fish', name: 'Coconut Leaf Fish', description: 'Banana-leaf baked catch with coconut, curry leaf and rice.', price: 449, servingSize: 'Serves 1 person', preparationMinutes: 25, batchCapacity: 4, additionalBatchMinutes: 12, lowStockThreshold: 4, manuallyPaused: false, category: 'Main Course', availability: 'available', availablePortions: 10 },
  { id: 'chicken-curry', name: 'Coastal Chicken Curry', description: 'Slow-cooked chicken, roasted spices and steamed rice.', price: 449, servingSize: 'Serves 2–3 people', preparationMinutes: 28, batchCapacity: 6, additionalBatchMinutes: 12, lowStockThreshold: 5, manuallyPaused: false, category: 'Main Course', availability: 'available', availablePortions: 16 },
  { id: 'chicken-biryani', name: 'Family Chicken Biryani', description: 'Fragrant basmati, chicken, saffron and fried onion.', price: 399, servingSize: 'Serves 3–4 people', preparationMinutes: 24, batchCapacity: 6, additionalBatchMinutes: 10, lowStockThreshold: 4, manuallyPaused: false, category: 'Main Course', availability: 'available', availablePortions: 12 },
  { id: 'butter-naan', name: 'Butter Naan', description: 'Tandoor-baked naan brushed with cultured butter.', price: 79, servingSize: 'Serves 1 person', preparationMinutes: 7, batchCapacity: 8, additionalBatchMinutes: 3, lowStockThreshold: 6, manuallyPaused: false, category: 'Main Course', availability: 'available', availablePortions: 24 },
  { id: 'mango-pavlova', name: 'Mango Pavlova', description: 'Crisp meringue, whipped cream and Alphonso mango.', price: 179, servingSize: 'Serves 1 person', preparationMinutes: 8, batchCapacity: 4, additionalBatchMinutes: 5, lowStockThreshold: 4, manuallyPaused: false, category: 'Desserts', availability: 'available', availablePortions: 10 },
  { id: 'gulab-jamun', name: 'Gulab Jamun', description: 'Warm cardamom dumplings with saffron syrup.', price: 149, servingSize: 'Serves 2–3 people', preparationMinutes: 6, batchCapacity: 8, additionalBatchMinutes: 3, lowStockThreshold: 5, manuallyPaused: false, category: 'Desserts', availability: 'available', availablePortions: 20 },
]

export const demoRestaurant: Restaurant = {
  id: 'the-coastal-table',
  name: 'The Coastal Table',
  location: 'Jubilee Hills, Hyderabad',
  fictional: true,
  menu: demoMenu,
}

export const initialBooking: DemoBooking = {
  reservation: { restaurantId: demoRestaurant.id, date: '17 November 2026', time: '8:00 PM', guests: 4, status: 'confirmed', hostName: 'Booking host' },
  menu: demoMenu,
  selectedDishes: [],
  preOrderStatus: 'draft',
  route: { started: false, distanceKm: 8.4, travelMinutes: 28, expectedArrival: '7:58 PM', currentEta: '7:58 PM', remainingEtaMinutes: 28, mode: 'Driving', arrived: false, seated: false },
  kitchenItems: [],
  courseProgression: { startersServed: false, mainRequested: false, dessertRequested: false },
  itemExceptions: [],
  simulatedMinutes: 0,
}
