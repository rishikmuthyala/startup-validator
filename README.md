# 🚀 Startup Validator - AI-Powered Idea Validation

A premium, Typeform-inspired web application that validates startup ideas through an intelligent 7-question conversation powered by OpenAI GPT-4o-mini.

Visit: https://startups-validator.vercel.app

![Demo](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

### 🎯 **Intelligent Validation Flow**
- One question at a time (Typeform-style focus)
- 7 adaptive questions based on user responses
- Premium thinking animations during AI processing
- Segmented progress indicator

### 📊 **Comprehensive Analysis**
- **Viability Score:** 0-100 rating with verdict
- **What's Promising:** Strengths of the idea
- **The Reality:** Honest challenges and risks
- **Competitors:** Automated competitive research with real competitors
- **Pivot Ideas:** Suggestions for improving low-scoring ideas
- **Next Steps:** Actionable roadmap

### 🎭 **Story Mode Presentation**
- Instagram Stories-inspired reveal flow
- Progressive disclosure (score → insights → report)
- Smooth animations with Framer Motion
- Mobile-optimized experience

### 🔗 **Shareable Results**
- Generate unique shareable links
- 30-day result persistence (Vercel KV)
- One-click copy to clipboard
- LinkedIn and X/Twitter share buttons

### 🎨 **Premium Design**
- Dark theme with gradient accents
- Glass morphism effects
- Responsive typography (mobile-first)
- Smooth transitions and micro-interactions

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **AI:** OpenAI GPT-4o-mini
- **Storage:** Vercel KV (Redis)
- **Deployment:** Vercel
- **Toast Notifications:** React Hot Toast

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- (Optional) Vercel account for KV storage

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/startup-validator.git
cd startup-validator

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Configuration

### Required Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required for AI validation
OPENAI_API_KEY=sk-...

# Optional for shareable results
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Optional - Auto-detected in production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Setting Up Shareable Results (Optional)

The share feature requires Vercel KV. Without it, the app still works but users can't share results.

**Quick Setup:**

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Create KV database in [Vercel Dashboard](https://vercel.com/dashboard)
4. Connect to your project
5. Pull env vars: `vercel env pull .env.local`
6. Restart dev server: `npm run dev`

**Detailed instructions:** See `VERCEL_KV_SETUP.md`

---

## 📖 Usage

### For Users

1. **Enter your startup idea** on the landing page
2. **Answer 7 questions** about your idea
3. **View your score** with animated reveal
4. **Explore insights** in story mode (swipe through)
5. **Read full report** with all analysis
6. **Share results** via unique link

### For Developers

#### Project Structure

```
startup-validator/
├── app/
│   ├── page.js              # Landing page
│   ├── chat/page.js         # 7-question conversation
│   ├── results/[id]/page.js # Story mode + full report
│   └── api/
│       ├── chat/route.js    # Question generation
│       ├── analyze/route.js # Analysis generation
│       ├── followup/route.js # Follow-up Q&A
│       ├── share/route.js   # Save to Vercel KV
│       └── load/route.js    # Load shared results
├── components/
│   └── results/
│       ├── ScoreReveal.js   # Animated score reveal
│       ├── StoryCard.js     # Story mode wrapper
│       ├── FullReport.js    # Complete analysis view
│       └── ...              # Other result components
├── lib/
│   ├── apiRetry.js          # Retry logic for API calls
│   ├── errors.js            # Error handling utilities
│   ├── storage.js           # Vercel KV integration
│   ├── search.js            # Competitor search
│   └── toast.js             # Toast notifications
└── docs/
    ├── DEPLOYMENT_GUIDE.md  # Production deployment
    ├── VERCEL_KV_SETUP.md   # Sharing setup
    ├── STORY_MODE_GUIDE.md  # Story mode docs
    └── ERROR_HANDLING_GUIDE.md
```

#### Key Components

**Chat Flow** (`app/chat/page.js`):
- Manages 7-question conversation
- One question at a time display
- Premium thinking animations
- Auto-saves progress to localStorage

**Results Page** (`app/results/[id]/page.js`):
- Story mode state machine
- Dynamic stage calculation
- Loads from localStorage or Vercel KV
- Handles share ID routing

**Full Report** (`components/results/FullReport.js`):
- Scrollable summary view
- Share and Start Over buttons
- Social sharing integration
- Staggered section animations

#### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Generate next question |
| `/api/analyze` | POST | Generate analysis from conversation |
| `/api/followup` | POST | Answer follow-up questions |
| `/api/share` | POST | Save result to Vercel KV |
| `/api/load` | GET | Load shared result by ID |

---

## 🎨 Customization

### Changing Questions

Edit the system prompt in `app/api/chat/route.js`:

```javascript
const SYSTEM_PROMPT = `Your custom instructions here...`
```

### Modifying Score Criteria

Update the analysis prompt in `app/api/analyze/route.js`:

```javascript
const ANALYSIS_PROMPT = `Your custom scoring criteria...`
```

### Styling

All styles use Tailwind CSS. Main theme colors:

- Background: `#0A0A0A`
- Primary text: `#FFFFFF`
- Secondary text: `#gray-300` to `#gray-600`
- Accents: Gray gradients

To change theme, update classes in components.

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Deploy to Other Platforms

The app is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

**Note:** Vercel KV requires REST API access (works anywhere).

**Detailed instructions:** See `DEPLOYMENT_GUIDE.md`

---

## 📊 Performance

### Metrics

- **First Load:** ~1.5s
- **Time to Interactive:** ~2s
- **Lighthouse Score:** 95+
- **API Response Time:** ~2-4s per question

### Optimization

- Server-side rendering (SSR)
- Code splitting per route
- Automatic image optimization
- Redis caching (Vercel KV)

---

## 🐛 Troubleshooting

### Common Issues

**"Please describe your startup idea"**
- Problem: Navigated to `/chat` without entering idea
- Solution: Go back to home page, enter idea

**"Sharing is not available"**
- Problem: Vercel KV not configured
- Solution: See `VERCEL_KV_SETUP.md`

**"Failed to generate analysis"**
- Problem: OpenAI API error
- Solution: Check API key, check OpenAI status

**Results not loading**
- Problem: Shared link expired (>30 days)
- Solution: Re-run validation

### Debug Mode

Enable detailed logging:

```bash
# Check browser console for:
[Chat Page] ...
[Results] ...
[Storage] ...
[Share] ...
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style (comments, structure)
- Test locally before submitting PR
- Update documentation for new features
- Keep components focused and reusable

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini API
- **Vercel** for hosting and KV storage
- **Framer Motion** for animations
- **Tailwind CSS** for styling

---

## 📧 Contact

Have questions? Found a bug? Want to collaborate?

- **GitHub Issues:** [Report here](https://github.com/yourusername/startup-validator/issues)
- **LinkedIn:** [Your Profile](https://linkedin.com/in/yourprofile)
- **Email:** your.email@example.com

---

## 🎯 Roadmap

### v1.1 (Next)
- [ ] Email results option
- [ ] PDF export
- [ ] Analytics dashboard (founders)
- [ ] A/B test different prompts

### v2.0 (Future)
- [ ] User accounts
- [ ] Compare multiple ideas
- [ ] Industry-specific questions
- [ ] Integration with business plan tools

---

## ⭐ Support

If you find this project helpful, please:
- ⭐ Star the repository
- 🐦 Share on social media
- 📝 Write a blog post about it
- ☕ [Buy me a coffee](https://buymeacoffee.com/yourhandle)

---

**Built by yours truly Rishik Muthyala**

*Validating startup ideas, one conversation at a time.*
