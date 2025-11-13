"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAuthStore,
  ProjectTracking,
  Project,
  ActualPart,
  ProjectTrackingPayload,
  PredictionResponse,
  DetectionResult,
  BomMaterial,
  RawDetectionBox,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Trash2,
  X,
  Bot,
  Save,
  Loader2,
  Image as ImageIcon,
  Eye,
  Check,
  PackagePlus,
  ArrowLeft,
  Settings,
  Upload,
  Undo2,
  PackageCheck,
  SendToBack,
  Edit,
  MousePointer,
  Square,
  ScanEye,
  ListTodo,
  UploadCloud
} from "lucide-react";
import { TrackingAuthSkeleton } from "./tracking-skeleton";
import { Badge } from "../ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BOX_COLORS, simpleStringHash } from "@/lib/colors";
import { AnnotationCanvas } from "./annotation-canvas";

// ... (Type Definitions remain unchanged)
type UploadedFileState = {
  file: File | null;
  preview: string;
  view: string | null;
};

type DetectionSummary = {
  class_name: string;
  quantity: number;
  avg_confidence: number;
  crops: string[];
};

type ViewDetectionData = {
  fullImage: string;
  crops: string[];
  qty: number;
};

type GroupedDetection = {
  [partName: string]: {
    isMultiView: boolean;
    totalDetected: number;
    byView: Map<string, ViewDetectionData>;
  };
};

type PartMigrationQuantities = {
  [partName: string]: number;
};

type ModalViewData = {
  view: string;
  fullImage: string;
  crops: string[];
  qty: number;
};

const VIEW_OPTIONS = ["top", "bottom", "side", "behind", "front", "other"];
const PYTHON_API_URL =
  process.env.NEXT_PUBLIC_PYTHON_API_URL || "http://localhost:5001";
const GO_API_URL = process.env.NEXT_PUBLIC_API_URL;

