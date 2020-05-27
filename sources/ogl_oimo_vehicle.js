// Adaptation for OGL of this Ammo.js example : https://github.com/kripken/ammo.js/tree/master/examples/webgl_demo_vehicle

import {Renderer, Camera, Transform, Program, Mesh, Box, Color, Orbit, Raycast, Vec2} from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : Mario - physics with Oimo.js";

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
            "BK","BK","BK","BK","BK","BK","BK","BK","BK","BK","BK","BK","BK","BG","BG","BG",
            "BK","BK","BK","BK","BK","BK","RD","RD","RD","RD","RD","BK","BK","BG","BG","BG",
            "BK","BK","BK","BK","BK","RD","RD","RD","RD","RD","RD","RD","RD","RD","BG","BG",
            "BK","BK","BK","BK","BK","BR","BR","BR","BG","BG","BR","BG","BK","RD","RD","RD",
            "BK","BK","BK","BK","BR","BG","BR","BG","BG","BG","BR","BG","BG","RD","RD","RD",
            "BK","BK","BK","BK","BR","BG","BR","BR","BG","BG","BG","BR","BG","BG","BG","RD",
            "BK","BK","BK","BK","BR","BR","BG","BG","BG","BG","BR","BR","BR","BR","RD","BK",
            "BK","BK","BK","BK","BK","BK","BG","BG","BG","BG","BG","BG","BG","RD","BK","BK",
            "BK","BK","RD","RD","RD","RD","RD","BL","RD","RD","RD","BL","RD","BK","BK","BK",
            "BK","RD","RD","RD","RD","RD","RD","RD","BL","RD","RD","RD","BL","BK","BK","BR",
            "BG","BG","RD","RD","RD","RD","RD","RD","BL","BL","BL","BL","BL","BK","BK","BR",
            "BG","BG","BG","BK","BL","BL","RD","BL","BL","YL","BL","BL","YL","BL","BR","BR",
            "BK","BG","BK","BR","BL","BL","BL","BL","BL","BL","BL","BL","BL","BL","BR","BR",
            "BK","BK","BR","BR","BR","BL","BL","BL","BL","BL","BL","BL","BL","BL","BR","BR",
            "BK","BR","BR","BR","BL","BL","BL","BL","BL","BL","BL","BK","BK","BK","BK","BK",
            "BK","BR","BK","BK","BL","BL","BL","BL","BK","BK","BK","BK","BK","BK","BK","BK"
        ];

        function getRgbColor(c)
        {
            var colorHash = {
                "BK":"#dcaa6b", // black
                "WH":"#FFFFFF", // white
                "BG":"#FFCCCC", // beige
                "BR":"#800000", // brown
                "RD":"#FF0000", // red
                "YL":"#FFFF00", // yellow
                "GN":"#00FF00", // green
                "WT":"#00FFFF", // water
                "BL":"#0000FF", // blue
                "PR":"#800080",  // purple
                "DG": "#737373",    // dark grey (for ground)
            };
            return colorHash[c];
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
                side: {
                    x: 100,
                    y: 4,
                    z: 100
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

        let oimoGround = world.add({
            type: "box",
            size: [shapes.ground.side.x, shapes.ground.side.y, shapes.ground.side.z],
            pos: [shapes.ground.pos.x, shapes.ground.pos.y, shapes.ground.pos.z],
            rot: [shapes.ground.rot.x, shapes.ground.rot.y, shapes.ground.rot.z],
            move: false,
            density: 1
        });

        const renderer = new Renderer();
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 40, near:1, far:1500});
        camera.position.set(0, 30, 30);
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
                uColor: {value: new Color(getRgbColor("DG"))},
            },
            transparent: false,
            // Don't cull faces so that plane is double sided - default is gl.BACK
            cullFace: null,
        });


        let mouseCoords = new Vec2();
        let side = 2; // 0.8;
        const cubeGeometry = new Box(gl, {width: side, height: side, depth: side*2});

        let cubes = [];
        let k = 0;
        let px = 0;
        let py = 0;
        let ymax = 0;
        for (let j = 0; j < 16; j+= 1) {
            px = 0;
            py += -(side + .01)  ; // -(y - 8);
            for (let i = 0; i < 16; i += 1) {
                px += side + .2;
                ymax = py;
                let color = getRgbColor(dataSet[k]);
                k++;

                const cubeProgram = new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        uColor: {value: new Color(color)},
                    },
                    // Don't cull faces so that plane is double sided - default is gl.BACK
                    cullFace: null,
                });

                const cube = new Mesh(gl, {geometry: cubeGeometry, program: cubeProgram});
                cube.position.set(px, py, 0);
                cube.setParent(scene);

                let oimoCube = world.add({
                    type: "box",
                    size: [side, side, side*2],
                    pos: [px, py, 0],
                    rot: [0, 0, 0],
                    move: true,
                    density: 1
                });
                cubes.push({oimo: oimoCube, mesh:cube});
            }
        }
console.log(ymax);
        let ymax2 = ymax-(side+side/2) - .1;
        console.log(ymax2);
        const groundGeometry = new Box(gl, {width: shapes.ground.side.x, height: shapes.ground.side.y, depth: shapes.ground.side.z});
        let meshGround = new Mesh(gl, {geometry: groundGeometry, program: groundProgram});
        meshGround.position.set(shapes.ground.pos.x, ymax2, shapes.ground.pos.z);
        meshGround.setParent(scene);

        function ballManager(event) {
            mouseCoords.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1
            );
/*
            raycaster.setFromCamera( mouseCoords, camera );

            // Creates a ball and throws it
            var ballMass = 35;
            var ballRadius = 0.4;

            var ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 14, 10 ), ballMaterial );
            ball.castShadow = true;
            ball.receiveShadow = true;
            var ballShape = new Ammo.btSphereShape( ballRadius );
            ballShape.setMargin( margin );
            pos.copy( raycaster.ray.direction );
            pos.add( raycaster.ray.origin );
            quat.set( 0, 0, 0, 1 );
            var ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat );

            pos.copy( raycaster.ray.direction );
            pos.multiplyScalar( 24 );
            ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );

 */
        }
        window.addEventListener( 'mousedown', ballManager, false );

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
