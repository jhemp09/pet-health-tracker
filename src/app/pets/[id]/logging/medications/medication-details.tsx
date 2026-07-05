type Details = {
  dosage: string | null;
  notes: string | null;
  product_url: string | null;
};

export function MedicationDetails({ details }: { details: Details }) {
  const hasDetails = details.dosage || details.notes || details.product_url;
  if (!hasDetails) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-xs">
      {details.dosage && (
        <span className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
            style={{ background: "var(--color-meds-light)", color: "var(--color-meds)" }}
          >
            💊
          </span>
          <span className="font-medium">{details.dosage}</span>
        </span>
      )}
      {details.notes && (
        <span className="max-w-[10rem] truncate rounded-full border border-gray-200 px-2 py-1">
          {details.notes}
        </span>
      )}
      {details.product_url && (
        <a
          href={details.product_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Product link"
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 hover:opacity-70"
        >
          🛒
        </a>
      )}
    </div>
  );
}
