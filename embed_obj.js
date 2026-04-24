const fs = require('fs');

const objPath = 'c:/Users/user/Desktop/baber123123/assets/FinalBaseMesh.obj';
const indexPath = 'c:/Users/user/Desktop/baber123123/index.html';

if (fs.existsSync(objPath)) {
    const objContent = fs.readFileSync(objPath, 'utf8');
    
    // Safely encode to base64 to avoid ANY template literal escaping chaos
    const base64Obj = Buffer.from(objContent).toString('base64');
    
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    
    // Check if we already embedded it
    if (!indexHtml.includes('const objBase64 = "')) {
        
        // Strategy: We inject the base64 string, decode it at runtime using atob, and parse it.
        const codeToInject = `
            const objBase64 = "${base64Obj}";
            const objString = decodeURIComponent(escape(window.atob(objBase64)));
            const obj = loader.parse(objString);
            
            obj.traverse(function(child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0x222222,
                        roughness: 0.1,
                        metalness: 0.9
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
        `;

        // We need to replace the old loader.load(...) block
        // First, let's find the boundaries of loader.load
        const loadStartIdx = indexHtml.indexOf("loader.load('assets/FinalBaseMesh.obj'");
        if (loadStartIdx !== -1) {
            const endIdx = indexHtml.indexOf(");", loadStartIdx + 300); // the end of the loader block
            if (endIdx !== -1) {
                const head = indexHtml.substring(0, loadStartIdx);
                const tail = indexHtml.substring(endIdx + 2);
                fs.writeFileSync(indexPath, head + codeToInject + tail);
                console.log("Successfully embedded base64 OBJ to bypass CORS!");
            }
        }
    }
}
