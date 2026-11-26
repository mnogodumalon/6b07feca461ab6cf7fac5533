import type { Veranstaltungen, Interaktionen, Teilnehmende, Abschlussbewertungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface VeranstaltungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Veranstaltungen;
  /** 1:N „Interaktionen" (veranstaltung): VOLLE Liste — der Block filtert auf diesen Record. */
  interaktionenList: Interaktionen[];
  /** Zeilen-Klick → overlay.push auf das Interaktionen-Detail (nie der Edit-Dialog). */
  onOpenInteraktionen: (record: Interaktionen) => void;
  /** Kontextuelles „+": öffnet den Interaktionen-Dialog mit diesem Record vorgesetzt. */
  onAddInteraktionen?: () => void;
  /** 1:N „Teilnehmende" (veranstaltung): VOLLE Liste — der Block filtert auf diesen Record. */
  teilnehmendeList: Teilnehmende[];
  /** Zeilen-Klick → overlay.push auf das Teilnehmende-Detail (nie der Edit-Dialog). */
  onOpenTeilnehmende: (record: Teilnehmende) => void;
  /** Kontextuelles „+": öffnet den Teilnehmende-Dialog mit diesem Record vorgesetzt. */
  onAddTeilnehmende?: () => void;
  /** 1:N „Abschlussbewertungen" (veranstaltung): VOLLE Liste — der Block filtert auf diesen Record. */
  abschlussbewertungenList: Abschlussbewertungen[];
  /** Zeilen-Klick → overlay.push auf das Abschlussbewertungen-Detail (nie der Edit-Dialog). */
  onOpenAbschlussbewertungen: (record: Abschlussbewertungen) => void;
  /** Kontextuelles „+": öffnet den Abschlussbewertungen-Dialog mit diesem Record vorgesetzt. */
  onAddAbschlussbewertungen?: () => void;
}

export function VeranstaltungenDetails({
  record,
  interaktionenList,
  onOpenInteraktionen,
  onAddInteraktionen,
  teilnehmendeList,
  onOpenTeilnehmende,
  onAddTeilnehmende,
  abschlussbewertungenList,
  onOpenAbschlussbewertungen,
  onAddAbschlussbewertungen,
}: VeranstaltungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('veranstaltungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('veranstaltungen', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('veranstaltungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('interaktionen')}
        items={interaktionenList.filter(r => extractRecordId(r.fields.veranstaltung) === record.record_id)}
        map={r => ({ name: displayNameOf('interaktionen', r.fields as Record<string, unknown>) || appLabel('interaktionen'), meta: undefined })}
        onOpen={onOpenInteraktionen}
        onAdd={onAddInteraktionen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('teilnehmende')}
        items={teilnehmendeList.filter(r => extractRecordId(r.fields.veranstaltung) === record.record_id)}
        map={r => ({ name: displayNameOf('teilnehmende', r.fields as Record<string, unknown>) || appLabel('teilnehmende'), meta: undefined })}
        onOpen={onOpenTeilnehmende}
        onAdd={onAddTeilnehmende}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('abschlussbewertungen')}
        items={abschlussbewertungenList.filter(r => extractRecordId(r.fields.veranstaltung) === record.record_id)}
        map={r => ({ name: displayNameOf('abschlussbewertungen', r.fields as Record<string, unknown>) || appLabel('abschlussbewertungen'), meta: undefined })}
        onOpen={onOpenAbschlussbewertungen}
        onAdd={onAddAbschlussbewertungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.VERANSTALTUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('veranstaltungen')} />
    </>
  );
}
