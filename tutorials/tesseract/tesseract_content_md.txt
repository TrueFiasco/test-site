# Tesseract Tutorial Content

## Section 1: TESSERACT Overview

### Left Content
# TESSERACT Overview

Welcome to this interactive tutorial on creating a 4D hypercube (tesseract) in TouchDesigner using GLSL shaders. This project demonstrates advanced techniques for 4D rotation, perspective projection, and real-time interaction.

:::tip
**Pro Tip:** Understanding 4D rotations requires thinking beyond our 3D intuition. We'll break this down step by step!
:::

## What We'll Cover:

- **CHOP Networks:** Mouse input processing and rotation control
- **4D Mathematics:** Rotation matrices and perspective projection
- **GLSL Shaders:** Vertex transformation and SDF rendering
- **Interactive Controls:** Real-time parameter manipulation

### Right Content
## Key Resources:

This tutorial references concepts from:

- [Tesseract mathematics](https://en.wikipedia.org/wiki/Tesseract)
- [4D projection techniques](https://hollasch.github.io/ray4/Four-Space_Visualization_of_4D_Objects.html)
- [4D rotation matrices](https://en.wikipedia.org/wiki/Rotation_matrix#In_four_dimensions)
- [3D rotation matrices](https://en.wikipedia.org/wiki/Rotation_matrix)
- [Inigo Quilez's SDF functions](https://iquilezles.org/articles/distfunctions2d/)
- [Writing GLSL TOPs in TouchDesigner](https://docs.derivative.ca/GLSL_TOP)

---

## Section 2: The CHOP Network

### Left Content
# The CHOP Network

Our CHOP network processes mouse input to control the hypercube rotation. We can use any input device to control any axis or parameter - the flexibility of TouchDesigner shines here.

## Input Sources:

We take mouse position from either **mousein** or **panel** CHOPs, and scroll increment from mousein to control our hypercube rotation.

## Network Flow:

The network processes raw input → applies velocity calculations → converts to angular position → feeds rotation matrices.

### Right Content
## Input Device Flexibility

We didn't have to use the mouse as our input - we could have used any input devices like:

- **Xbox Controller:** Analog sticks for smooth rotation
- **USB Joystick:** Traditional flight stick input
- **Kinect:** Body tracking for gesture control
- **Leap Motion:** Hand tracking and finger gestures
- **MIDI Device:** Knobs and faders for precise control

---

## Section 3: Input Data 1: Mouse UV Control

### Left Content
# Input Data 1: Mouse UV Control

Using panel CHOP to get mouse UV coordinates, selecting **rollu** and **rollv** or **tx ty** from mousein to control the Y and X axis respectively.

## Key CHOPs:

- **panel1:** Captures mouse UV coordinates
- **mousein1:** Raw mouse input data
- **select1:** Filters specific channels

:::tip
**Remember:** UV coordinates give us normalized 0-1 values, perfect for controlling rotations!
:::

### Right Content
## Mouse vs Panel Monitoring:

**MouseIn CHOP:** Monitors mouse position across the entire monitor/desktop space.

**Panel CHOP:** Monitors mouse position only within a specific TouchDesigner window or panel.

This gives us the flexibility to choose our input monitoring scope based on the project requirements.

---

## Section 4: Rangeling CHOPs 1: Mouse Velocity

### Left Content
# Rangeling CHOPs 1: Mouse Velocity

I increase the responsive part of the interaction, which is driven by mouse velocity. We use a **slope** CHOP to get velocity and a **filter** to give this a more natural feel when you stop moving the mouse.

## Processing Chain:

- **math3:** Mathematical operations on input
- **slope1:** Calculates velocity from position changes
- **filter1:** Smooths the velocity for natural feel

:::tip
**Pro Tip:** Velocity-based interaction feels more intuitive than direct position mapping!
:::

### Right Content
## How Slope CHOP Works

The **Slope CHOP** is a powerful tool for converting position data into velocity data:

## Process:

- **Buffer Last Frame:** Stores the mouse position from the previous frame
- **Compare Positions:** Takes current frame position minus last frame position
- **Calculate Velocity:** The difference between these two positions becomes our velocity
- **Frame Rate Dependent:** Velocity is calculated per frame, giving us smooth motion data

This converts two static positions into dynamic velocity information, essential for responsive interaction.

---

## Section 5: Rangeling CHOPs 2: Centering and Scaling

### Left Content
# Rangeling CHOPs 2: Centering and Scaling

I use a **math** CHOP to center the pre-normalized mouse UV from 0-1 to -0.5 to 0.5 with -0.5 pre-add, then make it a small value to create gentle interaction using this input as a gentle constant force rather than sudden bursts from mouse velocity.

## Process:

- Add -0.5 to center the UV coordinates
- Scale down for gentle interaction
- Use as constant force rather than velocity burst
- Convert acceleration to velocity with speed2

Since it's a force, I use **speed2** to convert acceleration into velocity.

### Right Content
## Position as Constant Force

We're using the mouse position as a **constant force** rather than direct position mapping:

## Force-Based Interaction:

- **Acceleration Input:** Mouse position becomes acceleration force
- **Speed CHOP Integration:** Converts acceleration into velocity over time
- **Velocity Accumulation:** Velocity builds up gradually rather than instant jumps
- **Speed Limiting:** Without limits, velocity would increase infinitely

**Why This Matters:** If we didn't limit the speed, our velocity would keep increasing indefinitely, making the interaction uncontrollable. The Speed CHOP acts like friction, giving us natural, physics-based movement.

---

## Section 6: Rangeling CHOPs 3: Angular Velocity

### Left Content
# Rangeling CHOPs 3: Angular Velocity

Adding the velocity from mouse movement and position, we get the current total angular velocity which we give to the **speed3** CHOP. This updates every frame to give us the current angular position for our rotation matrix.

## Key CHOPs:

- **math2:** Combines velocity and position inputs
- **speed3:** Integrates angular velocity to position

This gives us smooth, continuous rotation that responds to both mouse movement and position.

### Right Content
## Integration Process

The Speed CHOP acts as an integrator, converting our angular velocity into angular position over time. This creates the smooth, continuous rotation we see in the final result.

The combination of velocity-based and position-based inputs gives us both immediate responsiveness and gentle, continuous movement when the mouse is stationary.

---

## Section 7: Rangeling CHOPs 4: Mouse Wheel

### Left Content
# Rangeling CHOPs 4: Mouse Wheel

Selecting mouse wheel from the mousein CHOP, filtering it in a few different ways. No real rhyme or reason - I wanted it to feel like it had weight, so I used one long box filter, wanted it to take longer to stop so used a long left half box filter first, followed by a short Gaussian to smooth anything else, then one final box filter.

:::tip
**Pro Tip:** If you ever want to see how a filter is affecting your input, try using a **trail** CHOP to compare the input and output of the filter CHOP.
:::

This creates a weighted, inertial feel for the mouse wheel input that feels natural and responsive.

### Right Content
:::image
source: Tesseract%20Tutorial%20Pictures/Network%20images/filter_trail_example.png
alt: Filter Trail Example
:::

---

## Section 8: Rangeling CHOPs 5: Merging and Null

### Left Content
# Rangeling CHOPs 5: Merging and Null

Merging everything together and ending it with a null.

:::tip
**Golden Rule:** Always end your CHOP network with a null and try to merge as much together as makes sense.
:::

This creates clean, organized networks that are easier to debug and maintain. The null acts as a clean output point and prevents unexpected behavior from downstream connections.

## Final Output:

Our CHOP network now outputs clean rotation values ready for our GLSL shaders!

### Right Content
## Network Organization Benefits

Using nulls and proper merging provides several advantages:

- **Clean Outputs:** Single connection point for downstream operators
- **Easier Debugging:** Clear signal flow and isolation points
- **Performance:** Reduced connections and cleaner data flow
- **Maintainability:** Easier to modify and expand the network

---

## Section 9: Input Data 2: Saved Data from TSV

### Left Content
# Input Data 2: Saved Data from TSV

In TouchDesigner we can input saved data in loads of ways. Here I've used a TSV file saved from a previous project in 2021 and loaded with a **table DAT**, but equally it could have been saved as a waveform and opened with the **filein CHOP**, or as a texture where tx, ty, tz, tw are stored as RGBA.

## Data Storage Options:

- **TSV/CSV files:** Table DAT for structured data
- **Waveforms:** Filein CHOP for time-based data
- **Textures:** RGBA channels for 4D coordinates
- **GLSL sampling:** Direct access from shaders

You can also sample data in a GLSL TOP from DATs, CHOPs or TOPs. Each row in the DAT, sample in the CHOP, and pixel in TOP all store the same 4 channels of data over 33 samples.

:::tip
**Important:** Save as TSV so it will open as a table in TouchDesigner!
:::

### Right Content
:::widget tsv-table
source: https://raw.githubusercontent.com/TrueFiasco/website/main/Tesseract%20Tutorial%20Pictures/code/euler%20cycle.tsv
title: Euler Cycle TSV Data
controls: fullscreen,copy,download
:::

---

## Section 10: Rotation Vertex GLSL

### Left Content
# Rotation Vertex GLSL

We're using RWY, RY and RX from the null in our CHOP network. In our uniforms we need to assign them at the start of the shader and add them to our vector parameter.

## GLSL Components:

- 3 rotation matrices as helper functions
- Individual rotations (order dependent)
- 4D point multiplication
- Rotated point output

We multiply the individual rotations (order dependent), then multiply our rotation matrix with our 4D points and output our rotated points.

### Right Content
:::widget code-viewer
source: https://raw.githubusercontent.com/TrueFiasco/website/main/Tesseract%20Tutorial%20Pictures/code/vert_rotation_pixel.frag
title: Vertex Rotation GLSL
language: glsl
controls: fullscreen,copy,download
:::

---

## Section 11: Perspective GLSL

### Left Content
# Perspective GLSL

We have a few float uniforms in the perspective GLSL to give control on the 4D perspective and 3D perspective, to flatten it to 2D.

## Perspective Pipeline:

- **4D to 3D:** Project from 4D space to 3D
- **3D to 2D:** Standard perspective projection
- **Camera controls:** FOV, position, and depth

### Right Content
:::widget code-viewer
source: https://raw.githubusercontent.com/TrueFiasco/website/main/Tesseract%20Tutorial%20Pictures/code/vert_persprective_pixel.frag
title: Vertex Perspective GLSL
language: glsl
controls: fullscreen,copy,download
:::

---

## Section 12: 2D Points to 2D Lines

### Left Content
# 2D Points to 2D Lines

Preparing my 2D points position into a lines points position utilizing the Euler cycle. Using RG for the lines first point XY position and GA. I'm sure this could have been done in the perspective shader but it was easier to do this.

Being familiar with the **transform TOP** and knowing to set it to **repeat** so the first point connects to the last point.

## Line Generation:

- Convert point cloud to line segments
- Use Euler cycle for proper connectivity
- Transform TOP with repeat mode
- Closed loop formation

## Blur Result

When we blur from one pixel to the next, we're interpolating linearly between the values using a box filter in the Blur TOP.

This creates smooth transitions between line segments and helps with antialiasing in the final render. The blur operation essentially averages neighboring pixel values, creating smooth gradients that improve visual quality.

### Right Content
:::image
source: Tesseract%20Tutorial%20Pictures/Network%20images/blur.png
alt: Blur Result
caption: Blur result showing smooth line transitions
:::

---

## Section 13: SDF Uneven Capsule

### Left Content
# SDF Uneven Capsule

Again I was able to reuse a component I made in 2022 which would take in a texture where each pixel represents a capsule with two 2D points to be rendered in the SDF.

This uses [Inigo Quilez's SDF functions](https://iquilezles.org/articles/distfunctions2d/) for uneven capsules. No uniforms needed!

## SDF Rendering:

- Distance field calculation
- Variable capsule radius
- Efficient GPU rendering
- Smooth antialiasing

## Why Uneven Capsule vs Line SDF?

I could have used a standard line SDF instead, but I wanted to use the 4D value to help drive the width of the uneven capsule.

This gives us variable line thickness that responds to the 4th dimension, creating a more dynamic visual representation of the 4D structure. The capsule approach allows for organic, flowing line weights that enhance the perception of depth and dimension.

### Right Content
:::widget code-viewer
source: https://raw.githubusercontent.com/TrueFiasco/website/main/Tesseract%20Tutorial%20Pictures/code/line_mindist_pixel.frag
title: SDF Line Min Distance GLSL
language: glsl
controls: fullscreen,copy,download
:::

---

## Section 14: Post Processing

### Left Content
# Post Processing

Using limits, ramps, threshold and lookups to create an interesting result.

## Post Effects Chain:

- **Limits:** Clamp value ranges
- **Ramps:** Smooth gradients
- **Threshold:** Binary decisions
- **Lookups:** Color mapping

These effects transform the raw SDF output into a visually appealing final result with proper contrast and color.

### Right Content
## Effect Purpose

Each post-processing step serves a specific purpose in creating the final visual:

- **Limits:** Prevent over-bright or under-dark values
- **Ramps:** Create smooth color transitions
- **Threshold:** Create sharp cutoffs for specific effects
- **Lookups:** Apply color palettes and artistic looks

The combination of these effects allows for fine-tuned control over the final appearance of our 4D hypercube visualization.