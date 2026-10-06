import Link from "next/link";
import { logout } from "./login/actions";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const loggedIn = await isAdmin();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-serif text-lg">
            🎓 Invitations
          </Link>
          {loggedIn && (
            <form action={logout}>
              <button className="text-sm text-stone-500 hover:text-stone-900">Log out</button>
            </form>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
