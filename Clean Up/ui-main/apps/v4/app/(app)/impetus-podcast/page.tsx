"use client"

import { useState } from "react"
import { ChevronRight, Quote, Star, Users, Target, TrendingUp, ArrowRight } from "lucide-react"

import { HeroSection } from "@/components/impetus/hero-section"
import { LeadCaptureForm } from "@/components/impetus/lead-capture-form"

export default function ImpetusPocastPage() {
  const testimonials = [
    {
      name: "Sarah Richardson",
      role: "HR Director",
      company: "TechCorp UK",
      content: "The iDrive assessment completely transformed how we approach team development. We've seen a 40% improvement in team performance.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "CEO",
      company: "Innovation Labs",
      content: "Impetus Global helped us unlock potential we didn't know existed. The ROI has been exceptional - worth every penny.",
      rating: 5,
    },
    {
      name: "Emma Thompson",
      role: "Team Leader",
      company: "FinanceHub",
      content: "The practical strategies from the podcast have made an immediate impact. My team is more engaged and productive than ever.",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="text-2xl font-bold text-[#00A291]">IMPETUS</div>
          <div className="hidden space-x-8 md:flex">
            <a href="#about" className="text-zinc-400 transition hover:text-[#00A291]">About</a>
            <a href="#testimonials" className="text-zinc-400 transition hover:text-[#00A291]">Success Stories</a>
            <a href="#idrive" className="text-zinc-400 transition hover:text-[#00A291]">iDrive</a>
            <a href="#contact" className="text-zinc-400 transition hover:text-[#00A291]">Contact</a>
          </div>
          <button className="rounded-full bg-[#00A291] px-6 py-2 text-white transition hover:bg-[#00635a]">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section with Podcast Player */}
      <HeroSection />

      {/* Key Takeaways Section */}
      <section className="border-t border-zinc-800 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold uppercase tracking-wider">Key Insights</h2>
            <p className="text-xl text-zinc-400">Actionable strategies you can implement today</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <Target className="mb-4 h-12 w-12 text-[#00A291]" />
              <h3 className="mb-4 text-xl font-bold text-white">Motivation Mapping</h3>
              <p className="text-zinc-400">
                Learn how to identify and leverage the unique motivational drivers 
                within your team for maximum engagement and performance.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <Users className="mb-4 h-12 w-12 text-[#00A291]" />
              <h3 className="mb-4 text-xl font-bold text-white">Behavioral Insights</h3>
              <p className="text-zinc-400">
                Understand the science behind behavior patterns and how to create 
                environments that naturally drive high performance.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
              <TrendingUp className="mb-4 h-12 w-12 text-[#00A291]" />
              <h3 className="mb-4 text-xl font-bold text-white">Sustainable Growth</h3>
              <p className="text-zinc-400">
                Discover proven frameworks for building lasting change that 
                continues to deliver results long after implementation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="border-t border-zinc-800 bg-zinc-950 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold uppercase tracking-wider">Success Stories</h2>
            <p className="text-xl text-zinc-400">Real results from real leaders</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00A291] text-white font-bold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-zinc-400">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#00A291] text-[#00A291]" />
                    ))}
                  </div>
                </div>
                <Quote className="mb-4 h-8 w-8 text-[#00A291]/50" />
                <p className="text-zinc-300">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* iDrive Assessment Preview */}
      <section id="idrive" className="border-t border-zinc-800 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-block rounded-full border border-[#00A291] bg-[#00A291]/10 px-3 py-1 text-sm text-[#00A291]">
              Free Assessment
            </div>
            <h2 className="mb-4 text-4xl font-bold uppercase tracking-wider">Experience iDrive</h2>
            <p className="text-xl text-zinc-400">
              Discover what motivates you and your team in just 10 minutes
            </p>
          </div>

          <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-bold text-white">Sample Question</h3>
              <p className="text-zinc-400">Question 1 of 10</p>
            </div>
            
            <div className="space-y-6">
              <p className="text-lg text-zinc-300">
                When faced with a challenging project, what drives you most?
              </p>
              
              <div className="space-y-3">
                {[
                  "The opportunity to solve complex problems",
                  "Recognition from leadership and peers",
                  "Making a meaningful impact on the team",
                  "Personal growth and skill development"
                ].map((option, index) => (
                  <label
                    key={index}
                    className="flex cursor-pointer items-center space-x-3 rounded-lg border border-zinc-700 p-4 transition hover:border-[#00A291]"
                  >
                    <input type="radio" name="question" className="text-[#00A291]" />
                    <span className="text-zinc-300">{option}</span>
                  </label>
                ))}
              </div>

              <button className="w-full rounded-lg bg-[#00A291] py-3 font-semibold text-white transition hover:bg-[#00635a]">
                Start Your Free Assessment
                <ChevronRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <LeadCaptureForm />

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-2xl font-bold text-[#00A291]">IMPETUS</div>
            <div className="flex gap-6 text-sm text-zinc-400">
              <a href="#" className="hover:text-[#00A291]">Privacy Policy</a>
              <a href="#" className="hover:text-[#00A291]">Terms of Service</a>
              <a href="#" className="hover:text-[#00A291]">Cookie Policy</a>
            </div>
            <p className="text-sm text-zinc-400">
              © 2024 Impetus Global. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}