/**
 * src/pages/views/QrCodeView.tsx — the view „QR-Code“ the plan orders (dashboard.views).
 *
 * ROUTE   #/ansicht/qr-code — generated in App.tsx, OUTSIDE the dashboard chrome
 *         (no header, drawer or assistant: a beamer / kiosk / print surface). Never wire a route for it yourself.
 * LIVE    refreshes every 10 s through useLiveRecords (keep the hook —
 *         the report after the build checks that this page polls).
 * READS   interaktionen (veranstaltung, reihenfolge, frage, erlaeuterung, aktiv)
 * FILTER  interaktionen: r.v_aktiv == True  ← already vSQL: keep `query.filter` EXACTLY.
 * SHOWS   exactly the record whose interaktionen.aktiv=true — the OVERVIEW sets that field.
 * PURPOSE Den QR-Code zum Feedback-Formular der gerade aktiven Interaktion bildschirmfüllend zeigen, mit Frage und Erläuterung darüber.
 *
 * CONTRACT
 *   - Zeigt den QR-Code der Interaktion, die die Übersicht per Klick auf „aktiv“ gesetzt hat; er führt zum öffentlichen Feedback-Formular.
 *   - Zeigt Frage und Erläuterung der aktiven Interaktion über dem QR-Code.
 *   - Ist keine Interaktion aktiv, erscheint der Hinweis „Keine aktive Interaktion“.
 *   - Öffnet sich auf den Klick der Übersicht in einem eigenen Browsertab.
 */
import { useLiveRecords } from '@/hooks/useLiveRecords';
import { tx } from '@/i18n';
import { countOf } from '@/config/plan';
import { QrCode } from '@/components/widgets/QrCode';
import { usePublicPageLink } from '@/components/widgets/PublicPageQr';

const BIG = { fontSize: 'clamp(1.5rem, 2.8vh, 3rem)' } as const;
const HEAD = { fontSize: 'clamp(2rem, 4.5vh, 4.5rem)' } as const;
const MID = { fontSize: 'clamp(1.25rem, 2.2vh, 2.25rem)' } as const;

function ActiveQr({ id }: { id: string }) {
  const { link, loading } = usePublicPageLink('interaktionen', id);
  if (loading) return <p className="text-muted-foreground" style={BIG}>{tx('Link wird geladen …')}</p>;
  if (!link) return <p className="text-muted-foreground" style={BIG}>{tx('Die Teilnahmeseite ist noch nicht veröffentlicht.')}</p>;
  return (
    <div className="flex flex-col items-center gap-4">
      <QrCode value={link} size="48vh" title={tx('QR-Code zum Feedback-Formular')} />
      <p className="break-all text-center" style={MID}>{tx('Oder öffne:')} <span className="font-mono">{link}</span></p>
    </div>
  );
}

export default function QrCodeView() {
  const pinned = (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') ?? '').replace(/["\\]/g, '');
  const interaktionen = useLiveRecords('interaktionen', { intervalMs: 10000, query: { filter: "r.v_aktiv == True" } });
  const active = interaktionen.records.find(r => r.record_id === pinned) ?? interaktionen.records[0] ?? null;
  const f = active?.fields;
  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-background p-10 text-center text-foreground">
      <div className="flex w-full items-center justify-between text-muted-foreground" style={MID}>
        <span>{countOf('interaktionen', interaktionen.records.length, tx('Interaktionen'))}</span>
        <span className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${interaktionen.stale ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {interaktionen.stale ? tx('Pause') : tx('Live')}
        </span>
      </div>
      {active ? (
        <>
          <h1 className="max-w-[90vw] whitespace-pre-wrap font-semibold" style={HEAD}>{f?.frage}</h1>
          {f?.erlaeuterung && <p className="max-w-[90vw] whitespace-pre-wrap text-muted-foreground" style={BIG}>{f.erlaeuterung}</p>}
          <ActiveQr id={active.record_id} />
        </>
      ) : (
        !interaktionen.error && !interaktionen.loading && <h1 className="font-semibold" style={HEAD}>{tx('Keine aktive Interaktion')}</h1>
      )}
      {interaktionen.error && interaktionen.records.length === 0 && (
        <p role="alert" data-live-error className="text-destructive" style={BIG}>
          {interaktionen.unauthorized ? tx('Bitte melde dich an, um diese Ansicht zu sehen.') : tx('Die Daten konnten nicht geladen werden.')}
        </p>
      )}
    </main>
  );
}
