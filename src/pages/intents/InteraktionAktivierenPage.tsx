/**
 * Interaktion aktivieren — 3-Schritt-Wizard.
 * Steps: 1) Veranstaltung wählen → 2) Interaktion der Veranstaltung wählen → 3) Aktivieren und QR-Code öffnen.
 * Reads: veranstaltungen, interaktionen. Writes: interaktionen (update, via useInteraktionAktivierenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, StepNav, SummaryStep, SuccessStep, PublicPageQr.
 */
import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { PublicPageQr, usePublicPageLink } from '@/components/widgets/PublicPageQr';
import { Button } from '@/components/ui/button';
import { useLiveList, fieldText, fieldDate, fieldRef, fieldNumber, fieldLookup } from '@/lib/journey';
import { useInteraktionAktivierenFlow } from '@/lib/journey/flows/InteraktionAktivieren';
import { tx } from '@/i18n';

function QrInOwnTab({ recordId }: { recordId: string }) {
  const { link } = usePublicPageLink('interaktionen', recordId);
  return (
    <div className="mt-4 flex flex-col items-center gap-3 overflow-hidden rounded-2xl bg-card p-4">
      <PublicPageQr entity="interaktionen" recordId={recordId} size={220} title={tx('QR-Code zum Feedback-Formular')} />
      {link && (
        <Button asChild variant="outline" size="sm">
          <a href={link} target="_blank" rel="noopener noreferrer">{tx('QR-Code im eigenen Tab öffnen')}</a>
        </Button>
      )}
    </div>
  );
}

export default function InteraktionAktivierenPage() {
  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState<string | null>(null);

  const flow = useInteraktionAktivierenFlow({
    steps: { interaktionen: 2 },
    items: {
      interaktionen: r => {
        const nr = fieldNumber(r, 'reihenfolge');
        const aktiv = fieldLookup(r, 'aktiv');
        return {
          id: r.id,
          title: fieldText(r, 'frage'),
          subtitle: nr != null ? tx`Reihenfolge ${nr}` : undefined,
          status: r.fields.aktiv === true ? { key: 'aktiv', label: tx('Aktiv') } : aktiv ?? undefined,
        };
      },
    },
    where: {
      interaktionen: r => !eventId || fieldRef(r, 'veranstaltung') === eventId,
    },
  });

  const events = useLiveList(flow.port, 'veranstaltungen', { intervalMs: 0 });

  const eventItems =events.records.map(v => {
    const raw = fieldDate(v, 'datum');
    const d = raw ? parseISO(raw) : null;
    return {
      id: v.id,
      title: fieldText(v, 'titel'),
      subtitle: d && isValid(d) ? format(d, 'dd.MM.yyyy HH:mm') : undefined,
    };
  });
  const eventTitle = eventItems.find(e => e.id === eventId)?.title;
  const targetId = flow.targets.interaktionen.selectedId;
  const targetRecord = flow.targets.interaktionen.record;

  return (
    <IntentWizardShell
      title={tx('Interaktion aktivieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{ description: tx('Eine Interaktion deiner Veranstaltung mit einem Klick aktiv setzen.'), needs: [tx('Die Veranstaltung'), tx('Die Interaktion, die jetzt laufen soll')] }}
    >
      <WizardStep label={tx('Veranstaltung')} description={tx('Für welche Veranstaltung willst du eine Interaktion aktivieren?')}>
        <EntitySelectStep
          items={eventItems}
          loading={events.loading && !events.loaded}
          error={events.error ? events.error.message : null}
          avatar="none"
          searchPlaceholder={tx('Titel der Veranstaltung …')}
          selectedId={eventId}
          onSelect={id => { setEventId(id); setStep(2); }}
        />
      </WizardStep>

      <WizardStep label={tx('Interaktion')} description={tx('Welche Interaktion soll jetzt aktiv sein? Die bisher aktive wird inaktiv.')}>
        <EntitySelectStep
          {...flow.picks.interaktionen.select}
          {...flow.pick('interaktionen')}
          avatar="none"
          searchPlaceholder={tx('Frage suchen …')}
          emptyText={tx('Diese Veranstaltung hat noch keine Interaktion.')}
        />
        <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Prüfen')} />
        {!eventId && (
          <p className="mt-2 text-xs text-muted-foreground">{tx('Tipp: Wähle zuerst die Veranstaltung, dann zeigt die Liste nur ihre Interaktionen.')}</p>
        )}
      </WizardStep>

      <WizardStep label={tx('Aktivieren')} description={tx('Prüfen und mit einem Klick aktivieren.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            confirmLabel={tx('Jetzt aktivieren')}
            items={[
              ...(eventTitle ? [{ key: 'event', label: tx('Veranstaltung'), value: eventTitle }] : []),
              ...(targetRecord ? [{ key: 'frage', label: tx('Interaktion'), value: fieldText(targetRecord, 'frage') }] : []),
              { key: 'aktiv', label: tx('Status danach'), value: tx('Aktiv') },
            ]}
            whatHappensNext={tx('Die bisher aktive Interaktion dieser Veranstaltung wird inaktiv. Danach kannst du den QR-Code zum Feedback-Formular öffnen.')}
          />
        )}
      </WizardStep>

      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          undo={flow.undo}
          title={tx('Interaktion aktiviert')}
          facts={[
            ...(targetRecord ? [{ label: tx('Frage'), value: fieldText(targetRecord, 'frage') }] : []),
            { label: tx('Aktiv'), value: tx('Ja') },
          ]}
          next={[
            { label: tx('Feedbacks zusammenfassen'), href: '#/intents/feedbacks-zusammenfassen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
          actions={{ copy: false, print: false }}
        >
          {targetId && <QrInOwnTab recordId={targetId} />}
        </SuccessStep>
      )}
    </IntentWizardShell>
  );
}
