import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from "react-webcam";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, RefreshCw } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  student_id: z.string().min(1, { message: "Student ID is required" }),
  major: z.string().min(1, { message: "Major is required" }),
});

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function Signup() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState(null);
  const webcamRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImage(null);
  };

  const onSubmit = async (data) => {
    if (!image) {
      toast.error("Please capture a profile photo");
      return;
    }

    setIsLoading(true);
    try {
      // Convert base64 to blob
      const res = await fetch(image);
      const blob = await res.blob();
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });

      await registerAuth({
        ...data,
        file: file,
      });
      toast.success("Account created successfully. Please login.");
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] px-4 py-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create an Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details and capture a photo to register
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="gap-4 md:col-span-2">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
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
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="transition-all duration-300 focus:scale-[1.01]"
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-red-500"
                        >
                          {errors.email.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      {...register("student_id")}
                      className="transition-all duration-300 focus:scale-[1.01]"
                    />
                    <AnimatePresence>
                      {errors.student_id && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-red-500"
                        >
                          {errors.student_id.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      {...register("major")}
                      className="transition-all duration-300 focus:scale-[1.01]"
                    />
                    <AnimatePresence>
                      {errors.major && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-red-500"
                        >
                          {errors.major.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div
                    className="space-y-2 md:col-span-2"
                    variants={itemVariants}
                  >
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className="transition-all duration-300 focus:scale-[1.01]"
                    />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-sm text-red-500"
                        >
                          {errors.password.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <motion.div
                  className="space-y-2 md:col-span-3"
                  variants={itemVariants}
                >
                  <Label>Profile Photo (for Face Recognition)</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 bg-muted/50 w-full">
                    <AnimatePresence mode="wait">
                      {image ? (
                        <motion.div
                          key="captured"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="relative flex flex-col items-center space-y-4 w-full"
                        >
                          <img
                            src={image}
                            alt="Captured"
                            className="rounded-lg w-full h-56 object-fill"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={retake}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" /> Retake
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="webcam"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className="flex flex-col items-center space-y-4 w-full"
                        >
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="rounded-lg w-full h-56 object-fill"
                            videoConstraints={{ facingMode: "user" }}
                          />
                          <Button type="button" onClick={capture}>
                            <Camera className="w-4 h-4 mr-2" /> Capture Photo
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants}>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
