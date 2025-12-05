import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">AudioVid Pro</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Log in
          </Button>
          <Link href="/create">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Start Creating
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
