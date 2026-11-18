import { createContext, useEffect, useRef, useState, useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight, CalendarDays, Check, ChefHat, CircleCheck,
  ClipboardList, Clock3, Gauge, LayoutDashboard, MapPin, Minus, Navigation,
  PauseCircle, Play, Plus, RefreshCw, RotateCcw, Sparkles, Timer, UtensilsCrossed, Users, X, Download,
} from 'lucide-react'
import { demoRestaurant, initialBooking } from './data/demoData'
import type {
  AppView, AvailabilityStatus, DemoBooking, KitchenItem, KitchenItemStatus,
  MenuCategory, MenuItem, PreOrderStatus,
} from './types'
import {
  advanceKitchenTime,
  preparationDuration,
  releaseKitchenHold,
  rescheduleFirstCourseItems,
  scheduleFirstCourseItems,
  startKitchenItem,
} from './utils/scheduler'

const STORAGE_KEY = 'dineout-ready-demo-booking'
const categories: MenuCategory[] = ['Starters', 'Main Course', 'Desserts']

function App() {
  const [activeView, setActiveView] = useState<AppView>('customer')
  const [booking, setBooking] = useState<DemoBooking>(() => loadBooking())
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [workflowPopover, setWorkflowPopover] = useState<WorkflowPopoverState | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(booking)), [booking])
  const updateBooking = (update: (current: DemoBooking) => DemoBooking) => setBooking((current) => update(current))
  const resetDemo = () => {
    setBooking(cloneInitialBooking())
    setWorkflowPopover(null)
    setShowResetDialog(false)
  }
  const openWorkflowPopover = (id: string, target: HTMLElement, pinned: boolean) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    const rect = target.getBoundingClientRect()
    setWorkflowPopover({ id, pinned, rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height } })
  }
  const scheduleWorkflowClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setWorkflowPopover((current) => current?.pinned ? current : null), 140)
  }
  const keepWorkflowPopover = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-workflow-trigger], [data-workflow-popover]')) setWorkflowPopover(null)
    }
    const closeEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setWorkflowPopover(null) }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#282C3F]">
      <header className="sticky top-0 z-30 border-b border-[#ECECEC] bg-white/95 shadow-[0_2px_12px_rgba(40,44,63,0.05)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FC8019] text-white shadow-[0_4px_12px_rgba(252,128,25,0.22)] sm:h-10 sm:w-10"><UtensilsCrossed size={19} /></div>
            <div><p className="text-base font-extrabold tracking-tight text-[#282C3F] sm:text-lg">dineout<span className="text-[#FC8019]">ready</span></p><p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-[#686B78] sm:block">Arrival-synchronised dining</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[#ECECEC] bg-[#F7F7F7] p-1"><ViewToggle active={activeView === 'customer'} onClick={() => setActiveView('customer')}>Customer</ViewToggle><ViewToggle active={activeView === 'restaurant'} onClick={() => setActiveView('restaurant')}>Restaurant</ViewToggle></div>
        </div>
      </header>

      <WorkflowPopoverContext.Provider value={{ workflowPopover, openWorkflowPopover, closeWorkflowPopover: () => setWorkflowPopover(null), scheduleWorkflowClose, keepWorkflowPopover }}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
        {activeView === 'customer' && <ProductContext />}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#ECECEC] bg-white p-3 shadow-[0_2px_12px_rgba(40,44,63,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-xs text-[#686B78]">These controls simulate time and journey events; customers do not manually advance time or update their location.</p>
          <button onClick={() => setShowResetDialog(true)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#FC8019]/40 px-4 py-2 text-sm font-bold text-[#C65F12] hover:bg-[#FFF0E4]"><RotateCcw size={16} />Reset Demo</button>
        </div>
        {activeView === 'customer' ? <CustomerView booking={booking} updateBooking={updateBooking} /> : <RestaurantView booking={booking} updateBooking={updateBooking} />}
      </main>
      </WorkflowPopoverContext.Provider>

      <section className="bg-[#fffaf5]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-5 sm:py-7 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d97745]">Product documentation</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#26342d] sm:text-2xl">Explore the thinking behind Dineout Ready</h2>
            <p className="mt-2 text-sm leading-6 text-[#687168]">Discover how we identified the dining problem, explored different solutions, made product trade-offs and developed the arrival-synchronised dining experience.</p>
          </div>
          <a
            href="/Dineout_Ready_Product_Requirements_Document.pdf"
            download="Dineout_Ready_PRD.pdf"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FC8019] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e86f0d] sm:w-auto"
          >
            <Download size={18} aria-hidden="true" />
            Download Product Requirements Document
          </a>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-4 text-xs text-[#92968e] sm:flex-row sm:px-5 sm:py-5 lg:px-8"><p>Dineout Ready · Product prototype</p><p>Fictional demonstration data</p></div>
      </footer>
      {showResetDialog && <ResetDialog onCancel={() => setShowResetDialog(false)} onConfirm={resetDemo} />}
    </div>
  )
}

function ProductContext() {
  return <section className="mb-5 grid gap-3 sm:grid-cols-2">
    <details className="rounded-2xl border border-[#ECECEC] bg-white shadow-[0_4px_20px_rgba(40,44,63,0.04)]">
      <summary className="cursor-pointer list-none p-4 text-sm font-bold text-[#282C3F]">What problem are we solving?</summary>
      <div className="border-t border-[#ECECEC] px-4 pb-4 pt-3 text-sm leading-6 text-[#686B78]">
        <p>Families can reserve a table and know what they want to eat, yet still spend time ordering after arrival and waiting for the kitchen to prepare their food.</p>
        <p className="mt-3 text-xs leading-5 text-[#92968e]">Imagine a family of four booking a table for 8 PM. They already know what they want to eat, but after reaching the restaurant, they still need to place the order and wait for preparation. This delays the time they actually spend enjoying their meal.</p>
      </div>
    </details>
    <details className="rounded-2xl border border-[#ECECEC] bg-white shadow-[0_4px_20px_rgba(40,44,63,0.04)]">
      <summary className="cursor-pointer list-none p-4 text-sm font-bold text-[#282C3F]">How does Dineout Ready approach it?</summary>
      <div className="border-t border-[#ECECEC] px-4 pb-4 pt-3 text-sm leading-6 text-[#686B78]">
        <p>Plan your meal before travelling and help the restaurant coordinate preparation around your expected arrival.</p>
        <p className="mt-3 text-xs leading-5 text-[#92968e]">The customer selects and confirms the complete meal before leaving. When they start their journey, the restaurant receives their expected arrival time. Dineout Ready calculates individual first-course preparation schedules, helping eligible dishes be prepared in parallel around the customer&apos;s arrival.</p>
        <p className="mt-3 text-xs leading-5 text-[#92968e]">The restaurant retains control over preparation and serving, while the customer can follow meal progress.</p>
        <p className="mt-3 text-xs leading-5 text-[#92968e]">Our goal is to reduce waiting after seating, not guarantee that every dish will be ready the moment the customer arrives.</p>
      </div>
    </details>
  </section>
}

type WorkflowPopoverState = {
  id: string
  pinned: boolean
  rect: { top: number; left: number; right: number; bottom: number; width: number; height: number }
}

