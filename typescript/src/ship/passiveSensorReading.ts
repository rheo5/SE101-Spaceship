export default class PassiveSensorReading {
	heading
	gravity
	constructor(angle: number, gravity: number) {
		this.heading = angle //number
		this.gravity = gravity //GravitySignature;
	}
}