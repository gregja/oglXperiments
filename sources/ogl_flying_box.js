import {Renderer, Camera, Transform, Texture, Program, Box, Sphere, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
{
    /*
     *  Adaptation for OGL of this sketch : http://processingjs.org/articles/RenderingModes.html
     */
    let info = document.getElementById('info');
    info.innerHTML = "3D object : Flying box" ;

    const {
        cos, sin, PI
    } = Math;

    const DEG_TO_RAD = PI / 180;
    const degToRad = angle => angle * DEG_TO_RAD;

    let scene, texture;
    let book, leftJoint, rightJoint;  // explicit names for parts of the shape (easier too manage)

    let jointList = [
        {
            name: 'tinyBox',
            type: 'box',
            scale: [0.5, 0.5, 0.5]
        },
        {
            name: 'mediumBox',
            type: 'box',
            scale: [1, 1, 1]
        },
        {
            name: 'longBox',
            type: 'box',
            scale: [0.5, 5, 0.5]
        },
        {
            name: 'tinySphere',
            type: 'sphere',
            radius: .5
        },
        {
            name: 'mediumSphere',
            type: 'sphere',
            radius: 1
        },
        {
            name: 'bigSphere',
            type: 'sphere',
            radius: 2
        },
        {
            name: 'waowSphere',
            type: 'sphere',
            radius: 3
        },
        {
            name: 'Not visible',
            type: 'transform',
        },
    ];

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        isFlying: false,
        ang1:0,
        ang2:0,
        ang3:0,
        ang4:0,
        flapSpeed:0.2,
        jointDefault: jointList[0].name
    };

    function shapeGenerator() {
        var skeleton = {
            position: [0, -3, 0],
            scale: [2, 5, 2],
            rotation: [0, 0, 0],
            children: [
                { // left wing, in the original processing sketch => rotateY(sin(radians(ang)) * -20); rect(-75, -50, 75, 100);
                    id: "leftjoint",
                    position: [-1, 0, -0],
                    rotation: [0, 45, 0],
                    children: [{
                        id: "leftwing",
                        position: [-1, 0, -2],
                        scale: [5, 5, .1],
                        rotation: [0, 90, 0],
                    }]
                },
                { // right wing, in the original processing sketch => rotateY(sin(radians(ang)) * 20); rect(0, -50, 75, 100);
                    id: "righjoint",
                    position: [1, 0, .1],
                    rotation: [0, -180, 0],
                    children: [{
                        id: "rightwing",
                        position: [-1, 0, 2],
                        scale: [5, 5, .1],
                        rotation: [0, -90, 0],
                    }]
                },
            ]
        };

        let geometry = new Box(gl, {width: skeleton.scale[0], height: skeleton.scale[1], depth: skeleton.scale[2]});
        book =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        book.position.set(skeleton.position[0], skeleton.position[1], skeleton.position[2]);
        book.setParent(scene);

        let jointParams = {};
        jointList.forEach(joint => {
            if (joint.name == settings.jointDefault) {
                jointParams = {
                    name: joint.name,
                    type: joint.type,
                    scale: joint.scale || [],
                    radius: joint.radius || [],
                }
            }
        })

        skeleton.children.forEach((level1, idx) => {
            let geometry, childLvl1;
            if (jointParams.type == 'box') {
                geometry = new Box(gl, {width: jointParams.scale[0], height: jointParams.scale[1], depth: jointParams.scale[2]});
                childLvl1 =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            } else {
                if (jointParams.type == 'sphere') {
                    geometry = new Sphere(gl, {radius: jointParams.radius});
                    childLvl1 =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
                } else {
                    childLvl1 = new Transform(gl);
                }
            }
            //let childLvl1 =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            childLvl1.position.set(level1.position[0], level1.position[1], level1.position[2]);
            childLvl1.rotation.set(level1.rotation[0], level1.rotation[1], level1.rotation[2]);
            book.addChild(childLvl1);
            //childLvl1.setParent(book);
            if (idx == 0) {
                leftJoint = childLvl1;
            } else {
                rightJoint = childLvl1;
            }
            level1.children.forEach(level2 => {
                let geometry = new Box(gl, {width: level2.scale[0], height: level2.scale[1], depth: level2.scale[2]});
                let childLvl2 =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
                childLvl2.position.set(level2.position[0], level2.position[1], level2.position[2]);
                childLvl2.rotation.set(level2.rotation[0], level2.rotation[1], level2.rotation[2]);
                childLvl1.addChild(childLvl2);
            });
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

    scene = new Transform();
    texture = new Texture(gl);

    if (extract_code(settings.texture) != 0) {
        const img = new Image();
        img.onload = () => texture.image = img;
        img.src = '../assets/' + extract_value(settings.texture);
    }

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
        requestAnimationFrame(update);
        controls.update();

        if (settings.isFlying) {

            let px = (sin(degToRad(settings.ang3)) * 170) / 1000;
            let py = (cos(degToRad(settings.ang3)) * 300) / 1000;
            let pz = (sin(degToRad(settings.ang4)) * 100) / 1000;

            book.position.x += px;
            book.position.y += py;
            book.position.z += pz;

            book.rotation.x = sin(degToRad(settings.ang2)) * 120;
            book.rotation.y = sin(degToRad(settings.ang2)) * 50;
            book.rotation.z = sin(degToRad(settings.ang2)) * 65;

            leftJoint.rotation.y += (sin(degToRad(settings.ang1)) * -20) / 10;
            rightJoint.rotation.y += (sin(degToRad(settings.ang1)) * 20) / 10;

            // Wing flap
            settings.ang1 += settings.flapSpeed;
            if (settings.ang1 > 3) {
                settings.flapSpeed *= -1;
            }
            if (settings.ang1 < -3) {
                settings.flapSpeed *= -1;
            }
            // Increment angles
            settings.ang2 += 0.01;
            settings.ang3 += 2.0;
            settings.ang4 += 0.75;
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

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        let guiRndrMode = gui.add(obj, 'rendering', render_modes, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            scene = new Transform();
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

        let guiJoint = gui.add(obj, 'jointDefault', jointList.map(item=>item.name), obj.jointDefault).listen();  // none by default
        guiJoint.onChange(function(value){
            if (obj.jointDefault != null) {
                obj.jointDefault = value;
                scene = new Transform();
                shapeGenerator();
            }
        });

        let gui_spinning = gui.add(obj, 'isFlying').listen();
        gui_spinning.onChange(function(value){
            obj.isFlying = Boolean(value);
        });

    }

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
