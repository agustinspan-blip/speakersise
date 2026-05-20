"use client";

import React, { useState, type ReactNode } from "react";
import type { BrandTheme } from "@/lib/brands";

/**
 * Client wrapper that progressively reveals catalog cards.
 *
 * Receives every card pre-rendered as children (server-side) and slices the
 * array on the client according to the current `visible` count. A "Show more"
 * button bumps the count by `step` until the full list is exposed.
 *
 * Pre-rendering on the server keeps SEO + first paint cheap; the only
 * client-side work is the boolean state for visibility.
 */
export function CatalogList({
  children,
  initialCount,
  step,
  showMoreLabel,
  theme,
}: {
  children: ReactNode;
  initialCount: number;
  step: number;
  showMoreLabel: string;
  theme: BrandTheme;
}) {
  const [visible, setVisible] = useState(initialCount);
  const all = React.Children.toArray(children);
  const visibleCards = all.slice(0, visible);
  const hasMore = visible < all.length;

  return (
    <>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards}
      </ul>
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() =>
              setVisible((v) => Math.min(v + step, all.length))
            }
            className={`h-11 px-6 rounded-full ${theme.ctaBg} text-white transition-colors text-sm font-medium`}
          >
            {showMoreLabel}
          </button>
        </div>
      )}
    </>
  );
}
