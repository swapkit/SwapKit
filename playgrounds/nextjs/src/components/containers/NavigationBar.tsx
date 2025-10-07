import { WalletButton } from "~/components/WalletButton";

export function NavigationBar() {
  return (
    <nav className="fixed top-0 right-0 left-0 flex h-[--navbar-height] items-center border-b bg-background px-2 lg:px-4">
      <div className="mx-auto flex w-full max-w-screen-lg items-center">
        <div className="font-semibold text-lg">SwapKit Playground</div>

        <div className="ml-auto flex items-center space-x-4">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
