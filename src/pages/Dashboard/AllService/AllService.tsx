import { useNavigate } from "react-router-dom";
import { File, MoreHorizontal, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import ListImage from "@/components/ListImage";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useGetServiceQuery,
  useDeleteServiceMutation,
} from "@/redux/features/service/serviceApi";

type ServiceItem = {
  _id: string;
  id?: number;
  title: string;
  description: string;
  price: string | number;
  duration: number;
  image?: string[];
  isDeleted?: boolean;
  createdAt?: string;
};

const AllService = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetServiceQuery(undefined);
  const [deleteService, { isLoading: isDeleting }] =
    useDeleteServiceMutation();

  // Supports APIs that return either an array or a paginated result.
  const responseData = data?.data;
  const services: ServiceItem[] = Array.isArray(responseData)
    ? responseData
    : responseData?.result ?? [];

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteService(id).unwrap();
      toast.success(response?.message || "Service deleted successfully!");
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Failed to delete service."
      );
    }
  };

  const handleExport = () => {
    if (!services.length) {
      toast.error("No services available to export.");
      return;
    }

    const headers = [
      "Title",
      "Description",
      "Price",
      "Duration",
      "Status",
      "Created At",
    ];

    const rows = services.map((service) => [
      service.title,
      service.description,
      service.price,
      service.duration,
      service.isDeleted ? "Deleted" : "Active",
      service.createdAt?.split("T")[0] || "",
    ]);

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "services.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen w-full flex-col space-y-6 bg-muted/40 px-4 py-4 sm:px-6 lg:px-8">
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 md:gap-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Services</CardTitle>
                <CardDescription>
                  Manage your services, prices, duration, and status.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-2"
                  onClick={handleExport}
                >
                  <File className="h-4 w-4" />
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() => navigate("/dashboard/addService")}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Service
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">
                Loading services...
              </div>
            ) : isError ? (
              <div className="py-10 text-center text-red-500">
                Failed to load services. Please try again.
              </div>
            ) : services.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                No services found. Click Add Service to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell>
                          <ListImage
                            source={service.image}
                            alt={service.title}
                            className="h-14 w-14"
                          />
                        </TableCell>

                        <TableCell className="min-w-[130px] font-medium">
                          {service.title}
                        </TableCell>

                        <TableCell className="max-w-[250px]">
                          <p className="line-clamp-2">
                            {service.description}
                          </p>
                        </TableCell>

                        <TableCell>₹{service.price}</TableCell>

                        <TableCell>{service.duration} min</TableCell>

                        <TableCell>
                          {service.isDeleted ? (
                            <Badge variant="destructive">Deleted</Badge>
                          ) : (
                            <Badge className="bg-green-600">Active</Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {service.createdAt?.split("T")[0] || "-"}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`Actions for ${service.title}`}
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/service/${service._id}`)
                                }
                              >
                                View Service
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(
                                    `/dashboard/editService/${service._id}`
                                  )
                                }
                              >
                                Edit Service
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                disabled={isDeleting || service.isDeleted}
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(service._id)}
                              >
                                Delete Service
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Total services: <strong>{services.length}</strong>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default AllService;
