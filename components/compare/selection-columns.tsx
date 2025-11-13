"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ProjectTrackingView,
  BomVersionGroup,
  BomMaterialItem,
} from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ViewBomModal } from "../boms/view-bom-modal";

type BomSummary = {
  id: string;
  bomCode: string;
  activeVersion: string;
  materialPreview: BomMaterialItem[];
  totalQty: number;
  fullBomGroup: BomVersionGroup;
};

type BomUpdateHandler = () => void;

const BomDetailModalTrigger = ({
  bomGroup,
  onGroupUpdated,
  children,
}: {
  bomGroup: BomVersionGroup;
  onGroupUpdated: BomUpdateHandler;
  children: React.ReactNode;
}) => {
  const [isViewOpen, setIsViewOpen] = useState(false);

  return (
    <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {isViewOpen && (
        <ViewBomModal
          bomGroup={bomGroup}
          setIsOpen={setIsViewOpen}
          onGroupUpdated={onGroupUpdated}
        />
      )}
    </Dialog>
  );
};

export const getBomCodeSummaryColumns = (
  onGroupUpdated: BomUpdateHandler
): ColumnDef<BomSummary>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "bomCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="BOM Code" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("bomCode")}</span>
    ),
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "activeVersion",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Versi Aktif" />
    ),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="font-medium bg-green-100 text-green-800 border-green-300"
      >
        {row.getValue("activeVersion")}
      </Badge>
    ),
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "materialPreview",
    header: "Material",
    cell: ({ row }) => {
      const materials = row.getValue("materialPreview") as BomMaterialItem[];

      if (!materials || materials.length === 0) {
        return (
          <Badge variant="secondary" className="font-light">
            Kosong
          </Badge>
        );
      }

      const MAX_BADGES_TO_SHOW = 3;
      const materialsToShow = materials.slice(0, MAX_BADGES_TO_SHOW);
      const remainingCount = materials.length - materialsToShow.length;

      return (
        <BomDetailModalTrigger
          bomGroup={row.original.fullBomGroup}
          onGroupUpdated={onGroupUpdated}
        >
          <div className="flex flex-wrap gap-1 max-w-xs cursor-pointer">
            {materialsToShow.map((material) => (
              <Badge
                key={material.id}
                variant="secondary"
                className="font-light"
              >
                {material.material} (Qty: {material.qty})
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="font-light">
                ...{remainingCount} lainnya
              </Badge>
            )}
          </div>
        </BomDetailModalTrigger>
      );
    },
  },
  {
    accessorKey: "totalQty",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Qty" />
    ),
    cell: ({ row }) => <span>{row.getValue("totalQty")}</span>,
    filterFn: "arrIncludes",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <BomDetailModalTrigger
        bomGroup={row.original.fullBomGroup}
        onGroupUpdated={onGroupUpdated}
      >
        {/* --- PERBAIKAN STYLE BUTTON DI SINI --- */}
        <Button variant="outline" size="sm" className="h-7">
          Lihat/Ubah Versi
        </Button>
      </BomDetailModalTrigger>
    ),
  },
];

export const getMiniTrackingColumns = (): ColumnDef<ProjectTrackingView>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Proyek" />
    ),
    cell: ({ row }) => <span>{row.original.projectName?.String || "-"}</span>,
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "wbsNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WBS" />
    ),
    cell: ({ row }) => <span>{row.original.wbsNumber?.String || "-"}</span>,
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "switchboardName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Switchboard" />
    ),
    cell: ({ row }) => <span>{row.original.switchboardName}</span>,
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "compartmentNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kompartemen" />
    ),
    cell: ({ row }) => <span>{row.original.compartmentNumber}</span>,
    filterFn: "arrIncludes",
  },
  {
    accessorKey: "actualParts",
    header: "Status Data",
    cell: ({ row }) => {
      const parts = row.original.actualParts;
      const hasParts = parts && Array.isArray(parts) && parts.length > 0;
      return hasParts ? (
        <Badge variant="default" className="bg-green-600">
          Siap
        </Badge>
      ) : (
        <Badge variant="secondary">Kosong</Badge>
      );
    },
  },
];