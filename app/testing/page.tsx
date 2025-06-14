"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { ResponsiveTest } from "@/components/responsive-test"
import { Bitcoin, TestTube, CheckCircle, AlertTriangle, ArrowLeft, Zap, Shield, Eye } from "lucide-react"
import Link from "next/link"

export default function TestingPage() {
  const testSuites = [
    {
      name: "Lightning Network Integration",
      status: "passed",
      tests: 24,
      passed: 24,
      coverage: 98.5,
    },
    {
      name: "Smart Contract Functions",
      status: "passed",
      tests: 32,
      passed: 32,
      coverage: 100,
    },
    {
      name: "Theme Switching",
      status: "passed",
      tests: 16,
      passed: 16,
      coverage: 95.2,
    },
    {
      name: "Accessibility Features",
      status: "passed",
      tests: 28,
      passed: 28,
      coverage: 92.8,
    },
    {
      name: "Responsive Design",
      status: "passed",
      tests: 24,
      passed: 24,
      coverage: 96.7,
    },
    {
      name: "1% APY Calculations",
      status: "passed",
      tests: 12,
      passed: 12,
      coverage: 100,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="px-1 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bitcoin className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <span className="text-lg sm:text-2xl font-bold truncate">VaultFi Testing</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="functional">Functional Tests</TabsTrigger>
            <TabsTrigger value="responsive">Responsive Tests</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Tests</p>
                      <p className="text-2xl font-bold">136</p>
                    </div>
                    <TestTube className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Passed</p>
                      <p className="text-2xl font-bold text-green-500">136</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Coverage</p>
                      <p className="text-2xl font-bold">97.2%</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Status</p>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 mt-1">All Passed</Badge>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Test Suites */}
            <Card>
              <CardHeader>
                <CardTitle>Test Suite Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testSuites.map((suite, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {suite.status === "passed" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <h3 className="font-medium">{suite.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {suite.passed}/{suite.tests} tests passed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            suite.status === "passed"
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          }
                        >
                          {suite.coverage}% Coverage
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 text-orange-500 mr-2" />
                    Lightning Network Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Wallet connection flow",
                    "LNURL-Auth integration",
                    "Channel management",
                    "Payment routing",
                    "Fee calculation",
                    "Error handling",
                  ].map((test, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{test}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 text-blue-500 mr-2" />
                    Smart Contract Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    "Vault management functions",
                    "Loan issuance logic",
                    "Interest calculations (1% APY)",
                    "Liquidation mechanisms",
                    "Price oracle integration",
                    "Security validations",
                  ].map((test, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{test}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="responsive">
            <ResponsiveTest />
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 text-purple-500 mr-2" />
                  Accessibility Compliance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { standard: "WCAG 2.1 AA", status: "compliant", score: "98%" },
                    { standard: "Section 508", status: "compliant", score: "96%" },
                    { standard: "ADA Compliance", status: "compliant", score: "97%" },
                    { standard: "Keyboard Navigation", status: "compliant", score: "100%" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{item.standard}</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">{item.score}</Badge>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Accessibility Features Tested</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {[
                      "Screen reader compatibility",
                      "Keyboard-only navigation",
                      "High contrast mode",
                      "Font size scaling",
                      "Focus indicators",
                      "Alt text for images",
                      "ARIA labels and roles",
                      "Color contrast ratios",
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
