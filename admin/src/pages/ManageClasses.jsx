import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  schedule: z.string().min(1, "Schedule is required"),
  lecturer_id: z.string().min(1, "Lecturer ID is required"),
});

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function ManageClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(classSchema),
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setValue("lecturer_id", user.id);
    }
  }, [user, setValue]);

  const fetchClasses = async () => {
    try {
      const response = await api.get("/classes/");
      setClasses(response.data);
    } catch (error) {
      console.error("Failed to fetch classes", error);
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.post("/classes/", data);
      toast.success("Class created successfully");
      setIsOpen(false);
      reset();
      fetchClasses();
    } catch (error) {
      console.error("Failed to create class", error);
      toast.error("Failed to create class");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Classes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage classes
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system.
              </DialogDescription>
            </DialogHeader>
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="space-y-2" variants={fieldVariants}>
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Introduction to AI"
                  className="transition-all duration-300 focus:scale-[1.01]"
                />
                <AnimatePresence>
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div className="space-y-2" variants={fieldVariants}>
                <Label htmlFor="code">Class Code</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="CS101"
                  className="transition-all duration-300 focus:scale-[1.01]"
                />
                <AnimatePresence>
                  {errors.code && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.code.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div className="space-y-2" variants={fieldVariants}>
                <Label htmlFor="schedule">Schedule</Label>
                <Input
                  id="schedule"
                  {...register("schedule")}
                  placeholder="Mon 10:00-12:00"
                  className="transition-all duration-300 focus:scale-[1.01]"
                />
                <AnimatePresence>
                  {errors.schedule && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.schedule.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div className="space-y-2" variants={fieldVariants}>
                <Label htmlFor="lecturer_id">Lecturer ID</Label>
                <Input
                  id="lecturer_id"
                  {...register("lecturer_id")}
                  placeholder="Lecturer ID"
                  className="transition-all duration-300 focus:scale-[1.01]"
                />
                <AnimatePresence>
                  {errors.lecturer_id && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.lecturer_id.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
              <DialogFooter>
                <motion.div
                  variants={fieldVariants}
                  className="w-full sm:w-auto"
                >
                  <Button type="submit" className="w-full">
                    Create Class
                  </Button>
                </motion.div>
              </DialogFooter>
            </motion.form>
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
  );
}
