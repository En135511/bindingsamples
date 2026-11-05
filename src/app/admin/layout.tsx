import Link from "next/link";
import { logout } from "./login/actions";
import { currentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await currentUser();
  return (
    <div className="admin-shell flex flex-1 flex-col text-stone-100">
      <header className="border-b border-stone-200 bg-white text-stone-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-serif text-lg">
            🎓 Invitations
          </Link>
          {user && <div className="flex items-center gap-4 text-sm">
            {user.role === "owner" && !user.mustChangeCredentials && <Link href="/admin/users" className="text-stone-700 hover:text-stone-950">Hosts</Link>}
            <span className="hidden text-stone-600 sm:inline">{user.username}</span>
            <form action={logout}><button className="text-stone-700 hover:text-stone-950">Log out</button></form>
          </div>}
        </div>
      </header>
      {children}
    </div>
  );
}
