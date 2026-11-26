import { useEffect, useMemo, useState } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  prepareChallenge,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm,
  useJourneySubmit,
  useRecordSearch,
  useVisitorKey,
  fieldText,
} from '@/lib/journey';
import { tx } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Bound } from '@/components/blocks/Bound';
import { Field } from '@/components/blocks/Field';
import { FieldErrorSummary } from '@/components/blocks/FieldErrorSummary';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';

const SLUG = 'abschlussbewertung';

export default function Abschlussbewertung() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPagesConfig(SLUG).then(c => {
      setCfg(c);
      setPage(c?.pages[SLUG] ?? null);
      setLoading(false);
    });
  }, []);

  if (loading || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading} />;
  }
  return <BewertungForm cfg={cfg} page={page} />;
}

function BewertungForm({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const kuerzel = useVisitorKey();

  const f = useStepForm('abschlussbewertungen', {
    fields: ['veranstaltung', 'besonders_toll', 'verbesserungen', 'referenzstatement', 'email', 'einwilligung'],
    autoComplete: true,
    required: { veranstaltung: true },
  });

  const search = useRecordSearch(port, 'veranstaltungen', {
    searchFields: ['titel'],
    toItem: r => ({ id: r.id, title: fieldText(r, 'titel') }),
  });

  const submit = useJourneySubmit(
    port,
    [
      {
        key: 'bewertung',
        entity: 'abschlussbewertungen',
        form: f,
        primary: true,
        values: () => ({ kuerzel: kuerzel }),
      },
    ],
    { draftKey: 'abschlussbewertung' },
  );

  if (submit.result) {
    return (
      <PublicShell title={page.title} description={page.description}>
        <div data-journey-success="">
          <SuccessStep
            result={submit.result}
            forms={[f]}
            title={tx('Danke für deine Bewertung!')}
            whatHappensNext={tx`Dein Kürzel auf diesem Handy: ${kuerzel}`}
            next={[{ label: tx('Weiteres Feedback geben'), href: '#/public/feedback-geben' }]}
          />
        </div>
      </PublicShell>
    );
  }

  const email = String(f.get('email') ?? '');
  const consent = f.get('einwilligung') === true;
  const needsConsentHint = email.trim() !== '' && !consent;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.validate()) return;
    await submit.run();
  };

  return (
    <PublicShell title={page.title} description={page.description}>
      <form
        className="space-y-5"
        onSubmit={onSubmit}
        onFocus={() => prepareChallenge(cfg, page, 'POST', `/apps/${page.endpoints?.find(ep => ep.op === 'create')?.app_id}/records`)}
        noValidate
      >
        <Field form={f} name="veranstaltung" label={tx('Deine Veranstaltung')}>
          <EntitySelectStep
            {...search.select}
            {...f.record('veranstaltung')}
            selectedId={(f.get('veranstaltung') as string | null) ?? null}
            onSelect={id => f.set('veranstaltung', id, search.labelOf(id))}
            avatar="none"
          />
        </Field>

        <Bound form={f} name="besonders_toll" rows={3} />
        <Bound form={f} name="verbesserungen" rows={3} />
        <Bound
          form={f}
          name="referenzstatement"
          rows={4}
          hint={tx('Am besten als kurzer Satz, den wir als Empfehlung weitergeben dürfen.')}
        />

        <div className="space-y-3 rounded-xl border p-4">
          <Bound form={f} name="email" label={tx('E-Mail-Adresse (freiwillig)')} />
          <Bound form={f} name="einwilligung" />
          {needsConsentHint && (
            <p className="text-sm text-muted-foreground">{tx('Ohne Häkchen speichern wir deine E-Mail nicht.')}</p>
          )}
        </div>

        <FieldErrorSummary forms={[f]} />
        <Button type="submit" className="min-h-11 w-full" disabled={submit.submitting}>
          {submit.submitting ? tx('Wird gesendet …') : tx('Bewertung absenden')}
        </Button>
        {submit.error && !submit.offline && (
          <p className="text-sm text-destructive">{tx('Das hat nicht geklappt. Bitte versuche es noch einmal.')}</p>
        )}
        {submit.offline && (
          <p className="text-sm text-muted-foreground">{tx('Keine Verbindung — deine Eingaben sind gesichert.')}</p>
        )}
      </form>
    </PublicShell>
  );
}
