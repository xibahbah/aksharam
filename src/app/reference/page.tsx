"use client";
import { Suspense, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, X, Bookmark, ArrowRight, Info } from "lucide-react";
import { categories, letters, sources } from "@/data/alphabet";
import { useProgress } from "@/hooks/use-progress";
import type { Letter, Category } from "@/types";
import { PageHeading } from "@/components/ui";
import { LetterGrid } from "@/components/letter-grid";
import { AudioButton } from "@/components/audio-button";
import { SyllableBuilder } from "@/components/syllable-builder";
import { unitOfLetter, units } from "@/data/curriculum";
import { strength, strengthNames, unitStates } from "@/lib/lesson";
export default function Reference() {
  return (
    <Suspense fallback={<p role="status">Loading the alphabet…</p>}>
      <ReferenceView />
    </Suspense>
  );
}
const collections = new Set<string>(categories.map((c) => c.id));
function ReferenceView() {
  // Collection and search live in the address, so refresh and links keep them.
  const params = useSearchParams();
  const [search, setSearchState] = useState(params.get("q") ?? "");
  const initial = params.get("collection") ?? "all";
  const [category, setCategoryState] = useState<Category | "all">(
    collections.has(initial) ? (initial as Category) : "all",
  );
  function syncUrl(next: { q?: string; collection?: string }) {
    const url = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next))
      if (v && v !== "all") url.set(k, v);
      else url.delete(k);
    const query = url.toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname,
    );
  }
  const setSearch = (q: string) => {
    setSearchState(q);
    syncUrl({ q });
  };
  const setCategory = (c: Category | "all") => {
    setCategoryState(c);
    syncUrl({ collection: c });
  };
  const [selected, setSelected] = useState<Letter | null>(null);
  const [rare, setRare] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const { progress, favorite } = useProgress();
  useEffect(() => {
    if (selected) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [selected]);
  const query = search.toLocaleLowerCase().normalize("NFC");
  const filtered = letters.filter(
    (l) =>
      (category === "all" || l.category === category) &&
      (rare || l.usage === "core") &&
      [l.glyph, l.romanization, l.approximation ?? "", l.note, l.subgroup].some(
        (v) => v.toLocaleLowerCase().normalize("NFC").includes(query),
      ),
  );
  return (
    <>
      <PageHeading title="Alphabet" />
      <details className="reference-intro">
        <summary>How Malayalam letters combine</summary>
        <div>
          <h3>Inherent vowels and vowel signs</h3>
          <p>
            Malayalam is an abugida: a consonant such as{" "}
            <span lang="ml">ക</span> (ka) includes a short a. A vowel sign
            changes it: <span lang="ml">കാ</span> (kā). A virama joins
            consonants, as in <span lang="ml">ക്ക</span> (kka), or removes that
            inherent vowel.
          </p>
        </div>
        <div className="intro-example" lang="ml">
          <span>
            ക<small>ka</small>
          </span>
          <b>+</b>
          <span>
            ◌ാ<small>ā sign</small>
          </span>
          <b>=</b>
          <span>
            കാ<small>kā</small>
          </span>
        </div>
      </details>
      <SyllableBuilder />
      <div className="reference-controls">
        <div className="search-box">
          <Search size={19} />
          <label className="sr-only" htmlFor="letter-search">
            Search the alphabet
          </label>
          <input
            id="letter-search"
            name="letter-search"
            type="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search: ക, ṇa, retroflex…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={17} />
            </button>
          )}
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rare}
            onChange={(e) => setRare(e.target.checked)}
          />{" "}
          Show uncommon & historic
        </label>
      </div>
      <div
        className="filter-tabs"
        role="group"
        aria-label="Filter alphabet by category"
      >
        <button
          className={category === "all" ? "active" : ""}
          onClick={() => setCategory("all")}
        >
          All collections
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={category === c.id ? "active" : ""}
            onClick={() => setCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="reference-count">{filtered.length} entries</div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={28} />
          <h2>No letters found.</h2>
          <p>
            Try a glyph, an accented romanization, or a sound like “retroflex”.
          </p>
        </div>
      )}
      {categories
        .filter((c) => filtered.some((l) => l.category === c.id))
        .map((c) => (
          <section className="reference-group" key={c.id}>
            <div className="section-header">
              <div>
                <h2>
                  {c.name}
                  <span lang="ml">{c.malayalam}</span>
                </h2>
                <p>
                  {c.description}
                  {c.id === "signs"
                    ? " · Dotted circles are placeholders, not part of the sign."
                    : c.id === "conjuncts"
                      ? " · A selected practice set, not a complete list of combinations."
                      : ""}
                </p>
              </div>
              <span className={`count-badge ${c.color}`}>
                {filtered.filter((l) => l.category === c.id).length} entries
              </span>
            </div>
            <LetterGrid
              letters={filtered.filter((l) => l.category === c.id)}
              onSelect={setSelected}
              strength={(id) => strength(progress, id)}
            />
          </section>
        ))}
      <div className="reference-notes panel">
        <Info size={22} />
        <div>
          <h3>How many letters are there?</h3>
          <p>
            Counts vary with convention: modern core letters, Sanskrit vocalic
            forms, chillus, and historical characters may be counted
            differently. Vowel signs are dependent marks; conjuncts are
            combinations, so there is no finite list of every possible “letter.”
            Numerals, fractions, and measurement symbols are outside this
            learning deck.
          </p>
          <p>
            Romanization uses ISO 15919-style distinctions. English sound cues
            are approximate; they do not replace listening to a native speaker.
            Historic signs without a settled teaching romanization use a
            descriptive notation.
          </p>
          <div className="source-links">
            {sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.name} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="letter-dialog"
        aria-labelledby="letter-detail-title"
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelected(null);
        }}
      >
        {selected && (
          <>
            <div className="dialog-top">
              <span className="eyebrow">
                {categories.find((c) => c.id === selected.category)?.name} ·{" "}
                {selected.usage}
              </span>
              <button
                className="icon-button"
                aria-label="Close letter details"
                onClick={() => setSelected(null)}
              >
                <X size={21} />
              </button>
            </div>
            <span className="detail-glyph" lang="ml">
              {selected.display}
            </span>
            <h2 id="letter-detail-title">{selected.romanization}</h2>
            <p className="eyebrow">
              {strengthNames[strength(progress, selected.id)]}
            </p>
            {selected.approximation && (
              <p className="pronunciation">{selected.approximation}</p>
            )}
            <div className="detail-note">
              <strong>{selected.subgroup}</strong>
              <p>{selected.note}</p>
            </div>
            {selected.category === "signs" && (
              <p className="combined-example" lang="ml">
                ക + {selected.display} → ക{selected.glyph}
              </p>
            )}
            <AudioButton key={selected.id} letter={selected} />
            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => favorite(selected.id)}
              >
                <Bookmark
                  size={17}
                  fill={
                    progress.favorites.includes(selected.id)
                      ? "currentColor"
                      : "none"
                  }
                />
                {progress.favorites.includes(selected.id)
                  ? "Saved for review"
                  : "Save for review"}
              </button>
              {(() => {
                const unit = unitOfLetter[selected.id];
                const state = unit ? unitStates(progress)[unit.id] : "locked";
                const label = `${unit?.extra ? "Extra unit" : `Unit ${units.indexOf(unit) + 1}`}: ${unit?.title}`;
                return state === "locked" ? (
                  <p className="muted">Taught in {label}.</p>
                ) : (
                  <Link
                    className="button primary"
                    href={`/learn?mode=unit&unit=${unit.id}`}
                    onClick={() => setSelected(null)}
                  >
                    {state === "done" ? "Practise" : "Learn"} {label}{" "}
                    <ArrowRight size={16} />
                  </Link>
                );
              })()}
            </div>
            <small className="unicode-note">
              Unicode:{" "}
              {Array.from(selected.glyph)
                .map(
                  (c) =>
                    `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`,
                )
                .join(" · ")}
            </small>
          </>
        )}
      </dialog>
    </>
  );
}
