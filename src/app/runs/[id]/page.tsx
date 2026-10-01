"use client";

import { use } from "react";
import { RunDetail } from "@/components/run-detail";

export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <RunDetail id={decodeURIComponent(id)} />;
}
