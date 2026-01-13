# Drug Discovery AI - TRON Frontend

A futuristic TRON-themed React frontend for the drug discovery AI platform, featuring a spinning 3D cube and Claude.ai-inspired chat interface.

## Features

- 🎨 **TRON Aesthetic**: Neon blue/cyan color scheme with glowing effects and grid backgrounds
- 🎲 **3D Spinning Cube**: Interactive Three.js cube animation on landing page
- 💬 **Chat Interface**: Claude.ai-inspired chat UI for drug discovery interactions
- ⚡ **Next.js 14**: Modern React framework with App Router
- 🎯 **Drug Discovery Focus**: UI elements tailored for computational drug redesign

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with landing/chat toggle
│   ├── globals.css         # Global TRON theme styles
│   └── page.module.css     # Page-specific styles
├── components/
│   ├── SpinningCube.tsx    # 3D cube component (Three.js)
│   ├── ChatInterface.tsx   # Chat UI component
│   └── *.module.css        # Component styles
└── package.json
```

## Tech Stack

- **Next.js 14** - React framework
- **Three.js** - 3D graphics for spinning cube
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for react-three-fiber
- **TypeScript** - Type safety
- **CSS Modules** - Scoped styling

## Customization

### Colors

Edit CSS variables in `app/globals.css`:

```css
:root {
  --tron-blue: #00f0ff;
  --tron-cyan: #00ffff;
  --tron-dark: #0a0e27;
  /* ... */
}
```

### Backend Integration

Update `components/ChatInterface.tsx` to connect to your FastAPI backend:

```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: userMessage.content })
})
```

## License

See main project LICENSE file.

