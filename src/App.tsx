import { AboutSection } from './components/AboutSection'
import { DownloadsSection } from './components/DownloadsSection'
import { Footer } from './components/Footer'
import { GamesSection } from './components/GamesSection'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import './App.css'

function App() {
  return (
    <div className="site">
      <Header />
      <main>
        <Hero />
        <GamesSection />
        <AboutSection />
        <DownloadsSection />
      </main>
      <Footer />
    </div>
  )
}

export default App
