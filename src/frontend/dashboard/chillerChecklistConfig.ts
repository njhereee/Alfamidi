export const EQUIPMENT_TYPES = [
  { value: 'open_chiller', label: 'Open Chiller' },
  { value: 'glass_chiller_1p', label: 'Glass Chiller 1 pintu' },
  { value: 'glass_chiller_2p', label: 'Glass Chiller 2 pintu' },
  { value: 'glass_chiller_3p', label: 'Glass Chiller 3 pintu' },
  { value: 'freezer_island', label: 'Freezer Island' },
  { value: 'standing_freeze', label: 'Standing Freezer' },
  { value: 'cooler_juice_coffee', label: 'Cooler Juice dan Coffee' },
] as const

export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]['value']

export type ChecklistScoreKind = 'oke_nok' | 'oke_nok_tidak_ada'

export type ChecklistItemDef = {
  id: string
  label: string
  scoreKind: ChecklistScoreKind
}

/** Item dengan opsi tambahan TIDAK ADA (selain OKE / NOK) */
export const OKE_NOK_TIDAK_ADA_ITEM_IDS = new Set([
  'F_PINTU',
  'F_GASKET',
  'F_RODA',
  'FL_HONEY',
])

const CHECKLIST_ITEM_DEFS_RAW: Record<string, { id: string; label: string }> = {
  F_PINTU: { id: 'F_PINTU', label: 'Kondisi pintu' },
  F_GASKET: { id: 'F_GASKET', label: 'Kondisi gasket' },
  F_BODY: { id: 'F_BODY', label: 'Kondisi body' },
  F_RODA: { id: 'F_RODA', label: 'Kondisi roda' },
  F_LAMPU: { id: 'F_LAMPU', label: 'Kondisi lampu' },
  F_PLASTIC: { id: 'F_PLASTIC', label: 'Kondisi Plastic curtain' },
  T_KONDENSOR: { id: 'T_KONDENSOR', label: 'Kondisi kondensor' },
  T_EVAPORATOR: { id: 'T_EVAPORATOR', label: 'Kondisi evaporator' },
  T_FAN_KOND: { id: 'T_FAN_KOND', label: 'Kondisi fan kondensor' },
  T_FAN_EVAP: { id: 'T_FAN_EVAP', label: 'Kondisi fan evaporator' },
  T_KOMPRESSOR: { id: 'T_KOMPRESSOR', label: 'Kondisi kompressor' },
  T_THERMO: {
    id: 'T_THERMO',
    label: 'Kondisi thermostat / DTC (Digital Temperature Controller)',
  },
  FL_KONDENSOR: { id: 'FL_KONDENSOR', label: 'Kondisi filter kondensor' },
  FL_HONEY: { id: 'FL_HONEY', label: 'Kondisi filter honey comb' },
}

export const CHECKLIST_ITEM_DEFS: Record<string, ChecklistItemDef> = Object.fromEntries(
  Object.keys(CHECKLIST_ITEM_DEFS_RAW).map((key) => {
    const raw = CHECKLIST_ITEM_DEFS_RAW[key]
    return [
      key,
      {
        id: raw.id,
        label: raw.label,
        scoreKind: OKE_NOK_TIDAK_ADA_ITEM_IDS.has(raw.id)
          ? 'oke_nok_tidak_ada'
          : 'oke_nok',
      } satisfies ChecklistItemDef,
    ]
  })
)

export const OKE_NOK_OPTIONS = ['OKE', 'NOK'] as const
export const OKE_NOK_TIDAK_ADA_OPTIONS = ['OKE', 'NOK', 'TIDAK ADA'] as const

export function checklistOptionsForItem(item: ChecklistItemDef): readonly string[] {
  return item.scoreKind === 'oke_nok_tidak_ada'
    ? OKE_NOK_TIDAK_ADA_OPTIONS
    : OKE_NOK_OPTIONS
}

/** Hanya OKE = 1 poin */
export function scoreFromChecklistAnswer(status: string): number {
  return status === 'OKE' ? 1 : 0
}

/** Jumlah item checklist per jenis unit (sesuai spreadsheet) */
export const CHECKLIST_COUNT_BY_EQUIPMENT: Record<EquipmentType, number> = {
  open_chiller: 12,
  glass_chiller_1p: 11,
  glass_chiller_2p: 11,
  glass_chiller_3p: 11,
  freezer_island: 9,
  standing_freeze: 11,
  cooler_juice_coffee: 11,
}

export function computeChillerNilaiAkhir(
  equipmentType: EquipmentType,
  items: ChecklistItemDef[],
  answers: Record<string, { nilai?: number }>
): number {
  const totalItems = CHECKLIST_COUNT_BY_EQUIPMENT[equipmentType] ?? items.length
  const totalSkor = items.reduce((acc, item) => acc + (answers[item.id]?.nilai ?? 0), 0)
  if (totalItems <= 0) return 0
  return Math.round((totalSkor / totalItems) * 100)
}

