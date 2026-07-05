type Details = {
  notes: string | null;
  product_url: string | null;
};

export function MedicationDetails({ details }: { details: Details }) {
  const hasDetails = details.notes || details.product_url;
  if (!hasDetails) return null;

  return (
    <div className="flex flex-wrap items-start gap-2 border-t border-gray-100 pt-2 text-xs">
      {details.notes && (
        <span className="flex-1 whitespace-pre-wrap break-words rounded border border-gray-200 px-2 py-1">
          {details.notes}
        </span>
      )}
      {details.product_url && (
        <a
          href={details.product_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Product link"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 hover:opacity-70"
        >
          🛒
        </a>
      )}
    </div>
  );
}
