// Your picture: the photo you uploaded, or your character's face.
import { Avatar } from '../scene/Figurine'
import type { Look } from '../data/look'

export function ProfilePic({ look, photo, className = '' }: { look: Look; photo: string | null; className?: string }) {
  if (photo) return <img src={photo} alt="" draggable={false} className={`block rounded-full object-cover ${className}`} />
  return <Avatar look={look} className={`rounded-full bg-gradient-to-b from-[#fff3e2] to-[#d9c7d0] ${className}`} />
}
