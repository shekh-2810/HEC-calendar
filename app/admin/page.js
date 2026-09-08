import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSessionToken, COOKIE_NAME } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!isValidSessionToken(token)) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}
