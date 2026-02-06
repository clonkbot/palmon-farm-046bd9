import { useState, useRef, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  Float,
  Text,
  Sky,
  Cloud,
  ContactShadows,
  MeshWobbleMaterial,
  Html,
  Stars
} from '@react-three/drei'
import * as THREE from 'three'

// Types
interface Palmon {
  id: string
  name: string
  type: 'grass' | 'earth' | 'water' | 'fire'
  color: string
  secondaryColor: string
  task: 'idle' | 'farming' | 'gathering' | 'labor' | null
  position: [number, number, number]
  level: number
  happiness: number
}

interface GameState {
  palmons: Palmon[]
  resources: {
    crops: number
    wood: number
    stone: number
  }
  selectedPalmon: string | null
  wildPalmon: Palmon | null
  showCatchUI: boolean
}

// Palmon templates
const PALMON_TYPES = [
  { name: 'Leafling', type: 'grass' as const, color: '#7CB342', secondaryColor: '#AED581' },
  { name: 'Mudpup', type: 'earth' as const, color: '#8D6E63', secondaryColor: '#BCAAA4' },
  { name: 'Dewdrop', type: 'water' as const, color: '#4FC3F7', secondaryColor: '#81D4FA' },
  { name: 'Embrie', type: 'fire' as const, color: '#FF7043', secondaryColor: '#FFAB91' },
  { name: 'Sproutie', type: 'grass' as const, color: '#66BB6A', secondaryColor: '#A5D6A7' },
  { name: 'Pebblins', type: 'earth' as const, color: '#A1887F', secondaryColor: '#D7CCC8' },
]

// Generate random palmon
const generateWildPalmon = (): Palmon => {
  const template = PALMON_TYPES[Math.floor(Math.random() * PALMON_TYPES.length)]
  return {
    id: `wild-${Date.now()}`,
    name: template.name,
    type: template.type,
    color: template.color,
    secondaryColor: template.secondaryColor,
    task: null,
    position: [Math.random() * 6 - 3, 0, Math.random() * 6 - 3],
    level: Math.floor(Math.random() * 5) + 1,
    happiness: 100
  }
}

