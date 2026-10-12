import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Zap, Activity } from 'lucide-react';
import { playBlip } from '../utils/soundEffects';

export default function Triage3DCore({ 
  criticalRedCount = 0, 
  onInteract 
}) {
  const mountRef = useRef(null);
  const [activeMode, setActiveMode] = useState('hologram');
  const [isRotatingFast, setIsRotatingFast] = useState(false);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const width = currentMount.clientWidth || 440;
    const height = currentMount.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // Cyber-Clinical Holographic Palette
    const primaryColor = criticalRedCount > 0 ? 0xff2a5f : 0x00f2fe; // Neon Crimson if red cases, else Electric Cyan
    const accentBlue = 0x38bdf8;   // Sky Cyan
    const accentGreen = 0x10b981;  // Bio Emerald

    // 1. Central Geometric Icosahedron (Fine thin glowing wireframe)
    const coreGeom = new THREE.IcosahedronGeometry(1.4, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    coreGroup.add(coreMesh);

    // 2. Inner Glowing Core
    const innerGeom = new THREE.SphereGeometry(0.7, 24, 24);
    const innerMat = new THREE.MeshBasicMaterial({
      color: criticalRedCount > 0 ? 0xff6b8b : 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: false
    });
    const innerMesh = new THREE.Mesh(innerGeom, innerMat);
    coreGroup.add(innerMesh);

    // 3. Human Pathway Orbital Ring (Equatorial)
    const ring1Geom = new THREE.TorusGeometry(2.2, 0.015, 16, 90);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: accentBlue,
      transparent: true,
      opacity: 0.55
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 2.3;
    coreGroup.add(ring1);

    // Satellite 1
    const sat1Geom = new THREE.SphereGeometry(0.09, 12, 12);
    const sat1Mat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
    const sat1 = new THREE.Mesh(sat1Geom, sat1Mat);
    coreGroup.add(sat1);

    // 4. Veterinary Pathway Orbital Ring (Inclined)
    const ring2Geom = new THREE.TorusGeometry(2.7, 0.015, 16, 90);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: accentGreen,
      transparent: true,
      opacity: 0.45
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI / 2.8;
    ring2.rotation.x = -Math.PI / 4.5;
    coreGroup.add(ring2);

    // Satellite 2
    const sat2Geom = new THREE.SphereGeometry(0.09, 12, 12);
    const sat2Mat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const sat2 = new THREE.Mesh(sat2Geom, sat2Mat);
    coreGroup.add(sat2);

    // 5. DNA Helix Structure (mode === 'helix')
    const helixGroup = new THREE.Group();
    helixGroup.visible = (activeMode === 'helix');
    coreGroup.add(helixGroup);

    const helixPairs = 24;
    const helixRadius = 1.0;
    const helixHeight = 3.2;
    for (let i = 0; i < helixPairs; i++) {
      const t = (i / helixPairs) * Math.PI * 4;
      const y = ((i / helixPairs) - 0.5) * helixHeight;

      const nodeA = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x60a5fa })
      );
      nodeA.position.set(Math.cos(t) * helixRadius, y, Math.sin(t) * helixRadius);
      helixGroup.add(nodeA);

      const nodeB = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x34d399 })
      );
      nodeB.position.set(Math.cos(t + Math.PI) * helixRadius, y, Math.sin(t + Math.PI) * helixRadius);
      helixGroup.add(nodeB);

      if (i % 2 === 0) {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([nodeA.position, nodeB.position]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.3 });
        helixGroup.add(new THREE.Line(lineGeom, lineMat));
      }
    }

    // Interactive Drag / Tilt Tracking
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDragging) {
        const rect = currentMount.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotationY = normX * 0.5;
        targetRotationX = normY * 0.4;
        return;
      }
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      coreGroup.rotation.y += deltaX * 0.01;
      coreGroup.rotation.x += deltaY * 0.01;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const speedMultiplier = isRotatingFast ? 2.5 : 1.0;

      if (!isDragging) {
        coreGroup.rotation.y += 0.005 * speedMultiplier;
        coreGroup.rotation.x += (targetRotationX - coreGroup.rotation.x) * 0.05;
      }

      // Smooth Gentle Breathing
      const scaleVal = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      coreMesh.scale.set(scaleVal, scaleVal, scaleVal);

      // Satellite Orbits
      sat1.position.x = Math.cos(elapsedTime * 1.1 * speedMultiplier) * 2.2;
      sat1.position.z = Math.sin(elapsedTime * 1.1 * speedMultiplier) * 2.2;
      sat1.position.y = Math.sin(elapsedTime * 1.1 * speedMultiplier) * 0.5;

      sat2.position.x = Math.cos(-elapsedTime * 0.8 * speedMultiplier) * 2.7;
      sat2.position.z = Math.sin(-elapsedTime * 0.8 * speedMultiplier) * 2.7;
      sat2.position.y = Math.cos(elapsedTime * 0.8 * speedMultiplier) * 0.9;

      if (activeMode === 'helix') {
        helixGroup.visible = true;
        coreMesh.visible = false;
        innerMesh.visible = false;
        helixGroup.rotation.y = elapsedTime * 0.6;
      } else if (activeMode === 'neural') {
        helixGroup.visible = false;
        coreMesh.visible = true;
        innerMesh.visible = false;
      } else {
        helixGroup.visible = false;
        coreMesh.visible = true;
        innerMesh.visible = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!currentMount) return;
      const newWidth = currentMount.clientWidth;
      const newHeight = currentMount.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeMode, isRotatingFast]);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    playBlip(780, 0.03);
    if (onInteract) onInteract(mode);
  };

  const handleSpeedToggle = () => {
    setIsRotatingFast(!isRotatingFast);
    playBlip(920, 0.03);
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100%',
        height: '280px',
        borderRadius: '16px',
        background: '#f8fafc',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '0.85rem'
      }}
    >
      {/* Top Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          fontWeight: '600',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
          <span>3D Triage Core Active</span>
        </div>

        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          Click & Drag to rotate
        </span>
      </div>

      {/* Three.js Canvas */}
      <div 
        ref={mountRef} 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: 'grab',
          zIndex: 5
        }}
      />

      {/* Bottom Mode Switchers */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        position: 'relative',
        background: 'rgba(10, 16, 32, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '0.35rem 0.75rem',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {[
            { id: 'hologram', label: 'Orb', icon: Sparkles },
            { id: 'neural', label: 'Mesh', icon: Zap },
            { id: 'helix', label: 'Helix', icon: Activity }
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'rgba(15, 23, 42, 0.5)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid transparent',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.18s ease',
                  boxShadow: isSelected ? '0 0 10px rgba(0, 242, 254, 0.4)' : 'none'
                }}
              >
                <Icon size={12} color={isSelected ? '#ffffff' : '#38bdf8'} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSpeedToggle}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '0.7rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '0.2rem 0.4rem'
          }}
        >
          {isRotatingFast ? '⚡ 2.5x Speed' : '🔄 1.0x Speed'}
        </button>
      </div>
    </div>
  );
}