type WorkflowPopoverContextValue = {
  workflowPopover: WorkflowPopoverState | null
  openWorkflowPopover: (id: string, target: HTMLElement, pinned: boolean) => void
  closeWorkflowPopover: () => void
  scheduleWorkflowClose: () => void
  keepWorkflowPopover: () => void
}

const WorkflowPopoverContext = createContext<WorkflowPopoverContextValue | null>(null)

const workflowExplanations: Record<string, { what: string; why: string }> = {
  customerReservation: {
    what: 'The customer’s Dineout reservation is already confirmed, so they can proceed directly to planning their meal.',
    why: 'We avoid asking customers to confirm the same reservation twice. Dineout Ready complements the existing booking rather than creating another booking flow.',
  },
  planMeal: {
    what: 'The customer browses the available menu and selects dishes for their group.',
    why: 'Planning before arrival reduces time spent browsing menus and placing orders after reaching the restaurant.',
  },
  confirmPreOrder: {
    what: 'The selected dishes are validated against menu availability and the pre-order is confirmed.',
    why: 'The restaurant gets advance visibility of the meal without introducing an unnecessary manual order-acceptance step.',
  },
  startJourney: {
    what: 'The customer starts their journey and receives a simulated route-based arrival estimate.',
    why: 'Preparation should be coordinated around expected arrival, not a fixed reservation time alone.',
  },
  preparation: {
    what: 'The restaurant coordinates preparation based on the customer’s ETA and configured kitchen batches.',
    why: 'Preparing too early can leave food waiting. Coordinating preparation closer to arrival is intended to reduce that gap.',
  },
  customerArrival: {
    what: 'The customer simulates arrival. The restaurant can then confirm that the customer is seated.',
    why: 'Arrival and seating are separate events. The restaurant must not confirm seating before the customer has arrived.',
  },
  customerCourses: {
    what: 'Starters, mains and desserts progress in sequence through the kitchen controls.',
    why: 'Releasing every course together can result in dishes arriving too early. Course progression lets the restaurant coordinate a calmer dining rhythm.',
  },
  menuAvailability: {
    what: 'The restaurant reviews available servings and can pause a dish when it should no longer be ordered.',
    why: 'A single availability state keeps customer choices aligned with restaurant inventory and operational decisions.',
  },
  incomingOrders: {
    what: 'Confirmed customer dishes appear in the shared restaurant kitchen queue.',
    why: 'Advance visibility lets the restaurant prepare with more certainty before the customer arrives.',
  },
  restaurantEta: {
    what: 'The restaurant sees the same reservation ETA that the customer is adjusting in the journey controls.',
    why: 'Sharing one ETA avoids conflicting assumptions about when preparation should begin.',
  },
  kitchenScheduling: {
    what: 'Each dish shows its batch estimate, planned release and current preparation status.',
    why: 'Item-level scheduling gives the kitchen control without pretending that a combined duration is an elapsed timer.',
  },
  restaurantArrival: {
    what: 'The restaurant confirms seating only after the customer has simulated arrival.',
    why: 'Separating arrival from seating prevents the restaurant from marking a guest seated too early.',
  },
  courseProgression: {
    what: 'The restaurant marks dishes served and controls when each selected course is prepared and served.',
    why: 'Progressive release supports a calmer dining rhythm and avoids sending every course at once.',
  },
}

