// Adaptation for OGL of an example written by CX20 on this project : https://github.com/cx20/jsdo.it-archives

import {Renderer, Camera, Transform, Texture, Program,  Mesh, Box, Orbit} from '../js/ogl/ogl.js';

{

    let info = document.getElementById('info');
    info.innerHTML = "Frog - mapping image on cubes (physics with Oimo.js)" ;

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
            camera.position.set(0, 0, -10);

            const controls = new Orbit(camera);

            function resize() {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
            }

            window.addEventListener('resize', resize, false);
            resize();

            const world = new OIMO.World({
                timestep: 1/60 * 2,
                iterations: 8,
                broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
                worldscale: 1, // scale full world
                random: true,  // randomize sample
                info: false,   // calculate statistic or not
                gravity: [0,-9.8,0]
            });

            let shapes = {
                cube: {
                    side: {
                        x: 1,
                        y: 1,
                        z: 1
                    },
                    pos: {
                        x:0,
                        y:4,
                        z:0
                    },
                    rot: {
                        x:0,
                        y:0,
                        z:0
                    }
                },
                ground: {
                    side: {
                        x: 4,
                        y: .2,
                        z: 4
                    },
                    pos: {
                        x:0,
                        y:-2,
                        z:0
                    },
                    rot: {
                        x:0,
                        y:0,
                        z:0
                    }
                },
            }

            let oimoCube = world.add({
                type: "box",
                size: [shapes.cube.side.x, shapes.cube.side.y, shapes.cube.side.z],
                pos: [shapes.cube.pos.x, shapes.cube.pos.y, shapes.cube.pos.z],
                rot: [shapes.cube.rot.x, shapes.cube.rot.y, shapes.cube.rot.z],
                move: true,
                density: 1
            });

            let oimoGround = world.add({
                type: "box",
                size: [shapes.ground.side.x, shapes.ground.side.y, shapes.ground.side.z],
                pos: [shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z],
                rot: [shapes.ground.rot.x, shapes.ground.rot.y, shapes.ground.rot.z],
                move: false,
                density: 1
            });

            const scene = new Transform();

            const texture = new Texture(gl);

            // update image value with source once loaded
            const img = new Image();
            img.src = '../assets/frog_AkwjW.jpg';
            img.onload = () => texture.image = img;

            const program = new Program(gl, {
                vertex,
                fragment,
                uniforms: {
                    tMap: {value: texture},
                },
                cullFace: null,
            });

            const imgGeometry1 = new Box(gl, {width: shapes.cube.side.x, height: shapes.cube.side.y, depth: shapes.cube.side.z});

            const boxMesh1 = new Mesh(gl, {
                geometry: imgGeometry1,
                program: program
            });
            boxMesh1.position.set(shapes.cube.pos.x, shapes.cube.pos.y, shapes.cube.pos.z);
            boxMesh1.rotation.set(shapes.cube.rot.x, shapes.cube.rot.y, shapes.cube.rot.z);
            //boxMesh1.scale.set(1.5);
            boxMesh1.setParent(scene);

            const imgGeometry2 = new Box(gl, {width: shapes.ground.side.x, height: shapes.ground.side.y, depth: shapes.ground.side.z});

            const boxMesh2 = new Mesh(gl, {
                geometry: imgGeometry2,
                program: program
            });
            boxMesh2.position.set(shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z);
            //boxMesh2.scale.set(1.5);
            boxMesh2.setParent(scene);

            function update(t) {
                requestAnimationFrame(update);
                controls.update();

                world.step();

                let pos = oimoCube.getPosition();
                boxMesh1.position.set(pos.x, pos.y, pos.z);
                let rot = oimoCube.getQuaternion();
                boxMesh1.rotation.set(rot.x, rot.y, rot.z, rot.w);

                renderer.render({scene, camera});
            }

            requestAnimationFrame(update);

        }
    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
