import React from 'react';

export const DriftShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 drift-text">
        Innovative Drift Design System
      </h1>
      
      {/* Drift Cards Grid */}
      <div className="drift-grid">
        <div className="drift-card">
          <h2 className="text-2xl font-bold mb-4 drift-text">Smooth Drift</h2>
          <p className="text-gray-300 mb-4">Experience the smooth drifting animation</p>
          <div className="w-full h-32 bg-drift-1 rounded-lg animate-drift-smooth"></div>
        </div>

        <div className="drift-card">
          <h2 className="text-2xl font-bold mb-4 drift-text">Organic Drift</h2>
          <p className="text-gray-300 mb-4">Organic and natural drifting motion</p>
          <div className="w-full h-32 bg-drift-2 rounded-lg animate-drift-organic"></div>
        </div>

        <div className="drift-card">
          <h2 className="text-2xl font-bold mb-4 drift-text">Floating Drift</h2>
          <p className="text-gray-300 mb-4">Ethereal floating effect</p>
          <div className="w-full h-32 bg-drift-3 rounded-lg animate-drift-float"></div>
        </div>
      </div>

      {/* 3D Drift Section */}
      <div className="mt-12 p-8 drift-card">
        <h2 className="text-3xl font-bold mb-6 text-center drift-text">3D Drift Effects</h2>
        <div className="flex justify-center space-x-8">
          <div className="w-48 h-48 bg-drift-4 rounded-lg transform-3d rotate-3d hover:rotate-3d-lg transition-all duration-500"></div>
          <div className="w-48 h-48 bg-drift-5 rounded-full transform-3d rotate-3d hover:rotate-3d-lg transition-all duration-500"></div>
          <div className="w-48 h-48 bg-drift-6 rounded-lg animate-drift-morph transform-3d"></div>
        </div>
      </div>

      {/* Glitch Text Section */}
      <div className="mt-12 p-8 drift-card text-center">
        <h2 className="text-3xl font-bold mb-4 drift-text">Glitch Drift Effect</h2>
        <div className="drift-text-glitch text-4xl" data-text="INNOVATIVE DRIFT">
          INNOVATIVE DRIFT
        </div>
      </div>

      {/* Particle Drift Section */}
      <div className="mt-12 p-8 drift-card relative overflow-hidden">
        <h2 className="text-3xl font-bold mb-4 text-center drift-text">Particle Drift System</h2>
        <div className="drift-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="drift-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                background: `hsl(${Math.random() * 360}, 100%, 50%)`,
              }}
            ></div>
          ))}
        </div>
        <p className="text-gray-300 relative z-10">
          Dynamic particle system with drift animations
        </p>
      </div>

      {/* Drift Buttons */}
      <div className="mt-12 p-8 drift-card">
        <h2 className="text-3xl font-bold mb-6 text-center drift-text">Drift Buttons</h2>
        <div className="flex justify-center space-x-4">
          <button className="drift-button">Smooth Drift</button>
          <button className="drift-button">Glitch Drift</button>
          <button className="drift-button">Pulse Drift</button>
        </div>
      </div>

      {/* Animated Borders */}
      <div className="mt-12 p-8 drift-card">
        <h2 className="text-3xl font-bold mb-6 text-center drift-text">Animated Borders</h2>
        <div className="flex justify-center space-x-8">
          <div className="w-32 h-32 drift-border-animated rounded-lg"></div>
          <div className="w-32 h-32 drift-border-animated rounded-full"></div>
          <div className="w-32 h-32 drift-border-animated" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
        </div>
      </div>
    </div>
  );
};