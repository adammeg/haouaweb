"use client";

import { PartogramPanel, type PartogramPanelProps } from "./partogram-panel";

export function PartogramClient(props: PartogramPanelProps = {}) {
  return <PartogramPanel {...props} />;
}
