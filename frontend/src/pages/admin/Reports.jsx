import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, TrendingUp, Users, Calendar } from 'lucide-react'

export default function Reports() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <FileText className="mr-3 h-8 w-8" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate and download comprehensive reports
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Student Attendance Report
            </CardTitle>
            <CardDescription>
              Generate detailed attendance records for all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export comprehensive attendance data including student names, classes, timestamps, and verification status.
            </p>
            <Button disabled className="w-full">
              Generate Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Class Attendance Summary
            </CardTitle>
            <CardDescription>
              View attendance statistics by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get class-by-class breakdown of attendance rates, participation, and trends over time.
            </p>
            <Button disabled className="w-full">
              Generate Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Attendance Trends
            </CardTitle>
            <CardDescription>
              Analyze attendance patterns and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View charts and graphs showing attendance trends, peak times, and participation rates.
            </p>
            <Button disabled className="w-full">
              Generate Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Custom Report Builder
            </CardTitle>
            <CardDescription>
              Create custom reports with specific criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Choose specific date ranges, classes, and students to generate customized reports.
            </p>
            <Button disabled className="w-full">
              Build Report (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Quick Export</CardTitle>
          <CardDescription className="text-blue-700">
            Need data now? Use the Attendance Viewer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-3">
            You can export filtered attendance data directly from the Attendance Viewer page using the Export CSV button.
          </p>
          <a href="/admin/attendance">
            <Button variant="default">Go to Attendance Viewer</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  )
}
