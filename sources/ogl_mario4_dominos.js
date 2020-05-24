// Adaptation for OGL of an example written by CX20 on this project : https://github.com/cx20/jsdo.it-archives

import {Renderer, Camera, Transform, Program, Mesh, Box, Color, Orbit} from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "Mario & Dominos - physics with Oimo.js";

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
                "闇": "#737373",    // dark grey (for ground)
            };
            if (colorHash.hasOwnProperty(c)) {
                return colorHash[c];
            } else {
                console.warn('color unknown : '+c);
                return colorHash['無'];
            }
        }

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
            uniform vec3 uColor;
            varying vec3 vNormal;
            void main() {
                vec3 normal = normalize(vNormal);
                float lighting = dot(normal, normalize(vec3(-0.3, 0.8, 0.6)));
                gl_FragColor.rgb = uColor + lighting * 0.1;
                gl_FragColor.a = 1.0;
            }
        `;

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
                scale: {
                    x: 70,
                    y: 2,
                    z: 70
                },
                pos: {
                    x: 10,
                    y:-4,
                    z: 10
                },
                rot: {
                    x:0,
                    y:0,
                    z:0
                }
            },
        }

        let oimoGround = world.add({
            type: "box",
            size: [shapes.ground.scale.x, shapes.ground.scale.y, shapes.ground.scale.z],
            pos: [shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z],
            rot: [shapes.ground.rot.x, shapes.ground.rot.y, shapes.ground.rot.z],
            move: false,
            density: 1
        });

        const renderer = new Renderer({dpr: 2});
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 45});
        camera.position.set(0, 40, -40);
        camera.lookAt([0, 0, 0]);
        const controls = new Orbit(camera);

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        const scene = new Transform();

        const groundProgram = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uColor: {value: new Color(getRgbColor("闇"))},
            },
            transparent: false,
            // Don't cull faces so that plane is double sided - default is gl.BACK
            cullFace: null,
        });

        const groundGeometry = new Box(gl,{width: shapes.ground.scale.x, height: shapes.ground.scale.y, depth: shapes.ground.scale.z});
 //       const groundGeometry = new Box(gl);
        let meshGround = new Mesh(gl, {geometry: groundGeometry, program: groundProgram});
        meshGround.position.set(shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z);
//        meshGround.scale.set(shapes.ground.scale.x, shapes.ground.scale.y, shapes.ground.scale.z);
        meshGround.setParent(scene);


        let DOT_SIZE = 1;
        let w = DOT_SIZE*0.2;
        let h = DOT_SIZE*2;
        let d = DOT_SIZE;

        let cubes = [];

        //let y = -2;
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                let i = x + z * 16;

                let x1 = -1.10+x*(DOT_SIZE*2);
                let y1 = -1 * (DOT_SIZE*2);
                let z1 = -1.20+z*(DOT_SIZE*2);

                let color = getRgbColor(dataSet[i]);

                let cubeProgram = new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {value: new Color(color)},
                    },
                    // Don't cull faces so that plane is double sided - default is gl.BACK
                    cullFace: null,
                });

                const cubeGeometry = new Box(gl, {width: w, height: h, depth: d});

                const cube = new Mesh(gl, {geometry: cubeGeometry, program: cubeProgram});
                cube.position.set(x1, y1, z1);
                cube.setParent(scene);

                let oimoCube = world.add({
                    type: "box",
                    size: [w, h, d],
                    pos: [x1, y1, z1],
                    rot: [0, 0, 0],
                    move: true,
                    density: 1
                });
                cubes.push({oimo: oimoCube, mesh:cube});
            }
        }

        // generate 16 red cubes
        const redCubeProgram = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uColor: {value: new Color(getRgbColor("赤"))},
            },
            // Don't cull faces so that plane is double sided - default is gl.BACK
            cullFace: null,
        });

        const redCubeGeometry = new Box(gl, {width: DOT_SIZE, height: DOT_SIZE, depth: DOT_SIZE});

        setTimeout(()=>{
            for (let i = 0; i < 16; i++ ) {
                let x1 = -1.15;
                let y1 = 5;
                let z1 = -1.20 + i * (DOT_SIZE*2);

                let cube = new Mesh(gl, {geometry: redCubeGeometry, program: redCubeProgram});
                cube.position.set(x1, y1, z1);
                cube.scale.set(DOT_SIZE, DOT_SIZE, DOT_SIZE);
                cube.setParent(scene);

                let oimoCube = world.add({
                    type: "box",
                    size: [DOT_SIZE, DOT_SIZE, DOT_SIZE],
                    pos: [x1, y1, z1],
                    rot: [0, 0, 0],
                    move: true,
                    density: 1
                });
                cubes.push({oimo: oimoCube, mesh:cube});
            }
        }, 3000)


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
