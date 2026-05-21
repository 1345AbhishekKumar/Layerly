# Text Behind Image AI Editor

A powerful, modern web-based design tool that leverages Computer Vision and Generative AI to create professional "text behind subject" posters in seconds.

![CineText App Preview](public/image.png) 
![CineText App Preview](public\cinetext-1778619883551.png) 

## ✨ Features

- **🤖 AI Subject Extraction**: Automatically separate the foreground subject from any background using local ONNX machine learning models. No server-side processing required.
- **🪄 AI Designer Assistant**: Powered by Google Gemini. Get context-aware suggestions for slogans, typography, color palettes, and shadow effects based on your photo.
- **🎨 Professional Canvas**: Full-featured editor built on Fabric.js with support for:
  - Text styling (Google Fonts)
  - Eraser tool for fine-tuning masks
  - Layer management (Base Image, Text, Foreground)
  - Precision controls for positioning, scaling, and rotation
- **💾 History & Persistence**: Built-in undo/redo system and local gallery storage to save your progress.
- **🖼️ High-Res Export**: Export your creations as high-quality JPEGs or PNGs.
- **📱 Fully Responsive**: A seamless experience across desktop and mobile devices with a specialized "Zen Mode" for focused editing.

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Canvas Engine**: [Fabric.js](http://fabricjs.com/)
- **Machine Learning**: [@imgly/background-removal](https://github.com/imgly/background-removal-js) (Local WASM/ONNX)
- **Generative AI**: [@google/genai](https://ai.google.dev/) (Gemini 2.0 Flash)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm / yarn / bun

### Installation

1. **Clone the repository**:
   ```bash
   git clone .....
   cd text-behind-image-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory and add your Google Gemini API Key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

1. **Upload**: Drag and drop a photo onto the canvas.
2. **Auto-Mask**: The AI will automatically detect and extract the subject.
3. **Add Text**: Click the "T" icon to add text. It will automatically be placed *behind* the subject.
4. **AI Magic**: Open the AI Assistant tab to get design ideas tailored to your photo.
5. **Adjust**: Use the layers panel and properties panel to fine-tune your design.
6. **Export**: Click the Export button to download your masterpiece.


# CineText
# Layerly---Text-Behind-Image
# Layerly
