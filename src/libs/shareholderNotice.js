/**
 * The shareholder notice shown while dividend data viewing is closed.
 *
 * The whole notice is stored as one JSON document inside the settings row that
 * already holds the closure message (system_settings.shareholder_data_viewing_note),
 * so no new table or column is introduced — only the value column needs to be wide
 * enough for it (varchar(500) -> text).
 *
 * Older installs saved a plain sentence there. parseNotice() keeps reading those as
 * a legacy message so nothing breaks until an admin saves the structured notice.
 */

export const NOTICE_SCHEMA_VERSION = 1;

/** Every field the card knows how to render, with the sample wording as defaults. */
export const DEFAULT_NOTICE = {
  v: NOTICE_SCHEMA_VERSION,
  orgName: 'Awash Insurance S.C.',
  meetingTitle: 'Annual General Meeting (AGM)',
  badge: 'IMPORTANT SHAREHOLDER NOTICE',
  greeting: 'Dear Shareholder,',
  intro:
    'You are hereby notified that the Annual General Meeting (AGM) of Awash Insurance S.C. is scheduled to take place as follows:',
  meetingDate: '',
  meetingTime: '',
  venue: '',
  agendaHeading: 'Meeting Agenda',
  agenda: [],
  attendanceNote:
    "All shareholders are kindly requested to attend and actively participate in the discussions and decisions concerning the company's affairs.",
  accessHeading: 'Shareholder Information Access',
  accessMessage:
    'Detailed AGM-related shareholder information and documents are currently unavailable. Access will be enabled on and after:',
  accessEnabledOn: '',
  accessFootnote:
    'Please revisit this section after the date indicated above to access the available information.',
  closing: 'Thank you for your continued trust and support.',
  signoff: 'Awash Insurance S.C.',
};

const TEXT_FIELDS = [
  'orgName', 'meetingTitle', 'badge', 'greeting', 'intro',
  'meetingDate', 'meetingTime', 'venue', 'agendaHeading', 'attendanceNote',
  'accessHeading', 'accessMessage', 'accessEnabledOn', 'accessFootnote',
  'closing', 'signoff',
];

/** Merge a partial notice onto the defaults, trimming text and cleaning agenda rows. */
export function normalizeNotice(input = {}) {
  const out = { ...DEFAULT_NOTICE, ...input };
  out.v = NOTICE_SCHEMA_VERSION;
  for (const key of TEXT_FIELDS) {
    out[key] = typeof out[key] === 'string' ? out[key] : '';
  }
  out.agenda = Array.isArray(input.agenda)
    ? input.agenda.map((line) => String(line).trim()).filter(Boolean)
    : [];
  return out;
}

/**
 * Read the stored setting value.
 * @returns {{ notice: object|null, legacyText: string }}
 *   notice is a full normalized notice when the value is our JSON;
 *   legacyText carries a pre-structure plain message so it still renders.
 */
export function parseNotice(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) return { notice: null, legacyText: '' };

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && parsed.v) {
        return { notice: normalizeNotice(parsed), legacyText: '' };
      }
    } catch {
      // Not valid JSON — fall through and treat it as a legacy plain message.
    }
  }

  return { notice: null, legacyText: trimmed };
}

/** Serialize an editor notice for storage. */
export function serializeNotice(notice) {
  return JSON.stringify(normalizeNotice(notice));
}

/**
 * A short single-line form of the notice, used as the 403 `message` so anything
 * that only understands a plain string (logs, toasts, older screens) still reads
 * sensibly.
 */
export function noticeSummaryText(notice) {
  if (!notice) return '';
  const when = notice.accessEnabledOn ? ` Access will be enabled on and after ${notice.accessEnabledOn}.` : '';
  return `${notice.accessMessage || 'Shareholder information is currently unavailable.'}${when}`.trim();
}
