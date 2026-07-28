import type { JourneyDetail } from '../../store/journeyStore'
import { showJourneyExportPreview } from '../../features/journey-export/preview/showJourneyExportPreview'
import { buildJourneyBookDocument } from '../../features/journey-export/render/buildJourneyBookDocument'

/**
 * Compatibility entry point for the existing Journey download action.
 * New export modes should call the feature modules directly rather than adding
 * rendering or preview code here.
 */
export async function downloadJourneyBookPDF(journey: JourneyDetail) {
  const document = buildJourneyBookDocument(journey)
  showJourneyExportPreview({
    title: journey.title,
    document,
  })
}
