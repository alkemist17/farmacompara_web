import { redirect } from "next/navigation";
import { CATEGORIAS } from "@/lib/categorias";

export default function CategoriaRootPage() {
  redirect(`/categoria/${CATEGORIAS[0].slug}`);
}
