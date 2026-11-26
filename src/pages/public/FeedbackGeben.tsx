import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicShell } from '@/components/PublicShell';
import { Button } from '@/components/ui/button';
import { Bound } from '@/components/blocks/Bound';
import { FieldErrorSummary } from '@/components/blocks/FieldErrorSummary';
import { LoadProblem } from '@/components/blocks/LoadProblem';
import { tx } from '@/i18n';
import {
  loadPublicPagesConfig,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useLiveList,
  useStepForm,
  useJourneySubmit,
  useVisitorKey,
  newRecordKey,
  rememberSubmission,
  freshRef,
  fieldRef,
  fieldText,
} from '@/lib/journey';

const SLUG = 'feedback-geben';

function FeedbackForm({ cfg, page }: { cfg: PublicPagesConfig; page: PublicPageConfig }) {
  const port = useMemo(() => createPublicPort(cfg, page), [cfg, page]);
  const kuerzel = useVisitorKey({ length: 5 });
  const sendKey = useRef(newRecordKey());

  const live = useLiveList(port, 'interaktionen', { intervalMs: 20000 });
  const active = live.records[0] ?? null;
  const activeId = active?.id ?? null;
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;
  const activeRef = useRef(active);
  activeRef.current = active;

  const form = useStepForm('feedbacks', {
    fields: ['feedback_text'],
    required: { feedback_text: true },
    autoComplete: true,
  });

  const submit = useJourneySubmit(
    port,
    [
      {
        key: 'feedback',
        entity: 'feedbacks',
        form,
        primary: true,
        values: () => ({
          interaktion: activeIdRef.current ?? '',
          kuerzel: kuerzel,
          sendekennung: sendKey.current,
        }),
      },
    ],
    {
      draftKey: SLUG,
      check: async () => {
        const id = activeIdRef.current;
        if (!id) return tx('Gerade ist keine Frage offen.');
        // the read is scoped to the active interaction: still listed = still active
        if (!(await port.get('interaktionen', id))) {
          return tx('Inzwischen ist eine andere Frage dran.');
        }
        const shown = activeRef.current ? fieldRef(activeRef.current, 'veranstaltung') : null;
        const fresh = await freshRef(port, 'interaktionen', id, 'veranstaltung');
        return shown && fresh && shown !== fresh ? tx('Inzwischen ist eine andere Frage dran.') : null;
      },
      onSuccess: result => {
        rememberSubmission('feedbacks', [result.primary.id], sendKey.current);
      },
    },
  );

  const [sentCode, setSentCode] = useState<string | null>(null);
  useEffect(() => {
    if (submit.result) setSentCode(kuerzel);
  }, [submit.result, kuerzel]);

  const again = () => {
    sendKey.current = newRecordKey();
    form.reset();
    submit.reset();
    setSentCode(null);
  };

  if (!live.loaded && live.error) return <LoadProblem onRetry={live.reload} />;

  if (submit.result) {
    return (
      <div data-journey-success="" className="space-y-4">
        <p className="text-lg font-semibold">{tx('Danke für dein Feedback!')}</p>
        <p className="text-sm text-muted-foreground">
          {tx('Dein Kürzel für diese Veranstaltung:')}
        </p>
        <p className="text-3xl font-mono font-bold tracking-widest">{sentCode ?? kuerzel}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11" data-journey-again="" onClick={again}>
            {tx('Weiteres Feedback geben')}
          </Button>
        </div>
        <p className="text-sm">
          <Link className="underline" to="/public/abschlussbewertung">
            {tx('Zur Abschlussbewertung')}
          </Link>
        </p>
      </div>
    );
  }

  if (!live.loaded) return <p className="text-sm text-muted-foreground">{tx('Lädt …')}</p>;

  if (!active) {
    return (
      <p className="text-sm text-muted-foreground">
        {tx('Gerade ist keine Frage offen. Diese Seite aktualisiert sich von selbst.')}
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={e => {
        e.preventDefault();
        if (!form.validate()) return;
        void submit.run();
      }}
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold whitespace-pre-line">{fieldText(active, 'frage')}</h2>
        {fieldText(active, 'erlaeuterung') && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {fieldText(active, 'erlaeuterung')}
          </p>
        )}
      </div>
      <Bound form={form} name="feedback_text" rows={5} />
      <FieldErrorSummary forms={[form]} />
      {submit.error && !submit.offline && (
        <p role="alert" className="text-sm text-destructive">
          {submit.error.message}
        </p>
      )}
      {submit.limited && (
        <p className="text-sm text-muted-foreground">
          {tx('Gerade viele Teilnehmende … wir senden gleich noch einmal.')}
        </p>
      )}
      <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={submit.submitting}>
        {tx('Absenden')}
      </Button>
    </form>
  );
}

export default function FeedbackGeben() {
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

  return (
    <PublicShell title={page.title} description={page.description}>
      <FeedbackForm cfg={cfg} page={page} />
    </PublicShell>
  );
}
