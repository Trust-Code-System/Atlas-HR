import { getUser } from "@/lib/auth/get-user";
import { UserDropdown } from "./user-dropdown";
import { NotificationButton } from "./notification-button";
import { MobileMenuButton } from "./mobile-menu-button";

interface AppHeaderProps {
  readonly title?: string;
}

export async function AppHeader({ title }: AppHeaderProps) {
  const user = await getUser();

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 h-14 border-b border-navy-100 bg-white shrink-0">
      <div className="flex items-center gap-2">
        <MobileMenuButton />
        {title && <h1 className="font-semibold text-navy-900 text-base">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <NotificationButton />

        <UserDropdown
          name={user?.full_name ?? null}
          email={user?.email ?? null}
          avatarUrl={user?.avatar_url ?? null}
        />
      </div>
    </header>
  );
}
