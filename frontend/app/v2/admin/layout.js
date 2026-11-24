import { AdminGate } from '@/components/admin/AdminGate';

export default function AdminLayout({ children }) {
  return <AdminGate backHref="/v2">{children}</AdminGate>;
}
