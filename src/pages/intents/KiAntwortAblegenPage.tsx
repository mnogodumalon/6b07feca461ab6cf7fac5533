/**
 * KI-Antwort ablegen — 3-Schritt-Wizard.
 * Steps: 1) Zusammenfassung der Interaktion wählen → 2) Antwort der KI einfügen → 3) Prüfen & speichern.
 * Reads: zusammenfassungen (columns interaktion, erstellt_am, zusammenfassung_text, ki_antwort). Writes: zusammenfassungen.ki_antwort (update).
 * Composes: IntentWizardShell, EntitySelectStep, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { fieldText, fieldDate } from '@/lib/journey';
import { useKiAntwortAblegenFlow } from '@/lib/journey/flows/KiAntwortAblegen';
import { tx } from '@/i18n';

export default function KiAntwortAblegenPage() {
  const [step, setStep] = useState(1);
  const flow = useKiAntwortAblegenFlow({
    steps: { zusammenfassungen: 1, ki_antwort: 2 },
    items: {
      zusammenfassungen: (r, ctx) => ({
        id: r.id,
        title: ctx.ref('interaktion') ?? tx('Ohne Interaktion'),
        subtitle: fieldText(r, 'zusammenfassung_text').slice(0, 120),
        stats: fieldText(r, 'ki_antwort')
          ? [{ label: tx('Antwort der KI'), value: tx('bereits abgelegt') }]
          : fieldDate(r, 'erstellt_am')
            ? [{ label: tx('Erstellt am'), value: fieldDate(r, 'erstellt_am') ?? '' }]
            : undefined,
      }),
    },
  });

  const pick = flow.pick('zusammenfassungen');
  const picked = pick.selectedId ? flow.picks.zusammenfassungen.recordOf(pick.selectedId) : undefined;

  return (
    <IntentWizardShell
      title={tx('KI-Antwort ablegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={flow.formList}
      draftKey={flow.draftKey}
      intro={{
        description: tx('Füge die Antwort des Chatbots zur Zusammenfassung einer Interaktion ein.'),
        needs: [tx('Die Antwort aus dem Chatbot')],
      }}
    >
      <WizardStep label={tx('Zusammenfassung')} description={tx('Zu welcher Interaktion gehört die Antwort der KI?')}>
        <EntitySelectStep
          {...flow.picks.zusammenfassungen.select}
          {...pick}
          searchPlaceholder={tx('Zusammenfassung suchen …')}
        />
      </WizardStep>
      <WizardStep label={tx('Antwort der KI')} description={tx('Kopiere die Antwort aus dem Chatbot und füge sie hier ein.')} needs={['zusammenfassungen']}>
        <div className="space-y-4">
          {picked && (
            <div className="rounded-2xl bg-secondary p-4 text-sm overflow-hidden">
              <p className="font-medium">{flow.picks.zusammenfassungen.refLabel(picked, 'interaktion') ?? tx('Zusammenfassung')}</p>
              <p className="mt-1 line-clamp-4 whitespace-pre-line text-muted-foreground">{fieldText(picked, 'zusammenfassung_text')}</p>
            </div>
          )}
          <Bound form={flow.forms.zusammenfassungen} name="ki_antwort" rows={10} />
          <StepNav onBack={() => setStep(1)} onNext={() => flow.validateStep(2)} nextStepLabel={tx('Prüfen')} />
        </div>
      </WizardStep>
      <WizardStep label={tx('Prüfen')} description={tx('Alles richtig? Dann speichere die Antwort.')}>
        {!flow.submit.done && (
          <SummaryStep
            forms={flow.formList}
            submit={flow.submit}
            whatHappensNext={tx('Die Antwort wird bei der Zusammenfassung gespeichert.')}
          />
        )}
      </WizardStep>
      {flow.submit.result && (
        <SuccessStep
          result={flow.submit.result}
          forms={flow.formList}
          submit={flow.submit}
          next={[
            { label: tx('Feedbacks zusammenfassen'), href: '#/intents/feedbacks-zusammenfassen' },
            { label: tx('Interaktion aktivieren'), href: '#/intents/interaktion-aktivieren' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}
