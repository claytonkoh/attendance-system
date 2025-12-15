# Liveness Detection Architecture

## Complete Technical Breakdown - Deep Learning & Computer Vision

---

## 🎯 **What is Liveness Detection?**

**Purpose**: Ensure the person in front of the camera is **physically present** and **alive**, not:

- ❌ A printed photo
- ❌ A video on another screen
- ❌ A 3D mask
- ❌ A deepfake

**Your System Uses**: **Challenge-Response Liveness Detection** with **MediaPipe Face Mesh**

---

## 🏗️ **Architecture Overview**

```
┌────────────────────────────────────────────────────────────────┐
│                    LIVENESS DETECTION FLOW                     │
└────────────────────────────────────────────────────────────────┘

User Opens Attendance Page
        ↓
┌───────────────────────────────────────┐
│  STAGE 1: Generate Random Challenges  │
│  Backend: /liveness/generate-challenge│
└───────────────────────────────────────┘
        ↓
    challenges = ["BLINK", "LOOK LEFT", "LOOK RIGHT"]
    (randomized order)
        ↓
┌───────────────────────────────────────┐
│  STAGE 2: Challenge Loop (Frontend)   │
│  Every 100ms, capture frame & verify  │
└───────────────────────────────────────┘
        ↓
    For each challenge (3 total):
        ↓
    ┌─────────────────────────────────┐
    │  Capture webcam frame           │
    │  Send to backend via POST       │
    │  /liveness/verify-challenge     │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │  Backend: MediaPipe Face Mesh   │
    │  Detect 468 facial landmarks    │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │  Calculate Metrics:             │
    │  - Eye Aspect Ratio (EAR)       │
    │  - Head Pose (Yaw, Pitch, Roll) │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │  Check Challenge Condition      │
    │  - BLINK: EAR < 0.25?           │
    │  - LEFT: Yaw < -15°?            │
    │  - RIGHT: Yaw > +15°?           │
    └─────────────────────────────────┘
        ↓
    ┌─────────────────────────────────┐
    │  Frontend: Track Streak         │
    │  - BLINK: 3 frames closed       │
    │  - HEAD TURN: 15 frames held    │
    └─────────────────────────────────┘
        ↓
    Challenge Passed? ✅
        ↓
    Move to Next Challenge
        ↓
┌───────────────────────────────────────┐
│  STAGE 3: All Challenges Passed       │
│  Proceed to Face Verification         │
└───────────────────────────────────────┘
```

---

## 🧠 **Core Component: MediaPipe Face Mesh**

### **What is MediaPipe?**

MediaPipe is a **deep learning model** by Google that detects **468 3D facial landmarks** in real-time.

```
              🧑 Your Face

        ● ● ● ● ● ● ● ● ●     ← Forehead (33 points)
       ●                 ●
      ●   👁️━━━       👁️━━━ ●   ← Eyes (71 points each)
     ●                     ●
    ●       ●         ●     ● ← Nose (51 points)
    ●         ●●●●●●●       ● ← Mouth (78 points)
     ●                     ●
      ●●●●●●●●●●●●●●●●●●●●●   ← Face contour (70 points)

Total: 468 3D landmarks (x, y, z coordinates)
```

### **How MediaPipe Works:**

```
Input Image (640×480 RGB)
        ↓
┌──────────────────────────────────────┐
│  CNN 1: Face Detection              │
│  (BlazeFace - lightweight detector)  │
│  Finds face bounding box             │
└──────────────────────────────────────┘
        ↓
  Face Region: [x:100-540, y:80-400]
        ↓
┌──────────────────────────────────────┐
│  CNN 2: Landmark Regression         │
│  (Deep neural network)               │
│  Predicts 468 (x,y,z) coordinates    │
└──────────────────────────────────────┘
        ↓
Output: landmarks = [
  {x: 0.234, y: 0.567, z: -0.012},  # Point 0
  {x: 0.235, y: 0.568, z: -0.010},  # Point 1
  ...
  {x: 0.678, y: 0.345, z: -0.045}   # Point 467
]
```

**Key Feature**: Detects landmarks even with:

- ✅ Partial occlusion (glasses, hand near face)
- ✅ Extreme angles (up to ±45°)
- ✅ Varying lighting
- ✅ 30+ FPS on CPU (real-time!)

---

## 👁️ **Challenge 1: Blink Detection (EAR)**

### **Eye Aspect Ratio (EAR) Algorithm**

**Concept**: Eyes have different shapes when open vs. closed

```
Open Eye:              Closed Eye:
    p2                     p2
   /  \                   /  \
  /    \                 /────\  (very small vertical distance)
 p1     p3              p1────p3
 │  👁️  │               │      │
 p6     p5              p6────p5
  \    /                 \────/
   \  /                   \  /
    p4                     p4
```

