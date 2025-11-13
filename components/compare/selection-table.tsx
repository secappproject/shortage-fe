"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SelectionTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  searchPlaceholder?: string;
  selectedId: string | number | null;
  onRowSelect: (row: TData | null) => void;
  rowDisabledKey?: string;
}

export function SelectionTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  selectedId,
  onRowSelect,
  rowDisabledKey,
}: SelectionTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(searchKey) as string;
      return value?.toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Search Bar: Diam di tempat */}
      <div className="flex items-center">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* PERBAIKAN UTAMA:
        Ganti 'flex-1' menjadi 'h-[350px]' (atau max-h).
        Ini memaksa area tabel memiliki tinggi tetap.
        Jika data > 350px, scrollbar vertikal akan muncul di dalam kotak ini.
      */}
      <div className="rounded-md border h-[350px] overflow-auto relative bg-white dark:bg-slate-950">
        <Table className="min-w-[800px]">
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const rowId = (row.original as any).id;
                const isSelected = rowId === selectedId;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const isDisabled = rowDisabledKey && (row.original as any)[rowDisabledKey];

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      isSelected && "bg-[#008A15] dark:bg-[#008A15] border-l-4 border-l-[#008A15]",
                      isDisabled && "opacity-50 pointer-events-none bg-gray-100 dark:bg-gray-800"
                    )}
                    onClick={() => {
                      if (!isDisabled) {
                        onRowSelect(isSelected ? null : row.original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}