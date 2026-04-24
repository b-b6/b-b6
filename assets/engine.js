// Antigravity Liquid Galaxy & Wave Engine
document.addEventListener('DOMContentLoaded', () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    const pCanvas = document.createElement('canvas'); 
    Object.assign(pCanvas.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '-1', pointerEvents: 'none' }); 
    document.body.appendChild(pCanvas);
    const ctx = pCanvas.getContext('2d');
    
    let w, h;
    let particles = [];
    const numParticles = isMobile ? 120 : 350; 
    
    const isAdmin = window.location.pathname.includes('admin') || document.title.toLowerCase().includes('админ');
    const colors = ['#4A90E2', '#9013FE', '#F5A623', '#A0A0B0', '#FFFFFF'];

    class Particle { 
        constructor(x, y, cx, cy) { 
            let dx = x - cx;
            let dy = y - cy;
            this.angle = Math.atan2(dy, dx);
            this.radius = Math.sqrt(dx*dx + dy*dy);
            
            this.x = x; 
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            this.vx = 0; 
            this.vy = 0;
            this.size = Math.random() * 1.5 + 1; 
            
            this.color = colors[Math.floor(Math.random() * colors.length)];
            // Более мягкая физика воды (плавность)
            this.friction = 0.93; 
            this.spring = 0.015;
            this.rotationSpeed = (Math.random() * 0.0008 + 0.0002) * (Math.random() > 0.5 ? 1 : -1); 
        } 
        update() { 
            let dx = pointer.x - this.x;
            let dy = pointer.y - this.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            let forceBaseX = (this.baseX - this.x) * this.spring;
            let forceBaseY = (this.baseY - this.y) * this.spring;
            
            let reactRadius = isMobile ? 150 : 250;
            
            if (pointer.active && dist < reactRadius) {
                // Плавное затухание силы (чем дальше, тем мягче)
                let force = Math.pow((reactRadius - dist) / reactRadius, 2); 
                
                if (isAdmin) {
                    let tx = -dy / dist;
                    let ty = dx / dist; 
                    this.vx += (dx / dist) * force * 0.8 + tx * force * 1.5;
                    this.vy += (dy / dist) * force * 0.8 + ty * force * 1.5;
                } else {
                    this.vx -= (dx / dist) * force * 1.2;
                    this.vy -= (dy / dist) * force * 1.2;
                }
            }
            
            this.vx += forceBaseX;
            this.vy += forceBaseY;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
        } 
        draw() { 
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.85; 
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); 
            ctx.fill(); 
        } 
    }
    
    function init() {
        w = pCanvas.width = window.innerWidth; 
        h = pCanvas.height = window.innerHeight;
        particles = [];
        let cx = w / 2;
        let cy = h / 2;
        for(let i=0; i<numParticles; i++) {
            particles.push(new Particle(Math.random() * w, Math.random() * h, cx, cy));
        }
    }
    window.addEventListener('resize', init); 
    init();

    let pointer = { x: -1000, y: -1000, active: false };

    window.addEventListener('mousemove', e => { 
        pointer.x = e.clientX; 
        pointer.y = e.clientY; 
        pointer.active = true;
    });
    window.addEventListener('mouseleave', () => { pointer.active = false; });
    
    window.addEventListener('touchstart', e => { 
        if(e.touches.length > 0) {
            pointer.x = e.touches[0].clientX; 
            pointer.y = e.touches[0].clientY; 
            pointer.active = true;
        }
    }, { passive: true });
    window.addEventListener('touchmove', e => { 
        if(e.touches.length > 0) {
            pointer.x = e.touches[0].clientX; 
            pointer.y = e.touches[0].clientY; 
            pointer.active = true;
        }
    }, { passive: true });
    window.addEventListener('touchend', () => { pointer.active = false; });

    function animate(t) { 
        requestAnimationFrame(animate); 
        ctx.clearRect(0, 0, w, h);
        
        let cx = w / 2;
        let cy = h / 2;
        let waveTime = (t || 0) * 0.001;

        for (let i = 0; i < particles.length; i++) { 
            let p = particles[i];
            
            // Волшебное движение (галактическое вращение + эффект жидкой волны)
            p.angle += p.rotationSpeed;
            let targetX = cx + Math.cos(p.angle) * p.radius;
            let targetY = cy + Math.sin(p.angle) * p.radius;
            
            // Волнообразное дыхание частиц
            targetX += Math.cos(waveTime + p.radius * 0.01) * 30;
            targetY += Math.sin(waveTime + p.angle * 2) * 30;

            p.baseX = targetX;
            p.baseY = targetY;

            p.update(); 
            p.draw();
        } 
    }
    requestAnimationFrame(animate); 
});
