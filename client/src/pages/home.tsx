import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Bus, Download, Trash2, Plus, Search, Hash } from "lucide-react";
import type { BusUnit } from "@shared/schema";

const componentNames = ["MOT", "TRAN", "ELE", "AA", "FRE", "SUS", "DIR", "HOJ", "TEL"];
const componentTitles: Record<string, string> = {
  MOT: "Motor",
  TRAN: "Transmisión",
  ELE: "Eléctrico",
  AA: "Aire Acondicionado",
  FRE: "Frenos",
  SUS: "Suspensión",
  DIR: "Dirección",
  HOJ: "Hojalatería",
  TEL: "Telecomunicaciones"
};

export default function Home() {
  const [unitNumber, setUnitNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [componentFilter, setComponentFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all units
  const { data: units = [], isLoading } = useQuery<BusUnit[]>({
    queryKey: ["/api/units"],
  });

  // Create unit mutation
  const createUnitMutation = useMutation({
    mutationFn: async (data: { unitNumber: number }) => {
      const response = await apiRequest("POST", "/api/units", {
        unitNumber: data.unitNumber,
        MOT: "listo",
        TRAN: "listo",
        ELE: "listo",
        AA: "listo",
        FRE: "listo",
        SUS: "listo",
        DIR: "listo",
        HOJ: "listo",
        TEL: "listo"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      setUnitNumber("");
      toast({
        title: "Éxito",
        description: `Unidad ${data.unitNumber} agregada exitosamente.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al agregar la unidad",
        variant: "destructive",
      });
    },
  });

  // Toggle component status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ unitId, component, currentStatus }: { unitId: number; component: string; currentStatus: string }) => {
      const newStatus = currentStatus === "listo" ? "taller" : "listo";
      const response = await apiRequest("PATCH", `/api/units/${unitId}/component/${component}`, {
        status: newStatus
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el estado",
        variant: "destructive",
      });
    },
  });

  // Delete unit mutation
  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      await apiRequest("DELETE", `/api/units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Éxito",
        description: "Unidad eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la unidad",
        variant: "destructive",
      });
    },
  });

  // Delete all units mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/units");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Éxito",
        description: "Todos los datos han sido eliminados.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar los datos",
        variant: "destructive",
      });
    },
  });

  // Filter units based on search and filter criteria
  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // Search filter
      const matchesSearch = unit.unitNumber.toString().includes(searchTerm);
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "ready") {
        matchesStatus = componentNames.every(comp => unit[comp as keyof BusUnit] === "listo");
      } else if (statusFilter === "workshop") {
        matchesStatus = componentNames.every(comp => unit[comp as keyof BusUnit] === "taller");
      } else if (statusFilter === "partial") {
        const readyCount = componentNames.filter(comp => unit[comp as keyof BusUnit] === "listo").length;
        matchesStatus = readyCount > 0 && readyCount < componentNames.length;
      }

      // Component filter
      let matchesComponent = true;
      if (componentFilter && componentFilter !== "all") {
        matchesComponent = unit[componentFilter as keyof BusUnit] === "taller";
      }

      return matchesSearch && matchesStatus && matchesComponent;
    });
  }, [units, searchTerm, statusFilter, componentFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUnits = units.length;
    const readyUnits = units.filter(unit => 
      componentNames.every(comp => unit[comp as keyof BusUnit] === "listo")
    ).length;
    const workshopUnits = units.filter(unit => 
      componentNames.every(comp => unit[comp as keyof BusUnit] === "taller")
    ).length;
    const partialUnits = totalUnits - readyUnits - workshopUnits;

    return { totalUnits, readyUnits, partialUnits, workshopUnits };
  }, [units]);

  const handleAddUnit = () => {
    const number = parseInt(unitNumber);
    if (!number || number < 1 || number > 9999) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un número de unidad válido (1-9999).",
        variant: "destructive",
      });
      return;
    }

    createUnitMutation.mutate({ unitNumber: number });
  };

  const handleToggleStatus = (unit: BusUnit, component: string) => {
    const currentStatus = unit[component as keyof BusUnit] as string;
    toggleStatusMutation.mutate({
      unitId: unit.id,
      component,
      currentStatus
    });
  };

  const exportToCSV = () => {
    if (units.length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Autobús", ...componentNames];
    const csvContent = [
      headers.join(","),
      ...units.map(unit => [
        unit.unitNumber,
        ...componentNames.map(comp => unit[comp as keyof BusUnit])
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `unidades_autobus_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Éxito",
      description: "Datos exportados exitosamente.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-blue-600 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-white mr-2" />
              <span className="text-white font-semibold text-lg">Sistema de Gestión de Unidades</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpiar Todo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Acción</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Está seguro de que desea eliminar todas las unidades? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteAllMutation.mutate()} className="bg-red-600 hover:bg-red-700">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Dashboard */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <h3 className="text-2xl font-bold mb-1">{stats.totalUnits}</h3>
                <p className="text-sm opacity-90">Total Unidades</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 text-green-200">{stats.readyUnits}</h3>
                <p className="text-sm opacity-90">Unidades Listas</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 text-yellow-200">{stats.partialUnits}</h3>
                <p className="text-sm opacity-90">En Mantenimiento</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1 text-red-200">{stats.workshopUnits}</h3>
                <p className="text-sm opacity-90">En Taller</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número de unidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ready">Solo listos</SelectItem>
                  <SelectItem value="workshop">En taller</SelectItem>
                  <SelectItem value="partial">Mantenimiento parcial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={componentFilter} onValueChange={setComponentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los componentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los componentes</SelectItem>
                  {componentNames.map(comp => (
                    <SelectItem key={comp} value={comp}>{componentTitles[comp]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Add Unit Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2 text-blue-600" />
              Agregar Nueva Unidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit-number">Número de Unidad *</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="unit-number"
                    type="number"
                    min="1"
                    max="9999"
                    placeholder="Ej: 101"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Ingrese un número único para identificar la unidad.</p>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAddUnit} 
                  disabled={createUnitMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createUnitMutation.isPending ? "Agregando..." : "Agregar Unidad"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-500">Cargando unidades...</p>
                </div>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center p-8">
                <Bus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-500 mb-2">No hay unidades registradas</h4>
                <p className="text-gray-400">Agregue una nueva unidad para comenzar el seguimiento de mantenimiento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700">
                      <TableHead className="text-white text-center font-semibold">
                        <Bus className="h-4 w-4 inline mr-1" />
                        Autobús
                      </TableHead>
                      {componentNames.map(comp => (
                        <TableHead key={comp} className="text-white text-center font-semibold min-w-[80px]" title={componentTitles[comp]}>
                          {comp}
                        </TableHead>
                      ))}
                      <TableHead className="text-white text-center font-semibold">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnits.map((unit) => (
                      <TableRow key={unit.id} className="hover:bg-slate-50">
                        <TableCell className="text-center font-bold text-lg text-gray-700">
                          {unit.unitNumber}
                        </TableCell>
                        {componentNames.map(comp => {
                          const status = unit[comp as keyof BusUnit] as string;
                          const isReady = status === "listo";
                          return (
                            <TableCell key={comp} className="text-center p-2">
                              <button
                                onClick={() => handleToggleStatus(unit, comp)}
                                disabled={toggleStatusMutation.isPending}
                                className={`
                                  px-3 py-2 rounded-md text-xs font-medium uppercase transition-all duration-300 hover:scale-105
                                  ${isReady 
                                    ? "bg-green-600 text-white hover:bg-green-700" 
                                    : "bg-red-600 text-white hover:bg-red-700"
                                  }
                                `}
                                title={`Click para cambiar estado de ${componentTitles[comp]}`}
                              >
                                {status}
                              </button>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-gray-600 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Está seguro de que desea eliminar la unidad {unit.unitNumber}? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteUnitMutation.mutate(unit.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
