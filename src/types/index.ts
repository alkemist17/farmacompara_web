export interface Medication {
  id: string;
  name: string;
  genericName: string;
  laboratory: string;
  presentation: string;
  imageUrl?: string;
  category: string;
}

export interface PharmacyPrice {
  pharmacyId: string;
  pharmacyName: string;
  pharmacyLogo?: string;
  city: string;
  address: string;
  price: number;
  stock: "disponible" | "agotado" | "bajo_stock";
  isLowestPrice: boolean;
  lastUpdated: string;
}

export interface MedicationComparison {
  medication: Medication;
  prices: PharmacyPrice[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  maxSavings: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
  count: number;
}

export interface SearchSuggestion {
  id: string;
  name: string;
  genericName: string;
  category: string;
}