export function DetailTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const trackingId = params.id as string;
  const role = useAuthStore((state) => state.role);
  const [newBoxCrop, setNewBoxCrop] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ProjectTracking | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bomMaterials, setBomMaterials] = useState<BomMaterial[]>([]);
  const [actualParts, setActualParts] = useState<ActualPart[]>([]);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileState[]>([]);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>(
    []
  );
  const [confidence, setConfidence] = useState(0.25);
  const [iou, setIou] = useState(0.7);

  const [migratedParts, setMigratedParts] = useState(new Set<string>());
  const [partMigrationQuantities, setPartMigrationQuantities] =
    useState<PartMigrationQuantities>({});

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPartData, setModalPartData] = useState<ModalViewData[] | null>(
    null
  );

  const [isEditViewModalOpen, setIsEditViewModalOpen] = useState(false);
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [currentViewData, setCurrentViewData] =
    useState<DetectionResult | null>(null);
  const [newBoxData, setNewBoxData] = useState<{
    view: string;
    box: number[];
  } | null>(null);
  const [addPartPopoverOpen, setAddPartPopoverOpen] = useState(false);
  const [newPartNameFromModal, setNewPartNameFromModal] = useState("");
  
  const [annotationMode, setAnnotationMode] = useState<"pan" | "draw">("pan");
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedDetectionIndex, setSelectedDetectionIndex] = useState<number | null>(null);

  const [newPartName, setNewPartName] = useState("");
  const [isSuggestingPart, setIsSuggestingPart] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasSavedDetections, setHasSavedDetections] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function dataURLtoFile(dataurl: string, filename: string) {
    const arr = dataurl.split(',');
    // @ts-ignore
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // ... (All useEffects and helper functions remain strictly identical)
  // ... (getInitialData, groupedDetections, handleFileChange, handleStartDetection, etc.)
  // I will assume the logic code is unchanged here for brevity to fit the response 
  // and focus on the layout structure below.
  // -----------------------------------------------------------------------
  
  useEffect(() => {
    setIsClient(true);
    if (!role || !trackingId) return;

    const getInitialData = async () => {
      setIsLoadingData(true);
      try {
        const headers = { "X-User-Role": role };
        const [trackingRes, projectsRes, materialsRes] = await Promise.all([
          fetch(`${GO_API_URL}/api/tracking/${trackingId}`, { headers }),
          fetch(`${GO_API_URL}/api/projects/`, { headers }),
          fetch(`${GO_API_URL}/api/boms/materials`, { headers }),
        ]);

        if (!trackingRes.ok) throw new Error("Gagal mengambil data tracking");
        if (!projectsRes.ok) throw new Error("Gagal mengambil data projects");
        if (!materialsRes.ok)
          throw new Error("Gagal mengambil data BOM materials");

        const tracking = await trackingRes.json();
        setTrackingData(tracking);
        setActualParts(tracking.actualParts || []);
        setProjects(await projectsRes.json());
        
        const materialsData: BomMaterial[] = await materialsRes.json();
        const uniqueMaterialsMap = new Map<string, BomMaterial>();
        materialsData.forEach((item) => {
          if (!uniqueMaterialsMap.has(item.material)) {
            uniqueMaterialsMap.set(item.material, item);
          }
        });
        const uniqueMaterials = Array.from(uniqueMaterialsMap.values());
        setBomMaterials(uniqueMaterials);


        if (tracking.detectionResults && tracking.detectionResults.length > 0) {
          setDetectionResults(tracking.detectionResults);
          if (tracking.detectionSettings) {
            setConfidence(tracking.detectionSettings.confidence || 0.25);
            setIou(tracking.detectionSettings.iou || 0.7);
          }
          setHasSavedDetections(true);

          const loadedFiles: UploadedFileState[] =
            tracking.detectionResults.map((result: DetectionResult) => ({
              file: null,
              preview: result.originalImage,
              view: result.view,
            }));
          setUploadedFiles(loadedFiles);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Gagal memuat data: " + (error as Error).message);
      } finally {
        setIsLoadingData(false);
      }
    };
    getInitialData();
  }, [role, trackingId]);

  const groupedDetections = useMemo((): GroupedDetection => {
    const groups: GroupedDetection = {};

    for (const result of detectionResults) {
      const view = result.view;
      const fullOriginalImage = result.originalImage;

      const summaryMap = new Map<string, { qty: number; crops: string[] }>();

      if (currentViewData && currentViewData.view === view) {
        for (const det of currentViewData.detections) {
          if (!summaryMap.has(det.class_name)) {
            summaryMap.set(det.class_name, { qty: 0, crops: [] });
          }
          const entry = summaryMap.get(det.class_name)!;
          entry.qty += 1;
        }
      } else {
        for (const summaryItem of result.summary) {
          summaryMap.set(summaryItem.class_name, {
            qty: summaryItem.quantity,
            crops: summaryItem.crops,
          });
        }
      }

      for (const [partName, data] of summaryMap.entries()) {
        if (!groups[partName]) {
          groups[partName] = {
            isMultiView: false,
            totalDetected: 0,
            byView: new Map(),
          };
        }

        const partGroup = groups[partName];
        partGroup.byView.set(view, {
          fullImage: fullOriginalImage,
          crops: data.crops,
          qty: data.qty,
        });

        partGroup.totalDetected += data.qty;
      }
    }

    for (const partName in groups) {
      const group = groups[partName];
      group.isMultiView = group.byView.size > 1;
    }

    return groups;
  }, [detectionResults, currentViewData]);

  useEffect(() => {
    if (detectionResults.length > 0) {
      const detectedPartNames = new Set(Object.keys(groupedDetections));
      const actualPartNames = new Set(actualParts.map((p) => p.material));
      const newMigratedSet = new Set<string>();

      for (const detectedName of detectedPartNames) {
        if (actualPartNames.has(detectedName)) {
          newMigratedSet.add(detectedName);
        }
      }
      setMigratedParts(newMigratedSet);
    }
  }, [groupedDetections, actualParts, detectionResults]);

  useEffect(() => {
    setPartMigrationQuantities((prevQuantities) => {
      const newQuantities = { ...prevQuantities };
      for (const partName in groupedDetections) {
        if (prevQuantities[partName] === undefined) {
          const quantitiesPerView = Array.from(groupedDetections[partName].byView.values()).map(v => v.qty);
          const maxQty = Math.max(...quantitiesPerView);
          newQuantities[partName] = maxQty > 0 ? maxQty : 0;
        }
      }
      return newQuantities;
    });
  }, [groupedDetections]);

  useEffect(() => {
    if (!isLoadingData) {
      setIsInitialLoad(false);
    }
  }, [isLoadingData]);

  const canEdit = role === "Admin" || role === "PIC";

  useEffect(() => {
    if (isInitialLoad || !canEdit) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log("Auto-saving...");
      handleSaveChanges(true);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [actualParts]);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles || hasSavedDetections) {
      if (hasSavedDetections) {
        toast.warning(
          "Reset deteksi terlebih dahulu untuk upload gambar baru."
        );
      }
      return;
    }

    const files = Array.from(newFiles).filter((f) =>
      f.type.startsWith("image/")
    );

    const newFileStates: UploadedFileState[] = files.map((file) => ({
      file: file,
      preview: URL.createObjectURL(file),
      view: null,
    }));
    setUploadedFiles((prev) => [...prev, ...newFileStates]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!hasSavedDetections) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!hasSavedDetections) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const removeUploadedFile = (index: number) => {
    const fileState = uploadedFiles[index];
    if (fileState.file) {
      URL.revokeObjectURL(fileState.preview);
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const setFileView = (index: number, view: string) => {
    setUploadedFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, view: view } : f))
    );
  };

  const canStartDetection =
    uploadedFiles.length > 0 &&
    uploadedFiles.every((f) => f.view !== null && f.file !== null);

  const handleStartDetection = async () => {
    if (!canStartDetection) {
      toast.warning("Harap pilih 'view' untuk setiap gambar.");
      return;
    }
    setIsDetecting(true);
    setDetectionResults([]);
    setMigratedParts(new Set());
    setPartMigrationQuantities({});
    const results: DetectionResult[] = [];

    for (const fileState of uploadedFiles) {
      if (!fileState.view || !fileState.file) continue;

      const formData = new FormData();
      formData.append("file", fileState.file);
      formData.append("conf", String(confidence));
      formData.append("iou", String(iou));

      try {
        const response = await fetch(`${PYTHON_API_URL}/predict`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Deteksi ${fileState.view} gagal.`);
        }

        const data: PredictionResponse = await response.json();
        results.push({
          view: fileState.view,
          originalImage: data.original_image,
          detections: data.detections,
          summary: data.summary,
        });
      } catch (error) {
        console.error(error);
        toast.error((error as Error).message);
      }
    }

    setDetectionResults(results);
    setIsDetecting(false);
    toast.success(`Deteksi selesai: ${results.length} gambar diproses.`);

    try {
      const payload = {
        settings: { confidence, iou },
        results: results,
      };
      const response = await fetch(
        `${GO_API_URL}/api/tracking/${trackingId}/detection-results`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role as string,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Gagal menyimpan hasil deteksi");

      setHasSavedDetections(true);
      toast.success("Hasil deteksi berhasil disimpan di server.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan hasil deteksi: " + (error as Error).message);
    }
  };

  const handleResetDetection = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mereset hasil deteksi? Gambar yang di-upload dan hasil deteksi akan dihapus. Part Actual tidak akan berubah."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(
        `${GO_API_URL}/api/tracking/${trackingId}/detection-results`,
        {
          method: "DELETE",
          headers: {
            "X-User-Role": role as string,
          },
        }
      );
      if (!response.ok) throw new Error("Gagal mereset deteksi");

      setDetectionResults([]);
      setUploadedFiles([]);
      setMigratedParts(new Set());
      setPartMigrationQuantities({});
      setHasSavedDetections(false);
      toast.success("Hasil deteksi telah direset. Anda bisa upload ulang.");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleMigratePart = (partName: string) => {
    const partData = groupedDetections[partName];
    if (!partData) return;

    const qtyToMigrate = partMigrationQuantities[partName] || 0;
    if (qtyToMigrate <= 0) {
      toast.warning("Kuantitas migrasi harus lebih dari 0.");
      return;
    }

    const views = Array.from(partData.byView.keys());
    let updatedParts = [...actualParts];

    const existingPartIndex = updatedParts.findIndex(
      (p) => p.material === partName
    );

    if (existingPartIndex > -1) {
      updatedParts = updatedParts.map((part, index) => {
        if (index !== existingPartIndex) return part;
        return {
          ...part,
          qty: part.qty + qtyToMigrate,
          views: Array.from(new Set([...part.views, ...views])),
        };
      });
    } else {
      updatedParts.push({
        material: partName,
        qty: qtyToMigrate,
        views: views,
      });
    }

    setActualParts(updatedParts);
    setMigratedParts((prev) => new Set(prev).add(partName));
    toast.success(`${partName} (Qty: ${qtyToMigrate}) berhasil dimigrasi.`);
  };

  const handleMigrationQtyChange = (partName: string, qty: number) => {
    setPartMigrationQuantities((prev) => ({
      ...prev,
      [partName]: qty > 0 ? qty : 0,
    }));
  };

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

  const handleRevertPart = (material: string) => {
    setActualParts((prev) => prev.filter((p) => p.material !== material));

    setMigratedParts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(material);
      return newSet;
    });

    const originalQty = groupedDetections[material]?.totalDetected || 0;

    setPartMigrationQuantities((prev) => ({
      ...prev,
      [material]: originalQty,
    }));

    toast.info(`${material} dikembalikan ke Hasil Deteksi.`);
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

  const handleSaveChanges = async (isAutoSave = false) => {
    if (!trackingData || !role) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      const payload: ProjectTrackingPayload = {
        projectId: trackingData.projectId,
        switchboardName: trackingData.switchboardName,
        compartmentNumber: trackingData.compartmentNumber,
        mechAssemblyBy: trackingData.mechAssemblyBy,
        wiringType: trackingData.wiringType,
        wiringBy: trackingData.wiringBy,
        statusTest: trackingData.statusTest,
        testedBy: trackingData.testedBy,
        dateTested: trackingData.dateTested,
        actualParts: actualParts.length > 0 ? actualParts : null,
      };

      const response = await fetch(
        `${GO_API_URL}/api/tracking/${trackingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan perubahan.");
      }

      if (!isAutoSave) {
        toast.success("Perubahan Actual Parts berhasil disimpan!");

        const updatedTracking = await (
          await fetch(`${GO_API_URL}/api/tracking/${trackingId}`, {
            headers: { "X-User-Role": role },
          })
        ).json();

        setTrackingData(updatedTracking);
        setActualParts(updatedTracking.actualParts || []);

        setDetectionResults(updatedTracking.detectionResults || []);
        if (
          updatedTracking.detectionResults &&
          updatedTracking.detectionResults.length > 0
        ) {
          setHasSavedDetections(true);
        } else {
          setHasSavedDetections(false);
          setDetectionResults([]);
          setMigratedParts(new Set());
          setPartMigrationQuantities({});
        }
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const viewAnnotatedImages = (
    byViewMap: Map<string, ViewDetectionData>
  ) => {
    if (byViewMap.size === 0) {
      toast.warning("Tidak ada gambar terdeteksi untuk part ini.");
      return;
    }
    const dataArray: ModalViewData[] = Array.from(byViewMap.entries()).map(
      ([view, data]) => ({
        view,
        ...data,
      })
    );

    setModalPartData(dataArray);
    setIsModalOpen(true);
  };

  const openEditView = (view: string) => {
    const viewData = detectionResults.find((r) => r.view === view);
    if (viewData) {
      setCurrentViewData(viewData);
      setAnnotationMode("pan"); 
      setSelectedClassName(null);
      setSelectedDetectionIndex(null);
      setIsEditViewModalOpen(true);
    } else {
      toast.error("Data view tidak ditemukan.");
    }
  };

  const handleDeleteDetection = (index: number) => {
    if (!currentViewData) return;

    const deletedDet = currentViewData.detections[index];
    const updatedDetections = currentViewData.detections.filter(
      (_, i) => i !== index
    );
    const updatedViewData = { ...currentViewData, detections: updatedDetections };

    setCurrentViewData(updatedViewData);
    setSelectedDetectionIndex(null);
    
    const remainingOfClass = updatedDetections.some(
      (d) => d.class_name === deletedDet.class_name
    );
    if (!remainingOfClass) {
      setSelectedClassName(null);
    }
  };

  const handleStartAddAnnotation = async (data: { box: number[]; crop: string }) => {
    if (!currentViewData) return;

    setNewBoxData({ view: currentViewData.view, box: data.box });
    setNewBoxCrop(data.crop);
    setIsAddPartModalOpen(true);

    setIsSuggestingPart(true);
    setNewPartNameFromModal("");

    try {
      const cropFile = dataURLtoFile(data.crop, "crop_suggestion.jpg");
      
      const formData = new FormData();
      formData.append("file", cropFile);
      formData.append("conf", String(confidence));
      formData.append("iou", String(iou));

      const response = await fetch(`${PYTHON_API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal mendapatkan saran part");
      }

      const prediction: PredictionResponse = await response.json();

      if (prediction.detections && prediction.detections.length > 0) {
        const topDetection = prediction.detections.sort((a, b) => b.confidence - a.confidence)[0];
        setNewPartNameFromModal(topDetection.class_name);
        toast.success(`Saran AI: ${topDetection.class_name}`);
      } else {
        toast.info("AI tidak menemukan saran part yang cocok.");
      }
    } catch (error) {
      console.error("Error suggesting part:", error);
      toast.error((error as Error).message);
    } finally {
      setIsSuggestingPart(false);
    }
  };

  const handleSaveNewAnnotation = () => {
    if (!newBoxData || !currentViewData || newPartNameFromModal === "") {
      toast.error("Pilih part terlebih dahulu.");
      return;
    }

    const selectedMaterial = bomMaterials.find(
      (m) => m.material === newPartNameFromModal
    );
    if (!selectedMaterial) {
      toast.error("Part tidak valid.");
      return;
    }

    const newDetection: RawDetectionBox = {
      box: newBoxData.box,
      confidence: 1.0, 
      class_id: -1, 
      class_name: selectedMaterial.material,
    };

    const updatedDetections = [...currentViewData.detections, newDetection];
    const updatedViewData = { ...currentViewData, detections: updatedDetections };
    const newIndex = updatedDetections.length - 1;

    setCurrentViewData(updatedViewData);

    setIsAddPartModalOpen(false);
    setNewBoxData(null);
    setNewBoxCrop(null);
    setNewPartNameFromModal("");
    
    setSelectedClassName(newDetection.class_name);
    setSelectedDetectionIndex(newIndex);
  };

  const saveEditedDetections = async () => {
    try {
      const finalDetectionResults = detectionResults.map(r => 
        r.view === currentViewData?.view ? currentViewData! : r
      );
      
      const payload = {
        settings: { confidence, iou },
        results: finalDetectionResults, 
      };
      
      const response = await fetch(
        `${GO_API_URL}/api/tracking/${trackingId}/detection-results`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role as string,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Gagal menyimpan hasil deteksi");

      setDetectionResults(finalDetectionResults); 
      
      setIsEditViewModalOpen(false);
      setCurrentViewData(null);
      setSelectedClassName(null);
      setSelectedDetectionIndex(null);
      toast.success("Perubahan anotasi berhasil disimpan.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan perubahan: " + (error as Error).message);
    }
  };
  
  const annotationSummary = useMemo(() => {
    if (!currentViewData) return [];
    
    const summary = new Map<string, { count: number, color: string }>();
    
    for (const det of currentViewData.detections) {
      const className = det.class_name || "Unlabeled";
      const hash = simpleStringHash(className);
      const color = BOX_COLORS[hash % BOX_COLORS.length];
      
      if (!summary.has(className)) {
        summary.set(className, { count: 0, color: color });
      }
      summary.get(className)!.count += 1;
    }
    
    return Array.from(summary.entries()).map(([className, data]) => ({
      className,
      ...data,
    })).sort((a,b) => a.className.localeCompare(b.className));
    
  }, [currentViewData]);

  const sortedDetectedPartsList = useMemo(() => {
    return Object.entries(groupedDetections).sort((a, b) => {
      const [partNameA] = a;
      const [partNameB] = b;
      const isMigratedA = migratedParts.has(partNameA);
      const isMigratedB = migratedParts.has(partNameB);

      if (isMigratedA === isMigratedB) {
        return 0;
      }
      return isMigratedA ? 1 : -1;
    });
  }, [groupedDetections, migratedParts]);

  const unmigratedPartsCount = useMemo(() => {
    return sortedDetectedPartsList.filter(
      ([partName]) => !migratedParts.has(partName)
    ).length;
  }, [sortedDetectedPartsList, migratedParts]);

  const handleMigrateAll = () => {
    let updatedParts = [...actualParts];
    const newMigratedParts = new Set(migratedParts);
    let migrationCount = 0;

    for (const [partName, partData] of sortedDetectedPartsList) {
      if (newMigratedParts.has(partName)) continue;

      const qtyToMigrate =
        partMigrationQuantities[partName] || partData.totalDetected;
      if (qtyToMigrate <= 0) continue;

      const views = Array.from(partData.byView.keys());
      const existingPartIndex = updatedParts.findIndex(
        (p) => p.material === partName
      );

      if (existingPartIndex > -1) {
        updatedParts = updatedParts.map((part, index) => {
          if (index !== existingPartIndex) return part;
          return {
            ...part,
            qty: part.qty + qtyToMigrate,
            views: Array.from(new Set([...part.views, ...views])),
          };
        });
      } else {
        updatedParts.push({
          material: partName,
          qty: qtyToMigrate,
          views: views,
        });
      }

      newMigratedParts.add(partName);
      migrationCount++;
    }

    if (migrationCount === 0) {
      toast.info("Tidak ada part untuk dimigrasi (pastikan Qty > 0).");
      return;
    }

    setActualParts(updatedParts);
    setMigratedParts(newMigratedParts);
    toast.success(`${migrationCount} part berhasil dimigrasi.`);
  };

  const revertablePartsCount = useMemo(() => {
    return actualParts.filter((p) =>
      Object.keys(groupedDetections).includes(p.material)
    ).length;
  }, [actualParts, groupedDetections]);

  const handleRevertAll = () => {
    const partsToRevert = actualParts.filter((p) =>
      Object.keys(groupedDetections).includes(p.material)
    );
    if (partsToRevert.length === 0) {
      toast.info("Tidak ada part terdeteksi untuk dikembalikan.");
      return;
    }

    const newActualParts = actualParts.filter(
      (p) => !Object.keys(groupedDetections).includes(p.material)
    );
    const newMigratedParts = new Set<string>();
    const newMigrationQuantities = { ...partMigrationQuantities };
    for (const part of partsToRevert) {
      newMigrationQuantities[part.material] =
        groupedDetections[part.material].totalDetected;
    }

    setActualParts(newActualParts);
    setMigratedParts(newMigratedParts);
    setPartMigrationQuantities(newMigrationQuantities);
    toast.success(`${partsToRevert.length} part berhasil dikembalikan.`);
  };

  if (!isClient || isLoadingData || !trackingData) {
    return <TrackingAuthSkeleton />;
  }

  // --- LAYOUT COMPONENTS START ---
  // We extract these to avoid duplication between desktop (Grid) and mobile (Tabs) layouts

  const uploadSection = (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>1. Upload & View</CardTitle>
            <CardDescription className="mt-2 line-clamp-1">
              {hasSavedDetections
                ? "Deteksi tersimpan."
                : "Drag files / click select."}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Detection Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-3">
                    <Label
                      htmlFor="confidence"
                      className="flex justify-between mb-2"
                    >
                      <span>Confidence</span>
                      <span className="text-primary">
                        {confidence.toFixed(2)}
                      </span>
                    </Label>
                    <Slider
                      id="confidence"
                      defaultValue={[confidence]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(val) => setConfidence(val[0])}
                      disabled={
                        !canEdit || isDetecting || hasSavedDetections
                      }
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="iou"
                      className="flex justify-between mb-2"
                    >
                      <span>IoU</span>
                      <span className="text-primary">
                        {iou.toFixed(2)}
                      </span>
                    </Label>
                    <Slider
                      id="iou"
                      defaultValue={[iou]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(val) => setIou(val[0])}
                      disabled={
                        !canEdit || isDetecting || hasSavedDetections
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() =>
                      (
                        document.querySelector(
                          '[data-state="open"] [aria-label="Close"]'
                        ) as HTMLElement
                      )?.click()
                    }
                  >
                    Done
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSelectClick}
              disabled={!canEdit || isDetecting || hasSavedDetections}
            >
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Select</span>
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={!canEdit || isDetecting || hasSavedDetections}
              className="hidden"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={`flex flex-col flex-grow h-[52vh] overflow-scroll p-4 transition-colors ${
          isDragging
            ? "bg-primary/5 ring-2 ring-primary ring-inset"
            : hasSavedDetections
            ? "bg-muted/30"
            : "bg-transparent"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedFiles.length > 0 ? (
          <ScrollArea className="flex-grow rounded-md p-2">
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file.preview}
                  className="flex items-center gap-3 p-2 border rounded-lg"
                >
                  <Image
                    src={file.preview}
                    alt={file.file?.name || `Preview ${index}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-cover rounded-md bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {file.file?.name || `${file.view} (Tersimpan)`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.file
                        ? `${(file.file.size / 1024 / 1024).toFixed(
                            2
                          )} MB`
                        : "Deteksi tersimpan"}
                    </p>
                    <Select
                      value={file.view || ""}
                      onValueChange={(value) => setFileView(index, value)}
                      disabled={
                        !canEdit || isDetecting || hasSavedDetections
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Pilih View" />
                      </SelectTrigger>
                      <SelectContent>
                        {VIEW_OPTIONS.map((v) => (
                          <SelectItem
                            key={v}
                            value={v}
                            className="capitalize"
                          >
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hasSavedDetections && canEdit && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEditView(file.view!)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    onClick={() => removeUploadedFile(index)}
                    disabled={
                      !canEdit ||
                      isDetecting ||
                      hasSavedDetections ||
                      !file.file
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-grow text-center py-16 border border-dashed rounded-md flex flex-col justify-center items-center">
            <ImageIcon
              className="mx-auto h-12 w-12 text-muted-foreground mb-4"
            />
            <h3 className="text-lg mb-2 font-regular">
              {hasSavedDetections
                ? "Deteksi Tersimpan"
                : "No images uploaded"}
            </h3>
            <p className="text-sm font-light text-muted-foreground">
              {hasSavedDetections
                ? "Klik 'Reset' untuk upload ulang."
                : 'Drag files here.'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {hasSavedDetections ? (
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleResetDetection}
            disabled={!canEdit || isResetting || isDetecting}
          >
            {isResetting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Undo2 className="mr-2 h-4 w-4" />
            )}
            Reset Deteksi
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleStartDetection}
            disabled={!canEdit || !canStartDetection || isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            Mulai Deteksi ({uploadedFiles.length})
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const detectionSection = (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>2. Hasil Deteksi</CardTitle>
            <CardDescription className="mt-2">
              Hasil deteksi per part.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMigrateAll}
            disabled={
              !canEdit || isDetecting || unmigratedPartsCount === 0
            }
          >
            <SendToBack className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Move All to Final</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow h-[60vh] overflow-scroll">
        <ScrollArea className="flex-grow p-1 pr-3">
          <div className="space-y-3">
            {isDetecting && (
              <div className="text-center text-muted-foreground py-10">
                <Loader2 className="h-6 w-6 animate-spin inline-block mb-2" />
                <p>Memproses deteksi...</p>
              </div>
            )}
            {!isDetecting && sortedDetectedPartsList.length === 0 && (
              <div className="text-center text-muted-foreground py-10 font-light">
                <Bot className="h-8 w-8 mx-auto mb-2 font-light" />
                Belum ada hasil deteksi.
              </div>
            )}
            {!isDetecting &&
              sortedDetectedPartsList.length > 0 &&
              unmigratedPartsCount === 0 && (
                <div className="text-center text-green-600 py-4 font-light border rounded-md bg-green-50 dark:bg-green-950/30">
                  <Check className="h-6 w-6 mx-auto mb-1 font-light" />
                  Semua part telah dimigrasi.
                </div>
              )}

            {sortedDetectedPartsList.map(([partName, partData]) => {
              const isMigrated = migratedParts.has(partName);
              const isMultiView = partData.isMultiView;

              let cardClass = "bg-background/50";
              if (!isMigrated && isMultiView) {
                cardClass =
                  "bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700";
              } else if (!isMigrated && !isMultiView) {
                cardClass =
                  "bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700";
              }

              return (
                <div
                  key={partName}
                  className={`p-3 border rounded-lg space-y-3 ${cardClass}`}
                >
                  <div className="flex justify-between items-center font-light">
                    <Label className="text-base sm:text-lg font-light break-all">{partName}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() =>
                        viewAnnotatedImages(partData.byView)
                      }
                      disabled={partData.byView.size === 0}
                    >
                      <Eye className="h-4 w-4 sm:mr-1" /> 
                      <span className="hidden sm:inline">({partData.byView.size} View)</span>
                    </Button>
                  </div>

                  <div className="pl-2 space-y-1">
                    <Label className="text-xs font-light text-muted-foreground">
                      Deteksi per View:
                    </Label>
                    {Array.from(partData.byView.entries()).map(
                      ([view, data]) => (
                        <div
                          key={view}
                          className="flex justify-between items-center text-sm font-light"
                        >
                          <span className="capitalize">{view}:</span>
                          <span>{data.qty}</span>
                        </div>
                      )
                    )}
                    <div className="flex justify-between font-light items-center text-sm pt-1 border-t">
                      <span>Total Deteksi:</span>
                      <span>{partData.totalDetected}</span>
                    </div>
                  </div>

                  {!isMigrated && isMultiView && (
                    <p className="text-xs font-light text-yellow-800 dark:text-yellow-300">
                      ⚠️ Terdeteksi di {partData.byView.size} view.
                      Periksa total actual qty.
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`qty-migrate-${partName}`}
                      className="text-sm font-light whitespace-nowrap"
                    >
                      Act. Qty
                    </Label>
                    <Input
                      id={`qty-migrate-${partName}`}
                      type="number"
                      className="h-8 w-16"
                      min="0"
                      value={partMigrationQuantities[partName] || 0}
                      onChange={(e) =>
                        handleMigrationQtyChange(
                          partName,
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled={!canEdit || isMigrated}
                    />
                    <Button
                      className="flex-1 h-8 font-light"
                      size="sm"
                      onClick={() => handleMigratePart(partName)}
                      disabled={!canEdit || isMigrated}
                      variant={isMigrated ? "secondary" : "default"}
                    >
                      {isMigrated ? (
                        <PackageCheck className="mr-2 h-4 w-4" />
                      ) : (
                        <PackagePlus className="mr-2 h-4 w-4" />
                      )}
                      {isMigrated
                        ? "Moved"
                        : "Move to Final"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  const actualSection = (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>3. Actual List</CardTitle>
            <CardDescription className="mt-2">
              List final part.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevertAll}
            disabled={
              !canEdit || isDetecting || revertablePartsCount === 0
            }
          >
            <Undo2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Rollback</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col flex-grow h-[60vh] overflow-scroll">
        <ScrollArea className="flex-grow rounded-md">
          <div className="space-y-4 font-light">
            {actualParts.map((part) => {
              const wasDetected = Object.keys(groupedDetections).includes(
                part.material
              );

              return (
                <div
                  key={part.material}
                  className="p-3 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <Label className="font-light text-base break-all">{part.material}</Label>

                    {wasDetected ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#008A15]"
                        onClick={() => handleRevertPart(part.material)}
                        disabled={!canEdit}
                        title="Kembalikan ke Hasil Deteksi"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        onClick={() => handleRemovePart(part.material)}
                        disabled={!canEdit}
                        title="Hapus Part Manual"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="font-light" htmlFor={`qty-edit-${part.material}`}>
                      Qty
                    </Label>
                    <Input
                      id={`qty-edit-${part.material}`}
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
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-light mt-2">Views:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {VIEW_OPTIONS.map((view) => (
                        <div
                          key={view}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`view-edit-${part.material}-${view}`}
                            checked={part.views.includes(view)}
                            onCheckedChange={(checked) =>
                              handlePartViewChange(
                                part.material,
                                view,
                                !!checked
                              )
                            }
                            disabled={!canEdit}
                          />
                          <Label
                            htmlFor={`view-edit-${part.material}-${view}`}
                            className="font-light capitalize text-xs"
                          >
                            {view}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {actualParts.length === 0 && (
              <div className="text-center text-muted-foreground py-10 font-light">
                <ListTodo className="h-8 w-8 mx-auto mb-2 font-light" />
                Belum ada part.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Part baru..."
            value={newPartName}
            onChange={(e) => setNewPartName(e.target.value)}
            disabled={!canEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddPart();
            }}
          />
          <Button onClick={handleAddPart} disabled={!canEdit} size="icon">
            <PackagePlus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // --- LAYOUT COMPONENTS END ---


  return (
    <>
      {/* Modals */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setModalPartData(null);
        }}
      >
        <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0 sm:p-6">
          <DialogHeader className="p-4 sm:p-0">
            <DialogTitle>Detail Part Terdeteksi</DialogTitle>
          </DialogHeader>

          {modalPartData && modalPartData.length > 0 ? (
            <Tabs
              defaultValue={modalPartData[0].view}
              className="flex-1 flex flex-col overflow-hidden px-4 sm:px-0"
            >
              <TabsList className="overflow-x-auto w-full justify-start h-auto p-1">
                {modalPartData.map((data) => (
                  <TabsTrigger
                    key={data.view}
                    value={data.view}
                    className="capitalize"
                  >
                    {data.view} ({data.qty})
                  </TabsTrigger>
                ))}
              </TabsList>

              {modalPartData.map((data) => (
                <TabsContent
                  key={data.view}
                  value={data.view}
                  className="flex-1 overflow-hidden mt-2"
                >
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-4 h-full overflow-y-auto">
                    <div className="flex flex-col border rounded-md p-2 min-h-[300px]">
                      <h3 className="text-lg mb-2 font-medium">
                        Anotasi ({data.view})
                      </h3>
                      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/20">
                        <img
                          src={data.fullImage}
                          alt={`Full anotasi ${data.view}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col border rounded-md p-2 overflow-hidden">
                      <h3 className="text-lg mb-2 font-medium">
                        Crops ({data.crops.length})
                      </h3>
                      <ScrollArea className="flex-1 h-[200px] md:h-auto">
                        <div className="grid grid-cols-3 gap-2 p-1">
                          {data.crops.map((crop, index) => (
                            <img
                              key={index}
                              src={crop}
                              alt={`Crop ${index + 1}`}
                              className="border rounded-md aspect-square object-cover"
                            />
                          ))}
                          {data.crops.length === 0 && (
                            <p className="text-muted-foreground col-span-full text-center">
                              Tidak ada crop.
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          <DialogFooter className="p-4 sm:p-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit View Modal (Canvas) */}
      <Dialog
        open={isEditViewModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentViewData(null);
            setAnnotationMode("pan"); 
            setSelectedClassName(null);
            setSelectedDetectionIndex(null);
          }
          setIsEditViewModalOpen(open);
        }}
      >
        <DialogContent className="max-w-[100vw] w-full h-[100vh] sm:max-w-[90vw] sm:h-[90vh] flex flex-col p-0 sm:p-6">
          <DialogHeader className="p-4 sm:p-0 bg-background z-10">
            <DialogTitle className="font-light">
              Edit Anotation - {currentViewData?.view}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col md:grid md:grid-cols-4 gap-4 flex-1 w-full overflow-hidden relative">
            
            <div className="hidden md:flex md:col-span-1 flex-col border-r pr-4 h-full">
               <Separator className="mb-4" />
               <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {annotationSummary.map((item) => {
                    const isSelected = selectedClassName === item.className;
                    return (
                      <Button
                        key={item.className}
                        variant={isSelected ? "default" : "ghost"}
                        className="w-full justify-between h-auto py-2 px-3"
                        onClick={() => {
                          const newClassName = isSelected ? null : item.className;
                          setSelectedClassName(newClassName);
                          
                          if (newClassName && currentViewData) {
                            const firstIndex = currentViewData.detections.findIndex(
                              (d) => d.class_name === newClassName
                            );
                            setSelectedDetectionIndex(firstIndex !== -1 ? firstIndex : null);
                          } else {
                            setSelectedDetectionIndex(null);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                           <div 
                             className="h-3 w-3 rounded-full flex-shrink-0" 
                             style={{ backgroundColor: item.color }}
                           />
                           <span className={`font-light text-left truncate ${
                             isSelected ? "text-primary-foreground" : "text-foreground"
                           }`}>
                             {item.className}
                           </span>
                        </div>
                        <Badge 
                          variant={isSelected ? "outline" : "secondary"}
                          className={isSelected 
                            ? "text-primary-foreground border-primary-foreground" 
                            : ""
                          }
                        >
                          {item.count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
               </ScrollArea>
            </div>
            
            <div className="flex-1 md:col-span-3 h-full w-full overflow-hidden relative bg-neutral-100 dark:bg-neutral-900">
              <div className="absolute top-4 right-4 z-10 bg-background p-1.5 rounded-lg border shadow-md flex flex-col gap-1">
                <Button
                  variant={annotationMode === "pan" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setAnnotationMode("pan")}
                  title="Geser (Pan)"
                >
                  <MousePointer className="h-4 w-4" />
                </Button>
                <Button
                  variant={annotationMode === "draw" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setAnnotationMode("draw")}
                  title="Anotasi (Draw)"
                  disabled={!canEdit}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
              
              {currentViewData && (
                <AnnotationCanvas
                  imageUrl={currentViewData.originalImage}
                  detections={currentViewData.detections}
                  onDeleteDetection={handleDeleteDetection}
                  onAddDetection={handleStartAddAnnotation}
                  canEdit={canEdit}
                  mode={annotationMode}
                  selectedClassName={selectedClassName} 
                  selectedDetectionIndex={selectedDetectionIndex}
                />
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 sm:p-0  z-10 border-t sm:border-none">
            <Button
              variant="outline"
              onClick={() => setIsEditViewModalOpen(false)}
              className="mr-2"
            >
              Batal
            </Button>
            <Button onClick={saveEditedDetections} disabled={!canEdit}>
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isAddPartModalOpen} 
        onOpenChange={(open) => {
          setIsAddPartModalOpen(open);
          if (!open) {
            setNewBoxData(null);
            setNewBoxCrop(null);
            setNewPartNameFromModal("");
            setIsSuggestingPart(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Anotasi Manual</DialogTitle>
          </DialogHeader>
          {newBoxCrop && (
            <div className="flex justify-center my-2 border bg-muted/30 rounded-md overflow-hidden">
              <Image
                src={newBoxCrop}
                alt="Potongan Anotasi"
                width={200}
                height={200}
                className="object-contain max-h-[200px] w-auto"
              />
            </div>
          )}
          <div className="grid gap-4 py-4">
            <Label>Pilih Part</Label>
            <Popover
              open={addPartPopoverOpen}
              onOpenChange={setAddPartPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={addPartPopoverOpen}
                  className="w-full justify-between"
                  disabled={isSuggestingPart}
                >
                  {isSuggestingPart ? (
                    <div className="flex items-center text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mencari saran...
                    </div>
                  ) : (
                    newPartNameFromModal || "Pilih material..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Cari material..." />
                  <CommandEmpty>Material tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-48">
                      {bomMaterials.map((material) => (
                        <CommandItem
                          key={material.material}
                          value={material.material}
                          onSelect={(currentValue) => {
                            setNewPartNameFromModal(
                              currentValue === newPartNameFromModal
                                ? ""
                                : material.material
                            );
                            setAddPartPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              newPartNameFromModal === material.material
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {material.material}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPartModalOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSaveNewAnnotation}>Tambah Part</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto pb-16">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/tracking")}
                className="mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <h1 className="text-4xl tracking-tight">Detail Tracking</h1>
            </div>
            {canEdit && (
              <div className="hidden sm:flex items-center justify-center h-10 px-4 py-2 text-sm rounded-md bg-muted w-48">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">Otomatis tersimpan</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm">
             <Badge variant="secondary" className="px-2 py-1 font-normal">
                {trackingData.projectName?.String || "-"}
             </Badge>
             <Badge variant="secondary" className="px-2 py-1 font-normal">
                WBS: {trackingData.wbsNumber?.String || "-"}
             </Badge>
             <Badge variant="secondary" className="px-2 py-1 font-normal">
                {trackingData.switchboardName || "-"}
             </Badge>
             <Badge variant="secondary" className="px-2 py-1 font-normal">
                Compartment: {trackingData.compartmentNumber || "-"}
             </Badge>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-full">
             {uploadSection}
          </div>
          <div className="lg:col-span-1 h-full">
             {detectionSection}
          </div>
          <div className="lg:col-span-1 h-full">
             {actualSection}
          </div>
        </div>

        <div className="lg:hidden">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="upload" className="flex gap-2">
                <UploadCloud className="h-4 w-4" /> 
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex gap-2">
                 <ScanEye className="h-4 w-4" />
                 <span className="hidden sm:inline">Hasil</span>
                 <span className="sm:hidden">Hasil</span>
              </TabsTrigger>
              <TabsTrigger value="actual" className="flex gap-2">
                 <ListTodo className="h-4 w-4" />
                 <span className="hidden sm:inline">List Final</span>
                 <span className="sm:hidden">Final</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              {uploadSection}
            </TabsContent>
            <TabsContent value="results">
              {detectionSection}
            </TabsContent>
            <TabsContent value="actual">
              {actualSection}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </>
  );
}