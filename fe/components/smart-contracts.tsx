"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCode,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react";
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from "@/lib/config";
import {
  useTotalCollateralLocked,
  useTotalLoansOutstanding,
  useLoansList,
  useGetBtcUsdPrice,
} from "@/lib/hooks/useContracts";

export function SmartContracts() {
  const [copied, setCopied] = useState<string | null>(null);

  // Get real data from contracts
  const { totalLocked, isLoading: isCollateralLoading } =
    useTotalCollateralLocked();
  const { totalOutstanding, isLoading: isLoansLoading } =
    useTotalLoansOutstanding();
  const { loans, isLoading: isLoansListLoading } = useLoansList();
  const { price: btcPrice, isLoading: isPriceLoading } = useGetBtcUsdPrice();

  // Use a safe btcPrice value for calculations (default to 0 if null)
  const safeBtcPrice = btcPrice || 0;

  // Count active loans
  const activeLoansCount = loans
    ? loans.filter((loan: any) => loan.active).length
    : 0;

  const contracts = [
    {
      name: "BitPesaLending",
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaLending,
      description: "Manages BTC collateral deposits and loans",
      status: "active",
      version: "v1.0.0",
      gasUsed: "3,247,392",
      functions: [
        "depositCollateral",
        "withdrawCollateral",
        "createLoan",
        "repayLoan",
        "calculateInterest",
      ],
    },
    {
      name: "BitPesaPriceConsumer",
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaPriceConsumer,
      description: "Provides real-time BTC price feeds from Chainlink",
      status: "active",
      version: "v1.0.0",
      gasUsed: "1,204,567",
      functions: ["getLatestPrice", "getPriceHistory"],
    },
    {
      name: "BitPesaTokenBridge",
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaTokenBridge,
      description: "Cross-chain token transfer with CCIP",
      status: "active",
      version: "v1.0.0",
      gasUsed: "4,567,890",
      functions: ["transferTokens", "withdrawTokens"],
    },
    {
      name: "Wrapped BTC (WBTC)",
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].WBTC,
      description: "ERC20 token used as collateral",
      status: "active",
      version: "v1.0.0",
      gasUsed: "947,390",
      functions: ["transfer", "approve", "transferFrom", "balanceOf"],
    },
    {
      name: "USDC",
      address: contractAddresses[AVALANCHE_FUJI_CHAIN_ID].USDC,
      description: "ERC20 stablecoin for loans",
      status: "active",
      version: "v1.0.0",
      gasUsed: "947,390",
      functions: ["transfer", "approve", "transferFrom", "balanceOf"],
    },
  ];

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "beta":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "pending":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-background border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="h-6 w-6 text-orange-500 mr-2" />
            Smart Contract Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {" "}
                        <p className="text-muted-foreground text-sm">
                          Total Contracts
                        </p>
                        <p className="text-2xl font-bold">5</p>
                      </div>
                      <FileCode className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {" "}
                        <p className="text-muted-foreground text-sm">
                          Active Loans
                        </p>
                        <p className="text-2xl font-bold">
                          {isLoansListLoading ? "Loading..." : activeLoansCount}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        {" "}
                        <p className="text-muted-foreground text-sm">
                          Total Collateral
                        </p>
                        <p className="text-2xl font-bold">
                          {isCollateralLoading
                            ? "Loading..."
                            : `${Number(totalLocked).toFixed(4)} BTC`}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>{" "}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Lending Platform Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Collateralization Ratio</span>
                      <span className="text-sm font-medium">
                        {isCollateralLoading || isLoansLoading ? (
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent text-primary"></div>
                        ) : Number(totalOutstanding) > 0 ? (
                          `${(
                            ((Number(totalLocked) * safeBtcPrice!) /
                              Number(totalOutstanding)) *
                            100
                          ).toFixed(2)}%`
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        Number(totalOutstanding) > 0
                          ? Math.min(
                              100,
                              ((Number(totalLocked) * safeBtcPrice) /
                                Number(totalOutstanding)) *
                                100
                            )
                          : 100
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">
                        Active Loans / Total Loans
                      </span>
                      <span className="text-sm font-medium">
                        {isLoansListLoading ? (
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent text-primary"></div>
                        ) : (
                          `${activeLoansCount} / ${loans.length}`
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        loans.length > 0
                          ? (activeLoansCount / loans.length) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Liquidations</span>
                      <span className="text-sm font-medium">
                        {isLoansListLoading ? (
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent text-primary"></div>
                        ) : (
                          `${
                            loans.filter((loan: any) => loan.liquidated).length
                          }`
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        loans.length > 0
                          ? (loans.filter((loan: any) => loan.liquidated)
                              .length /
                              loans.length) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.name} className="bg-muted/50">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {contract.name}
                          </h3>
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {contract.version}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {contract.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono">
                            {contract.address}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyAddress(contract.address)}
                          >
                            {copied === contract.address ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Etherscan
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Gas Used
                        </p>
                        <p className="font-medium">{contract.gasUsed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Functions
                        </p>
                        <p className="font-medium">
                          {contract.functions.length}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs mb-2">
                        Available Functions
                      </p>
                      <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs">
                        {contract.functions.map((func) => (
                          <Badge
                            key={func}
                            variant="secondary"
                            className="text-xs"
                          >
                            {func}()
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 text-green-500 mr-2" />
                      Security Audits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OpenZeppelin</span>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ConsenSys Diligence</span>
                      <Badge className="bg-green-500/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Passed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Trail of Bits</span>
                      <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                        <Clock className="h-3 w-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                      Risk Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Liquidation Risk</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Low
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Oracle Dependency</span>
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        Medium
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Smart Contract Risk</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Low
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Emergency Procedures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        Multi-sig wallet controls (3/5 threshold)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        24-hour timelock for critical functions
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        Circuit breaker for large withdrawals
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        Automated liquidation protection
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {" "}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Total Outstanding Loans
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoansLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent text-primary"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold mb-2">
                          ${Number(totalOutstanding).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current active loans
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Total Collateral Locked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCollateralLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent text-primary"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold mb-2">
                          {Number(totalLocked).toFixed(4)} BTC
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total value secured
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>{" "}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Recent Contract Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {isLoansListLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent text-primary"></div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Loading recent transactions...
                        </p>
                      </div>
                    ) : loans && loans.length > 0 ? (
                      loans.slice(0, 4).map((loan: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {loan.active
                                ? "Loan Created"
                                : loan.liquidated
                                ? "Loan Liquidated"
                                : "Loan Repaid"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                Number(loan.startTimestamp) * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${Number(loan.loanAmount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-32">
                              {loan.borrower.slice(0, 6)}...
                              {loan.borrower.slice(-4)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          No recent loan activity found
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
