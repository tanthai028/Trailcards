// Trophies reward effort and habits, never difficulty: everyone studies their own decks, so
// "hard" means something different to each person. Counts, streaks, spaced-review mastery
// (judged on your own cards) and taking part in the group are fair for any deck.

export interface Achievement {
  id: string
  name: string
  /** Title the player can wear on their profile once earned. */
  title: string
  desc: string
  icon: 'spark' | 'book' | 'star' | 'leaf' | 'wave' | 'peak' | 'cloud' | 'paw' | 'crown' | 'flame' | 'moon' | 'sun' | 'compass' | 'heart' | 'bolt' | 'refresh' | 'planet'
}

export const ACHIEVEMENTS: Achievement[] = [
  // answering
  { id: 'first-card', name: 'First Steps', title: 'Fresh Wanderer', desc: 'Answer your first card.', icon: 'spark' },
  { id: 'ten-cards', name: 'Curious Mind', title: 'Curious Mind', desc: 'Answer 10 cards.', icon: 'book' },
  { id: 'answers-100', name: 'Dedicated', title: 'Dedicated', desc: 'Answer 100 cards.', icon: 'bolt' },
  { id: 'answers-1000', name: 'Marathoner', title: 'Marathoner', desc: 'Answer 1,000 cards.', icon: 'planet' },
  // habits
  { id: 'streak-3', name: 'Warming Up', title: 'Regular', desc: 'Hit your daily goal 3 days in a row.', icon: 'flame' },
  { id: 'streak-7', name: 'On a Roll', title: 'Steady Learner', desc: 'Hit your daily goal 7 days in a row. Unlocks the Flame frame.', icon: 'flame' },
  { id: 'streak-30', name: 'Unstoppable', title: 'Unstoppable', desc: 'Hit your daily goal 30 days in a row. Unlocks the Crown frame.', icon: 'crown' },
  { id: 'streak-100', name: 'Living Legend', title: 'Legend', desc: 'Hit your daily goal 100 days in a row.', icon: 'crown' },
  { id: 'goal-days-30', name: 'Habit Builder', title: 'Habit Builder', desc: 'Hit your daily goal on 30 days, in a row or not.', icon: 'sun' },
  // mastery (spaced review on your own cards)
  { id: 'mastery-10', name: 'Deep Roots', title: 'Field Scholar', desc: 'Master 10 cards through review. Unlocks the Starry frame.', icon: 'leaf' },
  { id: 'mastery-50', name: 'Well Rooted', title: 'Scholar', desc: 'Master 50 cards.', icon: 'peak' },
  { id: 'mastery-200', name: 'Encyclopedic', title: 'Walking Encyclopedia', desc: 'Master 200 cards.', icon: 'star' },
  { id: 'comeback-10', name: 'Second Chances', title: 'Resilient', desc: 'Get 10 cards right that you missed before.', icon: 'refresh' },
  // decks and the group
  { id: 'first-deck', name: 'Deck Builder', title: 'Deck Builder', desc: 'Make or import your own deck.', icon: 'book' },
  { id: 'decks-5', name: 'Librarian', title: 'Librarian', desc: 'Have 5 decks of your own.', icon: 'cloud' },
  { id: 'share-deck', name: 'Generous', title: 'Generous', desc: 'Share a deck with your group.', icon: 'heart' },
  { id: 'explorer', name: 'Explorer', title: 'Explorer', desc: 'Add a deck a friend shared in Explore.', icon: 'compass' },
  // when you study
  { id: 'night-owl', name: 'Night Owl', title: 'Night Owl', desc: 'Study between midnight and 4 am.', icon: 'moon' },
  { id: 'early-bird', name: 'Early Bird', title: 'Early Bird', desc: 'Study between 5 and 7 am.', icon: 'sun' },
]

export const ACH_BY_ID: Record<string, Achievement> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
