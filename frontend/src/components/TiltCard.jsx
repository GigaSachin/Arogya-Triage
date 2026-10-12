import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function TiltCard({ 
  children, 
  className = '', 
  style = {}, 
  glowColor = 'rgba(59, 130, 246, 0.4)',
  maxTilt = 10,
  scaleOnHover = 1.018,
  onClick
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position normalized (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth physics springs
  const springConfig = { damping: 22, stiffness: 260 };
  const smoothX = useSpring(x, springConfig);
  const smoothY = useSpring(y, springConfig);

  // 3D rotations based on mouse position
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Dynamic light sheen / specular highlight coordinates
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normX = mouseX / width - 0.5;
    const normY = mouseY / height - 0.5;

    x.set(normX);
    y.set(normY);

    setGlarePos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          position: 'relative',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          ...style
        }}
        whileHover={{ scale: scaleOnHover }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className={`glass-card ${className}`}
      >
        {/* Dynamic Specular Sheen (Moves with cursor in 3D) */}
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 3,
              borderRadius: 'inherit',
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 65%)`,
              opacity: 0.35,
              transition: 'opacity 0.2s ease',
              mixBlendMode: 'screen'
            }}
          />
        )}

        {/* Content layer positioned in 3D */}
        <div style={{ transform: 'translateZ(20px)', position: 'relative', zIndex: 2 }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
