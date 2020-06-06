import {Renderer, Camera, Transform, Texture, Program, Box, Sphere, Mesh, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes, textures} from "../js/ogl_constants.js";
{
    /*
     * Example of a complex 3D object, Roboto ;)
     *  largely inspired by : https://codepen.io/hankuro/pen/LrbVrx
     */
    let info = document.getElementById('info');
    info.innerHTML = "3D object : Boxman" ;

    const {
        cos, sin, PI
    } = Math;

    const DEG_TO_RAD = PI / 180;
    const degToRad = angle => angle * DEG_TO_RAD;

    let scene, texture;

    let jointList = [
        {
            name: 'miniBox',
            type: 'box',
            scale: [0.2, 0.2, 0.2]
        },
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
            scale: [0.5, 2, 0.5]
        },
        {
            name: 'miniSphere',
            type: 'sphere',
            radius: .2
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
            name: 'Not_visible',
            type: 'transform',
        },
    ];

    let cycle = 0 , angle = 0;

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        texture: textures[0],
        isWalking: false,
        jointDefault: jointList[0].name
    };

    let Roboto = {};

    let skel = {
        LeftLeg:{},
        RightLeg:{},
        LeftLowerLeg:{},
        LeftUpperLeg:{},
        RightLowerLeg:{},
        RightUpperLeg:{},
        LeftShoulder:{},
        RightShoulder:{},
        LeftLowerArm:{},
        RightLowerArm:{},
        LeftUpperArm: {},
        LeftElbow: {},
        RightElbow: {},
        LeftHip: {},
        RightHip: {},
        LeftKnee: {},
        RightKnee: {}
    };

    const myBoxMesh = (width,height,depth) => {
        let geometry = new Box(gl, {width: width, height: height, depth: depth});
        return new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
    };

    const genJoint = (invisible=false) => {
        if (invisible) {
            return new Transform(gl);
        }
        let jointParams = {};
        for (let i=0, imax=jointList.length, found=false; i<imax && !found; i++) {
            if (jointList[i].name == settings.jointDefault) {
                jointParams = jointList[i];
            }
        }
        if (jointParams.hasOwnProperty('type')) {
            if (jointParams.type == 'box') {
                let geometry = new Box(gl, {width: jointParams.scale[0], height: jointParams.scale[1], depth: jointParams.scale[2]});
                return new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
            } else {
                if (jointParams.type == 'sphere') {
                    let geometry = new Sphere(gl, {radius: jointParams.radius});
                    return new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
                } else {
                    console.warn('type of joint not found => ' + jointParams.type);
                    return new Transform(gl);
                }
            }
        } else {
            return new Transform(gl);
        }
    };

    const genRoboto = () => {

        Roboto = new Transform(gl);
        Roboto.scale.set(10,10,10);
        Roboto.position.set(0,10,0);
        scene.addChild( Roboto );

        var Head = myBoxMesh(0.2,0.25,0.22);
        Roboto.addChild(Head);

        var Body = myBoxMesh(0.4,0.6,0.3);
        Body.position.set(0,-0.4,0);
        Roboto.addChild(Body);

        skel.LeftShoulder = genJoint();
        skel.LeftShoulder.position.set(0.3,-0.2,0);
        Roboto.addChild(skel.LeftShoulder);
        skel.LeftUpperArm = myBoxMesh(0.16,0.4,0.16);
        skel.LeftUpperArm.position.set(0, -0.2, 0);
        skel.LeftElbow = genJoint();
        skel.LeftElbow.position.set(0,-0.23,0);
        skel.LeftLowerArm = myBoxMesh(0.16,0.4,0.16);
        skel.LeftLowerArm.position.set(0,-0.23,0);
        skel.LeftElbow.addChild(skel.LeftLowerArm);
        skel.LeftShoulder.addChild(skel.LeftUpperArm);
        skel.LeftUpperArm.addChild(skel.LeftElbow);

        skel.RightShoulder = genJoint();
        skel.RightShoulder.position.set(-0.3,-0.2,0);
        Roboto.addChild(skel.RightShoulder);
        skel.RightUpperArm = myBoxMesh(0.16,0.4,0.16);
        skel.RightUpperArm.position.set(0, -0.2, 0);
        skel.RightElbow = genJoint();
        skel.RightElbow.position.set(0,-0.23,0);
        skel.RightLowerArm = myBoxMesh(0.16,0.4,0.16);
        skel.RightLowerArm.position.set(0,-0.23,0);
        skel.RightElbow.addChild(skel.RightLowerArm);
        skel.RightShoulder.addChild(skel.RightUpperArm);
        skel.RightUpperArm.addChild(skel.RightElbow);

        skel.LeftHip = genJoint();
        skel.LeftHip.position.set(0.11,-0.72,0);
        Roboto.addChild(skel.LeftHip);
        skel.LeftUpperLeg = myBoxMesh(0.2,0.6,0.2);
        skel.LeftUpperLeg.position.set(0,-0.22,0);
        skel.LeftKnee = genJoint();
        skel.LeftKnee.position.set(0,-0.33,0);
        skel.LeftLowerLeg = myBoxMesh(0.2,0.6,0.2);
        skel.LeftLowerLeg.position.set(0,-0.32,0);
        skel.LeftHip.addChild(skel.LeftUpperLeg);
        skel.LeftUpperLeg.addChild(skel.LeftKnee);
        skel.LeftKnee.addChild(skel.LeftLowerLeg);
/*
        skel.LeftKnee2 = genJoint();
        skel.LeftKnee2.position.set(0,-0.33,0);
        skel.LeftUpperLeg.addChild(skel.LeftKnee2);
        skel.LeftKnee2.rotation.x = degToRad(45);
*/
        skel.RightHip = genJoint();
        skel.RightHip.position.set(-0.11,-0.72,0);
        Roboto.addChild(skel.RightHip);
        skel.RightUpperLeg = myBoxMesh(0.2,0.6,0.2);
        skel.RightUpperLeg.position.set(0,-0.22,0);
        skel.RightKnee = genJoint();
        skel.RightKnee.position.set(0,-0.33,0);
        skel.RightLowerLeg = myBoxMesh(0.2,0.6,0.2);
        skel.RightLowerLeg.position.set(0,-0.32,0);
        skel.RightHip.addChild(skel.RightUpperLeg);
        skel.RightUpperLeg.addChild(skel.RightKnee);
        skel.RightKnee.addChild(skel.RightLowerLeg);

    //    Roboto.rotation.x = degToRad(120);
    };

    const shapeGenerator = () => {
        //let geometry = new Box(gl, {width: skel.scale[0], height: skel.scale[1], depth: skel.scale[2]});
        //robot =  new Mesh(gl, {mode: gl[settings.rendering], geometry, program});
        //robot.position.set(skel.position[0], skel.position[1], skel.position[2]);
        //robot.setParent(scene);
        genRoboto();
        scene.addChild(Roboto);
    };

    const extract_code = (value) => {
        let sep = value.split('=');
        return Number(sep[0]);
    };

    const extract_value = (value) => {
        let sep = value.split('=');
        return sep[1];
    };

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(1, 1, 1, 1);

    let camera = new Camera(gl);
    camera.position.set(40, -24, -3);
    //camera.rotate.x = degToRad(90);

    let controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    };
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

    const update = () => {
        requestAnimationFrame(update);
        controls.update();
/*
        if (isMoving) {
            //--- angles for legs
            let angle0l = degToRad(sin(cycle) * 30);
            let angle1l = degToRad(sin(cycle) * -21);
            let angle2l = degToRad(sin(cycle + PI) * 30);
            let angle3l = degToRad(sin(cycle + PI) * -21);

            character.leftLeg.rotate.x = angle0l;
            character.rightLeg.rotate.x = angle2l;
            character.leftLegLow.rotate.x = angle1l;
            character.rightLegLow.rotate.x = angle3l;

            //--- angles for arms
            let angle0a = degToRad(sin(cycle) * 10);
            let angle1a = degToRad(sin(cycle) * 21);
            let angle2a = degToRad(sin(cycle + PI) * 10);
            let angle3a = degToRad(sin(cycle + PI) * 21);

            character.leftArm.rotate.x = angle2a;
            character.rightArm.rotate.x = angle0a;
            character.leftArmLow.rotate.x = angle3a;
            character.rightArmLow.rotate.x = angle1a;

            roboto.rotate.y -= 0.004;
            let x = cos(angle) * 20;
            let z = sin(angle) * 20;
            roboto.translate.x = x;
            roboto.translate.z = z;

            cycle += 0.05;
            angle += 0.004;
        }
*/
        if (settings.isWalking) {

            //--- angles for legs
            let angle0l = degToRad(sin(cycle) * 30);
            let angle1l = degToRad(sin(cycle) * -21);
            let angle2l = degToRad(sin(cycle + PI) * 30);
            let angle3l = degToRad(sin(cycle + PI) * -21);

            skel.LeftHip.rotation.x = angle0l;
            skel.RightHip.rotation.x = angle2l;
            skel.LeftKnee.rotation.x = angle1l;
            skel.RightKnee.rotation.x = angle3l;

            //--- angles for arms
            let angleRightShoulder = degToRad(sin(cycle) * 20);
            let angleRightElbow = degToRad(sin(cycle) * 21);
            let angleLeftShoulder = degToRad(sin(cycle + PI) * 10);
            let angleLeftElbow = degToRad(sin(cycle + PI) * 21);

         //   if (angle3a < -1) angle3a = -1;
            skel.LeftShoulder.rotation.x = angleLeftShoulder;
            skel.RightShoulder.rotation.x = angleRightShoulder;
            skel.LeftElbow.rotation.x = angleLeftElbow;
            skel.RightElbow.rotation.x = angleRightElbow;

            Roboto.rotation.y -= 0.004;
            var x = cos(angle) * 20;
            var z = sin(angle) * 20;
            Roboto.position.x = x;
            Roboto.position.z = z;

            cycle += 0.05;
            angle += 0.004;
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
    };

    const addGui = (obj) => {
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

        let gui_spinning = gui.add(obj, 'isWalking').listen();
        gui_spinning.onChange(function(value){
            obj.isWalking = Boolean(value);
        });

    };

    document.addEventListener("DOMContentLoaded", function (event) {
        console.log("DOM fully loaded and parsed");
        addGui(settings);
        requestAnimationFrame(update);
    });
}
