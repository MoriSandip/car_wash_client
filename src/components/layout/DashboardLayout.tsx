 import Sidebar from "../Sidebar/Sidebar";
import { TooltipProvider } from "../ui/tooltip";
 
export function Dashboard() {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full flex-col bg-white">
        <Sidebar />
      </div>
    </TooltipProvider>
  );
}
