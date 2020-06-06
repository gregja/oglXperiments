import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
{

    let info = document.getElementById('info');
    var current_shape = 'bee';

    let divider = 500;  // divider to adapt shapes to the WebGL space coordinates
    let geometry, mesh; // global variables to access in different contexts

    let settings = {
        rendering: 'TRIANGLES',
        texture: "0=None",
        name: current_shape,
        isSpinning: false
    };

    function shapeGenerator(value, rendering) {
        info.innerHTML = "3D object : " + value;

        let newshape = shapes3dToolbox.import3dObjAsync ({
            url: "../assets/"+settings.name+".obj.txt",
            scaleTo: 200,
            reorder: false,
            center: true
        }, function(newshape){
            let xportMesh = [];
            newshape.polygons.forEach(polygons => {
                polygons.forEach(poly => {
                    let point = newshape.points[poly];
                    xportMesh.push(point.x/divider);
                    xportMesh.push((point.y+100)/divider);
                    xportMesh.push(point.z/divider);
                })
            });
            geometry = new Geometry(gl, {
                position: {size: 3, data: new Float32Array(xportMesh)}
            });
            scene = new Transform();
            mesh = new Mesh(gl, {mode: gl[rendering], geometry, program});
            mesh.setParent(scene);

        });

    }

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    function extract_value(value) {
        let sep = value.split('=');
        return sep[1];
    }

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    let camera = new Camera(gl);
    camera.position.set(2, 1, 0);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    let scene = new Transform();
    let texture = new Texture(gl);

    if (settings.texture != null) {
        const img = new Image();
        img.onload = () => texture.image = img;
        let tpath = '../assets/' + extract_value(settings.texture);
        img.src = tpath;
    }

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    shapeGenerator(settings.name, settings.rendering);

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    function update() {
        requestAnimationFrame(update);
        controls.update();

        if (settings.isSpinning) {
            mesh.rotation.y -= 0.01;
            mesh.rotation.x += 0.01;
        }

        renderer.render({scene, camera});

        if (capture) {
            capture = false;
            let snapshot = document.getElementById('snapshot');
            snapshot.width = gl.canvas.width;
            snapshot.height = gl.canvas.height;
            let vctx = snapshot.getContext('2d');
            vctx.drawImage(gl.canvas, 0, 0, gl.canvas.width, gl.canvas.height);
            let data = snapshot.toDataURL("image/png", 1);
            let save_link = document.getElementById('save_link');
            save_link.setAttribute('href', data);
            save_link.click();
        }
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        requestAnimationFrame(update);
    });
}
