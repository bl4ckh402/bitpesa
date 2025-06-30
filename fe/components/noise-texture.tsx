"use client"

import { useEffect, useState } from "react"

interface NoiseTextureProps {
  opacity?: number;
}

export function NoiseTexture({ opacity = 0.03 }: NoiseTextureProps) {
  const [noiseUrl, setNoiseUrl] = useState<string | null>(null)
  
  useEffect(() => {
    // Create noise texture on client-side
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Fill with black
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, 100, 100)
    
    // Add noise
    const imageData = ctx.getImageData(0, 0, 100, 100)
    const data = imageData.data
    
    for (let i = 0; i < data.length; i += 4) {
      // Random noise value between 0 and 100
      const noise = Math.floor(Math.random() * 60)
      
      // Set RGB values to the same value for grayscale noise
      data[i] = data[i + 1] = data[i + 2] = noise
      
      // Keep the alpha channel fully opaque
      data[i + 3] = 255
    }
    
    ctx.putImageData(imageData, 0, 0)
    
    // Export the canvas as a data URL
    const dataURL = canvas.toDataURL('image/png')
    setNoiseUrl(dataURL)
  }, [])
  
  if (!noiseUrl) return null
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none -z-10" 
      style={{ 
        backgroundImage: `url(${noiseUrl})`,
        backgroundRepeat: 'repeat',
        opacity: opacity
      }}
    />
  )
}