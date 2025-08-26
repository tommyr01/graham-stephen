import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, MessageCircle, Star, Brain } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-h3 font-bold">LinkedIn Research Tool</h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="/research" className="text-body hover:text-primary transition-colors">
                Comment Research
              </Link>
              <Link href="/profile-research" className="text-body hover:text-primary transition-colors">
                Profile Research
              </Link>
              <Link href="/training" className="text-body hover:text-primary transition-colors">
                AI Training
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-h1 sm:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Find Your Next Best Prospects on LinkedIn
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Get 0-10 relevance scores for any LinkedIn profile or comment thread. 
              Know exactly which prospects to contact first, and why they're worth your time.
            </p>
            <div className="flex gap-4 justify-center flex-col sm:flex-row mb-12">
              <Link href="/research">
                <Button size="lg" className="gap-2 focus-ring-enhanced animate-wobble">
                  <Target className="w-5 h-5" />
                  Comment Research
                </Button>
              </Link>
              <Link href="/profile-research">
                <Button variant="outline" size="lg" className="gap-2 animate-wobble">
                  <Users className="w-5 h-5" />
                  Profile Research
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Research Methods */}
        <section className="py-16 px-4 bg-muted/20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg" delightful>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-h3">Comment Research</CardTitle>
                  <p className="text-muted-foreground text-sm">Find prospects from LinkedIn post comments</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• Viral posts with 50+ comments</li>
                    <li>• Industry discussions</li>
                    <li>• Competitor's engaged audience</li>
                  </ul>
                  <Link href="/research">
                    <Button className="w-full gap-2">
                      <Target className="w-4 h-4" />
                      Start Comment Research
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg" delightful>
                <CardHeader>
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <CardTitle className="text-h3">Profile Research</CardTitle>
                  <p className="text-muted-foreground text-sm">Qualify specific prospects you already know</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li>• Qualifying inbound leads</li>
                    <li>• Research before outreach</li>
                    <li>• Verify referrals</li>
                  </ul>
                  <Link href="/profile-research">
                    <Button variant="outline" className="w-full gap-2">
                      <Users className="w-4 h-4" />
                      Start Profile Research
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" delightful>
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-h3 text-purple-900">AI Training Dashboard</CardTitle>
                  <p className="text-purple-700 text-sm">Watch your AI learn and improve</p>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-purple-700 space-y-1 mb-4">
                    <li>• Real-time learning progress</li>
                    <li>• Pattern validation interface</li>
                    <li>• Personal intelligence insights</li>
                  </ul>
                  <Link href="/training">
                    <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
                      <Brain className="w-4 h-4" />
                      View Training Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Score Guide */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-h2 font-bold mb-8">Understanding Scores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-green-200 bg-green-50" delightful>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 animate-gentle-bounce">
                    8+
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">Contact Now</h3>
                  <p className="text-sm text-green-700">
                    High relevance, recent activity, strong match
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200 bg-yellow-50" delightful>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 animate-gentle-bounce" style={{animationDelay: '0.2s'}}>
                    4-7
                  </div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Good Prospects</h3>
                  <p className="text-sm text-yellow-700">
                    Some relevance, worth research or nurturing
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-gray-200 bg-gray-50" delightful>
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-gray-400 rounded-full text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 animate-gentle-bounce" style={{animationDelay: '0.4s'}}>
                    0-3
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Skip or Research</h3>
                  <p className="text-sm text-gray-700">
                    Low relevance, consider skipping
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="w-6 h-6 text-primary" />
            <span className="text-h5 font-bold">LinkedIn Research Tool</span>
          </div>
          <p className="text-body-sm text-muted-foreground">
            Automate your LinkedIn prospecting with AI-powered analysis.
          </p>
        </div>
      </footer>
    </div>
  )
}