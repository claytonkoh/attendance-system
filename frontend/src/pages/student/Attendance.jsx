import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Camera, CheckCircle, RefreshCw, Eye, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Attendance() {
  const { classId } = useParams()
  const navigate = useNavigate()
  
  // States - Three steps: challenges → capture → success
  const [step, setStep] = useState('challenges') // 'challenges', 'capture', 'success'
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState(null)
  const webcamRef = useRef(null)
  
  // Challenge states
  const [challenges, setChallenges] = useState([])
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [challengesPassed, setChallengesPassed] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState('waiting')
  const [debugMetrics, setDebugMetrics] = useState(null) // NEW: Store metrics
  
  const REQUIRED_PASSES = 3

  // Get challenge icon
  const getChallengeIcon = (challenge) => {
    switch (challenge) {
      case 'BLINK':
        return <Eye className="w-12 h-12" />
      case 'LOOK LEFT':
        return <ArrowLeft className="w-12 h-12" />
      case 'LOOK RIGHT':
        return <ArrowRight className="w-12 h-12" />
      default:
        return <Camera className="w-12 h-12" />
    }
  }

  // Get challenge instruction
  const getChallengeInstruction = (challenge) => {
    switch (challenge) {
      case 'BLINK':
        return 'Close your eyes (EAR < 0.25)'
      case 'LOOK LEFT':
        return 'Turn LEFT (Yaw < -15)'
      case 'LOOK RIGHT':
        return 'Turn RIGHT (Yaw > 15)'
      default:
        return 'Follow the instruction'
    }
  }

  // Initialize challenges on mount
  useEffect(() => {
    initializeChallenges()
  }, [])

  // Initialize challenges
  const initializeChallenges = async () => {
    try {
      const challengeList = []
      for (let i = 0; i < REQUIRED_PASSES; i++) {
        const response = await api.post('/liveness/generate-challenge')
        challengeList.push(response.data.challenge)
      }
      setChallenges(challengeList)
      setCurrentChallengeIndex(0)
      toast.info('Complete 3 liveness challenges to proceed')
    } catch (error) {
      console.error('Error generating challenges:', error)
      toast.error('Failed to initialize challenges')
    }
  }

  const [consecutivePasses, setConsecutivePasses] = useState(0) // Streak counter UI
  const streakRef = useRef(0) // Streak logic tracker (Refs don't suffer stale closures)

  // Verify current challenge
  const verifyChallenge = async () => {
    if (!webcamRef.current) return
    
    setIsVerifying(true)
    
    try {
      const imageSrc = webcamRef.current.getScreenshot()
      const res = await fetch(imageSrc)
      const blob = await res.blob()
      const file = new File([blob], 'challenge.jpg', { type: 'image/jpeg' })
      
      const formData = new FormData()
      formData.append('challenge', challenges[currentChallengeIndex])
      formData.append('file', file)
      
      const response = await api.post('/liveness/verify-challenge', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Store metrics for debug overlay
      if (response.data.metrics) {
        setDebugMetrics(response.data.metrics)
      }
      
      const isPassedFrame = response.data.challenge_passed
      const currentChallenge = challenges[currentChallengeIndex]
      
      if (isPassedFrame) {
        // Condition met
        streakRef.current += 1
        setConsecutivePasses(streakRef.current) // Sync to UI
        
        // Visual feedback
        if (streakRef.current > 1) setChallengeStatus('verifying') 

        // For HEAD TURNS: Pass after holding for 15 checks (~1.5s)
        if (currentChallenge !== 'BLINK' && streakRef.current >= 15) {
             markChallengePassed()
        }
        
      } else {
        // Condition NOT met
        console.log(`❌ Condition failed. Challenge: ${currentChallenge}, Streak was: ${streakRef.current}`)
        
        // For BLINK: Pass ONLY if we had a streak of closed eyes, and NOW they are open (Release)
        if (currentChallenge === 'BLINK' && streakRef.current >= 3) {
             markChallengePassed()
        } else {
             // Reset streak on any other failure
             streakRef.current = 0
             setConsecutivePasses(0)
             if (challengeStatus !== 'passed') setChallengeStatus('waiting')
        }
      }

    } catch (error) {
      console.error('Error verifying challenge:', error)
      streakRef.current = 0
      setConsecutivePasses(0)
      setChallengeStatus('waiting')
    } finally {
      setIsVerifying(false)
    }
  }

  const markChallengePassed = () => {
    setChallengeStatus('passed')
    streakRef.current = 0
    setConsecutivePasses(0)
    toast.success(`✅ Challenge ${currentChallengeIndex + 1}/${REQUIRED_PASSES} passed!`)
    
    setTimeout(() => {
      const newPassed = challengesPassed + 1
      setChallengesPassed(newPassed)
      
      if (newPassed >= REQUIRED_PASSES) {
        setStep('capture')
        toast.success('🎉 All challenges passed! Now capture your photo.')
      } else {
        setCurrentChallengeIndex(currentChallengeIndex + 1)
        setChallengeStatus('waiting')
        streakRef.current = 0
        setConsecutivePasses(0)
      }
    }, 1000)
  }

  // Auto-verify challenges
  useEffect(() => {
    let interval
    // Loop only if we are in challenges step, not currently verifying, and not already passed/processing success
    if (step === 'challenges' && !isVerifying && challenges.length > 0 && challengeStatus !== 'passed') {
      interval = setInterval(() => {
        verifyChallenge()
      }, 100) // Check every 100ms (or as fast as the network loop allows)
    }
    return () => clearInterval(interval)
  }, [step, challengeStatus, isVerifying, currentChallengeIndex, challenges])

  // Capture photo
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot()
    setImage(imageSrc)
  }, [webcamRef])

  const retake = () => {
    setImage(null)
  }

  // Verify and mark attendance
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
      
      const { confidence, liveness_score } = response.data
      toast.success(`✅ Attendance Marked!\nConfidence: ${confidence}\nLiveness: ${liveness_score}`)
      setStep('success')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.detail || "Face Verification Failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {step === 'challenges' && `Liveness Challenge ${currentChallengeIndex + 1}/${REQUIRED_PASSES}`}
            {step === 'capture' && 'Capture Verification Photo'}
            {step === 'success' && 'Attendance Marked'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'challenges' && 'Complete the liveness challenges to proceed'}
            {step === 'capture' && 'All challenges passed! Now take your photo'}
            {step === 'success' && 'Your attendance has been successfully recorded'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center">
          {/* STEP 1: Liveness Challenges */}
          {step === 'challenges' && challenges.length > 0 && (
            <div className="w-full max-w-md space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{challengesPassed}/{REQUIRED_PASSES} completed</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    className="bg-primary h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(challengesPassed / REQUIRED_PASSES) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Live Camera with Challenge Overlay */}
              <div className="relative border-4 rounded-lg overflow-hidden">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full object-contain"
                  videoConstraints={{ facingMode: 'user' }}
                />
                
                {/* Challenge Overlay */}
                <AnimatePresence>
                  <motion.div
                    className={`absolute inset-0 flex flex-col items-center justify-center ${
                      challengeStatus === 'passed' ? 'bg-green-500/20' :
                      challengeStatus === 'failed' ? 'bg-red-500/20' :
                      'bg-black/40'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-white text-center space-y-4 p-6">
                      {getChallengeIcon(challenges[currentChallengeIndex])}
                      <h3 className="text-2xl font-bold">
                        {challenges[currentChallengeIndex]}
                      </h3>
                      <p className="text-lg">
                        {getChallengeInstruction(challenges[currentChallengeIndex])}
                      </p>
                      
                      {challengeStatus === 'verifying' && (
                        <div className="flex flex-col items-center animate-pulse">
                           <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-2" />
                           <p className="text-yellow-400 font-bold text-xl uppercase tracking-wider">
                             {challenges[currentChallengeIndex] === 'BLINK' ? 'Keep Eyes Closed...' : 'Hold Steady...'}
                           </p>
                        </div>
                      )}
                      {challengeStatus === 'passed' && (
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* DEBUG OVERLAY - Shows real-time metrics */}
                <div className="absolute top-2 left-2 bg-black/60 text-white p-2 text-xs rounded font-mono z-50 pointer-events-none">
                  <p className="font-bold text-yellow-400 mb-1">DEBUG MONITOR</p>
                  {isVerifying ? (
                     <p className="text-blue-300">Processing...</p>
                  ) : debugMetrics ? (
                    <div className="space-y-1">
                      <p>Yaw: {debugMetrics.yaw?.toFixed(1)}° {Math.abs(debugMetrics.yaw) > 20 ? '✅' : '❌'}</p>
                      <p>Pitch: {debugMetrics.pitch?.toFixed(1)}° {Math.abs(debugMetrics.pitch) > 45 ? '⚠️' : ''}</p>
                      <p>Roll: {debugMetrics.roll?.toFixed(1)}° {Math.abs(debugMetrics.roll) > 30 ? '⚠️' : ''}</p>
                      <p>EAR: {debugMetrics.ear?.toFixed(3)} {debugMetrics.ear < 0.25 ? '✅' : '❌'}</p>
                      <p>Streak: {consecutivePasses} (Req: {challenges[currentChallengeIndex] === 'BLINK' ? '3+Release' : '15'})</p>
                      <hr className="border-gray-500 my-1"/>
                    </div>
                  ) : (
                    <p className="text-gray-400">Waiting for data...</p>
                  )}
                </div>

              </div>

              {/* Challenge List */}
              <div className="space-y-2">
                {challenges.map((challenge, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index < currentChallengeIndex ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                      index === currentChallengeIndex ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' :
                      'bg-gray-50 dark:bg-gray-800 border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{challenge}</span>
                    {index < currentChallengeIndex && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {index === currentChallengeIndex && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Manual Trigger for Testing */}
              <div className="text-center">
                 <p className="text-xs text-muted-foreground mb-2">If auto-detect checks failing:</p>
                 <Button size="sm" variant="secondary" onClick={verifyChallenge} disabled={isVerifying}>
                   Manual Check
                 </Button>
              </div>

            </div>
          )}

          {/* STEP 2: Capture Photo (After Challenges) */}
          {step === 'capture' && (
            <div className="w-full max-w-md space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  ✅ All liveness challenges passed!
                </p>
              </div>

              <div className="relative border-2 border-dashed rounded-lg p-4 bg-muted/50 min-h-[300px] flex items-center justify-center">
                {image ? (
                  <img src={image} alt="Captured" className="rounded-lg w-full object-contain" />
                ) : (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="rounded-lg w-full object-contain"
                    videoConstraints={{ facingMode: "user" }}
                  />
                )}
              </div>
              
              <div className="flex justify-center space-x-4">
                {image ? (
                  <Button variant="outline" onClick={retake} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Retake
                  </Button>
                ) : (
                  <Button onClick={capture} size="lg" className="w-full">
                    <Camera className="w-5 h-5 mr-2" /> Capture Photo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <CheckCircle className="w-24 h-24 text-green-500" />
              <p className="text-lg font-medium text-green-700">Success!</p>
              <p className="text-sm text-muted-foreground">Your attendance has been recorded</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center space-x-4">
          {step === 'challenges' && (
            <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
              Cancel
            </Button>
          )}
          
          {step === 'capture' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setChallenges([])
                  setChallengesPassed(0)
                  setCurrentChallengeIndex(0)
                  setImage(null)
                  setStep('challenges')
                  initializeChallenges()
                }}
                disabled={isLoading}
              >
                Start Over
              </Button>
              <Button onClick={handleVerifyFace} disabled={!image || isLoading} className="min-w-[200px]">
                {isLoading ? 'Verifying...' : 'Verify & Mark Attendance'}
              </Button>
            </>
          )}
          
          {step === 'success' && (
            <Button onClick={() => navigate('/student/dashboard')} className="min-w-[200px]">
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
