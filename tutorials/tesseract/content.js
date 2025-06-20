/**
 * Tesseract Tutorial Content Configuration - Updated for GitHub Repository
 * Content-only configuration - hotspots now managed separately in hotspots.js
 */
const TesseractContent = {
  tutorial: {
    id: "tesseract-tutorial",
    title: "TESSERACT Tutorial",
    sections: [
      // Section 1: TESSERACT Overview
      {
        id: 1,
        title: "TESSERACT Overview",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>TESSERACT Overview</h1>
              <p>Welcome to this interactive tutorial on creating a 4D hypercube (tesseract) in TouchDesigner using GLSL shaders. This project demonstrates advanced techniques for 4D rotation, perspective projection, and real-time interaction.</p>
              
              <div class="tip">
                <strong>Pro Tip:</strong> Understanding 4D rotations requires thinking beyond our 3D intuition. We'll break this down step by step!
              </div>
              
              <h3>What We'll Cover:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>CHOP Networks:</strong> Mouse input processing and rotation control</li>
                <li><strong>4D Mathematics:</strong> Rotation matrices and perspective projection</li>
                <li><strong>GLSL Shaders:</strong> Vertex transformation and SDF rendering</li>
                <li><strong>Interactive Controls:</strong> Real-time parameter manipulation</li>
              </ul>
              
              <!-- GitHub Download Button -->
              <a href="https://github.com/TrueFiasco/TouchDesigner-Tutorials/tree/main/Tesseract" target="_blank" class="github-download-btn">
                <svg class="github-logo" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Download Complete Project
              </a>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Key Resources:</h3>
              <p>This tutorial references concepts from:</p>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><a href="https://en.wikipedia.org/wiki/Tesseract" target="_blank" style="color: #00ffff;">Tesseract mathematics</a></li>
                <li><a href="https://hollasch.github.io/ray4/Four-Space_Visualization_of_4D_Objects.html" target="_blank" style="color: #00ffff;">4D projection techniques</a></li>
                <li><a href="https://en.wikipedia.org/wiki/Rotation_matrix#In_four_dimensions" target="_blank" style="color: #00ffff;">4D rotation matrices</a></li>
                <li><a href="https://en.wikipedia.org/wiki/Rotation_matrix" target="_blank" style="color: #00ffff;">3D rotation matrices</a></li>
                <li><a href="https://iquilezles.org/articles/distfunctions2d/" target="_blank" style="color: #00ffff;">Inigo Quilez's SDF functions</a></li>
                <li><a href="https://docs.derivative.ca/GLSL_TOP" target="_blank" style="color: #00ffff;">Writing GLSL TOPs in TouchDesigner</a></li>
              </ul>
              
              <div style="margin-top: 2rem; padding: 1rem; background: rgba(0, 255, 255, 0.1); border-radius: 8px; border: 1px solid rgba(0, 255, 255, 0.3);">
                <h4 style="color: #00ffff; margin: 0 0 0.5rem 0;">📂 Project Files</h4>
                <p style="font-size: 0.9rem; margin: 0; line-height: 1.4;">All code, shaders, and TouchDesigner project files are available in our GitHub repository. Click individual download buttons throughout the tutorial to view specific files.</p>
              </div>
            `
          }
        },
        background: {
          image: "assets/images/network_overview.png",
          aspectRatio: "3615:1097",
          transition: { type: "slideRight", offset: { x: 1.0, y: 0 } }
        }
      },

      // Section 2: The CHOP Network
      {
        id: 2,
        title: "The CHOP Network",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>The CHOP Network</h1>
              <p>Our CHOP network processes mouse input to control the hypercube rotation. We can use any input device to control any axis or parameter - the flexibility of TouchDesigner shines here.</p>
              
              <h3>Input Sources:</h3>
              <p>We take mouse position from either <span class="highlight">mousein</span> or <span class="highlight">panel</span> CHOPs, and scroll increment from mousein to control our hypercube rotation.</p>
              
              <h3>Network Flow:</h3>
              <p>The network processes raw input → applies velocity calculations → converts to angular position → feeds rotation matrices.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Input Device Flexibility</h3>
              <p>We didn't have to use the mouse as our input - we could have used any input devices like:</p>
              <ul style="margin-left: 1rem; line-height: 1.8;">
                <li><strong>Xbox Controller:</strong> Analog sticks for smooth rotation</li>
                <li><strong>USB Joystick:</strong> Traditional flight stick input</li>
                <li><strong>Kinect:</strong> Body tracking for gesture control</li>
                <li><strong>Leap Motion:</strong> Hand tracking and finger gestures</li>
                <li><strong>MIDI Device:</strong> Knobs and faders for precise control</li>
              </ul>
            `
          }
        },
        background: {
          image: "assets/images/chop_network.png",
          aspectRatio: "1852:571",
          transition: { type: "slideRight", offset: { x: 1.0, y: 0 } }
        }
      },

      // Section 3: Input Data 1: Mouse UV Control
      {
        id: 3,
        title: "Input Data 1: Mouse UV Control",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Input Data 1: Mouse UV Control</h1>
              <p>Using panel CHOP to get mouse UV coordinates, selecting <span class="highlight">rollu</span> and <span class="highlight">rollv</span> or <span class="highlight">tx ty</span> from mousein to control the Y and X axis respectively.</p>

              <h3>Key CHOPs:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>panel1:</strong> Captures mouse UV coordinates</li>
                <li><strong>mousein1:</strong> Raw mouse input data</li>
                <li><strong>select1:</strong> Filters specific channels</li>
              </ul>

              <div class="tip">
                <strong>Remember:</strong> UV coordinates give us normalized 0-1 values, perfect for controlling rotations!
              </div>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Mouse vs Panel Monitoring:</h3>
              <p><strong>MouseIn CHOP:</strong> Monitors mouse position across the entire monitor/desktop space.</p>
              <p><strong>Panel CHOP:</strong> Monitors mouse position only within a specific TouchDesigner window or panel.</p>
              
              <p>This gives us the flexibility to choose our input monitoring scope based on the project requirements.</p>
            `
          }
        },
        background: {
          image: "assets/images/mouse_uv_control.png",
          aspectRatio: "1852:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 4: Rangeling CHOPs 1: Mouse Velocity
      {
        id: 4,
        title: "Rangeling CHOPs 1: Mouse Velocity",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rangeling CHOPs 1: Mouse Velocity</h1>
              <p>I increase the responsive part of the interaction, which is driven by mouse velocity. We use a <span class="highlight">slope</span> CHOP to get velocity and a <span class="highlight">filter</span> to give this a more natural feel when you stop moving the mouse.</p>

              <h3>Processing Chain:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>math3:</strong> Mathematical operations on input</li>
                <li><strong>slope1:</strong> Calculates velocity from position changes</li>
                <li><strong>filter1:</strong> Smooths the velocity for natural feel</li>
              </ul>

              <div class="tip">
                <strong>Pro Tip:</strong> Velocity-based interaction feels more intuitive than direct position mapping!
              </div>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>How Slope CHOP Works</h3>
              <p>The <strong>Slope CHOP</strong> is a powerful tool for converting position data into velocity data:</p>
              
              <h4>Process:</h4>
              <ul style="margin-left: 1rem; line-height: 1.8;">
                <li><strong>Buffer Last Frame:</strong> Stores the mouse position from the previous frame</li>
                <li><strong>Compare Positions:</strong> Takes current frame position minus last frame position</li>
                <li><strong>Calculate Velocity:</strong> The difference between these two positions becomes our velocity</li>
                <li><strong>Frame Rate Dependent:</strong> Velocity is calculated per frame, giving us smooth motion data</li>
              </ul>
              
              <p>This converts two static positions into dynamic velocity information, essential for responsive interaction.</p>
            `
          }
        },
        background: {
          image: "assets/images/mouse_velocity.png",
          aspectRatio: "1852:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 5: Rangeling CHOPs 2: Centering and Scaling
      {
        id: 5,
        title: "Rangeling CHOPs 2: Centering and Scaling",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rangeling CHOPs 2: Centering and Scaling</h1>
              <p>I use a <span class="highlight">math</span> CHOP to center the pre-normalized mouse UV from 0-1 to -0.5 to 0.5 with -0.5 pre-add, then make it a small value to create gentle interaction using this input as a gentle constant force rather than sudden bursts from mouse velocity.</p>

              <h3>Process:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li>Add -0.5 to center the UV coordinates</li>
                <li>Scale down for gentle interaction</li>
                <li>Use as constant force rather than velocity burst</li>
                <li>Convert acceleration to velocity with speed2</li>
              </ul>

              <p>Since it's a force, I use <span class="highlight">speed2</span> to convert acceleration into velocity.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Position as Constant Force</h3>
              <p>We're using the mouse position as a <strong>constant force</strong> rather than direct position mapping:</p>
              
              <h4>Force-Based Interaction:</h4>
              <ul style="margin-left: 1rem; line-height: 1.8;">
                <li><strong>Acceleration Input:</strong> Mouse position becomes acceleration force</li>
                <li><strong>Speed CHOP Integration:</strong> Converts acceleration into velocity over time</li>
                <li><strong>Velocity Accumulation:</strong> Velocity builds up gradually rather than instant jumps</li>
                <li><strong>Speed Limiting:</strong> Without limits, velocity would increase infinitely</li>
              </ul>
              
              <p><strong>Why This Matters:</strong> If we didn't limit the speed, our velocity would keep increasing indefinitely, making the interaction uncontrollable. The Speed CHOP acts like friction, giving us natural, physics-based movement.</p>
            `
          }
        },
        background: {
          image: "assets/images/centering_and_scaling.png",
          aspectRatio: "1852:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 6: Rangeling CHOPs 3: Angular Velocity
      {
        id: 6,
        title: "Rangeling CHOPs 3: Angular Velocity",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rangeling CHOPs 3: Angular Velocity</h1>
              <p>Adding the velocity from mouse movement and position, we get the current total angular velocity which we give to the <span class="highlight">speed3</span> CHOP. This updates every frame to give us the current angular position for our rotation matrix.</p>

              <h3>Key CHOPs:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>math2:</strong> Combines velocity and position inputs</li>
                <li><strong>speed3:</strong> Integrates angular velocity to position</li>
              </ul>

              <p>This gives us smooth, continuous rotation that responds to both mouse movement and position.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Integration Process</h3>
              <p>The Speed CHOP acts as an integrator, converting our angular velocity into angular position over time. This creates the smooth, continuous rotation we see in the final result.</p>
              
              <p>The combination of velocity-based and position-based inputs gives us both immediate responsiveness and gentle, continuous movement when the mouse is stationary.</p>
            `
          }
        },
        background: {
          image: "assets/images/angular_velocity.png",
          aspectRatio: "1852:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 7: Rangeling CHOPs 4: Mouse Wheel
      {
        id: 7,
        title: "Rangeling CHOPs 4: Mouse Wheel",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rangeling CHOPs 4: Mouse Wheel</h1>
              <p>Selecting mouse wheel from the mousein CHOP, filtering it in a few different ways. No real rhyme or reason - I wanted it to feel like it had weight, so I used one long box filter, wanted it to take longer to stop so used a long left half box filter first, followed by a short Gaussian to smooth anything else, then one final box filter.</p>

              <div class="tip">
                <strong>Pro Tip:</strong> If you ever want to see how a filter is affecting your input, try using a <span class="highlight">trail</span> CHOP to compare the input and output of the filter CHOP.
              </div>

              <p>This creates a weighted, inertial feel for the mouse wheel input that feels natural and responsive.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <img src="assets/images/filter_trail_example.png" alt="Filter Trail Example" class="trail-image" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">
            `
          }
        },
        background: {
          image: "assets/images/mouse_wheel.png",
          aspectRatio: "1852:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 8: Rangeling CHOPs 5: Merging and Null
      {
        id: 8,
        title: "Rangeling CHOPs 5: Merging and Null",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rangeling CHOPs 5: Merging and Null</h1>
              <p>Merging everything together and ending it with a null.</p>

              <div class="tip">
                <strong>Golden Rule:</strong> Always end your CHOP network with a null and try to merge as much together as makes sense.
              </div>

              <p>This creates clean, organized networks that are easier to debug and maintain. The null acts as a clean output point and prevents unexpected behavior from downstream connections.</p>

              <h3>Final Output:</h3>
              <p>Our CHOP network now outputs clean rotation values ready for our GLSL shaders!</p>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Network Organization Benefits</h3>
              <p>Using nulls and proper merging provides several advantages:</p>
              <ul style="margin-left: 1rem; line-height: 1.8;">
                <li><strong>Clean Outputs:</strong> Single connection point for downstream operators</li>
                <li><strong>Easier Debugging:</strong> Clear signal flow and isolation points</li>
                <li><strong>Performance:</strong> Reduced connections and cleaner data flow</li>
                <li><strong>Maintainability:</strong> Easier to modify and expand the network</li>
              </ul>
            `
          }
        },
        background: {
          image: "assets/images/merging_and_null.png",
          aspectRatio: "1852:571",
          transition: { type: "slideRight", offset: { x: 0.1, y: 0 } }
        }
      },

      // Section 9: Input Data 2: Saved Data from TSV
      {
        id: 9,
        title: "Input Data 2: Saved Data from TSV",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Input Data 2: Saved Data from TSV</h1>
              <p>In TouchDesigner we can input saved data in loads of ways. Here I've used a TSV file saved from a previous project in 2021 and loaded with a <span class="highlight">table DAT</span>, but equally it could have been saved as a waveform and opened with the <span class="highlight">filein CHOP</span>, or as a texture where tx, ty, tz, tw are stored as RGBA.</p>

              <h3>Data Storage Options:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>TSV/CSV files:</strong> Table DAT for structured data</li>
                <li><strong>Waveforms:</strong> Filein CHOP for time-based data</li>
                <li><strong>Textures:</strong> RGBA channels for 4D coordinates</li>
                <li><strong>GLSL sampling:</strong> Direct access from shaders</li>
              </ul>

              <p>You can also sample data in a GLSL TOP from DATs, CHOPs or TOPs. Each row in the DAT, sample in the CHOP, and pixel in TOP all store the same 4 channels of data over 33 samples.</p>

              <div class="tip">
                <strong>Important:</strong> Save as TSV so it will open as a table in TouchDesigner!
              </div>
            `
          },
          right: {
            type: "widget",
            widget: {
              type: "tsv-table",
              source: "https://raw.githubusercontent.com/TrueFiasco/TouchDesigner-Tutorials/main/Tesseract/euler_cycle.tsv",
              title: "Euler Cycle TSV Data",
              controls: ["fullscreen", "copy", "download"],
              githubPath: "Tesseract/euler_cycle.tsv"
            }
          }
        },
        background: {
          image: "assets/images/euler_in.png",
          aspectRatio: "1456:478",
          transition: { type: "slideRight", offset: { x: 1.0, y: 0 } }
        }
      },

      // Section 10: Rotation Vertex GLSL
      {
        id: 10,
        title: "Rotation Vertex GLSL",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Rotation Vertex GLSL</h1>
              <p>We're using RWY, RY and RX from the null in our CHOP network. In our uniforms we need to assign them at the start of the shader and add them to our vector parameter.</p>

              <h3>GLSL Components:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li>3 rotation matrices as helper functions</li>
                <li>Individual rotations (order dependent)</li>
                <li>4D point multiplication</li>
                <li>Rotated point output</li>
              </ul>

              <p>We multiply the individual rotations (order dependent), then multiply our rotation matrix with our 4D points and output our rotated points.</p>
            `
          },
          right: {
            type: "widget",
            widget: {
              type: "code-viewer",
              source: "https://raw.githubusercontent.com/TrueFiasco/TouchDesigner-Tutorials/main/Tesseract/vert_rotation_pixel.frag",
              title: "Vertex Rotation GLSL",
              language: "glsl",
              controls: ["fullscreen", "copy", "download"],
              githubPath: "Tesseract/vert_rotation_pixel.frag"
            }
          }
        },
        background: {
          image: "assets/images/rotate_vertex_glsl.png",
          aspectRatio: "1920:571",
          transition: { type: "slideRight", offset: { x: 1.0, y: 0 } }
        }
      },

      // Section 11: Perspective GLSL
      {
        id: 11,
        title: "Perspective GLSL",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Perspective GLSL</h1>
              <p>We have a few float uniforms in the perspective GLSL to give control on the 4D perspective and 3D perspective, to flatten it to 2D.</p>

              <h3>Perspective Pipeline:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>4D to 3D:</strong> Project from 4D space to 3D</li>
                <li><strong>3D to 2D:</strong> Standard perspective projection</li>
                <li><strong>Camera controls:</strong> FOV, position, and depth</li>
              </ul>
            `
          },
          right: {
            type: "widget",
            widget: {
              type: "code-viewer",
              source: "https://raw.githubusercontent.com/TrueFiasco/TouchDesigner-Tutorials/main/Tesseract/vert_perspective_pixel.frag",
              title: "Vertex Perspective GLSL",
              language: "glsl",
              controls: ["fullscreen", "copy", "download"],
              githubPath: "Tesseract/vert_perspective_pixel.frag"
            }
          }
        },
        background: {
          image: "assets/images/prespective_glsl.png",
          aspectRatio: "1920:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 12: 2D Points to 2D Lines
      {
        id: 12,
        title: "2D Points to 2D Lines",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>2D Points to 2D Lines</h1>
              <p>Preparing my 2D points position into a lines points position utilizing the Euler cycle. Using RG for the lines first point XY position and GA. I'm sure this could have been done in the perspective shader but it was easier to do this.</p>

              <p>Being familiar with the <span class="highlight">transform TOP</span> and knowing to set it to <span class="highlight">repeat</span> so the first point connects to the last point.</p>

              <h3>Line Generation:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li>Convert point cloud to line segments</li>
                <li>Use Euler cycle for proper connectivity</li>
                <li>Transform TOP with repeat mode</li>
                <li>Closed loop formation</li>
              </ul>

              <h3>Blur Result</h3>
              <p>When we blur from one pixel to the next, we're interpolating linearly between the values using a box filter in the Blur TOP.</p>
              
              <p>This creates smooth transitions between line segments and helps with antialiasing in the final render. The blur operation essentially averages neighboring pixel values, creating smooth gradients that improve visual quality.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <img src="assets/images/blur.png" alt="Blur Result" class="blur-image" style="width: 100%; border-radius: 10px; margin-bottom: 1rem;">
            `
          }
        },
        background: {
          image: "assets/images/2d_points_to_2d_lines.png",
          aspectRatio: "1920:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 13: SDF Uneven Capsule
      {
        id: 13,
        title: "SDF Uneven Capsule",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>SDF Uneven Capsule</h1>
              <p>Again I was able to reuse a component I made in 2022 which would take in a texture where each pixel represents a capsule with two 2D points to be rendered in the SDF.</p>

              <p>This uses <a href="https://iquilezles.org/articles/distfunctions2d/" target="_blank" style="color: #00ffff;">Inigo Quilez's SDF functions</a> for uneven capsules. No uniforms needed!</p>

              <h3>SDF Rendering:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li>Distance field calculation</li>
                <li>Variable capsule radius</li>
                <li>Efficient GPU rendering</li>
                <li>Smooth antialiasing</li>
              </ul>

              <h3>Why Uneven Capsule vs Line SDF?</h3>
              <p>I could have used a standard line SDF instead, but I wanted to use the 4D value to help drive the width of the uneven capsule.</p>
              
              <p>This gives us variable line thickness that responds to the 4th dimension, creating a more dynamic visual representation of the 4D structure. The capsule approach allows for organic, flowing line weights that enhance the perception of depth and dimension.</p>
            `
          },
          right: {
            type: "widget",
            widget: {
              type: "code-viewer",
              source: "https://raw.githubusercontent.com/TrueFiasco/TouchDesigner-Tutorials/main/Tesseract/line_mindist_pixel.frag",
              title: "SDF Line Min Distance GLSL",
              language: "glsl",
              controls: ["fullscreen", "copy", "download"],
              githubPath: "Tesseract/line_mindist_pixel.frag"
            }
          }
        },
        background: {
          image: "assets/images/sdf_uneven_capsule.png",
          aspectRatio: "1920:571",
          transition: { type: "slideLeft", offset: { x: 0, y: 0 } }
        }
      },

      // Section 14: Post Processing
      {
        id: 14,
        title: "Post Processing",
        layout: "split",
        content: {
          left: {
            type: "html",
            content: `
              <h1>Post Processing</h1>
              <p>Using limits, ramps, threshold and lookups to create an interesting result.</p>

              <h3>Post Effects Chain:</h3>
              <ul style="margin-left: 2rem; line-height: 1.8;">
                <li><strong>Limits:</strong> Clamp value ranges</li>
                <li><strong>Ramps:</strong> Smooth gradients</li>
                <li><strong>Threshold:</strong> Binary decisions</li>
                <li><strong>Lookups:</strong> Color mapping</li>
              </ul>

              <p>These effects transform the raw SDF output into a visually appealing final result with proper contrast and color.</p>
            `
          },
          right: {
            type: "html",
            content: `
              <h3>Effect Purpose</h3>
              <p>Each post-processing step serves a specific purpose in creating the final visual:</p>
              <ul style="margin-left: 1rem; line-height: 1.8;">
                <li><strong>Limits:</strong> Prevent over-bright or under-dark values</li>
                <li><strong>Ramps:</strong> Create smooth color transitions</li>
                <li><strong>Threshold:</strong> Create sharp cutoffs for specific effects</li>
                <li><strong>Lookups:</strong> Apply color palettes and artistic looks</li>
              </ul>
              
              <p>The combination of these effects allows for fine-tuned control over the final appearance of our 4D hypercube visualization.</p>
            `
          }
        },
        background: {
          image: "assets/images/post_processing.png",
          aspectRatio: "1920:571",
          transition: { type: "slideRight", offset: { x: 1.0, y: 0 } }
        }
      }
    ]
  }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TesseractContent;
} else if (typeof window !== 'undefined') {
  window.TesseractContent = TesseractContent;
}

/**
 * Validate content structure for debugging
 */
function validateContentStructure() {
  console.log('🔍 Validating TesseractContent structure...');
  
  if (!window.TesseractContent) {
    console.error('❌ TesseractContent not loaded');
    return false;
  }
  
  const content = window.TesseractContent;
  
  if (!content.tutorial) {
    console.error('❌ Missing tutorial object');
    return false;
  }
  
  if (!content.tutorial.sections || !Array.isArray(content.tutorial.sections)) {
    console.error('❌ Missing or invalid sections array');
    return false;
  }
  
  const sections = content.tutorial.sections;
  console.log(`✅ Found ${sections.length} sections`);
  
  // Validate each section
  sections.forEach((section, index) => {
    if (!section.id || !section.title || !section.layout || !section.content) {
      console.warn(`⚠️ Section ${index + 1} missing required properties:`, section);
    } else {
      console.log(`✅ Section ${section.id}: ${section.title}`);
    }
  });
  
  console.log('✅ Content structure validation complete');
  console.log('📍 Using GitHub repository URLs for widgets');
  return true;
}

// Make validation function globally available
if (typeof window !== 'undefined') {
  window.validateContentStructure = validateContentStructure;
}
