"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createAvatar, disposeObject } from "./model";
import type { AvatarAppearance } from "@/types";

export default function AvatarView({
  appearance,
  name,
}: {
  appearance: AvatarAppearance;
  name: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rotateRef = useRef<(amount: number) => void>(() => {});
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Serialized appearance keeps the WebGL scene stable on unrelated UI changes.
  const appearanceKey = JSON.stringify(appearance);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    setReady(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 60);
    camera.position.set(0, 2.9, 7.5);
    camera.lookAt(0, 1.72, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xa9a0c1, 2.5));
    const key = new THREE.DirectionalLight(0xfff6e6, 3.3);
    key.position.set(-3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -2;
    key.shadow.normalBias = 0.03;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc4b6ff, 2);
    fill.position.set(3, 3, -3);
    scene.add(fill);
    const model = createAvatar(JSON.parse(appearanceKey) as AvatarAppearance);
    model.group.rotation.y = -0.25;
    scene.add(model.group);
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.16, 1.23, 0.13, 48),
      new THREE.MeshStandardMaterial({ color: "#d1c5ef", roughness: 0.9 }),
    );
    plinth.position.y = 0.015;
    plinth.receiveShadow = true;
    scene.add(plinth);
    let frame = 0,
      disposed = false,
      visible = true,
      targetAngle = -0.25,
      dragX: number | null = null;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const render = () => {
      if (!disposed) renderer.render(scene, camera);
    };
    function resize() {
      const { width, height } = host!.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(host);
    rotateRef.current = (amount) => {
      targetAngle += amount;
      model.group.rotation.y = targetAngle;
      render();
    };
    const down = (event: PointerEvent) => {
      dragX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (dragX === null) return;
      targetAngle += (event.clientX - dragX) * 0.012;
      dragX = event.clientX;
      model.group.rotation.y = targetAngle;
      render();
    };
    const up = () => {
      dragX = null;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("webglcontextlost", lost);
    function animate(time: number) {
      if (disposed) return;
      if (visible && !document.hidden && !motion.matches) {
        model.group.position.y = Math.sin(time * 0.0018) * 0.025;
        model.arms[0].rotation.z = -0.055 + Math.sin(time * 0.0015) * 0.025;
        model.arms[1].rotation.z = 0.055 - Math.sin(time * 0.0015) * 0.025;
        render();
      }
      frame = requestAnimationFrame(animate);
    }
    render();
    setReady(true);
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      rotateRef.current = () => {};
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("webglcontextlost", lost);
      disposeObject(scene);
      key.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [appearanceKey]);
  return (
    <div className="avatar-view">
      <div
        ref={hostRef}
        className="avatar-canvas"
        role="img"
        aria-label={`Avatar 3D de ${name}`}
        data-ready={ready && !failed}
      />
      {!ready && !failed && (
        <p className="avatar-view-message" role="status">
          Preparando seu avatar…
        </p>
      )}
      {failed && (
        <div className="avatar-view-message">
          <span aria-hidden>🧑‍🚀</span>
          <p>
            O 3D não está disponível neste dispositivo. Você ainda pode comprar
            e equipar seus itens abaixo.
          </p>
        </div>
      )}
      {!failed && (
        <div className="avatar-rotate">
          <button
            type="button"
            aria-label="Girar avatar para a esquerda"
            onClick={() => rotateRef.current(-Math.PI / 4)}
          >
            ↶
          </button>
          <span>Arraste para girar</span>
          <button
            type="button"
            aria-label="Girar avatar para a direita"
            onClick={() => rotateRef.current(Math.PI / 4)}
          >
            ↷
          </button>
        </div>
      )}
    </div>
  );
}
