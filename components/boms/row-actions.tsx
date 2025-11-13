"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { BomVersionGroup } from "@/lib/types";
import { DeleteBomGroupAlert } from "./delete-bom-group-alert"; 
import { EditBomModal } from "./edit-bom-modal";
import { ViewBomModal } from "./view-bom-modal";

interface DataTableRowActionsProps {
  bomGroup: BomVersionGroup;
  onBomGroupUpdated: () => void;
}

export function BomDataTableRowActions({
  bomGroup,
  onBomGroupUpdated,
}: DataTableRowActionsProps) {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = useState(false); 

  const defaultVersionMaterials = bomGroup.versions.get("default") || [];
  const defaultVersionData = {
    bomCode: bomGroup.bomCode,
    versionTag: "default",
    materials: defaultVersionMaterials,
  };

  const handleActionComplete = () => {
    onBomGroupUpdated();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsViewOpen(true)}>
            Lihat Detail (Semua Versi)
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsEditOpen(true)}
            disabled={defaultVersionMaterials.length === 0}
          >
            Edit Versi Aktif
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setIsDeleteGroupOpen(true)} 
          >
            Hapus Grup BOM (Semua Versi)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        {isViewOpen && (
          <ViewBomModal
            bomGroup={bomGroup}
            setIsOpen={setIsViewOpen}
            onGroupUpdated={handleActionComplete}
          />
        )}
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        {isEditOpen && (
          <EditBomModal
            versionData={defaultVersionData}
            setIsOpen={setIsEditOpen}
            onBomGroupUpdated={handleActionComplete}
          />
        )}
      </Dialog>

      <AlertDialog
        open={isDeleteGroupOpen}
        onOpenChange={setIsDeleteGroupOpen}
      >
        {isDeleteGroupOpen && (
          <DeleteBomGroupAlert
            bomGroup={bomGroup} 
            setIsOpen={setIsDeleteGroupOpen}
            onBomGroupUpdated={handleActionComplete}
          />
        )}
      </AlertDialog>
    </>
  );
}