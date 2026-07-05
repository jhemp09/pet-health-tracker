export type Category = "food" | "medications" | "demeanor" | "weight";

export const CATEGORY_COLOR: Record<Category, string> = {
  food: "var(--color-food)",
  medications: "var(--color-meds)",
  demeanor: "var(--color-demeanor)",
  weight: "var(--color-weight)",
};

export const CATEGORY_BG: Record<Category, string> = {
  food: "var(--color-food-light)",
  medications: "var(--color-meds-light)",
  demeanor: "var(--color-demeanor-light)",
  weight: "var(--color-weight-light)",
};

export const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path
        d="M6 3v7a3 3 0 0 0 3 3v8M6 3v6M9 3v6M6 9h3M15 3c-1.5 2-2 4-2 6a2 2 0 0 0 4 0V3M15 12v9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  medications: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="8" width="16" height="10" rx="5" transform="rotate(-45 12 13)" />
      <path d="M9 16l6-6" strokeLinecap="round" />
    </svg>
  ),
  demeanor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="13" r="7" />
      <path d="M9 12v.01M15 12v.01M9.5 16c.8.7 1.7 1 2.5 1s1.7-.3 2.5-1" strokeLinecap="round" />
      <path d="M8 6.5C7 5 6 4.5 5 5M16 6.5c1-1.5 2-2 3-1.5" strokeLinecap="round" />
    </svg>
  ),
  weight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="13" r="8" />
      <path d="M9 13a3 3 0 0 1 6 0" strokeLinecap="round" />
      <path d="M12 5v1.5M12 3.5h0" strokeLinecap="round" />
    </svg>
  ),
};

export function CategoryHeader({
  category,
  title,
  children,
}: {
  category: Category;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: CATEGORY_BG[category], color: CATEGORY_COLOR[category] }}
        >
          <span className="h-5 w-5">{CATEGORY_ICON[category]}</span>
        </span>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
