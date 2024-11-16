import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import { Plane } from '@react-three/drei';

// Plano del suelo
function GroundPlane() {
  const texture = useLoader(TextureLoader, '/placeholder.png');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);

  return (
    <Plane args={[20, 20]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial map={texture} />
    </Plane>
  );
}

//Terreno de Minecraft
function MinecraftWorld() {
  const { scene } = useGLTF('/terreno.glb'); // Reemplaza con la ruta del archivo exportado
  
  return <primitive object={scene} position={[20, -0.7 , -10]} scale={0.5}/>;
}

// Modelo principal
function Model() {
  const { scene, animations } = useGLTF('/steveRigV3_2.glb');
  const modelRef = useRef();
  const mixer = useRef(null);
  const [action, setAction] = useState({});
  const [keysPressed, setKeysPressed] = useState({});
  const [isJumping, setIsJumping] = useState(false);

  useEffect(() => {
    if (animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene);
      const idleAction = mixer.current.clipAction(animations.find(anim => anim.name === 'IDLE'));
      const walkAction = mixer.current.clipAction(animations.find(anim => anim.name === 'Walk'));
      walkAction.setEffectiveTimeScale(1); // Acelera la reproducción
      walkAction.setEffectiveWeight(1); // Establece el peso completo
      walkAction.crossFadeTo(walkAction, 0); // Sin transición

      const jumpAction = mixer.current.clipAction(animations.find(anim => anim.name === 'Jump'));
      setAction({ idle: idleAction, walk: walkAction, jump: jumpAction });

      // Configuración inicial
      idleAction.play();
    }
  }, [animations, scene]);

  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta);

    if (modelRef.current && keysPressed['ArrowRight']) {
      const direction = calculateDirection();
      modelRef.current.rotation.y = direction;
      modelRef.current.position.x += 0.05 * Math.sin(direction); // Movimiento instantáneo
      modelRef.current.position.z += 0.05 * Math.cos(direction);
    }
    if (modelRef.current && keysPressed['ArrowLeft']) {
      const direction = calculateDirection();
      modelRef.current.rotation.y = direction;
      modelRef.current.position.x += 0.05 * Math.sin(direction); // Movimiento instantáneo
      modelRef.current.position.z += 0.05 * Math.cos(direction);
    }
    if (modelRef.current && keysPressed['ArrowUp']) {
      const direction = calculateDirection();
      modelRef.current.rotation.y = direction;
      modelRef.current.position.x += 0.05 * Math.sin(direction); // Movimiento instantáneo
      modelRef.current.position.z += 0.05 * Math.cos(direction);
    }
    if (modelRef.current && keysPressed['ArrowDown']) {
      const direction = calculateDirection();
      modelRef.current.rotation.y = direction;
      modelRef.current.position.x += 0.05 * Math.sin(direction); // Movimiento instantáneo
      modelRef.current.position.z += 0.05 * Math.cos(direction);
    }
    
  });

  const handleKeyDown = (event) => {
    setKeysPressed((prevKeys) => ({ ...prevKeys, [event.key]: true }));
  
    if (action && modelRef.current) {
      const speed = 0.05;
  
      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          if (!isJumping && action.walk) {
            
            action.idle?.stop();
            action.walk?.play();
          }
  
          // Calcular la dirección antes de mover
          const direction = calculateDirection();
          modelRef.current.rotation.y = direction;
  
          // Movimiento en la dirección calculada
          const adjustedSpeed = isJumping ? speed * 1.5 : speed; // Más rápido en el aire
          modelRef.current.position.x += adjustedSpeed * Math.sin(direction);
          modelRef.current.position.z += adjustedSpeed * Math.cos(direction);
          break;
  
        case ' ':
          if (!isJumping && action.jump) {
            setIsJumping(true);
            action.walk?.stop();
            action.idle?.stop();
            action.jump?.reset().play();
  
            // Iniciar salto
            const initialY = modelRef.current.position.y;
            let progress = 0;
            const jumpInterval = setInterval(() => {
              progress += 0.1;
  
              // Movimiento vertical (salto)
              if (progress < 1) {
                modelRef.current.position.y = initialY + Math.sin(Math.PI * progress) * 1; // Curva de salto
              } else {
                clearInterval(jumpInterval);
                modelRef.current.position.y = initialY; // Regresar al suelo
                setIsJumping(false);
                action.jump?.stop();
                action.idle?.play();
              }
  
              // Movimiento horizontal durante el salto
              if (keysPressed['ArrowUp'] || keysPressed['ArrowDown'] || keysPressed['ArrowLeft'] || keysPressed['ArrowRight']) {
                const direction = calculateDirection();
                modelRef.current.rotation.y = direction; // Asegurar rotación
                modelRef.current.position.x += speed * 3 * Math.sin(direction); // Más velocidad en el aire
                modelRef.current.position.z += speed * 3 * Math.cos(direction);
              }
            }, 50);
          }
          break;
  
        default:
          break;
      }
    }
  };

  const handleKeyUp = (event) => {
    setKeysPressed((prevKeys) => ({ ...prevKeys, [event.key]: false }));

    if (action && !isJumping) {
      action.walk.stop();
      action.idle.play();
    }
  };

  const calculateDirection = () => {
    let offset = Math.PI;
    if (keysPressed['ArrowUp']) {
      if (keysPressed['ArrowRight']) {
        offset = Math.PI / 4;
      } else if (keysPressed['ArrowLeft']) {
        offset = -Math.PI / 4;
      }
    } else if (keysPressed['ArrowDown']) {
      if (keysPressed['ArrowRight']) {
        offset = Math.PI * 3 / 4;
      } else if (keysPressed['ArrowLeft']) {
        offset = -Math.PI * 3 / 4;
      } else {
        offset = 0;
      }
    } else if (keysPressed['ArrowRight']) {
      offset = Math.PI / 2;
    } else if (keysPressed['ArrowLeft']) {
      offset = -Math.PI / 2;
    }
    return offset;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed, isJumping]);

  return <primitive ref={modelRef} object={scene} position={[0, 1, 0]} scale={0.5} />;
}

// Aplicación principal
function App() {
  return (
    <Canvas style={{ height: '100vh' }} camera={{ position: [0, 5, 10] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} />
      <MinecraftWorld />
      <Model />
    </Canvas>
  );
}

export default App;
