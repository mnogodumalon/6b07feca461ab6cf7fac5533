/**
 * src/pages/views/ZusammenfassungView.tsx — the view „Zusammenfassung“ the plan orders (dashboard.views).
 *
 * ROUTE   #/ansicht/zusammenfassung?record=<zusammenfassung id> — OUTSIDE the dashboard chrome.
 * LIVE    static — loads once.
 * READS   interaktionen (frage, erlaeuterung, vorprompt, endprompt); feedbacks (interaktion, kuerzel, feedback_text);
 *         zusammenfassungen (interaktion, zusammenfassung_text, ki_antwort)
 * COMPOSE zusammenfassungen.zusammenfassung_text: when the view opens and the field is empty —
 *         Vorprompt, dann die Feedbacks der Interaktion der Reihe nach je mit Kürzel, zuletzt der Endprompt.
 * EDITS   zusammenfassungen.zusammenfassung_text is edited ON this view (ViewTextEditor).
 * PURPOSE Alle Feedbacks einer Interaktion in einem großen, bearbeitbaren Textfeld bildschirmfüllend zusammenführen, durchgehen und kopieren.
 *
 * CONTRACT
 *   - Öffnet sofort auf den Klick „Zusammenfassen“ der Übersicht für genau die dort gewählte Interaktion, in einem eigenen Tab.
 *   - Zeigt über dem Textfeld die Frage und die Erläuterung der Interaktion.
 *   - Beim Öffnen mit leerem Feld setzt die Ansicht den Text zusammen.
 *   - Der Text bleibt frei änderbar und speichert sich selbst; „Neu zusammenführen“ wiederholt das Zusammenfassen beliebig oft.
 *   - Eine Schaltfläche kopiert den ganzen Text mit einem Klick.
 *   - Das Feld „Antwort der KI“ wird über den Ablauf „KI-Antwort ablegen“ gepflegt und bleibt gespeichert.
 */
import { useCallback } from 'react';
import { useLiveRecords } from '@/hooks/useLiveRecords';
import { tx } from '@/i18n';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { flowLinkFor } from '@/config/plan';
import { ViewTextEditor } from '@/components/blocks/ViewTextEditor';

const BIG = { fontSize: 'clamp(1.5rem, 2.8vh, 3rem)' } as const;
const HEAD = { fontSize: 'clamp(2rem, 4.5vh, 4.5rem)' } as const;
const MID = { fontSize: 'clamp(1.25rem, 2.2vh, 2.25rem)' } as const;

export default function ZusammenfassungView() {
  const pinned = (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') ?? '').replace(/["\\]/g, '');
  const interaktionen = useLiveRecords('interaktionen', { intervalMs: 0 });
  const feedbacks = useLiveRecords('feedbacks', { intervalMs: 0 });
  const zusammenfassungen = useLiveRecords('zusammenfassungen', { intervalMs: 0 });
  // the record whose zusammenfassung_text this view edits — the one `?record=` names, never the first row (EF-30)
  const zusammenfassungenEdit = zusammenfassungen.records.find(r => r.record_id === pinned) ?? null;
  const interaktionId = zusammenfassungenEdit ? extractRecordId(zusammenfassungenEdit.fields.interaktion) : null;
  const interaktion = interaktionId ? interaktionen.records.find(r => r.record_id === interaktionId) ?? null : null;
  const loading = interaktionen.loading || feedbacks.loading || zusammenfassungen.loading;
  const blocked = [interaktionen, feedbacks, zusammenfassungen].some(x => x.error)
    ? tx('Die Daten konnten nicht geladen werden — es wird nichts zusammengeführt oder gespeichert.') : null;

  const compose = useCallback((): string | null => {
    if (loading || !interaktion || !interaktionId) return null;
    const rows = feedbacks.records
      .filter(fb => extractRecordId(fb.fields.interaktion) === interaktionId)
      .sort((a, b) => (a.createdat ?? '').localeCompare(b.createdat ?? ''));
    const parts: string[] = [];
    if (interaktion.fields.vorprompt?.trim()) parts.push(interaktion.fields.vorprompt.trim());
    rows.forEach(fb => parts.push(`[${fb.fields.kuerzel ?? '–'}] ${(fb.fields.feedback_text ?? '').trim()}`));
    if (interaktion.fields.endprompt?.trim()) parts.push(interaktion.fields.endprompt.trim());
    return parts.join('\n\n');
  }, [loading, interaktion, interaktionId, feedbacks.records]);

  const kiLink = zusammenfassungenEdit ? flowLinkFor('zusammenfassungen', 'ki_antwort', zusammenfassungenEdit.record_id) : null;

  return (
    <main className="flex min-h-dvh flex-col gap-5 bg-background p-10 text-foreground">
      {!pinned && <p data-view-no-record style={BIG}>{tx('Bitte über die Übersicht öffnen — diese Ansicht zeigt einen bestimmten Datensatz.')}</p>}
      {pinned && !loading && !zusammenfassungenEdit && !blocked && <p style={BIG}>{tx('Diese Zusammenfassung wurde nicht gefunden.')}</p>}
      {interaktion && (
        <header className="space-y-2">
          <h1 className="whitespace-pre-wrap font-semibold" style={HEAD}>{interaktion.fields.frage}</h1>
          {interaktion.fields.erlaeuterung && <p className="whitespace-pre-wrap text-muted-foreground" style={BIG}>{interaktion.fields.erlaeuterung}</p>}
        </header>
      )}
      {zusammenfassungenEdit && (
        <ViewTextEditor
          field="zusammenfassung_text"
          recordId={zusammenfassungenEdit.record_id}
          value={String((zusammenfassungenEdit.fields as Record<string, unknown>)['zusammenfassung_text'] ?? '')}
          save={async text => {
            await LivingAppsService.updateZusammenfassungenEntry(zusammenfassungenEdit.record_id, { zusammenfassung_text: text });
            zusammenfassungen.apply(zusammenfassungenEdit.record_id, { zusammenfassung_text: text });
          }}
          compose={compose}
          blocked={blocked}
        />
      )}
      {zusammenfassungenEdit && (
        <section className="space-y-2">
          <h2 className="font-semibold" style={MID}>{tx('Antwort der KI')}</h2>
          {zusammenfassungenEdit.fields.ki_antwort
            ? <p className="whitespace-pre-wrap rounded-2xl border border-input bg-card p-6" style={MID}>{zusammenfassungenEdit.fields.ki_antwort}</p>
            : <p className="text-muted-foreground" style={MID}>{tx('Noch keine Antwort eingetragen.')}</p>}
          {kiLink && <a href={kiLink} target="_blank" rel="noopener" className="inline-block underline" style={MID}>{tx('KI-Antwort ablegen')}</a>}
        </section>
      )}
      {[interaktionen, feedbacks, zusammenfassungen].map((x, i) => x.error && x.records.length === 0 && (
        <p key={i} role="alert" data-live-error className="text-destructive" style={BIG}>
          {x.unauthorized ? tx('Bitte melde dich an, um diese Ansicht zu sehen.') : tx('Die Daten konnten nicht geladen werden.')}
        </p>
      ))}
    </main>
  );
}
