import { Renderer, Camera, Transform, Vec2, Program, Mesh, Box, Orbit, Raycast } from './js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : mutiboxes 2 (detect mouse hit)" ;

    const starter = () => {

        const vertex = /* glsl */ `
            precision highp float;
            precision highp int;
            attribute vec3 position;
            attribute vec3 normal;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragment = /* glsl */ `
            precision highp float;
            precision highp int;
            uniform float uHit;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                vec3 color = mix(vec3(0.2, 0.8, 1.0), vec3(1.0, 0.2, 0.8), uHit);
                gl_FragColor.rgb = color + lighting * 0.1;
                gl_FragColor.a = 1.0;
            }
        `;
        {
            const renderer = new Renderer({ dpr: 2 });
            const gl = renderer.gl;
            document.body.appendChild(gl.canvas);
            gl.clearColor(1, 1, 1, 1);

            const camera = new Camera(gl, { fov: 35 });
            camera.position.set(0, 0, -40);
            camera.lookAt([0, 0, 0]);
            const controls = new Orbit(camera);

            function resize() {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
            }

            window.addEventListener('resize', resize, false);
            resize();

            const scene = new Transform();

            let side  = 1.5;
            const cubeGeometry = new Box(gl, {width: side, height: side, depth: side});

            const program = new Program(gl, {
                vertex,
                fragment,

                // Don't cull faces so that plane is double sided - default is gl.BACK
                cullFace: null,
                uniforms: {
                    uHit: {value: 0},
                },
            });

            function updateHitUniform({mesh}) {
                program.uniforms.uHit.value = mesh.isHit ? 1 : 0;
            }
            let boxes = [];

            for (let j=0; j<30; j+=5) {
                for (let i = 0; i < 10; i++) {
                    for (let k=15; k>-15; k-=3) {

                        let cube = new Mesh(gl, { geometry: cubeGeometry, program });
                        cube.position.set((i - 5) * 3, k, j);
                        cube.setParent(scene);
                        boxes.push(cube);

                        cube.onBeforeRender(updateHitUniform);
                    }
                }
            }

            requestAnimationFrame(update);
            function update() {
                requestAnimationFrame(update);
                controls.update();

             //   cube.rotation.y -= 0.04;

                renderer.render({ scene, camera });
            }

            const mouse = new Vec2();

            // Create a raycast object
            const raycast = new Raycast(gl);

            function move(e) {
                mouse.set(
                    2.0 * (e.x / renderer.width) - 1.0,
                    2.0 * (1.0 - e.y / renderer.height) - 1.0
                );

                // Update the ray's origin and direction using the camera and mouse
                raycast.castMouse(camera, mouse);

                // Just for the feedback in this example - reset each mesh's hit to false
                boxes.forEach(mesh => mesh.isHit = false);

                // raycast.intersectBounds will test against the bounds of each mesh, and
                // return an array of intersected meshes in order of closest to farthest
                const hits = raycast.intersectBounds(boxes);

                // Can intersect with geometry if the bounds aren't enough, or if you need
                // to find out the uv or normal value at the hit point.
                // Optional 2nd and third arguments are backface culling, and max distance
                // Both useful for doing early exits to help optimise.
                // const hits = raycast.intersectMeshes(meshes, {
                //     cullFace: true,
                //     maxDistance: 10,
                //     includeUV: true,
                //     includeNormal: true,
                // });
                // if (hits.length) console.log(hits[0].hit.uv);

                // Update our feedback using this array
                hits.forEach(mesh => mesh.isHit = true);
            }

            // Wrap in load event to prevent checks before page is ready
            document.addEventListener('mousemove', move, false);
            document.addEventListener('touchmove', move, false);
        }

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
