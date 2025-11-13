"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BOM, BomVersionGroup, useAuthStore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { getBomColumns } from "@/components/boms/columns";
import { BomDataTable } from "@/components/boms/bom-data-table";
import { BomAuthSkeleton } from "./bom-skeleton";
import { AddBomModal } from "./add-bom-modal";
import { toast } from "sonner";

export function BomPage() {
  const [data, setData] = useState<BOM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  
  const [activeVersions, setActiveVersions] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    setIsClient(true);
    if (role && role !== "Admin") {
      router.push("/");
    }
  }, [role, router]);

  const refetchData = async () => {
    if (role !== "Admin") return;
    setIsLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/boms/`;
      const res = await fetch(apiUrl, {
        headers: { "X-User-Role": role || "" },
      });
      if (!res.ok) throw new Error("Gagal mengambil data BOM");
      const boms: BOM[] = (await res.json()) || [];
      setData(boms);

      const uniqueBomCodes = [...new Set(boms.map(b => b.bomCode))];

      const activeVersionPromises = uniqueBomCodes.map(code => 
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boms/active-version/${code}`, {
          headers: { "X-User-Role": role || "" },
        }).then(res => res.json())
      );
      
      const activeVersionResults = await Promise.all(activeVersionPromises);

      const newActiveVersions = new Map<string, string>();
      for (const result of activeVersionResults) {
        if (result.bomCode && result.activeVersion) {
          newActiveVersions.set(result.bomCode, result.activeVersion);
        }
      }
      setActiveVersions(newActiveVersions);

    } catch (error) {
      console.error("Error fetching BOM data:", error);
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "Admin") {
      refetchData();
    }
  }, [role]);

  const groupedData = useMemo(() => {
    const groups = new Map<string, BomVersionGroup>();

    const sortedData = [...data].sort(
      (a, b) =>
        a.bomCode.localeCompare(b.bomCode) ||
        (a.versionTag || "default").localeCompare(b.versionTag || "default") ||
        a.material.localeCompare(b.material)
    );

    for (const item of sortedData) {
      const bomCode = item.bomCode;
      const versionTag = item.versionTag || "default";

      if (!groups.has(bomCode)) {
        const activeVersion = activeVersions.get(bomCode) || "default";
        
        groups.set(bomCode, {
          bomCode: bomCode,
          activeVersion: activeVersion, 
          versions: new Map(),
        });
      }
      const bomGroup = groups.get(bomCode)!;

      if (!bomGroup.versions.has(versionTag)) {
        bomGroup.versions.set(versionTag, []);
      }
      const materialList = bomGroup.versions.get(versionTag)!;

      materialList.push({
        id: item.id,
        material: item.material,
        materialDescription: item.materialDescription,
        partReference: item.partReference,
        qty: item.qty,
      });
    }
    return Array.from(groups.values());
  }, [data, activeVersions]); 
  
  const handleBomChange = () => {
    refetchData();
  };

  const columns = getBomColumns(handleBomChange); 

  if (!isClient || !role) {
    return <BomAuthSkeleton />;
  }

  if (role !== "Admin") {
    return (
      <div className="container mx-auto pb-10">
        <h1 className="text-3xl text-red-600">Akses Ditolak</h1>
        <p className="text-muted-foreground mt-2">
          Halaman ini hanya untuk Admin.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <BomAuthSkeleton />;
  }

  return (
    <div className="w-full space-y-4"> 
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="md:flex md:justify-between md:items-center mb-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl">Manajemen BOM (Bill of Materials)</h1>
            <p className="text-muted-foreground font-light mt-1">
              Mengatur daftar master komponen, material, dan versi.
            </p>
          </div>
          <Button
            className="flex w-full md:w-52"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Master BOM
          </Button>
        </div>

        <BomDataTable columns={columns} data={groupedData} />

        <AddBomModal
          setIsOpen={setIsAddModalOpen}
          onBomAdded={handleBomChange}
        />
      </Dialog>
    </div>
  );
}