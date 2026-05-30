import { redirect } from "next/navigation";

export default function DashboardFAQRedirect() {
  redirect("/dashboard/contact-submissions");
}
