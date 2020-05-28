// Adaptation for OGL of this example : https://cx20.github.io/jsdo.it-archives/cx20/ir1R/

import {Renderer, Camera, Transform, Program, Mesh, Box, Color, Orbit, Sphere, Cylinder, Raycast, Vec2} from '../js/ogl/ogl.js';

{
    let info1 = document.getElementById('info1');
    info1.innerHTML = "Basic example of collisions with Oimo.js";
    let info2 = document.getElementById('info2');
    info2.innerHTML = '"S" key : spheres <br>';
    info2.innerHTML += '"B" key : boxes <br>';
    info2.innerHTML += '"C" key : cylinders <br>';

    const starter = () => {

        function getRgbColor(c) {
            var colorHash = {
                "BK": "#dcaa6b", // black
                "WH": "#FFFFFF", // white
                "BG": "#FFCCCC", // beige
                "BR": "#800000", // brown
                "RD": "#FF0000", // red
                "YL": "#FFFF00", // yellow
                "GN": "#00FF00", // green
                "WT": "#00FFFF", // water
                "BL": "#0000FF", // blue
                "PR": "#800080",  // purple
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

        function randomIntFromRange(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        var meshes = [];

        //    var ToRad = Math.PI / 180;
        //    var ToDeg = 180 / Math.PI;

        var world = new OIMO.World({
            timestep: 1 / 60 * 5,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            worldscale: 1, // scale full world
            random: true,  // randomize sample
            info: false,   // calculate statistic or not
            gravity: [0, -9.8, 0]
        });

        const renderer = new Renderer({dpr: 2});
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 60, near: 1, far: 5000});
        camera.position.set(0, 160, 400);
        camera.lookAt([0, 0, 0]);

        const controls = new Orbit(camera);

        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        const scene = new Transform();

        function generateProgram(c = "DG") {
            return new Program(gl, {
                vertex,
                fragment,
                uniforms: {
                    uColor: {value: new Color(getRgbColor(c))},
                },
                transparent: false,
                // Don't cull faces so that plane is double sided - default is gl.BACK
                cullFace: null,
            })
        }

        const groundProgram = generateProgram("DG");
        const groundGeometry = new Box(gl);

        function addStaticBox(size, position, rotation) {
            //let groundGeometry = new Box(gl, {width: size[0], height: size[1], depth: size[2]});
            let mesh = new Mesh(gl, {geometry: groundGeometry, program: groundProgram});
            mesh.scale.set(size[0], size[1], size[2]);
            mesh.position.set(position[0], position[1], position[2]);
            mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
            //mesh.castShadow = true;
            //mesh.receiveShadow = true;
            mesh.setParent(scene);

            world.add({
                type: 'box',
                size: size, // size of shape
                pos: position, // start position in degree
                rot: rotation, // start rotation in degree
                //world: world,
                move: false,
                density: 1,
                friction: 0.4, // The coefficient of friction of the shape.
                restitution: .2, // The coefficient of restitution of the shape.
                belongsTo: 1, // The bits of the collision groups to which the shape belongs.
                collidesWith: all // The bits of the collision groups with which the shape collides.
            });
        }

        var max = 50;

        // The Bit of a collision group
        var group1 = 1 << 0;  // 00000000 00000000 00000000 00000001
        var group2 = 1 << 1;  // 00000000 00000000 00000000 00000010
        var group3 = 1 << 2;  // 00000000 00000000 00000000 00000100
        var all = 0xffffffff; // 11111111 11111111 11111111 11111111

        var type = 1;  // 1=sphere ; 2=box ; 3=cylinder

        function populate() {

            for(let i = 0, len=meshes.length; i < len; i++) {
                scene.removeChild(meshes[i].mesh);
            }
            meshes = [];
            world.clear();
            gl.clearColor(1, 1, 1, 1);

            //add ground
            addStaticBox([40, 40, 390], [-180, -20, 0], [0, 0, 0]);
            addStaticBox([40, 40, 390], [180, -20, 0], [0, 0, 0]);
            addStaticBox([400, 60, 400], [0, -70, 0], [0, 0, 0]);

            // now add object
            var i = max;

            const boxGeometry = new Box(gl);
            const allProgram = generateProgram("BG");

            while (i--) {
                let t = type;
                let x = randomIntFromRange(-160, 160); // -100 + Math.random()*200;
                let z = randomIntFromRange(-10, 10); // -100 + Math.random()*200;
                let y = randomIntFromRange(100, 1000); // 100 + Math.random()*1000;
                let w = randomIntFromRange(10, 20); // 10 + Math.random()*10;
                let h = randomIntFromRange(10, 20); // 10 + Math.random()*10;
                let d = randomIntFromRange(10, 20); // 10 + Math.random()*10;

                // belongsTo: 1, // The bits of the collision groups to which the shape belongs.
                // collidesWith: all // The bits of the collision groups with which the shape collides.

                if (t === 1) {
                    let diam = w*0.5;
                    let body = world.add({
                        type: "sphere",
                        size: [diam, diam, diam],
                        pos: [x, y, z],
                        move: true, // dynamic or statique
                        density: 1, // The density of the shape.
                        friction: 0.4, // The coefficient of friction of the shape.
                        restitution: .5, // The coefficient of restitution of the shape.
                        belongsTo: group1, // The bits of the collision groups to which the shape belongs.
                        collidesWith: all // The bits of the collision groups with which the shape collides.
                    });
                    const sphereGeometry = new Sphere(gl, {radius: diam});
                    const mesh = new Mesh(gl, {
                        geometry: sphereGeometry,
                        program: allProgram
                    });
                    mesh.position.set(x, y, z);
                    mesh.setParent(scene);
                    meshes.push({oimo: body, mesh: mesh});
                }

                if (t === 2) {
                    let body = world.add({
                        type: "box",
                        size: [w, h, d],
                        pos: [x, y, z],
                        move: true, // dynamic or statique
                        density: 1, // The density of the shape.
                        friction: 0.4, // The coefficient of friction of the shape.
                        restitution: .5, // The coefficient of restitution of the shape.
                        belongsTo: group2, // The bits of the collision groups to which the shape belongs.
                        collidesWith: all // The bits of the collision groups with which the shape collides.
                    });
                    let mesh = new Mesh(gl, {geometry: boxGeometry, program: allProgram});
                    mesh.position.set(x, y, z);
                    mesh.scale.set(w, h, d);
                    mesh.setParent(scene);
                    meshes.push({oimo: body, mesh: mesh});
                }

                if (t === 3) {
                    let body = world.add({
                        type: 'cylinder',
                        size: [w, h, w],
                        pos: [x, y, z],
                        move: true,
                        density: 1, // The density of the shape.
                        friction: 0.4, // The coefficient of friction of the shape.
                        restitution: .5, // The coefficient of restitution of the shape.
                        belongsTo: group3, // The bits of the collision groups to which the shape belongs.
                        collidesWith: all // The bits of the collision groups with which the shape collides.
                    });
                    let cylinderGeometry = new Cylinder(gl, {radiusTop: w, radiusBottom: w, height: h, radialSegments: 24});
                    let mesh = new Mesh(gl, {geometry: cylinderGeometry, program: allProgram});
                    mesh.position.set(x, y, z);
                    mesh.setParent(scene);
                    meshes.push({oimo: body, mesh: mesh});
                }

            }

            /*
            config[3] = 1;
            config[4] = all;
            const buffProgram = generateProgram("PR");
            bodies[max] = new OIMO.Body({size:[20, 40, 60], pos:[-150,20,0], rot:[0,0,0], move:true, noSleep:true, world:world, config:config});
            meshes[max] = new Mesh(gl, {geometry: boxGeometry, program: buffProgram});
            meshes[max].scale.set( 20, 40, 60 );
            scene.add( meshes[max] );
            */
        }

        function update() {
            requestAnimationFrame(update);
            controls.update();

            world.step();

            for (let i = 0, len = meshes.length; i < len; i++) {
                let item = meshes[i];

                let pos = item.oimo.getPosition();
                item.mesh.position.set(pos.x, pos.y, pos.z);

                //  https://github.com/oframe/ogl/issues/71#issuecomment-635138816
                // let rot = item.oimo.getQuaternion();
                // item.mesh.rotation.set(rot.x, rot.y, rot.z, rot.w);
                // => not good because the rotation property on Mesh or Transform is in Euler coordinates (XYZ)
                // solution :
                let quat = item.oimo.getQuaternion();
                item.mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w);

                if (item.mesh.position.y < -200) {
                    let x = randomIntFromRange(-160, 160);
                    let z = randomIntFromRange(-10, 10);
                    let y = randomIntFromRange(100, 1000);
                    item.oimo.resetPosition(x, y, z);
                }

            }

            renderer.render({scene, camera});
        }

        function keyPressed (e) {
            // Documentation about keyboard events :
            //    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
            if (e.key == 's' || e.key == 'S') {
                type = 1;
                populate();
            }
            if (e.key == 'b' || e.key == 'B') {
                type = 2;
                populate();
            }
            if (e.key == 'c' || e.key == 'C') {
                type = 3;
                populate();
            }
        }

        document.addEventListener('keydown', keyPressed, false);

        populate();

        requestAnimationFrame(update);

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        starter();
    });
}
