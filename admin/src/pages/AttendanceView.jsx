import { useState, useEffect } from 'react'
import api from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Search, Calendar, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function AttendanceView() {
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [searchTerm, selectedClass, dateFilter, attendanceRecords])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [attendanceRes, classesRes] = await Promise.all([
        api.get('/admin/attendance'),
        api.get('/admin/classes')
      ])
      setAttendanceRecords(attendanceRes.data)
      setClasses(classesRes.data)
      setFilteredRecords(attendanceRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const filterRecords = () => {
    let filtered = [...attendanceRecords]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Class filter
    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter(record => record.class?._id === selectedClass)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter(record => 
        new Date(record.timestamp) >= filterDate
      )
    }

    setFilteredRecords(filtered)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Student Name', 'Student ID', 'Class', 'Status', 'Confidence']
    const rows = filteredRecords.map(record => {
      const date = new Date(record.timestamp)
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        record.user?.name || 'Unknown',
        record.user?.student_id || '-',
        record.class?.name || 'Unknown',
        record.verified ? 'Verified' : 'Pending',
        `${Math.round((record.confidence || 0) * 100)}%`
      ]
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Attendance exported successfully')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <CheckCircle className="mr-3 h-8 w-8" />
            Attendance Records
          </h1>
          <p className="text-muted-foreground mt-1">
            View and filter all attendance submissions
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={filteredRecords.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-12">
        <Card className="md:col-span-5">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, student ID, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {attendanceRecords.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Attendance Records</CardTitle>
          <CardDescription>
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading attendance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const date = new Date(record.timestamp)
                    return (
                      <TableRow key={record._id}>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{date.toLocaleDateString()}</div>
                            <div className="text-muted-foreground">{date.toLocaleTimeString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.user?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.user?.student_id || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.class?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.class?.code || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={record.verified ? 
                              'bg-green-100 text-green-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {record.verified ? '✓ Verified' : '⚠ Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(record.confidence || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {Math.round((record.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
