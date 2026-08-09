"use client";

import { useState } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import {
  CATEGORY_OPTIONS,
  activeRefineCount,
  type RecordFilters,
} from "@/lib/cadres";

interface FilterPanelProps {
  filters: RecordFilters;
  /** Real distinct thana values from GET /cadres/facets -- never hardcoded. */
  thanaOptions: string[];
  onSearch: (value: string) => void;
  onToggle: (group: "category" | "thana", value: string) => void;
  onClear: () => void;
}

interface Group {
  key: "category" | "thana";
  title: string;
  options: { value: string; label: string }[];
}

export default function FilterPanel({ filters, thanaOptions, onSearch, onToggle, onClear }: FilterPanelProps) {
  const GROUPS: Group[] = [
    { key: "category", title: "श्रेणी", options: CATEGORY_OPTIONS as { value: string; label: string }[] },
    { key: "thana", title: "थाना", options: thanaOptions.map((t) => ({ value: t, label: t })) },
  ];
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["श्रेणी", "थाना"]));

  const toggleGroup = (title: string) => {
    const next = new Set(expanded);
    next.has(title) ? next.delete(title) : next.add(title);
    setExpanded(next);
  };

  const isChecked = (key: "category" | "thana", value: string) =>
    (filters[key] as string[]).includes(value);

  const refineCount = activeRefineCount(filters);

  return (
    <div
      style={{
        width: "264px",
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "var(--space-5) var(--space-4)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-5)",
      }}
    >
      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search
          size={15}
          strokeWidth={1.75}
          color="var(--text-tertiary)"
          style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="नाम, थाना… (@उपनाम)"
          className="input"
          style={{ height: "38px", paddingLeft: "34px" }}
        />
      </div>

      {/* Groups */}
      {GROUPS.map((group) => {
        const isOpen = expanded.has(group.title);
        return (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                background: "none",
                border: "none",
                padding: "0 0 var(--space-3)",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                marginBottom: "var(--space-3)",
              }}
            >
              <span className="t-overline">{group.title}</span>
              <ChevronDown
                size={15}
                strokeWidth={2}
                color="var(--text-tertiary)"
                style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "var(--transition)" }}
              />
            </button>

            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {group.options.map((opt) => {
                  const checked = isChecked(group.key, opt.value);
                  return (
                    <label
                      key={opt.value}
                      onClick={() => onToggle(group.key, opt.value)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        cursor: "pointer",
                        fontSize: "0.8125rem",
                        color: checked ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: checked ? 600 : 400,
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: checked ? "none" : "1.5px solid var(--border-strong)",
                          borderRadius: "var(--radius-sm)",
                          background: checked ? "var(--brand)" : "var(--surface)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "var(--transition)",
                        }}
                      >
                        {checked && <Check size={11} strokeWidth={3} color="#fff" />}
                      </span>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Clear refinements */}
      {refineCount > 0 && (
        <button
          onClick={onClear}
          className="btn btn--sm"
          style={{ background: "var(--rose-soft)", color: "var(--rose)", gap: "var(--space-2)" }}
        >
          <X size={14} strokeWidth={2.25} />
          {refineCount} फ़िल्टर हटाएं
        </button>
      )}
    </div>
  );
}
