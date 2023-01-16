import { Engine } from "@babylonjs/core/Engines";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { HemisphericLight } from "@babylonjs/core/Lights";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";

import { CharacterController } from "./cc";
import { Mesh } from "@babylonjs/core/";
import { AbstractMesh, AnimationGroup } from "@babylonjs/core/";

export class AppOne {
    engine: Engine;
    scene: Scene;

    constructor(readonly canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas);
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
        this.scene = createScene(this.engine, this.canvas);
    }

    debug(debugOn: boolean = true) {
        if (debugOn) {
            this.scene.debugLayer.show({ overlay: true });
        } else {
            this.scene.debugLayer.hide();
        }
    }

    run() {
        this.debug(true);
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
}

var createScene = function (engine: Engine, canvas: HTMLCanvasElement) {
    // this is the default code from the playground:

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new Scene(engine);

    // This creates and positions a free camera (non-mesh)
    const camera = new ArcRotateCamera(
        "camera",
        Tools.ToRadians(90),
        Tools.ToRadians(65),
        10,
        Vector3.Zero(),
        scene
    );

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    //  camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;
    /*
    // Our built-in 'sphere' shape.
    var sphere = MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 2, segments: 32 },
        scene
    );

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;
    */

    // Our built-in 'ground' shape.
    var ground = MeshBuilder.CreateGround(
        "ground",
        { width: 100, height: 100 },
        scene
    );
    ground.position.y = -0.01;
    ground.checkCollisions = true;

    SceneLoader.ImportMesh(
        "",
        "",
        "all-anim.glb",
        scene,
        (meshes, particleSystems, skeletons, aniGroups) => {
            var player = meshes[0];

            console.log(aniGroups);
            aniGroups.forEach((a) => a.stop());

            //   player.position = new Vector3(14, 2, -3);
            player.checkCollisions = true;

            player.ellipsoid = new Vector3(0.5, 1, 0.5);
            player.ellipsoidOffset = new Vector3(0, 1, 0);

            // character controller  needs rotation in euler.
            // if your mesh has rotation in quaternion then convert that to euler.
            // NOTE: The GLTF/GLB files have rotation in quaternion
            player.rotation = player.rotationQuaternion!.toEulerAngles();
            player.rotationQuaternion = null;

            player.rotation.y = Math.PI;
            var alpha = (3 * Math.PI) / 2 - player.rotation.y;
            var beta = Math.PI / 2.5;
            var target = new Vector3(
                player.position.x,
                player.position.y + 1.5,
                player.position.z
            );

            camera.alpha = alpha;
            camera.beta = beta;
            camera.setTarget(target);
            // make sure the keyboard keys controlling camera are different from those controlling player
            // here we will not use any keyboard keys to control camera
            camera.keysLeft = [];
            camera.keysRight = [];
            camera.keysUp = [];
            camera.keysDown = [];

            // below are all standard camera settings.
            // nothing specific to charcter controller
            camera.wheelPrecision = 15;
            camera.checkCollisions = false;
            // how close can the camera come to player
            camera.lowerRadiusLimit = 2;
            // how far can the camera go from the player
            camera.upperRadiusLimit = 20;
            camera.attachControl(canvas, false);

            var agMap = createAGmap(aniGroups);

            let cc = new CharacterController(
                player as Mesh,
                camera,
                scene,
                agMap,
                true
            );
            cc.setMode(0);
            //below makes the controller point the camera at the player head which is approx
            //1.5m above the player origin
            cc.setCameraTarget(new Vector3(0, 2, 0));

            //if the camera comes close to the player then we want cc to enter first person mode.
            cc.setNoFirstPerson(true);
            //the height of steps which the player can climb
            cc.setStepOffset(0.4);
            //the minimum and maximum slope the player can go up
            //between the two the player will start sliding down if it stops
            cc.setSlopeLimit(30, 60);

            //tell controller
            // - which animation range/ animation group should be used for which player animation
            // - rate at which to play that animation range
            // - wether the animation range should be looped
            //use this if name, rate or looping is different from default
            //set a parm to null if you donot want to change that
            /*
            cc.setIdleAnim(null, 1, true);
            cc.setTurnLeftAnim(null, 0.5, true);
            cc.setTurnRightAnim(null, 0.5, true);
            cc.setWalkAnim(agMap["walk"], 1, true);
            cc.setWalkBackAnim(null, 0.5, true);
            cc.setIdleJumpAnim(null, 0.5, false);
            cc.setRunJumpAnim(null, 0.6, false);
            cc.setFallAnim(null, 2, false);
            cc.setSlideBackAnim(null, 1, false);
*/

            resetAnimations(aniGroups, cc);

            //set how smmothly should we transition from one animation to another
            cc.enableBlending(0.05);

            //if somehting comes between camera and avatar move camera in front of the obstruction?
            cc.setCameraElasticity(true);
            //if something comes between camera and avatar make the obstruction invisible?
            cc.makeObstructionInvisible(false);

            cc.start();
            //
        }
    );

    SceneLoader.ImportMesh(
        "",
        "",
        "walls.glb",
        scene,
        (meshes, particleSystems, skeletons) => {
            let root = meshes[0];
            root.scaling.scaleInPlace(0.25);
            meshes.forEach((m) => {
                m.checkCollisions = true;
            });
        }
    );

    return scene;
};

function createAGmap(allAGs: any) {
    //lets map ag groups to the character controller actions.
    let agMap = {
        idle: allAGs[4],
        //  strafeLeft: allAGs[3],
        //   strafeRight: allAGs[4],
        //   turnRight: allAGs[5],
        walk: allAGs[7],
        //  fall: allAGs[8],
        //   slideBack: allAGs[9],
        runJump: allAGs[5],
        // turnLeft: allAGs[11],
        walkBack: allAGs[8],
        run: allAGs[6],
        idleJump: allAGs[5],
    };

    return agMap;
}

export function resetAnimations(aniGs: any, cc: CharacterController) {
    const ags = aniGs as AnimationGroup[];

    const idleAG: AnimationGroup | null = ags.find(
        (ag) => ag.name?.toLowerCase() === `idle`
    ) as AnimationGroup;
    const jumpAG = ags.find((ag) =>
        [`jump`, `jump_idle`].includes(ag.name?.toLowerCase())
    ) as AnimationGroup;
    const walkAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `walk`
    ) as AnimationGroup;
    const runAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `run`
    ) as AnimationGroup;

    const backAG = ags.find(
        (ag) => ag.name?.toLowerCase() === `walk_backward`
    ) as AnimationGroup;

    const danceAGs = ags.filter((ag) =>
        ag.name.toLowerCase().startsWith(`dance_`)
    );

    const greetingAG = ags.find(
        (ag) => ag.name.toLowerCase() === `greeting`
    ) as AnimationGroup;

    console.log(greetingAG);

    cc.setIdleAnim(idleAG, 1, true);
    cc.setWalkAnim(walkAG, 1, true);
    cc.setRunAnim(runAG, 1, true);
    cc.setIdleJumpAnim(jumpAG, 0.5, false);
    cc.setRunJumpAnim(jumpAG, 0.5, false);
    cc.setWalkBackAnim(backAG, 1, true);
    // cc.setDanceAnims(danceAGs, 1, true);
    cc.setGreetingAnim(greetingAG, 1, true);
}
