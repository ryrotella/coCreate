'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useBubbleStore } from '@/stores/bubbleStore'

export default function IridescentBackground() {
  const sphereRef = useRef<THREE.Mesh>(null)
  const { environment } = useBubbleStore()

  // Accessible white-to-gray gradient shader
  const shaderMaterial = useMemo(() =>
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: false,
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(environment.skyColor) },
        color2: { value: new THREE.Color(environment.groundColor) },
        color3: { value: new THREE.Color(environment.fogColor) },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;

        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;

        void main() {
          // Vertical gradient from white (top) to gray (bottom)
          float verticalGradient = (normalize(vPosition).y + 1.0) * 0.5;

          // Smooth gradient with slight variation
          float wave = sin(vPosition.x * 0.02 + time * 0.1) * 0.02;
          verticalGradient = clamp(verticalGradient + wave, 0.0, 1.0);

          // Mix from ground color (gray) to sky color (white)
          vec3 color = mix(color2, color1, verticalGradient);

          // Add very subtle brightness variation for depth
          float subtleShimmer = sin(vPosition.y * 0.03 + time * 0.15) * 0.02 + 1.0;
          color *= subtleShimmer;

          // Ensure color stays in accessible range (not too bright, not too dark)
          color = clamp(color, 0.7, 1.0);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }), [environment.skyColor, environment.groundColor, environment.fogColor])

  // Update shader uniforms
  useFrame((state) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.time.value = state.clock.elapsedTime
      shaderMaterial.uniforms.color1.value.set(environment.skyColor)
      shaderMaterial.uniforms.color2.value.set(environment.groundColor)
      shaderMaterial.uniforms.color3.value.set(environment.fogColor)
    }
  })

  return (
    <Sphere ref={sphereRef} args={[50, 64, 64]} position={[0, 0, 0]}>
      <primitive object={shaderMaterial} attach="material" />
    </Sphere>
  )
}
