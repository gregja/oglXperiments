/*
   Gear generator : largely inspired by this example : https://joostn.github.io/OpenJsCad/
 */

import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Orbit, Vec3} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes} from "../js/ogl_constants.js";
import {CsgLibrary} from "../js/csg_library.js";
import {CSG} from "../js/csg.js";
import {generateOutputFileBlobUrl, generateCSG, generateTableForm} from "../js/csg_tools.js";

function letsgo () {

    const fan_preferred = false; // shape better rendered with false, set to true for an experimental rendering (good for TRIANGLE_FAN mode)

    let settings = {
        rendering: 'TRIANGLES',
        isRotating: false,
    };

    let info1 = document.getElementById('info1');
    info1.innerHTML = `<h3>Constructive Solid Geometry (CSG) with the CSG component of <a href="https://en.wikibooks.org/wiki/OpenJSCAD_User_Guide" target="_blank">OpenJSCAD</a></h3>`;;

    let externalShape = CsgLibrary.gear_01;

    let current3Dobject;
    let data_dictionary = generateTableForm('gearparams', externalShape.params);

    let positions = [];
    let normals = [];
    let uvs = [];

    let geometry, mesh;

    //let warning = document.getElementById('warning');
    let submit = document.getElementById('update');
    submit.style.border = "2px solid #e7e7e7";
    submit.style.borderRadius = "3px";
    submit.style.padding = "3px 4px";

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
            generateOutputFileBlobUrl(current3Dobject, downloadLink, 'stl', 'gear_CSG' )
        }, false);
    }

    let canvas_area =  document.getElementById('canvas');
    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    canvas_area.appendChild(gl.canvas);
    gl.canvas.style.position = "relative";
    gl.clearColor(1, 1, 1, 1);

    const camera = new Camera(gl, {fov: 40, near:1, far:1500});
    camera.position.set(0, 0, -60);
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

        // voir aussi : CSG.prototype.toStlBinary  (dans csg.js)
        current3Dobject.fixTJunctions();
        current3Dobject.polygons.forEach((p) => {
           let numvertices = p.vertices.length;
           for (let i = 0; i < numvertices - 2; i++) {

               if (fan_preferred) {
                   let normal = p.plane.normal;
                   normals.push(normal._x);
                   normals.push(normal._y);
                   normals.push(normal._z);
                   positions.push(normal._x);
                   positions.push(normal._y);
                   positions.push(normal._z);
               }

               for (let v = 0; v < 3; v++) {
                   let vv = v + ((v > 0) ? i : 0);
                   let vertexpos = p.vertices[vv].pos;

                   if (fan_preferred) {
                       normals.push(vertexpos._x);
                       normals.push(vertexpos._y);
                       normals.push(vertexpos._z);
                   }

                   positions.push(vertexpos._x);
                   positions.push(vertexpos._y);
                   positions.push(vertexpos._z);
               }
           }

        });

    }

    const addGui = (obj) => {
        let gui = new dat.gui.GUI();

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            if (mesh != undefined) {
                scene.removeChild(mesh);
            }
            mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            mesh.setParent(scene);
        });

        let gui_spinning = gui.add(obj, 'isRotating').listen();
        gui_spinning.onChange(function(value){
            obj.isRotating = Boolean(value);
        });

    };
    addGui(settings);

    submit.addEventListener("click",(evt)=>{
        evt.preventDefault();
        // collect parameters from formulary
        let xdata = {};
        data_dictionary.forEach(item => {
            xdata[item.id] = Number(item.value);
        });
        current3Dobject = generateCSG(CSG, externalShape.code, xdata);
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
            mesh = new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            mesh.setParent(scene);
        }
    }, false);

    // generate first shape
    submit.click();

    function update() {
        requestAnimationFrame(update);
        controls.update();
        if (settings.isRotating) mesh.rotation.y -= 0.005;
        renderer.render({scene, camera});
    }
    requestAnimationFrame(update);
}

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");
    letsgo();
});