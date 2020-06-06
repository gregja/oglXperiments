import {Renderer, Camera, Transform, Texture, Program, Geometry, Box, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
{

    let info = document.getElementById('info');
    info.innerHTML = "Menger Snowflake";

    var generateShape = shapes3dToolbox.flakeGenerator;
    var list_levels = ['1', '2', '3', '4'];

    let tasks = [];

    let blocks_array = [];
    let block_current = -999;
    let block_maximum = -999;

    let settings = {
        rendering: 'TRIANGLES',
        texture: textures[0],
        level:list_levels[0]
    };

    let scene;

    let shapemaster = function (config, num_task) {
        if (num_task !== false) {
            tasks[num_task] = false;  // flag to know that the task is ended
        }
        const geometry = new Box(gl, {width: config.side, height: config.side, depth: config.side});
        const shape =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        shape.position.set(config.x, config.y, config.z);
        shape.setParent(scene);
    };

    function shapeGenerator() {

        scene = new Transform();

        var maxLevel = Number(settings.level);
        var shape_params = {x:0, y:0, z:0, r:1, level:1, maxLevel:maxLevel };
        var blocks = generateShape(shape_params);
        let imax = blocks.length;
        console.log('Counting of blocks to generate : '+imax);

        if (tasks.length > 0) {
            // stop remanining tasks before initializing a new series of tasks
            tasks.forEach(task => {
               if (task != false) {
                   clearTimeout(task);
               }
            });
            tasks = [];
        }

        blocks_array = [];
        block_current = -999;
        block_maximum = -999;

        if (maxLevel < 3) {
            let timer = 1;
            if (maxLevel == 2) {
                timer = 100;
            }
            for (let i = 0; i < imax; i++) {
                let block = blocks[i];
                tasks[i] = setTimeout(() => {
                    shapemaster(block, i);
                }, timer);
            }
        } else {
            block_current = -1;
            for (let i = 0; i < imax; i++) {
                blocks_array[i] = blocks[i];
            }
            block_maximum = imax;
        }

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

    let texture = new Texture(gl);

    let camera = new Camera(gl);
    camera.position.set(2, 1, 0);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        let width = window.innerWidth*.8;
        let height = window.innerHeight;
        renderer.setSize(width, height);
        camera.perspective({aspect: width / height});
    }
    window.addEventListener('resize', resize, false);
    resize();

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    shapeGenerator();

    let capture = false;

    let save_btn = document.getElementById('save_btn');
    save_btn.addEventListener('click', (evt)=>{
        capture = true;
    }, false);

    function update() {

        if (block_current != -999) {
            block_current++;
            if (block_current < block_maximum) {
                let block = blocks_array[block_current];
                shapemaster(block, false);
            }
        }

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

        requestAnimationFrame(update);

    }

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        let guiLevel = gui.add(obj, 'level', list_levels, obj.level).listen();  // none by default
        guiLevel.onChange(function(value){
            obj.level = Number(value);
            shapeGenerator();
        });

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            shapeGenerator();
        });

        let guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                if (extract_code(obj.texture) != 0) {
                    const img = new Image();
                    img.onload = () => texture.image = img;
                    img.src = '../assets/' + extract_value(obj.texture);
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
