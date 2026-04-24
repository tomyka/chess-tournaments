interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">🏆</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">No tournaments found</h2>
      <p className="text-gray-600 text-center mb-6">
        {hasFilters
          ? "No tournaments match your current filters. Try adjusting your search criteria."
          : "No tournaments available at the moment."}
      </p>
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
