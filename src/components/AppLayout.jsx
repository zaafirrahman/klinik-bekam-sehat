import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSidebar } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { label: 'Beranda',            path: '/',                icon: '🏠' },
  { label: 'Pasien',             path: '/patients',        icon: '👤' },
  { label: 'Kunjungan',          path: '/visits',          icon: '🏥' },
  { label: 'Cek Lab',            path: '/lab',             icon: '🩸' },
  { label: 'Paket Akupuntur',    path: '/akupuntur',       icon: '📍' },
  { label: 'Konsultasi',         path: '/consultations',   icon: '📋' },
  { label: 'Keuangan Harian',    path: '/finance',         icon: '💰' },
  { label: 'Keuangan Bulanan',   path: '/finance/monthly', icon: '📅' },
  { label: 'Laporan',            path: '/reports',         icon: '📊' },
  { label: 'Pengaturan',         path: '/settings',        icon: '⚙️' },
]

function SidebarNav({ profile, handleLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setOpenMobile } = useSidebar()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div>
          <p className="font-semibold text-sm">Klinik Bekam Sehat</p>
          <p className="text-xs text-muted-foreground">Medan</p>
        </div>
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path)
                      setOpenMobile(false)
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'admin'}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
    }
    fetchProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <SidebarNav profile={profile} handleLogout={handleLogout} />
        <main className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger />
          </div>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}