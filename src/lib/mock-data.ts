import type { MedicationComparison, Category } from "@/types";
export { formatCOP } from "@/lib/format";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Analgésicos",        icon: "💊", slug: "analgesicos",        count: 142 },
  { id: "2", name: "Antibióticos",       icon: "🧬", slug: "antibioticos",       count: 89  },
  { id: "3", name: "Vitaminas",          icon: "🌿", slug: "vitaminas",          count: 215 },
  { id: "4", name: "Cardioprotectores",  icon: "❤️", slug: "cardioprotectores",  count: 67  },
  { id: "5", name: "Dermatológicos",     icon: "🧴", slug: "dermatologicos",     count: 98  },
  { id: "6", name: "Respiratorio",       icon: "🫁", slug: "respiratorio",       count: 54  },
];

export const FEATURED_COMPARISONS: MedicationComparison[] = [
  {
    medication: {
      id: "med-1",
      name: "Acetaminofén 500mg x 100 tab",
      genericName: "Acetaminofén",
      laboratory: "Genfar",
      presentation: "Caja x 100 tabletas",
      category: "Analgésicos",
    },
    averagePrice: 18_500,
    lowestPrice: 12_900,
    highestPrice: 24_000,
    maxSavings: 11_100,
    prices: [
      {
        pharmacyId: "p1", pharmacyName: "Droguerías Cruz Verde", city: "Bogotá",
        address: "Cra. 15 #93-47", price: 12_900, stock: "disponible",
        isLowestPrice: true, lastUpdated: "hace 2h",
      },
      {
        pharmacyId: "p2", pharmacyName: "Farmatodo", city: "Bogotá",
        address: "Av. El Dorado #69-76", price: 16_200, stock: "disponible",
        isLowestPrice: false, lastUpdated: "hace 1h",
      },
      {
        pharmacyId: "p3", pharmacyName: "Drogas La Rebaja", city: "Bogotá",
        address: "Cll. 72 #11-35", price: 19_500, stock: "bajo_stock",
        isLowestPrice: false, lastUpdated: "hace 5h",
      },
      {
        pharmacyId: "p4", pharmacyName: "Colsubsidio Salud", city: "Bogotá",
        address: "Cra. 30 #45-30", price: 24_000, stock: "disponible",
        isLowestPrice: false, lastUpdated: "hace 3h",
      },
    ],
  },
  {
    medication: {
      id: "med-2",
      name: "Ibuprofeno 400mg x 20 cap",
      genericName: "Ibuprofeno",
      laboratory: "Lafrancol",
      presentation: "Caja x 20 cápsulas",
      category: "Analgésicos",
    },
    averagePrice: 9_800,
    lowestPrice: 6_500,
    highestPrice: 13_400,
    maxSavings: 6_900,
    prices: [
      {
        pharmacyId: "p2", pharmacyName: "Farmatodo", city: "Bogotá",
        address: "Av. El Dorado #69-76", price: 6_500, stock: "disponible",
        isLowestPrice: true, lastUpdated: "hace 1h",
      },
      {
        pharmacyId: "p1", pharmacyName: "Droguerías Cruz Verde", city: "Bogotá",
        address: "Cra. 15 #93-47", price: 9_200, stock: "disponible",
        isLowestPrice: false, lastUpdated: "hace 2h",
      },
      {
        pharmacyId: "p4", pharmacyName: "Colsubsidio Salud", city: "Bogotá",
        address: "Cra. 30 #45-30", price: 13_400, stock: "agotado",
        isLowestPrice: false, lastUpdated: "hace 6h",
      },
    ],
  },
  {
    medication: {
      id: "med-3",
      name: "Losartán 50mg x 30 tab",
      genericName: "Losartán Potásico",
      laboratory: "Tecnoquímicas",
      presentation: "Caja x 30 tabletas",
      category: "Cardioprotectores",
    },
    averagePrice: 22_000,
    lowestPrice: 15_800,
    highestPrice: 31_500,
    maxSavings: 15_700,
    prices: [
      {
        pharmacyId: "p3", pharmacyName: "Drogas La Rebaja", city: "Bogotá",
        address: "Cll. 72 #11-35", price: 15_800, stock: "disponible",
        isLowestPrice: true, lastUpdated: "hace 4h",
      },
      {
        pharmacyId: "p1", pharmacyName: "Droguerías Cruz Verde", city: "Bogotá",
        address: "Cra. 15 #93-47", price: 22_900, stock: "disponible",
        isLowestPrice: false, lastUpdated: "hace 2h",
      },
      {
        pharmacyId: "p4", pharmacyName: "Colsubsidio Salud", city: "Bogotá",
        address: "Cra. 30 #45-30", price: 31_500, stock: "disponible",
        isLowestPrice: false, lastUpdated: "hace 3h",
      },
    ],
  },
];