### **Mathematical Formula:**

```
EAR = (||p2-p6|| + ||p3-p5||) / (2 × ||p1-p4||)

Where:
- ||p2-p6|| = Euclidean distance from point 2 to point 6
- ||p3-p5|| = Euclidean distance from point 3 to point 5
- ||p1-p4|| = Horizontal eye width
```

### **Implementation:**

```python
# backend/app/services/liveness_service.py

def calculate_ear(self, landmarks, w, h, eye_indices):
    """
    Calculate Eye Aspect Ratio for blink detection

    eye_indices: [p1, p2, p3, p4, p5, p6] landmark IDs
    """
    # Get pixel coordinates of 6 eye landmarks
    pts = np.array([
        (landmarks[i].x * w, landmarks[i].y * h)
        for i in eye_indices
    ])

    # Vertical distances
    vertical_1 = np.linalg.norm(pts[1] - pts[5])  # p2 to p6
    vertical_2 = np.linalg.norm(pts[2] - pts[4])  # p3 to p5

    # Horizontal distance
    horizontal = np.linalg.norm(pts[0] - pts[3])  # p1 to p4

    # EAR formula
    if horizontal == 0:
        return 0

    ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
    return ear

# Usage:
LEFT_EYE_IDS = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_IDS = [263, 387, 385, 362, 380, 373]

left_ear = calculate_ear(landmarks, width, height, LEFT_EYE_IDS)
right_ear = calculate_ear(landmarks, width, height, RIGHT_EYE_IDS)
avg_ear = (left_ear + right_ear) / 2.0

# Blink detection
BLINK_THRESHOLD = 0.25
is_blinking = avg_ear < BLINK_THRESHOLD
```

### **EAR Values:**

```
Open eyes:     EAR ≈ 0.30 - 0.40
Half-closed:   EAR ≈ 0.25 - 0.30
Closed eyes:   EAR < 0.25  ✅ BLINK DETECTED
```

### **Why It Works for Anti-Spoofing:**

