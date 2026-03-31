import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './styles/portfolio.css';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const blobRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const cursorPos = useRef({ x: -9999, y: -9999 });
  const blobPos = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // GSAP smooth cursor tracking + spotlight effect
  useEffect(() => {
    const RADIUS = 160;
    const SPOTLIGHT_RADIUS = 180;
    const words = document.querySelectorAll('.word');
    
    // Cache word positions to avoid layout thrashing
    let wordRects: { el: HTMLElement, aSpan: HTMLElement, bSpan: HTMLElement, cx: number, cy: number, width: number, height: number, left: number, top: number }[] = [];
    
    const updateRects = () => {
      wordRects = Array.from(words).map(w => {
        const el = w as HTMLElement;
        const aSpan = el.querySelector('.a') as HTMLElement;
        const bSpan = el.querySelector('.b') as HTMLElement;
        const r = el.getBoundingClientRect();
        return {
          el,
          aSpan,
          bSpan,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          width: r.width,
          height: r.height,
          left: r.left,
          top: r.top
        };
      });
    };

    updateRects();
    window.addEventListener('resize', updateRects);
    
    // Re-update after entry animations finish
    const timer = setTimeout(updateRects, 2500);

    // Quick setters for performance
    const setDotX = gsap.quickSetter(dotRef.current, "x", "px");
    const setDotY = gsap.quickSetter(dotRef.current, "y", "px");
    const setBlobX = gsap.quickSetter(blobRef.current, "x", "px");
    const setBlobY = gsap.quickSetter(blobRef.current, "y", "px");
    
    const handleMouseMove = (e: MouseEvent) => {
      cursorPos.current = { x: e.clientX, y: e.clientY };
      
      // Show blob if hidden
      if (blobRef.current && blobRef.current.style.opacity === '0') {
        gsap.to(blobRef.current, {
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out'
        });
      }
    };

    const handleMouseLeave = () => {
      if (blobRef.current) {
        gsap.to(blobRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: 'power3.out'
        });
      }
      
      // Reset all words
      wordRects.forEach((data) => {
        if (data.el.classList.contains('lit')) {
          gsap.to(data.el, {
            '--lit-progress': 0,
            x: 0,
            y: 0,
            skewX: 0,
            rotate: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => data.el.classList.remove('lit')
          });
          
          gsap.to([data.aSpan, data.bSpan], {
            webkitMaskImage: 'none',
            maskImage: 'none',
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });
    };

    // Smooth blob animation loop with GSAP ticker
    const tickerFunc = () => {
      const { x, y } = cursorPos.current;
      
      // Update dot instantly
      setDotX(x);
      setDotY(y);

      if (blobPos.current.x === -9999) {
        blobPos.current = { x, y };
      }
      
      // Smooth lerp for blob
      blobPos.current.x += (x - blobPos.current.x) * 0.15;
      blobPos.current.y += (y - blobPos.current.y) * 0.15;
      
      setBlobX(blobPos.current.x);
      setBlobY(blobPos.current.y);

      // Spotlight effect on cached word positions
      wordRects.forEach((data) => {
        const distance = Math.hypot(x - data.cx, y - data.cy);
        
        if (distance < RADIUS) {
          if (!data.el.classList.contains('lit')) {
            data.el.classList.add('lit');
            gsap.to(data.el, {
              '--lit-progress': 1,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
          
          const localX = ((x - data.left) / data.width) * 100;
          const localY = ((y - data.top) / data.height) * 100;
          
          // Magnetic pull
          const pullX = (x - data.cx) * 0.12;
          const pullY = (y - data.cy) * 0.12;
          
          gsap.set(data.el, {
            x: pullX,
            y: pullY,
            skewX: pullX * 0.1,
            rotate: pullX * 0.05
          });

          // Dual mask for seamless swap
          const mask = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${localX}% ${localY}%, black 100%, transparent 100%)`;
          const invMask = `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${localX}% ${localY}%, transparent 100%, black 100%)`;

          gsap.set(data.bSpan, {
            webkitMaskImage: mask,
            maskImage: mask,
          });
          gsap.set(data.aSpan, {
            webkitMaskImage: invMask,
            maskImage: invMask,
          });
        } else {
          if (data.el.classList.contains('lit')) {
            gsap.to(data.el, {
              '--lit-progress': 0,
              x: 0,
              y: 0,
              skewX: 0,
              rotate: 0,
              duration: 0.6,
              ease: 'elastic.out(1, 0.4)',
              onComplete: () => data.el.classList.remove('lit')
            });
            
            gsap.to([data.aSpan, data.bSpan], {
              webkitMaskImage: 'none',
              maskImage: 'none',
              duration: 0.4,
              ease: 'power2.out'
            });
          }
        }
      });
    };
    
    gsap.ticker.add(tickerFunc);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateRects);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      gsap.ticker.remove(tickerFunc);
    };
  }, []);

  // Social magnetic effect with GSAP
  useEffect(() => {
    const links = document.querySelectorAll('.social-link');
    
    links.forEach(el => {
      const icon = el.querySelector('.social-icon') as HTMLElement;
      
      const handleMouseMove = (e: Event) => {
        const mouseEvent = e as MouseEvent;
        const r = el.getBoundingClientRect();
        const dx = (mouseEvent.clientX - r.left - r.width / 2) * 0.3;
        const dy = (mouseEvent.clientY - r.top - r.height / 2) * 0.3;
        const cx = Math.max(-5, Math.min(5, dx));
        const cy = Math.max(-5, Math.min(5, dy));
        
        if (icon) {
          gsap.to(icon, {
            x: cx,
            y: cy,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      };
      
      const handleMouseLeave = () => {
        if (icon) {
          gsap.to(icon, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.5)'
          });
        }
      };
      
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
  }, []);

  // Marquee
  useEffect(() => {
    const items = [
      'Product Design', 'UI & UX', 'Brand Identity', 'Motion Design',
      'Design Systems', 'Creative Direction', 'Interaction Design', 'Visual Storytelling'
    ];
    
    if (marqueeRef.current) {
      const track = marqueeRef.current;
      track.innerHTML = '';
      
      [...items, ...items].forEach(txt => {
        const s = document.createElement('span');
        s.className = 'marquee-item';
        s.textContent = txt;
        track.appendChild(s);
        
        const d = document.createElement('div');
        d.className = 'marquee-sep';
        track.appendChild(d);
      });
    }
  }, []);

  return (
    <div className="portfolio-container">
      <video 
        autoPlay 
        muted 
        loop 
        playsInline 
        className="bg-video"
      >
        <source src="/portfolio image.webm" type="video/webm" />
      </video>
      <div className="bg-overlay"></div>
      <div id="blob" ref={blobRef}></div>
      <div id="dot" ref={dotRef}></div>
      <div className="top-line"></div>
      <div className="corner-glow tl"></div>
      <div className="corner-glow br"></div>
      <div className="grain"></div>

      {/* NAV */}
      <nav>
        <div className="logo-mark">
          <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5A623"/>
                <stop offset="100%" stopColor="#F7D000"/>
              </linearGradient>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5A623"/>
                <stop offset="100%" stopColor="#F7D000"/>
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="23" className="logo-ring-bg" stroke="rgba(245,166,35,0.18)" strokeWidth="1"/>
            <circle cx="25" cy="25" r="23" stroke="url(#ringGrad)" strokeWidth="1.6"
              strokeLinecap="round" className="logo-ring-anim"/>
            <text x="25" y="25"
              textAnchor="middle" dominantBaseline="central"
              fontFamily="'Syne', sans-serif" fontWeight="800"
              fontSize="14.5" letterSpacing="1"
              fill="var(--text-hi)" className="logo-text">NJ</text>
          </svg>
        </div>

        <div className="nav-center">
          <a className="nav-item active" href="#">
            <span className="nav-active-dot"></span>About
          </a>
          <a className="nav-item" href="#">Work</a>
          <a className="nav-item" href="#">Process</a>
          <a className="nav-item" href="#">Contact</a>
        </div>

        <div className="nav-right">
          <a className="avail-badge" href="#">
            <span className="avail-pulse"></span>
            <span className="avail-text">Open to work</span>
          </a>
          <button 
            className="theme-btn" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <span className="t-icon t-moon">🌙</span>
            <span className="t-icon t-sun">☀️</span>
          </button>
        </div>
      </nav>

      {/* VERTICAL SOCIALS */}
      <div className="socials">
        <a className="social-link" href="#" title="LinkedIn">
          <div className="social-icon-wrap">
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zM3.56 20.45h3.57V9H3.56v11.45z"/>
            </svg>
          </div>
          <span className="social-label">LinkedIn</span>
        </a>
        <a className="social-link" href="#" title="Dribbble">
          <div className="social-icon-wrap">
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm7.97 5.97a10.05 10.05 0 012.02 6.11c-.3-.06-3.27-.67-6.26-.29-.07-.16-.13-.33-.2-.49-.19-.46-.4-.92-.62-1.37 3.3-1.35 4.8-3.28 5.06-3.96zM12 2c2.57 0 4.92.95 6.71 2.51-.22.64-1.57 2.43-4.74 3.62C12.4 5.77 10.74 3.8 10.5 3.5A10.04 10.04 0 0112 2zm-3.5 1.05c.22.28 1.86 2.26 3.4 4.52C8.1 8.67 5.1 8.68 4.77 8.67A10.05 10.05 0 018.5 3.05zM1.97 12c0-.11.01-.22.01-.33C2.29 11.7 5.96 11.68 9.77 10.4c.22.43.42.87.61 1.31l-.45.13C5.97 13.15 3.73 16.44 3.56 16.7A10.02 10.02 0 011.97 12zm10.03 10c-2.32 0-4.46-.79-6.17-2.1.13-.24 2.18-3.31 6.18-4.63.02-.01.03-.01.05-.02a36.35 36.35 0 011.79 6.39A9.96 9.96 0 0112 22zm4.04-.93a38.26 38.26 0 00-1.65-6.06c2.78-.44 5.22.28 5.52.37a10.06 10.06 0 01-3.87 5.69zM20.1 13.8c-.38-.12-3.04-.97-6.07-.42a37.7 37.7 0 00-.7-1.56c3.18-1.3 4.5-3.17 4.62-3.35a10.03 10.03 0 012.15 5.33z"/>
            </svg>
          </div>
          <span className="social-label">Dribbble</span>
        </a>
        <a className="social-link" href="#" title="Instagram">
          <div className="social-icon-wrap">
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
          <span className="social-label">Instagram</span>
        </a>
        <a className="social-link" href="#" title="GitHub">
          <div className="social-icon-wrap">
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <span className="social-label">GitHub</span>
        </a>
        <a className="social-link" href="#" title="X / Twitter">
          <div className="social-icon-wrap">
            <svg className="social-icon" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <span className="social-label">Twitter</span>
        </a>
      </div>

      {/* HERO */}
      <section className="hero">
        <p className="hero-eyebrow">Nanzing Johnmark</p>
        <div className="stack">
          <span className="word-wrap">
            <span className="word">
              <span className="a">Shaping</span>
              <span className="b">Designing</span>
            </span>
          </span>

          <span className="word-wrap">
            <span className="word accent">
              <span className="a">Stories</span>
              <span className="b">Worlds</span>
            </span>
          </span>

          <span className="word-wrap">
            <span className="word accent">
              <span className="a">Worth Telling</span>
              <span className="b">That Stick</span>
            </span>
          </span>

          <span className="word-wrap">
            <span className="word">
              <span className="a">Since</span>
              <span className="b">One Pixel</span>
            </span>
          </span>

          <span className="word-wrap">
            <span className="word">
              <span className="a">Day One</span>
              <span className="b">At a Time</span>
            </span>
          </span>
        </div>
      </section>

      {/* SCROLL INDICATOR */}
      <div className="scroll-indicator">
        <span className="scroll-label">Scroll</span>
        <div className="scroll-track">
          <div className="scroll-thumb"></div>
        </div>
      </div>

      {/* MARQUEE */}
      <div className="marquee-wrap">
        <div className="marquee-track" ref={marqueeRef}></div>
      </div>

      {/* BOTTOM STRIP */}
      <div className="bottom-strip">
        <span>© 2025</span>
        <div className="bottom-mid">
          <div className="bottom-dot"></div>
          <span>Available for freelance &amp; full-time</span>
          <div className="bottom-dot"></div>
        </div>
        <a href="mailto:hello@nanzingjohnmark.com">hello@nanzingjohnmark.com</a>
      </div>
    </div>
  );
}
