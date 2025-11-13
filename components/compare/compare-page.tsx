"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ComparisonView, useAuthStore } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

import { getCompareColumns } from "@/components/compare/columns";
import { CompareDataTable } from "@/components/compare/compare-data-table";
import { CompareAuthSkeleton } from "./compare-skeleton";
import { AddCompareModal } from "./add-compare-modal";
import { toast } from "sonner";

export function ComparePage() {
  const [data, setData] = useState<ComparisonView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

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
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/comparisons/`;
      const res = await fetch(apiUrl, {
        headers: {
          "X-User-Role": role,
        },
      });
      if (!res.ok) {
        throw new Error("Gagal mengambil data Perbandingan");
      }
      const comparisons = await res.json();
      setData(comparisons || []);
    } catch (error) {
      console.error("Error fetching Comparison data:", error);
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

  const handleComparisonDeleted = (comparisonId: number) => {
    setData((prevData) =>
      prevData.filter((item) => item.id !== comparisonId)
    );
  };

  const handleComparisonAdded = () => {
    refetchData();
  };

  const columns = getCompareColumns(handleComparisonDeleted);

  if (!isClient || !role) {
    return <CompareAuthSkeleton />;
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
    return <CompareAuthSkeleton />;
  }

  return (
    <div className="container mx-auto pb-10">
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="md:flex md:justify-between md:items-center mb-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl">Manajemen Perbandingan BOM</h1>
            <p className="text-muted-foreground font-light mt-1">
              Membuat dan melihat hasil perbandingan BOM vs Actual Compartment.
            </p>
          </div>
          <Button
            className="flex w-full md:w-52"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat Perbandingan
          </Button>
        </div>

        <CompareDataTable columns={columns} data={data} />

        <AddCompareModal
          setIsOpen={setIsAddModalOpen}
          onComparisonAdded={handleComparisonAdded}
        />
      </Dialog>
    </div>
  );
}