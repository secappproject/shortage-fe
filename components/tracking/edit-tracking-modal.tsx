"use client";

import { useState } from "react";
import {
  useAuthStore,
  Project,
  ProjectTracking,
  ProjectTrackingPayload,
  ActualPart,
  SqlNullString,
  SqlNullTime,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, PackagePlus, Loader2 } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { toast } from "sonner";

interface EditTrackingModalProps {
  tracking: ProjectTracking;
  setIsOpen: (open: boolean) => void;
  onTrackingUpdated: () => void;
  projects: Project[];
}

const VIEW_OPTIONS = ["top", "bottom", "side", "behind", "front", "other"];

const toNullString = (val: string | null | undefined): SqlNullString => ({
  String: val || "",
  Valid: !!val,
});

const toNullTime = (dateStr: string | null | undefined | Date): SqlNullTime => {
  if (!dateStr) {
    return { Time: "", Valid: false };
  }
  try {
    return { Time: new Date(dateStr).toISOString(), Valid: true };
  } catch (e) {
    return { Time: "", Valid: false };
  }
};

const toNullInt64 = (id: number | string | null | undefined) => {
  const numId = Number(id);
  return {
    Int64: numId || 0,
    Valid: !!numId && !isNaN(numId),
  };
};

export function EditTrackingModal({
  tracking,
  setIsOpen,
  onTrackingUpdated,
  projects,
}: EditTrackingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const username = useAuthStore((state) => state.username);

  const [projectId, setProjectId] = useState<string>(
    tracking.projectId?.Valid ? String(tracking.projectId.Int64) : "NONE"
  );
  const [switchboardName, setSwitchboardName] = useState(
    tracking.switchboardName
  );
  const [compartmentNumber, setCompartmentNumber] = useState(
    tracking.compartmentNumber
  );
  const [mechAssemblyBy, setMechAssemblyBy] = useState(
    tracking.mechAssemblyBy?.String || ""
  );
  const [wiringType, setWiringType] = useState(
    tracking.wiringType?.String || ""
  );
  const [wiringBy, setWiringBy] = useState(tracking.wiringBy?.String || "");
  const [statusTest, setStatusTest] = useState(tracking.statusTest);
  const [testedBy, setTestedBy] = useState(tracking.testedBy?.String || "");

  const [dateTested, setDateTested] = useState<Date | undefined>(
    tracking.dateTested?.Valid ? new Date(tracking.dateTested.Time) : undefined
  );

  const [actualParts, setActualParts] = useState<ActualPart[]>(
    tracking.actualParts || []
  );
  const [newPartName, setNewPartName] = useState("");


  const handleAddPart = () => {
    const trimmedName = newPartName.trim();
    if (trimmedName === "") {
      toast.error("Nama part tidak boleh kosong.");
      return;
    }
    if (
      actualParts.some(
        (p) => p.material.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      toast.warning("Part sudah ada di list.");
      return;
    }

    setActualParts((prev) => [
      ...prev,
      { material: trimmedName, qty: 1, views: [] },
    ]);
    setNewPartName("");
  };

  const handleRemovePart = (material: string) => {
    setActualParts((prev) => prev.filter((p) => p.material !== material));
  };

  const handlePartQtyChange = (material: string, qty: number) => {
    setActualParts((prev) =>
      prev.map((p) =>
        p.material === material ? { ...p, qty: qty > 0 ? qty : 1 } : p
      )
    );
  };

  const handlePartViewChange = (
    material: string,
    view: string,
    checked: boolean
  ) => {
    setActualParts((prev) =>
      prev.map((p) => {
        if (p.material !== material) return p;
        const newViews = new Set(p.views);
        if (checked) {
          newViews.add(view);
        } else {
          newViews.delete(view);
        }
        return { ...p, views: Array.from(newViews) };
      })
    );
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as "Waiting" | "Tested" | "Already Compared with BOM";
    setStatusTest(newStatus);

    if (newStatus === "Tested" || newStatus === "Already Compared with BOM") {
      if (!testedBy) setTestedBy(username || "");
      if (!dateTested) setDateTested(new Date());
    }
    if (newStatus === "Waiting") {
      setTestedBy("");
      setDateTested(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!projectId || !switchboardName || !compartmentNumber) {
      toast.error("Project, Switchboard Name, dan Compartment No. wajib diisi.");
      return;
    }
    setIsLoading(true);

    try {
      const payload: ProjectTrackingPayload = {
        projectId: toNullInt64(projectId === "NONE" ? null : projectId),
        switchboardName,
        compartmentNumber,
        mechAssemblyBy: toNullString(mechAssemblyBy),
        wiringType: toNullString(wiringType),
        wiringBy: toNullString(wiringBy),
        statusTest,
        actualParts: actualParts.length > 0 ? actualParts : null,
        testedBy: toNullString(testedBy),
        dateTested: toNullTime(dateTested),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/${tracking.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate data tracking.");
      }

      toast.success("Data tracking berhasil diupdate.");
      onTrackingUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Edit Progress Tracking</DialogTitle>
        <DialogDescription>
          Ubah detail progress untuk {tracking.switchboardName} / {tracking.compartmentNumber}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="general" className="w-full flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="parts">Part Detected</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] md:h-[55vh] pr-4">
            <div className="space-y-4 p-1">
              <h4 className="font-medium text-lg">Detail Project</h4>

              {/* Project - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="project">Project</Label>
                <Select onValueChange={setProjectId} value={projectId}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Pilih WBS / Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">- Tidak ada project -</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName} ({p.wbsNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Switchboard - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="switchboard">Switchboard</Label>
                <Input
                  id="switchboard"
                  value={switchboardName}
                  onChange={(e) => setSwitchboardName(e.target.value)}
                  placeholder="Misal: SWB-01A"
                />
              </div>

              {/* Compartment - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="compartment">Compartment</Label>
                <Input
                  id="compartment"
                  value={compartmentNumber}
                  onChange={(e) => setCompartmentNumber(e.target.value)}
                  placeholder="Misal: C-01"
                />
              </div>

              <h4 className="font-medium text-lg pt-4">Progress Manufaktur</h4>

              {/* Mech Assembly - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="mechAssemblyBy">Mech. Assembly</Label>
                <Input
                  id="mechAssemblyBy"
                  value={mechAssemblyBy}
                  onChange={(e) => setMechAssemblyBy(e.target.value)}
                  placeholder="Nama PIC/Vendor"
                />
              </div>

              {/* Wiring By - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiringBy">Wiring By</Label>
                <Input
                  id="wiringBy"
                  value={wiringBy}
                  onChange={(e) => setWiringBy(e.target.value)}
                  placeholder="Nama PIC/Vendor"
                />
              </div>

              {/* Wiring Type - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="wiringType">Wiring Type</Label>
                <Input
                  id="wiringType"
                  value={wiringType}
                  onChange={(e) => setWiringType(e.target.value)}
                  placeholder="Misal: Direct, Indirect"
                />
              </div>

              <h4 className="font-medium text-lg pt-4">Progress Test</h4>

              {/* Status - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="statusTest">Status</Label>
                <Select onValueChange={handleStatusChange} value={statusTest}>
                  <SelectTrigger id="statusTest">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Waiting">Waiting</SelectItem>
                    <SelectItem value="Tested">Tested</SelectItem>
                    <SelectItem value="Already Compared with BOM">
                      Already Compared with BOM
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tested By - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="testedBy">Tested By</Label>
                <Input
                  id="testedBy"
                  value={testedBy}
                  onChange={(e) => setTestedBy(e.target.value)}
                  placeholder="Nama PIC Tester"
                  disabled={statusTest === "Waiting"}
                />
              </div>

              {/* Date Tested - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="dateTested">Date Tested</Label>
                <div>
                  <DatePicker
                    value={dateTested}
                    onValueChange={setDateTested}
                    disabled={statusTest === "Waiting"}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="parts" className="flex-1 overflow-hidden flex flex-col h-[50vh] md:h-[55vh]">
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-grow rounded-md mb-4 overflow-y-auto">
              <div className="space-y-4">
                {actualParts.map((part) => (
                  <div
                    key={part.material}
                    className="p-3 border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">{part.material}</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        onClick={() => handleRemovePart(part.material)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label htmlFor={`qty-${part.material}`}>Qty</Label>
                      <Input
                        id={`qty-${part.material}`}
                        type="number"
                        className="h-8 w-20"
                        min="1"
                        value={part.qty}
                        onChange={(e) =>
                          handlePartQtyChange(
                            part.material,
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Terlihat di Views:</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {VIEW_OPTIONS.map((view) => (
                          <div key={view} className="flex items-center space-x-2">
                            <Checkbox
                              id={`view-${part.material}-${view}`}
                              checked={part.views.includes(view)}
                              onCheckedChange={(checked) =>
                                handlePartViewChange(
                                  part.material,
                                  view,
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`view-${part.material}-${view}`}
                              className="font-normal capitalize text-xs"
                            >
                              {view}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {actualParts.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground pb-10">
                    Belum ada part ditambahkan. Gunakan input di bawah untuk menambah.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-auto pt-2">
              <Input
                placeholder="Ketik nama part baru..."
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPart();
                }}
              />
              <Button onClick={handleAddPart} size="icon">
                <PackagePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}