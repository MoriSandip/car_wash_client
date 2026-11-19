import { useSyncExternalStore } from "react";
import { LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getRequestUiSnapshot,
  resolveApiConfirmation,
  subscribeToRequestUi,
} from "@/redux/api/requestUi";

const ApiRequestUi = () => {
  const {activeRequests, confirmation} = useSyncExternalStore(
    subscribeToRequestUi,
    getRequestUiSnapshot,
    getRequestUiSnapshot,
  );

  return (
    <>
      {activeRequests > 0 ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/25 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-xl">
            <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-slate-700">
              Please wait...
            </span>
          </div>
        </div>
      ) : null}

      <Dialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open) resolveApiConfirmation(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription>{confirmation?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => resolveApiConfirmation(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => resolveApiConfirmation(true)}>
              {confirmation?.actionLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiRequestUi;