// 3D Palmon Component
function Palmon3D({ palmon, onClick, isSelected }: {
  palmon: Palmon,
  onClick?: () => void,
  isSelected?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      // Idle bounce animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + palmon.id.length) * 0.1

      // Task-specific animations
      if (palmon.task === 'farming') {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.3
      } else if (palmon.task === 'gathering') {
        groupRef.current.position.x = palmon.position[0] + Math.sin(state.clock.elapsedTime) * 0.5
      } else if (palmon.task === 'labor') {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.1
      }
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group
        ref={groupRef}
        position={palmon.position}
        onClick={(e) => { e.stopPropagation(); onClick?.() }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.6, 0.8, 32]} />
            <meshBasicMaterial color="#E8B84A" transparent opacity={0.8} />
          </mesh>
        )}

        {/* Body */}
        <mesh ref={bodyRef} castShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <MeshWobbleMaterial
            color={palmon.color}
            factor={hovered ? 0.4 : 0.1}
            speed={2}
          />
        </mesh>

        {/* Belly */}
        <mesh position={[0, -0.1, 0.3]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={palmon.secondaryColor} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.15, 0.15, 0.4]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.15, 0.15, 0.4]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.15, 0.15, 0.48]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.15, 0.15, 0.48]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Ears/Features based on type */}
        {palmon.type === 'grass' && (
          <>
            <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.15, 0.4, 8]} />
              <meshStandardMaterial color="#4CAF50" />
            </mesh>
            <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.15, 0.4, 8]} />
              <meshStandardMaterial color="#4CAF50" />
            </mesh>
          </>
        )}
        {palmon.type === 'earth' && (
          <>
            <mesh position={[-0.35, 0.35, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color="#795548" />
            </mesh>
            <mesh position={[0.35, 0.35, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshStandardMaterial color="#795548" />
            </mesh>
          </>
        )}
        {palmon.type === 'water' && (
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color="#29B6F6" transparent opacity={0.8} />
          </mesh>
        )}
        {palmon.type === 'fire' && (
          <mesh position={[0, 0.6, 0]}>
            <coneGeometry args={[0.2, 0.4, 8]} />
            <meshStandardMaterial color="#FF5722" emissive="#FF5722" emissiveIntensity={0.5} />
          </mesh>
        )}

        {/* Task indicator */}
        {palmon.task && (
          <Html position={[0, 1, 0]} center>
            <div className="bg-[#3D2B1F]/90 text-[#F5ECD7] px-2 py-1 rounded-full text-xs font-quicksand whitespace-nowrap">
              {palmon.task === 'farming' && '🌾 Farming'}
              {palmon.task === 'gathering' && '🌲 Gathering'}
              {palmon.task === 'labor' && '⛏️ Mining'}
            </div>
          </Html>
        )}

        {/* Hover name */}
        {hovered && (
          <Text
            position={[0, 0.9, 0]}
            fontSize={0.2}
            color="#3D2B1F"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Quicksand-Bold.ttf"
          >
            {palmon.name} Lv.{palmon.level}
          </Text>
        )}
      </group>
    </Float>
  )
}

// Wild Palmon that can be caught
function WildPalmon({ palmon, onCatch }: { palmon: Palmon, onCatch: () => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const [shaking, setShaking] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.5
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5

      if (shaking) {
        groupRef.current.position.x = palmon.position[0] + Math.sin(state.clock.elapsedTime * 30) * 0.1
      }
    }
  })

  const handleClick = () => {
    setShaking(true)
    setTimeout(() => {
      setShaking(false)
      onCatch()
    }, 1000)
  }

  return (
    <group ref={groupRef} position={palmon.position} onClick={handleClick}>
      {/* Glowing ring */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial color="#E8B84A" transparent opacity={0.5} />
      </mesh>

      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.5, 16, 16]} />
        <MeshWobbleMaterial color={palmon.color} factor={0.3} speed={3} />
      </mesh>

      {/* Belly */}
      <mesh position={[0, -0.1, 0.3]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={palmon.secondaryColor} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.48]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.48]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Wild indicator */}
      <Html position={[0, 1.2, 0]} center>
        <div className="animate-bounce bg-[#C4724D] text-white px-3 py-1 rounded-full text-sm font-quicksand font-bold shadow-lg">
          Wild! Tap to catch!
        </div>
      </Html>
    </group>
  )
}

// Farm Plot
function FarmPlot({ position, hasCrop }: { position: [number, number, number], hasCrop: boolean }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.8, 1.8]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {hasCrop && (
        <>
          <mesh position={[-0.4, 0.3, -0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6]} />
            <meshStandardMaterial color="#8BC34A" />
          </mesh>
          <mesh position={[-0.4, 0.5, -0.4]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#FFEB3B" />
          </mesh>
          <mesh position={[0.4, 0.25, 0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5]} />
            <meshStandardMaterial color="#8BC34A" />
          </mesh>
          <mesh position={[0.4, 0.45, 0.3]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FF9800" />
          </mesh>
        </>
      )}
    </group>
  )
}

// Tree
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 8]} />
        <meshStandardMaterial color="#2E7D32" />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshStandardMaterial color="#388E3C" />
      </mesh>
    </group>
  )
}

// Rock
function Rock({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.4]} />
      <meshStandardMaterial color="#757575" roughness={0.8} />
    </mesh>
  )
}

// Ground
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[15, 64]} />
      <meshStandardMaterial color="#7CB342" />
    </mesh>
  )
}

