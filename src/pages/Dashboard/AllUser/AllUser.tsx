import { useState } from "react";
import { MoreHorizontal } from "lucide-react";

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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  useGetAllUserQuery,
  useUpdateUserMutation,
} from "@/redux/features/user/user";
import { User } from "@/types/ServiceType";
import ListImage from "@/components/ListImage";
import ListPagination from "@/components/ListPagination";

const AllUser = () => {
  const [page, setPage] = useState(1);
  const { data } = useGetAllUserQuery(undefined);
  const [UpdateUser] = useUpdateUserMutation();
  const AllUserFromDb = Array.isArray(data?.data) ? data.data : [];
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(AllUserFromDb.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = AllUserFromDb.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleAdmin = (id: string) => {
    const data = {
      id,
      updateData: { role: "admin" },
    };
    UpdateUser(data);
  };

  const handleUser = (id: string) => {
    const data = {
      id,
      updateData: { role: "user" },
    };
    UpdateUser(data);
  };

  const handleBlock = (id: string) => {
    const data = {
      id,
      updateData: { userStatus: "blocked" },
    };
    UpdateUser(data);
  };
  const handleUnBlock = (id: string) => {
    const data = {
      id,
      updateData: { userStatus: "in-progress" },
    };
    UpdateUser(data);
  };
  return (
    <div className="space-y-6 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col  ">
        <main className="grid flex-1 items-start">
          <Tabs defaultValue="all">
          
            <TabsContent value="all">
              <Card >
                <CardHeader>
                  <CardTitle>Admin management</CardTitle>
                  <CardDescription>
                    Manage your admin users and view their status performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                          <span className="sr-only">Image</span>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Role
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Created at
                        </TableHead>

                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleUsers.map((user: User) => (
                        <TableRow key={user._id}>
                          <TableCell className="hidden sm:table-cell">
                            <ListImage
                              source={user?.imageUrl}
                              alt={`${user?.email || "User"} profile`}
                              className="h-12 w-12"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {user?.email}
                          </TableCell>
                          <TableCell>
                            {user.userStatus === "blocked" ||
                            user.userStatus === "block" ? (
                              <Badge className="bg-red-500">Block</Badge>
                            ) : (
                              <Badge variant="outline">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user?.role === "admin" ? (
                              <Badge className="bg-green-500">Admin</Badge>
                            ) : (
                              <Badge variant="outline">user</Badge>
                            )}
                          </TableCell>

                          <TableCell className="hidden md:table-cell">
                            {user?.createdAt?.split("T")[0]}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleAdmin(user?._id)}
                                >
                                  MakeAdmin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUser(user?._id)}
                                >
                                  MakeUser
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleBlock(user?._id)}
                                >
                                  Block
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUnBlock(user?._id)}
                                >
                                  UnBlock
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!visibleUsers.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter>
                  <ListPagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalItems={AllUserFromDb.length}
                    pageSize={pageSize}
                    itemLabel="users"
                    onPageChange={setPage}
                  />
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AllUser;
