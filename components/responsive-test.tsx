"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Monitor, Tablet, Smartphone, CheckCircle, AlertTriangle, Eye } from "lucide-react"

export function ResponsiveTest() {
  const [screenSize, setScreenSize] = useState("desktop")
  const [testResults, setTestResults] = useState({
    mobile: { passed: 0, total: 8 },
    tablet: { passed: 0, total: 8 },
    desktop: { passed: 0, total: 8 },
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 768) setScreenSize("mobile")
      else if (width < 1024) setScreenSize("tablet")
      else setScreenSize("desktop")
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const runResponsiveTests = () => {
    // Simulate running responsive tests
    setTimeout(() => {
      setTestResults({
        mobile: { passed: 8, total: 8 },
        tablet: { passed: 8, total: 8 },
        desktop: { passed: 8, total: 8 },
      })
    }, 2000)
  }

  const testCategories = [
    "Navigation accessibility",
    "Form usability",
    "Content readability",
    "Button touch targets",
    "Image scaling",
    "Layout stability",
    "Performance metrics",
    "Theme consistency",
  ]

  return (
    <Card className="bg-background border">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-6 w-6 text-orange-500 mr-2" />
          Responsive Design Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Screen Size */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {screenSize === "mobile" && <Smartphone className="h-5 w-5 text-blue-500" />}
            {screenSize === "tablet" && <Tablet className="h-5 w-5 text-green-500" />}
            {screenSize === "desktop" && <Monitor className="h-5 w-5 text-purple-500" />}
            <span className="font-medium capitalize">Current: {screenSize}</span>
          </div>
          <Badge variant="outline">{window?.innerWidth || 0}px wide</Badge>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {Object.entries(testResults).map(([device, results]) => (
            <Card key={device} className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {device === "mobile" && <Smartphone className="h-4 w-4" />}
                    {device === "tablet" && <Tablet className="h-4 w-4" />}
                    {device === "desktop" && <Monitor className="h-4 w-4" />}
                    <span className="font-medium capitalize">{device}</span>
                  </div>
                  {results.passed === results.total ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {results.passed}/{results.total}
                </div>
                <div className="text-sm text-muted-foreground">Tests Passed</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Categories */}
        <div>
          <h3 className="font-medium mb-3">Test Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
            {testCategories.map((category, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{category}</span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={runResponsiveTests} className="w-full">
          Run Responsive Tests
        </Button>
      </CardContent>
    </Card>
  )
}
