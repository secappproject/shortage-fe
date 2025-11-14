"use client";

import { useState } from "react";
import {
  useAuthStore,
  Project,
  ProjectTrackingPayload,
  ActualPart,
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
import { Trash2, PackagePlus, PlusCircle } from "lucide-react";
import { DatePicker } from "../ui/date-picker";
import { toast } from "sonner";

interface AddTrackingModalProps {
  setIsOpen: (open: boolean) => void;
  onTrackingAdded: (newTracking: any) => void;
  projects: Project[];
}

const VIEW_OPTIONS = ["top", "bottom", "side", "behind", "front", "other"];

export function AddTrackingModal({
  setIsOpen,
  onTrackingAdded,
  projects,
}: AddTrackingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const username = useAuthStore((state) => state.username);

  // State Project
  const [projectId, setProjectId] = useState<string>("");
  // State untuk Project Baru (jika memilih 'new')
  const [newProjectName, setNewProjectName] = useState("");
  const [newWbsNumber, setNewWbsNumber] = useState("");

  const [switchboardName, setSwitchboardName] = useState("");
  const [compartmentNumber, setCompartmentNumber] = useState("");
  const [mechAssemblyBy, setMechAssemblyBy] = useState("");
  const [wiringType, setWiringType] = useState("");
  const [wiringBy, setWiringBy] = useState("");
  const [statusTest, setStatusTest] =
    useState<"Waiting" | "Tested" | "Already Compared with BOM">("Waiting");
  const [testedBy, setTestedBy] = useState("");
  const [dateTested, setDateTested] = useState<Date | undefined>();
  const [actualParts, setActualParts] = useState<ActualPart[]>([]);
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
    const newStatus = value as
      | "Waiting"
      | "Tested"
      | "Already Compared with BOM";
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
    // Validasi Basic
    if (!projectId || !switchboardName || !compartmentNumber) {
      toast.warning("Project, Switchboard Name, dan Compartment No. wajib diisi.");
      return;
    }

    // Validasi Project Baru
    if (projectId === "new") {
      if (!newProjectName.trim() || !newWbsNumber.trim()) {
        toast.warning("Nama Project dan WBS Number wajib diisi untuk project baru.");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Persiapkan Project ID Payload
      let projectIdPayload = null;
      
      if (projectId !== "new") {
        const numericProjectId = parseInt(projectId, 10);
        if (!isNaN(numericProjectId) && numericProjectId > 0) {
          projectIdPayload = { Int64: numericProjectId, Valid: true };
        }
      }

      // Construct Payload
      // Note: Pastikan backend menghandle `newProjectName` & `newWbsNumber` jika projectId kosong
      const payload: any = {
        projectId: projectIdPayload,
        switchboardName,
        compartmentNumber,
        mechAssemblyBy: mechAssemblyBy
          ? { String: mechAssemblyBy, Valid: true }
          : null,
        wiringType: wiringType ? { String: wiringType, Valid: true } : null,
        wiringBy: wiringBy ? { String: wiringBy, Valid: true } : null,
        statusTest,
        actualParts: actualParts.length > 0 ? actualParts : null,
        testedBy: testedBy ? { String: testedBy, Valid: true } : null,
        dateTested: dateTested
          ? { Time: dateTested.toISOString(), Valid: true }
          : null,
      };

      if (projectId === "new") {
        payload.newProjectName = { String: newProjectName, Valid: true };
        payload.newWbsNumber = { String: newWbsNumber, Valid: true };
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracking/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah data tracking.");
      }

      const newTracking = await response.json();
      toast.success("Data tracking berhasil disimpan.");
      onTrackingAdded(newTracking);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding tracking:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Tambah Data Progress Tracking</DialogTitle>
        <DialogDescription>
          Isi detail progress per kompartemen di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        defaultValue="general"
        className="w-full flex-1 overflow-hidden flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="parts">Part Detected</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh] md:h-[55vh] pr-4">
            <div className="space-y-4 p-1">
              <h4 className="font-medium text-lg">Detail Project</h4>

              {/* Project Select - Layout Atas Bawah */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="project">Project</Label>
                <Select onValueChange={setProjectId} value={projectId}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Pilih WBS / Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.projectName} ({p.wbsNumber})
                      </SelectItem>
                    ))}
                    <SelectItem value="new" className="text-black focus:text-black">
                      <div className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Buat Project Baru (Lainnya)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {projectId === "new" && (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newProjectName" className="text-blue-900">
                      Nama Project Baru <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newProjectName"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Masukkan Nama Project..."
                      className="bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="newWbsNumber" className="text-blue-900">
                      WBS Number Baru <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="newWbsNumber"
                      value={newWbsNumber}
                      onChange={(e) => setNewWbsNumber(e.target.value)}
                      placeholder="Masukkan WBS Number..."
                      className="bg-white"
                    />
                  </div>
                </div>
              )}

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

        <TabsContent
          value="parts"
          className="flex-1 overflow-hidden flex flex-col h-[50vh] md:h-[55vh]"
        >
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
                          <div
                            key={view}
                            className="flex items-center space-x-2"
                          >
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
                    Belum ada part ditambahkan. Gunakan input di bawah untuk
                    menambah.
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
          {isLoading ? "Menyimpan..." : "Simpan Data"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}