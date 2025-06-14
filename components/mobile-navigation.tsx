"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { Bitcoin, Menu, Home, Settings, TestTube, Wallet, Zap, Shield, Info } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      name: "Home",
      path: "/",
      icon: Home,
    },
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Bitcoin,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
    {
      name: "Testing",
      path: "/testing",
      icon: TestTube,
    },
  ]

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-background border-t p-2 flex items-center justify-between">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="px-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-2 py-4">
                <Bitcoin className="h-6 w-6 text-orange-500" />
                <span className="text-xl font-bold">VaultFi</span>
              </div>

              <div className="space-y-1 py-4">
                {routes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                      isActive(route.path) ? "bg-orange-500/10 text-orange-500" : "hover:bg-muted"
                    }`}
                  >
                    <route.icon className="h-5 w-5" />
                    <span>{route.name}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                <div className="px-3 py-2">
                  <h4 className="text-sm font-medium mb-2">Features</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                      <Zap className="h-4 w-4 text-orange-500" />
                      <span>Lightning Network</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span>Smart Contracts</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                      <Wallet className="h-4 w-4 text-blue-500" />
                      <span>1% APY Loans</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto px-3 py-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">v1.0.0</span>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center justify-around flex-1">
          {routes.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className={`flex flex-col items-center justify-center p-1 ${
                isActive(route.path) ? "text-orange-500" : "text-muted-foreground"
              }`}
            >
              <route.icon className="h-5 w-5" />
              <span className="text-[10px] mt-1">{route.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
