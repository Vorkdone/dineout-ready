import assert from 'node:assert/strict'
import test from 'node:test'
import type { KitchenItem, MenuItem } from '../src/types/index.ts'
import {
  advanceKitchenTime,
  calculateFirstCourseSchedule,
  calculateFirstCourseTargetMinute,
  releaseKitchenHold,
  rescheduleFirstCourseItems,
  scheduleFirstCourseItems,
  startKitchenItem,
} from '../src/utils/scheduler.ts'

const menu: MenuItem[] = [
  menuItem('starter-short', 'Starters', 8),
  menuItem('starter-long', 'Starters', 20),
  menuItem('main', 'Main Course', 30),
  menuItem('dessert', 'Desserts', 6),
]

function menuItem(id: string, category: MenuItem['category'], preparationMinutes: number): MenuItem {
  return {
    id,
    name: id,
    description: 'Fictional test dish',
    price: 100,
    servingSize: 'Serves 1',
    preparationMinutes,
    batchCapacity: 4,
    additionalBatchMinutes: 5,
    lowStockThreshold: 1,
    manuallyPaused: false,
    category,
    availability: 'available',
    availablePortions: 20,
  }
}

function kitchenItem(itemId: string, status: KitchenItem['status'] = 'queued', overrides: Partial<KitchenItem> = {}): KitchenItem {
  return {
    itemId,
    quantity: 1,
    status,
    plannedRelease: null,
    plannedReleaseMinute: null,
    preparationStartedAt: null,
    preparationCompletedAt: null,
    manualHold: false,
    manualOverride: false,
    ...overrides,
  }
}

test('calculates first-course target with the five-minute seating buffer', () => {
  assert.equal(calculateFirstCourseTargetMinute(10, 18), 33)
  assert.deepEqual(calculateFirstCourseSchedule({ currentMinutes: 10, remainingEtaMinutes: 18, preparationMinutes: 8 }), {
    targetServingMinute: 33,
    releaseMinute: 25,
  })
})

test('assigns independent release times without summing preparation durations', () => {
  const scheduled = scheduleFirstCourseItems(
    [kitchenItem('starter-short'), kitchenItem('starter-long')],
    menu,
    10,
    18,
  )
  assert.equal(scheduled[0].plannedReleaseMinute, 25)
  assert.equal(scheduled[1].plannedReleaseMinute, 13)
  assert.notEqual(scheduled[0].plannedReleaseMinute, scheduled[1].plannedReleaseMinute)
})

test('anchors displayed release times to the ETA clock across evening and midnight values', () => {
  const evening = scheduleFirstCourseItems([kitchenItem('starter-short')], menu, 0, 28, '9:28 PM')
  assert.equal(evening[0].plannedRelease, '9:25 PM')
  const midnight = scheduleFirstCourseItems([kitchenItem('starter-short')], menu, 0, 10, '12:05 AM')
  assert.equal(midnight[0].plannedRelease, '12:02 AM')
})

test('advances independently scheduled items concurrently and chronologically', () => {
  const scheduled = scheduleFirstCourseItems(
    [kitchenItem('starter-short'), kitchenItem('starter-long')],
    menu,
    0,
    25,
  )
  const atTwenty = advanceKitchenTime(scheduled, menu, 0, 20)
  assert.equal(atTwenty[0].status, 'queued')
  assert.equal(atTwenty[1].status, 'preparing')
  const atThirty = advanceKitchenTime(atTwenty, menu, 20, 30)
  assert.equal(atThirty[0].status, 'ready')
  assert.equal(atThirty[1].status, 'ready')
})

test('reschedules queued items but preserves preparing, ready, served, and manual items', () => {
  const items = [
    kitchenItem('starter-short'),
    kitchenItem('starter-long', 'preparing', { preparationStartedAt: 4, preparationCompletedAt: 24 }),
    kitchenItem('main', 'ready', { preparationStartedAt: 2, preparationCompletedAt: 32 }),
    kitchenItem('dessert', 'served', { preparationStartedAt: 1, preparationCompletedAt: 7 }),
    kitchenItem('starter-short', 'queued', { manualOverride: true, plannedReleaseMinute: 10 }),
  ]
  const result = rescheduleFirstCourseItems(items, menu, 10, 30)
  assert.notEqual(result[0].plannedReleaseMinute, null)
  assert.deepEqual(result.slice(1), items.slice(1))
})

test('manual starts are protected from automatic rescheduling', () => {
  const started = startKitchenItem(kitchenItem('starter-long'), menu[1], 12)
  const result = rescheduleFirstCourseItems([started], menu, 12, 60)
  assert.equal(result[0].status, 'preparing')
  assert.equal(result[0].preparationStartedAt, 12)
  assert.equal(result[0].preparationCompletedAt, 32)
})

test('manual holds block preparation and release overdue holds immediately', () => {
  const held = kitchenItem('starter-short', 'queued', {
    manualHold: true,
    plannedReleaseMinute: 10,
    plannedRelease: '12:10 AM',
  })
  const heldResult = advanceKitchenTime([held], menu, 0, 20)
  assert.equal(heldResult[0].status, 'queued')
  const released = releaseKitchenHold(heldResult[0], menu[0], 20)
  assert.equal(released.status, 'preparing')
  assert.equal(released.preparationStartedAt, 20)
})

test('later courses remain queued and restaurant-controlled', () => {
  const result = scheduleFirstCourseItems([
    kitchenItem('main'),
    kitchenItem('dessert'),
  ], menu, 0, 20)
  assert.deepEqual(result, [
    kitchenItem('main'),
    kitchenItem('dessert'),
  ])
})