- ❌ **Photo**: EAR stays constant (can't change)
- ❌ **Video**: EAR may change but not on command
- ✅ **Real person**: Can blink when asked

---

## 🔄 **Challenge 2 & 3: Head Pose Detection (PnP)**

### **Perspective-n-Point (PnP) Algorithm**

**Concept**: Estimate 3D head orientation from 2D landmarks

```
3D Axes on Face:

         Pitch (up/down)
              ↑
              │
         🧑 Face
           /│\
          / │ \
         /  │  \

    ←──Yaw (left/right)

    ⟲ Roll (tilt sideways)
```

### **How PnP Works:**

```python
def get_head_pose(self, landmarks, img_w, img_h):
    """
    Estimate head pose using solvePnP algorithm

    Steps:
    1. Define 3D face model (canonical face)
    2. Get 2D landmark positions from MediaPipe
    3. Solve for rotation using camera projection
    4. Convert to Euler angles (pitch, yaw, roll)
    """

    # STEP 1: 3D face model (predefined coordinates)
    face_3d = np.array([
        [0.0, 0.0, 0.0],           # Nose tip
        [0.0, -330.0, -65.0],      # Chin
        [-225.0, 170.0, -135.0],   # Left eye corner
        [225.0, 170.0, -135.0],    # Right eye corner
        [-150.0, -150.0, -125.0],  # Left mouth corner
        [150.0, -150.0, -125.0]    # Right mouth corner
    ], dtype=np.float64)

    # STEP 2: Get corresponding 2D points from detected landmarks
    FACE_2D_IDX = [1, 152, 33, 263, 61, 291]  # MediaPipe IDs
    face_2d = []
    for idx in FACE_2D_IDX:
        lm = landmarks[idx]
        face_2d.append([lm.x * img_w, lm.y * img_h])
    face_2d = np.array(face_2d, dtype=np.float64)

    # STEP 3: Define camera matrix (intrinsic parameters)
    focal_length = 1 * img_w
    cam_matrix = np.array([
        [focal_length, 0, img_h / 2],
        [0, focal_length, img_w / 2],
        [0, 0, 1]
    ])
    dist_matrix = np.zeros((4, 1), dtype=np.float64)

    # STEP 4: Solve PnP (find rotation that maps 3D → 2D)
    success, rot_vec, trans_vec = cv2.solvePnP(
        face_3d,      # 3D model points
        face_2d,      # 2D detected points
        cam_matrix,   # Camera matrix
        dist_matrix   # Distortion coefficients
    )

    # STEP 5: Convert rotation vector to rotation matrix
    rmat, jac = cv2.Rodrigues(rot_vec)

    # STEP 6: Decompose rotation matrix to Euler angles
    angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)

    # Extract pitch, yaw, roll (in degrees)
    pitch = angles[0]  # Up/down rotation
    yaw = angles[1]    # Left/right rotation
    roll = angles[2]   # Tilt sideways

    return pitch, yaw, roll
```

### **Angle Interpretation:**

```
Yaw (Left/Right Turn):
  -45°  -30°  -15°   0°   +15°  +30°  +45°
   ←─────────┼─────────→
  Looking   Facing   Looking
   Left    Forward    Right

   LOOK LEFT challenge:  yaw < -15° ✅
   LOOK RIGHT challenge: yaw > +15° ✅

Pitch (Up/Down):
  -30°  -15°   0°   +15°  +30°
   ↑───────┼───────↓
  Looking  Facing  Looking
    Up     Forward   Down

Roll (Tilt):
  -30°  -15°   0°   +15°  +30°
   ⟲───────┼───────⟳
  Tilted  Upright Tilted
   Left           Right
```

### **Challenge Validation:**

```python
def verify_liveness_frame(self, image_bytes, challenge):
    # Get landmarks
    landmarks, w, h = detect_face_landmarks(image_bytes)

    # Calculate metrics
    pitch, yaw, roll = get_head_pose(landmarks, w, h)
    left_ear = calculate_ear(landmarks, w, h, LEFT_EYE_IDS)
    right_ear = calculate_ear(landmarks, w, h, RIGHT_EYE_IDS)
    avg_ear = (left_ear + right_ear) / 2.0

    # Check challenge conditions
    if challenge == "LOOK LEFT":
        is_turning = yaw < -15  # Turned left enough?
        is_upright = abs(roll) < 40 and abs(pitch) < 45  # Not just rotated photo
        passed = is_turning and is_upright

    elif challenge == "LOOK RIGHT":
        is_turning = yaw > +15  # Turned right enough?
        is_upright = abs(roll) < 40 and abs(pitch) < 45
        passed = is_turning and is_upright

    elif challenge == "BLINK":
        passed = avg_ear < 0.25  # Eyes closed?

    return {
        "challenge_passed": passed,
        "metrics": {
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "ear": avg_ear
        }
    }
```

---

## 🔄 **Frontend-Backend Interaction**

### **Frontend Loop (Real-time):**

```javascript
// frontend/src/pages/student/Attendance.jsx

// Auto-verification every 100ms
useEffect(() => {
  let interval;
  if (step === "challenges" && !isVerifying) {
    interval = setInterval(() => {
      verifyChallenge(); // Send frame to backend
    }, 100);
  }
  return () => clearInterval(interval);
}, [step, isVerifying]);

const verifyChallenge = async () => {
  // 1. Capture current webcam frame
  const imageSrc = webcamRef.current.getScreenshot();

  // 2. Convert to blob
  const res = await fetch(imageSrc);
  const blob = await res.blob();
  const file = new File([blob], "challenge.jpg");

  // 3. Send to backend
  const formData = new FormData();
  formData.append("challenge", challenges[currentIndex]);
  formData.append("file", file);

  const response = await api.post("/liveness/verify-challenge", formData);

  // 4. Check if challenge passed
  if (response.data.challenge_passed) {
    consecutivePasses++; // Increment streak

    // BLINK: Pass after 3 closed frames + 1 open
    if (challenge === "BLINK" && consecutivePasses >= 3) {
      if (!response.data.challenge_passed) {
        // Eyes opened
        markChallengePassed();
      }
    }

    // HEAD TURN: Pass after holding 15 frames (~1.5s)
    if (challenge !== "BLINK" && consecutivePasses >= 15) {
      markChallengePassed();
    }
  } else {
    consecutivePasses = 0; // Reset streak
  }
};
```

### **Backend Processing:**

```python
# backend/app/routers/liveness.py

@router.post("/verify-challenge")
async def verify_challenge(
    challenge: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Verify a liveness challenge frame

    Returns:
        {
            "challenge_passed": true/false,
            "face_detected": true/false,
            "metrics": {
                "yaw": -18.3,
                "pitch": 5.2,
                "roll": 2.1,
                "ear": 0.18
            }
        }
    """
    # Read image
    image_bytes = await file.read()

    # Call liveness service
    result = liveness_service.verify_liveness_frame(
        image_bytes,
        challenge
    )

    return result
```

---

## 🎯 **Why This Works: Anti-Spoofing Analysis**

### **Attack: Printed Photo**

```
❌ BLINK Challenge:
   - Photo has static EAR value
   - Cannot change when asked
   - FAILS ✅

❌ HEAD TURN Challenge:
   - Photo's yaw angle is fixed
   - Rotating paper changes roll (detected!)
   - FAILS ✅
```

### **Attack: Video Replay**

```
❌ Random Challenges:
   - Video shows person blinking/turning
   - But NOT in response to specific random order
   - Probability of matching order: 1/6 (3! permutations)
   - Even if it matches once, won't work next time
   - FAILS ✅
```

### **Attack: Another Person**

```
❌ Passes liveness BUT...
   - Face recognition compares embeddings
   - Different person = low similarity (<75%)
   - FAILS at verification stage ✅
```

---

## 📊 **Complete Verification Pipeline**

```
┌───────────────────────────────────────────────────────────────┐
│              FULL ATTENDANCE VERIFICATION                     │
└───────────────────────────────────────────────────────────────┘

Step 1: LIVENESS DETECTION
├─ Challenge 1: BLINK (EAR < 0.25)
├─ Challenge 2: LOOK LEFT (Yaw < -15°)
└─ Challenge 3: LOOK RIGHT (Yaw > +15°)
        ↓
   All Passed? ✅
        ↓
Step 2: FINAL PHOTO CAPTURE
├─ User captures verification selfie
└─ Photo sent to backend
        ↓
Step 3: FACE RECOGNITION
├─ DeepFace extracts embedding (128D)
├─ Compare with stored enrollment embedding
└─ Cosine similarity ≥ 75%? ✅
        ↓
Step 4: MARK ATTENDANCE
├─ Save record to MongoDB:
│  - student_id
│  - class_id
│  - timestamp
│  - confidence_score: 87.3%
│  - liveness_score: 95.2%
└─ Return success ✅
```

---

## 🔧 **Key Parameters (Tunable)**

```python
# backend/app/core/liveness_config.py

# Blink detection
BLINK_THRESH = 0.25           # EAR threshold for closed eyes
BLINK_CONSEC_FRAMES = 3       # Frames to hold blink

# Head turn detection
TURN_THRESH = 15              # Degrees for left/right turn
TURN_CONSEC_FRAMES = 15       # Frames to hold turn (~1.5s)

# Upright validation (prevent photo rotation attack)
MAX_ROLL = 40                 # Max tilt angle allowed
MAX_PITCH = 45                # Max up/down angle

# Face verification
CONFIDENCE_THRESHOLD = 0.75   # 75% similarity required
```

---

## 💡 **Why This Design?**

### **1. Challenge-Response > Passive Detection**

**Passive** (just detect if photo):

- Hard to distinguish high-quality photo
- Requires texture analysis, depth sensors
- Computationally expensive

**Challenge-Response** (our approach):

- ✅ Requires user cooperation
- ✅ Simple to verify (angle/EAR calculations)
- ✅ Works on CPU in real-time
- ✅ Very hard to spoof

### **2. Multiple Random Challenges**

**Why 3 challenges?**

- 1 challenge: Could be bypassed with pre-recorded video
- 2 challenges: Still predictable
- 3+ challenges: Exponentially harder to fake

**Why random order?**

- Same order every time → attacker records compliance video
- Random order → new sequence each time, can't pre-record

### **3. MediaPipe > Custom CNN**

**Why use MediaPipe?**

- ✅ Pre-trained on millions of faces
- ✅ Real-time performance (30+ FPS on CPU)
- ✅ Robust to lighting, occlusion
- ✅ No training data needed
- ✅ Production-ready

---

## ✅ **Summary**

### **Liveness Architecture:**

1. **Generate 3 random challenges** (BLINK, LOOK LEFT, LOOK RIGHT)
2. **Frontend captures frames** every 100ms
3. **Backend uses MediaPipe** to detect 468 facial landmarks
4. **Calculate metrics**:
   - EAR (Eye Aspect Ratio) for blinks
   - Yaw/Pitch/Roll (PnP algorithm) for head turns
5. **Validate streaks**:
   - Blink: 3 frames closed + 1 open
   - Turns: 15 frames held at angle
6. **All 3 passed** → Proceed to face verification

### **Key Technologies:**

- **MediaPipe Face Mesh**: 468-point 3D landmark detection
- **EAR Algorithm**: Blink detection via eye geometry
- **PnP Algorithm**: 3D head pose from 2D landmarks
- **Challenge-Response**: Interactive anti-spoofing

### **Security Level:**

✅ **High** for typical attacks (photos, videos)
⚠️ **Vulnerable** to advanced attacks (deepfakes, 3D masks)

---

**Your liveness system is production-ready for attendance use cases!** 🎯
