"use client"

import { useState } from "react"
import { Play, Pause, Volume2, Download } from "lucide-react"
import { Button } from "@/registry/new-york/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york/ui/card"
import { Badge } from "@/registry/new-york/ui/badge"
import { Progress } from "@/registry/new-york/ui/progress"

export function HeroSection() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(33)

  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-950" />
        {/* Particle effect simulation */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 animate-pulse rounded-full bg-[#00A291]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center">
          <Badge className="mb-4 bg-[#00A291]/10 text-[#00A291]" variant="outline">
            New Episode Every Week
          </Badge>
          
          <h1 className="mb-6 text-5xl font-bold uppercase tracking-wider md:text-7xl lg:text-8xl">
            Unlock Elite<br />
            Performance
          </h1>
          
          <p className="mb-12 max-w-3xl text-lg text-zinc-400 md:text-xl">
            Join industry leaders as we explore the science of motivation, behavior, and 
            communication. Discover how the iDrive methodology is transforming organizations 
            worldwide.
          </p>

          {/* Podcast Player */}
          <Card className="w-full max-w-4xl border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white">Episode 12: Breaking Performance Barriers</CardTitle>
                  <CardDescription className="text-zinc-400">
                    With Sarah Richardson, HR Director at TechCorp UK
                  </CardDescription>
                </div>
                <Badge className="bg-[#00A291] text-white">Latest</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Video/Audio Player */}
              <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-zinc-800">
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[#00A291] text-white transition hover:bg-[#00635a]"
                  >
                    {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                  </button>
                </div>
              </div>

              {/* Player Controls */}
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>12:45</span>
                  <span>38:20</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white">
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" className="border-[#00A291] text-[#00A291] hover:bg-[#00A291] hover:text-white">
                    View Transcript
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="bg-[#00A291] px-8 text-white hover:bg-[#00635a]">
              Take the Free iDrive Assessment
            </Button>
            <Button size="lg" variant="outline" className="border-[#00A291] text-[#00A291] hover:bg-[#00A291] hover:text-white">
              Book a Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}