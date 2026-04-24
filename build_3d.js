const fs = require('fs');

const threeScript = `
    <!-- 3D BACKGROUND DEPENDENCIES -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.domElement.style.position = 'fixed';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.left = '0';
            renderer.domElement.style.zIndex = '-2';
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
            loader.load('assets/FinalBaseMesh.obj', 
                function (obj) {
                    obj.traverse(function(child) {
                        if (child.isMesh) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x111111,
                                roughness: 0.1,
                                metalness: 0.8
                            });
                        }
                    });

                    // Center the model
                    const box = new THREE.Box3().setFromObject(obj);
                    const center = box.getCenter(new THREE.Vector3());
                    obj.position.sub(center);

                    // Scale logic
                    const size = box.getSize(new THREE.Vector3()).length();
                    const scaleFactor = 10 / size; 
                    obj.scale.setScalar(scaleFactor);

                    // Move down slightly since humans/busts look better anchored
                    obj.position.y -= 1.5;

                    meshContainer.add(obj);
                },
                undefined,
                function (error) {
                    console.error('Error loading OBJ:', error);
                }
            );

            camera.position.z = 15;

            let mouseX = 0;
            let mouseY = 0;
            document.addEventListener('mousemove', (e) => {
                mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            });

            function animate() {
                requestAnimationFrame(animate);
                
                if (meshContainer.children.length > 0) {
                    meshContainer.rotation.y += 0.002;
                    
                    // Parallax
                    camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
                    camera.position.y += (mouseY * 1 - camera.position.y) * 0.05;
                    camera.lookAt(scene.position);
                }
                
                renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        });
    </script>
`;

function inject3D(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Remove old static .bg-layer HTML div
    content = content.replace(/<div class="bg-layer"[^>]*><\/div>\s*/g, '');

    if (!content.includes('THREE.Scene')) {
        content = content.replace('</body>', threeScript + '\n</body>');
        fs.writeFileSync(file, content);
    }
}

inject3D('c:/Users/user/Desktop/baber123123/index.html');
console.log("3D engine injected");
