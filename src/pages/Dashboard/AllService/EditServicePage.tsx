import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import EditService from "@/pages/Service/Editservice/EditService";
import {
  useGetSingleServiceQuery,
  useUpdateServiceMutation,
} from "@/redux/features/service/serviceApi";

type ServiceResponse = {
  data?: {
    _id?: string;
    title?: string;
    description?: string;
    price?: string | number;
    duration?: string | number;
    image?: string[];
  };
};

const EditServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetSingleServiceQuery(id);
  const [updateService, { isLoading: isSaving }] = useUpdateServiceMutation();
  const service = (data as ServiceResponse | undefined)?.data;

  const saveService = async (formData: Record<string, unknown>) => {
    if (!id) {
      toast.error("Service ID is missing.");
      return;
    }

    try {
      await updateService({ _id: id, data: formData }).unwrap();
      toast.success("Service updated successfully.");
      navigate("/dashboard/allService");
    } catch (error) {
      const response = error as { data?: { message?: string }; message?: string };
      toast.error(response.data?.message || response.message || "Could not update service.");
    }
  };

  if (isLoading) {
    return <p className="p-8 text-center text-slate-500">Loading service…</p>;
  }
  if (isError || !service) {
    return (
      <div role="alert" className="m-8 rounded-lg bg-red-50 p-4 text-red-700">
        Could not load this service. Return to the service catalog and try again.
        <button
          type="button"
          onClick={() => navigate("/dashboard/allService")}
          className="ml-2 font-semibold underline"
        >
          Service catalog
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <button
        type="button"
        onClick={() => navigate("/dashboard/allService")}
        className="text-sm font-medium text-sky-700 hover:underline"
      >
        Back to service catalog
      </button>
      <h1 className="text-2xl font-bold text-slate-900">Edit service</h1>
      <EditService
        defaultValues={{
          title: service.title,
          description: service.description,
          price: service.price,
          duration: service.duration,
          image: service.image,
        }}
        onSubmit={saveService}
        UpdateLoading={isSaving}
      />
    </div>
  );
};

export default EditServicePage;
