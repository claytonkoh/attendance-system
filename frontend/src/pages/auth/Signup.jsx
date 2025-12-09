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
import { Camera, RefreshCw, CheckCircle2 } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  student_id: z.string().min(1, { message: "Student ID is required" }),
  major: z.string().min(1, { message: "Major is required" }),
});

const REQUIRED_SAMPLES = 5;

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

const flashVariants = {
  initial: { opacity: 0 },
  flash: {
    opacity: [0, 1, 0],
    transition: { duration: 0.3 },
  },
};

export default function Signup() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [showFlash, setShowFlash] = useState(false);
  const webcamRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const capture = useCallback(() => {
    if (capturedImages.length >= REQUIRED_SAMPLES) {
      toast.error(`Maximum ${REQUIRED_SAMPLES} samples already captured`);
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImages((prev) => [...prev, imageSrc]);

      // Flash effect
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);

      toast.success(
        `✅ Sample ${capturedImages.length + 1}/${REQUIRED_SAMPLES} captured!`
      );
    }
  }, [capturedImages.length]);

  const retake = (index) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Sample removed. Please capture again.");
  };

  const clearAll = () => {
    setCapturedImages([]);
    toast.info("All samples cleared");
  };

  const onSubmit = async (data) => {
    if (capturedImages.length !== REQUIRED_SAMPLES) {
      toast.error(
        `Please capture exactly ${REQUIRED_SAMPLES} face samples for enrollment`
      );
      return;
    }

    setIsLoading(true);
    try {
      // Convert all base64 images to files
      const files = await Promise.all(
        capturedImages.map(async (image, index) => {
          const res = await fetch(image);
          const blob = await res.blob();
          return new File([blob], `sample_${index + 1}.jpg`, {
            type: "image/jpeg",
          });
        })
      );

      // Create FormData with all 5 samples
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("student_id", data.student_id);
      formData.append("major", data.major);

      // Append all 5 files
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Call API directly instead of using registerAuth
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Registration failed");
      }

      toast.success(
        "✨ Account created successfully with 5 samples! Please login."
      );
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed. Please try again.");
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
        className="w-full max-w-4xl"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Create an Account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your details and capture {REQUIRED_SAMPLES} face samples for
              enrollment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-9">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                {/* Left Column: Form Fields */}
                <div className="space-y-4 md:col-span-2">
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className={`transition-all duration-300 ${
                        errors.name
                          ? "border-red-500 animate-shake"
                          : "focus:scale-[1.01]"
                      }`}
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
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
                      className={`transition-all duration-300 ${
                        errors.email
                          ? "border-red-500 animate-shake"
                          : "focus:scale-[1.01]"
                      }`}
                    />
                    <AnimatePresence>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
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
                      className={`transition-all duration-300 ${
                        errors.student_id
                          ? "border-red-500 animate-shake"
                          : "focus:scale-[1.01]"
                      }`}
                    />
                    <AnimatePresence>
                      {errors.student_id && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
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
                      className={`transition-all duration-300 ${
                        errors.major
                          ? "border-red-500 animate-shake"
                          : "focus:scale-[1.01]"
                      }`}
                    />
                    <AnimatePresence>
                      {errors.major && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm text-red-500"
                        >
                          {errors.major.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div className="space-y-2" variants={itemVariants}>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      className={`transition-all duration-300 ${
                        errors.password
                          ? "border-red-500 animate-shake"
                          : "focus:scale-[1.01]"
                      }`}
                    />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-sm text-red-500"
                        >
                          {errors.password.message}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Right Column: Enrollment Section */}
                <motion.div
                  className="space-y-3 md:col-span-3"
                  variants={itemVariants}
                >
                  <div className="flex items-center justify-between h-9">
                    <Label className="text-base font-semibold">
                      Face Enrollment ({capturedImages.length}/
                      {REQUIRED_SAMPLES})
                    </Label>
                    {capturedImages.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAll}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (capturedImages.length / REQUIRED_SAMPLES) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Webcam Section */}
                  <div className="border-2 border-dashed rounded-lg p-3 bg-muted/50">
                    <div className="relative">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="rounded-lg w-full max-h-60 object-fill"
                        videoConstraints={{ facingMode: "user" }}
                      />

                      {/* Flash Effect */}
                      <AnimatePresence>
                        {showFlash && (
                          <motion.div
                            variants={flashVariants}
                            initial="initial"
                            animate="flash"
                            className="absolute inset-0 bg-white rounded-lg pointer-events-none"
                          />
                        )}
                      </AnimatePresence>

                      {/* Sample Counter Overlay */}
                      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {capturedImages.length}/{REQUIRED_SAMPLES}
                      </div>
                    </div>

                    {/* Capture Button */}
                    <div className="mt-3 flex justify-center">
                      <Button
                        type="button"
                        onClick={capture}
                        disabled={capturedImages.length >= REQUIRED_SAMPLES}
                        className="w-full"
                        size="sm"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {capturedImages.length >= REQUIRED_SAMPLES
                          ? "All Captured"
                          : `Capture ${capturedImages.length + 1}`}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Captured Samples Grid - Below both columns */}
              {capturedImages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-5 gap-2"
                >
                  {capturedImages.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={img}
                        alt={`Sample ${index + 1}`}
                        className="w-full h-20 object-fill rounded border-2 border-primary"
                      />
                      <div className="absolute top-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => retake(index)}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}

                  {/* Empty Slots */}
                  {[...Array(REQUIRED_SAMPLES - capturedImages.length)].map(
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400"
                      >
                        {capturedImages.length + index + 1}
                      </div>
                    )
                  )}
                </motion.div>
              )}

              {/* Success Message */}
              {capturedImages.length === REQUIRED_SAMPLES && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold"
                >
                  <CheckCircle2 className="w-5 h-5" />✨ All samples captured!
                  Ready to enroll.
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading || capturedImages.length !== REQUIRED_SAMPLES
                  }
                >
                  {isLoading
                    ? "Creating Account..."
                    : capturedImages.length === REQUIRED_SAMPLES
                    ? "Complete Enrollment"
                    : `Capture ${
                        REQUIRED_SAMPLES - capturedImages.length
                      } more sample(s)`}
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
