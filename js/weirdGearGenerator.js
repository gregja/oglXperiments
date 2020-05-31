class GearGenerator {

    constructor(config) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.z = config.z || 0;
        this.outerRadius = config.outerRadius || 90;
        this.innerRadius = config.innerRadius || 50;
        this.midRadius = config.midRadius || 80;
        this.holeRadius = config.holeRadius || 10;
        this.numTeeth = config.numTeeth || 24;
        this.theta = config.theta || 0;
        this.thetaSpeed = (config.thetaSpeed ? config.thetaSpeed / 1000 : 1);
        this.lightColor = config.lightColor || '#B1CCFF';
        this.darkColor = config.darkColor || '#3959CC';
        this.clockwise = config.clockwise || false;
        this.depth = config.depth || 5;

        this.shapes = [];
    }

    generate() {

        const {
            cos, sin, PI
        } = Math;

        var numPoints = this.numTeeth * 2;
        // draw gear teeth

        let TAU = PI * 2;

        for (let n = 0; n < numPoints; n+=2) {

            let theta = this.theta;
            theta += (TAU / numPoints) * (n + 1);

            let x1 = (this.innerRadius * sin(theta)) + this.x;
            let y1 = (this.innerRadius * cos(theta)) + this.y;
            let x2 = (this.outerRadius * sin(theta)) + this.x;
            let y2 = (this.outerRadius * cos(theta)) + this.y;

            this.shapes.push({type:"box", x:x1, y:y1, z:this.z, width: x2-x1, height:y2-y1, depth: this.z + this.depth, color:this.darkColor});

        }

        // draw gear body
        this.shapes.push({type:"cylinder", x:this.x, y:this.y, z:this.z, radiusTop: this.midRadius, radiusBottom:this.midRadius, height: this.z + this.depth, radialSegments: 24, color:this.darkColor});

        // draw gear hole
        this.shapes.push({type:"cylinder", x:this.x, y:this.y, z:this.z, radiusTop: this.holeRadius, radiusBottom:this.holeRadius, height: this.z + this.depth + 2, radialSegments: 24, color:this.lightColor});

    }

    export() {
        return this.shapes;
    }
}

