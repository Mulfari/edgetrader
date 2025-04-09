import React from 'react';
import Image from 'next/image';

interface USDTIconProps {
  className?: string;
  size?: number;
  rotation?: number;
}

const USDTIcon: React.FC<USDTIconProps> = ({ 
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
        filter: 'drop-shadow(0 0 10px rgba(38, 161, 123, 0.4))'
      }}
    >
      <Image
        src="/images/usdt.svg"
        alt="Tether (USDT)"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};

export default USDTIcon; 