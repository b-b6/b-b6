const fs = require('fs');

const imgPath = 'c:/Users/user/Desktop/baber123123/assets/bg_1.jpg';
let b64 = '';
if (fs.existsSync(imgPath)) {
    b64 = Buffer.from(fs.readFileSync(imgPath)).toString('base64');
}

const engineCode = `
// Universal 3D Background & Mouse Interactions
// Implementation: 2.5D WebGL Parallax Illusion & Mouse Particels

document.addEventListener('DOMContentLoaded', () => {

    // === 1. 2.5D WEBGL SHADER ILLUSION ===
    const scene = new THREE.Scene();
    
    // Orthographic camera for perfect 2D flat mapping
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-3';
    renderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(renderer.domElement);

    // Setup Geometry & Shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Load the base64 image (bypass CORS)
    const texture = new THREE.TextureLoader().load("data:image/jpeg;base64,${b64}");
    
    const vertexShader = \`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    \`;

    const fragmentShader = \`
        uniform sampler2D tDiffuse;
        uniform vec2 uMouse;
        uniform float uAspect;
        varying vec2 vUv;

        void main() {
            // Apply aspect ratio correction for scaling
            vec2 uv = vUv;
            
            // Basic depth from brightness (Luminance)
            vec4 texColor = texture2D(tDiffuse, uv);
            float depth = dot(texColor.rgb, vec3(0.299, 0.587, 0.114)); // brightness
            
            // Fake 3D Effect: Shift UV based on mouse and pixel brightness
            // Dark parts move differently than bright parts
            vec2 parallax = uMouse * (depth * 0.05);
            vec4 finalColor = texture2D(tDiffuse, fract(uv + parallax));
            
            // Add a subtle screen blend / transparency logic so black disappears
            gl_FragColor = vec4(finalColor.rgb, finalColor.r * 1.5 + 0.1); 
        }
    \`;

    const uniforms = {
        tDiffuse: { value: texture },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uAspect: { value: window.innerWidth / window.innerHeight }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending // Makes the black background disappear perfectly 
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Mouse Tracking setup
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    // === 2. INTERACTIVE MOUSE PARTICLES (WHITE GLOW) ===
    const maxParticles = 60;
    const particles = [];
    const particleColors = ['#ffffff', '#e2e8f0', '#cbd5e1'];
    
    const pCanvas = document.createElement('canvas');
    pCanvas.style.position = 'fixed';
    pCanvas.style.top = '0';
    pCanvas.style.left = '0';
    pCanvas.style.width = '100vw';
    pCanvas.style.height = '100vh';
    pCanvas.style.zIndex = '-2';
    pCanvas.style.pointerEvents = 'none';
    document.body.appendChild(pCanvas);
    
    const ctx = pCanvas.getContext('2d');
    pCanvas.width = window.innerWidth;
    pCanvas.height = window.innerHeight;

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
            this.life = 100;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if(this.size > 0.1) this.size -= 0.05;
            this.life -= 1.5;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life / 100;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
        }
    }

    document.addEventListener('mousemove', (e) => {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        
        // Spawn particles
        for(let i=0; i<3; i++) {
            particles.push(new Particle(e.clientX, e.clientY));
            if(particles.length > maxParticles) {
                particles.shift();
            }
        }
    });

    // === RENDERING LOOP ===
    function animate() {
        requestAnimationFrame(animate);
        
        // Smooth mouse following for parallax
        currentMouseX += (targetMouseX - currentMouseX) * 0.1;
        currentMouseY += (targetMouseY - currentMouseY) * 0.1;
        
        uniforms.uMouse.value.set(currentMouseX, currentMouseY);

        // Render 2.5D Parallax
        renderer.render(scene, camera);

        // Render Particles
        ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        for(let i=0; i<particles.length; i++){
            particles[i].update();
            particles[i].draw();
            if(particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
    }
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        pCanvas.width = window.innerWidth;
        pCanvas.height = window.innerHeight;
        uniforms.uAspect.value = window.innerWidth / window.innerHeight;
    });

});
`;

fs.writeFileSync('c:/Users/user/Desktop/baber123123/assets/engine.js', engineCode);
console.log("Parallax 2.5D shader engine written with b64 image!");
