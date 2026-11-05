import { redirect } from "next/navigation";
import { requireSignedIn } from "@/lib/auth";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const user = await requireSignedIn();
  if (!user.mustChangeCredentials) redirect("/admin");
  return <main className="flex flex-1 items-center justify-center px-4 py-8"><SetupForm username={user.username} /></main>;
}
