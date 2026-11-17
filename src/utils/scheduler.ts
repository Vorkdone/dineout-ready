import type { KitchenItem, KitchenItemStatus, MenuCategory, MenuItem } from '../types/index.ts'

export const seatingBufferMinutes = 5

type ScheduleInput = {
  currentMinutes: number
  remainingEtaMinutes: number
  preparationMinutes: number
}

export type FirstCourseSchedule = {
  targetServingMinute: number
  releaseMinute: number
}

export function calculateFirstCourseSchedule({ currentMinutes, remainingEtaMinutes, preparationMinutes }: ScheduleInput): FirstCourseSchedule {
  const targetServingMinute = calculateFirstCourseTargetMinute(currentMinutes, remainingEtaMinutes)
  return { targetServingMinute, releaseMinute: targetServingMinute - preparationMinutes }
}

export function calculateFirstCourseTargetMinute(currentMinutes: number, remainingEtaMinutes: number) {
  return currentMinutes + Math.max(0, remainingEtaMinutes) + seatingBufferMinutes
}

export function scheduleFirstCourseItems(
  items: KitchenItem[],
  menu: MenuItem[],
  currentMinutes: number,
  remainingEtaMinutes: number,
  currentEta?: string,
): KitchenItem[] {
  return items.map((item) => {
    const dish = menu.find((candidate) => candidate.id === item.itemId)
    if (!dish || dish.category !== 'Starters' || item.status !== 'queued' || item.manualHold || item.manualOverride) return item
    const schedule = calculateFirstCourseSchedule({
      currentMinutes,
      remainingEtaMinutes,
      preparationMinutes: preparationDuration(dish, item.quantity),
    })
    return schedule.releaseMinute <= currentMinutes
      ? startPreparing(item, currentMinutes, dish, true)
      : { ...item, plannedReleaseMinute: schedule.releaseMinute, plannedRelease: currentEta ? formatScheduledTime(currentEta, remainingEtaMinutes, schedule.releaseMinute - currentMinutes) : formatDemoTime(schedule.releaseMinute) }
  })
}

export function rescheduleFirstCourseItems(
  items: KitchenItem[],
  menu: MenuItem[],
  currentMinutes: number,
  remainingEtaMinutes: number,
  currentEta?: string,
): KitchenItem[] {
  return scheduleFirstCourseItems(items, menu, currentMinutes, remainingEtaMinutes, currentEta)
}

export function startKitchenItem(item: KitchenItem, dish: MenuItem, currentMinutes: number, manualOverride = true): KitchenItem {
  if (item.status !== 'queued' || item.manualHold) return item
  return startPreparing(item, currentMinutes, dish, manualOverride)
}

export function releaseKitchenHold(item: KitchenItem, dish: MenuItem, currentMinutes: number): KitchenItem {
  if (!item.manualHold) return item
  const released = { ...item, manualHold: false }
  if (released.status === 'queued' && released.plannedReleaseMinute !== null && released.plannedReleaseMinute <= currentMinutes) {
    return startPreparing(released, currentMinutes, dish, false)
  }
  return released
}

export function advanceKitchenTime(items: KitchenItem[], menu: MenuItem[], fromMinutes: number, toMinutes: number): KitchenItem[] {
  if (toMinutes < fromMinutes) return items
  return items.map((item) => {
    const dish = menu.find((candidate) => candidate.id === item.itemId)
    if (!dish || item.status === 'ready' || item.status === 'served' || item.status === 'removed' || item.status === 'needs_attention') return item
    if (item.status === 'preparing') {
      const completedAt = item.preparationCompletedAt ?? fromMinutes + preparationDuration(dish, item.quantity)
      return completedAt <= toMinutes ? { ...item, status: 'ready', preparationCompletedAt: completedAt } : item
    }
    if (item.status !== 'queued' || item.manualHold || item.plannedReleaseMinute === null || item.plannedReleaseMinute > toMinutes) return item
    const startedAt = Math.max(fromMinutes, item.plannedReleaseMinute)
    const completedAt = startedAt + preparationDuration(dish, item.quantity)
    return completedAt <= toMinutes
      ? { ...item, status: 'ready', preparationStartedAt: startedAt, preparationCompletedAt: completedAt, manualOverride: false }
      : { ...item, status: 'preparing', preparationStartedAt: startedAt, preparationCompletedAt: completedAt, manualOverride: false }
  })
}

export function preparationDuration(item: MenuItem, quantity: number) {
  return quantity <= item.batchCapacity
    ? item.preparationMinutes
    : item.preparationMinutes + Math.ceil((quantity - item.batchCapacity) / item.batchCapacity) * item.additionalBatchMinutes
}

export function formatDemoTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440
  const hour = Math.floor(normalized / 60)
  return `${hour % 12 || 12}:${String(normalized % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`
}

function formatScheduledTime(currentEta: string, remainingEtaMinutes: number, releaseOffset: number) {
  const currentSimulatedTime = parseClockTime(currentEta) - remainingEtaMinutes
  return formatDemoTime(currentSimulatedTime + releaseOffset)
}

function parseClockTime(value: string) {
  const match = value.match(/(\d+):(\d+) (AM|PM)/)
  if (!match) return 0
  return (Number(match[1]) % 12) * 60 + Number(match[2]) + (match[3] === 'PM' ? 720 : 0)
}

function startPreparing(item: KitchenItem, currentMinutes: number, dish: MenuItem, manualOverride: boolean): KitchenItem {
  const completedAt = currentMinutes + preparationDuration(dish, item.quantity)
  return {
    ...item,
    status: 'preparing',
    plannedReleaseMinute: item.plannedReleaseMinute ?? currentMinutes,
    plannedRelease: item.plannedRelease ?? formatDemoTime(currentMinutes),
    preparationStartedAt: currentMinutes,
    preparationCompletedAt: completedAt,
    manualOverride,
    manualHold: false,
  }
}

export function isPrimaryKitchenStatus(status: KitchenItemStatus): status is 'queued' | 'preparing' | 'ready' | 'served' {
  return status === 'queued' || status === 'preparing' || status === 'ready' || status === 'served'
}

export function courseForItem(menu: MenuItem[], itemId: string): MenuCategory | undefined {
  return menu.find((item) => item.id === itemId)?.category
}
