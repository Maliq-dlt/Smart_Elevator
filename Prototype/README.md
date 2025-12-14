# Smart Elevator Simulator 🏢

A comprehensive elevator simulation system with 3D visualization, AI-powered scenario generation, and real-time physics simulation.

## ✨ Features

- **Dual Lift System** - Two independent elevators (A & B) with coordinated dispatch
- **3D Visualization** - React Three Fiber powered 3D scene with gearless traction machine
- **AI Integration** - Gemini AI for scenario generation and system analysis
- **Multiple Scenarios** - Fire, flood, power outage, earthquake, cable snap simulations
- **Debug Mode** - Real-time sensor readings and safety status monitoring

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set your Gemini API key in .env.local
GEMINI_API_KEY=your_api_key_here

# Run development server
npm run dev
```

## 📁 Project Structure

```
Prototype/
├── src/
│   ├── components/      # React UI components
│   │   ├── Elevator3DScene.tsx    # 3D visualization
│   │   ├── ErrorBoundary.tsx      # Error handling
│   │   └── ...
│   ├── engine/          # Simulation logic
│   │   ├── liftLogic.ts           # Core elevator logic
│   │   ├── SafetySystem.ts        # Safety checks
│   │   └── Sensors.ts             # Virtual sensors
│   ├── hooks/           # Custom React hooks
│   │   └── useSimulationLoop.ts   # Simulation tick loop
│   ├── services/        # External services
│   │   └── geminiService.ts       # AI integration
│   ├── types/           # TypeScript types
│   ├── constants/       # Application constants
│   ├── utils/           # Utility functions
│   ├── assets/          # Static assets
│   │   └── models/      # 3D GLB models
│   ├── App.tsx          # Main application
│   └── main.tsx         # Entry point
├── public/              # Public static files
└── index.html           # HTML template
```

## 🎮 Controls (3D View)

| Key | Action |
|-----|--------|
| W/S | Move forward/backward |
| A/D | Strafe left/right |
| Q/Space | Move up |
| E/Shift | Move down |
| Scroll | Zoom in/out |
| Drag | Look around |

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **React Three Fiber** + **Three.js** - 3D rendering
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Gemini AI** - AI scenario generation

## 📝 License

MIT License
