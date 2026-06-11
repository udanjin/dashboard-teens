import ProtectedLayout from "@/components/Layout/ProtectedLayout";

export default function ApprovalLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
