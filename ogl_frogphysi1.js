import {Renderer, Camera, Transform, Texture, Program,  Mesh, Box, Orbit} from './js/ogl/ogl.js';

{
    const starter = () => {

        const vertex = /* glsl */ `
            precision highp float;
            precision highp int;
            attribute vec2 uv;
            attribute vec3 position;
            attribute vec3 normal;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            precision highp int;
            uniform sampler2D tMap;
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 tex = texture2D(tMap, vUv).rgb;
                
                vec3 light = normalize(vec3(0.5, 1.0, -0.3));
                float shading = dot(normal, light) * 0.15;
                
                gl_FragColor.rgb = tex + shading;
                gl_FragColor.a = 1.0;
            }
        `;

        {
            const renderer = new Renderer({dpr: 2});
            const gl = renderer.gl;
            document.body.appendChild(gl.canvas);
            gl.clearColor(1, 1, 1, 1);

            const camera = new Camera(gl, {fov: 45});
            camera.position.set(3, 1.5, 4);
            camera.lookAt([1, 0.2, 0]);
            const controls = new Orbit(camera);

            function resize() {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
            }

            window.addEventListener('resize', resize, false);
            resize();

            const scene = new Transform();

            // Upload empty texture while source loading
            const texture = new Texture(gl);

            // update image value with source once loaded
            const img = new Image();
            img.src = 'assets/frog_AkwjW.jpg';
            img.onload = () => texture.image = img;

            // Alternatively, you can use the TextureLoader class's load method that handles
            // these steps for you. It also handles compressed textures and fallbacks.
            // const texture = TextureLoader.load(gl, { src: 'assets/saddle.jpg'});

            const program = new Program(gl, {
                vertex,
                fragment,
                uniforms: {
                    tMap: {value: texture},
                },
                cullFace: null,
            });

            let side = 2;
            const imgGeometry1 = new Box(gl, {width: side, height: side, depth: side});

            const boxMesh1 = new Mesh(gl, {
                geometry: imgGeometry1,
                program: program
            });
            boxMesh1.position.set(0, 0, 0);
            //boxMesh1.scale.set(1.5);
            boxMesh1.setParent(scene);

            const imgGeometry2 = new Box(gl, {width: 4, height: .2, depth: 4});

            const boxMesh2 = new Mesh(gl, {
                geometry: imgGeometry2,
                program: program
            });
            boxMesh2.position.set(0, -1, 0);
            //boxMesh2.scale.set(1.5);
            boxMesh2.setParent(scene);

            requestAnimationFrame(update);

            function update(t) {
                requestAnimationFrame(update);
                controls.update();

                boxMesh1.rotation.y += 0.003;
                boxMesh2.rotation.y += 0.003;

                renderer.render({scene, camera});
            }
        }
    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
