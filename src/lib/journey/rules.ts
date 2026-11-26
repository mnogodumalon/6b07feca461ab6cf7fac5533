/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'veranstaltungen' | 'interaktionen' | 'teilnehmende' | 'feedbacks' | 'zusammenfassungen' | 'abschlussbewertungen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "veranstaltungen": "titel" | "beschreibung";
  "interaktionen": "frage" | "erlaeuterung" | "vorprompt" | "endprompt";
  "teilnehmende": "kuerzel" | "email";
  "feedbacks": "kuerzel" | "feedback_text" | "sendekennung";
  "zusammenfassungen": "zusammenfassung_text" | "ki_antwort";
  "abschlussbewertungen": "kuerzel" | "besonders_toll" | "verbesserungen" | "referenzstatement" | "email";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "veranstaltungen": never;
  "interaktionen": "veranstaltung";
  "teilnehmende": "veranstaltung";
  "feedbacks": "interaktion";
  "zusammenfassungen": "interaktion";
  "abschlussbewertungen": "veranstaltung";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "veranstaltungen": {
    "key": "veranstaltungen",
    "appId": "6b07feab1c26f382dcd85056",
    "label": "Veranstaltungen",
    "pascal": "Veranstaltungen",
    "single": "VeranstaltungenEntry"
  },
  "interaktionen": {
    "key": "interaktionen",
    "appId": "6b07feb0c2d6ab7b2b42f3a7",
    "label": "Interaktionen",
    "pascal": "Interaktionen",
    "single": "InteraktionenEntry"
  },
  "teilnehmende": {
    "key": "teilnehmende",
    "appId": "6b07feb1b674dd8b790a68eb",
    "label": "Teilnehmende",
    "pascal": "Teilnehmende",
    "single": "TeilnehmendeEntry"
  },
  "feedbacks": {
    "key": "feedbacks",
    "appId": "6b07feb2ed2ccef7f54218f4",
    "label": "Feedbacks",
    "pascal": "Feedbacks",
    "single": "Feedback"
  },
  "zusammenfassungen": {
    "key": "zusammenfassungen",
    "appId": "6b07feb298e9482edb6cdda0",
    "label": "Zusammenfassungen",
    "pascal": "Zusammenfassungen",
    "single": "ZusammenfassungenEntry"
  },
  "abschlussbewertungen": {
    "key": "abschlussbewertungen",
    "appId": "6b07feb3ef7df4ee89d9084f",
    "label": "Abschlussbewertungen",
    "pascal": "Abschlussbewertungen",
    "single": "AbschlussbewertungenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "veranstaltungen": {
    "titel": {
      "key": "titel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Titel",
      "writable": true,
      "maxLength": 4000
    },
    "datum": {
      "key": "datum",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Datum",
      "writable": true
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    }
  },
  "interaktionen": {
    "veranstaltung": {
      "key": "veranstaltung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltung",
      "writable": true,
      "targetAppId": "6b07feab1c26f382dcd85056",
      "targetEntity": "veranstaltungen"
    },
    "reihenfolge": {
      "key": "reihenfolge",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Reihenfolge",
      "writable": true
    },
    "frage": {
      "key": "frage",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Frage",
      "writable": true
    },
    "erlaeuterung": {
      "key": "erlaeuterung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Erläuterung",
      "writable": true
    },
    "vorprompt": {
      "key": "vorprompt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Vorprompt",
      "writable": true
    },
    "endprompt": {
      "key": "endprompt",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Endprompt",
      "writable": true
    },
    "aktiv": {
      "key": "aktiv",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Aktiv",
      "writable": true
    }
  },
  "teilnehmende": {
    "einwilligung": {
      "key": "einwilligung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Ich willige ein, dass mir eine persönliche Auswertung per E-Mail gesendet wird",
      "writable": true
    },
    "veranstaltung": {
      "key": "veranstaltung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltung",
      "writable": true,
      "targetAppId": "6b07feab1c26f382dcd85056",
      "targetEntity": "veranstaltungen"
    },
    "kuerzel": {
      "key": "kuerzel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kürzel",
      "writable": true,
      "maxLength": 4000
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail-Adresse",
      "writable": true,
      "autoComplete": "email"
    }
  },
  "feedbacks": {
    "interaktion": {
      "key": "interaktion",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Interaktion",
      "writable": true,
      "targetAppId": "6b07feb0c2d6ab7b2b42f3a7",
      "targetEntity": "interaktionen"
    },
    "kuerzel": {
      "key": "kuerzel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kürzel",
      "writable": true,
      "maxLength": 4000
    },
    "feedback_text": {
      "key": "feedback_text",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Dein Feedback",
      "writable": true
    },
    "sendekennung": {
      "key": "sendekennung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Eindeutige Kennung des Absendens",
      "writable": true,
      "maxLength": 4000
    }
  },
  "zusammenfassungen": {
    "interaktion": {
      "key": "interaktion",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Interaktion",
      "writable": true,
      "targetAppId": "6b07feb0c2d6ab7b2b42f3a7",
      "targetEntity": "interaktionen"
    },
    "erstellt_am": {
      "key": "erstellt_am",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Erstellt am",
      "writable": true
    },
    "zusammenfassung_text": {
      "key": "zusammenfassung_text",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Zusammenfassung",
      "writable": true
    },
    "ki_antwort": {
      "key": "ki_antwort",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Antwort der KI",
      "writable": true
    }
  },
  "abschlussbewertungen": {
    "veranstaltung": {
      "key": "veranstaltung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Veranstaltung",
      "writable": true,
      "targetAppId": "6b07feab1c26f382dcd85056",
      "targetEntity": "veranstaltungen"
    },
    "kuerzel": {
      "key": "kuerzel",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Kürzel",
      "writable": true,
      "maxLength": 4000
    },
    "besonders_toll": {
      "key": "besonders_toll",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Was war besonders toll?",
      "writable": true
    },
    "verbesserungen": {
      "key": "verbesserungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Was kann verbessert werden?",
      "writable": true
    },
    "referenzstatement": {
      "key": "referenzstatement",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Referenzstatement",
      "writable": true
    },
    "email": {
      "key": "email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail-Adresse (freiwillig)",
      "writable": true,
      "autoComplete": "email"
    },
    "einwilligung": {
      "key": "einwilligung",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Ich willige ein, dass mir eine persönliche Auswertung per E-Mail gesendet wird",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "veranstaltungen": [],
  "interaktionen": [
    {
      "kind": "record",
      "field": "veranstaltung",
      "targetEntity": "veranstaltungen"
    }
  ],
  "teilnehmende": [
    {
      "kind": "record",
      "field": "veranstaltung",
      "targetEntity": "veranstaltungen"
    }
  ],
  "feedbacks": [
    {
      "kind": "record",
      "field": "interaktion",
      "targetEntity": "interaktionen"
    }
  ],
  "zusammenfassungen": [
    {
      "kind": "record",
      "field": "interaktion",
      "targetEntity": "interaktionen"
    }
  ],
  "abschlussbewertungen": [
    {
      "kind": "record",
      "field": "veranstaltung",
      "targetEntity": "veranstaltungen"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "veranstaltungen": [
    "titel"
  ],
  "interaktionen": [
    "frage"
  ],
  "teilnehmende": [
    "kuerzel"
  ],
  "feedbacks": [
    "kuerzel"
  ],
  "zusammenfassungen": [
    "zusammenfassung_text"
  ],
  "abschlussbewertungen": [
    "kuerzel"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
/** A date reads as a date (a target whose only readable fields are `beginn`/`ende` — Doodle KB 6),
 *  a number as a number; a record URL or a bare id is never a name (0.0.389). */
export function displayPart(v: unknown): string {
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDate(s);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return formatDateTime(s);
    if (/^https?:\/\//.test(s) || /^[0-9a-f]{24}$/i.test(s)) return '';
    return s;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

/** „Nicht ausgefüllt“ for a required field, by its kind: a checkbox that is
 *  `false` is NOT filled — the person did not consent (live 03.11.2026: a
 *  consent page validated with the box unticked and the grant took it). Every
 *  other kind is isEmptyValue. */
export function isUnfilled(entity: EntityKey, key: string, v: unknown): boolean {
  if (ruleOf(entity, key)?.kind === 'bool') return v !== true;
  return isEmptyValue(v);
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
