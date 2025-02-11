import { WalletButton } from "~/components/WalletButton";

export function NavigationBar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="text-lg font-semibold">SwapKit Playground</div>
        <div className="ml-auto flex items-center space-x-4">
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
