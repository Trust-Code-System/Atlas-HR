import { getUser } from "@/lib/auth/get-user";
import { UserDropdown } from "./user-dropdown";
import { NotificationButton } from "./notification-button";

interface AppHeaderProps {
  title?: string;
}

export async function AppHeader({ title }: AppHeaderProps) {
  const user = await getUser();

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-navy-100 bg-white shrink-0">
      {title ? (
        <h1 className="font-semibold text-navy-900 text-base">{title}</h1>
      ) : (
        <div />
      )}

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
