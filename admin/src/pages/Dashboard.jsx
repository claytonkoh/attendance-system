import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, CheckCircle, TrendingUp, Calendar, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalUsers: 0,
    totalClasses: 0,
    totalAttendance: 0,
    todayAttendance: 0,
    weekAttendance: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentAttendance, setRecentAttendance] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch stats
      const statsRes = await api.get('/admin/stats')
      setStats(statsRes.data)

      // Fetch recent attendance
      const attendanceRes = await api.get('/admin/attendance')
      setRecentAttendance(attendanceRes.data.slice(0, 5)) // Get last 5 records
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, description, icon: Icon, trend, color = "blue" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? '...' : value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your attendance system.
          </p>
        </div>
        <Link to="/admin/classes">
          <Button>Manage Classes</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents}
          description="Registered students"
          icon={Users}
          color="blue"
        />
        <StatCard 
          title="Total Classes" 
          value={stats.totalClasses}
          description="Active classes"
          icon={BookOpen}
          color="purple"
        />
        <StatCard 
          title="Today's Attendance" 
          value={stats.todayAttendance}
          description="Records today"
          icon={Calendar}
          color="green"
        />
        <StatCard 
          title="Total Records" 
          value={stats.totalAttendance}
          description="All-time attendance"
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Last 7 days attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.weekAttendance}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Attendance records this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lecturers</CardTitle>
            <CardDescription>Teaching staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLecturers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered lecturers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>Total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Students + Lecturers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Recent Attendance
          </CardTitle>
          <CardDescription>Latest attendance submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentAttendance.map((record) => (
                <div 
                  key={record._id} 
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{record.user?.name || 'Unknown User'}</div>
                    <div className="text-sm text-muted-foreground">
                      {record.user?.student_id} • {record.class?.name || 'Unknown Class'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div className={`text-xs ${record.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {record.verified ? '✓ Verified' : '⚠ Pending'}
                      {record.confidence && ` (${Math.round(record.confidence * 100)}%)`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/admin/attendance">
              <Button variant="outline" size="sm">View All Attendance</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/admin/classes">
            <Button variant="outline" className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Classes
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="outline" className="w-full">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Link to="/admin/attendance">
            <Button variant="outline" className="w-full">
              <CheckCircle className="mr-2 h-4 w-4" />
              View Attendance
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="outline" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
