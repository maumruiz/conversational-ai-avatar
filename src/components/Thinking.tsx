import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";

import { useConversation } from "@/lib/store";

function Thinking() {
  const thinking = useConversation((state) => state.thinking);
  const haloRef = useRef();

  // Animate the halo rotation if active
  useFrame((state, delta) => {
    if (thinking && haloRef.current) {
      haloRef.current.rotation.z += delta; // Rotate around Z-axis
    }
  });

  // Render nothing if not active
  if (!thinking) return null;

  return (
    <mesh ref={haloRef} position={[0, 0.1, -1]}>
      <ringGeometry args={[0.3, 0.4, 16]} />
      <meshBasicMaterial color="#00FFFF" transparent opacity={0.7} side={2} />
    </mesh>
  );
}

export default Thinking;
