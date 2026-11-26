import type { Abschlussbewertungen, Feedbacks, Interaktionen, Teilnehmende, Zusammenfassungen } from './app';

export type EnrichedInteraktionen = Interaktionen & {
  veranstaltungName: string;
};

export type EnrichedTeilnehmende = Teilnehmende & {
  veranstaltungName: string;
};

export type EnrichedFeedbacks = Feedbacks & {
  interaktionName: string;
};

export type EnrichedZusammenfassungen = Zusammenfassungen & {
  interaktionName: string;
};

export type EnrichedAbschlussbewertungen = Abschlussbewertungen & {
  veranstaltungName: string;
};
