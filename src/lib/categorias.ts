export type Subcategoria = { label: string; slug: string };

export type Categoria = {
  icon: string;
  label: string;       // nombre completo (dropdown, menú mobile nivel 2)
  labelCorto: string;  // nombre corto (botón de la barra)
  slug: string;
  subs: Subcategoria[];
};

export const CATEGORIAS: Categoria[] = [
  {
    icon: "💊",
    label: "Medicamentos y Salud",
    labelCorto: "Medicamentos",
    slug: "medicamentos-y-salud",
    subs: [
      { label: "Digestivos",      slug: "digestivos"      },
      { label: "Dolor y Fiebre",  slug: "dolor-y-fiebre"  },
      { label: "Gripa y Tos",     slug: "gripa-y-tos"     },
      { label: "Salud Sexual",    slug: "salud-sexual"    },
      { label: "General / Otros", slug: "general-otros"   },
    ],
  },
  {
    icon: "🧴",
    label: "Dermocosmética y Belleza",
    labelCorto: "Dermocosmética",
    slug: "dermocosmetica-y-belleza",
    subs: [
      { label: "Cuidado Facial",   slug: "cuidado-facial"   },
      { label: "Cuidado Corporal", slug: "cuidado-corporal" },
      { label: "Protección Solar", slug: "proteccion-solar" },
      { label: "Antiedad",         slug: "antiedad"         },
    ],
  },
  {
    icon: "🪒",
    label: "Cuidado Personal",
    labelCorto: "Cuidado Personal",
    slug: "cuidado-personal",
    subs: [
      { label: "Cuidado Capilar",       slug: "cuidado-capilar"       },
      { label: "Higiene Oral",          slug: "higiene-oral"          },
      { label: "Afeitado y Depilación", slug: "afeitado-y-depilacion" },
      { label: "Desodorantes",          slug: "desodorantes"          },
    ],
  },
  {
    icon: "🍏",
    label: "Nutrición y Bienestar",
    labelCorto: "Nutrición",
    slug: "nutricion-y-bienestar",
    subs: [
      { label: "Vitaminas y Suplementos", slug: "vitaminas-y-suplementos" },
      { label: "Bienestar Deportivo",     slug: "bienestar-deportivo"     },
      { label: "Alimentos Saludables",    slug: "alimentos-saludables"    },
    ],
  },
  {
    icon: "👶",
    label: "Mamá y Bebé",
    labelCorto: "Mamá y Bebé",
    slug: "mama-y-bebe",
    subs: [
      { label: "Pañales y Toallitas",           slug: "panales-y-toallitas"           },
      { label: "Fórmulas Infantiles",           slug: "formulas-infantiles"           },
      { label: "Accesorios y Cuidado del Bebé", slug: "accesorios-y-cuidado-del-bebe" },
    ],
  },
];
