class Playground {
    public static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
        // Create a basic scene
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

        // Load music and play it when the audio engine is unlocked
        (async () => {
            const audioEngine = await BABYLON.CreateAudioEngineAsync({ volume: 0.5 });
            const music = await BABYLON.CreateStreamingSoundAsync("music", "https://amf-ms.github.io/AudioAssets/samples/mobygratis/bird.mp3", {
                analyzerEnabled: true,
                autoplay: true,
                loop: true,
            });

            const rampDuration = 2;
            let rampFinished = true;

            // Init GUI
            let guiButtons: BABYLON.GUI.Button[] = [];

            const { gui, buttons } = CreateGUI(scene, music, (buttonIndex: number) => {
                if (!rampFinished) {
                    console.warn("Previous ramp is still in progress, ignoring click.");
                    return;
                }

                console.log(`Button ${buttonIndex + 1} clicked: ${ButtonLabels[buttonIndex]}`);

                switch (buttonIndex) {
                    case 0: // Logarithmic fade in
                        music.volume = 0;
                        music.setVolume(1, { duration: 2, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        break;
                    case 1: // Logarithmic fade out
                        music.volume = 1;
                        music.setVolume(0, { duration: 2, shape: BABYLON.AudioParameterRampShape.Logarithmic });
                        break;
                    case 2: // Linear fade in
                        music.volume = 0;
                        music.setVolume(1, { duration: 2, shape: BABYLON.AudioParameterRampShape.Linear });
                        break;
                    case 3: // Linear fade out
                        music.volume = 1;
                        music.setVolume(0, { duration: 2, shape: BABYLON.AudioParameterRampShape.Linear });
                        break;
                    case 4: // Exponential fade in
                        music.volume = 0;
                        music.setVolume(1, { duration: 2, shape: BABYLON.AudioParameterRampShape.Exponential });
                        break;
                    case 5: // Exponential fade out
                        music.volume = 1;
                        music.setVolume(0, { duration: 2, shape: BABYLON.AudioParameterRampShape.Exponential });
                        break;
                }

                rampFinished = false;

                // Disable buttons while ramping
                buttons.forEach((button) => {
                    button.isEnabled = false;
                    button.alpha = 0.5;
                });

                waitForRampToFinish();
            });

            const waitForRampToFinish = () => {
                setTimeout(() => {
                    rampFinished = true;

                    // Re-enable buttons
                    guiButtons.forEach((button) => {
                        button.isEnabled = true;
                        button.alpha = 1;
                    });
                }, (rampDuration + 0.5) * 1000);
            };

            // Store the buttons array for enabling/disabling
            guiButtons = buttons;
        })();

        return scene;
    }
}

const ButtonLabels = ["Logarithmic\nfade in", "Logarithmic\nfade out", "Linear\nfade in", "Linear\nfade out", "Exponential\nfade in", "Exponential\nfade out"];

function CreateGUI(
    scene: BABYLON.Scene,
    music: BABYLON.StreamingSound,
    onButtonClicked: (buttonIndex: number) => void
): { gui: BABYLON.GUI.AdvancedDynamicTexture; buttons: BABYLON.GUI.Button[] } {
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
    scene.onBeforeRenderObservable.add(() => {
        const analyzer = music.analyzer;
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
    });

    // Create a container for the buttons
    const buttonContainer = new BABYLON.GUI.StackPanel();
    buttonContainer.isVertical = false;
    buttonContainer.heightInPixels = 140;
    buttonContainer.adaptWidthToChildren = true;
    buttonContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    buttonContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    buttonContainer.paddingBottomInPixels = 20;

    // Get the SVG fade curves
    const svgCurves = CreateVolumeFadeSVGs();

    // Array to store all buttons
    const buttons: BABYLON.GUI.Button[] = [];

    // Create 6 round buttons with SVGs
    for (let i = 0; i < 6; i++) {
        // Create the button
        const button = BABYLON.GUI.Button.CreateImageWithCenterTextButton(`button${i}`, ButtonLabels[i], "data:image/svg+xml;base64," + btoa(svgCurves[i]));
        button.widthInPixels = 120;
        button.heightInPixels = 120;
        button.cornerRadius = 10;
        button.color = "white";
        button.background = "transparent"; // Make transparent so SVG gradient shows through
        button.fontSize = "10px";
        button.paddingLeftInPixels = 5;
        button.paddingRightInPixels = 5;

        // Configure the image (SVG) positioning
        if (button.image) {
            button.image.widthInPixels = 120; // Match button width
            button.image.heightInPixels = 120; // Match button height
            button.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            button.image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        }

        // Configure the text positioning
        if (button.textBlock) {
            button.textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            button.textBlock.paddingBottomInPixels = -60; // Move text to bottom of button
            button.textBlock.color = "white";
            button.textBlock.outlineWidth = 1;
            button.textBlock.outlineColor = "black"; // Add outline for better readability
            button.textBlock.fontSize = "14px";
        }

        // Hover effects
        button.pointerEnterAnimation = () => {
            button.background = "rgba(160, 69, 73, 0.3)"; // Semi-transparent green overlay on hover
        };
        button.pointerOutAnimation = () => {
            button.background = "transparent";
        };

        // Click event
        button.onPointerClickObservable.add(() => {
            onButtonClicked(i);
        });

        buttons.push(button);
        buttonContainer.addControl(button);
    }

    // Add the container to the GUI
    advancedTexture.addControl(buttonContainer);

    return { gui: advancedTexture, buttons };
}

/**
 * Creates SVG markup for 6 different audio volume fade curves
 * @returns Array of 6 SVG strings: [linearIn, linearOut, logIn, logOut, expIn, expOut]
 */
function CreateVolumeFadeSVGs(): string[] {
    const width = 120; // Match button width
    const height = 120; // Match button height
    const padding = 20;
    const strokeWidth = 3;

    // Helper function to generate gradient stops based on volume curve
    const generateGradientStops = (fadeType: "linear" | "log" | "exp", direction: "in" | "out"): string => {
        const stops: string[] = [];
        const steps = 10; // Use fewer steps for gradients

        for (let i = 0; i <= steps; i++) {
            const t = i / steps; // 0 to 1
            let volume: number;

            if (fadeType === "linear") {
                volume = direction === "in" ? t : 1 - t;
            } else if (fadeType === "log") {
                // Logarithmic fade - make gradient less steep than actual curve
                if (direction === "in") {
                    const x = t + 1 / 50;
                    const actualVolume = Math.max(0, 1 + Math.log10(x) / Math.log10(50));
                    // Blend with linear for less steep gradient (more linear blend)
                    volume = 0.5 * actualVolume + 0.5 * t;
                } else {
                    const x = 1 - t + 1 / 50;
                    const actualVolume = Math.max(0, 1 + Math.log10(x) / Math.log10(50));
                    // Blend with linear for less steep gradient (more linear blend)
                    volume = 0.5 * actualVolume + 0.5 * (1 - t);
                }
            } else {
                // Exponential fade - make gradient less steep than actual curve
                if (direction === "in") {
                    const actualVolume = Math.exp(-11.512925464970227 * (1 - t));
                    // Blend with linear for less steep gradient (more linear blend)
                    volume = 0.5 * actualVolume + 0.5 * t;
                } else {
                    const actualVolume = Math.exp(-11.512925464970227 * t);
                    // Blend with linear for less steep gradient (more linear blend)
                    volume = 0.5 * actualVolume + 0.5 * (1 - t);
                }
            }

            const percentage = (t * 100).toFixed(1);
            stops.push(`<stop offset="${percentage}%" style="stop-color:rgba(76,80,175,${volume.toFixed(2)}); stop-opacity:1"/>`);
        }

        return stops.join("\n      ");
    };

    // Helper function to create SVG with path and gradient background
    const createSVG = (pathData: string, title: string, gradientId: string, gradientStops: string): string => {
        return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      ${gradientStops}
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#${gradientId})"/>
  <path d="${pathData}" stroke="white" stroke-width="${strokeWidth}" fill="none"/>
</svg>`;
    };

    // Helper function to generate points for curves
    const generateCurvePoints = (fadeType: "linear" | "log" | "exp", direction: "in" | "out"): string => {
        const points: string[] = [];
        const steps = 50;

        const offsetY = -20;

        for (let i = 0; i <= steps; i++) {
            let step = i / steps; // 0 to 1
            const t = direction === "in" ? step : 1 - step; // Reverse t for fade out

            let volume: number;

            if (fadeType === "linear") {
                volume = t;
            } else if (fadeType === "log") {
                // Logarithmic fade matching GetLogCurve function
                const x = t + 1 / 50; // Add small increment to avoid log(0)
                volume = Math.max(0, 1 + Math.log10(x) / Math.log10(50));
            } else {
                // Exponential fade matching GetExpCurve function
                volume = Math.exp(-11.512925464970227 * (1 - t));
            }

            const x = padding + step * (width - 2 * padding);
            const y = height - padding - volume * (height - 4 * padding) - padding; // Center the curve vertically

            points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${(offsetY + y).toFixed(2)}`);
        }

        return points.join(" ");
    };

    // Generate all 6 fade curves
    const logIn = createSVG(generateCurvePoints("log", "in"), "Logarithmic Fade In", "logInGrad", generateGradientStops("log", "in"));
    const logOut = createSVG(generateCurvePoints("log", "out"), "Logarithmic Fade Out", "logOutGrad", generateGradientStops("log", "out"));
    const linearIn = createSVG(generateCurvePoints("linear", "in"), "Linear Fade In", "linearInGrad", generateGradientStops("linear", "in"));
    const linearOut = createSVG(generateCurvePoints("linear", "out"), "Linear Fade Out", "linearOutGrad", generateGradientStops("linear", "out"));
    const expIn = createSVG(generateCurvePoints("exp", "in"), "Exponential Fade In", "expInGrad", generateGradientStops("exp", "in"));
    const expOut = createSVG(generateCurvePoints("exp", "out"), "Exponential Fade Out", "expOutGrad", generateGradientStops("exp", "out"));

    return [logIn, logOut, linearIn, linearOut, expIn, expOut];
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export { Playground };
