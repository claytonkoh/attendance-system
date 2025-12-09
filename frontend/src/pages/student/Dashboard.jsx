import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User as UserIcon } from 'lucide-react'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/classes/')
        // Filter classes where user is enrolled
        // Note: user.id might be user._id depending on how it's returned from backend
        // The backend UserResponse usually maps _id to id, but let's check both
        const userId = user.id || user._id;
        
        const myClasses = response.data.filter(cls => 
          cls.enrolled_student_ids && cls.enrolled_student_ids.includes(userId)
        )
        setEnrolledClasses(myClasses)
      } catch (error) {
        console.error("Failed to fetch classes", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchClasses()
    }
  }, [user])

  if (loading) {
    return <div>Loading classes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Classes</h1>
        <Button asChild>
          <Link to="/student/classes">Browse Classes</Link>
        </Button>
      </div>

      {enrolledClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground text-lg">You are not enrolled in any classes yet.</p>
            <Button asChild>
              <Link to="/student/classes">Enroll in a Class</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledClasses.map((cls) => (
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
                <Button className="w-full" asChild>
                  <Link to={`/student/attendance/${cls._id}`}>Enter Class</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