function StepLabel({ id, number, title, description, dark = false }: { id: string; number: string; title: string; description: string; dark?: boolean }) {
  const context = useContext(WorkflowPopoverContext)
  const explanation = workflowExplanations[id]
  const isOpen = context?.workflowPopover?.id === id
  const triggerRef = useRef<HTMLButtonElement>(null)
  const open = (pinned: boolean) => {
    if (triggerRef.current) context?.openWorkflowPopover(id, triggerRef.current, pinned)
  }
  const toggle = () => {
    if (isOpen && context?.workflowPopover?.pinned) return context.closeWorkflowPopover()
    open(true)
  }

  return <div className={`mb-5 ${dark ? 'text-[#dce9dc]' : 'text-[#536c58]'}`}><div className="flex items-center gap-2"><button ref={triggerRef} type="button" aria-label={`Explain step ${number}: ${title}`} aria-expanded={isOpen} data-workflow-trigger onMouseEnter={() => open(false)} onMouseLeave={context?.scheduleWorkflowClose} onFocus={() => open(false)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(true) } }} onClick={(event) => event.detail === 0 ? open(true) : toggle()} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition ${dark ? 'bg-white/10 text-[#dce9dc] hover:bg-white/20' : 'bg-[#e9eee8] text-[#536c58] hover:bg-[#dbe7db]'} ${isOpen ? 'ring-2 ring-[#d97745]/50' : ''}`}>{number}<span className="sr-only">, information available</span></button><p className="text-xs font-bold uppercase tracking-[0.12em]">{title}</p></div><p className={`mt-2 max-w-2xl pl-9 text-xs leading-5 ${dark ? 'text-[#b9cbb9]' : 'text-[#82877e]'}`}>{description}</p>{isOpen && explanation && <WorkflowPopover id={id} title={title} explanation={explanation} rect={context!.workflowPopover!.rect} dark={dark} onEnter={context!.keepWorkflowPopover} onLeave={context!.scheduleWorkflowClose} />}</div>
}

function WorkflowPopover({ id, title, explanation, rect, dark, onEnter, onLeave }: { id: string; title: string; explanation: { what: string; why: string }; rect: WorkflowPopoverState['rect']; dark: boolean; onEnter: () => void; onLeave: () => void }) {
  const popoverWidth = Math.min(320, window.innerWidth - 24)
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - popoverWidth / 2, window.innerWidth - popoverWidth - 12))
  const above = rect.top > 250
  const top = above ? rect.top - 10 : rect.bottom + 10
  return createPortal(<div id={`${id}-workflow-popover`} role="tooltip" data-workflow-popover onMouseEnter={onEnter} onMouseLeave={onLeave} className={`fixed z-[60] w-[calc(100vw-24px)] max-w-[320px] rounded-2xl border p-4 text-xs leading-5 shadow-xl ${dark ? 'border-[#6f8b73] bg-[#2f4a38] text-[#dce9dc]' : 'border-[#d9d8cd] bg-[#fffdf8] text-[#59635b]'}`} style={{ left, top, transform: above ? 'translateY(-100%)' : 'none' }}><p className={`font-bold ${dark ? 'text-white' : 'text-[#263a30]'}`}>{title}</p><p className="mt-3"><strong className={dark ? 'text-[#b9d8bd]' : 'text-[#536c58]'}>What happens?</strong><br />{explanation.what}</p><p className="mt-2"><strong className={dark ? 'text-[#b9d8bd]' : 'text-[#536c58]'}>Why did we design it this way?</strong><br />{explanation.why}</p></div>, document.body)
}

function ResetDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onCancel])

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-[#26342d]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><section role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-[#fff1e9] p-3 text-[#b65b32]"><RotateCcw size={20} /></div><div><h2 id="reset-dialog-title" className="text-lg font-bold text-[#26342d]">Reset this demonstration?</h2><p className="mt-2 text-sm leading-6 text-[#687168]">Your current order, journey progress, preparation schedule and simulated kitchen activity will be cleared. The application will return to its initial confirmed reservation.</p></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-[#d9d8cd] px-4 py-2 text-sm font-semibold text-[#536c58]">Cancel</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-xl bg-[#b65b32] px-4 py-2 text-sm font-bold text-white">Yes, Reset Demo</button></div></section></div>
}

function CustomerView({ booking, updateBooking }: { booking: DemoBooking; updateBooking: (update: (current: DemoBooking) => DemoBooking) => void }) {
  const [showPlanner, setShowPlanner] = useState(false)
  const canEdit = booking.preOrderStatus === 'draft' || booking.preOrderStatus === 'needs_attention'
  const selectedCount = booking.selectedDishes.reduce((sum, dish) => sum + dish.quantity, 0)
  const subtotal = calculateSubtotal(booking)
  const selectedItems = getSelectedItems(booking)

  const updateDish = (item: MenuItem, change: number) => {
    if (!canEdit) return
    updateBooking((current) => {
      const currentDish = current.selectedDishes.find((dish) => dish.itemId === item.id)
      const quantity = (currentDish?.quantity ?? 0) + change
      if (change > 0 && (derivedAvailability(item) === 'sold_out' || derivedAvailability(item) === 'paused' || quantity > item.availablePortions)) return current
      const selectedDishes = quantity <= 0 ? current.selectedDishes.filter((dish) => dish.itemId !== item.id) : currentDish
        ? current.selectedDishes.map((dish) => dish.itemId === item.id ? { ...dish, quantity } : dish)
        : [...current.selectedDishes, { itemId: item.id, quantity }]
      return { ...current, selectedDishes }
    })
  }

  const confirmPreOrder = () => updateBooking((current) => {
    if (current.reservation.status !== 'confirmed' || !current.selectedDishes.length || !canOrder(current)) return current
    return {
      ...current,
      menu: current.menu.map((item) => {
        const selected = current.selectedDishes.find((dish) => dish.itemId === item.id)
        return selected ? { ...item, availablePortions: item.availablePortions - selected.quantity } : item
      }),
      preOrderStatus: 'confirmed',
      itemExceptions: [],
      kitchenItems: createKitchenItems(current),
    }
  })

  const startJourney = () => updateBooking((current) => current.preOrderStatus !== 'confirmed' ? current : {
    ...current,
    route: { ...current.route, started: true },
    kitchenItems: scheduleFirstCourseItems(current.kitchenItems, current.menu, current.simulatedMinutes, current.route.remainingEtaMinutes, current.route.currentEta),
  })
  const changeEta = (minutes: number) => updateBooking((current) => {
    if (!current.route.started || current.route.arrived || current.route.seated) return current
    const remainingEtaMinutes = Math.max(0, current.route.remainingEtaMinutes + minutes)
    return {
      ...current,
      route: { ...current.route, travelMinutes: Math.max(8, current.route.travelMinutes + minutes), remainingEtaMinutes, currentEta: shiftTime(current.route.currentEta, minutes) },
      kitchenItems: rescheduleFirstCourseItems(current.kitchenItems, current.menu, current.simulatedMinutes, remainingEtaMinutes, current.route.currentEta),
    }
  })
  const simulateArrival = () => updateBooking((current) => {
    if (!current.route.started || current.route.arrived) return current
    return { ...current, route: { ...current.route, arrived: true, remainingEtaMinutes: 0 }, kitchenItems: advanceKitchenTime(current.kitchenItems, current.menu, current.simulatedMinutes, current.simulatedMinutes) }
  })
  const resolveException = (itemId: string, replacementId?: string) => updateBooking((current) => {
    const selected = replacementId ? current.selectedDishes.map((dish) => dish.itemId === itemId ? { ...dish, itemId: replacementId } : dish) : current.selectedDishes.filter((dish) => dish.itemId !== itemId)
    return { ...current, selectedDishes: selected, preOrderStatus: selected.length ? 'confirmed' : 'draft', itemExceptions: current.itemExceptions.filter((exception) => exception.itemId !== itemId), kitchenItems: replacementId ? createKitchenItems({ ...current, selectedDishes: selected }) : current.kitchenItems.filter((item) => item.itemId !== itemId) }
  })

  return <div className="space-y-6 sm:space-y-8">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FFF0E4] px-3 py-1.5 text-xs font-bold text-[#C65F12]"><Sparkles size={13} />A more thoughtful way to dine</div><h1 className="text-3xl font-extrabold tracking-[-0.025em] text-[#282C3F] sm:text-4xl">Good food. Less waiting.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#686B78] sm:text-base">Your confirmed table is ready. Pre-select a meal and let the kitchen prepare around your arrival.</p></div><div className="flex items-center gap-2 text-sm font-semibold text-[#686B78]"><MapPin size={16} className="text-[#FC8019]" />{demoRestaurant.location}</div></section>
    <section className={`grid gap-5 ${booking.preOrderStatus !== 'draft' ? 'lg:grid-cols-[1.35fr_0.85fr]' : ''}`}><div className="overflow-hidden rounded-2xl bg-[#282C3F] p-5 text-white shadow-[0_4px_20px_rgba(40,44,63,0.10)] sm:p-8"><StepLabel id="customerReservation" number="01" title="Confirmed Reservation" description="Your existing Dineout table is confirmed before meal planning begins." dark /><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-[#60B246]/15 px-3 py-1.5 text-xs font-bold text-[#B9E5A8]"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#60B246]" />Confirmed Dineout reservation</span><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.02em] sm:text-3xl">{demoRestaurant.name}</h2><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#D9DAE2]"><span className="flex items-center gap-1.5"><MapPin size={15} className="text-[#FC8019]" />{demoRestaurant.location}</span><span className="flex items-center gap-1.5"><Users size={15} />{booking.reservation.guests} guests</span></div></div><div className="rounded-2xl bg-[#FC8019] p-3 text-white shadow-[0_6px_18px_rgba(252,128,25,0.28)]"><UtensilsCrossed size={24} /></div></div><div className={`mt-7 grid gap-3 ${booking.preOrderStatus !== 'draft' ? 'grid-cols-2' : ''}`}><StatDark label="Reservation" value={`${booking.reservation.time}`} note={booking.reservation.date} />{booking.preOrderStatus !== 'draft' && <StatDark label="Pre-order" value={preOrderLabel(booking.preOrderStatus)} note={preOrderDescription(booking.preOrderStatus)} />}</div><div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-bold text-[#E8E9ED]"><CircleCheck size={16} className="text-[#60B246]" />Reservation confirmed</div></div>{booking.preOrderStatus !== 'draft' && <JourneyCard booking={booking} />}</section>
    <section className="grid gap-4 sm:grid-cols-2">{booking.preOrderStatus !== 'draft' && <InfoCard icon={<ClipboardList size={19} />} label="Confirmed meal" value={`${selectedCount} dishes`} description={`Order subtotal ₹${subtotal}`} />}{booking.route.started && <InfoCard icon={<Navigation size={19} />} label="Journey" value={booking.route.seated ? 'Seated' : booking.route.arrived ? 'Arrived' : booking.route.currentEta} description={`${booking.route.distanceKm} km · ${booking.route.travelMinutes} min`} />}</section>
    {booking.itemExceptions.length > 0 && <ExceptionCard booking={booking} resolveException={resolveException} />}
    {!showPlanner ? <section className="rounded-2xl border border-[#E6E6E9] bg-white p-5 text-center shadow-[0_4px_20px_rgba(40,44,63,0.06)] sm:p-8"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E4] text-[#FC8019]"><UtensilsCrossed size={21} /></div><h2 className="mt-4 text-lg font-bold text-[#282C3F]">{booking.preOrderStatus === 'draft' ? 'Plan your meal before you arrive' : 'Your confirmed meal'}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#686B78]">{booking.preOrderStatus === 'draft' ? 'Browse the fictional menu and choose dishes by course.' : `${selectedCount} dishes confirmed · ₹${subtotal}`}</p><button onClick={() => setShowPlanner(true)} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#FC8019] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(252,128,25,0.22)] hover:bg-[#E86F0D]">{booking.preOrderStatus === 'draft' ? 'Plan Your Meal' : 'View meal summary'}<ArrowUpRight size={16} /></button></section> : <MealPlanner booking={booking} canEdit={canEdit} subtotal={subtotal} updateDish={updateDish} confirmPreOrder={confirmPreOrder} onClose={() => setShowPlanner(false)} />}
    {booking.preOrderStatus === 'confirmed' && <JourneyControls booking={booking} startJourney={startJourney} changeEta={changeEta} simulateArrival={simulateArrival} />}
    {booking.preOrderStatus === 'confirmed' && <OrderSummary items={selectedItems} subtotal={subtotal} />}
  </div>
}

function MealPlanner({ booking, canEdit, subtotal, updateDish, confirmPreOrder, onClose }: { booking: DemoBooking; canEdit: boolean; subtotal: number; updateDish: (item: MenuItem, change: number) => void; confirmPreOrder: () => void; onClose: () => void }) {
  const [reviewOpen, setReviewOpen] = useState(false)
  const reviewRef = useRef<HTMLDivElement>(null)
  const openReview = () => {
    setReviewOpen(true)
    window.requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  return <section className="relative grid gap-5 pb-24 lg:grid-cols-[1.4fr_0.8fr] lg:pb-0"><div className="min-w-0 rounded-2xl border border-[#ECECEC] bg-white p-4 shadow-[0_4px_20px_rgba(40,44,63,0.06)] sm:p-6"><StepLabel id="planMeal" number="02" title="Plan Your Meal" description="Choose dishes by course from the fictional restaurant menu." /><div className="flex items-center justify-between border-b border-[#ECECEC] pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#686B78]">Fictional menu</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[#282C3F]">Plan your meal</h2></div><button onClick={onClose} className="flex min-h-11 items-center gap-1 text-sm font-bold text-[#686B78]">Close <X size={16} /></button></div><div className="mt-6 space-y-7">{categories.map((category) => <MenuSection key={category} category={category} menu={booking.menu} booking={booking} canEdit={canEdit} updateDish={updateDish} />)}</div></div><div ref={reviewRef} id="meal-review" className={`scroll-mt-24 scroll-mb-24 pb-16 ${reviewOpen ? 'block' : 'hidden'} lg:block`}><MealSummary booking={booking} subtotal={subtotal} canEdit={canEdit} confirmPreOrder={confirmPreOrder} /></div><button onClick={openReview} className="fixed inset-x-3 bottom-3 z-20 flex min-h-14 items-center justify-between rounded-2xl bg-[#282C3F] px-4 text-left text-white shadow-[0_-4px_24px_rgba(40,44,63,0.18)] [padding-bottom:env(safe-area-inset-bottom)] lg:hidden"><span><span className="block text-xs text-[#D9DAE2]">{getSelectedItems(booking).length} selected dishes</span><span className="block text-sm font-extrabold">Review meal · ₹{subtotal}</span></span><ArrowUpRight size={18} className="text-[#FC8019]" /></button></section>
}

function MenuSection({ category, menu, booking, canEdit, updateDish }: { category: MenuCategory; menu: MenuItem[]; booking: DemoBooking; canEdit: boolean; updateDish: (item: MenuItem, change: number) => void }) {
  return <div><h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#282C3F]">{category}</h3><div className="space-y-3">{menu.filter((item) => item.category === category).map((item) => { const quantity = booking.selectedDishes.find((dish) => dish.itemId === item.id)?.quantity ?? 0; const status = derivedAvailability(item); const blocked = status === 'sold_out' || status === 'paused'; return <div key={item.id} className={`rounded-2xl border p-4 transition ${blocked ? 'border-[#F0D9D9] bg-[#FFF8F8]' : 'border-[#ECECEC] bg-white shadow-[0_2px_10px_rgba(40,44,63,0.04)]'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><DietIndicator vegetarian={isVegetarian(item)} /><h4 className="font-bold text-[#282C3F]">{item.name}</h4></div><p className="mt-1 text-sm leading-5 text-[#686B78]">{item.description}</p><p className="mt-2 text-xs font-semibold text-[#686B78]">{item.servingSize}</p></div><p className="shrink-0 text-base font-bold text-[#282C3F]">₹{item.price}</p></div><div className="mt-3 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${blocked ? 'bg-[#FFF0F0] text-[#A62B38]' : status === 'limited' ? 'bg-[#FFF4E5] text-[#A86612]' : 'bg-[#EDF8EA] text-[#3D802B]'}`}>{availabilityLabel(status)}</span>{canEdit && !blocked ? <QuantityControl quantity={quantity} onChange={(change) => updateDish(item, change)} /> : <span className={`text-xs font-bold ${blocked ? 'text-[#A62B38]' : 'text-[#282C3F]'}`}>{blocked ? availabilityLabel(status) : `${quantity} selected`}</span>}</div></div> })}</div></div>
}

