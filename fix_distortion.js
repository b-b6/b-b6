const fs = require('fs');

// Path to the Hercules image uploaded in the brain folder
const imgPath = 'c:/Users/user/.gemini/antigravity/brain/b47c4a59-04fe-453a-ab77-7b2f4e5ad27c/media__1776464783798.jpg';
let b64 = '';
if (fs.existsSync(imgPath)) {
    b64 = Buffer.from(fs.readFileSync(imgPath)).toString('base64');
} else {
    console.log("Could not find Hercules image!");
    process.exit(1);
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

    // Setup Geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Load the base64 image (bypass CORS) and set actual resolution
    const imageSource = "data:image/jpeg;base64,${b64}";
    
    const uniforms = {
        tDiffuse: { value: null },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uImageResolution: { value: new THREE.Vector2(1, 1) } // Default, updated on load
    };

    const loader = new THREE.TextureLoader();
    loader.load(imageSource, function(texture) {
        uniforms.tDiffuse.value = texture;
        const img = texture.image;
        uniforms.uImageResolution.value.set(img.width, img.height);
    });
    
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
        uniform vec2 uResolution;
        uniform vec2 uImageResolution;
        varying vec2 vUv;

        void main() {
            // "background-size: cover" math for UVs
            vec2 ratio = vec2(
                min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
                min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
            );
            vec2 uv = vec2(
                vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
            );
            
            // Basic depth from brightness (Luminance)
            vec4 texColor = texture2D(tDiffuse, uv);
            
            // If the texture isn't fully loaded yet, wait
            if (uImageResolution.x <= 1.0) {
                gl_FragColor = vec4(0.0);
                return;
            }

            float depth = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
            
            // Fake 3D Effect: Shift UV based on mouse and pixel brightness
            vec2 parallax = uMouse * (depth * 0.05);
            
            // To avoid wrapping artifacts at edges due to displacement, clamp uv
            vec2 targetUv = clamp(uv + parallax, 0.0, 1.0);
            vec4 finalColor = texture2D(tDiffuse, targetUv);
            
            // Smoothly clear the outer boundaries if displaced beyond cover
            float edgeAlpha = 1.0;
            if (targetUv.x <= 0.001 || targetUv.x >= 0.999 || targetUv.y <= 0.001 || targetUv.y >= 0.999) {
                edgeAlpha = 0.0;
            }
            
            // Additive blending alpha boost
            gl_FragColor = vec4(finalColor.rgb, (finalColor.r * 1.5 + 0.1) * edgeAlpha); 
        }
    \`;

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending 
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
        
        for(let i=0; i<3; i++) {
            particles.push(new Particle(e.clientX, e.clientY));
            if(particles.length > maxParticles) {
                particles.shift();
            }
        }
    });

    setInterval(() => {
        // Automatically drift a bit if mouse isn't moving
        targetMouseX += (Math.random() - 0.5) * 0.01;
        targetMouseY += (Math.random() - 0.5) * 0.01;
        // Clamp it
        targetMouseX = Math.max(-1, Math.min(1, targetMouseX));
        targetMouseY = Math.max(-1, Math.min(1, targetMouseY));
    }, 1000);

    // === RENDERING LOOP ===
    function animate() {
        requestAnimationFrame(animate);
        
        currentMouseX += (targetMouseX - currentMouseX) * 0.1;
        currentMouseY += (targetMouseY - currentMouseY) * 0.1;
        
        uniforms.uMouse.value.set(currentMouseX, currentMouseY);

        if (uniforms.tDiffuse.value) {
            renderer.render(scene, camera);
        }

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
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

});
`;

fs.writeFileSync('c:/Users/user/Desktop/baber123123/assets/engine.js', engineCode);
console.log("Parallax 2.5D shader engine fixed with COVER aspect ratio padding and proper Hercules Image!");
