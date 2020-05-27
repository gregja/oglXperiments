// adaptation for OGL of this Threejs example : https://github.com/mrdoob/three.js/blob/master/examples/misc_lookat.html

import {Renderer, Camera, Transform, Texture, Program, Cylinder, Sphere, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {fragment100, fragment300, vertex100, vertex300} from "../js/ogl_constants.js";

{

    let info = document.getElementById('info');
    info.innerHTML = `OGL - LookAt example (adaptation of this <a href="https://threejs.org/examples/?q=lookat#misc_lookat" target="_blank">ThreeJS example</a>)`;

    const rot_90 = Math.PI/2;
    const random = Math.random;
    const sin = Math.sin;
    const cos = Math.cos;

    let mouseX = 0, mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    function onDocumentMouseMove( event ) {
        mouseX = ( event.clientX - windowHalfX ) * 10;
        mouseY = ( event.clientY - windowHalfY ) * 10;
    }
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

    const renderer = new Renderer();    // ({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    const camera = new Camera(gl, {fov: 40, near:1, far:15000});
    camera.position.set(0, 0, 3200);
    // const controls = new Orbit(camera);

    const scene = new Transform();

    const texture = new Texture(gl);
    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    const sphereGeometry = new Sphere(gl, {radius: 100, widthSegments:20, heightSegments:20});
    const sphere = new Mesh(gl, {
        geometry: sphereGeometry,
        program: program
    });
    sphere.position.set(0, 0, 0);
    sphere.setParent(scene);

    const cylinderGeometry = new Cylinder(gl, {radiusTop: 0, radiusBottom: 10, height: 100, radialSegments: 24});

    for ( let i = 0; i < 1000; i ++ ) {
        let mesh = new Mesh(gl, {
            geometry: cylinderGeometry,
            program: program
        });
        mesh.position.x = random() * 4000 - 2000;
        mesh.position.y = random() * 4000 - 2000;
        mesh.position.z = random() * 4000 - 2000;

        mesh.scale.x = mesh.scale.y = mesh.scale.z = random() * 4 + 2;
        mesh.setParent( scene );
    }

    function resize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    function animate() {
        requestAnimationFrame(animate);
      //  controls.update();

        render();
        renderer.render({scene, camera});

    }

    function render() {
        let time = Date.now() * 0.0005;

        sphere.position.x = sin( time * 0.7 ) * 2000;
        sphere.position.y = cos( time * 0.5 ) * 2000;
        sphere.position.z = cos( time * 0.3 ) * 2000;

        for ( let i = 1, l = scene.children.length; i < l; i ++ ) {
            let child = scene.children[ i ];
            child.lookAt( sphere.position );
            child.rotation.x += rot_90;
        }

        camera.position.x += ( mouseX - camera.position.x ) * .05;
        camera.position.y += ( - mouseY - camera.position.y ) * .05;
        camera.lookAt( scene.position );
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        requestAnimationFrame(animate);
    });
}