const TECHNICAL_ITEM_IDS: string[] = [
  'T_KONDENSOR',
  'T_EVAPORATOR',
  'T_FAN_KOND',
  'T_FAN_EVAP',
  'T_KOMPRESSOR',
  'T_THERMO',
]

/** Matriks kondisi fisik per jenis unit (sesuai spreadsheet) */
const PHYSICAL_BY_EQUIPMENT: Record<EquipmentType, string[]> = {
  open_chiller: ['F_BODY', 'F_RODA', 'F_LAMPU', 'F_PLASTIC'],
  glass_chiller_1p: ['F_PINTU', 'F_GASKET', 'F_BODY', 'F_RODA', 'F_LAMPU'],
  glass_chiller_2p: ['F_PINTU', 'F_GASKET', 'F_BODY', 'F_RODA', 'F_LAMPU'],
  glass_chiller_3p: ['F_PINTU', 'F_GASKET', 'F_BODY', 'F_RODA', 'F_LAMPU'],
  freezer_island: ['F_PINTU', 'F_BODY', 'F_RODA'],
  standing_freeze: ['F_PINTU', 'F_GASKET', 'F_BODY', 'F_RODA', 'F_LAMPU'],
  cooler_juice_coffee: ['F_PINTU', 'F_GASKET', 'F_BODY', 'F_RODA', 'F_LAMPU'],
}

const FILTER_BY_EQUIPMENT: Record<EquipmentType, string[]> = {
  open_chiller: ['FL_KONDENSOR', 'FL_HONEY'],
  glass_chiller_1p: [],
  glass_chiller_2p: [],
  glass_chiller_3p: [],
  freezer_island: [],
  standing_freeze: [],
  cooler_juice_coffee: [],
}

export type ChillerFormStep =
  | { category: string; isSpecsStep: true }
  | { category: string; isSpecsStep?: false; items: ChecklistItemDef[] }

function itemsFromIds(ids: string[]): ChecklistItemDef[] {
  return ids.map((id) => CHECKLIST_ITEM_DEFS[id])
}

export function isEquipmentType(value: string): value is EquipmentType {
  return EQUIPMENT_TYPES.some((t) => t.value === value)
}

export function equipmentTypeLabel(value: string): string {
  return EQUIPMENT_TYPES.find((t) => t.value === value)?.label ?? value
}

export const CHILLER_EQUIPMENT_CHECKLIST_TOTAL = EQUIPMENT_TYPES.length

/** Cocokkan nilai jenis_mesin di DB (label atau value) ke tipe equipment */
export function normalizeEquipmentTypeFromSubmission(
  jenisMesin: string | null | undefined
): EquipmentType | null {
  if (!jenisMesin?.trim()) return null
  const normalized = jenisMesin.trim().toLowerCase()
  for (const t of EQUIPMENT_TYPES) {
    if (normalized === t.value.toLowerCase()) return t.value
    if (normalized === t.label.toLowerCase()) return t.value
  }
  if (normalized.includes('open chiller')) return 'open_chiller'
  if (normalized.includes('glass chiller') && normalized.includes('1')) return 'glass_chiller_1p'
  if (normalized.includes('glass chiller') && normalized.includes('2')) return 'glass_chiller_2p'
  if (normalized.includes('glass chiller') && normalized.includes('3')) return 'glass_chiller_3p'
  if (normalized.includes('freezer island')) return 'freezer_island'
  if (normalized.includes('standing freez')) return 'standing_freeze'
  if (normalized.includes('cooler juice')) return 'cooler_juice_coffee'
  return null
}

/** Langkah form: spesifikasi → kondisi fisik (dinamis) → teknis → filter (hanya open chiller) */
export function buildChillerSteps(equipmentType: string): ChillerFormStep[] {
  const steps: ChillerFormStep[] = [
    { category: '1. Spesifikasi Unit', isSpecsStep: true },
  ]

  if (!isEquipmentType(equipmentType)) {
    return steps
  }

  const physicalIds = PHYSICAL_BY_EQUIPMENT[equipmentType]
  if (physicalIds.length > 0) {
    steps.push({
      category: '2. Kondisi Fisik',
      items: itemsFromIds(physicalIds),
    })
  }

  steps.push({
    category: physicalIds.length > 0 ? '3. Kondisi Teknis' : '2. Kondisi Teknis',
    items: itemsFromIds(TECHNICAL_ITEM_IDS),
  })

  const filterIds = FILTER_BY_EQUIPMENT[equipmentType]
  if (filterIds.length > 0) {
    steps.push({
      category: '4. Checklist Kondisi Filter',
      items: itemsFromIds(filterIds),
    })
  }

  return steps
}

/** Semua item checklist yang wajib untuk jenis unit terpilih (untuk validasi & skor) */
export function allChecklistItemsForType(equipmentType: string): ChecklistItemDef[] {
  const steps = buildChillerSteps(equipmentType)
  return steps.flatMap((s) => ('items' in s && s.items ? s.items : []))
}
