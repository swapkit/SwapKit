import { WalletButton } from "~/components/WalletButton";

export function AppNavbar() {
  return (
    <nav className="fixed top-0 right-0 left-[--sidebar-width] flex h-[--navbar-height] items-center border-b bg-background px-2 lg:px-4">
      <div className="mx-auto flex w-full max-w-screen-lg items-center">
        <WalletButton className="ml-auto" />
      </div>
    </nav>
  );
}
