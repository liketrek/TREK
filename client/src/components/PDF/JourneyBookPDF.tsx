import type { JourneyDetail } from '../../store/journeyStore'
import { createJourneyExportModel } from '../../features/journey-export/model/journeyExportModel'
import { showJourneyExportPreview } from '../../features/journey-export/preview/showJourneyExportPreview'
import { buildJourneyBookDocument } from '../../features/journey-export/render/buildJourneyBookDocument'

/**
 * Compatibility entry point for the existing Journey download action.
 * New export modes should call the feature modules directly rather than adding
 * rendering or preview code here.
 */
export async function downloadJourneyBookPDF(journey: JourneyDetail, t: (key: string) => string) {
  const exportModel = createJourneyExportModel(journey)
  const pdfDoc = buildJourneyBookDocument(exportModel)
  showJourneyExportPreview({
    title: journey.title,
    document: pdfDoc,
    saveLabel: t('journey.pdf.saveAsPdf'),
    closeLabel: t('common.close'),
    pagesLabel: t('journey.pdf.pages'),
  })
}
