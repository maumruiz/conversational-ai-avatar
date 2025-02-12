"use client";

import { Environment, Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";

import { Avatar } from "./Avatar";
import Thinking from "./Thinking";

function Experience() {
  return (
    <>
      <Loader />
      <Leva hidden />
      {/* <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}> */}
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Environment preset="warehouse" />
        <Thinking />
        <Avatar />
      </Canvas>
    </>
  );
}

export default Experience;
