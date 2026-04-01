import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";

const SidebarContext = React.createContext<{
  state: "open" | "closed";
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}>({
  state: "open",
  open: true,
  setOpen: () => {},
  isMobile: false,
  toggleSidebar: () => {},
});

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, side = "left", variant = "sidebar", collapsible = "offcanvas", ...props }, ref) => {
    const { open, isMobile } = React.useContext(SidebarContext);
    
    if (isMobile && collapsible === "offcanvas") {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-y-0 z-50 flex h-full w-[--sidebar-width] flex-col bg-sidebar",
            side === "left" ? "left-0" : "right-0",
            !open && "translate-x-full",
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground md:flex",
          variant === "floating" && "m-2 rounded-lg border border-sidebar-border",
          variant === "inset" && "m-2 rounded-lg border border-sidebar-border bg-background",
          !open && "hidden",
          className
        )}
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
          } as React.CSSProperties
        }
        {...props}
      />
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(true);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => setOpen(!open);
  
  return (
    <SidebarContext.Provider value={{ 
      state: open ? "open" : "closed", 
      open, 
      setOpen, 
      isMobile, 
      toggleSidebar 
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[collapsible=icon]:m-2 peer-data-[collapsible=icon]:ml-0 peer-data-[collapsible=icon]:rounded-xl peer-data-[collapsible=icon]:shadow-sm",
        className
      )}
      {...props}
    />
  )
);
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="header"
      {...props}
    />
  )
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="footer"
      {...props}
    />
  )
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)}
      data-sidebar="content"
      {...props}
    />
  )
);
SidebarContent.displayName = "SidebarContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      data-sidebar="menu"
      {...props}
    />
  )
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("group/menu-item relative", className)}
      data-sidebar="menu-item"
      {...props}
    />
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  isActive?: boolean;
}>(
  ({ className, asChild = false, isActive, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";
    
    return (
      <Comp
        ref={ref}
        className={cn(
          "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50",
          "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2",
          isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    />
  )
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1 text-xs font-medium text-sidebar-foreground/70", className)}
      {...props}
    />
  )
);
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    />
  )
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, onClick, ...props }, ref) => (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        event.stopPropagation();
      }}
      {...props}
    />
  )
);
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      data-sidebar="rail"
      variant="ghost"
      size="icon"
      className={cn(
        "absolute h-4 w-4 -translate-y-1/2 transition-transform ease-linear group-[[data-sidebar=sidebar]]:hover:translate-x-1 group-[[data-sidebar=sidebar]]:rtl:hover:-translate-x-1",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:opacity-0",
        "right-2 top-[50%]",
        className
      )}
      {...props}
    />
  )
);
SidebarRail.displayName = "SidebarRail";

const useSidebar = () => React.useContext(SidebarContext);

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
};
