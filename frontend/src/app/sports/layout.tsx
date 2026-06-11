import ProtectedLayout from "@/components/Layout/ProtectedLayout";

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
