"use client";

import { useState, useEffect } from "react"; 
import { useAuthStore, User } from "@/lib/types";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddUserModalProps {
  setIsOpen: (open: boolean) => void;
  onUserAdded: (newUser: User) => void;
}

export function AddUserModal({ setIsOpen, onUserAdded }: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("PIC");
  const [companyName, setCompanyName] = useState("");
  const [vendorType, setVendorType] = useState("");

  const [companies, setCompanies] = useState<string[]>([]);
  const [vendorTypes, setVendorTypes] = useState<string[]>([]);

  const isVendor = userRole === "External/Vendor";

  useEffect(() => {
    const fetchOptions = async () => {
      if (!isVendor) {
        setCompanies([]);
        setVendorTypes([]);
        return;
      }

      try {
        const headers = {
          "Content-Type": "application/json",
          "X-User-Role": role || "",
        };

        const compRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/companies`,
          { headers }
        );
        if (compRes.ok) {
          const data: string[] = await compRes.json();
          setCompanies(data);
        } else {
          console.error("Gagal mengambil daftar perusahaan");
          setCompanies([]);
        }

        const typeRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/vendor-types`,
          { headers }
        );
        if (typeRes.ok) {
          const data: string[] = await typeRes.json();
          setVendorTypes(data);
        } else {
          console.error("Gagal mengambil daftar tipe vendor");
          setVendorTypes([]);
        }
      } catch (error) {
        console.error("Gagal mengambil opsi dropdown:", error);
        setCompanies([]);
        setVendorTypes([]);
      }
    };

    fetchOptions();
  }, [isVendor, role]); 

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        username,
        password,
        role: userRole,
        companyName: userRole === "External/Vendor"
          ? { String: companyName, Valid: true } 
          : null, 
        vendorType: userRole === "External/Vendor"
          ? { String: vendorType, Valid: true } 
          : null, 
      };

      if (isVendor && (!companyName || !vendorType)) {
        throw new Error("Nama Perusahaan dan Tipe Vendor harus diisi.");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/`,
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
        throw new Error(errorData.error || "Gagal menambah pengguna.");
      }

      const newUser = await response.json();
      onUserAdded(newUser); 
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
        <DialogDescription>
          Isi detail pengguna di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[60vh] pr-6">
        <div className="grid gap-4 py-4">
          <div className="flex-col items-center">
            <Label htmlFor="username" className="text-left mb-4">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="flex-col items-center">
            <Label htmlFor="password" className="text-left mb-4">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="flex-col items-center">
            <Label htmlFor="role" className="text-left mb-4">
              Role
            </Label>
            <Select value={userRole} onValueChange={setUserRole}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="PIC">PIC</SelectItem>
                <SelectItem value="Production Planning">
                  Production Planning
                </SelectItem>
                <SelectItem value="External/Vendor">External/Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isVendor && (
            <>
              <div className="flex-col items-center">
                <Label htmlFor="companyName" className="text-left mb-4">
                  Nama Perusahaan
                </Label>
                <Select value={companyName} onValueChange={setCompanyName}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih Perusahaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      companies.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-col items-center">
                <Label htmlFor="vendorType" className="text-left mb-4">
                  Tipe Vendor
                </Label>
                <Select value={vendorType} onValueChange={setVendorType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih Tipe Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorTypes.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      vendorTypes.map((vtype) => (
                        <SelectItem key={vtype} value={vtype}>
                          {vtype}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Pengguna"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