// Main Scene
function Scene({ gameState, setGameState }: {
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
}) {
  const handlePalmonClick = (id: string) => {
    setGameState(prev => ({
      ...prev,
      selectedPalmon: prev.selectedPalmon === id ? null : id
    }))
  }

  const handleCatchWild = () => {
    if (gameState.wildPalmon) {
      const newPalmon: Palmon = {
        ...gameState.wildPalmon,
        id: `caught-${Date.now()}`,
        task: 'idle',
        position: [Math.random() * 4 - 2, 0, Math.random() * 4 - 2]
      }
      setGameState(prev => ({
        ...prev,
        palmons: [...prev.palmons, newPalmon],
        wildPalmon: null,
        showCatchUI: true
      }))
      setTimeout(() => {
        setGameState(prev => ({ ...prev, showCatchUI: false }))
      }, 2000)
    }
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#FFE0B2" />

      {/* Sky and atmosphere */}
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
      <Stars radius={100} depth={50} count={1000} factor={4} fade speed={1} />
      <Cloud position={[-8, 8, -10]} speed={0.2} opacity={0.5} />
      <Cloud position={[10, 10, -5]} speed={0.1} opacity={0.3} />

      {/* Environment */}
      <Environment preset="forest" />

      {/* Ground */}
      <Ground />

      {/* Contact shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={20}
        blur={2}
        far={10}
      />

      {/* Farm plots */}
      <FarmPlot position={[-4, 0.01, -3]} hasCrop={gameState.resources.crops > 0} />
      <FarmPlot position={[-4, 0.01, -1]} hasCrop={gameState.resources.crops > 2} />
      <FarmPlot position={[-4, 0.01, 1]} hasCrop={false} />

      {/* Trees */}
      <Tree position={[5, 0, -4]} />
      <Tree position={[6, 0, -2]} />
      <Tree position={[4.5, 0, 0]} />
      <Tree position={[6, 0, 2]} />
      <Tree position={[5, 0, 4]} />

      {/* Rocks */}
      <Rock position={[-6, 0.3, 4]} scale={1.2} />
      <Rock position={[-5, 0.2, 5]} scale={0.8} />
      <Rock position={[-7, 0.25, 3]} scale={1} />

      {/* Palmons */}
      {gameState.palmons.map(palmon => (
        <Palmon3D
          key={palmon.id}
          palmon={palmon}
          onClick={() => handlePalmonClick(palmon.id)}
          isSelected={gameState.selectedPalmon === palmon.id}
        />
      ))}

      {/* Wild Palmon */}
      {gameState.wildPalmon && (
        <WildPalmon palmon={gameState.wildPalmon} onCatch={handleCatchWild} />
      )}

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  )
}

