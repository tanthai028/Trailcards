import type { TopicId } from './cards'

export interface Achievement {
  id: string
  name: string
  /** Title the player can wear on their profile once earned. */
  title: string
  desc: string
  coins: number
  icon: 'spark' | 'book' | 'star' | 'leaf' | 'wave' | 'peak' | 'cloud' | 'paw' | 'shirt' | 'home' | 'crown'
  topic?: TopicId
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-card', name: 'First Steps', title: 'Fresh Wanderer', desc: 'Answer your first card.', coins: 10, icon: 'spark' },
  { id: 'ten-cards', name: 'Curious Mind', title: 'Curious Mind', desc: 'Answer 10 cards.', coins: 25, icon: 'book' },
  { id: 'mastery-10', name: 'Deep Roots', title: 'Field Scholar', desc: 'Master 10 concepts through review.', coins: 50, icon: 'crown' },
  { id: 'topic-sky', name: 'Cloud Reader', title: 'Cloud Reader', desc: 'Get every Sky & Weather card right.', coins: 30, icon: 'cloud', topic: 'sky' },
  { id: 'topic-night', name: 'Stargazer', title: 'Stargazer', desc: 'Get every Night Sky card right.', coins: 30, icon: 'star', topic: 'night' },
  { id: 'topic-earth', name: 'Rockhound', title: 'Rockhound', desc: 'Get every Rocks & Mountains card right.', coins: 30, icon: 'peak', topic: 'earth' },
  { id: 'topic-ocean', name: 'Tidewalker', title: 'Tidewalker', desc: 'Get every Coast & Ocean card right.', coins: 30, icon: 'wave', topic: 'ocean' },
  { id: 'topic-forest', name: 'Grove Friend', title: 'Grove Friend', desc: 'Get every Forest & Plants card right.', coins: 30, icon: 'leaf', topic: 'forest' },
  { id: 'topic-animals', name: 'Cat Whisperer', title: 'Cat Whisperer', desc: 'Get every Animal Minds card right.', coins: 30, icon: 'paw', topic: 'animals' },
  { id: 'stylist', name: 'New Look', title: 'Trendsetter', desc: 'Unlock and wear a new outfit.', coins: 15, icon: 'shirt' },
  { id: 'homemaker', name: 'Home on Wheels', title: 'Van Dweller', desc: 'Own 3 decorations.', coins: 20, icon: 'home' },
]

export const ACH_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
