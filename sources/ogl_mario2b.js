// Adaptation for OGL of an example written by CX20 on this project : https://github.com/cx20/jsdo.it-archives

import {Renderer, Camera, Transform, Program, Mesh, Box, Texture, Color, Orbit} from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : Mario - physics with Oimo + texture";

    const starter = () => {

        // ‥‥‥‥‥‥‥‥‥‥‥‥‥□□□
        // ‥‥‥‥‥‥〓〓〓〓〓‥‥□□□
        // ‥‥‥‥‥〓〓〓〓〓〓〓〓〓□□
        // ‥‥‥‥‥■■■□□■□‥■■■
        // ‥‥‥‥■□■□□□■□□■■■
        // ‥‥‥‥■□■■□□□■□□□■
        // ‥‥‥‥■■□□□□■■■■■‥
        // ‥‥‥‥‥‥□□□□□□□■‥‥
        // ‥‥■■■■■〓■■■〓■‥‥‥
        // ‥■■■■■■■〓■■■〓‥‥■
        // □□■■■■■■〓〓〓〓〓‥‥■
        // □□□‥〓〓■〓〓□〓〓□〓■■
        // ‥□‥■〓〓〓〓〓〓〓〓〓〓■■
        // ‥‥■■■〓〓〓〓〓〓〓〓〓■■
        // ‥■■■〓〓〓〓〓〓〓‥‥‥‥‥
        // ‥■‥‥〓〓〓〓‥‥‥‥‥‥‥‥
        var dataSet = [
            "無", "無", "無", "無", "無", "無", "無", "無", "無", "無", "無", "無", "無", "肌", "肌", "肌",
            "無", "無", "無", "無", "無", "無", "赤", "赤", "赤", "赤", "赤", "無", "無", "肌", "肌", "肌",
            "無", "無", "無", "無", "無", "赤", "赤", "赤", "赤", "赤", "赤", "赤", "赤", "赤", "肌", "肌",
            "無", "無", "無", "無", "無", "茶", "茶", "茶", "肌", "肌", "茶", "肌", "無", "赤", "赤", "赤",
            "無", "無", "無", "無", "茶", "肌", "茶", "肌", "肌", "肌", "茶", "肌", "肌", "赤", "赤", "赤",
            "無", "無", "無", "無", "茶", "肌", "茶", "茶", "肌", "肌", "肌", "茶", "肌", "肌", "肌", "赤",
            "無", "無", "無", "無", "茶", "茶", "肌", "肌", "肌", "肌", "茶", "茶", "茶", "茶", "赤", "無",
            "無", "無", "無", "無", "無", "無", "肌", "肌", "肌", "肌", "肌", "肌", "肌", "赤", "無", "無",
            "無", "無", "赤", "赤", "赤", "赤", "赤", "青", "赤", "赤", "赤", "青", "赤", "無", "無", "無",
            "無", "赤", "赤", "赤", "赤", "赤", "赤", "赤", "青", "赤", "赤", "赤", "青", "無", "無", "茶",
            "肌", "肌", "赤", "赤", "赤", "赤", "赤", "赤", "青", "青", "青", "青", "青", "無", "無", "茶",
            "肌", "肌", "肌", "無", "青", "青", "赤", "青", "青", "黄", "青", "青", "黄", "青", "茶", "茶",
            "無", "肌", "無", "茶", "青", "青", "青", "青", "青", "青", "青", "青", "青", "青", "茶", "茶",
            "無", "無", "茶", "茶", "茶", "青", "青", "青", "青", "青", "青", "青", "青", "青", "茶", "茶",
            "無", "茶", "茶", "茶", "青", "青", "青", "青", "青", "青", "青", "無", "無", "無", "無", "無",
            "無", "茶", "無", "無", "青", "青", "青", "青", "無", "無", "無", "無", "無", "無", "無", "無"
        ];

        function getRgbColor(c) {
            var colorHash = {
                "無": "#DCAA6B",    // beige (for background or Mario)
                "白": "#ffffff",    // white
                "肌": "#ffcccc",    // skin
                "茶": "#800000",    // tea
                "赤": "#ff0000",    // red
                "黄": "#ffff00",    // yellow
                "緑": "#00ff00",    // green
                "水": "#00ffff",    // water
                "青": "#0000ff",    // blue
                "紫": "#800080",    // purple
            };
            return colorHash[c];
        }

        const vertex4cube = /* glsl */ `
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

        const fragment4cube = /* glsl */ `
            precision highp float;
            precision highp int;
            uniform vec3 uColor;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                gl_FragColor.rgb = uColor + lighting * 0.1;
                gl_FragColor.a = 1.0;
            }
        `;

        const vertex4texture = /* glsl */ `
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

        const fragment4texture = /* glsl */ `
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


        const renderer = new Renderer({dpr: 2});
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 45});
        camera.position.set(0, 0, -60);
        camera.lookAt([0, 0, 0]);
        const controls = new Orbit(camera);

        // Upload empty texture while source loading
        const texture = new Texture(gl);

        const img = new Image();
        img.src = '../assets/frog_AkwjW.jpg';
        img.onload = () => texture.image = img;

        var world = new OIMO.World({
            timestep: 1/60 * 5,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world
            random: true,  // randomize sample
            info: false,   // calculate statistic or not
            gravity: [0,-9.8,0]
        });

        let shapes = {
            ground: {
                side: {
                    x: 30,
                    y: 2,
                    z: 30
                },
                pos: {
                    x:0,
                    y:-20,
                    z:0
                },
                rot: {
                    x:0,
                    y:0,
                    z:0
                }
            },
        }

        var oimoGround = world.add({
            type: "box",
            size: [shapes.ground.side.x, shapes.ground.side.y, shapes.ground.side.z],
            pos: [shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z],
            rot: [shapes.ground.rot.x, shapes.ground.rot.y, shapes.ground.rot.z],
            move: false,
            density: 1
        });

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        const scene = new Transform();

        const groundProgram = new Program(gl, {
            vertex: vertex4texture,
            fragment: fragment4texture,
            uniforms: {
                tMap: {value: texture},
            },
            cullFace: null,
        });

        const groundGeometry = new Box(gl, {width: shapes.ground.side.x, height: shapes.ground.side.y, depth: shapes.ground.side.z});
        let meshGround = new Mesh(gl, {geometry: groundGeometry, program: groundProgram});
        meshGround.position.set(shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z);
        meshGround.setParent(scene);

        let side = 0.8;
        const cubeGeometry = new Box(gl, {width: side, height: side, depth: side});

        let cubes = [];

        for (let i = 0, len = dataSet.length; i < len; i++) {
            let x = i % 16;
            let y = Math.floor(i / 16);
            let px = x - 8;
            let pz = -(y - 8);
            let color = getRgbColor(dataSet[i]);

            const cubeProgram = new Program(gl, {
                vertex: vertex4cube,
                fragment: fragment4cube,
                uniforms: {
                    uColor: {value: new Color(color)},
                },
                // Don't cull faces so that plane is double sided - default is gl.BACK
                cullFace: null,
            });

            const cube = new Mesh(gl, {geometry: cubeGeometry, program: cubeProgram});
            cube.position.set(px, pz, 0);
            cube.setParent(scene);

            let oimoCube = world.add({
                type: "box",
                size: [side, side, side],
                pos: [px, pz, 0],
                rot: [0, 0, 0],
                move: true,
                density: 1
            });
            cubes.push({oimo: oimoCube, mesh:cube});
        }

        function update() {
            requestAnimationFrame(update);
            controls.update();

            world.step();

            for (let i=0, len=cubes.length; i<len; i++) {
                let cube = cubes[i];
                let pos = cube.oimo.getPosition();
                cube.mesh.position.set(pos.x, pos.y, pos.z);
                let rot = cube.oimo.getQuaternion();
                cube.mesh.rotation.set(rot.x, rot.y, rot.z, rot.w);
            }

            renderer.render({scene, camera});
        }

        requestAnimationFrame(update);

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
