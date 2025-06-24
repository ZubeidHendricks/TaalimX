'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, Shield, CreditCard } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">TaalimX</span>
          </div>
          <div className="space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Quality Islamic Education
          <span className="block text-primary">Made Simple</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Connect with vetted, qualified Islamic teachers for personalized madrasa education. 
          Our platform ensures safe, reliable learning experiences for your children.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/sign-up?role=parent">
            <Button size="lg" className="px-8">
              Find a Teacher
            </Button>
          </Link>
          <Link href="/sign-up?role=teacher">
            <Button variant="outline" size="lg" className="px-8">
              Become a Teacher
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Verified Teachers</CardTitle>
              <CardDescription>
                All teachers undergo thorough vetting, including ID verification and police clearance checks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Personalized Learning</CardTitle>
              <CardDescription>
                Teachers assess each student's level and provide customized Islamic education
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Comprehensive Curriculum</CardTitle>
              <CardDescription>
                From basic Arabic recitation to advanced Islamic studies, we cover all levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Easy Payments</CardTitle>
              <CardDescription>
                Secure payment processing with automated monthly teacher payouts
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-12">How TaalimX Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Parents */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-primary">For Parents</h3>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">1</span>
                <div>
                  <h4 className="font-medium">Sign Up</h4>
                  <p className="text-gray-600">Create an account and add your children's details</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">2</span>
                <div>
                  <h4 className="font-medium">Browse Teachers</h4>
                  <p className="text-gray-600">View verified teachers and their qualifications</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">3</span>
                <div>
                  <h4 className="font-medium">Book Classes</h4>
                  <p className="text-gray-600">Schedule lessons at convenient times</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">4</span>
                <div>
                  <h4 className="font-medium">Pay Securely</h4>
                  <p className="text-gray-600">Easy online payments for classes</p>
                </div>
              </li>
            </ol>
          </div>

          {/* For Teachers */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-primary">For Teachers</h3>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">1</span>
                <div>
                  <h4 className="font-medium">Apply</h4>
                  <p className="text-gray-600">Submit your credentials and documentation</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">2</span>
                <div>
                  <h4 className="font-medium">Get Verified</h4>
                  <p className="text-gray-600">Complete our interview and vetting process</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">3</span>
                <div>
                  <h4 className="font-medium">Start Teaching</h4>
                  <p className="text-gray-600">Accept bookings and conduct classes</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white mr-4">4</span>
                <div>
                  <h4 className="font-medium">Get Paid</h4>
                  <p className="text-gray-600">Receive automatic monthly payments</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-20 border-t">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">TaalimX</span>
            </div>
            <p className="text-gray-600">
              Connecting students with qualified Islamic educators for quality madrasa education.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/safety">Safety</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/careers">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/cookies">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} TaalimX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
