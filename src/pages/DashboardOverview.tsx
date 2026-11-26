// Analyse: Hub-and-spoke um „Veranstaltungen“. Ein Kanban/Kalender passt nicht — die Interaktionen sind eine
// geordnete Abfolge mit genau EINER aktiven (KanbanWidget lehne ich ab: es bildet Status-Spalten ab, keine
// feste Reihenfolge mit exklusivem „aktiv“-Schalter). Primär: geordnete Interaktionskarten der gewählten Veranstaltung.
// Hero: nur wenn keine Interaktion aktiv ist (Banner aktiviert die erste). Grid: split + StatStrip; Aside:
// „Ohne KI-Antwort“ (Zusammenfassungen) + „Referenzstatements“ (Abschlussbewertungen). Mobil: Karten untereinander.
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconBolt, IconQrcode, IconFileText, IconPencil, IconMessage2, IconPlus, IconPlayerPlay, IconStars } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor, countOf, viewHref } from '@/config/plan';
import type { Interaktionen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useClock, gruss, undoToast } from '@/lib/polish';
import { tx, appLabel, dateFnsLocale } from '@/i18n';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    veranstaltungen, interaktionen, teilnehmende, feedbacks, zusammenfassungen, abschlussbewertungen,
    setInteraktionen, fetchAll,
  } = data;
  const clock = useClock();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // the active interaction's activation, shared by hero, card button and overlay footer
  const activate = (r: Interaktionen, openQr: boolean) => {
    const eventUrl = r.fields.veranstaltung;
    const siblings = interaktionen.filter(x => x.record_id !== r.record_id && x.fields.veranstaltung === eventUrl && x.fields.aktiv);
    const snapshot = interaktionen;
    if (openQr) window.open(viewHref('qr-code', r.record_id), '_blank', 'noopener');
    setInteraktionen(prev => prev.map(x => x.record_id === r.record_id
      ? { ...x, fields: { ...x.fields, aktiv: true } }
      : siblings.some(s => s.record_id === x.record_id) ? { ...x, fields: { ...x.fields, aktiv: false } } : x));
    setNotice(null);
    void (async () => {
      try {
        await LivingAppsService.updateInteraktionenEntry(r.record_id, { aktiv: true });
        for (const s of siblings) await LivingAppsService.updateInteraktionenEntry(s.record_id, { aktiv: false });
      } catch {
        setInteraktionen(snapshot);
        void fetchAll();
      }
    })();
    undoToast(tx`${r.fields.frage ?? ''} ist jetzt aktiv`, () => {
      setInteraktionen(snapshot);
      void (async () => {
        try {
          await LivingAppsService.updateInteraktionenEntry(r.record_id, { aktiv: false });
          for (const s of siblings) await LivingAppsService.updateInteraktionenEntry(s.record_id, { aktiv: true });
        } catch { void fetchAll(); }
      })();
    });
  };

  const crud = useEntityCrud(data, {
    footer: (top) => top.type === 'interaktionen' && !top.record.fields.aktiv
      ? { label: tx('Aktivieren & QR-Code zeigen'), onClick: () => activate(top.record, true) }
      : undefined,
  });

  const sortedEvents = useMemo(
    () => [...veranstaltungen].sort((a, b) => (b.fields.datum ?? '').localeCompare(a.fields.datum ?? '')),
    [veranstaltungen],
  );
  const eventId = useMemo(() => {
    if (selectedId && veranstaltungen.some(v => v.record_id === selectedId)) return selectedId;
    const activeIx = interaktionen.find(i => i.fields.aktiv);
    const ev = activeIx ? extractRecordId(activeIx.fields.veranstaltung) : null;
    if (ev && veranstaltungen.some(v => v.record_id === ev)) return ev;
    return sortedEvents[0]?.record_id ?? null;
  }, [selectedId, veranstaltungen, interaktionen, sortedEvents]);
  const event = veranstaltungen.find(v => v.record_id === eventId) ?? null;

  const eventInteraktionen = useMemo(
    () => interaktionen.filter(i => extractRecordId(i.fields.veranstaltung) === eventId)
      .sort((a, b) => (a.fields.reihenfolge ?? 0) - (b.fields.reihenfolge ?? 0)),
    [interaktionen, eventId],
  );
  const feedbackCount = useMemo(() => {
    const m = new Map<string, number>();
    feedbacks.forEach(f => { const id = extractRecordId(f.fields.interaktion); if (id) m.set(id, (m.get(id) ?? 0) + 1); });
    return m;
  }, [feedbacks]);
  const latestSummary = useMemo(() => {
    const m = new Map<string, (typeof zusammenfassungen)[number]>();
    [...zusammenfassungen].sort((a, b) => (a.createdat ?? '').localeCompare(b.createdat ?? '')).forEach(z => {
      const id = extractRecordId(z.fields.interaktion); if (id) m.set(id, z);
    });
    return m;
  }, [zusammenfassungen]);

  const activeIx = eventInteraktionen.find(i => i.fields.aktiv) ?? null;
  const ixIds = new Set(eventInteraktionen.map(i => i.record_id));
  const eventSummaries = zusammenfassungen.filter(z => ixIds.has(extractRecordId(z.fields.interaktion) ?? ''));
  const withoutAi = eventSummaries.filter(z => !z.fields.ki_antwort?.trim());
  const ratings = abschlussbewertungen.filter(a => extractRecordId(a.fields.veranstaltung) === eventId);
  const statements = ratings.filter(a => a.fields.referenzstatement?.trim());
  const participants = teilnehmende.filter(p => extractRecordId(p.fields.veranstaltung) === eventId);
  const ixName = (id: string | null) => eventInteraktionen.find(i => i.record_id === id)?.fields.frage ?? '';

  const empty = veranstaltungen.length === 0;
  const subtitle = !event
    ? tx('Lege deine erste Veranstaltung an, dann kannst du Interaktionen vorbereiten.')
    : activeIx
      ? tx`„${event.fields.titel ?? ''}“ — aktiv ist: ${activeIx.fields.frage ?? ''}`
      : eventInteraktionen.length > 0
        ? tx`„${event.fields.titel ?? ''}“ — noch keine Interaktion aktiv.`
        : tx`„${event.fields.titel ?? ''}“ — bereite die erste Interaktion vor.`;

  const interactionCards = (
    <div className="space-y-3">
      {eventInteraktionen.map(r => {
        const n = feedbackCount.get(r.record_id) ?? 0;
        const z = latestSummary.get(r.record_id);
        const on = !!r.fields.aktiv;
        return (
          <div key={r.record_id} className={`overflow-hidden rounded-[27px] bg-card p-4 shadow-lg sm:p-5 ${on ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">{r.fields.reihenfolge ?? '–'}</span>
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => crud.interaktionen.openDetail(r)}>
                <span className="block font-semibold leading-snug line-clamp-2">{r.fields.frage}</span>
                {r.fields.erlaeuterung && <span className="mt-1 block text-sm text-muted-foreground line-clamp-2">{r.fields.erlaeuterung}</span>}
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {on
                    ? <span className="font-medium text-primary">{tx('Aktiv')}</span>
                    : <span className="text-muted-foreground">{tx('Nicht aktiv')}</span>}
                  <span className="text-muted-foreground"><IconMessage2 size={14} className="mr-1 inline shrink-0" />{countOf('feedbacks', n, appLabel('feedbacks'))}</span>
                  {z && <span className="text-muted-foreground">{tx`Zusammenfassung vom ${formatDate(z.fields.erstellt_am ?? z.createdat)}`}</span>}
                </span>
              </button>
              {crud.interaktionen.canWrite && (
                <Button variant="ghost" size="icon" aria-label={tx('Bearbeiten')} onClick={() => crud.interaktionen.openEdit(r)}>
                  <IconPencil size={16} />
                </Button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {on ? (
                <Button asChild size="sm" variant="outline">
                  <a href={viewHref('qr-code', r.record_id)} target="_blank" rel="noopener"><IconQrcode size={16} />{tx('QR-Code zeigen')}</a>
                </Button>
              ) : crud.interaktionen.canWrite && (
                <Button asChild size="sm">
                  <a href={viewHref('qr-code', r.record_id)} target="_blank" rel="noopener" onClick={() => activate(r, false)}>
                    <IconPlayerPlay size={16} />{tx('Aktivieren & QR-Code')}
                  </a>
                </Button>
              )}
              {z ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`#/ansicht/zusammenfassung?record=${z.record_id}`} target="_blank" rel="noopener"><IconFileText size={16} />{tx('Zusammenfassen')}</a>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <a href={`#/intents/feedbacks-zusammenfassen?interaktion=${encodeURIComponent(r.record_id)}`}><IconFileText size={16} />{tx('Zusammenfassen')}</a>
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {eventInteraktionen.length === 0 && event && (
        <div className="rounded-[27px] bg-card p-8 text-center shadow-lg">
          <IconBolt size={48} className="mx-auto mb-3 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">{tx('Noch keine Interaktionen — bereite Frage, Vorprompt und Endprompt vor.')}</p>
          {crud.interaktionen.canWrite && (
            <Button onClick={() => crud.interaktionen.openCreate({ veranstaltung: event.record_id, reihenfolge: 1 })}>
              <IconPlus size={16} />{tx('Erste Interaktion anlegen')}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
          <p className="sr-only">{format(clock, 'PPP', { locale: dateFnsLocale() })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {event && crud.interaktionen.canWrite && (
            <Button onClick={() => crud.interaktionen.openCreate({ veranstaltung: event.record_id, reihenfolge: eventInteraktionen.length + 1 })}>
              <IconPlus size={16} />{tx('Neue Interaktion')}
            </Button>
          )}
          {crud.veranstaltungen.canWrite && (
            <Button variant="outline" onClick={() => crud.veranstaltungen.openCreate({})}>
              <IconPlus size={16} />{tx('Neue Veranstaltung')}
            </Button>
          )}
        </div>
      </header>

      {empty ? (
        <div className="rounded-[27px] bg-card p-10 text-center shadow-lg">
          <IconStars size={48} className="mx-auto mb-3 text-muted-foreground" />
          <p className="mb-4 text-lg">{tx('Richte deine erste Veranstaltung ein — danach bereitest du die Interaktionen vor.')}</p>
          {crud.veranstaltungen.canWrite && (
            <Button onClick={() => crud.veranstaltungen.openCreate({})}>{tx('Erste Veranstaltung anlegen')}</Button>
          )}
        </div>
      ) : (
        <>
          {sortedEvents.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={appLabel('veranstaltungen')}>
              {sortedEvents.map(v => (
                <Button key={v.record_id} role="tab" aria-selected={v.record_id === eventId} size="sm"
                  variant={v.record_id === eventId ? 'default' : 'outline'}
                  onClick={() => setSelectedId(v.record_id)}>
                  {v.fields.titel}{v.fields.datum ? ` · ${formatDate(v.fields.datum)}` : ''}
                </Button>
              ))}
            </div>
          )}
          <DashboardGrid
            variant="split"
            hero={event && eventInteraktionen.length > 0 && !activeIx && crud.interaktionen.canWrite ? (
              <HeroBanner
                icon={<IconBolt size={18} />}
                action={{ label: tx('Erste Interaktion aktivieren'), onClick: () => activate(eventInteraktionen[0], true) }}
              >
                {tx`Für „${event.fields.titel ?? ''}“ ist keine Interaktion aktiv — die Teilnehmenden sehen noch kein Formular.`}
              </HeroBanner>
            ) : undefined}
            kpis={
              <StatStrip>
                <StatStripItem
                  title={tx('Feedbacks der aktiven Interaktion')}
                  value={activeIx ? (feedbackCount.get(activeIx.record_id) ?? 0) : 0}
                  icon={<IconMessage2 size={16} />}
                  tone={activeIx ? 'primary' : 'default'}
                  onClick={activeIx ? () => crud.interaktionen.openDetail(activeIx) : undefined}
                />
                <StatStripItem title={appLabel('teilnehmende')} value={participants.length} />
                <StatStripItem title={appLabel('abschlussbewertungen')} value={ratings.length} icon={<IconStars size={16} />} />
              </StatStrip>
            }
            aside={
              <>
                <WorkList
                  title={tx('Ohne KI-Antwort')}
                  icon={<IconFileText size={16} />}
                  items={withoutAi.map(z => {
                    const go = flowActionFor('zusammenfassungen', 'ki_antwort', z.record_id);
                    return {
                      id: z.record_id,
                      title: ixName(extractRecordId(z.fields.interaktion)),
                      secondLine: <span className="text-muted-foreground">{formatDate(z.fields.erstellt_am ?? z.createdat)}</span>,
                      action: go ? { label: tx('KI-Antwort ablegen'), onClick: go } : undefined,
                    };
                  })}
                  onItemClick={id => { const z = zusammenfassungen.find(x => x.record_id === id); if (z) crud.zusammenfassungen.openDetail(z); }}
                  empty={{ text: eventSummaries.length > 0 ? tx('Alle Zusammenfassungen haben eine KI-Antwort.') : tx('Noch keine Zusammenfassung — starte sie an einer Interaktion.') }}
                />
                <WorkList
                  title={tx('Referenzstatements')}
                  icon={<IconStars size={16} />}
                  items={statements.map(a => ({
                    id: a.record_id,
                    title: a.fields.kuerzel ?? '–',
                    secondLine: <span className="line-clamp-2 text-muted-foreground">{a.fields.referenzstatement}</span>,
                  }))}
                  onItemClick={id => { const a = abschlussbewertungen.find(x => x.record_id === id); if (a) crud.abschlussbewertungen.openDetail(a); }}
                  empty={{ text: tx('Noch keine Referenzstatements eingegangen.') }}
                />
              </>
            }
            primary={
              <div className="space-y-3">
                {notice && <p role="alert" className="text-sm text-destructive">{notice}</p>}
                {interactionCards}
              </div>
            }
          />
        </>
      )}
      {crud.surfaces}
    </div>
  );
}
