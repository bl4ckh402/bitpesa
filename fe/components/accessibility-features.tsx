"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accessibility, Type, Eye, Volume2, Keyboard, Settings } from "lucide-react"

export function AccessibilityFeatures() {
  const [fontSize, setFontSize] = useState(16)
  const [highContrast, setHighContrast] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [keyboardNav, setKeyboardNav] = useState(false)

  useEffect(() => {
    // Apply accessibility settings
    document.documentElement.style.fontSize = `${fontSize}px`

    if (highContrast) {
      document.documentElement.classList.add("high-contrast")
    } else {
      document.documentElement.classList.remove("high-contrast")
    }

    if (keyboardNav) {
      document.documentElement.classList.add("keyboard-navigation")
    } else {
      document.documentElement.classList.remove("keyboard-navigation")
    }
  }, [fontSize, highContrast, keyboardNav])

  return (
    <Card className="bg-background border">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <Accessibility className="h-6 w-6 text-orange-500 mr-2" />
          <h3 className="text-lg font-semibold">Accessibility Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {/* Font Size */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Font Size</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                aria-label="Decrease font size"
              >
                A-
              </Button>
              <span className="text-sm px-3">{fontSize}px</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                aria-label="Increase font size"
              >
                A+
              </Button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">High Contrast</span>
            </div>
            <Button
              size="sm"
              variant={highContrast ? "default" : "outline"}
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
            >
              {highContrast ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {/* Screen Reader */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Screen Reader Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant={screenReader ? "default" : "outline"}
                onClick={() => setScreenReader(!screenReader)}
                aria-pressed={screenReader}
              >
                {screenReader ? "Active" : "Inactive"}
              </Button>
              <Badge variant="secondary" className="text-xs">
                NVDA/JAWS Compatible
              </Badge>
            </div>
          </div>

          {/* Keyboard Navigation */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Keyboard Navigation</span>
            </div>
            <Button
              size="sm"
              variant={keyboardNav ? "default" : "outline"}
              onClick={() => setKeyboardNav(!keyboardNav)}
              aria-pressed={keyboardNav}
            >
              {keyboardNav ? "Enhanced" : "Standard"}
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div>Alt + D: Dashboard</div>
            <div>Alt + C: Calculator</div>
            <div>Alt + W: Wallet Connect</div>
            <div>Alt + T: Toggle Theme</div>
            <div>Tab: Navigate Elements</div>
            <div>Enter/Space: Activate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
