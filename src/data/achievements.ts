import type { TopicId } from './cards'

export interface Achievement {
  id: string
  name: string
  /** Title the player can wear on their profile once earned. */
  title: string
  desc: string
  icon: 'spark' | 'book' | 'star' | 'leaf' | 'wave' | 'peak' | 'cloud' | 'paw' | 'crown'
  topic?: TopicId
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-card', name: 'First Steps', title: 'Fresh Wanderer', desc: 'Answer your first card.', icon: 'spark' },
  { id: 'ten-cards', name: 'Curious Mind', title: 'Curious Mind', desc: 'Answer 10 cards.', icon: 'book' },
  { id: 'mastery-10', name: 'Deep Roots', title: 'Field Scholar', desc: 'Master 10 concepts through review.', icon: 'crown' },
  { id: 'topic-sky', name: 'Cloud Reader', title: 'Cloud Reader', desc: 'Get every Sky & Weather card right.', icon: 'cloud', topic: 'sky' },
  { id: 'topic-night', name: 'Stargazer', title: 'Stargazer', desc: 'Get every Night Sky card right.', icon: 'star', topic: 'night' },
  { id: 'topic-earth', name: 'Rockhound', title: 'Rockhound', desc: 'Get every Rocks & Mountains card right.', icon: 'peak', topic: 'earth' },
  { id: 'topic-ocean', name: 'Tidewalker', title: 'Tidewalker', desc: 'Get every Coast & Ocean card right.', icon: 'wave', topic: 'ocean' },
  { id: 'topic-forest', name: 'Grove Friend', title: 'Grove Friend', desc: 'Get every Forest & Plants card right.', icon: 'leaf', topic: 'forest' },
  { id: 'topic-animals', name: 'Cat Whisperer', title: 'Cat Whisperer', desc: 'Get every Animal Minds card right.', icon: 'paw', topic: 'animals' },
]

export const ACH_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
