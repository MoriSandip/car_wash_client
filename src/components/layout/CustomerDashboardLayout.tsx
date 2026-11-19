import { TooltipProvider } from "@/components/ui/tooltip";
import CustomerSidebar from "../Sidebar/CustomerSidebar";
  
export default function CustomerDashboardLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen w-full">
        <CustomerSidebar />
 
      </div>
    </TooltipProvider>
  );
}
