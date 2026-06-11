import { useTheme } from '../context/ThemeContext'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import StatsBar from '../components/StatsBar'
import Features from '../components/Features'
import AIInsights from '../components/AIInsights'
import HowItWorks from '../components/HowItWorks'
import Marketplace from '../components/Marketplace'
import Pricing from '../components/Pricing'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'

function LandingPage() {
  const { colors } = useTheme()

  return (
    <main style={{
      background: colors.bgPrimary,
      color: colors.textPrimary,
      transition: 'background 0.3s, color 0.3s',
      minHeight: '100vh',
    }}>
      <Navbar />
      <Hero />
      <Reveal><StatsBar /></Reveal>
      <Reveal><Features /></Reveal>
      <Reveal><AIInsights /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><Marketplace /></Reveal>
      <Reveal><Pricing /></Reveal>
      <Reveal><FinalCTA /></Reveal>
      <Footer />
    </main>
  )
}

export default LandingPage

