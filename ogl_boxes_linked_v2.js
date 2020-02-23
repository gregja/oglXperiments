import {Renderer, Camera, Transform, Texture, Program, Box, Mesh, Vec3, Orbit} from './js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "./js/ogl_constants.js";
{
    let info = document.getElementById('info');
    info.innerHTML = '8 cubes linked V2';

    var side = 4;
    var dist = 5;
    var mid_side = side / 2;
    var global_dist = dist * 2;
    let size = 1;

    let settings = {
        rendering: 'TRIANGLES',  // best rendering with TRIANGLE_FAN
        texture: textures[0],

    };

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    let camera = new Camera(gl);
    //camera.position.set(2, 1, 0);
    camera.position.set(0, -24, -1);

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

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    function extract_value(value) {
        let sep = value.split('=');
        return sep[1];
    }

    function generateMeshes() {

        var boxes = [];
        boxes.push({x:-dist, y:-dist, z:-dist});
        boxes.push({x:dist, y:dist, z:dist});
        boxes.push({x:-dist, y:dist, z:dist});
        boxes.push({x:dist, y:-dist, z:dist});
        boxes.push({x:dist, y:dist, z:-dist});
        boxes.push({x:-dist, y:-dist, z:dist});
        boxes.push({x:-dist, y:dist, z:-dist});
        boxes.push({x:dist, y:-dist, z:-dist});

        const distance = (a, b) => {
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dz = b.z - a.z;
            return Math.sqrt(dx*dx + dy*dy + dz*dz);
        }

        var links = [];
        var deja_vu = [];

        const search_deja_vu = (idx1, idx2) => {
            var criteria = String(idx1)+'-'+String(idx2);
            var found = deja_vu.find(function(element) {
                return element == criteria;
            });
            if (!found) {
                criteria = String(idx2)+'-'+String(idx1);
                found = deja_vu.find(function(element) {
                    return element == criteria;
                });
            }
            return found;
        }

        // find dynamically the links between the wedges
        boxes.forEach((item1, idx1) => {
            boxes.forEach((item2, idx2) => {
                if (idx1 != idx2) {
                    if (!search_deja_vu(idx1, idx2)) {
                        let xdist = distance(item2, item1);
                        if (xdist == global_dist) {
                            links.push({a:idx1, b:idx2});
                            deja_vu.push(String(idx1)+'-'+String(idx2));
                            deja_vu.push(String(idx2)+'-'+String(idx1));
                        }
                    }
                }
            });
        });

        links.forEach(item => {
            let a = boxes[item.a];
            let b = boxes[item.b];
            let x, y, z, width, height, depth;
            if (a.x < b.x) {
                width = 1 + b.x - a.x;
                x = a.x + width / 2;
            } else {
                width = 1 + a.x - b.x;
                x = b.x + width / 2;
            }
            if (a.y < b.y) {
                height = 1 + b.y - a.y;
                y = a.y + height / 2;
            } else {
                height = 1 + a.y - b.y;
                y = b.y + height / 2;
            }
            if (a.z < b.z) {
                depth = 1 + b.z - a.z;
                z = a.z + depth / 2;
            } else {
                depth = 1 + a.z - b.z;
                z = b.z + depth / 2;
            }

            let coords = {width, height, depth};
            const geometry = new Box(gl, coords);
            const shape =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            shape.position.set(x, y, z);
            shape.setParent(scene);

        });

        boxes.forEach(config => {
            const geometry = new Box(gl, {width: side, height: side, depth: side});
            const shape =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            shape.position.set(config.x, config.y, config.z);
            shape.setParent(scene);
        });

    }

    generateMeshes();

    var capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);


    function update() {
        requestAnimationFrame(update);
        controls.update();

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

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        var guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
            generateMeshes();
        });

        var guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                if (extract_code(obj.texture) != 0) {
                    const img = new Image();
                    img.onload = () => texture.image = img;
                    img.src = 'assets/' + extract_value(obj.texture);
                    program.uniforms.tMap = {value: texture};
                } else {
                    texture = new Texture(gl);
                    program.uniforms.tMap = {value: texture};
                }
            }
        });

    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
