"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/new-york/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york/ui/card"
import { Input } from "@/registry/new-york/ui/input"
import { Label } from "@/registry/new-york/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york/ui/select"

interface FormData {
  email: string
  firstName: string
  lastName: string
  company: string
  jobTitle: string
  teamSize: string
  consentMarketing: boolean
}

export function LeadCaptureForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    jobTitle: "",
    teamSize: "",
    consentMarketing: false,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (title: string, description: string, variant?: "destructive") => {
    // Simple toast implementation - in production use proper toast library
    alert(`${title}: ${description}`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        showToast(
          "Welcome to Impetus Global!",
          "Check your email for your free iDrive assessment link."
        )
        
        // Track analytics event
        await fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "form_submit",
            eventData: {
              leadId: result.id,
              source: "podcast-landing",
            },
          }),
        })
        
        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          company: "",
          jobTitle: "",
          teamSize: "",
          consentMarketing: false,
        })
      } else {
        const error = await response.json()
        showToast(
          "Error",
          error.error || "Something went wrong. Please try again.",
          "destructive"
        )
      }
    } catch (error) {
      showToast(
        "Error",
        "Network error. Please check your connection and try again.",
        "destructive"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="border-t border-zinc-800 bg-zinc-950 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold uppercase tracking-wider">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-zinc-400">
            Get exclusive insights and early access to new episodes
          </p>
        </div>

        <Card className="mx-auto max-w-2xl border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Join Our Community</CardTitle>
            <CardDescription className="text-zinc-400">
              Over 10,000 leaders receive our weekly insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-zinc-300">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-zinc-700 bg-zinc-800 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-zinc-300">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-zinc-700 bg-zinc-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-zinc-700 bg-zinc-800 text-white"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-zinc-300">Company</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="text-zinc-300">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize" className="text-zinc-300">Team Size</Label>
                <Select
                  value={formData.teamSize}
                  onValueChange={(value) => setFormData({...formData, teamSize: value})}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                    <SelectValue placeholder="Select team size" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-800">
                    <SelectItem value="1-10">1-10 people</SelectItem>
                    <SelectItem value="11-50">11-50 people</SelectItem>
                    <SelectItem value="51-200">51-200 people</SelectItem>
                    <SelectItem value="201-500">201-500 people</SelectItem>
                    <SelectItem value="500+">500+ people</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consentMarketing}
                  onChange={(e) => setFormData({...formData, consentMarketing: e.target.checked})}
                  className="rounded border-zinc-700 text-[#00A291]"
                />
                <Label htmlFor="consent" className="text-sm text-zinc-400">
                  I agree to receive marketing communications from Impetus Global
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#00A291] text-white hover:bg-[#00635a]" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Get Started"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}