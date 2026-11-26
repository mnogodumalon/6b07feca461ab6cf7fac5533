/**
 * widgets/JoinQr.tsx — the plan's public pages as BOUND QR codes and links.
 *
 * @since 2026-11-26 (a QR view asked for its page by an entity the page has no link to and
 *        read „noch nicht veröffentlicht“ over a published page)
 *
 * GENERATED FROM THE PLAN — one component and one hook per public page, already tied to
 * its page. Place it; never name an entity or a slug, never call PublicPageQr or
 * usePublicPageLink yourself for a page listed here:
 *   <FeedbackGebenQr size="34vh" />   → #/public/feedback-geben (one link for everybody)
 *   <AbschlussbewertungQr size="34vh" />   → #/public/abschlussbewertung (one link for everybody)
 * Every component takes the QR's own props (size, showLink, linkClassName …).
 */
import { PublicPageQr, usePublicPageLink, type PublicPageQrProps } from '@/components/widgets/PublicPageQr';

type QrProps = Omit<PublicPageQrProps, 'entity' | 'recordId' | 'page'>;
type ForRecord = QrProps & { recordId: string | null | undefined };

/** „feedback-geben“ — one link for everybody — Teilnehmende scannen den QR-Code und sehen ohne Anmeldung nur Frage und Erläuterung der gerade aktiven Interaktion. Sie geben beliebig viele Feedbacks ab. Beim  */
export function FeedbackGebenQr(qr: QrProps) {
  return <PublicPageQr entity="" recordId={null} page="feedback-geben" {...qr} />;
}
export function useFeedbackGebenLink() {
  return usePublicPageLink('', null, 'feedback-geben');
}

/** „abschlussbewertung“ — one link for everybody — Am Ende des Abends wählen Teilnehmende ihre Veranstaltung und beschreiben, was besonders toll war und was verbessert werden kann. Am besten formulieren sie ein  */
export function AbschlussbewertungQr(qr: QrProps) {
  return <PublicPageQr entity="" recordId={null} page="abschlussbewertung" {...qr} />;
}
export function useAbschlussbewertungLink() {
  return usePublicPageLink('', null, 'abschlussbewertung');
}
