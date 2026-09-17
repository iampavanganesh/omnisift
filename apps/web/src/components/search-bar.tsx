"use client";

import { useEffect, useId, useRef, useState } from "react";
import { env } from "@/lib/env";

const RECENT_KEY = "omnisift_recent_searches";
const MAX_RECENT = 6;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const existing = readRecent().filter((q) => q.toLowerCase() !== query.toLowerCase());
    const next = [query, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, quota) — recent searches just won't persist.
  }
}

/**
 * Reusable search input used in the header, home hero, and the search page
 * itself — one component, one behavior everywhere. Progressively enhanced:
 * the underlying element is a real `<form action="/search" method="get">`
 * with a named `q` input, so it works identically with JS disabled/slow;
 * the dropdown (live suggestions + recent searches) only layers on top.
 *
 * Suggestions come from the backend's real `/search/suggestions` endpoint
 * (free Google autocomplete, no fabricated data) — fetched directly from the
 * browser via `env.publicApiUrl`, the same env var already documented for
 * browser-direct calls (see affiliate redirect links). Recent searches are
 * real past queries from THIS browser (localStorage), never invented.
 */
export function SearchBar({
  defaultValue = "",
  placeholder = "Search products, brands and more...",
  formClassName,
}: {
  defaultValue?: string;
  placeholder?: string;
  formClassName: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR — this deliberately hydrates
    // client-only state once mounted (avoids a server/client render mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(readRecent());
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // Debounced-fetch synchronization: clears stale suggestions when the
      // query shrinks below the fetch threshold, not a derivable render value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      fetch(`${env.publicApiUrl}/search/suggestions?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          if (Array.isArray(body?.data)) setSuggestions(body.data as string[]);
        })
        .catch(() => {
          // A stale/aborted or failed suggestions call just means no dropdown
          // content — never blocks the real form submission below.
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const showRecent = query.trim().length === 0 && recent.length > 0;
  const list = showRecent ? recent : suggestions;

  function submitWith(value: string) {
    saveRecent(value);
    setQuery(value);
    setOpen(false);
    // Let the native form submission navigate (GET /search?q=...) — same path
    // as a plain Enter press or the Search button, no client-side routing.
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || list.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? list.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      submitWith(list[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <form ref={formRef} action="/search" className={formClassName} role="search" autoComplete="off">
      <div className="search-bar-field">
        <input
          ref={inputRef}
          type="search"
          name="q"
          role="combobox"
          aria-expanded={open && list.length > 0}
          aria-controls={listId}
          aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
          aria-autocomplete="list"
          aria-label={placeholder}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={handleKeyDown}
          onSubmit={() => saveRecent(query)}
        />
        {open && list.length > 0 && (
          <ul id={listId} role="listbox" className="search-suggestions">
            {showRecent && <li className="search-suggestions-label">Recent searches</li>}
            {list.map((item, i) => (
              <li key={item} role="presentation">
                <button
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === highlighted}
                  type="button"
                  className={i === highlighted ? "search-suggestion-active" : undefined}
                  // onMouseDown (not onClick) fires before the input's onBlur closes the list.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submitWith(item);
                  }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" onClick={() => saveRecent(query)}>
        Search
      </button>
    </form>
  );
}
