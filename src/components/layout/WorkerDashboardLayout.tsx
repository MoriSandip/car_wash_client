import WorkerSidebar from "../Sidebar/WorkerSidebar";
import { TooltipProvider } from "../ui/tooltip";
 
export function WorkerDashboardLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen w-full">
        <WorkerSidebar />
      </div>
    </TooltipProvider>
  );
}
