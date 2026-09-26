import { ScanLine } from 'lucide-react'
import MIconBtn from '../../../components/MIconBtn'
import { useReceiptScan } from '../../../../components/Budget/useReceiptScan'
import { ReceiptScanModal } from '../../../../components/Budget/ReceiptScanModal'
import { useTranslation } from '../../../../i18n'

/** The Costs header's "Scan receipt" button on a phone; the dialog and the scan are the shared ones. */
export default function MReceiptScanButton({ tripId, canEdit }: { tripId: number; canEdit: boolean }) {
  const { t } = useTranslation()
  const scan = useReceiptScan(tripId, canEdit)
  if (!scan.offered) return null
  return (
    <>
      <MIconBtn ariaLabel={t('costs.scan.button')} onClick={scan.open} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
        <ScanLine size={15} strokeWidth={2} />
      </MIconBtn>
      <ReceiptScanModal scan={scan} />
    </>
  )
}
