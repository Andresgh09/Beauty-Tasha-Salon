import type { ServiceCategory } from "@/lib/supabase/types";

export const categories: { id: ServiceCategory; label: string }[] = [
  { id: "manicure", label: "Manicure" },
  { id: "pedicure", label: "Pedicure" },
  { id: "spa", label: "Spa" },
  { id: "semipermanente", label: "Semipermanente" },
  { id: "extensiones", label: "Extensiones" },
  { id: "ninas", label: "Niñas" }
];
