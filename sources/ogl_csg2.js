import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Orbit, Vec3} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300} from "../js/ogl_constants.js";
import {CsgLibrary} from "../js/csg_library.js";
import {CSG} from "../js/csg.js";
import {generateOutputFileBlobUrl, generateCSG} from "../js/csg_tools.js";

function letsgo () {

    let info1 = document.getElementById('info1');
    info1.innerHTML = `<h3>Constructive Solid Geometry (CSG) with the CSG component of <a href="https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide" target="_blank">OpenJSCAD</a></h3>`;;

    let current_code = CsgLibrary.basic_1.code;
    let current3Dobject;

    let positions = [];
    let normals = [];
    let uvs = [];
    let final;
    let geometry, mesh;

    let textarea = document.getElementById('csgcode');
    textarea.value = current_code;
    let warning = document.getElementById('warning');
    let submit = document.getElementById('submit');

    let export_area = document.getElementById('export');

    let downloadLink = document.getElementById('export_link');
    if (downloadLink == undefined) {
        console.warn('Export not possible because the hidden download link is missing');
    } else {
        let export_button_stl = document.createElement('button');
        export_button_stl.style.border = "2px solid #e7e7e7";
        export_button_stl.style.borderRadius = "3px";
        export_button_stl.style.padding = "3px 4px";

        export_button_stl.innerHTML = '&nbsp;Generate STL&nbsp;';
        export_area.appendChild(export_button_stl);
        export_button_stl.addEventListener('click', (evt)=>{
            generateOutputFileBlobUrl(current3Dobject, downloadLink, 'stl' )
        }, false);
    }

    let canvas_area =  document.getElementById('canvas');
    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    canvas_area.appendChild(gl.canvas);
    gl.canvas.style.position = "relative";
    gl.clearColor(1, 1, 1, 1);

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

    function csgshape() {
        positions = [];
        normals = [];
        uvs = [];
        current3Dobject.polygons.forEach(items => {
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
        current3Dobject = generateCSG(CSG, textarea.value, null, warning);
        if (current3Dobject != null) {
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