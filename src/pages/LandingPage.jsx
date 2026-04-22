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

function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <AIInsights />
      <HowItWorks />
      <Marketplace />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}

export default LandingPage
