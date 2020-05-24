import { Renderer, Camera, Transform, Program, Mesh, Box, Orbit } from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : mutiboxes 1" ;

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
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                gl_FragColor.rgb = vec3(0.2, 0.8, 1.0) + lighting * 0.1;
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
            });


            for (let j=0; j<30; j+=5) {
                for (let i = 0; i < 10; i++) {
                    for (let k=15; k>-15; k-=3) {

                        const cube = new Mesh(gl, { geometry: cubeGeometry, program });
                        cube.position.set((i - 5) * 3, k, j);
                        cube.setParent(scene);

                    }
                }
            }

            function update() {
                requestAnimationFrame(update);
                controls.update();
             //   cube.rotation.y -= 0.04;
                renderer.render({ scene, camera });
            }

            requestAnimationFrame(update);
        }

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
