import { Sidebar, SidebarContent, SidebarHeader } from "../ui/sidebar";

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="font-semibold text-xl">SwapKit Playground</div>
      </SidebarHeader>

      <SidebarContent>{children}</SidebarContent>
    </Sidebar>
  );
}
