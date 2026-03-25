import { PolyShell } from "./PolyShell";

export default function PolyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <PolyShell>{children}</PolyShell>;
}
