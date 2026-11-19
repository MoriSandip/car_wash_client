import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListPaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  isLoading?: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

const ListPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  isLoading = false,
  itemLabel,
  onPageChange,
}: ListPaginationProps) => {
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, totalItems);
  const startPage = Math.max(1, Math.min(safePage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => startPage + index,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500" aria-live="polite">
        Showing <span className="font-medium text-slate-700">{firstItem}–{lastItem}</span>{" "}
        of <span className="font-medium text-slate-700">{totalItems}</span>{" "}
        {itemLabel}
      </p>
      <nav
        aria-label={`${itemLabel} pagination`}
        className="flex items-center gap-1 self-start rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:self-auto"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous page"
          disabled={safePage <= 1 || isLoading}
          onClick={() => onPageChange(safePage - 1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visiblePages.map((number) => (
          <Button
            key={number}
            type="button"
            variant={number === safePage ? "default" : "ghost"}
            size="sm"
            aria-label={`Page ${number}`}
            aria-current={number === safePage ? "page" : undefined}
            disabled={isLoading}
            onClick={() => onPageChange(number)}
            className="h-8 min-w-8 px-2"
          >
            {number}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next page"
          disabled={safePage >= totalPages || isLoading}
          onClick={() => onPageChange(safePage + 1)}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
};

export default ListPagination;
