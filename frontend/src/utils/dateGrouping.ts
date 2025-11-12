/**
 * Date grouping utilities for organizing conversations by time periods
 */

export interface GroupedConversations<T> {
  today: T[];
  yesterday: T[];
  previous7Days: T[];
  previous30Days: T[];
  older: T[];
}

export type GroupLabel = keyof GroupedConversations<unknown>;

export const GROUP_LABELS: Record<GroupLabel, string> = {
  today: "Today",
  yesterday: "Yesterday",
  previous7Days: "Previous 7 Days",
  previous30Days: "Previous 30 Days",
  older: "Older",
};

/**
 * Groups conversations by time periods based on their updatedAt timestamp
 * @param conversations Array of conversations with updatedAt timestamp
 * @returns Grouped conversations object
 */
export function groupConversationsByDate<T extends { updatedAt: number }>(
  conversations: T[]
): GroupedConversations<T> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

  const grouped: GroupedConversations<T> = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  };

  conversations.forEach((conversation) => {
    const timestamp = conversation.updatedAt;

    if (timestamp >= todayStart) {
      grouped.today.push(conversation);
    } else if (timestamp >= yesterdayStart) {
      grouped.yesterday.push(conversation);
    } else if (timestamp >= sevenDaysAgo) {
      grouped.previous7Days.push(conversation);
    } else if (timestamp >= thirtyDaysAgo) {
      grouped.previous30Days.push(conversation);
    } else {
      grouped.older.push(conversation);
    }
  });

  return grouped;
}

/**
 * Get all non-empty groups in order
 * @param grouped Grouped conversations object
 * @returns Array of [groupKey, conversations] tuples for non-empty groups
 */
export function getNonEmptyGroups<T>(
  grouped: GroupedConversations<T>
): Array<[GroupLabel, T[]]> {
  const order: GroupLabel[] = [
    "today",
    "yesterday",
    "previous7Days",
    "previous30Days",
    "older",
  ];

  return order
    .map((key) => [key, grouped[key]] as [GroupLabel, T[]])
    .filter(([, items]) => items.length > 0);
}
