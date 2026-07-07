import Masonry from './Masonry'
import aiLab1 from '../assets/work/ai-lab-1.jpg'
import aiLab2 from '../assets/work/ai-lab-2.jpg'
import aiLab3 from '../assets/work/ai-lab-3.jpg'
import workshop1 from '../assets/work/workshop-day-1.webp'
import workshop3 from '../assets/work/workshop-day-3.jpg'
import studentsUsing from '../assets/work/domain-studentsusing.jpg'
import trainers from '../assets/work/domain-trainers.jpg'
import teachers from '../assets/work/domain-teachers.jpg'
import designers from '../assets/work/domain-designers.jpeg'
import projectWeek from '../assets/work/projectweek4.jpg'
import projectStreet1 from '../assets/work/project-street-1.webp'
import projectStreet3 from '../assets/work/project-street-3.webp'

// Real photos from our AI labs, workshops, and training programs.
const workItems = [
  { id: '1', img: aiLab1, height: 820, category: 'AI Lab', title: 'AI Lab Setup' },
  { id: '2', img: workshop1, height: 600, category: 'Workshop', title: 'Hands-on Workshop' },
  { id: '3', img: aiLab2, height: 760, category: 'AI Lab', title: 'Inside the AI Lab' },
  { id: '4', img: studentsUsing, height: 700, category: 'Training', title: 'Students Building with Claude' },
  { id: '5', img: workshop3, height: 820, category: 'Workshop', title: 'Workshop Sessions' },
  { id: '6', img: aiLab3, height: 560, category: 'AI Lab', title: 'AI Lab in Action' },
  { id: '7', img: teachers, height: 720, category: 'FDP', title: 'Faculty Development' },
  { id: '8', img: trainers, height: 600, category: 'Training', title: 'Trainer-led Sessions' },
  { id: '9', img: projectWeek, height: 700, category: 'Event', title: 'Project Week' },
  { id: '10', img: designers, height: 640, category: 'Curriculum', title: 'Design Sprints' },
  { id: '11', img: projectStreet1, height: 580, category: 'Program', title: 'Campus Program' },
  { id: '12', img: projectStreet3, height: 760, category: 'Program', title: 'On-ground Sessions' },
]

export default function OurWork() {
  return (
    <section id="work" className="relative overflow-hidden bg-black py-20 sm:py-28">
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-claude-500/10 blur-[130px]" />
      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-syne text-5xl font-extrabold leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Work That{' '}
            <span className="bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text text-transparent">
              Ships
            </span>
          </h2>
          <p className="max-w-md text-base leading-relaxed text-white/50 lg:text-right">
            AI labs stood up, programs run, products launched — a look at what we build with Claude.
          </p>
        </div>

        <div className="mt-14">
          <Masonry
            items={workItems}
            ease="power3.out"
            duration={0.6}
            stagger={0.08}
            animateFrom="bottom"
            scaleOnHover
            hoverScale={0.97}
            blurToFocus
          />
        </div>
      </div>
    </section>
  )
}
