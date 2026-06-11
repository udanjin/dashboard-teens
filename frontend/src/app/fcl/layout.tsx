import ProtectedLayout from "@/components/Layout/ProtectedLayout";

export default function FclLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
