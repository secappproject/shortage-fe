import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  username: string | null;
  role: string | null;
  companyName: string | null;
  vendorType: string | null;
  isLoggedIn: boolean;
  login: (userData: {
    username: string;
    role: string;
    companyName: string | null;
    vendorType: string | null;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      role: null,
      companyName: null,
      vendorType: null,
      isLoggedIn: false,

      login: (userData) =>
        set({
          username: userData.username,
          role: userData.role,
          companyName: userData.companyName,
          vendorType: userData.vendorType,
          isLoggedIn: true,
        }),

      logout: () =>
        set({
          username: null,
          role: null,
          companyName: null,
          vendorType: null,
          isLoggedIn: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export type NullString = {
  String: string;
  Valid: boolean;
};
export type NullTime = {
  Time: string;
  Valid: boolean;
};
export type SqlNullString = { String: string; Valid: boolean };
export type SqlNullTime = { Time: string; Valid: boolean };

export type User = {
  id: number;
  username: string;
  role: string;
  companyName: NullString | null;
  vendorType: NullString | null;
};
export interface Vendor {
  id: number;
  companyName: string;
  vendorType: string;
  createdAt: string;
  updatedAt: string;
}
export interface Project {
  id: number;
  wbsNumber: string;
  projectName: string;
  vendorName: NullString | null;
  createdAt: string;
  updatedAt: string;
}


export interface BOM {
  id: number;
  bomCode: string;
  versionTag: string; 
  partReference: string;
  material: string;
  materialDescription: string;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface BomMaterialItem {
  id: number;
  material: string;
  materialDescription: string;
  partReference: string;
  qty: number;
}

export interface BomVersionGroup {
  bomCode: string;
  activeVersion: string; 
  versions: Map<string, BomMaterialItem[]>;
}

export interface ComparisonView {
  id: number;
  bomCode: string;
  versionTag: string;
  trackingId: number;
  projectName: NullString | null;
  wbsNumber: NullString | null;
  switchboardName: string;
  compartmentNumber: string;
  createdAt: string;
  shortageItems: CompareItemDetail[];
  excessItems: CompareItemDetail[];
  unlistedItems: CompareItemDetail[];
}
export interface BomMaterial {
  material: string;
  materialDescription: string;
}
export interface ActualPart {
  material: string;
  qty: number;
  views: string[];
}
export interface DetectionSummary {
  class_name: string;
  quantity: number;
  avg_confidence: number;
  crops: string[];
}

export interface RawDetectionBox {
  box: number[];
  confidence: number;
  class_id: number;
  class_name: string;
}

export interface DetectionResult {
  view: string;
  originalImage: string;
  detections: RawDetectionBox[];
  summary: DetectionSummary[];
}

export interface DetectionSettings {
  confidence: number;
  iou: number;
}

export interface PredictionResponse {
  summary: DetectionSummary[];
  original_image: string;
  detections: RawDetectionBox[];
}

export interface ProjectTracking {
  id: number;
  projectId: { Int64: number; Valid: boolean } | null;
  projectName: NullString | null;
  wbsNumber: NullString | null;
  switchboardName: string;
  compartmentNumber: string;
  mechAssemblyBy: NullString | null;
  wiringType: NullString | null;
  wiringBy: NullString | null;
  statusTest: "Waiting" | "Tested" | "Already Compared with BOM";
  testedBy: NullString | null;
  dateTested: NullTime | null;
  actualParts: ActualPart[] | null;
  detectionSettings: DetectionSettings | null;
  detectionResults: DetectionResult[] | null;
}
export type ProjectTrackingView = ProjectTracking;
export interface ProjectTrackingPayload {
  projectId: { Int64: number; Valid: boolean } | null;
  switchboardName: string;
  compartmentNumber: string;
  mechAssemblyBy: SqlNullString | null;
  wiringType: SqlNullString | null;
  wiringBy: SqlNullString | null;
  statusTest: "Waiting" | "Tested" | "Already Compared with BOM";
  testedBy: SqlNullString | null;
  dateTested: SqlNullTime | null;
  actualParts: ActualPart[] | null;
  newProjectName?: string;
	newWbsNumber?: string;
}
export interface CompareItemDetail {
  material: string;
  bomQty: number;
  actualQty: number;
  difference: number;
  status: string;
  pic: string;
}
export interface ComparisonDetailView {
  comparison: ComparisonView;
  detectionResults: DetectionResult[] | null;
}