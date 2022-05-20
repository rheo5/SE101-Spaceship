import Vector2 from "../helpers/Vector2.js";
import Sprite from "../sprite.js";
import PassiveSensors from "./passiveSensors.js";
import ActiveSensors from "./activeSensors.js";
import TurretControls from "./turretControls.js";
import ThrusterController from "./thrusterController.js";
import APIResponse from "../helpers/response.js";
import SubsystemController from "../subsystems/subsystemController.js";
import DefenceController from "../subsystems/defenceController.js";
import NavigationController from "../subsystems/navigationController.js";
import PropulsionController from "../subsystems/propulsionController.js";
import SensorsController from "../subsystems/sensorsController.js";
import WarpGate from "../spaceObjects/warpGate.js";
import Planet from "../spaceObjects/planet.js";
import Process from "../gameProcess.js";
import Game from "../game.js";
import { ShipStatus } from "./shipStatus.js";
import SolarSystem from "../solarSystem.js";



export default class ColonyShip extends Sprite{
	/* Constructor Params */
	name:string; //Ship name
	process:Process; //Process in which the ship is currently rendering
	shipStatusInfo:ShipStatus; //Stores information about the ship for subsystems
	solarSystem:SolarSystem; //Current solar system object

	/* SubSystem Controllers */
	defenceController:DefenceController; //Defence Subsystem
	navigationController:NavigationController; //Navigation Subsystem
	propulsionController:PropulsionController; //Propulsion subsystem
	sensorsController:SensorsController; //Sensors subsystem

	/* Components */
	turretControls:TurretControls; //Implementation of torpedo functions
	thrusterController:ThrusterController; //Implementation of thruster functions
	passiveSensors:PassiveSensors; //Passive sensors
	activeSensors:ActiveSensors; //Active sensors

	/* Other info */
	totalDamage = 0;
	energyUsed = 0;
	primary = false;
	torpedoesFired = 0;
	size = new Vector2(30, 20);
	hasLanded = false;
	ctx = "ships";
	mass = 3;
	maxASpeed = 0.3;
	maxSpeed = 5;	

	// used in manual mode to force tap shooting and prevent
	// burst shots that cause torpedoes fired to hit each other and explode immediately

	// stores the linear acceleration from the frame of reference of the ship (e.g. forward-backward, left-right)
	// used to update accel by converting to global frame of reference
	// useful for thrusterControls to only need to recompute accelerations once per thruster power update
	// instead of every frame as the ship rotates
	localAccel = Vector2.zero;
	energyTimeCount = 0;
	
