import Vector2 from '../helpers/Vector2.js';
import PlanetComposition from './planetComposition.js';
import Sprite from '../sprite.js';
export default class Planet extends Sprite {
    constructor(planetName, radius, ...args) {
        super(...args);
        this.ctx = 'planets';
        this.inOrbit = false;
        this.orbitCenter = null;
        this.orbitRadius = 0;
        this.orbitAngle = 0;
        /* Other attributes */
        this.process = null;
        if (radius < 15)
            throw new Error('Planet radius must be at least 15');
        if (radius > 35)
            throw new Error('Planet radius must be less than 35');
        const imageName = getPlanetImageName(planetName);
        this.composition = getPlanetComposition(planetName);
        this.image = this.game.images[imageName];
        this.name = planetName;
        this.mass = (Math.PI * radius * radius * radius) / 10;
        this.size = new Vector2(radius * 3, radius * 3);
        this.radius = radius;
        console.log(this.mass);
    }
    initialize(process) {
        this.process = process;
    }
    setOrbit(star) {
        star.addPlanet(this);
        this.inOrbit = true;
        this.orbitCenter = star.pos;
        this.orbitRadius = this.pos.distance(star.pos);
        this.orbitAngle = this.pos.angleToPoint(star.pos);
    }
    leaveOrbit() {
        this.inOrbit = false;
        this.speed = Vector2.right.rotateTo(this.orbitAngle + Math.PI / 2);
    }
    update() {
        var _a;
        if (this.inOrbit && this.orbitCenter) {
            this.orbitAngle += 1 / this.orbitRadius;
            const vecToPlanet = Vector2.right.rotateTo(this.orbitAngle).scaleTo(this.orbitRadius);
            this.pos = (_a = this.orbitCenter) === null || _a === void 0 ? void 0 : _a.add(vecToPlanet);
        }
        else if (!this.inOrbit && this.orbitCenter) {
            super.update();
        }
    }
}
const PlanetNames = [
    'Big Bird',
    'Johnny Cash',
    'Steve-O',
    'Notch',
    "You're Mother",
    'Dad Sugar',
    'Watermelon',
    'Melony',
    'Esquimalt',
    'Exceptional',
    'Abysmal',
    'Pluto',
    'Fortran',
    'Rust',
    'Zig',
    'COBOL',
    'Planet Joziac',
    'Planet Two',
    'Planet Three (no Planet One)',
];
export const getPlanetImageName = (planetName) => {
    switch (planetName) {
        case 'Big Bird': return 'Neptune';
        case 'Rust': return 'Saturn';
        case 'Johnny Cash': return 'BlueStorm';
        case 'Notch': return 'Cheese';
        case "You're Mother": return 'DarkLava';
        case 'Zig': return 'DarkNeptune';
        case 'Pluto': return 'DeadGrey';
        case 'Exceptional': return 'EarthLookinAss';
        case 'Esquimalt': return 'GreyLines';
        case 'Abysmal': return 'IceCube';
        case 'Fortran': return 'IceWater';
        case 'COBOL': return 'LightLava';
        case 'Watermelon': return 'Mars';
        case 'Steve-O': return 'PinkSaturn';
        case 'Melony': return 'PurpleStripes';
        case 'Planet Two': return 'SandyCheeks';
        case 'Planet Three (no Planet One)': return 'LavaRing';
        case 'Planet Joziac': return 'PurplePlanet';
        default: throw Error('Unidentified planet name');
    }
};
export const getPlanetComposition = (planetName) => {
    switch (planetName) {
        case 'Big Bird': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Rust': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Johnny Cash': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Notch': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case "You're Mother": return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Zig': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Pluto': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Exceptional': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Esquimalt': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Abysmal': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Fortran': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'COBOL': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Watermelon': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Steve-O': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Melony': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Planet Joziac': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Planet Two': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        case 'Planet Three (no Planet One)': return new PlanetComposition(80, 70, 20, 50, 80, 20);
        default: throw Error('Unidentified planet name');
    }
};
