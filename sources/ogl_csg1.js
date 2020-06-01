import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Orbit, Vec3} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300} from "../js/ogl_constants.js";
import {CSG} from "../js/csg.js";

function letsgo() {

    let info1 = document.getElementById('info1');
    info1.innerHTML = `<h3>Constructive Solid Geometry (CSG) with the CSG component of <a href="https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide" target="_blank">OpenJSCAD</a></h3>`;;
    info1.innerHTML += `<pre>
var a = CSG.cube({ center: [-0.5, -0.5, -0.5] });
var b = CSG.sphere({ radius: 1.3, center: [0.5, 0.5, 0.5] });
</pre>
<h4>Keys :</h4><pre> 
a => only a
b => only b
c => a.union(b)
d => a.subtract(b)
e => a.intersect(b)</pre>
`;

    let info2 =  document.getElementById('info2');
    info2.innerHTML = 'Current : a.union(b)';

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    const camera = new Camera(gl, {fov: 35});
    camera.position.set(8, 5, 15);
    camera.lookAt([0, 1.5, 0]);

    let mesh, geometry;

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

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

    // generate shape
    let a = CSG.cube({ center: [-0.5, -0.5, -0.5] });
    let b = CSG.sphere({ radius: 1.3, center: [0.5, 0.5, 0.5] });
    let final = a.union(b);

    let positions = [];
    let normals = [];
    let uvs = [];

    function csgshape() {
        positions = [];
        normals = [];
        uvs = [];
        final.polygons.forEach(items => {
            let last = null;
            items.vertices.forEach((vertex, idx) => {
                if (idx == 0) {
                    last = vertex;
                }
                positions.push(vertex.pos.x);
                positions.push(vertex.pos.y);
                positions.push(vertex.pos.z);
                if (vertex.normal) {
                    normals.push(vertex.normal.x);
                    normals.push(vertex.normal.y);
                    normals.push(vertex.normal.z);
                }
            });
            positions.push(last.pos.x);
            positions.push(last.pos.y);
            positions.push(last.pos.z);
            if (last.normal) {
                normals.push(last.normal.x);
                normals.push(last.normal.y);
                normals.push(last.normal.z);
            }
        });
    }

    csgshape();

    geometry = new Geometry(gl, {
        position: {size: 3, data: new Float32Array(positions)},
        //uv: {size: 2, data: new Float32Array(uvs)},
        normal: {size: 3, data: new Float32Array(normals)},
    });

    mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
    mesh.setParent(scene);

    /*
    a => only a
    b => only b
    c => a.union(b)
    d => a.subtract(b)
    e => a.intersect(b)
     */
    function keyPressed (e) {
        // Documentation about keyboard events :
        //    https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
        if (e.key == 'a' || e.key == 'A') {
            info2.innerHTML = 'Current key: "a" => only a';
            final = a;
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            scene.removeChild(mesh);
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }
        if (e.key == 'b' || e.key == 'B') {
            info2.innerHTML = 'Current key: "b" => only b';
            final = b;
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            scene.removeChild(mesh);
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }
        if (e.key == 'c' || e.key == 'C') {
            info2.innerHTML = 'Current key: "c" => a.union(b)';
            final = a.union(b);
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            scene.removeChild(mesh);
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }
        if (e.key == 'd' || e.key == 'D') {
            info2.innerHTML = 'Current key: "d" => a.subtract(b)';
            final = a.subtract(b);
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            scene.removeChild(mesh);
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }
        if (e.key == 'e' || e.key == 'E') {
            info2.innerHTML = 'Current key: "e" => a.intersect(b)';
            final = a.intersect(b);
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            scene.removeChild(mesh);
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }

    }

    document.addEventListener('keydown', keyPressed, false);

    function update() {
        requestAnimationFrame(update);
        controls.update();
      //  if (mesh) mesh.rotation.y -= 0.005;
        renderer.render({scene, camera});
    }
    requestAnimationFrame(update);
}

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");
    letsgo();
});