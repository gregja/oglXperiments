import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Orbit, Vec3} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300} from "../js/ogl_constants.js";
import {CsgLibrary} from "../js/csg_library.js";

function letsgo () {
    /*
        var a = CSG.cube();
        var b = CSG.sphere({ radius: 1.35, stacks: 12 });
        var c = CSG.cylinder({ radius: 0.7, start: [-1, 0, 0], end: [1, 0, 0] });
        var d = CSG.cylinder({ radius: 0.7, start: [0, -1, 0], end: [0, 1, 0] });
        var e = CSG.cylinder({ radius: 0.7, start: [0, 0, -1], end: [0, 0, 1] });
        var final = a.intersect(b).subtract(c.union(d).union(e));
    */
    // var final = CSG.fromPolygons(c.polygons);
    // final.toMesh();

    let info1 = document.getElementById('info1');
    info1.innerHTML = `<p>Constructive Solid Geometry (CSG) with the CSG component of <a href="https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide" target="_blank">OpenJSCAD</a></p>`;;

    let current_code = CsgLibrary.basic_1.code;

    let positions = [];
    let normals = [];
    let uvs = [];
    let final;
    let geometry, mesh;

    let textarea = document.getElementById('csgcode');
    textarea.value = current_code;
    let warning = document.getElementById('warning');
    let submit = document.getElementById('submit');

    let canvas_area =  document.getElementById('canvas');
    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    canvas_area.appendChild(gl.canvas);
    gl.canvas.style.position = "relative";
    gl.clearColor(1, 1, 1, 1);

//    const camera = new Camera(gl, {fov: 35});
//    camera.position.set(8, 5, 15);
//    camera.lookAt([0, 1.5, 0]);
    const camera = new Camera(gl, {fov: 40, near:1, far:1500});
    camera.position.set(0, 0, -10);
    camera.lookAt([0, 0, 0]);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, 600);
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
    function generate_shape() {
        let code = textarea.value;
        console.log(code);

        warning.innerHTML = '';

        try {
            let res = eval(code);
            console.log(res);
            if (res == undefined) {
                warning.innerHTML = "always finih code with 'final' not prefixed by 'var' like that : <pre>final = ...</pre> ";
                return null;
            }
            return res;
        } catch(error) {
            console.warn(error);
            warning.innerHTML = error;
            return null;
        }
    }

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

    submit.addEventListener("click",(evt)=>{
        evt.preventDefault();
        let res = generate_shape();
        if (res != null) {
            final = res;
            csgshape();
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(positions)},
                //uv: {size: 2, data: new Float32Array(uvs)},
                normal: {size: 3, data: new Float32Array(normals)},
            });
            if (mesh != undefined) {
                scene.removeChild(mesh);
            }
            mesh = new Mesh(gl, {mode: gl.TRIANGLE_STRIP, geometry, program});
            mesh.setParent(scene);
        }
    }, false);

    // generate first shape
    submit.click();

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