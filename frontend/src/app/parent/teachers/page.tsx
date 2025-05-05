'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Search, GraduationCap, Star, Calendar, MapPin } from 'lucide-react'
import axios from 'axios'

interface Teacher {
  id: number
  first_name: string
  last_name: string
  email: string
  subjects: string[]
  experience_years: number
  rating: number
  total_classes: number
  hourly_rate: number
  location: string
  qualifications: Array<{
    institution: string
    qualification: string
    year_completed: number
  }>
}

export default function TeacherSearch() {
  const router = useRouter()
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    subject: '',
    minRate: '',
    maxRate: '',
    location: '',
    sortBy: 'rating'
  })

  const subjects = [
    'Quran Recitation',
    'Tajweed',
    'Islamic Studies',
    'Arabic Language',
    'Hadith Studies',
    'Fiqh',
    'Seerah'
  ]

  useEffect(() => {
    searchTeachers()
  }, [])

  const searchTeachers = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        router.push('/sign-in')
        return
      }

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/search/teachers?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setTeachers(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search teachers',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchTeachers()
  }

  const renderRating = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    return <div className="flex">{stars}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Find a Teacher</h1>

      {/* Search Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Filters</CardTitle>
          <CardDescription>Find the perfect teacher for your child</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search by name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Teacher name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={filters.subject}
                  onValueChange={(value) => handleFilterChange('subject', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price range (per hour)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange('minRate', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange('maxRate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City or area..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort by</Label>
                <Select 
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="experience">Most experienced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Search Teachers
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Teacher Results */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No teachers found matching your criteria. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{teacher.first_name} {teacher.last_name}</CardTitle>
                    <CardDescription>{teacher.email}</CardDescription>
                  </div>
                  <Badge variant="secondary">R{teacher.hourly_rate}/hr</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {renderRating(teacher.rating)}
                    <span className="text-sm text-muted-foreground">
                      ({teacher.total_classes} classes)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.experience_years} years experience</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Subjects:</h4>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Qualifications:</h4>
                    <ul className="text-sm space-y-1">
                      {teacher.qualifications.slice(0, 2).map((qual, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {qual.qualification} - {qual.institution}
                        </li>
                      ))}
                      {teacher.qualifications.length > 2 && (
                        <li className="text-muted-foreground">
                          +{teacher.qualifications.length - 2} more
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => router.push(`/parent/teachers/${teacher.id}`)}
                    >
                      View Profile
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/parent/book-class?teacher=${teacher.id}`)}
                    >
                      Book Class
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
