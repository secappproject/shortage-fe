"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SelectionTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  onRowSelect: (row: TData | null) => void;
  selectedId: number | string | null;
  searchKey: string;
  searchPlaceholder: string;
  rowDisabledKey?: keyof TData;
}

export function SelectionTable<TData extends { id: any }, TValue>({
  data,
  columns,
  onRowSelect,
  selectedId,
  searchKey,
  searchPlaceholder,
  rowDisabledKey,
}: SelectionTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = filterValue.toLowerCase();

      const rowData = Object.values(row.original as any)
        .join(" ")
        .toLowerCase();
      return rowData.includes(search);
    },
  });

  const handleRowClick = (row: TData) => {
    if (rowDisabledKey) {
      const disabledValue = row[rowDisabledKey] as any;
      if (
        !disabledValue ||
        (Array.isArray(disabledValue) && disabledValue.length === 0)
      ) {
        return;
      }
    }

    if (row.id === selectedId) {
      onRowSelect(null);
    } else {
      onRowSelect(row);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="w-full"
      />
      <ScrollArea className="h-72 w-full rounded-md border bg-background">
        {/* Wrapper div dengan min-width memaksa scroll muncul di mobile */}
        <div className="min-w-[600px] md:min-w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const isDisabled = rowDisabledKey
                    ? !(row.original[rowDisabledKey] as any)?.length
                    : false;
                  const isSelected = row.original.id === selectedId;

                  return (
                    <TableRow
                      key={row.id}
                      data-selected={isSelected}
                      data-disabled={isDisabled}
                      onClick={() => handleRowClick(row.original)}
                      className="cursor-pointer data-[selected=true]:bg-primary/10 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
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
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}