class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // This creates a basic Babylon Scene object (non-mesh)
        var scene = new BABYLON.Scene(engine);

        // This creates and positions an arc-rotate camera (non-mesh)
        var camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 2.5, 10, BABYLON.Vector3.Zero(), scene);

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, options, scene
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, options, scene
        var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);

        // Setup GUI.
        let canvasZone = document.getElementById("canvasZone")!;
        canvasZone.style.position = "relative";

        const oldGui = document.getElementById("datGui");
        if (oldGui) {
            canvasZone.removeChild(oldGui);
        }

        const gui = new dat.GUI({ autoPlace: false });
        canvasZone.appendChild(gui.domElement);
        gui.domElement.id = "datGui";
        gui.domElement.style.position = "absolute";
        gui.domElement.style.top = "0";
        gui.domElement.style.right = "0";

        const cameraGui = gui.addFolder("camera");
        cameraGui.add(camera, "alpha", -Math.PI, Math.PI, 0.01).listen();
        cameraGui.add(camera, "beta", 0.01, Math.PI - 0.01, 0.01).listen();
        cameraGui.add(camera, "radius", 5, 100, 0.01).listen();
        cameraGui.open();

        camera.onViewMatrixChangedObservable.add(() => {
            while (camera.alpha < -Math.PI) camera.alpha += 2 * Math.PI;
            while (Math.PI < camera.alpha) camera.alpha -= 2 * Math.PI;
            camera.radius = Math.min(Math.max(5, camera.radius), 100);
        });

        return scene;
    }
}

declare var dat: any;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export { Playground };
