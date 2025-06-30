'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, Trash, ArrowLeft, Shield, Coins, Clock, Users, Check, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWeb3 } from '@/lib/providers/web3-provider';
import { useCreateWill, useApproveWBTCForWill } from '@/lib/hooks/useWill';
import { useGetBtcUsdPrice, useWBTCBalance } from '@/lib/hooks/useContracts';
import { useTokenAllowance } from '@/lib/hooks/useTokenAllowance';
import { contractAddresses, AVALANCHE_FUJI_CHAIN_ID } from '@/lib/config';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { ParallaxCard } from '@/components/ui/parallax-card';
import { FloatingElements } from '@/components/ui/floating-elements';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { FormStepTransition, FormStepContainer } from '@/components/ui/form-step-transition';
import { StepIndicator } from '@/components/ui/step-indicator';
import { SuccessAnimation } from '@/components/ui/success-animation';
import { AssetVisualizer } from '@/components/ui/asset-visualizer';
import gsap from 'gsap';
import { useFadeInAnimation, useStaggerAnimation, useScrollReveal, useTextTypingAnimation, useCounterAnimation, useParallaxEffect } from '@/lib/gsap-utils';

// Define the form schema
const formSchema = z.object({
  assetsAmount: z.string()
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Assets amount must be a positive number",
    }),
  inactivityPeriod: z.string()
    .refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Inactivity period must be a positive number",
    }),
  metadataURI: z.string().optional(),
  beneficiaries: z.array(z.object({
    address: z.string()
      .refine(val => ethers.isAddress(val), {
        message: "Invalid Ethereum address",
      }),
    share: z.string()
      .refine(val => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100, {
        message: "Share must be between 0 and 100",
      }),
  }))
    .refine(beneficiaries => beneficiaries.length > 0, {
      message: "At least one beneficiary is required",
    })
    .refine(beneficiaries => {
      const totalShare = beneficiaries.reduce(
        (sum, b) => sum + Number(b.share), 0
      );
      return Math.abs(totalShare - 100) < 0.01; // Allow for small floating point errors
    }, {
      message: "Total share must be exactly 100%",
    }),
});

type FormValues = z.infer<typeof formSchema>;

// Step interface for multi-step form
interface FormStep {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export default function CreateWillPage() {
  const router = useRouter();
  const { isConnected, isCorrectNetwork, switchToFujiNetwork } = useWeb3();
  const { balance: wbtcBalance, isLoading: balanceLoading } = useWBTCBalance();
  const [isApproving, setIsApproving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formAnimationKey, setFormAnimationKey] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [showSuccessState, setShowSuccessState] = useState(false);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  
  // Animation refs
  const headerRef = useFadeInAnimation() as React.RefObject<HTMLDivElement>;
  const formRef = useStaggerAnimation('.stagger-item');
  const formElementRef = useRef<HTMLFormElement>(null);
  const ctaButtonRef = useRef<HTMLButtonElement>(null);
  const parallaxBgRef = useParallaxEffect(0.15) as React.RefObject<HTMLDivElement>;
  const titleRef = useTextTypingAnimation("Create Your Digital Legacy");
  
  // Define the form steps
  const formSteps: FormStep[] = [
    {
      id: 1,
      title: "Assets",
      subtitle: "Define the amount of WBTC to secure",
      icon: <Coins className="h-6 w-6" />
    },
    {
      id: 2,
      title: "Timeframe",
      subtitle: "Set inactivity period",
      icon: <Clock className="h-6 w-6" />
    },
    {
      id: 3,
      title: "Beneficiaries",
      subtitle: "Add who receives your assets",
      icon: <Users className="h-6 w-6" />
    },
    {
      id: 4,
      title: "Confirmation",
      subtitle: "Review and create your will",
      icon: <Shield className="h-6 w-6" />
    }
  ];

