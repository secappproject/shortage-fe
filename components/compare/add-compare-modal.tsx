"use client";

import { useEffect, useState, useMemo } from "react";
import {
  useAuthStore,
  ProjectTrackingView,
  BOM,
  BomVersionGroup,
  BomMaterialItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { SelectionTable } from "./selection-table";
import {
  getBomCodeSummaryColumns,
  getMiniTrackingColumns,
} from "./selection-columns";

const GO_API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AddCompareModalProps {
  setIsOpen: (open: boolean) => void;
  onComparisonAdded: () => void;
}

export type BomSummary = {
  id: string;
  bomCode: string;
  activeVersion: string;
  materialPreview: BomMaterialItem[];
  totalQty: number;
  fullBomGroup: BomVersionGroup;
};

export function AddCompareModal({
  setIsOpen,
  onComparisonAdded,
}: AddCompareModalProps) {
  const [bomList, setBomList] = useState<BOM[]>([]);
  const [trackingList, setTrackingList] = useState<ProjectTrackingView[]>([]);
  const [activeVersions, setActiveVersions] = useState<Map<string, string>>(
    new Map()
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedBomCode, setSelectedBomCode] = useState<string | null>(null);
  const [selectedTracking, setSelectedTracking] =
    useState<ProjectTrackingView | null>(null);

  const role = useAuthStore((state) => state.role);

  const getTableData = async () => {
    if (!role) return;
    setIsLoadingData(true);
    try {
      const headers = { "X-User-Role": role };
      const [bomRes, trackingRes] = await Promise.all([
        fetch(`${GO_API_URL}/api/boms/`, { headers }),
        fetch(`${GO_API_URL}/api/tracking/`, { headers }),
      ]);

      if (!bomRes.ok) throw new Error("Gagal mengambil data BOM");
      if (!trackingRes.ok) throw new Error("Gagal mengambil data tracking");

      const boms: BOM[] = await bomRes.json();
      setBomList(boms);
      setTrackingList(await trackingRes.json());

      const uniqueBomCodes = [...new Set(boms.map((b) => b.bomCode))];
      const activeVersionPromises = uniqueBomCodes.map((code) =>
        fetch(`${GO_API_URL}/api/boms/active-version/${code}`, { headers })
          .then((res) => res.json())
          .catch(() => null)
      );

      const activeVersionResults = await Promise.all(activeVersionPromises);

      const newActiveVersions = new Map<string, string>();
      for (const result of activeVersionResults) {
        if (result && result.bomCode && result.activeVersion) {
          newActiveVersions.set(result.bomCode, result.activeVersion);
        }
      }
      setActiveVersions(newActiveVersions);
    } catch (error) {
      toast.error("Gagal memuat data: " + (error as Error).message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (role) {
      getTableData();
    }
  }, [role]);

  const bomCodeSummaryList = useMemo(() => {
    const groups = new Map<string, BomVersionGroup>();
    for (const item of bomList) {
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

    return Array.from(groups.values()).map((group) => {
      const defaultMaterials = group.versions.get("default") || [];
      const totalQty = defaultMaterials.reduce(
        (sum, item) => sum + item.qty,
        0
      );

      return {
        id: group.bomCode,
        bomCode: group.bomCode,
        activeVersion: group.activeVersion,
        materialPreview: defaultMaterials,
        totalQty: totalQty,
        fullBomGroup: group,
      };
    });
  }, [bomList, activeVersions]);

  const handleSubmit = async () => {
    if (!selectedBomCode || !selectedTracking) {
      toast.warning("Harap pilih BOM dan Actual Compartment.");
      return;
    }
    setIsSaving(true);
    try {
      const activeVersionForSelectedBom =
        activeVersions.get(selectedBomCode) || "default";

      const payload = {
        bomCode: selectedBomCode,
        versionTag: activeVersionForSelectedBom,
        trackingId: selectedTracking.id,
      };

      const response = await fetch(`${GO_API_URL}/api/comparisons/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role as string,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan perbandingan");
      }

      toast.success("Perbandingan berhasil dibuat/diperbarui.");
      onComparisonAdded();
      setIsOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const bomColumns = useMemo(
    () => getBomCodeSummaryColumns(getTableData),
    []
  );
  const trackingColumns = useMemo(() => getMiniTrackingColumns(), []);

  const selectedBomName =
    selectedBomCode
      ? `${selectedBomCode} (v: ${
          activeVersions.get(selectedBomCode) || "default"
        })`
      : "Belum Dipilih";
  const selectedTrackingName = selectedTracking
    ? `${selectedTracking.switchboardName} / ${selectedTracking.compartmentNumber}`
    : "Belum Dipilih";
  const BomTableSection = (
    <div className="flex flex-col space-y-2 w-full h-full">
      <h4 className="font-medium hidden md:block">1. Pilih BOM</h4>
      <div className="flex-1 overflow-hidden">
        <SelectionTable
          data={bomCodeSummaryList}
          columns={bomColumns}
          searchKey="bomCode"
          searchPlaceholder="Cari BOM code atau material..."
          selectedId={selectedBomCode}
          onRowSelect={(row) =>
            setSelectedBomCode(row ? (row as BomSummary).bomCode : null)
          }
        />
      </div>
    </div>
  );

  const TrackingTableSection = (
    <div className="flex flex-col space-y-2 w-full h-full">
      <h4 className="font-medium hidden md:block">
        2. Pilih Actual Compartment
      </h4>
      <div className="flex-1 overflow-hidden">
        <SelectionTable
          data={trackingList}
          columns={trackingColumns}
          searchKey="compartmentNumber"
          searchPlaceholder="Cari kompartemen atau project..."
          selectedId={selectedTracking?.id || null}
          onRowSelect={(row) =>
            setSelectedTracking(row as ProjectTrackingView | null)
          }
          rowDisabledKey="actualParts"
        />
      </div>
    </div>
  );

  return (
    <DialogContent className="sm:max-w-6xl max-h-[95vh] flex flex-col p-0 sm:p-6">
      <div className="p-6 pb-2 sm:p-0 sm:pb-4">
        <DialogHeader>
          <DialogTitle>Buat Perbandingan Baru</DialogTitle>
          <DialogDescription>
            Pilih BOM dan Actual Compartment untuk dibandingkan.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex-1 overflow-hidden px-4 sm:px-0">
        {isLoadingData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="hidden md:flex flex-col h-full overflow-y-auto gap-8 p-1 pr-2">
              {BomTableSection}
              <div className="border-t pt-6">{TrackingTableSection}</div>
            </div>

            <div className="md:hidden h-full flex flex-col">
              <Tabs
                defaultValue="bom"
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="bom">1. Pilih BOM</TabsTrigger>
                  <TabsTrigger value="tracking">2. Actual Part</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="bom"
                  className="flex-1 overflow-y-auto mt-0"
                >
                  {BomTableSection}
                </TabsContent>

                <TabsContent
                  value="tracking"
                  className="flex-1 overflow-y-auto mt-0"
                >
                  {TrackingTableSection}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>

      <div className="p-4 sm:p-0 sm:pt-4 border-t sm:border-none mt-auto bg-background sm:bg-transparent">
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <div className="text-xs text-muted-foreground text-left">
            <p className="truncate max-w-[300px]">
              <strong>BOM:</strong> {selectedBomName}
            </p>
            <p className="truncate max-w-[300px]">
              <strong>Actual:</strong> {selectedTrackingName}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoadingData ||
                isSaving ||
                !selectedBomCode ||
                !selectedTracking
              }
            >
              {isSaving ? (
                "Memproses..."
              ) : (
                <>
                  <Scale className="mr-2 h-4 w-4" />
                  Bandingkan
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}