import type { EnrichedAbschlussbewertungen, EnrichedFeedbacks, EnrichedInteraktionen, EnrichedTeilnehmende, EnrichedZusammenfassungen } from '@/types/enriched';
import type { Abschlussbewertungen, Feedbacks, Interaktionen, Teilnehmende, Veranstaltungen, Zusammenfassungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { displayPart } from '@/lib/journey/rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => displayPart(r.fields[f])).filter(Boolean).join(' ').trim();
}

interface InteraktionenMaps {
  veranstaltungenMap: Map<string, Veranstaltungen>;
}

export function enrichInteraktionen(
  interaktionen: Interaktionen[],
  maps: InteraktionenMaps
): EnrichedInteraktionen[] {
  return interaktionen.map(r => ({
    ...r,
    veranstaltungName: resolveDisplay(r.fields.veranstaltung, maps.veranstaltungenMap, 'titel'),
  }));
}

interface TeilnehmendeMaps {
  veranstaltungenMap: Map<string, Veranstaltungen>;
}

export function enrichTeilnehmende(
  teilnehmende: Teilnehmende[],
  maps: TeilnehmendeMaps
): EnrichedTeilnehmende[] {
  return teilnehmende.map(r => ({
    ...r,
    veranstaltungName: resolveDisplay(r.fields.veranstaltung, maps.veranstaltungenMap, 'titel'),
  }));
}

interface FeedbacksMaps {
  interaktionenMap: Map<string, Interaktionen>;
}

export function enrichFeedbacks(
  feedbacks: Feedbacks[],
  maps: FeedbacksMaps
): EnrichedFeedbacks[] {
  return feedbacks.map(r => ({
    ...r,
    interaktionName: resolveDisplay(r.fields.interaktion, maps.interaktionenMap, 'frage'),
  }));
}

interface ZusammenfassungenMaps {
  interaktionenMap: Map<string, Interaktionen>;
}

export function enrichZusammenfassungen(
  zusammenfassungen: Zusammenfassungen[],
  maps: ZusammenfassungenMaps
): EnrichedZusammenfassungen[] {
  return zusammenfassungen.map(r => ({
    ...r,
    interaktionName: resolveDisplay(r.fields.interaktion, maps.interaktionenMap, 'frage'),
  }));
}

interface AbschlussbewertungenMaps {
  veranstaltungenMap: Map<string, Veranstaltungen>;
}

export function enrichAbschlussbewertungen(
  abschlussbewertungen: Abschlussbewertungen[],
  maps: AbschlussbewertungenMaps
): EnrichedAbschlussbewertungen[] {
  return abschlussbewertungen.map(r => ({
    ...r,
    veranstaltungName: resolveDisplay(r.fields.veranstaltung, maps.veranstaltungenMap, 'titel'),
  }));
}
