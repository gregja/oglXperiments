import {Renderer, Camera, Transform, Texture, Program, Geometry, Mesh, Box, Sphere, Vec3, Orbit} from '../js/ogl/ogl.js';
import {vertex100, fragment100, vertex300, fragment300, render_modes_extended, textures_extended as textures,
    gradTexture, textures_predefined} from "../js/ogl_constants.js";

import {ConvertMeshToCSG} from "../js/csg_tools.js";

function letsgo() {

    let info = document.getElementById('info');

    parametricalSurfaces.loadInternalShapes();
    let current_shape = parametricalSurfaces.setSurface(parametricalSurfaces.getRndItemFromList());
    let surface_listing = parametricalSurfaces.getList();
    info.innerHTML = current_shape.name;

    let generator_modes = ['0=Quad', '1=Triangle (1/2)', '2=Triangle (2/2)']; //(0=quad ; 1=triangle, draw one facet by two; 2=triangle, draw all facets)

    let settings = {
        rendering: 'TRIANGLE_STRIP',
        gen_mode: generator_modes[0],
        texture: textures[0],
        name: current_shape.name,
        isSpinning: false,
        backgroundColor: [1, 1, 1, 1]
    };

    var ref = {
        canvas: document.getElementById('ogl-canvas'),
        link: document.getElementById('link'),
        comment: document.getElementById('comment'),
        source: document.getElementById('source'),
        edit_window: document.getElementById("edit-window"),
        edit_button: document.getElementById("edit-btn"),
        submit_button: document.getElementById("submit-btn"),
        export_button: document.getElementById("export-btn"),
        stl_button: document.getElementById("generate-stl"),
        stl_export_link: document.getElementById("generate-stl-link"),
        form: document.getElementById('myform'),
        warnings: document.querySelectorAll('[data-id=warning]'),
        fields: {},
        decPrecision: 3
    };

    function clearWarnings() {
        for(let v=0, vmax=ref.warnings.length; v<vmax; v++) {
            ref.warnings[v].innerText = '';
        }
    }

    // if function "toString" not available on functions, so it's not possible to modify functions dynamically
    var modify_functions = (Function.prototype.toString ? true: false);

    var infos = {};

    [...ref.form.querySelectorAll('[data-field]')].forEach(item => {
        let key = item.dataset.field;
        ref.fields[key] = item;
    });

    var viewSource = ()=> {
        if (infos.refer.comment) {
            ref.comment.innerHTML = `<fieldset><legend>Comment</legend>${infos.refer.comment}</fieldset>`;
        } else {
            ref.comment.innerHTML = '';
        }
        if (infos.refer.link) {
            ref.link.innerHTML = `<fieldset><legend>Link</legend><a href="${infos.refer.link}" target="_blank">${infos.refer.link}</a></fieldset>`;
        } else {
            ref.link.innerHTML = '';
        }
    }

    var forcePrecision = (value) => Number(Number(value).toFixed(ref.decPrecision));

    var decPrecision = (value) => Math.pow(10, -value);

    var formatSource = ()=> {
        ref.source.innerHTML = '';
        let sources = [];
        if (infos.params && infos.params.length > 0) {
            sources.push( '<pre>Constants => '+JSON.stringify(infos.params)+'</pre>\n' );
        }
        if (infos.limits && infos.limits.u) {
            sources.push( '<pre>Limits on U => '+JSON.stringify(infos.limits.u)+'</pre>\n' );
        }
        if (infos.limits && infos.limits.v) {
            sources.push( '<pre>Limits on V => '+JSON.stringify(infos.limits.v)+'</pre>\n' );
        }
        if (infos.fx != null) {
            sources.push( '<pre>'+infos.fx+'</pre>\n' );
        }
        if (infos.fy != null) {
            sources.push( '<pre>'+infos.fy+'</pre>\n' );
        }
        if (infos.fz != null) {
            sources.push( '<pre>'+infos.fz+'</pre>\n' );
        }
        if (infos.fxyz != null) {
            sources.push( '<pre>'+infos.fxyz+'</pre>\n' );
        }
        if (sources.length > 0) {
            let tmpsrc = sources.join('\n');
            ref.source.innerHTML = `<fieldset><legend>Source</legend>${tmpsrc}</fieldset>`;
        }
    };

    ref.submit_button.setAttribute('disabled', 'disabled');

    ref.edit_button.addEventListener('click', function(evt){
        evt.preventDefault();

        if (ref.submit_button.hasAttribute('disabled')) {
            ref.submit_button.removeAttribute('disabled');
        }

        infos = parametricalSurfaces.getInfos();

        if (ref.edit_window.getAttribute('data-active') == 'false') {
            ref.edit_window.setAttribute('data-active', 'true');
            this.innerHTML = 'Cancel';
            ref.source.setAttribute('data-active', 'false');
        } else {
            ref.edit_window.setAttribute('data-active', 'false');
            this.innerHTML = 'Edit';
            ref.source.setAttribute('data-active', 'true');
        }

        ['a', 'b', 'c', 'd', 'e', 'f'].forEach(letrItem => {
            let node = ref.fields['const-'+letrItem];
            node.parentNode.style.display = "none";
            node.value = '';
            node.setAttribute('data-hidden', 'true');
        });

        infos.params.forEach((items, idx) => {
            for(let item in items) {
                let letrItem = item.toLowerCase();
                let value = infos.params[idx][item];
                if (value != '') {
                    let node = ref.fields['const-'+letrItem];
                    node.value = forcePrecision(value);
                    node.parentNode.style.display = "block";
                    node.setAttribute('data-hidden', 'false');
                }
            }
        });

        ['u', 'v'].forEach(curveLevl => {
            ['begin', 'end', 'step'].forEach(stepLevel => {
                let value = forcePrecision(infos.limits[curveLevl][stepLevel]);
                ref.fields[`limit-${curveLevl}-${stepLevel}`].value = value;
            });
        });

        clearWarnings();

        ['fx', 'fy', 'fz', 'fxyz'].forEach(fnc => {
            let node = ref.fields[fnc];
            let value = infos[fnc];

            if (value == null || value == 'null' || value == '') {
                node.parentNode.style.display = "none";
                node.value = '';
                node.setAttribute('data-hidden', 'true');
            } else {
                node.parentNode.style.display = "block";
                node.value = value;
                node.setAttribute('data-hidden', 'false');

                if (modify_functions == false) {
                    node.setAttribute('disabled', 'disabled');
                } else {
                    // check if function compatible with dynamic edition mode
                    let checkcode = parametricalSurfaces.testFunction(fnc, value);
                    if (checkcode.status != 'OK') {
                        console.warn('not good for '+fnc);
                        node.setAttribute('disabled', 'disabled');
                    }
                }
            }
        });

    }, false);

    function downloadParams(filename, text) {
        var new_name = parametricalSurfaces.replaceAll(filename, ' ', '_');
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', new_name+'_export.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    ref.export_button.addEventListener('click', function(evt){
        var datas = JSON.stringify(infos);
        downloadParams(infos.name, datas);
    });

    ref.form.addEventListener('submit', function(evt){
        evt.preventDefault();
        var custom = {};

        clearWarnings();

        infos.params.forEach((items, idx) => {
            for(let item in items) {
                let letrItem = item.toLowerCase();
                let value = ref.fields['const-'+letrItem].value;
                infos.params[idx][item] = value;
                custom[item] = value;
            }
        });

        ['u', 'v'].forEach(curveLevl => {
            custom[curveLevl] = {};
            ['begin', 'end', 'step'].forEach(stepLevel => {
                let value = ref.fields[`limit-${curveLevl}-${stepLevel}`].value;
                infos.limits[curveLevl][stepLevel] = value;
                custom[curveLevl][stepLevel] = value;
            });
        });
        let all_functions_good = true;
        if (modify_functions == true) {
            ['fx', 'fy', 'fz', 'fxyz'].forEach((fnc, idx) => {
                let node = ref.fields[fnc];
                let source = node.value;
                if (node.getAttribute('data-hidden') == 'false' && !node.hasAttribute('disabled')) {
                    let checkcode = parametricalSurfaces.testFunction(fnc, source);
                    if (checkcode.status == 'OK') {
                        custom[fnc] = source;
                    } else {
                        all_functions_good = false;
                        ref.warnings[idx].innerHTML = 'Syntax error';
                    }
                }
            });
        }
        if (all_functions_good) {

            setTimeout(() => {
                parametricalSurfaces.customSurface(custom);
                infos = parametricalSurfaces.getInfos();
                shape3d = parametricalSurfaces.curvesInMesh(extract_code(settings.gen_mode));
                shapeGenerator(settings, shape3d);
                formatSource();

            }, 10);

        }

    }, false);

    ref.stl_button.addEventListener('click', (evt)=>{
        ConvertMeshToCSG(shape3d, 10, true, ref.stl_export_link, 'stl', "parametricSurface" );
    }, false);

    function extract_code(value) {
        let sep = value.split('=');
        return Number(sep[0]);
    }

    function extract_value(value) {
        let sep = value.split('=');
        return sep[1];
    }

    // format text describing the current shape
    infos = parametricalSurfaces.setSurface(settings.type);
    formatSource();
    viewSource();
    ref.source.setAttribute('data-active', 'true');

    const renderer = new Renderer({dpr: 2});
    const gl = renderer.gl;
    const canvas_area = document.getElementById('ogl-canvas');
    canvas_area.appendChild(gl.canvas);
    gl.clearColor(...settings.backgroundColor);

    const camera = new Camera(gl);
    camera.position.set(2, 1, 0);

    var controls = new Orbit(camera, {
        target: new Vec3(0, 0.2, 0),
    });

    function resize() {
        renderer.setSize(1200, 800);
        camera.perspective({aspect: gl.canvas.width / gl.canvas.height});
    }
    //window.addEventListener('resize', resize, false);
    resize();

    let scene = new Transform();
    let texture = new Texture(gl);

    function loadTexture(param) {
        if (extract_code(param) != 0) {
            texture = new Texture(gl);
            let suffix = param.substr(-4).toLowerCase();
            if (suffix != '.png' && suffix != '.jpg') {
                let tmpcolors = textures_predefined.palette01.colors;
                // TODO : experimental gradiant texture (extend the choice and improve ergonomy)
                texture.image = gradTexture([[0.75, 0.6, 0.4, 0.25], tmpcolors]); // eval('param');
            } else {
                const img = new Image();
                img.onload = () => texture.image = img;
                img.src = '../assets/' + extract_value(param);
            }

        } else {
            texture = new Texture(gl);
        }
    }
    loadTexture(settings.texture);

    /*
    if (extract_code(settings.texture) != 0) {
        const img = new Image();
        img.onload = () => texture.image = img;
        img.src = '../assets/' + extract_value(settings.texture);
    }
     */

    const program = new Program(gl, {
        vertex: renderer.isWebgl2 ? vertex300 : vertex100,
        fragment: renderer.isWebgl2 ? fragment300 : fragment100,
        uniforms: {
            tMap: {value: texture},
        },
        cullFace: null,
    });

    let shape3d = parametricalSurfaces.curvesInMesh(extract_code(settings.gen_mode));
    let xportMesh = [];
    let geometry, mesh;

    shapeGenerator(settings, shape3d);

    var capture = false;

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

    function shapeGenerator(obj, shape3d) {
        scene = new Transform();
        let divider = 5;
        let rendering = obj.rendering;

        if (rendering == 'BALLS' || rendering == 'BOXES' || rendering == 'BALLS_TRIANGLE_STRIP' || rendering == 'BOXES_TRIANGLE_STRIP') {
            let tmpGeometry;
            if (obj.rendering == 'BALLS' || rendering == 'BALLS_TRIANGLE_STRIP') {
                tmpGeometry = new Sphere(gl, {radius: 0.2, widthSegments:32, heightSegments:32});
            } else {
                tmpGeometry = new Box(gl, {width: 0.2, height:0.2, depth:0.2});
            }
            //const sphereGeometry = new Sphere(gl, {radius: 0.2, widthSegments:32, heightSegments:32});
            shape3d.polygons.forEach(polygons => {
                polygons.forEach(poly => {
                    let point = shape3d.points[poly];
                    let tmpmesh = new Mesh(gl, { geometry: tmpGeometry, program });
                    tmpmesh.position.set(point.x/divider, point.y/divider, point.z/divider);
                    //tmpmesh.scale.set(point.x/divider, point.y/divider, point.z/divider);
                    //tmpmesh.scale.set(.2, .2, .2);
                    tmpmesh.setParent(scene);
                })
            });
            if (rendering != 'BALLS_TRIANGLE_STRIP' && rendering != 'BOXES_TRIANGLE_STRIP') {
                return;
            } else {
                rendering = 'TRIANGLE_STRIP';
            }
        }

        xportMesh = [];
        shape3d.polygons.forEach(polygons => {
            polygons.forEach(poly => {
                let point = shape3d.points[poly];
                xportMesh.push(point.x/divider);
                xportMesh.push(point.y/divider);
                xportMesh.push(point.z/divider);
            })
        });
        geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(xportMesh)}
        });
        mesh = new Mesh(gl, {mode: gl[rendering], geometry, program});
        mesh.setParent(scene);
    }

    let decPrecisionField = document.querySelector('[data-field=dec-precision]');
    if (decPrecisionField == undefined) {
        console.warn('field "dec-precision" not found');
    } else {
        decPrecisionField.addEventListener('change', evt=>{
            let value = parseInt(evt.currentTarget.value);

            if (ref.decPrecision != value) {
                ref.decPrecision = value;
                let prec = decPrecision(value);
                let in_numbers = document.querySelectorAll('[type=number]');
                in_numbers.forEach(field => {
                    if (field != decPrecisionField) {
                        field.setAttribute('step', prec);
                    }
                });            }

        }, false);
    }

    function addGui(obj) {
        let gui = new dat.gui.GUI();

        var guiSurfList = gui.add(obj, 'name', surface_listing).listen();
        guiSurfList.onChange(function(value){

            if (ref.edit_window.getAttribute('data-active') == 'true') {
                ref.edit_window.setAttribute('data-active', 'false');
                ref.edit_button.innerHTML = 'Edit';
                ref.source.setAttribute('data-active', 'true');
                ref.edit_button.click();
            }

            current_shape = parametricalSurfaces.setSurface(value);
            info.innerHTML = current_shape.name;
            shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            shapeGenerator(obj, shape3d);
            infos = parametricalSurfaces.setSurface(settings.type);

            console.log("new shape selected : " + infos.name);

            formatSource();

            if (ref.edit_window.getAttribute('data-active') == 'true') {
                ref.edit_button.click();
                ref.edit_button.click();
            }

        });

        var guiRndrMode = gui.add(obj, 'rendering', render_modes_extended, obj.rendering).listen();  // none by default
        guiRndrMode.onChange(function(value){
            obj.rendering = value;
            //mesh = new Mesh(gl, {mode: gl[value], geometry, program});
            //mesh.setParent(scene);
            shapeGenerator(obj, shape3d);
        });

        var guiTexture = gui.add(obj, 'texture', textures, obj.texture).listen();  // none by default
        guiTexture.onChange(function(value){
            if (obj.texture != null) {
                obj.texture = value;
                loadTexture(obj.texture);
                program.uniforms.tMap = {value: texture};
            }
        });

        var guiGenMode = gui.add(obj, 'gen_mode', generator_modes, obj.gen_mode).listen();  // none by default
        guiGenMode.onChange(function(value){
            obj.gen_mode = value;
            let shape3d = parametricalSurfaces.curvesInMesh(extract_code(obj.gen_mode));
            shapeGenerator(obj, shape3d);
        });

        let guiSpinning = gui.add(obj, 'isSpinning').listen();
        guiSpinning.onChange(function(value){
            obj.isSpinning = Boolean(value);
        });

        let guiBackgcol = gui.addColor(obj, 'backgroundColor').listen();
        guiBackgcol.onChange(function(value){
            obj.backgroundColor = value.map(val => Math.floor(val)/255);
            gl.clearColor(...settings.backgroundColor);
            gl.clear(gl.COLOR_BUFFER_BIT);
        });
    }

    addGui(settings);
    requestAnimationFrame(update);
}

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM fully loaded and parsed");
    letsgo();
});