Subacz Project 1 Read Me

These folder contain:
    - subacz_pjt_2.html
    - subacz_pjt_2.js
    - SubaczPeter_Pjt2_readme.txt (this file)
    - cs4731_pjt2_ply_files (directory)
    - lib (directory)


This program creates a hierachy model of cubes and spheres that hang on wire lines. The model
    rotates around the y axis and sub tier models rotate counter clockwise. The cubes and spheres 
    are generated and randomly assigned material diffuse, ambient, and specular coefficients.

Back face culling is enabled.

Interactive features:
    Press ' p ' - Increase spotlight cut off angle (increase cone angle).
    Press ' P ' - Decrease spotlight cut off angle (decrease cone angle).
    Press ' m ' - The scene is shaded using Gouraud lighting (smooth shading). 
    Press ' M ' - The scene is shaded using flat shading.
    Press ' n ' - Swap between present colors and randomly generated colors. 
    Press ' w ' to reset spotlight angle.

At runtime, the program:
0.  setup variable
1.  Initalized model and create materials 
1.1 Enable culling of backfacing triangles
1.2 Enable depth testing
1.3 Set projection matrix
1.4 Build sphere and cubes 
2.  Render the model
2.1 Increment the rotation angle
2.2 Recurviely compute hierarchy model and attach subtrees
