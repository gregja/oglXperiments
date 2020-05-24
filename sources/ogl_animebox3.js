import { Renderer, Camera, Transform, Program, Mesh, Box, Orbit } from '../js/ogl/ogl.js';

{
    let info = document.getElementById('info');
    info.innerHTML = "3D object : anime box with TweenMax" ;

    const update = () => {

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
            camera.position.set(0, 1, 7);
            camera.lookAt([0, 0, 0]);
            const controls = new Orbit(camera);

            function resize() {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
            }

            window.addEventListener('resize', resize, false);
            resize();

            const scene = new Transform();

            const cubeGeometry = new Box(gl);

            const program = new Program(gl, {
                vertex,
                fragment,

                // Don't cull faces so that plane is double sided - default is gl.BACK
                cullFace: null,
            });

            const cube = new Mesh(gl, { geometry: cubeGeometry, program });
            cube.position.set(0, 3, 0);
            cube.setParent(scene);

        /*
        var props = {
            y: 0,
            sx: 1,
            sy: 1,
            rot: 0
        };
        app.timeline.animate(props, { loop: true })
            .when(500, {
                y: 10, rot: Math.PI
            }, 'circularOut')
            .when(1000, {
                y: 0, sx: 1, sy: 1, rot: Math.PI * 2
            }, 'circularIn')
            .when(1300, {
                sx: 2, sy: 0.5
            }, 'circularOut')
            .when(1400, {
                sx: 2, sy: 0.5
            })
            .when(1700, {
                sx: 1, sy: 1, rot: Math.PI * 2
            }, 'circularIn')
            .during(function () {
                movingNode.position.y = props.y;
                movingNode.scale.set(props.sx, props.sy, props.sx);

                cube.rotation.identity().rotateZ(props.rot);
            })
            .start();
        */

            // var t = Math.random() * 0.6 + 0.3;

            TweenMax.to(cube.position, 1.5, {
                y: -1.5,
                ease: 'Bounce.easeOut'
            });

            TweenMax.to( cube.scale, .5, {
                    y: .5,
                    ease: 'Power2.easeInOut',
                    delay: .5
                });

            TweenMax.to( cube.scale, .2, {
                y: 1,
                ease: 'Power2.easeInOut',
                delay: 1.5
            });

            TweenMax.to(cube.position, 1.5, {
                y: 1.5,
                ease: 'Bounce.easeOut',
                delay: 1.6
            });

            TweenMax.to(cube.position, 1.5, {
                y: -1.5,
                ease: 'Bounce.easeOut',
                delay: 3
            });

            requestAnimationFrame(update);
            function update() {
                requestAnimationFrame(update);
                controls.update();

                cube.rotation.y -= 0.04;

                renderer.render({ scene, camera });
            }
        }

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        requestAnimationFrame(update);
    });
}
