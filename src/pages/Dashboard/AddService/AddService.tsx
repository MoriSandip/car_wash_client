/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import EditService from "@/pages/Service/Editservice/EditService";
import { useCreateServiceMutation } from "@/redux/features/service/serviceApi";

const AddService = () => {
  const navigate = useNavigate();

  const [createService, { isLoading }] = useCreateServiceMutation();

  const handleService = async (data: any) => {
    try {
      const response = await createService(data).unwrap();

      toast.success(
        response?.message || "Service added successfully!"
      );

      navigate("/dashboard");
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          error?.data?.errorSources?.[0]?.message ||
          "Failed to add service. Please try again."
      );
    }
  };

  return (
    <div>
      <EditService
        onSubmit={handleService}
        UpdateLoading={isLoading}
      />
    </div>
  );
};

export default AddService;