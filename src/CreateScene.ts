import { Engine } from "@babylonjs/core/Engines";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Tools } from "@babylonjs/core/Misc/tools";
import { HemisphericLight } from "@babylonjs/core/Lights";
import { CubeTexture } from "@babylonjs/core/Materials";
import { SceneLoader } from "@babylonjs/core/Loading";
import "@babylonjs/loaders/glTF";
import "@babylonjs/inspector";

import { NiceLoader } from "./NiceLoader";

export function createScene(engine: Engine, canvas: HTMLCanvasElement) {
    const scene = new Scene(engine);
    if (!scene.environmentTexture) {
        const hdrTexture = new CubeTexture(
            "https://playground.babylonjs.com/textures/environment.env",
            scene
        );
        hdrTexture.gammaSpace = false;
        scene.environmentTexture = hdrTexture;
    }

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

    //   const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    //  light.intensity = 0.2;

    const modelsArray: any = [];
    //

    const res = SceneLoader.ImportMeshAsync(
        "",
        "https://raw.githubusercontent.com/eldinor/ForBJS/master/walls.glb"
    );

    res.then((container) => {
        console.log(container);

        new NiceLoader(scene, modelsArray);
        camera.radius = 125;
    });

    //
    //   new NiceLoader(scene, modelsArray, false);
    //
    return scene;
}
