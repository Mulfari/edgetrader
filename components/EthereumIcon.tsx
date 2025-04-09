import React from 'react';
import Image from 'next/image';

interface EthereumIconProps {
  className?: string;
  size?: number;
  rotation?: number;
}

const EthereumIcon: React.FC<EthereumIconProps> = ({ 
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
        filter: 'drop-shadow(0 0 10px rgba(114, 137, 255, 0.4))'
      }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 p-[2px]">
        <div className="w-full h-full rounded-full bg-[#627EEA] flex items-center justify-center overflow-hidden">
          <svg 
            viewBox="0 0 32 32" 
            className="w-2/3 h-2/3"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M16 4L15.86 4.44V19.3556L16 19.4978L23.5599 15.0278L16 4Z" fill="white" opacity="0.6"/>
            <path d="M16 4L8.44 15.0278L16 19.4978V12.227V4Z" fill="white"/>
            <path d="M16 20.992L15.92 21.0895V26.8956L16 27.156L23.56 16.5233L16 20.992Z" fill="white" opacity="0.6"/>
            <path d="M16 27.156V20.992L8.44 16.5233L16 27.156Z" fill="white"/>
            <path d="M16 19.4977L23.56 15.0277L16 12.2269V19.4977Z" fill="white" opacity="0.2"/>
            <path d="M8.44 15.0277L16 19.4977V12.2269L8.44 15.0277Z" fill="white" opacity="0.6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default EthereumIcon; 