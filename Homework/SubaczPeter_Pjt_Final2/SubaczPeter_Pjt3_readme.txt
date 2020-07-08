Subacz Project 4 Read Me

These folder contain:
    - subacz_pjt_4.html
    - subacz_pjt_4.js
    - SubaczPeter_Pjt4_readme.txt (this file)
    - cs4731_pjt2_ply_files (directory)
    - lib (directory)

Interactive features:
  Press ' A ' - To toggle shadows.
  Press ' B ' - To toggle textures.
  Press ' C ' - To toggle refections.
  Press ' D ' - To toggle refractions.
  Press ' m ' - The scene is shaded using Gouraud lighting
  Press ' M ' - The scene is shaded using flat shading.
  Press ' n ' - Change the color properties.
	Press ' p ' - Increase spotlight cut off angle (increase cone angle).
  Press ' P ' - Decrease spotlight cut off angle (decrease cone angle).
	Press ' z ' - To toggle animation.
	Press ' W ' or ' w ' to reset spotlight angle.

Hierachy model 
- This program creates a hierachy model of cubes and spheres that hang on wire 
    lines. The model rotates around the y axis and sub tier models rotate counter 
    clockwise. The cubes and spheres are generated and randomly assigned material 
    diffuse, ambient, and specular coefficients. 

Textures:
- Upon initialization, textures are pulled from WPI. The program will render the 
    mobile with color backgrounds until the textures load. Once all textures are 
    loaded they are configured and passed fragment shader to be used downstream. 
    When textures are being rendered, they are tiled to a walls and floor using 
    texture coordinates that repeat the texture. This results in a tiling effect 
    that reduces the stretching of each texture. Textures can be toggled on/off 
    with the B key.

  *Textures are downloaded from the WPI server before beng rendered. This may 
    take a minute depending on internet connection.  

Shadows:
- Shadows are drawn using the shadow projection methodology. The shadows are 
    projected to the light source and scaled based on the z distance from the
    light source. Shadows can be toggled on/off with the A key.

Reflections and Refractions:
- A cube map has been implemented to show reflections based on the surface normals
  and position vectors. Refractions are similiarly calcalated with the added 
  component of eta (ratio of indices of refraction) set to 0.3. Press C to toggle 
  refections and press D to toggle refractions.

Lighting:
- Two types of lighting are present in this program: Flat shading and Gouraud lighting.
    In Flat shading, positions vectors are being in the lighting calculation.
    In Gouraud lighting, normal vectors because the normal are being in the lighting 
    calculation.Press M to switch to flat shading and press m to switch to Gouraud
    lighting

Spotlight
- A spotlight is present within the program used to calculate the lighting present on 
    rendered objects. If the object surface falls outside the spotlight angle, the model
    is only lit with ambient lighting. If the object is within the spotlight, the model is 
    lit with ambient, diffuse, and specular lighting. Press p to increase the spotlight angle
    and press P to decrease the spotlight angle. 

Utility functions:
The following utility functions are present:
- Object property randomizer
    Randomizes the material Ambient, Diffuse, Specular, and Shininess properties of each
    object. Press n to randomize!
- Animation toggle
    Toggles the animation incrementation of the model. Press z to pause animation.
- Model reset
    Resets the model and control booleans to known values. Press w to reset. 