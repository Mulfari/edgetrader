import React from 'react';
import Image from 'next/image';

interface BitcoinIconProps {
  className?: string;
  size?: number;
  rotation?: number;
}

const BitcoinIcon: React.FC<BitcoinIconProps> = ({ 
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
        filter: 'drop-shadow(0 0 10px rgba(247, 147, 26, 0.3))'
      }}
    >
      <Image
        src="/images/Bitcoin.svg.webp"
        alt="Bitcoin"
        width={size}
        height={size}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};

export default BitcoinIcon; 