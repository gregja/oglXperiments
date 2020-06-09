import {CSG} from "./csg.js";

function convertCsgObjectToBlob(csgObject, format="stl") {
    var blob;
    if(format == "stl") {
        blob = csgObject.fixTJunctions().toStlBinary();
    }
    else if(format == "x3d") {
        blob = csgObject.fixTJunctions().toX3D();
    }
    else if(format == "dxf") {
        blob = csgObject.toDxf();
    } else {
        console.error("Format not supported : "+format);
        return false;
    }
    return blob;
};

function getWindowURL() {
    if(window.URL) return window.URL;
    else if(window.webkitURL) return window.webkitURL;
    else {
        console.error("Your browser doesn't support window.URL");
        return false;
    }
}

function getExportFormatInfo(format) {
    let formats = {
        stl: {
            displayName: "STL",
            extension: "stl",
            mimetype: "application/sla",
        },
        x3d: {
            displayName: "X3D",
            extension: "x3d",
            mimetype: "model/x3d+xml",
        },
        dxf: {
            displayName: "DXF",
            extension: "dxf",
            mimetype: "application/dxf",
        }
    };
    if (formats.hasOwnProperty(format)) {
        return formats[format];
    } else {
        console.error("format not found => "+String(format));
    }
    return false;
}

/**
 * Generate the Blog of the CSG object and autoclick on the downloadLink to auto download the file
 * @param csgObject (object created by csg.js)
 * @param downloadLink (DOM target of an HTML tag "a" predefined and hidden on the page)
 * @param format  ("stl" by default)
 * @param fileName  ("csg_shape" by default)
 * @returns {boolean}
 */
export function generateOutputFileBlobUrl(csgObject, downloadLink, format="stl", fileName="csg_shape") {
    let blob = convertCsgObjectToBlob(csgObject, format);
    if (blob === false) return;
    let windowURL = getWindowURL();
    if (windowURL === false) return;
    let outputFileBlobUrl = windowURL.createObjectURL(blob);
    if(!outputFileBlobUrl) {
        console.error("createObjectURL() failed");
        return false;
    }
    downloadLink.href = outputFileBlobUrl;
    let ext = getExportFormatInfo(format).extension;
    downloadLink.setAttribute("download", fileName+"."+ext);
    downloadLink.click();
}

/**
 * Bind the user code to generate the CSG object
 *
 * @param CSG  (import the CSG object in the scope to use it temporarily)
 * @param code  (the JS code to evaluate)
 * @param userdata  (user data or Null)
 * @param warningZone  (Dom target to warning zone into the page, or False)
 * @returns {null|any}
 */
export function generateCSG(CSG, code, userdata=null, warningZone=undefined) {
    let usercode = String(code).trim();
    let fnc_code;
    // bind the user code in the "fnc_code" function to avoid pollution of the current scope
    let binded_code = `fnc_code = ()=> {
        "use strict";
        let final = null;
        ${usercode}  
        return final;
        }
        fnc_code();
        `;

    if (warningZone != undefined) {
        warningZone.innerHTML = '';
    }

    try {
        let res = eval(binded_code);
        if (res == undefined || res == null) {
            if (warningZone != undefined) {
                warningZone.innerHTML = "You must always finish your code with the predefined variable 'final' like on that example : <pre>final = your_last_var;</pre> ";
            }
            return null;
        }
        return res;
    } catch(error) {
        console.warn(error);
        console.log(binded_code);
        if (warningZone != undefined) {
            warningZone.innerHTML = String(error);
        }
        return null;
    }
}

/**
 * Generate a Form in a Table
 * @param tableTarget
 * @param definitions
 * @returns {boolean|[]}
 */
export function generateTableForm(tableTarget, definitions) {
    let tableparams = document.getElementById(tableTarget);
    if (tableparams == undefined) {
        console.error('Table formulary is missing in the DOM');
        return false;
    }
    let dictionary = [];
    definitions.forEach(item => {
        let tr = document.createElement('tr');
        let td1 = document.createElement('td');
        let td2 = document.createElement('td');
        tr.appendChild(td1);
        tr.appendChild(td2);
        let input = document.createElement('input');
        input.setAttribute('id', item.name);
        input.setAttribute('value', item.default);
        if (item.type == 'int' || item.type == 'float') {
            input.setAttribute('type', 'number');
        }
        td2.appendChild(input);
        dictionary.push(input);
        let label = document.createElement('label');
        label.innerText = item.caption;
        label.setAttribute('for', item.name);
        td1.appendChild(label);
        tableparams.appendChild(tr);
    });
    return dictionary;
}

/**
 * Convert a mesh to a CSG object
 * @param shape3d
 * @param scaleMulti
 * @param directExport
 * @param exportLink
 * @param exportFormat
 * @param fileName
 * @constructor
 */
export function ConvertMeshToCSG(shape3d, scaleMulti=1, directExport=false, exportLink=null, exportFormat='stl', fileName="csg_shape") {

    let multi = scaleMulti;
    let csgpolygons = [];
    let csg;
    new Promise((resolve, reject) => {
        shape3d.polygons.forEach(polys => {
            let vertices = [];
            polys.forEach(poly => {
                let point = shape3d.points[poly];
                let x = point.x*multi;
                let y = point.y*multi;
                let z = point.z*multi;
                let pos = CSG.Vector3D.Create(x, y, z);
                let vertex = new CSG.Vertex(pos);
                vertices.push(vertex);
            });
            let csgpolygon = new CSG.Polygon(vertices);
            csgpolygons.push(csgpolygon);
        });
        try {
            csg = CSG.fromPolygons(csgpolygons);
            csg.isCanonicalized = true;
            csg.isRetesselated  = true;
            resolve('CSG Shape ready');
        } catch (err) {
            reject(err);
        }
    }).then(
        function(val) {
            if (directExport) {
                generateOutputFileBlobUrl(csg, exportLink, exportFormat, fileName );
            }
            return csg;
        }).catch(
        // Promesse rejetée
        function(err) {
            console.warn(err);
            return false;
        });
}
