"use client";

import { useEffect, useState } from "react";
import {
  useAuthStore,
  ProjectTracking,
  Project,
  BomMaterial,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { getTrackingColumns } from "@/components/tracking/columns";
import { TrackingDataTable } from "@/components/tracking/tracking-data-table";
import { TrackingAuthSkeleton } from "./tracking-skeleton";
import { AddTrackingModal } from "./add-tracking-modal";

export function TrackingPage() {
  const [data, setData] = useState<ProjectTracking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bomMaterials, setBomMaterials] = useState<BomMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const refetchData = async () => {
    if (!role) return;
    try {
      const trackingApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/`;
      const headers = { "X-User-Role": role };
      const res = await fetch(trackingApiUrl, { headers });
      if (!res.ok) throw new Error("Gagal mengambil data tracking");
      const trackingData = await res.json();
      setData(trackingData || []);
    } catch (error) {
      console.error("Error refetching data:", error);
    }
  };

  useEffect(() => {
    async function getInitialData() {
      if (!role) return;
      setIsLoading(true);
      try {
        const trackingApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/`;
        const projectsApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/projects/`;
        const materialsApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/boms/materials`;
        const headers = { "X-User-Role": role };

        const [trackingRes, projectsRes, materialsRes] = await Promise.all([
          fetch(trackingApiUrl, { headers }),
          fetch(projectsApiUrl, { headers }),
          fetch(materialsApiUrl, { headers }),
        ]);

        if (!trackingRes.ok) throw new Error("Gagal mengambil data tracking");
        if (!projectsRes.ok) throw new Error("Gagal mengambil data projects");
        if (!materialsRes.ok)
          throw new Error("Gagal mengambil data BOM materials");

        const trackingData = await trackingRes.json();
        const projectsData = await projectsRes.json();
        const materialsData = await materialsRes.json();

        setData(trackingData || []);
        setProjects(projectsData || []);
        setBomMaterials(materialsData || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (role) {
      getInitialData();
    }
  }, [role]);

  const handleTrackingUpdated = () => {
    refetchData();
  };

  const handleTrackingDeleted = (trackingId: number) => {
    setData((prevData) => prevData.filter((item) => item.id !== trackingId));
  };

  const handleTrackingAdded = (newTracking: any) => {
    refetchData();
  };

  const columns = getTrackingColumns(
    projects,
    bomMaterials,
    handleTrackingUpdated,
    handleTrackingDeleted
  );

  if (!isClient || !role) {
    return <TrackingAuthSkeleton />;
  }

  if (isLoading) {
    return <TrackingAuthSkeleton />;
  }

  const canAddData = role === "Admin" || role === "PIC";

  return (
    <div className="container mx-auto pb-12">
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <div className="md:flex md:justify-between md:items-center mb-4">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl">Scan Actual Compartment</h1>
            <p className="text-muted-foreground font-light mt-1">
              Memantau progres mekanik, wiring, dan testing per kompartemen.
            </p>
          </div>
          {canAddData && (
            <Button
              className="flex w-full md:w-52"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Data Tracking
            </Button>
          )}
        </div>

        <TrackingDataTable columns={columns} data={data} />

        {canAddData && (
          <AddTrackingModal
            setIsOpen={setIsAddModalOpen}
            onTrackingAdded={handleTrackingAdded}
            projects={projects}
          />
        )}
      </Dialog>
    </div>
  );
}