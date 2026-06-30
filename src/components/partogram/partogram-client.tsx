"use client";

import "@/styles/partogram.css";
import { PartogramPanel, type PartogramPanelProps } from "./partogram-panel";

export function PartogramClient(props: PartogramPanelProps = {}) {
  return <PartogramPanel {...props} />;
}
