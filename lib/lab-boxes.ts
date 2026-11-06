import { productById } from '@/lib/lab-data'

export type BoxStatus = 'entamee' | 'stockee'

export type LabBox = {
  id: string
  roomId: string
  productId: string
  lot: string
  status: BoxStatus
  remaining: number
  consumed?: number
  losses?: number
  /** A replacement box was opened while this one still had stock: its remainder is presumed lost. */
  provisional?: { daysAgo: number }
}

export const HIGH_LOSS_THRESHOLD = 5

export const boxLossRate = (box: LabBox) => (box.consumed ? ((box.losses ?? 0) / box.consumed) * 100 : 0)
export const isHighLoss = (box: LabBox) => box.status === 'entamee' && boxLossRate(box) > HIGH_LOSS_THRESHOLD
export const isProvisional = (box: LabBox) => box.status === 'entamee' && Boolean(box.provisional)
export const hasWarning = (box: LabBox) => isProvisional(box) || isHighLoss(box)

export const LAB_BOXES: LabBox[] = [
  { id: 'b1', roomId: 'serologie', productId: 'hbs', lot: 'HB2405A', status: 'entamee', remaining: 14, consumed: 82, losses: 0, provisional: { daysAgo: 2 } },
  { id: 'b1n', roomId: 'serologie', productId: 'hbs', lot: 'HB2407C', status: 'entamee', remaining: 90, consumed: 6, losses: 0 },
  { id: 'b2', roomId: 'serologie', productId: 'hiv', lot: 'HV1189', status: 'entamee', remaining: 38, consumed: 62, losses: 1 },
  { id: 'b3', roomId: 'serologie', productId: 'crp', lot: 'CP5501', status: 'entamee', remaining: 12, consumed: 38, losses: 0 },
  { id: 'b4', roomId: 'serologie', productId: 'hbs', lot: 'HB2407C', status: 'stockee', remaining: 96 },
  { id: 'b5', roomId: 'serologie', productId: 'hiv', lot: 'HV1189', status: 'stockee', remaining: 100 },

  { id: 'b6', roomId: 'biochimie', productId: 'glu', lot: 'GL1004', status: 'entamee', remaining: 320, consumed: 180, losses: 2 },
  { id: 'b7', roomId: 'biochimie', productId: 'crea', lot: 'CR3321', status: 'entamee', remaining: 48, consumed: 202, losses: 14 },
  { id: 'b8', roomId: 'biochimie', productId: 'glu', lot: 'GL1004', status: 'stockee', remaining: 500 },
  { id: 'b9', roomId: 'biochimie', productId: 'crea', lot: 'CR3321', status: 'stockee', remaining: 250 },

  { id: 'b10', roomId: 'hematologie', productId: 'nfs', lot: 'DL7781', status: 'entamee', remaining: 180, consumed: 820, losses: 6, provisional: { daysAgo: 1 } },
  { id: 'b11', roomId: 'hematologie', productId: 'nfs', lot: 'DL7790', status: 'entamee', remaining: 940, consumed: 60, losses: 0 },
  { id: 'b12', roomId: 'hematologie', productId: 'nfs', lot: 'DL7790', status: 'stockee', remaining: 1000 },

  { id: 'b13', roomId: 'microbiologie', productId: 'gram', lot: 'GR4410', status: 'entamee', remaining: 155, consumed: 45, losses: 0 },
  { id: 'b14', roomId: 'microbiologie', productId: 'gram', lot: 'GR4410', status: 'stockee', remaining: 200 },
  { id: 'b15', roomId: 'microbiologie', productId: 'gram', lot: 'GR4410', status: 'stockee', remaining: 200 },

  { id: 'b16', roomId: 'immunologie', productId: 'crp', lot: 'CP5501', status: 'entamee', remaining: 9, consumed: 41, losses: 0, provisional: { daysAgo: 3 } },
  { id: 'b16n', roomId: 'immunologie', productId: 'crp', lot: 'CP5501', status: 'entamee', remaining: 47, consumed: 3, losses: 0 },
  { id: 'b17', roomId: 'immunologie', productId: 'hiv', lot: 'HV1123', status: 'entamee', remaining: 72, consumed: 28, losses: 2 },
  { id: 'b18', roomId: 'immunologie', productId: 'crp', lot: 'CP5501', status: 'stockee', remaining: 50 },

  { id: 'b19', roomId: 'hormonologie', productId: 'tsh', lot: 'TS0230', status: 'entamee', remaining: 48, consumed: 52, losses: 0 },
  { id: 'b20', roomId: 'hormonologie', productId: 'tsh', lot: 'TS0217', status: 'entamee', remaining: 7, consumed: 93, losses: 3 },
  { id: 'b21', roomId: 'hormonologie', productId: 'tsh', lot: 'TS0230', status: 'stockee', remaining: 100 },
]

const warningRank = (box: LabBox) => (isProvisional(box) ? 0 : isHighLoss(box) ? 1 : 2)
const fillRatio = (box: LabBox) => box.remaining / (productById(box.productId)?.capacity ?? 1)

/** Boxes carrying a warning are pinned on top, then the emptiest boxes come first. */
export function sortOpenBoxes(boxes: LabBox[]) {
  return [...boxes].sort((a, b) => warningRank(a) - warningRank(b) || fillRatio(a) - fillRatio(b))
}
