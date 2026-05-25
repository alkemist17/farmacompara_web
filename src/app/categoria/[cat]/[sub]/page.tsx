import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ cat: string; sub: string }>;
}

export default async function SubcategoriaPage({ params }: Props) {
  const { cat, sub } = await params;
  redirect(`/categoria/${cat}?sub=${sub}`);
}
