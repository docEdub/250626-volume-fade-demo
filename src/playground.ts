//playground.babylonjs.com/#HDPCXJ#2

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
        camera.radius = 0.09;
        camera.target.y = 0.01;

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
const ButtonWidth = 95;
const ButtonHeight = 80;
const ButtonPadding = 5;
const ButtonFontSize = "11px";

function CreateGUI(
    scene: BABYLON.Scene,
    music: BABYLON.StreamingSound,
    onButtonClicked: (buttonIndex: number) => void
): { gui: BABYLON.GUI.AdvancedDynamicTexture; buttons: BABYLON.GUI.Button[] } {
    // Create a fullscreen GUI
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

    // Create analyzer visualization
    const analyzerContainer = new BABYLON.GUI.Rectangle();
    analyzerContainer.widthInPixels = 356;
    analyzerContainer.heightInPixels = 40;
    analyzerContainer.background = "rgba(0, 0, 0, 0.7)";
    analyzerContainer.thickness = 0;
    analyzerContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    analyzerContainer.paddingTopInPixels = -100;
    analyzerContainer.paddingBottomInPixels = 30;

    // Create analyzer bars
    const analyzerBars: BABYLON.GUI.Rectangle[] = [];
    const barCount = 32;
    const barWidth = 7;
    const barSpacing = 4;
    const maxBarHeight = 100;

    for (let i = 0; i < barCount; i++) {
        const bar = new BABYLON.GUI.Rectangle();
        bar.widthInPixels = barWidth;
        bar.heightInPixels = 2;
        bar.background = `hsl(${180 + i * 5}, 70%, 60%)`;
        bar.thickness = 0;
        bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        bar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        bar.leftInPixels = 4 + i * (barWidth + barSpacing);

        analyzerBars.push(bar);
        analyzerContainer.addControl(bar);
    }

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

    // Create a main container for all buttons
    const mainButtonContainer = new BABYLON.GUI.StackPanel();
    mainButtonContainer.isVertical = true;
    mainButtonContainer.heightInPixels = 340;
    mainButtonContainer.adaptWidthToChildren = true;
    mainButtonContainer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    mainButtonContainer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainButtonContainer.paddingTopInPixels = 20;

    // Create call-to-action text label
    const instructions = new BABYLON.GUI.TextBlock();
    instructions.text = "Choose a fade shape to hear volume transition effects";
    instructions.color = "white";
    instructions.fontSize = "14px";
    instructions.widthInPixels = 500;
    instructions.heightInPixels = 30;
    instructions.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    instructions.paddingBottomInPixels = 10;

    // Create 1st row container for "logarithmic" buttons
    const row1 = new BABYLON.GUI.StackPanel();
    row1.isVertical = false;
    row1.heightInPixels = ButtonHeight + 2 * ButtonPadding;
    row1.adaptWidthToChildren = true;
    row1.paddingTopInPixels = ButtonPadding;
    row1.paddingBottomInPixels = ButtonPadding;

    // Create 2nd row container for "linear" buttons
    const row2 = new BABYLON.GUI.StackPanel();
    row2.isVertical = false;
    row2.heightInPixels = ButtonHeight + 2 * ButtonPadding;
    row2.adaptWidthToChildren = true;
    row2.paddingTopInPixels = ButtonPadding;
    row2.paddingBottomInPixels = ButtonPadding;

    // Create bottom row container for "exponential" buttons
    const row3 = new BABYLON.GUI.StackPanel();
    row3.isVertical = false;
    row3.heightInPixels = ButtonHeight + 2 * ButtonPadding;
    row3.adaptWidthToChildren = true;
    row3.paddingTopInPixels = ButtonPadding;
    row3.paddingBottomInPixels = ButtonPadding;

    const buttonRows = [row1, row2, row3];

    // Get the SVG fade curves
    const svgCurves = CreateVolumeFadeSVGs();

    // Array to store all buttons
    const buttons: BABYLON.GUI.Button[] = [];

    // Create buttons and organize them into three rows
    for (let i = 0; i < ButtonLabels.length; i++) {
        const button = BABYLON.GUI.Button.CreateImageWithCenterTextButton(`button-${i}`, ButtonLabels[i], "data:image/svg+xml;base64," + btoa(svgCurves[i]));
        button.widthInPixels = ButtonWidth;
        button.heightInPixels = ButtonHeight;
        button.cornerRadius = 5;
        button.color = "rgb(127, 127, 127)";
        button.background = "transparent";
        button.paddingLeftInPixels = 2;
        button.paddingRightInPixels = 2;

        // Configure the image (SVG) positioning
        if (button.image) {
            button.image.widthInPixels = ButtonWidth;
            button.image.heightInPixels = ButtonHeight;
            button.image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            button.image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        }

        // Configure the text positioning
        if (button.textBlock) {
            button.textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            button.textBlock.paddingBottomInPixels = -30;
            button.textBlock.color = "white";
            button.textBlock.fontSize = ButtonFontSize;
        }

        // Hover effects
        button.pointerEnterAnimation = () => {
            button.background = "rgba(160, 69, 73, 0.3)";
        };
        button.pointerOutAnimation = () => {
            button.background = "transparent";
        };

        // Click event
        button.onPointerClickObservable.add(() => {
            onButtonClicked(i);
        });

        buttons[i] = button;

        buttonRows[Math.floor(i / 2)].addControl(button);
    }

    // Add the call-to-action text and row containers to the main container
    mainButtonContainer.addControl(instructions);
    mainButtonContainer.addControl(row1);
    mainButtonContainer.addControl(row2);
    mainButtonContainer.addControl(row3);

    // Add the main container to the GUI
    advancedTexture.addControl(mainButtonContainer);

    return { gui: advancedTexture, buttons };
}

/**
 * Creates SVG markup for 6 different audio volume fade curves
 * @returns Array of 6 SVG strings: [linearIn, linearOut, logIn, logOut, expIn, expOut]
 */
function CreateVolumeFadeSVGs(): string[] {
    const width = 60; // Match button width
    const height = 60; // Match button height
    const padding = 0;
    const strokeWidth = 2;

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

        const offsetY = 7;

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
            const y = 0.3 * (height - padding - volume * (height - 4 * padding) - padding); // Center the curve vertically

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
