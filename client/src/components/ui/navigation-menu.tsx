"use client"

import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative w-full flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-sm">
      {/* Logo or Brand - Always visible */}
      <div className="flex items-center">
        {/* Add your logo or brand here if needed */}
      </div>

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="block md:hidden p-2 hover:bg-accent rounded-md" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="font-semibold text-lg">Menu</div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <nav className="flex flex-col space-y-4">
                {React.Children.map(children, (child) => {
                  if (React.isValidElement(child)) {
                    return (
                      <div className="py-1">
                        {child}
                      </div>
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <NavigationMenuPrimitive.Root
        ref={ref}
        className={cn(
          "relative z-10 hidden md:flex max-w-max flex-1 items-center justify-center",
          className
        )}
        {...props}
      >
        <NavigationMenuList>
          {children}
        </NavigationMenuList>
      </NavigationMenuPrimitive.Root>
    </div>
  )
})
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item
const NavigationMenuLink = NavigationMenuPrimitive.Link

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
}