// UI Components
function PalmonCard({ palmon, isSelected, onClick }: {
  palmon: Palmon,
  isSelected: boolean,
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-3 rounded-xl transition-all duration-300 text-left
        ${isSelected
          ? 'bg-[#E8B84A]/30 border-2 border-[#E8B84A] shadow-lg scale-105'
          : 'bg-[#F5ECD7]/60 border-2 border-transparent hover:bg-[#F5ECD7]/80'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
          style={{ backgroundColor: palmon.color }}
        >
          {palmon.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-crimson text-[#3D2B1F] font-semibold truncate">{palmon.name}</p>
          <p className="text-xs text-[#3D2B1F]/60 font-quicksand">Lv.{palmon.level} • {palmon.type}</p>
        </div>
        {palmon.task && palmon.task !== 'idle' && (
          <span className="text-lg">
            {palmon.task === 'farming' && '🌾'}
            {palmon.task === 'gathering' && '🌲'}
            {palmon.task === 'labor' && '⛏️'}
          </span>
        )}
      </div>
    </button>
  )
}

function TaskButton({
  task,
  icon,
  label,
  isActive,
  onClick
}: {
  task: string
  icon: string
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 min-w-[80px] py-3 px-2 rounded-xl font-quicksand font-bold text-sm transition-all duration-300
        ${isActive
          ? 'bg-[#2D5A3D] text-white shadow-lg scale-105'
          : 'bg-[#F5ECD7]/80 text-[#3D2B1F] hover:bg-[#F5ECD7] hover:scale-102'
        }
      `}
    >
      <span className="text-xl block mb-1">{icon}</span>
      {label}
    </button>
  )
}

// Main App
export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    palmons: [
      {
        id: 'starter-1',
        name: 'Leafling',
        type: 'grass',
        color: '#7CB342',
        secondaryColor: '#AED581',
        task: 'farming',
        position: [-3, 0, -2],
        level: 3,
        happiness: 85
      },
      {
        id: 'starter-2',
        name: 'Mudpup',
        type: 'earth',
        color: '#8D6E63',
        secondaryColor: '#BCAAA4',
        task: 'labor',
        position: [-5, 0, 4],
        level: 2,
        happiness: 90
      }
    ],
    resources: {
      crops: 5,
      wood: 12,
      stone: 8
    },
    selectedPalmon: null,
    wildPalmon: null,
    showCatchUI: false
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Spawn wild palmon periodically
  useEffect(() => {
    const spawnWild = () => {
      if (!gameState.wildPalmon) {
        setGameState(prev => ({
          ...prev,
          wildPalmon: generateWildPalmon()
        }))
      }
    }

    const interval = setInterval(spawnWild, 8000)
    spawnWild() // Spawn one immediately

    return () => clearInterval(interval)
  }, [gameState.wildPalmon])

  // Resource generation based on working palmons
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        const farmingCount = prev.palmons.filter(p => p.task === 'farming').length
        const gatheringCount = prev.palmons.filter(p => p.task === 'gathering').length
        const laborCount = prev.palmons.filter(p => p.task === 'labor').length

        return {
          ...prev,
          resources: {
            crops: prev.resources.crops + farmingCount,
            wood: prev.resources.wood + gatheringCount,
            stone: prev.resources.stone + laborCount
          }
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const assignTask = (task: 'idle' | 'farming' | 'gathering' | 'labor') => {
    if (!gameState.selectedPalmon) return

    setGameState(prev => ({
      ...prev,
      palmons: prev.palmons.map(p => {
        if (p.id === prev.selectedPalmon) {
          // Move to appropriate area
          let newPosition: [number, number, number] = p.position
          if (task === 'farming') newPosition = [-4 + Math.random(), 0, -2 + Math.random() * 2]
          if (task === 'gathering') newPosition = [5 + Math.random(), 0, -2 + Math.random() * 4]
          if (task === 'labor') newPosition = [-6 + Math.random(), 0, 3.5 + Math.random()]
          if (task === 'idle') newPosition = [Math.random() * 2 - 1, 0, Math.random() * 2 - 1]

          return { ...p, task, position: newPosition }
        }
        return p
      })
    }))
  }

  const selectedPalmonData = gameState.palmons.find(p => p.id === gameState.selectedPalmon)

  return (
    <div className="w-screen h-dvh bg-[#2D5A3D] overflow-hidden relative font-quicksand">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [8, 8, 8], fov: 50 }}
        className="touch-none"
      >
        <Suspense fallback={null}>
          <Scene gameState={gameState} setGameState={setGameState} />
        </Suspense>
      </Canvas>

      {/* Catch Success Animation */}
      {gameState.showCatchUI && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-[#3D2B1F]/95 text-[#F5ECD7] px-8 py-6 rounded-2xl animate-bounce shadow-2xl">
            <p className="text-2xl font-crimson font-bold text-center">🎉 Caught!</p>
            <p className="text-sm opacity-80 mt-1">New Palmon joined your team!</p>
          </div>
        </div>
      )}

      {/* Top HUD - Resources */}
      <div className="absolute top-4 left-4 right-4 md:right-auto flex gap-2 md:gap-3 z-10">
        <div className="bg-[#3D2B1F]/90 backdrop-blur-sm rounded-xl px-3 py-2 md:px-4 md:py-2 flex items-center gap-2 shadow-lg border border-[#E8B84A]/20">
          <span className="text-lg md:text-xl">🌾</span>
          <span className="text-[#F5ECD7] font-bold text-sm md:text-base">{gameState.resources.crops}</span>
        </div>
        <div className="bg-[#3D2B1F]/90 backdrop-blur-sm rounded-xl px-3 py-2 md:px-4 md:py-2 flex items-center gap-2 shadow-lg border border-[#E8B84A]/20">
          <span className="text-lg md:text-xl">🪵</span>
          <span className="text-[#F5ECD7] font-bold text-sm md:text-base">{gameState.resources.wood}</span>
        </div>
        <div className="bg-[#3D2B1F]/90 backdrop-blur-sm rounded-xl px-3 py-2 md:px-4 md:py-2 flex items-center gap-2 shadow-lg border border-[#E8B84A]/20">
          <span className="text-lg md:text-xl">🪨</span>
          <span className="text-[#F5ECD7] font-bold text-sm md:text-base">{gameState.resources.stone}</span>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-4 right-4 hidden md:block z-10">
        <h1 className="font-crimson text-2xl text-[#F5ECD7] drop-shadow-lg">
          Palmon Farm
        </h1>
        <p className="text-[#F5ECD7]/70 text-xs">Catch • Train • Harvest</p>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden absolute bottom-20 right-4 z-20 bg-[#3D2B1F]/90 backdrop-blur-sm p-4 rounded-full shadow-lg border border-[#E8B84A]/30"
      >
        <span className="text-2xl">{mobileMenuOpen ? '✕' : '📋'}</span>
      </button>

      {/* Side Panel - Palmon List & Tasks */}
      <div className={`
        absolute z-10 transition-all duration-300 ease-out
        md:right-4 md:top-20 md:bottom-auto md:w-72 md:translate-x-0 md:opacity-100
        ${mobileMenuOpen
          ? 'bottom-0 left-0 right-0 translate-y-0 opacity-100'
          : 'bottom-0 left-0 right-0 translate-y-full opacity-0 md:translate-y-0 md:opacity-100'
        }
      `}>
        <div className="bg-[#3D2B1F]/95 backdrop-blur-md rounded-t-3xl md:rounded-2xl shadow-2xl border border-[#E8B84A]/20 overflow-hidden max-h-[70vh] md:max-h-[60vh]">
          {/* Panel Header */}
          <div className="bg-gradient-to-r from-[#2D5A3D] to-[#4CAF50] p-4">
            <h2 className="font-crimson text-xl text-[#F5ECD7] font-bold flex items-center gap-2">
              <span>🎒</span> My Palmons
              <span className="ml-auto bg-[#E8B84A] text-[#3D2B1F] text-sm px-2 py-0.5 rounded-full">
                {gameState.palmons.length}
              </span>
            </h2>
          </div>

          {/* Palmon List */}
          <div className="p-3 space-y-2 max-h-48 md:max-h-60 overflow-y-auto custom-scrollbar">
            {gameState.palmons.map(palmon => (
              <PalmonCard
                key={palmon.id}
                palmon={palmon}
                isSelected={gameState.selectedPalmon === palmon.id}
                onClick={() => setGameState(prev => ({
                  ...prev,
                  selectedPalmon: prev.selectedPalmon === palmon.id ? null : palmon.id
                }))}
              />
            ))}
          </div>

          {/* Task Assignment */}
          {selectedPalmonData && (
            <div className="border-t border-[#E8B84A]/20 p-4">
              <p className="text-[#F5ECD7]/70 text-sm mb-3 font-quicksand">
                Assign <span className="text-[#E8B84A] font-bold">{selectedPalmonData.name}</span> to:
              </p>
              <div className="flex gap-2 flex-wrap">
                <TaskButton
                  task="farming"
                  icon="🌾"
                  label="Farm"
                  isActive={selectedPalmonData.task === 'farming'}
                  onClick={() => assignTask('farming')}
                />
                <TaskButton
                  task="gathering"
                  icon="🌲"
                  label="Gather"
                  isActive={selectedPalmonData.task === 'gathering'}
                  onClick={() => assignTask('gathering')}
                />
                <TaskButton
                  task="labor"
                  icon="⛏️"
                  label="Mine"
                  isActive={selectedPalmonData.task === 'labor'}
                  onClick={() => assignTask('labor')}
                />
                <TaskButton
                  task="idle"
                  icon="💤"
                  label="Rest"
                  isActive={selectedPalmonData.task === 'idle'}
                  onClick={() => assignTask('idle')}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Tips */}
      <div className="absolute bottom-4 left-4 hidden md:block z-10">
        <div className="bg-[#3D2B1F]/80 backdrop-blur-sm rounded-xl px-4 py-3 max-w-xs border border-[#E8B84A]/20">
          <p className="text-[#F5ECD7]/90 text-xs font-quicksand">
            💡 <span className="text-[#E8B84A]">Tip:</span> Click on wild Palmons to catch them!
            Assign your Palmons to tasks to gather resources.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
        <p className="text-[#F5ECD7]/40 text-xs font-quicksand">
          Requested by <span className="text-[#E8B84A]/60">@CryptoTekniker</span> · Built by <span className="text-[#E8B84A]/60">@clonkbot</span>
        </p>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(245, 236, 215, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(232, 184, 74, 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(232, 184, 74, 0.6);
        }
      `}</style>
    </div>
  )
}
