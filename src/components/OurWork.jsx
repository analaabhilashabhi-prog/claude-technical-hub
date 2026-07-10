import { useEffect, useState } from 'react'
import Masonry from './Masonry'
import Reveal from './Reveal'
import { Close } from './Icons'
import dsc1766 from '../assets/work/dsc-1766.webp'
import aiLab1 from '../assets/work/ai-lab-1.webp'
import aiLab2 from '../assets/work/ai-lab-2.webp'
import workshopDay1 from '../assets/work/workshop-day-1.webp'
import workshopDay3 from '../assets/work/workshop-day-3.webp'
import domainStudentsusing from '../assets/work/domain-studentsusing.webp'
import domainTeachers from '../assets/work/domain-teachers.webp'
import domainTrainers from '../assets/work/domain-trainers.webp'
import domainDesigners from '../assets/work/domain-designers.webp'
import homeImage from '../assets/work/home-image.webp'
import mg0186 from '../assets/work/mg-0186.webp'
import mg0190 from '../assets/work/mg-0190.webp'
import projectStreet8 from '../assets/work/project-street-8.webp'
import img0478 from '../assets/work/img-0478.webp'
import img0495 from '../assets/work/img-0495.webp'

// A curated set of photos from our AI labs, workshops, and programs.
const workItems = [
  { id: '1', img: dsc1766, height: 820, category: 'AI Lab', title: 'Centre of Excellence' },
  { id: '2', img: workshopDay1, height: 560, category: 'Workshop', title: 'Hands-on Workshop' },
  { id: '3', img: domainStudentsusing, height: 720, category: 'Training', title: 'Students Building with Claude' },
  { id: '4', img: aiLab1, height: 620, category: 'AI Lab', title: 'AI Lab' },
  { id: '5', img: mg0186, height: 780, category: 'Project Street', title: 'Project Street' },
  { id: '6', img: domainTeachers, height: 520, category: 'FDP', title: 'Faculty Development' },
  { id: '7', img: img0478, height: 700, category: 'Project Week', title: 'Project Week' },
  { id: '8', img: aiLab2, height: 600, category: 'AI Lab', title: 'Inside the AI Lab' },
  { id: '9', img: img0495, height: 760, category: 'Project Week', title: 'Project Week' },
  { id: '10', img: domainTrainers, height: 540, category: 'Training', title: 'Trainer-led Sessions' },
  { id: '11', img: projectStreet8, height: 680, category: 'Project Street', title: 'Project Street' },
  { id: '12', img: domainDesigners, height: 640, category: 'Curriculum', title: 'Design Sprints' },
  { id: '13', img: mg0190, height: 800, category: 'Project Street', title: 'Project Street' },
  { id: '14', img: workshopDay3, height: 580, category: 'Workshop', title: 'Hands-on Workshop' },
  { id: '15', img: homeImage, height: 700, category: 'Program', title: 'Campus Program' },
]

export default function OurWork() {
  const [lightbox, setLightbox] = useState(null)

  // Close the popup on Escape, and lock page scroll while it's open.
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightbox])

  return (
    <section id="work" className="relative overflow-hidden bg-black py-12 sm:py-16">
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-claude-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[5%] left-[-8%] h-96 w-96 rounded-full bg-brand-500/[0.08] blur-[160px]" />
      <div className="relative w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <h2 className="font-syne text-5xl font-extrabold leading-[0.92] tracking-tight text-brand-300 sm:text-6xl lg:text-7xl">
              Work That{' '}
              <span className="bg-gradient-to-r from-claude-300 via-claude-400 to-claude-500 bg-clip-text text-transparent">
                Ships
              </span>
            </h2>
          </Reveal>
          <Reveal delay={130}>
            <p className="max-w-md text-base leading-relaxed text-white/50 lg:text-right">
              AI labs stood up, programs run, products launched — a look at what we build with Claude.
            </p>
          </Reveal>
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
            onItemClick={setLightbox}
          />
        </div>
      </div>

      {/* Full-image popup (click any photo) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <Close width={20} height={20} />
          </button>

          <figure className="flex max-h-full max-w-full flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.img}
              alt={lightbox.title || ''}
              className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl shadow-black/60"
            />
            {(lightbox.category || lightbox.title) && (
              <figcaption className="mt-4 text-center">
                {lightbox.category && (
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-claude-300">
                    {lightbox.category}
                  </span>
                )}
                {lightbox.title && (
                  <p className="mt-1 text-lg font-semibold text-white">{lightbox.title}</p>
                )}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  )
}
