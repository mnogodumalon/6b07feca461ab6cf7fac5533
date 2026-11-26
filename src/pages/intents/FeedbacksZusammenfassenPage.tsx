/**
 * Feedbacks zusammenfassen — 3-Schritt-Wizard.
 * Steps: 1) Interaktion wählen → 2) Zusammengesetzten Text durchgehen und anpassen → 3) Prüfen & speichern.
 * Reads: interaktionen, feedbacks. Writes: zusammenfassungen (via useFeedbacksZusammenfassenFlow).
 * Composes: IntentWizardShell, EntitySelectStep, Field, StepNav, SummaryStep, SuccessStep.
 */
import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Field } from '@/components/blocks/Field';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, refFilter, useLiveList } from '@/lib/journey';
import { useFeedbacksZusammenfassenFlow } from '@/lib/journey/flows/FeedbacksZusammenfassen';
import { tx } from '@/i18n';

export default function FeedbacksZusammenfassenPage() {
  const [step, setStep] = useState(1);
  const flow = useFeedbacksZusammenfassenFlow({
    steps: { interaktion: 1, zusammenfassung_text: 2 },
    items: {
      interaktion: r => ({ id: r.id, title: fieldText(r, 'frage'), subtitle: fieldText(r, 'erlaeuterung') || undefined }),
    },
    where: { interaktion: r => r.fields.aktiv === true },
  });
  const f = flow.forms.zusammenfassungen;
  const interaktionId = (f.get('interaktion') as string | null) || '';

  const feedbacks = useLiveList(flow.port, 'feedbacks', {
    intervalMs: 0,
    list: { filter: interaktionId ? refFilter('interaktion', interaktionId) : undefined, limit: 500 },
    enabled: Boolean(interaktionId),
  });

  // Compose Vorprompt + Feedbacks (Kürzel) + Endprompt once per picked interaction —
  // never over text the person already changed.
  const composedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!interaktionId || !feedbacks.loaded || composedFor.current === interaktionId) return;
    const rec = flow.picks.interaktion.recordOf(interaktionId);
    if (!rec) return;
    const vor = fieldText(rec, 'vorprompt').trim();
    const end = fieldText(rec, 'endprompt').trim();
    const current = String(f.get('zusammenfassung_text') ?? '').trim();
    composedFor.current = interaktionId;
    if (current !== '' && current !== vor) return;
    const lines = feedbacks.records.map(r => `${fieldText(r, 'kuerzel')}: ${fieldText(r, 'feedback_text')}`);
    const text = [vor, lines.join('\n\n'), end].filter(s => s !== '').join('\n\n');
    f.set('zusammenfassung_text', text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interaktionId, feedbacks.loaded, feedbacks.records]);

  return (
    <IntentWizardShell
      title={tx('Feedbacks zusammenfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Feedbacks einer Interaktion zu einem Text zusammenführen und speichern.'),
        needs: [tx('Eine aktive Interaktion mit Feedbacks')],
      }}
    >
      <WizardStep label={tx('Interaktion')} description={tx('Für welche Interaktion willst du die Feedbacks zusammenfassen?')}>
        <EntitySelectStep
          {...flow.picks.interaktion.select}
          {...flow.pick('interaktion')}
          searchPlaceholder={tx('Frage suchen …')}
        />
      </WizardStep>
      <WizardStep
        label={tx('Text')}
        description={tx('Vorprompt, Feedbacks mit Kürzel und Endprompt stehen schon da — passe den Text an.')}
        needs={['interaktion']}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {feedbacks.loading ? tx('Feedbacks werden geladen …') : tx`${feedbacks.records.length} Feedbacks eingefügt`}
          </p>
          <Field form={f} name="zusammenfassung_text">
            <Textarea {...f.field('zusammenfassung_text')} className="min-h-[60vh] w-full" />
          </Field>
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => f.validate(['zusammenfassung_text'])}
            nextStepLabel={tx('Prüfen')}
          />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Zusammenfassung wird gespeichert. Du kannst sie danach an die KI geben und die Antwort ablegen.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('KI-Antwort ablegen'), href: '#/intents/ki-antwort-ablegen' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
