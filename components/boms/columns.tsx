"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BomVersionGroup, BomMaterialItem } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ViewBomModal } from "./view-bom-modal";
import { BomDataTableRowActions } from "./row-actions"; 

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

export const getBomColumns = (
  onBomGroupUpdated: BomUpdateHandler
): ColumnDef<BomVersionGroup>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 10,
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
    id: "versions",
    header: "Versi Aktif",
    cell: ({ row }) => {
      const activeVersion = row.original.activeVersion; 
      
      return (
        <Badge variant="outline" className="font-medium bg-green-100 text-green-800 border-green-300">
          {activeVersion}
        </Badge>
      );
    },
    enableSorting: false,
  },

  {
    id: "defaultMaterials",
    header: "Material",
    cell: ({ row }) => {
      const defaultMaterials: BomMaterialItem[] =
        row.original.versions.get("default") || [];

      if (defaultMaterials.length === 0) {
        return (
          <Badge variant="secondary" className="font-light">
            Kosong
          </Badge>
        );
      }

      const MAX_BADGES_TO_SHOW = 3;
      const materialsToShow = defaultMaterials.slice(0, MAX_BADGES_TO_SHOW);
      const remainingCount = defaultMaterials.length - materialsToShow.length;

      return (
        <BomDetailModalTrigger
          bomGroup={row.original}
          onGroupUpdated={onBomGroupUpdated}
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
    enableSorting: false,
  },
  {
    id: "totalQty",
    header: "Total Qty",
    cell: ({ row }) => {
      const defaultVersion = row.original.versions.get("default") || [];
      const total = defaultVersion.reduce((sum, item) => sum + item.qty, 0);
      return <span>{total}</span>;
    },
    enableSorting: false,
  },
  
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <BomDataTableRowActions
        bomGroup={row.original}
        onBomGroupUpdated={onBomGroupUpdated}
      />
    ),
  },
];