// app/dashboard/layout.tsx
import Navbar from "@/component/Navbar";

export default function DashboardLayout({ children }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
