const fs = require('fs');
const path = require('path');

const objPath = 'c:/Users/user/Desktop/baber123123/assets/FinalBaseMesh.obj';
let base64Obj = '';
if (fs.existsSync(objPath)) {
    base64Obj = Buffer.from(fs.readFileSync(objPath, 'utf8')).toString('base64');
}

// Ensure the Base64 script is clean
const engineCode = `
// Universal 3D Background & Mouse Interactions

document.addEventListener('DOMContentLoaded', () => {

    // === 1. THREE.JS 3D BACKGROUND ===
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-3';
    renderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 50);
    pointLight.position.set(-5, -5, 5);
    scene.add(pointLight);

    let meshContainer = new THREE.Group();
    scene.add(meshContainer);

    const loader = new THREE.OBJLoader();
    
    const objBase64 = "${base64Obj}";
    if (objBase64.length > 0) {
        const objString = decodeURIComponent(escape(window.atob(objBase64)));
        const obj = loader.parse(objString);
        
        obj.traverse(function(child) {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0x111111,
                    roughness: 0.1,
                    metalness: 0.8
                });
            }
        });

        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        obj.position.sub(center);

        const size = box.getSize(new THREE.Vector3()).length();
        const scaleFactor = 10 / (size === 0 ? 1 : size); 
        obj.scale.setScalar(scaleFactor);

        obj.position.y -= 1.5;
        meshContainer.add(obj);
    }

    camera.position.z = 15;

    let mouseX = 0;
    let mouseY = 0;

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
            
            // Add a slight glow wrapper
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
        }
    }

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        
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
        
        // Render 3D Model
        if (meshContainer.children.length > 0) {
            meshContainer.rotation.y += 0.002;
            camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
            camera.position.y += (mouseY * 1 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);
        }
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
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        pCanvas.width = window.innerWidth;
        pCanvas.height = window.innerHeight;
    });

});
`;

fs.writeFileSync('c:/Users/user/Desktop/baber123123/assets/engine.js', engineCode);

const injectStrings = `
    <!-- 3D BACKGROUND EXPORTED ENGINE -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
    <script src="assets/engine.js"></script>
`;

function processHTML(file) {
    if(!fs.existsSync(file)) return;
    let c = fs.readFileSync(file, 'utf8');

    // Remove legacy .bg-layer completely
    c = c.replace(/<div class="bg-layer"[^>]*><\/div>\s*/g, '');

    // Cleanup existing 3D dependencies inside index.html if present
    const depStart = c.indexOf('<!-- 3D BACKGROUND DEPENDENCIES -->');
    if (depStart !== -1) {
        c = c.substring(0, depStart);
        c = c + '\n</body>\n</html>';
    }

    // Now inject the master script
    if (!c.includes('assets/engine.js')) {
        c = c.replace('</body>', injectStrings + '\n</body>');
        fs.writeFileSync(file, c);
    }
}

processHTML('c:/Users/user/Desktop/baber123123/index.html');
processHTML('c:/Users/user/Desktop/baber123123/ai_style.html');
processHTML('c:/Users/user/Desktop/baber123123/admin.html');
console.log("Global engine deployed across all pages");
