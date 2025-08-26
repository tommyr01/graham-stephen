"use client"

import * as React from "react"
import { Menu, X, Target } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface MobileNavProps {
  className?: string
}

function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  
  const closeMenu = () => setIsOpen(false)

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Header */}
      <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur", className)}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 focus-ring" onClick={closeMenu}>
              <Target className="w-6 h-6 text-primary" />
              <span className="text-h5 font-bold">LinkedIn Research</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/research" className="text-body hover:text-primary transition-colors focus-ring">
                Research
              </Link>
              <Link href="/#features" className="text-body hover:text-primary transition-colors focus-ring">
                Features
              </Link>
              <Link href="/#how-it-works" className="text-body hover:text-primary transition-colors focus-ring">
                How it works
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-target focus-ring"
              onClick={toggleMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu */}
      <nav
        id="mobile-menu"
        className={cn(
          "fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-full max-w-xs bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Mobile navigation"
      >
        <div className="flex flex-col p-6 space-y-4">
          <Link
            href="/research"
            className="text-body hover:text-primary transition-colors py-3 px-4 -mx-4 rounded-lg hover:bg-muted/50 focus-ring"
            onClick={closeMenu}
          >
            Research
          </Link>
          <Link
            href="/#features"
            className="text-body hover:text-primary transition-colors py-3 px-4 -mx-4 rounded-lg hover:bg-muted/50 focus-ring"
            onClick={closeMenu}
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-body hover:text-primary transition-colors py-3 px-4 -mx-4 rounded-lg hover:bg-muted/50 focus-ring"
            onClick={closeMenu}
          >
            How it works
          </Link>
          <div className="pt-4 border-t">
            <Link href="/" onClick={closeMenu}>
              <Button className="w-full gap-2 touch-target focus-ring-enhanced">
                <Target className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

export { MobileNav }