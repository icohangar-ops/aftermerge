import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Pipeline board · AfterMerge",
  description:
    "Post-merge runs for Northline Mechanical's FieldClear. Simulated GitLab CI, agent decisions, and a human promote gate.",
};

export default function HomePage() {
  return <Dashboard />;
}
