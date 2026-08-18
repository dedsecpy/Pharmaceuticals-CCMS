import logo from '../assets/aivoa-logo.png'
import { ShiningText } from '@/components/ui/shining-text'

export default function BootSplash({ exiting }) {
  return (
    <div className={`boot ${exiting ? 'boot-exit' : ''}`} aria-live="polite" aria-busy={!exiting}>
      <div className="boot-brand">
        <img className="boot-logo" src={logo} alt="AIVOA" />
        <ShiningText text="Taking you to the complaint portal..." />
      </div>
    </div>
  )
}
