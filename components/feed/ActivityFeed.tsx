"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ActivityItem } from "@/lib/dashboard/types";
import {
  ACTIVITY_TONE_STYLES,
  formatActivityTime,
  inferActivityTone,
  sortActivitiesNewestFirst,
} from "./activity-utils";

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

function ActivityIcon({ tone }: { tone: keyof typeof ACTIVITY_TONE_STYLES }) {
  const cls = ACTIVITY_TONE_STYLES[tone].icon;
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 ${cls}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const newIdsRef = useRef<Set<string>>(new Set());

  const sorted = useMemo(
    () => sortActivitiesNewestFirst(activities),
    [activities],
  );

  useEffect(() => {
    const seen = seenRef.current;
    const fresh = new Set<string>();
    for (const item of sorted) {
      if (!seen.has(item.id)) {
        fresh.add(item.id);
        seen.add(item.id);
      }
    }
    newIdsRef.current = fresh;
    if (fresh.size > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [sorted]);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-950/50 backdrop-blur-sm">
      <header className="shrink-0 border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-zinc-100">Live activity</h2>
          <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="h-1 w-1 rounded-full bg-emerald-400 agent-live-dot" />
            Real-time
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-zinc-600">
          Agent workflow events · newest first
        </p>
      </header>

      <div
        ref={scrollRef}
        className="activity-feed-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2"
      >
        {loading && sorted.length === 0 ? (
          <ul className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <li
                key={i}
                className="animate-pulse rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="h-2 w-12 rounded bg-zinc-800" />
                <div className="mt-2 h-3 w-full rounded bg-zinc-800/80" />
              </li>
            ))}
          </ul>
        ) : null}

        {!loading && sorted.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-zinc-600">
            Waiting for agent activity…
          </p>
        ) : null}

        {sorted.length > 0 ? (
          <ul className="space-y-1.5">
            {sorted.map((item, index) => {
              const tone = inferActivityTone(item.message);
              const styles = ACTIVITY_TONE_STYLES[tone];
              const isNew = newIdsRef.current.has(item.id) && index < 3;

              return (
                <li
                  key={item.id}
                  className={[
                    "activity-feed-item rounded-lg border bg-white/[0.02] px-2.5 py-2 transition-colors duration-300",
                    styles.border,
                    isNew ? "activity-feed-item-new" : "",
                  ].join(" ")}
                >
                  <div className="flex gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <ActivityIcon tone={tone} />
                        <time
                          className="shrink-0 font-mono text-[9px] tabular-nums text-zinc-600"
                          dateTime={item.created_at}
                        >
                          {formatActivityTime(item.created_at)}
                        </time>
                      </div>
                      <p className="text-[11px] leading-snug text-zinc-300">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
