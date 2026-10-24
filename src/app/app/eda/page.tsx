import type { Metadata } from "next";
import { ja } from "@/lib/i18n/ja";
import { Eda } from "./Eda";

export const metadata: Metadata = { title: ja.nav.eda };

export default function EdaPage() {
  return <Eda />;
}
