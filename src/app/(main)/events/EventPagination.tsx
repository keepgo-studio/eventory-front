import React from "react";
import { readFilteredEventsCounts, type EventsFilter } from "./api";
import { useFetch } from "@/hooks/use-fetch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

const PAGINATION_CNT = 9;

export default function EventPagination({
  filters,
  currentPage,
  pageSize,
  onPageChange,
}: {
  filters: EventsFilter;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { data: total } = useFetch(readFilteredEventsCounts, filters);
  const totalPages = total ? Math.ceil(total / pageSize) : null;

  const getPageNumbers = () => {
    if (totalPages === null) return [];

    const pages: (number | "ellipsis")[] = [];
  
    const half = Math.floor(PAGINATION_CNT / 2);
  
    let startPage = Math.max(currentPage - half, 0);
    let endPage = startPage + PAGINATION_CNT;
  
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - PAGINATION_CNT, 0);
    }
  
    if (startPage > 0) {
      pages.push("ellipsis");
    }
  
    for (let i = startPage; i < endPage; i++) {
      pages.push(i);
    }
  
    if (endPage < totalPages) {
      pages.push("ellipsis");
    }
  
    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button
            onClick={() => onPageChange(Math.max(currentPage - 1, 0))}
            disabled={currentPage === 0}
          >
            Prev
          </Button>
        </PaginationItem>

        {getPageNumbers().map((page, idx) => (
          <PaginationItem key={idx}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <Button
                variant={"outline"}
                className={`${
                  currentPage === page ? "font-bold text-blue-600" : ""
                }`}
                disabled={currentPage === page}
                onClick={() => onPageChange(page)}
              >
                {page + 1}
              </Button>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <Button
            onClick={() =>
              totalPages !== null &&
              onPageChange(Math.min(currentPage + 1, totalPages - 1))
            }
            disabled={totalPages !== null && currentPage === totalPages - 1}
          >
            Next
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
