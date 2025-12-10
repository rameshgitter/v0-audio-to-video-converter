"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  Sparkles,
  Video,
  Download,
  Upload,
  Clock,
  Infinity,
  Shield,
  Headphones,
} from "lucide-react"
import Link from "next/link"

const plans = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out AudioVid Pro",
    price: { monthly: 0, yearly: 0 },
    icon: Zap,
    popular: false,
    features: [
      { text: "3 video exports per month", included: true },
      { text: "720p quality", included: true },
      { text: "4 visualizer styles", included: true },
      { text: "Basic backgrounds", included: true },
      { text: "AudioVid watermark", included: true },
      { text: "1080p+ quality", included: false },
      { text: "Custom watermark", included: false },
      { text: "Priority rendering", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For creators who need more power",
    price: { monthly: 12, yearly: 9 },
    icon: Crown,
    popular: true,
    features: [
      { text: "Unlimited video exports", included: true },
      { text: "Up to 4K quality", included: true },
      { text: "8 visualizer styles", included: true },
      { text: "All backgrounds + animated", included: true },
      { text: "No watermark", included: true },
      { text: "Custom watermark option", included: true },
      { text: "Priority rendering", included: true },
      { text: "YouTube direct upload", included: true },
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "For agencies and teams",
    price: { monthly: 39, yearly: 29 },
    icon: Building2,
    popular: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "5 team members", included: true },
      { text: "Brand kit support", included: true },
      { text: "API access", included: true },
      { text: "Priority support", included: true },
      { text: "Custom templates", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Batch processing", included: true },
    ],
  },
]

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You will continue to have access to Pro features until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. For Team plans, we also offer invoice billing.",
  },
  {
    question: "Is there a limit on video length?",
    answer: "Free users can create videos up to 5 minutes long. Pro and Team plans have no length restrictions.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 14-day money-back guarantee for all paid plans. If you are not satisfied, contact our support team for a full refund.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "You can change your plan at any time. When upgrading, you will be charged the prorated difference. When downgrading, credits will be applied to your next billing cycle.",
  },
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Simple, transparent pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. All plans include access to our core features.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <Label htmlFor="billing" className={!isYearly ? "text-foreground" : "text-muted-foreground"}>
                Monthly
              </Label>
              <Switch id="billing" checked={isYearly} onCheckedChange={setIsYearly} />
              <Label htmlFor="billing" className={isYearly ? "text-foreground" : "text-muted-foreground"}>
                Yearly
              </Label>
              {isYearly && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  Save 25%
                </Badge>
              )}
            </div>

            {/* Pricing cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-primary shadow-lg shadow-primary/20" : ""}`}
                >
                  {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>}
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center ${
                        plan.popular ? "bg-primary" : "bg-secondary"
                      }`}
                    >
                      <plan.icon className={`h-6 w-6 ${plan.popular ? "text-primary-foreground" : ""}`} />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${isYearly ? plan.price.yearly : plan.price.monthly}</span>
                      {plan.price.monthly > 0 && <span className="text-muted-foreground">/month</span>}
                    </div>

                    <Link href="/create">
                      <Button
                        className={`w-full mb-6 ${plan.popular ? "" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                      >
                        {plan.price.monthly === 0 ? "Start Free" : "Get Started"}
                      </Button>
                    </Link>

                    <ul className="space-y-3 text-left">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span className={feature.included ? "" : "text-muted-foreground"}>{feature.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features comparison */}
        <section className="py-20 px-4 bg-secondary/30">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why choose AudioVid Pro?</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Video, title: "8K+ Videos Created", description: "Trusted by thousands of creators worldwide" },
                {
                  icon: Sparkles,
                  title: "8 Visualizer Styles",
                  description: "From classic bars to stunning particles",
                },
                { icon: Download, title: "Instant Downloads", description: "No waiting, get your video immediately" },
                { icon: Upload, title: "Direct Upload", description: "Publish to YouTube with one click" },
                {
                  icon: Clock,
                  title: "Fast Rendering",
                  description: "Optimized for speed without compromising quality",
                },
                { icon: Infinity, title: "No Limits", description: "Create as many videos as you need" },
                { icon: Shield, title: "Privacy First", description: "Your audio files are never stored" },
                { icon: Headphones, title: "24/7 Support", description: "Get help whenever you need it" },
              ].map((item, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently asked questions</h2>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-primary/5">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to create amazing videos?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of creators who are already using AudioVid Pro to turn their audio into stunning videos.
            </p>
            <Link href="/create">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start Creating for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
