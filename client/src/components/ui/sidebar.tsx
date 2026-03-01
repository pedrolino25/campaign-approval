'use client'

import { Slot } from '@radix-ui/react-slot'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_COLLAPSED = '3rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'

type SidebarState = 'expanded' | 'collapsed'

interface SidebarContextValue {
  state: SidebarState
  open: boolean
  openMobile: boolean
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SidebarProvider({
  children,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
}: SidebarProviderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value)
      else setUncontrolledOpen(value)
    },
    [onOpenChange],
  )
  const state: SidebarState = open ? 'expanded' : 'collapsed'
  const [isMobile, setIsMobile] = React.useState(true)

  React.useEffect(() => {
    /* Phones only: use sheet. Tablets (640px+) use fixed sidebar like desktop. */
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v)
    else setOpen(!open)
  }, [isMobile, open, setOpen])

  const value: SidebarContextValue = {
    state,
    open,
    openMobile,
    setOpen,
    setOpenMobile,
    toggleSidebar,
    isMobile,
  }

  const marginLeft = isMobile
    ? '0'
    : state === 'collapsed'
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH
  return (
    <SidebarContext.Provider value={value}>
      <div
        className="flex min-h-svh w-full min-w-0 overflow-x-hidden"
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-collapsed': SIDEBAR_WIDTH_COLLAPSED,
            '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
            '--sidebar-margin-left': marginLeft,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

interface SidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ side = 'left', collapsible = 'icon', className, children, ...props }, ref) => {
    const { state, openMobile, setOpenMobile, isMobile } = useSidebar()
    const isCollapsed = state === 'collapsed'

    if (isMobile) {
      return (
        <Sheet
          open={openMobile}
          onOpenChange={setOpenMobile}
        >
          <SheetContent
            side="left"
            className={cn('w-full max-w-full p-0', className)}
            data-sidebar="sidebar"
            data-mobile="true"
          >
            <div className="flex h-full w-full flex-col bg-sidebar">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        data-sidebar="sidebar"
        data-state={state}
        data-collapsible={collapsible}
        data-side={side}
        className={cn(
          'group fixed inset-y-0 z-10 hidden h-svh flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-linear sm:flex',
          side === 'left' ? 'left-0' : 'right-0',
          collapsible === 'icon' &&
            (isCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'),
          collapsible === 'offcanvas' && !isCollapsed && 'w-[var(--sidebar-width)]',
          collapsible === 'offcanvas' &&
            isCollapsed &&
            (side === 'left' ? '-translate-x-full' : 'translate-x-full'),
          className,
        )}
        style={
          collapsible === 'icon'
            ? { width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    )
  },
)
Sidebar.displayName = 'Sidebar'

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn(
        'flex shrink-0 items-center border-b border-sidebar-border px-2 py-2',
        className,
      )}
      {...props}
    />
  ),
)
SidebarHeader.displayName = 'SidebarHeader'

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn('flex flex-1 flex-col gap-2 overflow-auto py-2', className)}
      {...props}
    />
  ),
)
SidebarContent.displayName = 'SidebarContent'

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn('mt-auto shrink-0 border-t border-sidebar-border px-2 py-2', className)}
      {...props}
    />
  ),
)
SidebarFooter.displayName = 'SidebarFooter'

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  ),
)
SidebarGroup.displayName = 'SidebarGroup'

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        'group-data-[state=collapsed]:hidden px-2 py-1.5 text-xs font-medium text-sidebar-foreground/70',
        className,
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  ),
)
SidebarGroupContent.displayName = 'SidebarGroupContent'

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  ),
)
SidebarMenu.displayName = 'SidebarMenu'

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn('list-none', className)}
      {...props}
    />
  ),
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, asChild, isActive, tooltip, children, onClick, ...props }, ref) => {
    const { state, isMobile, setOpenMobile } = useSidebar()
    const isCollapsed = state === 'collapsed'
    const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      if (isMobile) setOpenMobile(false)
      onClick?.(e as React.MouseEvent<HTMLButtonElement>)
    }
    const comp = asChild ? Slot : 'button'
    return React.createElement(comp, {
      ref,
      'data-sidebar': 'menu-button',
      'data-active': isActive,
      title: isCollapsed && tooltip ? tooltip : undefined,
      onClick: handleClick,
      className: cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium outline-none transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
        'group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-2',
        '[&>span]:truncate [&>svg]:size-4 [&>svg]:shrink-0 group-data-[state=collapsed]:[&>span]:hidden',
        className,
      ),
      ...props,
      children,
    } as never)
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

interface SidebarTriggerProps extends React.ComponentProps<typeof Button> {
  /** When true, hide the trigger on mobile (sheet has its own close button) */
  hideOnMobile?: boolean
}

function SidebarTrigger({ className, hideOnMobile, ...props }: SidebarTriggerProps) {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  if (hideOnMobile && isMobile) return null
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 shrink-0', className)}
      onClick={toggleSidebar}
      title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      {...props}
    >
      {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      <span className="sr-only">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
    </Button>
  )
}

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-1 flex-col min-h-svh min-w-0 overflow-x-hidden transition-[margin-left] duration-200 ease-linear max-md:!ml-0',
          className,
        )}
        style={
          {
            ...style,
            marginLeft: 'var(--sidebar-margin-left, 0)',
          } as React.CSSProperties
        }
        {...props}
      />
    )
  },
)
SidebarInset.displayName = 'SidebarInset'

export {
  Sidebar,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_MOBILE,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
