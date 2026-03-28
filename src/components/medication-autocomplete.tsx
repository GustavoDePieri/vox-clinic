"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Search, X, Loader2, Star, Pill, AlertTriangle, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ---------- Types ----------

export interface MedicationResult {
  anvisaCode: string
  name: string
  activeIngredient: string
  concentration: string | null
  pharmaceuticalForm: string | null
  manufacturer: string | null
  category: string | null
  controlType: string
}

export interface MedicationFavoriteItem {
  id: string
  medicationName: string
  activeIngredient: string | null
  defaultDosage: string | null
  defaultFrequency: string | null
  defaultQuantity: string | null
  usageCount: number
}

// ---------- Props ----------

interface MedicationAutocompleteProps {
  value: MedicationResult | null
  onChange: (value: MedicationResult | null) => void
  favorites?: MedicationFavoriteItem[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

// ---------- Helpers ----------

const controlTypeBadge: Record<string, { label: string; className: string; icon: typeof Pill }> = {
  c1: { label: "C1", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  c2: { label: "C2", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: ShieldAlert },
  antimicrobial: { label: "ATM", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Pill },
}

const categoryLabel: Record<string, string> = {
  referencia: "Ref",
  generico: "Gen",
  similar: "Sim",
}

// ---------- Component ----------

export function MedicationAutocomplete({
  value,
  onChange,
  favorites,
  placeholder,
  disabled,
  className,
}: MedicationAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<MedicationResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [showFavorites, setShowFavorites] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ----- Fetch -----

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    setShowFavorites(false)
    try {
      const res = await fetch(
        `/api/medications/search?q=${encodeURIComponent(q)}&limit=20`,
      )
      if (!res.ok) throw new Error("fetch failed")
      const data: MedicationResult[] = await res.json()
      setResults(data)
      setIsOpen(true)
      setActiveIndex(-1)
    } catch {
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ----- Debounced search -----

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults(query)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, fetchResults])

  // ----- Close on outside click -----

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setShowFavorites(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // ----- Scroll active item into view -----

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement | undefined
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  // ----- Selection handlers -----

  function selectItem(item: MedicationResult) {
    onChange(item)
    setQuery(`${item.name} ${item.concentration ?? ""}`.trim())
    setIsOpen(false)
    setShowFavorites(false)
  }

  function selectFavorite(fav: MedicationFavoriteItem) {
    const result: MedicationResult = {
      anvisaCode: "",
      name: fav.medicationName,
      activeIngredient: fav.activeIngredient ?? "",
      concentration: null,
      pharmaceuticalForm: null,
      manufacturer: null,
      category: null,
      controlType: "none",
    }
    onChange(result)
    setQuery(fav.medicationName)
    setIsOpen(false)
    setShowFavorites(false)
  }

  function clearSelection() {
    onChange(null)
    setQuery("")
    inputRef.current?.focus()
  }

  // ----- Show favorites on focus with empty query -----

  function handleFocus() {
    if (query.length >= 2 && results.length > 0) {
      setIsOpen(true)
    } else if (query.length < 2 && favorites && favorites.length > 0) {
      setShowFavorites(true)
    }
  }

  // ----- Keyboard navigation -----

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const items = showFavorites ? (favorites ?? []) : results
    if ((!isOpen && !showFavorites) || items.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false)
        setShowFavorites(false)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((i) => (i < items.length - 1 ? i + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : items.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < items.length) {
          if (showFavorites && favorites) {
            selectFavorite(favorites[activeIndex])
          } else {
            selectItem(results[activeIndex])
          }
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setShowFavorites(false)
        break
    }
  }

  // ----- Render -----

  const showClearButton = value !== null

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input */}
      <div className="relative">
        <Pill className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (value) onChange(null)
            if (e.target.value.length < 2) setShowFavorites(false)
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Buscar medicamento (nome ou principio ativo)"}
          disabled={disabled}
          className="pl-9 pr-9"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {showClearButton && !isLoading && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Favorites dropdown (on focus, empty query) */}
      {showFavorites && favorites && favorites.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
        >
          <li className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Star className="mr-1 inline h-3 w-3" />
            Favoritos
          </li>
          {favorites.map((fav, index) => (
            <li
              key={fav.id}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault()
                selectFavorite(fav)
              }}
            >
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <span className="font-medium">{fav.medicationName}</span>
              {fav.activeIngredient && (
                <span className="text-xs text-muted-foreground">({fav.activeIngredient})</span>
              )}
              {fav.defaultDosage && (
                <span className="ml-auto text-xs text-muted-foreground">{fav.defaultDosage}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Search results dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg"
        >
          {results.map((item, index) => {
            const badge = controlTypeBadge[item.controlType]
            const catLabel = item.category ? categoryLabel[item.category] : null
            return (
              <li
                key={`${item.anvisaCode}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  index === activeIndex && "bg-accent text-accent-foreground",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectItem(item)
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {item.concentration && (
                    <span className="text-xs text-muted-foreground">{item.concentration}</span>
                  )}
                  {badge && (
                    <span className={cn("ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold", badge.className)}>
                      <badge.icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  )}
                  {catLabel && !badge && (
                    <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {catLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.activeIngredient}</span>
                  {item.pharmaceuticalForm && (
                    <>
                      <span>·</span>
                      <span>{item.pharmaceuticalForm}</span>
                    </>
                  )}
                  {item.manufacturer && (
                    <>
                      <span>·</span>
                      <span>{item.manufacturer}</span>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Empty state */}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/60 bg-popover px-4 py-3 text-sm text-muted-foreground shadow-lg">
          Nenhum medicamento encontrado para &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