  // Check WBTC allowance for will contract
  const { address } = useWeb3();
  const { allowance, hasAllowance } = useTokenAllowance(
    'WBTC',
    address,
    contractAddresses[AVALANCHE_FUJI_CHAIN_ID].BitPesaWill as string
  );

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetsAmount: '',
      inactivityPeriod: '90',
      metadataURI: '',
      beneficiaries: [{ address: '', share: '100' }],
    },
    mode: "onChange",
  });

  // Create field array for beneficiaries
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "beneficiaries",
  });

  // Set up approval
  const {
    approve,
    isPending: approvalPending,
    isConfirming: approvalConfirming,
    isSuccess: approvalSuccess,
  } = useApproveWBTCForWill();

  // Set up will creation
  const {
    createWill,
    isPending: creationPending,
    isConfirming: creationConfirming,
    isSuccess: creationSuccess,
  } = useCreateWill();

  // CTA button animation
  useEffect(() => {
    if (!ctaButtonRef.current) return;
    
    const pulseAnimation = gsap.timeline({ repeat: -1 });
    pulseAnimation
      .to(ctaButtonRef.current, { 
        scale: 1.05, 
        boxShadow: '0 0 15px rgba(247, 147, 26, 0.5)', 
        duration: 0.8,
        ease: 'power1.inOut'
      })
      .to(ctaButtonRef.current, { 
        scale: 1, 
        boxShadow: '0 0 5px rgba(247, 147, 26, 0.3)', 
        duration: 0.8,
        ease: 'power1.inOut'
      });
      
    return () => {
      pulseAnimation.kill();
    };
  }, [currentStep, isApproving, creationPending, creationConfirming]);

  // Handle approval
  const handleApprove = async (values: FormValues) => {
    setIsApproving(true);
    try {
      await approve(values.assetsAmount);
    } catch (error) {
      console.error("Error approving tokens:", error);
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < formSteps.length) {
      setDirection('forward');
      setFormAnimationKey(prev => prev + 1);
      
      // Scroll to top of the form section
      if (pageWrapperRef.current) {
        const topPos = pageWrapperRef.current.offsetTop - 50;
        window.scrollTo({
          top: topPos,
          behavior: 'smooth'
        });
      }
      
      // Add a short delay before changing the step for better animation
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 50);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setFormAnimationKey(prev => prev + 1);
      
      // Scroll to top of the form section
      if (pageWrapperRef.current) {
        const topPos = pageWrapperRef.current.offsetTop - 50;
        window.scrollTo({
          top: topPos,
          behavior: 'smooth'
        });
      }
      
      // Add a short delay before changing the step for better animation
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, 50);
    }
  };

  // Handle form submission - now only called on the final step
  const onSubmit = async (values: FormValues) => {
    if (!isConnected) {
      return;
    }
    
    // This should only be called on the final step now
    // Ensure we're passing a valid integer string to BigInt
    if (!hasAllowance(BigInt(values.assetsAmount.split('.')[0] || '0'))) {
      handleApprove(values);
      return;
    }

    try {
      // Format beneficiaries data
      const beneficiaryAddresses = values.beneficiaries.map(b => b.address);
      const beneficiaryShares = values.beneficiaries.map(b => Number(b.share));

      await createWill(
        values.assetsAmount,
        beneficiaryAddresses,
        beneficiaryShares,
        Number(values.inactivityPeriod),
        values.metadataURI || ''
      );

      // Show success state with animation
      setShowSuccessState(true);
      
      // Create success animation timeline
      const successTimeline = gsap.timeline({
        onComplete: () => {
          // Redirect to wills page after successful creation and animation
          setTimeout(() => router.push('/wills'), 2500);
        }
      });
      
      // Animate success elements
      successTimeline
        .to(".form-container", { 
          opacity: 0,
          y: 20, 
          duration: 0.5,
          ease: "power2.in",
        })
        .from(".success-container", { 
          opacity: 0,
          y: -30,
          scale: 0.9,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
        })
        .from(".success-text", {
          opacity: 0,
          y: 20,
          stagger: 0.15,
          duration: 0.6,
          ease: "power2.out",
        }, "-=0.4");
      
    } catch (error) {
      console.error("Error creating will:", error);
    }
  };

  // Watch for values to calculate remaining share
  const watchedBeneficiaries = form.watch("beneficiaries");
  const totalShare = watchedBeneficiaries.reduce(
    (sum, b) => sum + (isNaN(Number(b.share)) ? 0 : Number(b.share)), 0
  );
  const remainingShare = 100 - totalShare;
  
  // Watch asset amount for visualization
  const watchedAssetsAmount = form.watch("assetsAmount");
  
  // Calculate estimated BTC price (placeholder - in a real app, this would come from an API)
  const { price: btcPrice, isLoading: isPriceLoading } = useGetBtcUsdPrice(); // USD
  const estimatedTotalValue = parseFloat(watchedAssetsAmount || '0') * btcPrice!;

  // Handle step validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return form.trigger("assetsAmount");
      case 2:
        return form.trigger("inactivityPeriod");
      case 3:
        return form.trigger(["beneficiaries"]);
      case 4:
        return Promise.resolve(true); // Review step is always valid
      default:
        return Promise.resolve(true);
    }
  };

  // This function is now integrated into the onSubmit handler

  // Enhancement: Add visual form feedback for each step
  const getStepStatus = (stepId: number) => {
    if (stepId > currentStep) return "pending";
    if (stepId === currentStep) return "current";
    
    // For completed steps, check if they're valid
    switch (stepId) {
      case 1:
        return !form.formState.errors.assetsAmount ? "completed" : "error";
      case 2:
        return !form.formState.errors.inactivityPeriod ? "completed" : "error";
      case 3:
        return !form.formState.errors.beneficiaries ? "completed" : "error";
      default:
        return "completed";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ParallaxCard className="overflow-hidden border-none shadow-xl">
              <div className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white/70 mb-2">Connection Required</h2>
                <p className="text-white/70 mb-6">
                  Connect your wallet to create a secure crypto will and ensure your digital assets are protected.
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#f7931a] to-[#ff6b35] hover:opacity-90 transition-all"
                >
                  Connect Wallet
                </Button>
              </div>
            </ParallaxCard>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ParallaxCard className="overflow-hidden border-none shadow-xl">
              <div className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white/70 mb-2">Wrong Network</h2>
                <p className="text-white/70 mb-6">
                  Please switch to Avalanche Fuji Testnet to create and manage your crypto wills.
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#f7931a] to-[#ff6b35] hover:opacity-90 transition-all"
                  onClick={switchToFujiNetwork}
                >
                  Switch Network
                </Button>
              </div>
            </ParallaxCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 relative" ref={pageWrapperRef}>
      {/* Floating background elements */}
      <FloatingElements 
        count={8} 
        className="absolute inset-0 overflow-hidden pointer-events-none" 
        colors={["#f7931a33", "#ff6b3522", "#fdba7433"]}
      />
      
      {/* Parallax background */}
      <div 
        ref={parallaxBgRef}
        className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full">
          <img 
            src="/images/bitcoin-pattern.png" 
            alt="" 
            className="w-full h-full object-cover opacity-10"
          />
        </div>
      </div>
      
      <div className="container mx-auto max-w-4xl px-4 relative">
        {/* Back button with animation */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="group flex items-center gap-2 hover:bg-transparent hover:shadow-sm transition-all"
            onClick={() => router.push('/wills')}
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to My Wills</span>
          </Button>
        </motion.div>

        {/* Page header with animations */}
        <div className="mb-12 text-center" ref={headerRef}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 ref={titleRef as React.RefObject<HTMLHeadingElement>} className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f7931a] via-[#ff6b35] to-[#fdba74] mb-4">
              Create Your Digital Legacy
            </h1>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-white/70 max-w-2xl mx-auto"
          >
            Secure your digital assets and ensure they reach your beneficiaries with our advanced smart contract Will system.
            We've made the process simple, secure, and easy to manage.
          </motion.p>
        </div>

        {/* Step indicator */}
        <StepIndicator 
          steps={formSteps}
          currentStep={currentStep} 
          onStepClick={(step) => {
            if (step < currentStep) {
              setDirection('backward');
              setCurrentStep(step);
            }
          }}
          allowNavigation={true}
        />

        {/* Main content card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <ParallaxCard className="border-none shadow-xl overflow-hidden">
            {showSuccessState ? (
              // Success state
              <div className="success-container p-12 flex flex-col items-center justify-center min-h-[500px]">
                <SuccessAnimation size="lg" className="mb-8" />
                
                <h2 className="success-text text-3xl font-bold text-center text-white/70 mb-4">
                  Will Created Successfully!
                </h2>
                <p className="success-text text-white/70 text-center mb-8">
                  Your digital assets are now protected and ready to be passed on according to your wishes.
                </p>
                
                <motion.div
                  className="success-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <p className="text-sm text-white/70 mb-6 text-center">
                    Redirecting to your wills dashboard...
                  </p>
                </motion.div>
              </div>
            ) : (
              // Form container
              <div className="form-container">
                {/* Form content */}
                <FormStepContainer className="px-8 pt-6 pb-10">
                    <Form {...form}>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          // For steps before the final one, manually trigger validation and move to next step
                          if (currentStep < formSteps.length) {
                            validateCurrentStep().then(isValid => {
                              if (isValid) nextStep();
                            });
                          } else {
                            // For the final step, use the normal form submission
                            form.handleSubmit(onSubmit)(e);
                          }
                        }} 
                        className="space-y-8" 
                        ref={formElementRef}
                      >
                      {/* Step 1: Assets */}
                      <FormStepTransition 
                        isActive={currentStep === 1} 
                        direction={direction}
                        stepKey={`step-1-${formAnimationKey}`}
                      >
                        <div className="space-y-8">
                          <div className="stagger-item">
                            <h2 className="text-2xl font-bold text-white/70 mb-1">Define Your Assets</h2>
                            <p className="text-white/70 mb-6">Specify how much of your WBTC you want to secure in this will.</p>
                          </div>
                        
                          <div className="grid md:grid-cols-2 gap-8">
                            <div className="stagger-item">
                              <FormField
                                control={form.control}
                                name="assetsAmount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base font-semibold text-white/70">WBTC Amount</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center">
                                        <Input
                                          placeholder="0.01"
                                          {...field}
                                          disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                                          className="bg-transparent backdrop-blur-sm border-gray-300 focus:border-[#f7931a] focus:ring focus:ring-[#f7931a]/20 transition-all"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          className="ml-2 hover:bg-[#f7931a]/10 transition-all"
                                          onClick={() => form.setValue('assetsAmount', wbtcBalance)}
                                          disabled={balanceLoading || !wbtcBalance}
                                        >
                                          Max
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormDescription className="flex items-center gap-1.5 mt-2">
                                      <Info className="h-3.5 w-3.5 text-white/70" />
                                      Available: {balanceLoading ? 'Loading...' : (
                                        <span className="font-semibold">{wbtcBalance} WBTC</span>
                                      )}
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="stagger-item">
                              <AssetVisualizer 
                                amount={watchedAssetsAmount || '0.01'} 
                                bitcoinPrice={btcPrice!}
                                className="h-full"
                              />
                            </div>
                          </div>
                      </div>
                      </FormStepTransition>
                      
                      {/* Step 2: Timeframe */}
                      <FormStepTransition 
                        isActive={currentStep === 2} 
                        direction={direction}
                        stepKey={`step-2-${formAnimationKey}`}
                      >
                        <div className="space-y-6">
                          <div className="stagger-item">
                            <h2 className="text-2xl font-bold text-white/70 mb-1">Set Inactivity Period</h2>
                            <p className="text-white/70 mb-6">This is the time period after which your will can be executed if you don't interact with it.</p>
                          </div>
                          
                          <div className="max-w-md mx-auto">
                            <FormField
                              control={form.control}
                              name="inactivityPeriod"
                              render={({ field }) => (
                                <FormItem className="stagger-item">
                                  <FormLabel className="text-base font-semibold text-white/70">Inactivity Period</FormLabel>
                                  <Select
                                    disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-transparent backdrop-blur-sm border-gray-300 focus:border-[#f7931a] focus:ring focus:ring-[#f7931a]/20 transition-all">
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="30">30 days</SelectItem>
                                      <SelectItem value="90">90 days</SelectItem>
                                      <SelectItem value="180">180 days</SelectItem>
                                      <SelectItem value="365">1 year</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="flex items-center gap-1.5 mt-2">
                                    <Clock className="h-3.5 w-3.5 text-white/70" />
                                    If you don&apos;t interact with the will for this period, it becomes executable by your beneficiaries.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="stagger-item mt-8">
                            <FormField
                              control={form.control}
                              name="metadataURI"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base font-semibold text-white/70">Additional Information (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Leave instructions or link to external documents"
                                      className="resize-y bg-transparent backdrop-blur-sm border-gray-300 focus:border-[#f7931a] focus:ring focus:ring-[#f7931a]/20 transition-all min-h-[100px]"
                                      {...field}
                                      disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                                    />
                                  </FormControl>
                                  <FormDescription className="flex items-center gap-1.5 mt-2">
                                    <Info className="h-3.5 w-3.5 text-white/70" />
                                    You can include IPFS links to legal documents or specific instructions.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </FormStepTransition>
                      
                      {/* Step 3: Beneficiaries */}
                      <FormStepTransition 
                        isActive={currentStep === 3} 
                        direction={direction}
                        stepKey={`step-3-${formAnimationKey}`}
                      >
                        <div className="space-y-6">
                          <div className="stagger-item">
                            <h2 className="text-2xl font-bold text-white/70 mb-1">Add Beneficiaries</h2>
                            <p className="text-white/70 mb-4">Specify who will receive your assets and what percentage each person gets.</p>
                          </div>
                          
                          <div className="stagger-item mt-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-medium text-white/70">Beneficiaries List</h3>
                              <div className={`py-1 px-3 rounded-full text-sm font-medium ${
                                remainingShare < 0 ? 'bg-red-100 text-red-700' : 
                                remainingShare > 0 ? 'bg-amber-100 text-amber-700' : 
                                'bg-green-100 text-green-700'
                              }`}>
                                {remainingShare === 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="h-3 w-3" /> All shares allocated
                                  </span>
                                ) : (
                                  `${Math.abs(remainingShare)}% ${remainingShare > 0 ? 'remaining' : 'over allocated'}`
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                              {fields.map((field, index) => (
                                <motion.div 
                                  key={field.id} 
                                  className="grid grid-cols-12 gap-3 p-3 bg-transparent backdrop-blur-sm rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-white/90 transition-all"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                  <div className="col-span-8">
                                    <FormField
                                      control={form.control}
                                      name={`beneficiaries.${index}.address`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm text-white/70">Wallet Address</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="Beneficiary Address (0x...)"
                                              {...field}
                                              className="border-gray-300 focus:border-[#f7931a] focus:ring focus:ring-[#f7931a]/20"
                                              disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="col-span-3">
                                    <FormField
                                      control={form.control}
                                      name={`beneficiaries.${index}.share`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm text-white/70">Share %</FormLabel>
                                          <FormControl>
                                            <div className="flex items-center">
                                              <Input
                                                type="number"
                                                placeholder="Share %"
                                                {...field}
                                                className="border-gray-300 focus:border-[#f7931a] focus:ring focus:ring-[#f7931a]/20"
                                                disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                                              />
                                              <span className="ml-1 text-white/70">%</span>
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <div className="col-span-1 flex items-center justify-center pt-6">
                                    <motion.button
                                      type="button"
                                      className={`text-white/70 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors ${
                                        (fields.length <= 1) || approvalPending || approvalConfirming || creationPending || creationConfirming
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-pointer'
                                      }`}
                                      onClick={() => remove(index)}
                                      disabled={(fields.length <= 1) || approvalPending || approvalConfirming || creationPending || creationConfirming}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                    >
                                      <Trash className="h-5 w-5" />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                              
                            <motion.button
                              type="button"
                              className={`flex items-center justify-center gap-2 w-full py-3 px-4 bg-transparent hover:bg-white/95 text-[#f7931a] border border-gray-200 hover:border-[#f7931a]/30 rounded-lg transition-all ${
                                approvalPending || approvalConfirming || creationPending || creationConfirming
                                ? 'opacity-50 cursor-not-allowed'
                                : 'cursor-pointer'
                              }`}
                              onClick={() => append({ address: '', share: remainingShare > 0 ? remainingShare.toString() : '0' })}
                              disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                              whileHover={{ y: -2 }}
                              whileTap={{ y: 0 }}
                            >
                              <Plus className="h-5 w-5" /> Add Another Beneficiary
                            </motion.button>
                          </div>
                        </div>
                      </FormStepTransition>
                      
                      {/* Step 4: Confirmation */}
                      <FormStepTransition 
                        isActive={currentStep === 4} 
                        direction={direction}
                        stepKey={`step-4-${formAnimationKey}`}
                      >
                        <div className="space-y-6">
                          <div className="stagger-item">
                            <h2 className="text-2xl font-bold text-white/70 mb-1">Review & Confirm</h2>
                            <p className="text-white/70 mb-6">Please review the details of your will before creation.</p>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="stagger-item bg-transparent backdrop-blur-sm rounded-xl border border-gray-200 p-4">
                              <h3 className="font-medium text-white/70 mb-2">Will Details</h3>
                              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <dt className="text-white/70 text-sm">Assets:</dt>
                                <dd className="text-sm font-medium">{form.getValues('assetsAmount')} WBTC</dd>
                                
                                <dt className="text-white/70 text-sm">Est. Value:</dt>
                                <dd className="text-sm font-medium">${(parseFloat(form.getValues('assetsAmount') || '0') * btcPrice!).toLocaleString('en-US', { maximumFractionDigits: 2 })}</dd>
                                
                                <dt className="text-white/70 text-sm">Inactivity Period:</dt>
                                <dd className="text-sm font-medium">{form.getValues('inactivityPeriod')} days</dd>
                              </dl>
                            </div>
                            
                            <div className="stagger-item bg-transparent backdrop-blur-sm rounded-xl border border-gray-200 p-4">
                              <h3 className="font-medium text-white/70 mb-2">Beneficiaries</h3>
                              <div className="space-y-2">
                                {form.getValues('beneficiaries').map((beneficiary, index) => (
                                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="text-sm truncate max-w-[70%]" title={beneficiary.address}>
                                      {beneficiary.address.substring(0, 6)}...{beneficiary.address.substring(beneficiary.address.length - 4)}
                                    </div>
                                    <div className="text-sm font-medium">{beneficiary.share}%</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {form.getValues('metadataURI') && (
                              <div className="stagger-item bg-transparent backdrop-blur-sm rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-white/70 mb-2">Additional Information</h3>
                                <p className="text-sm text-white/70">{form.getValues('metadataURI')}</p>
                              </div>
                            )}
                            
                            {approvalSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="stagger-item"
                              >
                                <Alert className="bg-green-50 border-green-200">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <AlertTitle className="text-green-800">Approval Successful</AlertTitle>
                                  <AlertDescription className="text-green-700">
                                    WBTC tokens approved. You can now create your will.
                                  </AlertDescription>
                                </Alert>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </FormStepTransition>
                      
                      {/* Navigation Buttons */}
                      <div className="pt-8 border-t border-gray-200 mt-8 flex justify-between">
                        {currentStep > 1 ? (
                          <motion.button
                            type="button"
                            onClick={prevStep}
                            className="flex items-center gap-2 px-6 py-2.5 text-white/70 hover:text-gray-900 transition-colors"
                            whileHover={{ x: -3 }}
                            whileTap={{ x: 0 }}
                            disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                          >
                            <ChevronLeft className="h-5 w-5" />
                            <span>Previous</span>
                          </motion.button>
                        ) : (
                          <div></div>
                        )}
                        
                        <motion.button
                          ref={ctaButtonRef}
                          type="submit"
                          className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                            approvalPending || approvalConfirming || creationPending || creationConfirming 
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#f7931a] to-[#ff6b35] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={approvalPending || approvalConfirming || creationPending || creationConfirming}
                        >
                          {approvalPending || approvalConfirming ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              <span>Approving WBTC...</span>
                            </>
                          ) : creationPending || creationConfirming ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              <span>Creating Will...</span>
                            </>
                          ) : !hasAllowance(BigInt((form.watch('assetsAmount') || '0').split('.')[0])) && currentStep === 4 ? (
                            <>
                              <Shield className="h-5 w-5" />
                              <span>Approve WBTC</span>
                            </>
                          ) : currentStep === formSteps.length ? (
                            <>
                              <Shield className="h-5 w-5" />
                              <span>Create Will</span>
                            </>
                          ) : (
                            <>
                              <span>Continue</span>
                              <ChevronRight className="h-5 w-5" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  </Form>
                </FormStepContainer>
              </div>
            )}
          </ParallaxCard>
        </motion.div>
      </div>
    </div>
  );
}
