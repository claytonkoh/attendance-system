import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Camera, CheckCircle, RefreshCw } from 'lucide-react'

export default function Attendance() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Selfie, 2: Success
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState(null)
  const webcamRef = useRef(null)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot()
    setImage(imageSrc)
  }, [webcamRef])

  const retake = () => {
    setImage(null)
  }

  const handleVerifyFace = async () => {
    if (!image) return
    setIsLoading(true)
    try {
      const res = await fetch(image)
      const blob = await res.blob()
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" })
      const formData = new FormData()
      formData.append('file', file)
      formData.append('class_id', classId)

      const response = await api.post('/attendance/verify-face', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success("Attendance Marked Successfully!")
      setStep(2)
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.detail || "Face Verification Failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {step === 1 && "Face Verification"}
            {step === 2 && "Attendance Marked"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 1 && "Please take a selfie to verify your identity and mark attendance."}
            {step === 2 && "You have successfully marked your attendance for this class."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {step === 1 && (
            <div className="w-full max-w-md space-y-4">
              <div className="relative border-2 border-dashed rounded-lg p-4 bg-muted/50 min-h-[300px] flex items-center justify-center">
                {image ? (
                  <img src={image} alt="Captured" className="rounded-lg w-full object-contain" />
                ) : (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg w-full object-contain"
                    videoConstraints={{ 
                        facingMode: "user"  // Always use front camera for selfie
                    }}
                  />
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                {image ? (
                  <Button variant="outline" onClick={retake} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                ) : (
                  <Button onClick={capture}>
                    <Camera className="w-4 h-4 mr-2" /> Capture
                  </Button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <CheckCircle className="w-24 h-24 text-green-500" />
              <p className="text-lg font-medium text-green-700">Success!</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {step === 1 && (
            <Button onClick={handleVerifyFace} disabled={!image || isLoading} className="w-full max-w-xs">
              {isLoading ? "Verifying..." : "Verify & Mark Attendance"}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => navigate('/student/dashboard')} className="w-full max-w-xs">
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
