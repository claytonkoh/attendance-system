import { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

export function useAuth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const decoded = jwtDecode(token)
        // Ensure we have an id field, backend might send 'sub' or 'id' or '_id'
        // The backend token usually contains 'sub' as the email/username.
        // We might need to fetch the user profile if the token doesn't have the ID.
        // But for now let's assume the token might have what we need or we fetch it.
        // Actually, the backend `create_access_token` usually puts `sub` as the subject.
        
        setUser({
            ...decoded,
            id: decoded.sub // Assuming sub is the ID or unique identifier
        })
      } catch (error) {
        console.error("Invalid token", error)
      }
    }
  }, [])

  return { user }
}
