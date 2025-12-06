import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import api from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  schedule: z.string().min(1, "Schedule is required"),
  lecturer_id: z.string().min(1, "Lecturer ID is required"),
})

export default function ManageClasses() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(classSchema)
  })

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    if (user?.id) {
        setValue('lecturer_id', user.id)
    }
  }, [user, setValue])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/')
      setClasses(response.data)
    } catch (error) {
      console.error("Failed to fetch classes", error)
    }
  }

  const onSubmit = async (data) => {
    try {
      await api.post('/classes/', data)
      toast.success("Class created successfully")
      setIsOpen(false)
      reset()
      fetchClasses()
    } catch (error) {
      console.error("Failed to create class", error)
      toast.error("Failed to create class")
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Manage Classes</h1>
            <p className="text-muted-foreground mt-1">Create and manage classes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-gray-100 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input id="name" {...register("name")} placeholder="Introduction to AI" />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Class Code</Label>
                <Input id="code" {...register("code")} placeholder="CS101" />
                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input id="schedule" {...register("schedule")} placeholder="Mon 10:00-12:00" />
                {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecturer_id">Lecturer ID</Label>
                <Input id="lecturer_id" {...register("lecturer_id")} placeholder="Lecturer ID" disabled className="bg-gray-100" />
                {errors.lecturer_id && <p className="text-sm text-red-500">{errors.lecturer_id.message}</p>}
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">Create Class</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>List of all active classes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Lecturer ID</TableHead>
                <TableHead>Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => (
                <TableRow key={cls._id}>
                  <TableCell className="font-medium">{cls.code}</TableCell>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{cls.schedule}</TableCell>
                  <TableCell>{cls.lecturer_id}</TableCell>
                  <TableCell>{cls.enrolled_student_ids?.length || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
