# 🍽️ FoodBar Reviews

A modern, full-stack mobile-ready application for reviewing food and drinks at restaurants and bars. Built with Angular 20 and Supabase.

## ✨ Features

- **User Authentication** - Secure email/password registration and login
- **Item-Specific Reviews** - Rate individual menu items, not just venues
- **Photo Uploads** - Share food photography with image storage
- **AI Menu Parsing** - Upload menu images and extract items automatically using OCR
- **Browse & Discover** - Find items by food type, venue, or category
- **Owner Dashboard** - Restaurant owners can track ratings and feedback
- **Real-time Updates** - Automatic rating calculations with database triggers
- **Responsive Design** - Premium blue & gold themed UI that works on all devices

## 🚀 Tech Stack

- **Frontend**: Angular 20, TypeScript, SCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Edge Functions)
- **State Management**: RxJS
- **Styling**: Custom SCSS with glassmorphism effects
- **OCR**: Tesseract.js for menu parsing
- **Icons & Fonts**: Google Fonts (Inter)

## 📦 Installation

See [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) for detailed setup guide.

Quick start:

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy your Supabase credentials to src/environments/environment.ts

# Start development server
npm start
```

## 🗄️ Database Schema

- **users** - User profiles and authentication
- **venues** - Restaurants and bars
- **menu_items** - Individual food and drink items
- **posts** - User reviews with ratings and photos

## 📱 Mobile Deployment

This app is built mobile-ready and can be deployed to iOS and Android using Capacitor:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
```

## 🎨 Design System

- **Primary Colors**: Deep Navy Blue (#0F172A), Royal Blue (#1D4ED8)
- **Accent Colors**: Metallic Gold (#D4AF37), Soft Amber (#FBBF24)
- **Typography**: Inter font family
- **Effects**: Glassmorphism, smooth transitions, gold gradients

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.