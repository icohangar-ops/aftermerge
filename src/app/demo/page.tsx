import type { Metadata } from "next";
import { DemoPlayer } from "@/components/demo-player";

export const metadata: Metadata = {
  title: "3-minute demo · AfterMerge",
  description:
    "Screen-recordable walkthrough of the AfterMerge post-merge agent for the GitLab Life After Code hackathon.",
};

export default function DemoPage() {
  return <DemoPlayer />;
}
