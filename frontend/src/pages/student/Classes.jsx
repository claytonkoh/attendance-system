import { useState, useEffect } from 'react'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Clock, User as UserIcon } from 'lucide-react'

export default function Classes() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/')
      setClasses(response.data)
    } catch (error) {
      console.error("Failed to fetch classes", error)
      toast.error("Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (classId) => {
    try {
      await api.post(`/classes/${classId}/enroll`)
      toast.success("Enrolled successfully")
      fetchClasses() // Refresh list to update enrollment status
    } catch (error) {
      console.error("Enrollment failed", error)
      toast.error(error.response?.data?.detail || "Enrollment failed")
    }
  }

  const isEnrolled = (cls) => {
    const userId = user.id || user._id;
    return cls.enrolled_student_ids && cls.enrolled_student_ids.includes(userId)
  }

  if (loading) {
    return <div>Loading classes...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Available Classes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <Card key={cls._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{cls.name}</CardTitle>
                <Badge variant="outline">{cls.code}</Badge>
              </div>
              <CardDescription className="flex items-center mt-2">
                <UserIcon className="w-4 h-4 mr-1" />
                Lecturer ID: {cls.lecturer_id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4 mr-2" />
                {cls.schedule}
              </div>
            </CardContent>
            <CardFooter>
              {isEnrolled(cls) ? (
                <Button className="w-full" variant="secondary" disabled>
                  Enrolled
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleEnroll(cls._id)}>
                  Enroll
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
