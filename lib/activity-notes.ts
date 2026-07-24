// The universal workout logger encodes its category/sub-label into `notes`
// as "Category · Label" (optionally followed by " · " and the user's own
// note), since the DB only stores a coarse `type` (e.g. WEIGHTS covers both
// "Push" and "Full Body"). Parse that back out so views can show
// "Cardio: Walk" instead of duplicating the label in the title and notes.
// Keep in sync with GROUPS in components/ActivityLogger.tsx.
const LOGGER_CATEGORIES = ['Strength', 'Cardio', 'Calisthenics'];
const LOGGER_NOTES_PATTERN = new RegExp(`^(${LOGGER_CATEGORIES.join('|')}) · ([^·]+?)(?: · ([\\s\\S]*))?$`);

export interface ParsedLoggerNotes {
  category: string;
  label: string;
  extra: string | null;
}

export function parseLoggerNotes(notes: string | null): ParsedLoggerNotes | null {
  if (!notes) return null;
  const match = notes.match(LOGGER_NOTES_PATTERN);
  if (!match) return null;
  const [, category, label, extra] = match;
  return { category, label: label.trim(), extra: extra?.trim() || null };
}

// The logger writes one Activity row per exercise picked in a single session,
// all sharing a byte-identical activityDate (and the same free-text note). The
// schema has no session id, so that shared timestamp is the only link — good
// enough because the feed is ordered by activityDate, which keeps a session's
// rows adjacent. Collapse those runs so a four-exercise workout doesn't repeat
// the user's comment four times.
export interface SessionRow {
  user: { id: string };
  activityDate: string;
}

export function groupSessions<T extends SessionRow>(activities: T[]): T[][] {
  return activities.reduce<T[][]>((groups, activity) => {
    const current = groups.at(-1);
    const anchor = current?.[0];

    if (anchor && anchor.user.id === activity.user.id && anchor.activityDate === activity.activityDate) {
      current.push(activity);
    } else {
      groups.push([activity]);
    }

    return groups;
  }, []);
}
