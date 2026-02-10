# Hydrate - Water Intake Tracker

A modern, beautiful Progressive Web App (PWA) for tracking daily water intake and building healthy hydration habits.

![Hydrate App](https://img.shields.io/badge/PWA-Ready-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-61dafb)

## Features

✨ **Smart Goal Calculation** - Personalized daily water goals based on your weight and activity level  
💧 **Quick Logging** - One-tap preset buttons (100ml - 1000ml) for instant logging  
📊 **Analytics Dashboard** - Weekly charts, streak tracking, and achievement system  
📱 **Progressive Web App** - Install on any device, works offline  
🔔 **Smart Reminders** - Hourly notifications with Do Not Disturb scheduling  
🌓 **Dark/Light Themes** - Beautiful water-themed design with theme switching  
📈 **History Tracking** - Week-by-week view with detailed entry logs  
⚡ **Smooth Animations** - Delightful water fill animations and transitions  
♿ **Accessible** - WCAG 2.1 AA compliant with full keyboard navigation

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **State Management:** Zustand (with localStorage persistence)
- **Database:** Dexie.js (IndexedDB wrapper)
- **Charts:** Recharts
- **Icons:** Lucide React
- **PWA:** vite-plugin-pwa with Workbox

## Getting Started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/hydrate.git
cd hydrate

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## How It Works

### Goal Calculation Formula

```
Daily Goal = (Body Weight in kg × 32.5ml) + Activity Bonus
```

**Activity Bonuses:**
- Mostly Sitting: +0ml
- Lightly Active: +500ml
- Moderately Active: +750ml
- Very Active: +1000ml
- Athlete/Intense Training: +1500ml

### Data Storage

- **User Profile & Settings:** localStorage via Zustand persist
- **Water Entries:** IndexedDB via Dexie.js
- **Offline Support:** Service Worker caches all assets

## Project Structure

```
src/
├── components/
│   ├── onboarding/      # 4-step onboarding flow
│   ├── dashboard/       # Home screen with progress
│   ├── history/         # 7-day history view
│   ├── analytics/       # Charts and achievements
│   ├── settings/        # Full settings panel
│   └── common/          # Reusable components
├── stores/              # Zustand state stores
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── types/               # TypeScript definitions
└── db/                  # Dexie database schema
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com) for automatic deployments.

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

Or use the Netlify web UI to import from GitHub.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

Built with modern web technologies and best practices for Progressive Web Apps.