function MealSummary({ booking, subtotal, canEdit, confirmPreOrder }: { booking: DemoBooking; subtotal: number; canEdit: boolean; confirmPreOrder: () => void }) {
  const selected = getSelectedItems(booking)
  return <aside className="h-fit rounded-2xl bg-[#282C3F] p-5 text-white shadow-[0_8px_28px_rgba(40,44,63,0.12)] lg:sticky lg:top-24"><StepLabel id="confirmPreOrder" number="03" title="Confirm Pre-order" description="Review the meal; availability is validated before confirmation." dark /><div className="flex items-center gap-3"><div className="rounded-xl bg-[#FC8019] p-3 text-white"><ClipboardList size={20} /></div><div><h2 className="font-bold">Meal summary</h2><p className="mt-1 text-xs text-[#D9DAE2]">{selected.length ? `${selected.length} menu items` : 'Choose dishes by course'}</p></div></div><div className="mt-6 space-y-3">{selected.length ? selected.map(({ item, quantity }) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-[#E8E9ED]">{item.name} <span className="text-[#AEB1BC]">× {quantity}</span></span><span className="font-bold">₹{item.price * quantity}</span></div>) : <p className="rounded-xl bg-white/[0.07] p-4 text-sm text-[#D9DAE2]">Your selected dishes will appear here.</p>}</div><div className="mt-6 border-t border-white/10 pt-4"><div className="flex justify-between text-sm"><span className="text-[#D9DAE2]">Order subtotal</span><span className="text-lg font-extrabold">₹{subtotal}</span></div><p className="mt-2 text-xs text-[#AEB1BC]">Meal preparation is coordinated around your arrival.</p>{booking.preOrderStatus === 'draft' && <button onClick={confirmPreOrder} disabled={!canEdit || !selected.length} className="mt-5 min-h-12 w-full rounded-xl bg-[#FC8019] px-4 py-3 text-sm font-bold shadow-[0_6px_16px_rgba(252,128,25,0.22)] disabled:cursor-not-allowed disabled:opacity-40">Confirm pre-order</button>}{booking.preOrderStatus === 'needs_attention' && <p className="mt-4 text-sm font-semibold text-[#FFB4A9]">One item needs your attention before the meal can continue.</p>}{booking.preOrderStatus === 'confirmed' && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-[#B9E5A8]"><CircleCheck size={16} />Pre-order confirmed automatically</p>}</div></aside>
}

function JourneyControls({ booking, startJourney, changeEta, simulateArrival }: { booking: DemoBooking; startJourney: () => void; changeEta: (minutes: number) => void; simulateArrival: () => void }) {
  return <section className="rounded-3xl border border-[#e9e7df] bg-white p-5 shadow-sm sm:p-6"><StepLabel id="startJourney" number="04" title="Start Journey" description="Begin travelling to share route distance and expected arrival with the kitchen." /><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#92968e]">Journey simulator</p><h2 className="mt-1 text-xl font-bold">Arrive when you&apos;re ready</h2></div><StatusPill label={booking.route.seated ? 'Seated' : booking.route.arrived ? 'Arrived' : 'Journey active'} /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><DetailRow label="Route" value={`${booking.route.distanceKm} km · ${booking.route.mode}`} /><DetailRow label="Travel time" value={`${booking.route.travelMinutes} min`} /><DetailRow label="Expected arrival" value={booking.route.currentEta} /></div><StepLabel id="customerArrival" number="06" title="Arrival and Seating" description="Arrival and restaurant-confirmed seating are tracked separately." /><details className="mt-5 rounded-2xl border border-[#e9e7df] bg-[#fafaf7] p-3"><summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-[#536c58]">Demo controls <span className="ml-2 font-normal normal-case tracking-normal text-[#92968e]">Journey simulation only</span></summary><div className="mt-3 flex flex-wrap gap-2">{!booking.route.started && <ActionButton icon={<Play size={16} />} onClick={startJourney}>Start Journey</ActionButton>}{booking.route.started && !booking.route.arrived && <><ActionButton icon={<Minus size={16} />} onClick={() => changeEta(-10)}>Faster journey</ActionButton><ActionButton icon={<Plus size={16} />} onClick={() => changeEta(10)}>Traffic delay</ActionButton><ActionButton icon={<Navigation size={16} />} onClick={simulateArrival}>Simulate arrival</ActionButton></>}</div></details><StepLabel id="customerCourses" number="07" title="Course-by-Course Serving" description="The restaurant manages preparation and serving while you follow each course status." /><div className="mt-5 grid gap-3 border-t border-[#eeede7] pt-5 sm:grid-cols-2"><CourseCard title="Starters" state={courseStatus(booking, 'Starters')} /><CourseCard title="Main course" state={courseStatus(booking, 'Main Course')} /><CourseCard title="Dessert" state={courseStatus(booking, 'Desserts')} /></div></section>
}

function RestaurantView({ booking, updateBooking }: { booking: DemoBooking; updateBooking: (update: (current: DemoBooking) => DemoBooking) => void }) {
  const selected = getSelectedItems(booking)
  const firstCourseCount = selected.filter(({ item }) => item.category === 'Starters').length
  const updateAvailability = (itemId: string) => updateBooking((current) => ({ ...current, menu: current.menu.map((item) => item.id === itemId ? { ...item, manuallyPaused: !item.manuallyPaused, availability: derivedAvailability({ ...item, manuallyPaused: !item.manuallyPaused }) } : item) }))
  const itemAction = (itemId: string, status: KitchenItemStatus) => updateBooking((current) => ({
    ...current,
    kitchenItems: current.kitchenItems.map((item) => {
      if (item.itemId !== itemId) return item
      const dish = getMenuItem(current, itemId)
      if (!dish) return item
      if (status === 'preparing') return startKitchenItem(item, dish, current.simulatedMinutes)
      if (status === 'ready' && item.status === 'preparing') return { ...item, status, preparationCompletedAt: current.simulatedMinutes }
      if (status === 'served' && item.status === 'ready') return { ...item, status }
      return item
    }),
  }))
  const toggleHold = (itemId: string) => updateBooking((current) => ({
    ...current,
    kitchenItems: current.kitchenItems.map((item) => {
      if (item.itemId !== itemId) return item
      const dish = getMenuItem(current, itemId)
      if (!dish || item.status !== 'queued') return item
      return item.manualHold ? releaseKitchenHold(item, dish, current.simulatedMinutes) : { ...item, manualHold: true }
    }),
  }))
  const confirmSeated = () => updateBooking((current) => current.route.arrived ? { ...current, route: { ...current.route, seated: true } } : current)
  const reportUnavailable = (itemId: string) => updateBooking((current) => ({ ...current, preOrderStatus: 'needs_attention', itemExceptions: [...current.itemExceptions, { itemId, reason: 'Kitchen availability changed', alternatives: current.menu.filter((item) => item.category === getMenuItem(current, itemId)?.category && item.id !== itemId && derivedAvailability(item) !== 'sold_out' && derivedAvailability(item) !== 'paused').slice(0, 2).map((item) => item.id) }], kitchenItems: current.kitchenItems.map((item) => item.itemId === itemId ? { ...item, status: 'needs_attention' } : item) }))
  const advanceTime = () => updateBooking((current) => {
    const simulatedMinutes = current.simulatedMinutes + 5
    const activeJourney = current.route.started && !current.route.arrived
    const remainingEtaMinutes = activeJourney ? Math.max(0, current.route.remainingEtaMinutes - 5) : current.route.remainingEtaMinutes
    const scheduled = activeJourney ? rescheduleFirstCourseItems(current.kitchenItems, current.menu, simulatedMinutes, remainingEtaMinutes, current.route.currentEta) : current.kitchenItems
    return {
      ...current,
      simulatedMinutes,
      route: activeJourney ? { ...current.route, remainingEtaMinutes, currentEta: shiftTime(current.route.currentEta, -5) } : current.route,
      kitchenItems: advanceKitchenTime(scheduled, current.menu, current.simulatedMinutes, simulatedMinutes),
    }
  })
  return <div className="space-y-6 sm:space-y-8"><StepLabel id="restaurantEta" number="03" title="Customer ETA" description="The shared reservation and expected arrival guide restaurant preparation." /><StepLabel id="restaurantArrival" number="05" title="Arrival and Seating" description="Arrival is simulated by the customer before the restaurant confirms seating." /><StepLabel id="courseProgression" number="06" title="Course Progression" description="Starters, mains and desserts progress in sequence through the kitchen controls." /><section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#FFF0E4] px-3 py-1.5 text-xs font-bold text-[#C65F12]"><LayoutDashboard size={13} />Restaurant workspace</div><h1 className="text-3xl font-extrabold tracking-[-0.025em] text-[#282C3F] sm:text-4xl">Kitchen, in sync.</h1><p className="mt-2 text-sm text-[#686B78] sm:text-base">Manage fictional availability and coordinate the confirmed pre-order.</p></div></section>{booking.preOrderStatus === 'confirmed' && <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard icon={<ClipboardList size={19} />} label="Pre-order" value="Confirmed" note="Automatic availability validation" /><MetricCard icon={<Navigation size={19} />} label="Current ETA" value={booking.route.started ? booking.route.currentEta : 'Not started'} note={`${booking.route.distanceKm} km · ${booking.route.mode}`} /><MetricCard icon={<Timer size={19} />} label="First-course target readiness" value={firstCourseCount ? shiftTime(booking.route.currentEta, 5) : 'No starters selected'} note={firstCourseCount ? `${firstCourseCount} item${firstCourseCount === 1 ? '' : 's'} · scheduling target, not a serving guarantee` : 'Restaurant controls later courses'} /></section>}<section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,63,0.06)] sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#FFF0E4] p-3 text-[#FC8019]"><CalendarDays size={21} /></div><div><h2 className="font-extrabold text-[#282C3F]">Confirmed reservation</h2><p className="mt-1 text-xs text-[#686B78]">Reservation status is independent and remains confirmed.</p></div></div><div className="mt-6 space-y-4 text-sm"><DetailRow label="Booking host" value={booking.reservation.hostName} /><DetailRow label="Date and time" value={`${booking.reservation.date} · ${booking.reservation.time}`} /><DetailRow label="Guests" value={`${booking.reservation.guests}`} /><DetailRow label="ETA" value={booking.route.started ? booking.route.currentEta : 'Journey not started'} /><div className="flex items-center justify-between border-t border-[#ECECEC] pt-4"><span className="text-[#686B78]">Reservation status</span><StatusPill label="Confirmed" /></div></div>{booking.preOrderStatus === 'confirmed' && booking.route.started && !booking.route.seated && <details className="mt-6 rounded-2xl border border-[#ECECEC] bg-[#FAFAF8] p-3"><summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-[#282C3F]">Demo controls <span className="ml-2 font-normal normal-case tracking-normal text-[#686B78]">Simulation only</span></summary><button onClick={advanceTime} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9DADE] px-4 py-2 text-sm font-bold text-[#282C3F]"><RefreshCw size={16} />Advance Demo Time +5 Minutes</button></details>}  {booking.route.arrived && !booking.route.seated && <div className="mt-5 space-y-3"><p className="rounded-xl bg-[#EDF8EA] p-3 text-sm font-bold text-[#3D802B]">Customer has arrived. Confirm seating now.</p><button onClick={confirmSeated} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#60B246] px-4 py-2 text-sm font-bold text-white"><Check size={16} />Confirm customer seated</button></div>}</div><KitchenOrder booking={booking} selected={selected} itemAction={itemAction} toggleHold={toggleHold} reportUnavailable={reportUnavailable} /></section><AvailabilityPanel booking={booking} updateAvailability={updateAvailability} /><div className="rounded-2xl bg-[#282C3F] p-5 text-white shadow-[0_4px_20px_rgba(40,44,63,0.10)] sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#FC8019] p-3"><ChefHat size={22} /></div><div><h2 className="font-extrabold">Course coordination</h2><p className="mt-1 text-xs text-[#D9DAE2]">Restaurant controls preparation and serving for each course.</p></div></div><p className="mt-5 max-w-2xl text-sm leading-6 text-[#D9DAE2]">All selected courses are visible in advance. The restaurant controls when each course is prepared and served.</p></div></div>
}

function KitchenOrder({ booking, selected, itemAction, toggleHold, reportUnavailable }: { booking: DemoBooking; selected: Array<{ item: MenuItem; quantity: number }>; itemAction: (itemId: string, status: KitchenItemStatus) => void; toggleHold: (itemId: string) => void; reportUnavailable: (itemId: string) => void }) {
  return <div className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,63,0.06)] sm:p-6"><StepLabel id="incomingOrders" number="02" title="Incoming Confirmed Pre-orders" description="The shared confirmed meal appears in the restaurant kitchen queue." /><StepLabel id="kitchenScheduling" number="04" title="Kitchen Scheduling" description="Dish batches show release timing and preparation controls." /><div className="flex items-center justify-between gap-3"><div><div className="flex items-center gap-3"><div className="rounded-xl bg-[#FFF0E4] p-3 text-[#FC8019]"><ChefHat size={21} /></div><div><h2 className="font-extrabold text-[#282C3F]">{selected.length ? 'Confirmed pre-order' : 'Kitchen queue'}</h2><p className="mt-1 text-xs text-[#686B78]">{selected.length ? 'Individual dishes and batch schedules' : 'No confirmed meal order yet'}</p></div></div></div>{selected.length && <StatusPill label="Confirmed" />}</div><div className="mt-6 space-y-5">{selected.length ? categories.map((category) => { const dishes = selected.filter(({ item }) => item.category === category); return dishes.length ? <div key={category}><h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#282C3F]">{category}</h3><div className="space-y-3">{dishes.map(({ item, quantity }) => { const kitchen = booking.kitchenItems.find((candidate) => candidate.itemId === item.id); const release = kitchen?.plannedRelease ?? (category === 'Starters' ? 'After journey starts' : 'Restaurant controlled'); return <div key={item.id} className="rounded-2xl border border-[#ECECEC] bg-[#FAFAF8] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-bold text-[#282C3F]"><DietIndicator vegetarian={isVegetarian(item)} />{item.name} <span className="font-normal text-[#686B78]">× {quantity}</span></p><p className="mt-1 text-xs text-[#686B78]">{preparationDuration(item, quantity)} min batch · capacity {item.batchCapacity} · release {release}{kitchen?.manualHold ? ' · held' : ''}</p></div><StatusPill label={statusLabel(kitchen?.status ?? 'queued')} /></div><div className="mt-3 flex flex-wrap gap-2">{kitchen?.status === 'queued' && <ActionButton icon={<Play size={15} />} onClick={() => itemAction(item.id, 'preparing')}>Start preparation now</ActionButton>}{kitchen?.status === 'queued' && <ActionButton icon={<PauseCircle size={15} />} onClick={() => toggleHold(item.id)}>{kitchen.manualHold ? 'Release item' : 'Hold item'}</ActionButton>}{kitchen?.status === 'preparing' && <ActionButton icon={<Check size={15} />} onClick={() => itemAction(item.id, 'ready')}>Mark ready</ActionButton>}{kitchen?.status === 'ready' && <ActionButton icon={<Check size={15} />} onClick={() => itemAction(item.id, 'served')}>Mark served</ActionButton>}{kitchen && kitchen.status !== 'served' && kitchen.status !== 'removed' && <ActionButton icon={<X size={15} />} onClick={() => reportUnavailable(item.id)}>Report unavailable</ActionButton>}</div></div> })}</div></div> : null }) : <p className="rounded-xl bg-[#FAFAF8] p-4 text-sm text-[#686B78]">No confirmed meal order in the kitchen queue.</p>}</div></div>
}

function AvailabilityPanel({ booking, updateAvailability }: { booking: DemoBooking; updateAvailability: (itemId: string) => void }) {
  return <section className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,63,0.06)] sm:p-6"><StepLabel id="menuAvailability" number="01" title="Menu Availability" description="Manage fictional stock visibility and pause controls for each dish." /><div className="flex items-center gap-3"><div className="rounded-xl bg-[#FFF0E4] p-3 text-[#FC8019]"><Gauge size={21} /></div><div><h2 className="font-extrabold text-[#282C3F]">Fictional menu availability</h2><p className="mt-1 text-xs text-[#686B78]">Pause or resume items; quantity drives the status.</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{booking.menu.map((item) => { const status = derivedAvailability(item); return <button key={item.id} onClick={() => updateAvailability(item.id)} className="flex min-h-12 items-center justify-between rounded-xl border border-[#ECECEC] bg-[#FAFAF8] px-3 py-2 text-left hover:border-[#FC8019]/50"><span className="min-w-0"><span className="flex items-center gap-2 text-sm font-bold text-[#282C3F]"><DietIndicator vegetarian={isVegetarian(item)} />{item.name}</span><span className="block text-xs text-[#686B78]">{item.availablePortions} servings · batch {item.batchCapacity} · {item.preparationMinutes} min</span></span><span className={`ml-2 shrink-0 text-xs font-bold ${status === 'available' ? 'text-[#3D802B]' : status === 'limited' ? 'text-[#A86612]' : 'text-[#A62B38]'}`}>{availabilityLabel(status)}</span></button> })}</div></section>
}

function ExceptionCard({ booking, resolveException }: { booking: DemoBooking; resolveException: (itemId: string, replacementId?: string) => void }) {
  return <section className="rounded-3xl border border-[#edcfc1] bg-[#fff7f2] p-5 sm:p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-white p-3 text-[#a65f3e]"><PauseCircle size={21} /></div><div><h2 className="font-semibold text-[#8f4e35]">One item needs your attention</h2><p className="mt-1 text-xs text-[#a65f3e]">The restaurant reported a confirmed item as unavailable.</p></div></div>{booking.itemExceptions.map((exception) => <div key={exception.itemId} className="mt-5 rounded-2xl bg-white p-4"><p className="text-sm font-semibold">{getMenuItem(booking, exception.itemId)?.name}</p><p className="mt-1 text-sm text-[#82877e]">{exception.reason}. Choose a suggested alternative or remove it.</p><div className="mt-3 flex flex-wrap gap-2">{exception.alternatives.map((alternative) => <button key={alternative} onClick={() => resolveException(exception.itemId, alternative)} className="min-h-11 rounded-xl bg-[#536f58] px-4 py-2 text-sm font-bold text-white">{getMenuItem(booking, alternative)?.name}</button>)}<button onClick={() => resolveException(exception.itemId)} className="min-h-11 rounded-xl border border-[#d9b8a8] px-4 py-2 text-sm font-bold text-[#a65f3e]">Remove item</button></div></div>)}</section>
}

function OrderSummary({ items, subtotal }: { items: Array<{ item: MenuItem; quantity: number }>; subtotal: number }) {
  return <section className="rounded-3xl border border-[#e9e7df] bg-white p-5 shadow-sm sm:p-6"><StepLabel id="preparation" number="05" title="Arrival-Synchronised Preparation" description="Preparation progress is coordinated around your expected arrival." /><div className="flex items-center justify-between"><div><h2 className="font-semibold">Confirmed meal</h2><p className="mt-1 text-xs text-[#92968e]">Shared with The Coastal Table</p></div><StatusPill label="Confirmed" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(({ item, quantity }) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#f7f6f2] px-3 py-3 text-sm"><span>{item.name} <span className="text-[#92968e]">× {quantity}</span></span><span>₹{item.price * quantity}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-[#eeede7] pt-4 text-sm font-semibold"><span>Subtotal</span><span>₹{subtotal}</span></div><p className="mt-2 text-xs text-[#92968e]">Batch schedules are estimates for this fictional demonstration.</p></section>
}

function JourneyCard({ booking }: { booking: DemoBooking }) {
  return <div className="rounded-3xl border border-[#e9e7df] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Your dining journey</p><p className="mt-1 text-xs text-[#92968e]">Confirmed reservation to seated meal</p></div><div className="rounded-xl bg-[#f3f3ed] p-2.5 text-[#536c58]"><Clock3 size={19} /></div></div><div className="mt-6 space-y-4"><JourneyStep label="Reservation confirmed" complete /><JourneyStep label={booking.preOrderStatus === 'draft' ? 'Plan your meal' : 'Pre-order confirmed'} complete={booking.preOrderStatus !== 'draft'} /><JourneyStep label="Start your journey" complete={booking.route.started} /><JourneyStep label="Arrive and get seated" complete={booking.route.seated} /></div></div>
}

function JourneyStep({ label, complete }: { label: string; complete: boolean }) { return <div className="flex items-center gap-3 text-sm font-semibold text-[#39453c]"><span className={`flex h-7 w-7 items-center justify-center rounded-lg ${complete ? 'bg-[#e7eee6] text-[#527252]' : 'bg-[#f3f3ed] text-[#94998f]'}`}>{complete ? <Check size={15} /> : <span className="h-2 w-2 rounded-full bg-[#a2a69e]" />}</span>{label}</div> }
function QuantityControl({ quantity, onChange }: { quantity: number; onChange: (change: number) => void }) { return <div className="flex items-center gap-2 rounded-full border border-[#E9E9EB] bg-white p-1 shadow-sm"><button aria-label="Remove dish" onClick={() => onChange(-1)} disabled={quantity === 0} className="min-h-10 min-w-10 rounded-full text-[#686B78] disabled:opacity-30"><Minus size={15} className="mx-auto" /></button><span className="min-w-5 text-center text-sm font-extrabold text-[#282C3F]">{quantity}</span><button aria-label="Add dish" onClick={() => onChange(1)} className="min-h-10 min-w-10 rounded-full bg-[#FC8019] text-white shadow-[0_3px_10px_rgba(252,128,25,0.20)]"><Plus size={15} className="mx-auto" /></button></div> }
function ViewToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button onClick={onClick} className={`min-h-10 rounded-lg px-2 text-xs font-bold transition sm:min-h-11 sm:px-3 sm:text-sm ${active ? 'bg-white text-[#FC8019] shadow-sm' : 'text-[#686B78] hover:text-[#282C3F]'}`}>{children}</button> }
function ActionButton({ icon, onClick, children }: { icon?: ReactNode; onClick: () => void; children: ReactNode }) { return <button onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9DADE] bg-white px-3 py-2 text-xs font-bold text-[#282C3F] shadow-sm hover:border-[#FC8019] hover:text-[#C65F12]">{icon}{children}</button> }
function StatusPill({ label }: { label: string }) { return <span className="inline-flex w-fit rounded-full bg-[#EDF8EA] px-3 py-1.5 text-xs font-bold text-[#3D802B]">{label}</span> }
function DietIndicator({ vegetarian }: { vegetarian: boolean }) { return <span aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'} title={vegetarian ? 'Vegetarian' : 'Non-vegetarian'} className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border ${vegetarian ? 'border-[#60B246]' : 'border-[#E43B4F]'}`}><span className={`h-2 w-2 rounded-full ${vegetarian ? 'bg-[#60B246]' : 'bg-[#E43B4F]'}`} /></span> }
function StatDark({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.07] p-4"><p className="text-xs font-semibold text-[#D9DAE2]">{label}</p><p className="mt-2 text-lg font-extrabold">{value}</p><p className="mt-1 text-xs text-[#AEB1BC]">{note}</p></div> }
function InfoCard({ icon, label, value, description }: { icon: ReactNode; label: string; value: string; description: string }) { return <div className="rounded-2xl border border-[#ECECEC] bg-white p-5 shadow-[0_4px_20px_rgba(40,44,63,0.06)]"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#686B78]">{label}</p><div className="rounded-xl bg-[#FFF0E4] p-2 text-[#FC8019]">{icon}</div></div><p className="mt-4 text-xl font-extrabold text-[#282C3F]">{value}</p><p className="mt-1 text-xs text-[#686B78]">{description}</p></div> }
function MetricCard({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note: string }) { return <InfoCard icon={icon} label={label} value={value} description={note} /> }
function DetailRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-[#92968e]">{label}</span><span className="text-right font-semibold text-[#39453c]">{value}</span></div> }
function CourseCard({ title, state, action }: { title: string; state: string; action?: ReactNode }) { return <div className="rounded-2xl bg-[#f7f6f2] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{title}</p><span className="text-xs text-[#687168]">{state}</span></div>{action && <div className="mt-3">{action}</div>}</div> }

function getSelectedItems(booking: DemoBooking) { return booking.selectedDishes.map((dish) => ({ item: getMenuItem(booking, dish.itemId), quantity: dish.quantity })).filter((entry): entry is { item: MenuItem; quantity: number } => Boolean(entry.item)) }
function getMenuItem(booking: DemoBooking, id: string) { return booking.menu.find((item) => item.id === id) }
function isVegetarian(item: MenuItem) { return ['citrus-burrata', 'paneer-tikka', 'sweet-corn-soup', 'butter-naan', 'mango-pavlova', 'gulab-jamun'].includes(item.id) }
function calculateSubtotal(booking: DemoBooking) { return getSelectedItems(booking).reduce((sum, { item, quantity }) => sum + item.price * quantity, 0) }
function createKitchenItems(booking: DemoBooking): KitchenItem[] { return booking.selectedDishes.map((dish) => ({ itemId: dish.itemId, quantity: dish.quantity, status: 'queued', plannedRelease: null, plannedReleaseMinute: null, preparationStartedAt: null, preparationCompletedAt: null, manualHold: false, manualOverride: false })) }
function canOrder(booking: DemoBooking) { return booking.selectedDishes.every((dish) => { const item = getMenuItem(booking, dish.itemId); return item && derivedAvailability(item) !== 'sold_out' && derivedAvailability(item) !== 'paused' && dish.quantity <= item.availablePortions }) }
function courseStatus(booking: DemoBooking, category: MenuCategory) {
  const items = booking.kitchenItems.filter((item) => getMenuItem(booking, item.itemId)?.category === category)
  if (!items.length) return 'Queued'
  if (items.every((item) => item.status === 'served')) return 'Served'
  if (items.some((item) => item.status === 'ready')) return 'Ready'
  if (items.some((item) => item.status === 'preparing')) return 'Preparing'
  return 'Queued'
}
function preOrderLabel(status: PreOrderStatus) { return { draft: 'Not Submitted', confirmed: 'Confirmed', needs_attention: 'Needs Attention' }[status] }
function preOrderDescription(status: PreOrderStatus) { return { draft: 'Choose dishes in advance', confirmed: 'Automatically validated', needs_attention: 'One item needs your attention' }[status] }
function statusLabel(status: KitchenItemStatus) { return { queued: 'Queued', preparing: 'Preparing', ready: 'Ready', served: 'Served', needs_attention: 'Needs attention', removed: 'Removed' }[status] }
function availabilityLabel(status: AvailabilityStatus) { return { available: 'Available', limited: 'Limited', sold_out: 'Sold out', paused: 'Paused' }[status] }
function derivedAvailability(item: MenuItem): AvailabilityStatus { if (item.manuallyPaused) return 'paused'; if (item.availablePortions === 0) return 'sold_out'; return item.availablePortions <= item.lowStockThreshold ? 'limited' : 'available' }
function shiftTime(value: string, deltaMinutes: number) { const match = value.match(/(\d+):(\d+) (AM|PM)/); if (!match) return value; let minutes = (Number(match[1]) % 12) * 60 + Number(match[2]) + (match[3] === 'PM' ? 720 : 0) + deltaMinutes; minutes = (minutes + 1440) % 1440; const hour = Math.floor(minutes / 60); return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}` }
function cloneInitialBooking(): DemoBooking { return JSON.parse(JSON.stringify(initialBooking)) as DemoBooking }
function loadBooking(): DemoBooking { const stored = localStorage.getItem(STORAGE_KEY); if (!stored) return cloneInitialBooking(); try { const parsed: unknown = JSON.parse(stored); if (isDemoBooking(parsed)) return normalizeBooking(parsed) } catch (error) { console.error('Unable to load the saved Dineout Ready demo booking.', error) } return cloneInitialBooking() }
function normalizeBooking(booking: DemoBooking): DemoBooking {
  return {
    ...booking,
    route: { ...booking.route, remainingEtaMinutes: booking.route.remainingEtaMinutes ?? booking.route.travelMinutes },
    kitchenItems: booking.kitchenItems.map((item) => ({
      ...item,
      plannedReleaseMinute: item.plannedReleaseMinute ?? null,
      preparationStartedAt: item.preparationStartedAt ?? null,
      preparationCompletedAt: item.preparationCompletedAt ?? null,
      manualOverride: item.manualOverride ?? false,
    })),
    courseProgression: { ...booking.courseProgression, mainRequested: false, dessertRequested: false },
  }
}
function isDemoBooking(value: unknown): value is DemoBooking { if (!value || typeof value !== 'object') return false; const booking = value as Partial<DemoBooking>; const firstMenuItem = booking.menu?.[0]; return Boolean(booking.reservation?.status === 'confirmed' && firstMenuItem?.servingSize && typeof firstMenuItem.lowStockThreshold === 'number' && typeof firstMenuItem.manuallyPaused === 'boolean' && Array.isArray(booking.menu) && Array.isArray(booking.selectedDishes) && booking.route && booking.kitchenItems && booking.courseProgression) }

export default App
