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

        return scene;
    }

    /**
     * Creates SVG markup for 6 different audio volume fade curves
     * @returns Array of 6 SVG strings: [linearIn, linearOut, logIn, logOut, expIn, expOut]
     */
    public static CreateVolumeFadeSVGs(): string[] {
        const width = 200;
        const height = 100;
        const padding = 10;
        const strokeWidth = 2;

        // Helper function to create SVG with path
        const createSVG = (pathData: string, title: string): string => {
            return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <path d="${pathData}" stroke="black" stroke-width="${strokeWidth}" fill="none"/>
</svg>`;
        };

        // Helper function to generate points for curves
        const generateCurvePoints = (fadeType: "linear" | "log" | "exp", direction: "in" | "out"): string => {
            const points: string[] = [];
            const steps = 50;

            for (let i = 0; i <= steps; i++) {
                const t = i / steps; // 0 to 1
                let volume: number;

                if (fadeType === "linear") {
                    volume = direction === "in" ? t : 1 - t;
                } else if (fadeType === "log") {
                    // Logarithmic fade (more gradual at start/end)
                    if (direction === "in") {
                        volume = Math.log10(1 + t * 9) / Math.log10(10);
                    } else {
                        volume = Math.log10(1 + (1 - t) * 9) / Math.log10(10);
                    }
                } else {
                    // exponential
                    // Exponential fade (steep at start/end)
                    if (direction === "in") {
                        volume = Math.pow(t, 2);
                    } else {
                        volume = Math.pow(1 - t, 2);
                    }
                }

                const x = padding + t * (width - 2 * padding);
                const y = height - padding - volume * (height - 2 * padding);

                if (i === 0) {
                    points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
                } else {
                    points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
                }
            }

            return points.join(" ");
        };

        // Generate all 6 fade curves
        const linearIn = createSVG(generateCurvePoints("linear", "in"), "Linear Fade In");
        const linearOut = createSVG(generateCurvePoints("linear", "out"), "Linear Fade Out");
        const logIn = createSVG(generateCurvePoints("log", "in"), "Logarithmic Fade In");
        const logOut = createSVG(generateCurvePoints("log", "out"), "Logarithmic Fade Out");
        const expIn = createSVG(generateCurvePoints("exp", "in"), "Exponential Fade In");
        const expOut = createSVG(generateCurvePoints("exp", "out"), "Exponential Fade Out");

        return [linearIn, linearOut, logIn, logOut, expIn, expOut];
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export { Playground };
