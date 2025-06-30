"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { AccessibilityFeatures } from "@/components/accessibility-features"
import { Bitcoin, Settings, Bell, Shield, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
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
              <span className="text-lg sm:text-2xl font-bold truncate">BitPesa Settings</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 text-xs sm:text-sm">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="lightning">Lightning</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Theme Preference</h3>
                    <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
                  </div>
                  <ThemeToggle />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Default Currency</h3>
                    <p className="text-sm text-muted-foreground">Primary fiat currency for loans</p>
                  </div>
                  <Badge variant="outline">USD</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Interest Rate Display</h3>
                    <p className="text-sm text-muted-foreground">Show rates as APY or APR</p>
                  </div>
                  <Badge variant="outline">APY</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Price Alerts</h3>
                      <p className="text-sm text-muted-foreground">BTC price movement notifications</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Liquidation Warnings</h3>
                      <p className="text-sm text-muted-foreground">Health ratio alerts</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Loan Reminders</h3>
                      <p className="text-sm text-muted-foreground">Repayment due date notifications</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Lightning Network</h3>
                      <p className="text-sm text-muted-foreground">Channel and payment notifications</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Additional security for account access</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Hardware Wallet Required</h3>
                      <p className="text-sm text-muted-foreground">Require hardware wallet for transactions</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Session Timeout</h3>
                      <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <Badge variant="outline">30 minutes</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">IP Whitelist</h3>
                      <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lightning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Lightning Network Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Connected Wallet</h3>
                      <p className="text-sm text-muted-foreground">Phoenix Wallet</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Channel Balance</h3>
                      <p className="text-sm text-muted-foreground">Available Lightning capacity</p>
                    </div>
                    <Badge variant="outline">2.5 BTC</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto-Channel Management</h3>
                      <p className="text-sm text-muted-foreground">Automatic channel opening/closing</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Fee Preference</h3>
                      <p className="text-sm text-muted-foreground">Lightning routing fee tolerance</p>
                    </div>
                    <Badge variant="outline">Low</Badge>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Lightning Node Info</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Node ID: 03abc123...def789</div>
                    <div>Channels: 12 active</div>
                    <div>Network: Bitcoin Mainnet</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility">
            <AccessibilityFeatures />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
