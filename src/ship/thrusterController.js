import Vector2 from "../helpers/Vector2.js";

export default class ThrusterController{
    constructor(parentShip){
		this.parentShip = parentShip;
	}
	//You can implement this differently:
	//This is just the simplest version
	igniteThrusters(thrusters){
		thrusters.forEach((thruster)=>{
			//do stuff for each thruster
		});
	}
}