export const GENSET_TAGGING_OPTIONS = [
  'Memiliki Tagging',
  'Manual Tagging',
  'Tidak Memiliki Tagging',
] as const

export const GENSET_KETERANGAN_OPTIONS = [
  'Adjust and Repair',
  'Repair',
  'Urgent',
  'Clear',
] as const

export const GENSET_KONDISI_OPTIONS = ['OK', 'NOK'] as const

export type GensetChecklistItem = {
  id: string
  label: string
}

export type GensetTlStep = {
  tlId: string
  category: string
  items: GensetChecklistItem[]
}

export const GENSET_TL_STEPS: GensetTlStep[] = [
  {
    tlId: 'TL1',
    category: 'TL 1',
    items: [
      { id: 'TL1_OIL_LEVEL', label: 'Check oil level' },
      { id: 'TL1_OIL_VISCOSITY', label: 'Check kekentalan oli' },
    ],
  },
  {
    tlId: 'TL2',
    category: 'TL 2',
    items: [
      { id: 'TL2_FUEL_LEVEL', label: 'Fuel system (cek level tangki bahan bakar)' },
      { id: 'TL2_FUEL_LEAKS', label: 'Fuel system (check leaks)' },
    ],
  },
  {
    tlId: 'TL3',
    category: 'TL 3',
    items: [{ id: 'TL3_AIR_FILTER', label: 'Filter udara (bersihkan filter udara)' }],
  },
  {
    tlId: 'TL4',
    category: 'TL 4',
    items: [
      { id: 'TL4_BATTERY_LEVEL', label: 'Batteries (check level air accu/indikator battery)' },
      { id: 'TL4_BATTERY_TERMINAL', label: 'Batteries (check terminal battery)' },
      { id: 'TL4_BATTERY_VOLTAGE', label: 'Batteries (check voltage)' },
    ],
  },
  {
    tlId: 'TL5',
    category: 'TL 5',
    items: [{ id: 'TL5_GENERATOR', label: 'Generator (check and clean)' }],
  },
  {
    tlId: 'TL6',
    category: 'TL 6',
    items: [
      {
        id: 'TL6_CONTROL_PANEL',
        label: 'Control panel (check meter reading & wiring)',
      },
    ],
  },
]

export const GENSET_FORM_STEPS = [
  { category: '1. Spesifikasi Unit Genset', isSpecsStep: true as const },
  ...GENSET_TL_STEPS.map((tl) => ({
    category: tl.category,
    isSpecsStep: false as const,
    tlStep: tl,
  })),
]

export function allGensetChecklistItems(): GensetChecklistItem[] {
  return GENSET_TL_STEPS.flatMap((tl) => tl.items)
}

export function scoreFromGensetKondisi(status: string): number {
  return status === 'OK' ? 1 : 0
}

export function computeGensetNilaiAkhir(
  answers: Record<string, { nilai?: number }>
): number {
  const items = allGensetChecklistItems()
  const total = items.length
  if (total <= 0) return 0
  const totalSkor = items.reduce((acc, item) => acc + (answers[item.id]?.nilai ?? 0), 0)
  return Math.round((totalSkor / total) * 100)
}

export function tlPhotoKey(tlId: string): string {
  return `${tlId}_FOTO`
}

export function tlKeteranganKey(tlId: string): string {
  return `${tlId}_KETERANGAN`
}
