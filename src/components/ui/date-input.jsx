import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'

// --- Helpers: convert between ISO (yyyy-mm-dd, dipakai Supabase)
// dan format tampilan dd/mm/yyyy (yang diketik manual sama user) ---

function isoToDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function displayToIso(display) {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  // Validasi tanggal beneran valid (misal bukan 31/02/2026)
  const date = new Date(`${y}-${m}-${d}`)
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() + 1 !== Number(m) ||
    date.getDate() !== Number(d)
  ) return null
  return `${y}-${m}-${d}`
}

// Auto-sisipin "/" saat user ngetik angka, misal "27082026" -> "27/08/2026"
function autoMask(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  let out = digits
  if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`
  return out
}

/**
 * DateInputManual
 * Drop-in pengganti <Input type="date">.
 * Props sama: value (string ISO "yyyy-mm-dd") dan onChange(isoString).
 *
 * Bedanya: user bisa KETIK MANUAL format dd/mm/yyyy (auto kasih "/"),
 * atau klik ikon kalender buat pilih pakai calendar picker biasa.
 * Cocok dipakai di tablet yang native <input type="date"> nya
 * cuma bisa calendar-only.
 */
export function DateInputManual({ value, onChange, required, className = '' }) {
  const [display, setDisplay] = useState(isoToDisplay(value))
  const [open, setOpen] = useState(false)

  // Sinkron kalau value dari luar berubah (misal reset form)
  useEffect(() => { setDisplay(isoToDisplay(value)) }, [value])

  const handleTextChange = (e) => {
    const masked = autoMask(e.target.value)
    setDisplay(masked)
    const iso = displayToIso(masked)
    if (iso) onChange(iso) // baru commit ke parent kalau tanggalnya sudah lengkap & valid
  }

  const handleCalendarPick = (e) => {
    const iso = e.target.value // native date input tetap kasih format yyyy-mm-dd
    if (iso) {
      onChange(iso)
      setDisplay(isoToDisplay(iso))
    }
    setOpen(false)
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        value={display}
        onChange={handleTextChange}
        required={required}
        maxLength={10}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" className="shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          {/* Native date input dipakai cuma sebagai calendar picker,
              disembunyikan sebagai text field-nya */}
          <input
            type="date"
            autoFocus
            defaultValue={value || ''}
            onChange={handleCalendarPick}
            className="border rounded-md px-2 py-1 text-sm"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
