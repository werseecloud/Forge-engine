import { useEffect, useRef } from "react";
import * as THREE from "three";

export function EnvironmentPreview() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const mountElement = mount;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x071017);
    scene.fog = new THREE.FogExp2(0x071017, 0.045);

    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 160);
    camera.position.set(13, 8.5, 18);
    camera.lookAt(0, 2.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.className = "environment-preview__canvas";
    mountElement.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xbfdcff, 0x141b10, 1.2));
    const sun = new THREE.DirectionalLight(0xffd6a0, 3.8);
    sun.position.set(-10, 15, 8);
    sun.castShadow = true;
    scene.add(sun);

    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 28, 80, 60),
      new THREE.MeshStandardMaterial({ color: 0x273321, roughness: 0.9 })
    );
    terrain.rotateX(-Math.PI / 2);
    const pos = terrain.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.35) * 0.7 + Math.cos(z * 0.4) * 0.55 - Math.exp(-Math.abs(x) * 0.8) * 1.2);
    }
    terrain.geometry.computeVertexNormals();
    terrain.receiveShadow = true;
    scene.add(terrain);

    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 28),
      new THREE.MeshStandardMaterial({ color: 0x0f65ad, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.62 })
    );
    water.rotateX(-Math.PI / 2);
    water.position.y = -0.65;
    scene.add(water);

    const stone = new THREE.MeshStandardMaterial({ color: 0x555b60, roughness: 0.78 });
    const tower = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.8, 1.5), stone);
    body.position.y = 3;
    body.castShadow = true;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.9, 6), stone);
    top.position.y = 6.3;
    top.castShadow = true;
    tower.add(body, top);
    tower.position.set(4.2, 0.1, -1.4);
    scene.add(tower);

    for (let i = 0; i < 18; i += 1) {
      const tree = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.6, 7),
        new THREE.MeshStandardMaterial({ color: 0x1c3a24, roughness: 0.86 })
      );
      tree.position.set(Math.cos(i * 1.8) * (5 + (i % 4) * 2), 0.9, Math.sin(i * 1.8) * (3 + (i % 5) * 1.5));
      tree.castShadow = true;
      scene.add(tree);
    }

    let frame = 0;
    function resize() {
      const rect = mountElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }
    function animate(time: number) {
      resize();
      tower.rotation.y = Math.sin(time * 0.00035) * 0.08;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      mountElement.removeChild(renderer.domElement);
      scene.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
    };
  }, []);

  return <div className="environment-preview" ref={ref} />;
}
