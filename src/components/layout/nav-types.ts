import type { ReactNode, SVGProps } from "react";

export type NavItem = {
  href: string;
  label: string;
  sub?: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
  soon?: boolean;
};
