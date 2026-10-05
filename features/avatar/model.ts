import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { AvatarAppearance } from "@/types";

// Original low-poly character, assembled locally; no models or textures fetched.
export function createAvatar(appearance: AvatarAppearance) {
  const group = new THREE.Group();
  const skin = "#edb68f",
    ink = "#34304a";
  const shirt = appearance.shirt?.color ?? "#7962d9";
  const pants = appearance.pants?.color ?? "#445271";
  function box(
    w: number,
    h: number,
    d: number,
    color: string,
    x: number,
    y: number,
    z = 0,
    parent: THREE.Group = group,
  ) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.13),
      new THREE.MeshStandardMaterial({ color, roughness: 0.72 }),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(1.08, 1.04, 0.6, shirt, 0, 1.76);
  box(0.42, 0.87, 0.5, pants, -0.265, 0.77);
  box(0.42, 0.87, 0.5, pants, 0.265, 0.77);
  for (const x of [-0.265, 0.265]) {
    box(0.46, 0.25, 0.7, "#faf7ff", x, 0.27, 0.1);
    box(0.47, 0.07, 0.71, "#d4d4ec", x, 0.15, 0.1);
    box(0.25, 0.045, 0.09, shirt, x, 0.37, 0.27);
  }
  const arms: THREE.Group[] = [];
  for (const x of [-0.78, 0.78]) {
    const arm = new THREE.Group();
    arm.position.set(x, 2.13, 0);
    group.add(arm);
    arms.push(arm);
    box(0.36, 0.53, 0.5, shirt, 0, -0.22, 0, arm);
    box(0.33, 0.42, 0.46, skin, 0, -0.65, 0, arm);
    arm.rotation.z = x > 0 ? 0.055 : -0.055;
  }
  box(0.3, 0.2, 0.3, skin, 0, 2.32);
  box(0.9, 0.84, 0.78, skin, 0, 2.8);
  const hair = appearance.hair;
  const hairColor = hair?.color ?? "#51413f";
  box(0.94, 0.19, 0.79, hairColor, 0, 3.19, -0.02);
  box(0.29, 0.17, 0.1, hairColor, -0.28, 3.07, 0.36).rotation.z = -0.14;
  box(0.26, 0.1, 0.1, hairColor, -0.02, 3.11, 0.37);
  if (hair?.style === "hair_long" || hair?.style === "hair_bob") {
    const long = hair.style === "hair_long";
    box(0.98, long ? 1.25 : 0.75, 0.22, hairColor, 0, long ? 2.57 : 2.82, -0.4);
    for (const x of [-0.46, 0.46])
      box(
        0.17,
        long ? 1.15 : 0.68,
        0.64,
        hairColor,
        x,
        long ? 2.57 : 2.8,
        -0.025,
      );
  } else if (hair?.style === "hair_ponytail") {
    box(0.91, 0.6, 0.18, hairColor, 0, 2.88, -0.4);
    box(0.36, 0.91, 0.36, hairColor, 0, 2.68, -0.65).rotation.x = -0.18;
    box(0.38, 0.1, 0.37, "#b397ee", 0, 3.01, -0.62);
  }
  for (const x of [-0.18, 0.18]) {
    box(0.065, 0.105, 0.035, ink, x, 2.81, 0.401);
    box(0.022, 0.027, 0.015, "#ffffff", x - 0.009, 2.835, 0.424);
    box(0.12, 0.035, 0.02, "#87604d", x, 2.94, 0.399);
    box(0.12, 0.055, 0.012, "#e69987", x * 1.42, 2.67, 0.402);
  }
  const smile = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.115, 2.64, 0.407),
    new THREE.Vector3(0, 2.52, 0.426),
    new THREE.Vector3(0.115, 2.64, 0.407),
  );
  group.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(smile, 12, 0.016, 5, false),
      new THREE.MeshStandardMaterial({ color: ink }),
    ),
  );
  // Star patch and collar make the default avatar feel complete and free.
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.072 : 0.15;
    if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  star.closePath();
  const patch = new THREE.Mesh(
    new THREE.ShapeGeometry(star),
    new THREE.MeshStandardMaterial({
      color: "#ffdf91",
      side: THREE.DoubleSide,
    }),
  );
  patch.position.set(0, 1.82, 0.308);
  group.add(patch);
  box(0.35, 0.075, 0.08, "#e8e1ff", 0, 2.24, 0.27);
  const hat = appearance.hat;
  if (hat?.style === "cap") {
    box(1, 0.23, 0.87, hat.color, 0, 3.25);
    box(0.88, 0.07, 0.47, hat.color, 0, 3.15, 0.48);
    box(0.16, 0.11, 0.02, "#f4f0ff", 0, 3.25, 0.445);
  } else if (hat?.style === "crown") {
    const material = new THREE.MeshStandardMaterial({
      color: hat.color,
      metalness: 0.32,
      roughness: 0.38,
    });
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.15, 8),
      material,
    );
    band.position.y = 3.26;
    band.castShadow = true;
    group.add(band);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.32, 4),
        material,
      );
      tip.position.set(Math.sin(angle) * 0.44, 3.47, Math.cos(angle) * 0.44);
      tip.castShadow = true;
      group.add(tip);
    }
    box(0.12, 0.1, 0.06, "#a188ed", 0, 3.28, 0.55);
  } else if (hat?.style === "headphones") {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.56, 0.065, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: hat.color }),
    );
    band.position.set(0, 2.93, 0);
    group.add(band);
    for (const x of [-0.54, 0.54]) {
      box(0.15, 0.42, 0.4, hat.color, x, 2.84);
      box(0.055, 0.26, 0.3, "#ebe6ff", x * 1.16, 2.84);
    }
  }
  const accessory = appearance.accessory;
  if (accessory?.style === "glasses") {
    for (const x of [-0.23, 0.23]) {
      box(0.38, 0.25, 0.055, accessory.color, x, 2.81, 0.441);
      box(0.27, 0.15, 0.015, "#879bb7", x, 2.815, 0.476);
      box(0.1, 0.025, 0.02, "#d9e4f3", x - 0.045, 2.85, 0.49).rotation.z = 0.45;
    }
    box(0.12, 0.045, 0.04, accessory.color, 0, 2.83, 0.45);
  } else if (accessory?.style === "backpack") {
    box(0.84, 0.85, 0.34, accessory.color, 0, 1.85, -0.46);
    box(0.53, 0.33, 0.13, "#d17549", 0, 1.62, -0.67);
    for (const x of [-0.37, 0.37])
      box(0.085, 0.95, 0.07, accessory.color, x, 1.83, 0.327);
    box(0.3, 0.08, 0.09, accessory.color, 0, 2.33, -0.43);
  }
  return { group, arms };
}

export function disposeObject(object: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      for (const material of Array.isArray(child.material)
        ? child.material
        : [child.material])
        materials.add(material);
    }
  });
  materials.forEach((material) => material.dispose());
}