	constructor(name:string, process:Process, DefenceClass:typeof DefenceController, NavigationClass: typeof NavigationController, PropulsionClass:typeof PropulsionController, SensorsClass:typeof SensorsController, ...args:[pos:Vector2, game:Game]){
		super(...args) //parent constructor
		this.name = name;
		this.process = process;

		this.defenceController = new DefenceClass(); 
		this.navigationController = new NavigationClass();
		this.propulsionController = new PropulsionClass();
		this.sensorsController = new SensorsClass();

		//Initialize each subsystem to give them access to each other.
		this.defenceController.initializeConnection(null, this.navigationController, this.propulsionController, this.sensorsController);
		this.navigationController.initializeConnection(this.defenceController, null, this.propulsionController, this.sensorsController);
		this.propulsionController.initializeConnection(this.defenceController, this.navigationController, null, this.sensorsController);
		this.sensorsController.initializeConnection(this.defenceController, this.navigationController, this.propulsionController, null);

		this.turretControls = new TurretControls(this, this.pos, this.game);
		this.passiveSensors = new PassiveSensors(this);
		this.activeSensors = new ActiveSensors(this);
		this.thrusterController = new ThrusterController(this);

		this.image = this.game.images["ship"];
		this.radius = (this.size.x + this.size.y) / 4;		// we say the hurt box is avg of width and height
		if (this.process.game.galaxy) this.shipStatusInfo = {
			galaxyName: this.process.game.galaxy?.name,
			solarSystemName: this.process.solarSystem.name,
			position: this.pos.clone(),
			radius: this.radius,
			linearVelocity: this.speed.clone(),
			angularVelocity: this.aSpeed,
			direction: this.angle,
			torpedoSpeed: this.turretControls.launchSpeed,
			hasLanded: this.hasLanded
		};
		else throw Error("Galaxy not found");
		this.solarSystem = this.process.solarSystem;
	}
	update() {
		this.updateShipStatusInfo();
		this.energyTimeCount++;
		if (this.energyTimeCount > 4){
			this.energyUsed += 0.06;
			this.energyTimeCount = 0;
		}
		//Add special update code here if needed
		if (this.primary) this.manualControls(); //use the data from keyboard control for testing
		
		this.defenceController.defenceUpdate(
			this.shipStatusInfo, 
			this.turretControls.aimTurret.bind(this.turretControls), 
			this.turretControls.getTubeCooldown.bind(this.turretControls), 
			this.turretControls.fireTorpedo.bind(this.turretControls)
		);
		this.sensorsController.sensorsUpdate(
			this.shipStatusInfo, 
			this.activeSensors.scan.bind(this.activeSensors), 
			this.passiveSensors.scan.bind(this.passiveSensors)
		);
		this.navigationController.navigationUpdate(
			this.shipStatusInfo, 
			this.tryWarp.bind(this),
			this.process.solarSystem.getMapData(this.pos)
		);
		this.propulsionController.propulsionUpdate(
			this.shipStatusInfo, 
			this.thrusterController.setThruster.bind(this.thrusterController)
		);
		this.boundaries();
		this.accel = this.accel.add(this.localAccel.rotate(this.angle.angle()));
		this.turretControls.update()
		super.update() //parent update;
	}
	manualControls(){
		if (!this.game.inputs) throw Error("Game inputs not defined");
		if (this.game.inputs.pressed.left) {
			this.aAccel = -0.005;
			this.energyUsed += 0.04;
		}
		else if (this.game.inputs.pressed.right ) {
			this.aAccel = 0.005;
			this.energyUsed += 0.04;
		}
 		else this.aAccel = 0;
 		if (this.game.inputs.pressed.up) {
			this.accel.set(0, 0);
			this.accel = this.accel.add(this.angle.scale(0.02));
			this.energyUsed += 0.04;
		}
 		else if (this.game.inputs.pressed.down){
			this.accel.set(0, 0);
			this.accel = this.accel.add(this.angle.scale(-0.02));
			this.energyUsed += 0.04;
		}
 		else this.accel.set(0,0);

		//react to the controller data
		//Calls this.thrusterController
	}
	updateShipStatusInfo(){
		this.shipStatusInfo.solarSystemName = this.process.solarSystem.name;
		this.shipStatusInfo.position = this.pos.clone();
		this.shipStatusInfo.radius = this.radius;
		this.shipStatusInfo.linearVelocity = this.speed.clone();
		this.shipStatusInfo.angularVelocity = this.aSpeed;
		this.shipStatusInfo.direction = this.angle;
		this.shipStatusInfo.torpedoSpeed = this.turretControls.launchSpeed;
		this.shipStatusInfo.hasLanded = this.hasLanded;
		//see past function
	}
	boundaries(){
		if (this.pos.y>this.game.height){ //y pos bounds
			this.pos.y = this.game.height;
			this.speed.y = 0;
			this.accel.y = 0;
		} else if (this.pos.y<0) {
			this.pos.y = 0;
			this.speed.y = 0;
			this.accel.y = 0;
		}
		if (this.pos.x>this.game.width){ // x pos bounds
			this.pos.x = this.game.width;
			this.speed.x = 0;
			this.accel.x = 0;
		} else if (this.pos.x<0) {
			this.pos.x = 0;
			this.speed.x = 0;
			this.accel.x = 0;
		}
		//Max speeds
		if (this.speed.magnitude() > this.maxSpeed) {
			this.speed = this.speed.scaleTo(this.maxSpeed);
		}
		if (this.aSpeed > this.maxASpeed) {
			this.aSpeed = this.aSpeed = this.maxASpeed;
		}
		if (this.aSpeed < -this.maxASpeed) {
			this.aSpeed = this.aSpeed = -this.maxASpeed;
		}
	}
	// called when ship hits an asteroid
	receiveDamage(amount:number) {
		console.log("SHIP TOOK ", amount, "DMG")
		this.totalDamage += amount;
	}

	tryFire() {
		this.turretControls.aimTurret(this.angle);
		for (let i = 0; i < 4; i++) {
			if (this.turretControls.fireTorpedo(i).success) break;
		}
	}

	tryWarp(){
		this.energyUsed += 50;
		this.process.solarSystem.warpGates.forEach((warpGate:WarpGate) => {
			if (this.game.ifCollide(this, warpGate)) {
				warpGate.warp(this);
				this.receiveDamage(this.speed.magnitude());
				return new APIResponse(200, [], "warped", true);
			}
		})
		return new APIResponse(400, ["No warp gates in range"]);
	}

	tryLand(){
		this.energyUsed += 20;
		console.log(this.speed.magnitude())
		this.process.solarSystem.planets.forEach((planet:Planet) => {
			if (this.game.ifCollide(this, planet)){
				if (this.speed.magnitude()>0.5){
					return new APIResponse(400, ["Too fast!"]);
				} else {
					this.land(planet);
					return new APIResponse(200, [], "landed", true);
				}
			}
		})
		return new APIResponse(400, ["No planets in range"]);
	}

	land(planet:Planet) {
		alert("YOU WIN");
		console.log(planet);
	}

	draw() {
		super.draw();
		this.turretControls.draw();
	}
}