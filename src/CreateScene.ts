import { Engine } from "@babylonjs/core/Engines";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { HemisphericLight } from "@babylonjs/core/Lights";
import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";

import { NiceLoader } from "./NiceLoader";

export function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera(
        "camera",
        Tools.ToRadians(90),
        Tools.ToRadians(65),
        10,
        Vector3.Zero(),
        scene
    );

    camera.setTarget(Vector3.Zero());
    camera.attachControl(canvas, true);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const modelsArray: any = [];

    new NiceLoader(scene, modelsArray);

    return scene;
}
