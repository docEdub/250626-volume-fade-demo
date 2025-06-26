class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // Create a basic scene.
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        scene.createDefaultEnvironment({
            createGround: false,
            createSkybox: false,
        });
        scene.createDefaultCameraOrLight(true, true, false);
        const camera = scene.activeCamera as BABYLON.ArcRotateCamera;
        camera.alpha = Math.PI / 2;
        camera.radius = 0.05;
        camera.target.y = -0.007;

        BABYLON.AppendSceneAsync("https://playground.babylonjs.com/scenes/BoomBox.glb", scene);

        // Load music and play it when the audio engine is unlocked.
        let musicSound: BABYLON.StreamingSound | null = null;
        (async () => {
            const audioEngine = await BABYLON.CreateAudioEngineAsync();
            const music = await BABYLON.CreateStreamingSoundAsync("music", "https://amf-ms.github.io/AudioAssets/samples/mobygratis/bird.mp3", { loop: true });

            // Wait for the audio engine to unlock
            await audioEngine.unlockAsync();

            music.play();
            musicSound = music;
        })();

        // Add GUI.
        Playground.CreateGUI(scene, () => musicSound);

        return scene;
    }

    /**
     * Creates a 2D GUI with 6 round buttons in a row at the bottom of the screen
     * @param scene The Babylon.js scene to attach the GUI to
     * @param getMusicSound Function to get the current music sound for analyzer access
     * @returns The GUI AdvancedDynamicTexture
     */
    public static CreateGUI(scene: BABYLON.Scene, getMusicSound?: () => BABYLON.StreamingSound | null): BABYLON.GUI.AdvancedDynamicTexture {
        // Create a fullscreen GUI
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

        // Create analyzer visualization
        const analyzerContainer = new BABYLON.GUI.Rectangle();
        analyzerContainer.widthInPixels = 420;
        analyzerContainer.heightInPixels = 40;
        analyzerContainer.cornerRadius = 10;
        analyzerContainer.color = "white";
        analyzerContainer.background = "rgba(0, 0, 0, 0.7)";
        analyzerContainer.thickness = 2;
        analyzerContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        analyzerContainer.paddingTopInPixels = -220; // Position above the buttons
        analyzerContainer.paddingBottomInPixels = 170;

        // Create analyzer bars
        const analyzerBars: BABYLON.GUI.Rectangle[] = [];
        const barCount = 32;
        const barWidth = 8;
        const barSpacing = 4;
        const maxBarHeight = 80;

        for (let i = 0; i < barCount; i++) {
            const bar = new BABYLON.GUI.Rectangle();
            bar.widthInPixels = barWidth;
            bar.heightInPixels = 2;
            bar.background = `hsl(${180 + i * 5}, 70%, 60%)`;
            bar.thickness = 0;
            bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            bar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            bar.leftInPixels = 20 + i * (barWidth + barSpacing);
            bar.paddingBottomInPixels = 10;

            analyzerBars.push(bar);
            analyzerContainer.addControl(bar);
        }

        // Add analyzer title
        const analyzerTitle = new BABYLON.GUI.TextBlock();
        analyzerTitle.text = "Audio Spectrum Analyzer";
        analyzerTitle.color = "white";
        analyzerTitle.fontSize = "14px";
        analyzerTitle.paddingTopInPixels = -50;
        analyzerContainer.addControl(analyzerTitle);

        advancedTexture.addControl(analyzerContainer);

        // Update analyzer bars based on audio data
        if (getMusicSound) {
            scene.onBeforeRenderObservable.add(() => {
                const musicSound = getMusicSound();
                if (musicSound && musicSound.analyzer) {
                    const analyzer = musicSound.analyzer;
                    const dataArray = analyzer.getByteFrequencyData();

                    // Update bars with frequency data
                    for (let i = 0; i < analyzerBars.length; i++) {
                        const bar = analyzerBars[i];
                        // Map bar index to frequency data (focusing on lower frequencies for better visualization)
                        const dataIndex = Math.floor((i / analyzerBars.length) * dataArray.length * 0.3);
                        const value = dataArray[dataIndex] / 255; // Normalize to 0-1
                        const barHeight = Math.max(2, value * maxBarHeight);
                        bar.heightInPixels = barHeight;

                        // Color based on intensity
                        const hue = 180 + i * 5 + value * 60;
                        const saturation = 70 + value * 30;
                        const lightness = 40 + value * 40;
                        bar.background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                    }
                }
            });
        }

        // Create a container for the buttons
        const buttonContainer = new BABYLON.GUI.StackPanel();
        buttonContainer.isVertical = false; // Horizontal layout
        buttonContainer.heightInPixels = 140; // Reduced height since SVGs are now inside buttons
        buttonContainer.adaptWidthToChildren = true; // Auto-size width based on children
        buttonContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        buttonContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        buttonContainer.paddingBottomInPixels = 20;

        // Button labels
        const buttonLabels = ["Linear\nfade in", "Linear\nfade out", "Logarithmic\nfade in", "Logarithmic\nfade out", "Exponential\nfade in", "Exponential\nfade out"];

        // Get the SVG fade curves
        const svgCurves = Playground.CreateVolumeFadeSVGs();

        // Create 6 round buttons with SVGs
        for (let i = 0; i < 6; i++) {
            // Create the button
            const button = BABYLON.GUI.Button.CreateImageWithCenterTextButton(`button${i}`, buttonLabels[i], "data:image/svg+xml;base64," + btoa(svgCurves[i]));

            // Make the button round
            button.widthInPixels = 120;
            button.heightInPixels = 120;
            button.cornerRadius = 10;
            button.color = "white";
            button.background = "#4CAF50";
            button.fontSize = "10px";
            button.paddingLeftInPixels = 5;
            button.paddingRightInPixels = 5;

            // Configure the image (SVG) positioning
            if (button.image) {
                button.image.widthInPixels = 80;
                button.image.heightInPixels = 20;
                button.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                button.image.paddingTopInPixels = -40; // Move image up from center
            }

            // Configure the text positioning
            if (button.textBlock) {
                button.textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
                button.textBlock.paddingTopInPixels = 60; // Move text down from center, below the SVG
            }

            // Hover effects
            button.pointerEnterAnimation = () => {
                button.background = "#45a049";
            };
            button.pointerOutAnimation = () => {
                button.background = "#4CAF50";
            };

            // Click event
            button.onPointerClickObservable.add(() => {
                console.log(`Button ${i + 1} clicked: ${buttonLabels[i]}`);
                // You can add specific functionality for each button here
            });

            buttonContainer.addControl(button);
        }

        // Add the container to the GUI
        advancedTexture.addControl(buttonContainer);

        return advancedTexture;
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
  <path d="${pathData}" stroke="white" stroke-width="${strokeWidth}" fill="none"/>
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
                    // Logarithmic fade matching GetLogCurve function
                    if (direction === "in") {
                        // For fade in: use the log curve as-is
                        const x = t + 1 / 50; // Add small increment to avoid log(0)
                        volume = Math.max(0, 1 + Math.log10(x) / Math.log10(50));
                    } else {
                        // For fade out: invert the log curve
                        const x = 1 - t + 1 / 50;
                        volume = Math.max(0, 1 + Math.log10(x) / Math.log10(50));
                    }
                } else {
                    // Exponential fade matching GetExpCurve function
                    if (direction === "in") {
                        // For fade in: use the exp curve as-is
                        volume = Math.exp(-11.512925464970227 * (1 - t));
                    } else {
                        // For fade out: invert the exp curve
                        volume = Math.exp(-11.512925464970227 * t);
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
