// Adaptation for OGL of this example : https://cx20.github.io/jsdo.it-archives/cx20/ir1R/

import {Renderer, Camera, Transform, Program, Mesh, Box, Color, Orbit, Raycast, Vec2} from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "Jenga structure - Oimo.js for gravity and collisionss";

    const starter = () => {

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

        //oimo var

        var grounds = [];
        var meshes = [];

        //var world = new OIMO.World(1/60, 2);

        //      var world = new OIMO.World({info:true, worldscale:100} );
        //      world.gravity = new OIMO.Vec3(0, -9.8, 0);

        var ToRad = Math.PI / 180;
        var ToDeg = 180 / Math.PI;

        var world = new OIMO.World({
            timestep: 1/60 * 5,
            iterations: 8,
            broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
            random: true,  // randomize sample
            info: false,   // calculate statistic or not
            gravity: [0,-9.8,0],
            worldscale:1
        });


        const renderer = new Renderer();
        const gl = renderer.gl;
        document.body.appendChild(gl.canvas);
        gl.clearColor(1, 1, 1, 1);

        const camera = new Camera(gl, {fov: 60, near:1, far:5000});
        camera.position.set(0, 160, 400);
        //    camera.lookAt([0, 0, 0]);

        const controls = new Orbit(camera);
        /*
        controls.userPan = false;
        controls.userPanSpeed = 0.0;
        controls.maxDistance = 5000.0;
        controls.maxPolarAngle = Math.PI * 0.4;
        controls.autoRotate = false;     // true : Rotation automatique ; false : nope
        controls.autoRotateSpeed = 5.0;  // Vitesse lors de la rotation automatique
*/
        function resize() {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
        }

        window.addEventListener('resize', resize, false);
        resize();

        const scene = new Transform();

        function generateProgram(c="DG") {
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


        // Is all the physics setting for rigidbody
        var config = {};
        /*
        var config = {
            move: true, // dynamic or statique
            density: 1, // The density of the shape.
            friction: 0.4, // The coefficient of friction of the shape.
            restitution: 0.2, // The coefficient of restitution of the shape.
            belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            collidesWith: all // The bits of the collision groups with which the shape collides.
        };
         */

        function addStaticBox(size, position, rotation, world, config) {
            let mesh = new Mesh(gl, {geometry: groundGeometry, program: groundProgram});

            mesh.position.set( position[0], position[1], position[2] );
            mesh.scale.set( size[0], size[1], size[2] );
            mesh.rotation.set( rotation[0]*ToRad, rotation[1]*ToRad, rotation[2]*ToRad );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.setParent(scene);

            let oimo_params = {
                //    type: 'box', // type of shape : sphere, box, cylinder
                size: size, // size of shape
                pos: position, // start position in degree
                //rot: [0, 0, 0], // start rotation in degree
                world: world,
                move: false,
                density:1
            };

            let body = world.add(oimo_params);

            grounds.push({oimo: body, mesh:mesh});
        }

        //add ground
        addStaticBox([40, 40, 390], [-180,20,0], [0,0,0], world, config);
        addStaticBox([40, 40, 390], [180,20,0], [0,0,0], world, config);
        addStaticBox([400, 80, 400], [0,-40,0], [0,0,0], world, config);

        console.log(grounds);

        //var max = 100; // document.getElementById("MaxNumber").value;
        //var max = 440;
        var max = 39;

        //type = 3;
        //type = 1;
        var type = 2;

        // reset old
        world.clear();

        // now add object
        var i = max;

        const boxGeometry = new Box(gl);
        const boxProgram = generateProgram("BG");

        while (i--){
            let t = type;
            let x = -100 + Math.random()*200;
            let z = -100 + Math.random()*200;
            let y = 100 + Math.random()*1000;
            let w = 10 + Math.random()*10;
            let h = 10 + Math.random()*10;
            let d = 10 + Math.random()*10;

            // belongsTo: 1, // The bits of the collision groups to which the shape belongs.
            // collidesWith: all // The bits of the collision groups with which the shape collides.

            //if(t===2){

                let body_params = {};
                body_params['type'] = 'box' ; // type of shape : sphere, box, cylinder
                body_params['size'] = [w,h,d]; // size of shape
                body_params['pos'] = [x,y,z]; // start position in degree
                //body_params['rot'] = rot; // start rotation in degree
                body_params['move'] = true;
                body_params['world'] = world;
                let body = world.add(body_params);

                let mesh = new Mesh(gl, {geometry: boxGeometry, program: boxProgram});
                mesh.position.set( x, y, z );
                //mesh.rotation.set( rot[0], rot[1], rot[2] );
                mesh.scale.set( w, h, d );

                //mesh.castShadow = true;
                //mesh.receiveShadow = true;

                meshes.push({oimo: body, mesh:mesh});
                mesh.setParent(scene);
            //}
            /*
                    if(t===3){
                        config[3] = group3;
                        bodies[i] = new OIMO.Body({type:'cylinder', size:[w,h,w], pos:[x,y,z], move:true, world:world, config:config});
                        meshes[i] = new THREE.Mesh( buffgeoCylinder, matKoala );
                        meshes[i].scale.set( w, h, d );
                    }
            */

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

        function update() {
            requestAnimationFrame(update);
            controls.update();

            world.step();

            for (let i=meshes.length-1; i>-1; --i) {
                let item = meshes[i];
                if(!item.oimo.sleeping) {

                    let pos = item.oimo.getPosition();
                    item.mesh.position.x = pos.x;
                    item.mesh.position.y = pos.y;
                    item.mesh.position.z = pos.z;

                    let rot = item.oimo.getQuaternion();
                    item.mesh.rotation.x = rot.x;
                    item.mesh.rotation.y = rot.y;
                    item.mesh.rotation.z = rot.z;


                    if (item.mesh.position.y < -200) {
                        let x = -100 + Math.random() * 200;
                        let z = -100 + Math.random() * 200;
                        let y = 100 + Math.random() * 1000;
                        item.oimo.resetPosition(x, y, z);
                    }


                }

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
