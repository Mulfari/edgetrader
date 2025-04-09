import React from 'react';
import Image from 'next/image';

interface USDCIconProps {
  className?: string;
  size?: number;
  rotation?: number;
}

const USDCIcon: React.FC<USDCIconProps> = ({ 
  className = '', 
  size = 40,
  rotation = 15 
}) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        width: size, 
        height: size, 
        transform: `rotateY(${rotation}deg)`, 
        transition: 'transform 0.5s ease-in-out',
        filter: 'drop-shadow(0 0 10px rgba(42, 117, 187, 0.4))'
      }}
    >
      <Image
        src="/images/usdc.svg"
        alt="USD Coin (USDC)"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};

export default USDCIcon; 