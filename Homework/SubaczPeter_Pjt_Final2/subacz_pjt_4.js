/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Peter Subacz
 * 
 * 
 * This program creates a hierachy model of cubes and spheres that hang on wire lines. The model
 *   rotates around the y axis and sub tier models rotate counter clockwise. The cubes and spheres 
 * 	 are generated and randomly assigned material diffuse, ambient, and specular coefficients.
 * 
 * 	Back face culling is enabled as well as depth testing.
 * 
 * 	A cube map has been implemented to show reflections and refractions effects on drawn objects
 * 	 within the model.
 * 
 * 	Planes representing the floor and wall have been implemented and draw with flat colors or 
 * 	 textures depending on the toggle of textures. The walls can be rendered in blue or the 
 * 	 a brick texture. The floor is rendered in gray or a grass texture. 
 * 
 * Interactive features:
 *		Press ' A ' - To toggle shadows.
 *		Press ' B ' - To toggle textures.
 * 		Press ' C ' - To toggle refections.
 * 		Press ' D ' - To toggle refractions.
 * 		Press ' m ' - The scene is shaded using Gouraud lighting
 * 		Press ' M ' - The scene is shaded using flat shading.
 * 		Press ' n ' - Change the color properties.
 * 		Press ' p ' - Increase spotlight cut off angle (increase cone angle).
 *		Press ' P ' - Decrease spotlight cut off angle (decrease cone angle).
 * 		Press ' z ' - To toggle animation.
 * 		Press ' W ' or ' w ' to reset spotlight angle.
 * 
 */

var gl;						// webgl
var id; 					// animation id
var fovy = 60.0; 			// Field-of-view in Y direction angle (in degrees)
var aspect;       			// Viewport aspect ratio
var program;				// webgl program
var mvMatrix, projectionMatrix;
var modelViewMatrixLoc;
var diffuseProduct;
var specularProduct;
var diffuseProduct;
var eye;

//Hierarchy model stack
var stack = []; 

//cubes 
var gouraudLightingNormalsArrayCube = [];
var flatShadingNormalsArrayCube = [];
var theCube = cube();

//spheres
var numTimesToSubdivide = 5;
var gouraudLightingnormalsArraySphere = [];
var flatShadingNormalsArraySphere = [];
var theSphere = [];
var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

//tree size
var numberOfBranches = 2;		//number of subtrees within 
var treeDisplacementX = 2.5;	//tree x displacement
var treeDisplacementY = 3;		//tree y displacement
var treeDisplacementZ = 0;		//tree z displacement
var treeLineDecay = 1.5;		//line decay per recusive tree
var numberOfObjects = 0;		//number of objects on the tree

//lines
var connectionLinesColorsArray = [vec4( 1, 1, 1, 1),vec4( 1, 1, 1, 1),		//verticle line
	vec4(  1, 1, 1, 1),vec4( 1, 1, 1, 1),				//horzontal line
	vec4(  1, 1, 1, 1),vec4( 1, 1, 1, 1),				//right verticle line
	vec4(  1, 1, 1, 1),vec4( 1, 1, 1, 1)];				//left verticle line

//point lighting location
var pointLightPosition = vec4(0.0, 0.0, 5.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

// spot light angle
var phi = 0.97;

//yaw rotation variables
var beta = 0;

//control booleans
var animation = true;
var gouraudLighting = false;
var flatShading = false;
var viewTextures = false;
var useShadows = true;
var useReflection = false;
var useRefraction = false;
var texturesLoaded = false;

// materials list and index
var index = 0;
var materialAmbientList = [];
var materialDiffuseList = [];
var materialSpecularList = [];
var materialShininessList = [];

//walls and floor
var thePlane;
var planeScale = 50;
var imagesToLoad;
var imageURLs = ['http://web.cs.wpi.edu/~jmcuneo/grass.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/stones.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegx.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegy.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegz.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposx.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposy.bmp',
				'http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposz.bmp'];

var textures = [];
var textureLoc0;
var textureLoc1;
var texCoordsArray = [];
var images;
var numberOfTextures = 0;
var wallDisplacementZ = 50

//Shadows
var light = vec3(0.0, 0.0, 2.0);
var m = mat4();
var shadowColor = vec4(0.1,0.1,0.1,0.95)
var shadowSphereColorArray =[];
var shadowCubeColorArray =[];
var shadowLinesColorArray = []
var shadowScale = 1.5

//Enviromental map Reflection/refraction
var cubeMap;

function main(){
	window.onkeypress = function (event) {		 	//when a key is pressed, process the input
		process_keypress(event.key);
	}
	generateMaterialLighting();						//randomly generate lighting coefficients
	var canvas = document.getElementById('webgl');	// Retrieve <canvas> element
	gl = WebGLUtils.setupWebGL(canvas);				// Get the rendering context for WebGL
	
	if (!gl){										//Check that the return value is not null.
		console.log('Failed to get the rendering context for WebGL');
		return;
	}
	program = initShaders(gl, "vshader", "fshader");// Initialize shaders
	gl.useProgram(program);							// Tell welgl which program to use
	gl.viewport( 0, 0, canvas.width, canvas.height);//Set up the viewport
	aspect =  canvas.width/canvas.height;			//calculate the apsect ratio
	gl.clearColor(1.0, 1.0, 1.0, 1.0);				// Set clear color
	gl.enable(gl.DEPTH_TEST);						//enable depth testing
	gl.enable(gl.CULL_FACE);						//enable culling - default backfacing triangles
	gl.cullFace(gl.BACK);							//make sure we are backculling

	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);//create a sphere

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix");

	projectionMatrix = perspective(fovy, aspect, 0.001, 60);
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix));

	eye = vec3(0, 10, 20);
	at = vec3(0.0, 6.0, 0.0);
	up = vec3(0.0, 1.0, 0.0);
	mvMatrix = lookAt(eye, at , up);
	modelViewMatrix = mvMatrix;

	//load the images
	loadImages()
	thePlane = plane();

	//set shadows
	light = eye;
	m[3][3] = 0;
	m[3][2] = -1/light[2];
	
	for(var i =0;i<theCube.length;i++){
		shadowCubeColorArray.push(shadowColor);
	}
	for(var i =0;i<theSphere.length;i++){
		shadowSphereColorArray.push(shadowColor);
	}
	for(var i = 0; i<8;i++){
		shadowLinesColorArray.push(shadowColor);
	}

	process_keypress('m');
	render();
}

function render(){
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 		//clear screen
	gl.uniform1f(gl.getUniformLocation(program, "phi"), phi);	//set spotlight angle
	update_state_output()
	stack.push(mvMatrix);
		if(imagesToLoad == 0 && texturesLoaded == false){	// if all the files are downloaded,
			configureTexture(images)						// configure the images
			texturesLoaded = true;
			// viewTextures = true;
		}
		draw_background(); 			//draw floor and wall planes
		index = 0;
		computeHierarchyModel();	//compute hierachy model
		// draw_background(); 			//draw floor and wall planes
	mvMatrix = stack.pop();
	if (animation){
		id = requestAnimationFrame(render);
	}
}

function draw_shadows(type){
	//shadows projections
	gl.uniform1i(gl.getUniformLocation(program, "useLighting"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useReflection"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useRefraction"), false);

	stack.push(mvMatrix);
		var shadowMatrix = mat4();
		shadowMatrix = mult(translate(light[0], light[1], light[2]),shadowMatrix);
		shadowMatrix = mult(m,shadowMatrix);
		shadowMatrix = mult(shadowMatrix,translate(-light[0], -light[1], -light[2]));
		mvMatrix = mult(shadowMatrix,mvMatrix);
		//translate to the wall and adjusted for z displacement
		mvMatrix[2][3] -=mvMatrix[2][3]
		if (stack.length<3){
			mvMatrix = mult(translate(Math.sin(deg2rad(beta)), 0, -37),mvMatrix)
		}else{
			mvMatrix = mult(translate(0, 0, -37),mvMatrix)
		}
		
		if(type == "sphere"){
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));

			var pBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(theSphere), gl.STATIC_DRAW);
		
			var vPosition = gl.getAttribLocation(program,  "vPosition");
			gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
			
			var nBuffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
			gl.bufferData( gl.ARRAY_BUFFER, flatten(shadowSphereColorArray), gl.STATIC_DRAW );
		
			var vNormal = gl.getAttribLocation( program, "vNormal" );
			gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
			gl.enableVertexAttribArray( vNormal)
		
			gl.drawArrays(gl.TRIANGLES, 0,theSphere.length);
			gl.deleteBuffer(pBuffer);
			gl.deleteBuffer(nBuffer);
		}else if (type == "cube"){
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));

			var pBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(theCube), gl.STATIC_DRAW);
		
			var vPosition = gl.getAttribLocation(program,  "vPosition");
			gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
			
			var nBuffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
			gl.bufferData( gl.ARRAY_BUFFER, flatten(shadowCubeColorArray), gl.STATIC_DRAW );
		
			var vNormal = gl.getAttribLocation( program, "vNormal" );
			gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
			gl.enableVertexAttribArray( vNormal)
		
			gl.drawArrays(gl.TRIANGLES, 0,theCube.length);
			gl.deleteBuffer(pBuffer);
			gl.deleteBuffer(nBuffer);
		}
	mvMatrix = stack.pop();
}

function deg2rad(deg){
	return deg*(Math.PI/180);
}

function configureTexture(images) {
	//Initialize
	for (var ii = 0; ii < 2; ii++) {
		var texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);
		// add the texture to the array of textures.
		textures.push(texture); 
	}

	//Initialize
	cubeMap = gl.createTexture();
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	//Create a 2x2 texture
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA,
		gl.RGBA, gl.UNSIGNED_BYTE, images[2]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 
		gl.RGBA, gl.UNSIGNED_BYTE, images[3]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 
		gl.RGBA, gl.UNSIGNED_BYTE, images[4]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 
		gl.RGBA, gl.UNSIGNED_BYTE, images[5]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 
		gl.RGBA, gl.UNSIGNED_BYTE, images[6]);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 
		gl.RGBA, gl.UNSIGNED_BYTE, images[7]);

	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.uniform1i(gl.getUniformLocation(program, "textureMap"), 1);
}

function loadImage(url,callback){
	var image = new Image();
	image.crossOrigin = "";
	image.src = url;
	image.onload = callback
	return image;
}

function loadImages(){
	images = [];
	imagesToLoad =imageURLs.length;
	var onImageLoad0 = function() {
		imagesToLoad-=1;
		images[0]=image0;
	  };
	var onImageLoad1 = function() {
		imagesToLoad-=1;
		images[1]=image1;
	};
	var onImageLoad2 = function() {
		imagesToLoad-=1;
		images[2]=image2;
	};
	var onImageLoad3 = function() {
		imagesToLoad-=1;
		images[3]=image3;
	};
	var onImageLoad4 = function() {
		imagesToLoad-=1;
		images[4]=image4;
	};
	var onImageLoad5 = function() {
		imagesToLoad-=1;
		images[5]=image5;
	};
	var onImageLoad6 = function() {
		imagesToLoad-=1;
		images[6]=image6;
	};
	var onImageLoad7 = function() {
		imagesToLoad-=1;
		images[7]=image7;
	};

	var image0 = loadImage(imageURLs[0], onImageLoad0);
	var image1 = loadImage(imageURLs[1], onImageLoad1);
	var image2 = loadImage(imageURLs[2], onImageLoad2);
	var image3 = loadImage(imageURLs[3], onImageLoad3);
	var image4 = loadImage(imageURLs[4], onImageLoad4);
	var image5 = loadImage(imageURLs[5], onImageLoad5);
	var image6 = loadImage(imageURLs[6], onImageLoad6);
	var image7 = loadImage(imageURLs[7], onImageLoad7);
  }

function process_keypress(theKey){
	// function to toggle modes,
	var outputMessage = '';
	//on key presses, do change the colors or modes
	switch (theKey) {
		case 'A':// toggle shadows on and off
			if (useShadows == false){
				useShadows = true;
			}else{
				useShadows = false;
			}
			break;	

		case 'B':// toggle textures on and off 		
			if (viewTextures == false){
				viewTextures = true;
			}else{
				viewTextures = false;
			}
			break;

		case 'C':// toggle reflections on and off 
			if (useReflection == false){
				useReflection = true;
			}else{
				useReflection = false;
			}
			break;
		
		case 'D':// toggle refractions on and off 
			if (useRefraction == false){
				useRefraction = true;
			}else{
				useRefraction = false;
			}
			break;

		case 'm':
			//Gouraud lighting 
			if (gouraudLighting == false){
				gouraudLighting = true;
				flatShading = false;
			}else{
				gouraudLighting = false;
				flatShading = true;
			}
			break;
		case 'M':
			// flat shading 
			if (flatShading == false){
				flatShading = true;
				gouraudLighting = false;
			}else{
				flatShading = false;
				gouraudLighting = true;
			}
			break;
		case 'n':
			generateMaterialLighting();
			break;

		

		case 'w':
			animation = true;
			gouraudLighting = true;
			flatShading = false;
			viewTextures = true;
			useShadows = true;
			useReflection = false;
			useRefraction = false;
			beta =0;
			break;


		case 'z':
			if (animation == false){
				animation = true;
				
			}else{
				animation = false;
			}
			render();
			break;		
		case 'p':
			setSpotlightAngle(0.001);	//increasing angle by +0.01
			break;
		case 'P':
			setSpotlightAngle(-0.001);	//decreasing angle by -0.01
			break;
		default:
		//do nothing		
	}

	outputMessage = 'Current keypress actions are: <br>';
	outputMessage += '- Interaction: <br>';
	outputMessage += "-- Press ' A ' - To toggle shadows. <br>";
	outputMessage += "-- Press ' B ' - To toggle textures. <br>";
	outputMessage += "-- Press ' C ' - To toggle refections. <br>";
	outputMessage += "-- Press ' D ' - To toggle refractions. <br>";
	outputMessage += "-- Press ' m ' - The scene is shaded using Gouraud lighting (smooth shading).<br>";
	outputMessage += "-- Press ' M ' - The scene is shaded using flat shading. <br>";
	outputMessage += "-- Press ' n ' - Change the color properties. <br>";
	outputMessage += "-- Press ' p ' - Increase spotlight cut off angle (increase cone angle).<br>";
	outputMessage += "-- Press ' P ' - Decrease spotlight cut off angle (decrease cone angle) .<br>";
	outputMessage += '- Pause <br>';
	outputMessage += "-- Press ' z ' - To toggle animation. <br>";
	outputMessage += '- Reset <br>';
	outputMessage += "-- Press ' W ' or ' w ' to reset spotlight angle. <br>";
	document.getElementById('pageContent').innerHTML = outputMessage;
	update_state_output();
}

function update_state_output(){
	// update the output box with relevent information
	msg = "";
	if (animation == true){
		msg += " Animation: On<br>";
	}else{
		msg += " Animation: Off<br>";
	}

	if (gouraudLighting == true){
		msg += " Gouraud Lighting: On<br>";
	}else{
		msg += " Gouraud Lighting: Off<br>";
	}

	if (flatShading == true){
		msg += " Flat Shading: On<br>";
	}else{
		msg += " Flat Shading: Off<br>";
	}

	if(imagesToLoad>0){
		msg += " Textures: Not Ready, waiting on "+numberOfTextures+" <br>";
	}else if (imagesToLoad = 0){
		msg += " Textures: Please wait, configuring textures...<br>";
	}else{
		if (viewTextures == true){
			msg += " Textures: On<br>";
		}else{
			msg += " Textures: Off<br>";
		}
	}

	if (useShadows == true){
		msg += " Shadows: On<br>";
	}else{
		msg += " Shadows: Off<br>";
	}

	if (useReflection == true){
		msg += " Reflection: On<br>";
	}else{
		msg += " Reflection: Off<br>";
	}

	if (useRefraction == true){
		msg += " Refraction: On<br>";
	}else{
		msg += " Refraction: Off<br>";
	}
	msg += " Spotlight Angle:"+phi+"<br>";
	msg += " Model Angle:"+beta+"<br>";
	document.getElementById("pageMode").innerHTML = msg;
}

function draw_cube(){
	gl.uniform1i(gl.getUniformLocation(program, "useLighting"), true);
	gl.uniform1f(gl.getUniformLocation(program, "useTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useVertexTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useReflection"), useReflection);
	gl.uniform1f(gl.getUniformLocation(program, "useRefraction"), useRefraction);
	if (useReflection || useRefraction){
		gl.activeTexture(gl.TEXTURE1);
		gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
	}

	//set materials for each draw call
	materialAmbient = materialAmbientList[index];
	materialDiffuse = materialDiffuseList[index];
	materialSpecular = materialSpecularList[index];
	materialShininess = materialShininessList[index];
	index+=1;
	//compute matrix multication
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);
	// pass to vertex shader
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "pointLightPosition"), flatten(pointLightPosition));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(theCube), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	if(gouraudLighting == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingNormalsArrayCube), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), false);
	}else if(flatShading == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(flatShadingNormalsArrayCube), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), true);
	}else{
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingNormalsArrayCube), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), false);
	}

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal);

	gl.drawArrays( gl.TRIANGLES, 0, theCube.length);

	//delete the buffer for memory management
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);

	if(useShadows==true){
		draw_shadows('cube');
	}
}

function draw_sphere(){
	gl.uniform1i(gl.getUniformLocation(program, "useLighting"), true);
	gl.uniform1f(gl.getUniformLocation(program, "useTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useVertexTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useReflection"), useReflection);
	gl.uniform1f(gl.getUniformLocation(program, "useRefraction"), useRefraction);

	//set materials for each draw call
	materialAmbient = materialAmbientList[index];
	materialDiffuse = materialDiffuseList[index];
	materialSpecular = materialSpecularList[index];
	materialShininess = materialShininessList[index];
	index+=1;

	//compute matrix multication
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

	// pass to vertex shader
	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "pointLightPosition"), flatten(pointLightPosition));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	if(gouraudLighting == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingnormalsArraySphere), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), false);
	}else if(flatShading == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(flatShadingNormalsArraySphere), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), true);
	}else{
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingnormalsArraySphere), gl.STATIC_DRAW );
		gl.uniform1i(gl.getUniformLocation(program, "useNormals"), false);
	}

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(theSphere), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation( program, "vPosition");
 	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawArrays(gl.TRIANGLES, 0, theSphere.length);
	gl.deleteBuffer(vBuffer);
	gl.deleteBuffer(nBuffer);
	
	if(useShadows==true){
		draw_shadows('sphere');
	}
}

function draw_lines(){
	gl.uniform1i(gl.getUniformLocation(program, "useLighting"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useVertexTexture"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useReflection"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useRefraction"), false);

	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));
	var connectionLinesPointsArray = [vec4( 0, -0.6, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
					vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
					vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2.5, 0, 1),	//right verticle line
					vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2.5, 0, 1)];	//left verticle line
	
	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(connectionLinesPointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
	
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(connectionLinesColorsArray), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal)

	gl.drawArrays(gl.LINES, 0,8);
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
}

function cube(){
	// Create a cube and pushes vertices to the lighting array.
	var verts = [];
	verts = verts.concat(quad( 1, 0, 3, 2 ));
	verts = verts.concat(quad( 2, 3, 7, 6 ));
	verts = verts.concat(quad( 3, 0, 4, 7 ));
	verts = verts.concat(quad( 6, 5, 1, 2 ));
	verts = verts.concat(quad( 4, 5, 6, 7 ));
	verts = verts.concat(quad( 5, 4, 0, 1 ));

	//compute normals
	var i = 0;
	while(i<verts.length){
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		i+=3;
	}
	var i = 0;
	while(i<verts.length){
		var vc  = normal_newell_method([verts[i],verts[i+1],verts[i+2],verts[i]]);
		gouraudLightingNormalsArrayCube.push(vec4( vc[0], vc[1], vc[2], 0));
		gouraudLightingNormalsArrayCube.push(vec4( vc[0], vc[1], vc[2], 0));
		gouraudLightingNormalsArrayCube.push(vec4( vc[0], vc[1], vc[2], 0));
		i+=3;
	}
	return verts;
}

function quad(a, b, c, d)
{
	var verts = [];

	var vertices = [
		vec4( -0.5, -0.5,  0.5, 1.0 ),
		vec4( -0.5,  0.5,  0.5, 1.0 ),
		vec4(  0.5,  0.5,  0.5, 1.0 ),
		vec4(  0.5, -0.5,  0.5, 1.0 ),
		vec4( -0.5, -0.5, -0.5, 1.0 ),
		vec4( -0.5,  0.5, -0.5, 1.0 ),
		vec4(  0.5,  0.5, -0.5, 1.0 ),
		vec4(  0.5, -0.5, -0.5, 1.0 )
	];

	var indices = [ a, b, c, a, c, d ];

	for ( var i = 0; i < indices.length; ++i ){
		verts.push( vertices[indices[i]] );
	}
	return verts;
}

function triangle(a, b, c){
	theSphere.push(a);
	theSphere.push(b);
	theSphere.push(c);

	// normals are vectors
	flatShadingNormalsArraySphere.push(vec4(-a[0],-b[1], -c[2], 0.0));
	flatShadingNormalsArraySphere.push(vec4(-a[0],-b[1], -c[2], 0.0));
	flatShadingNormalsArraySphere.push(vec4(-a[0],-b[1], -c[2], 0.0));

	//calculate normals and use as points on the sphere
	var vc  = normal_newell_method([a,b,c,a]);
	gouraudLightingnormalsArraySphere.push(vc[0],vc[1], vc[2], 0.0);
	gouraudLightingnormalsArraySphere.push(vc[0],vc[1], vc[2], 0.0);
	gouraudLightingnormalsArraySphere.push(vc[0],vc[1], vc[2], 0.0);
}

function divideTriangle(a, b, c, count) {
	if ( count > 0 ) {
		var ab = mix( a, b, 0.5);
		var ac = mix( a, c, 0.5);
		var bc = mix( b, c, 0.5);

		ab = normalize(ab, true);
		ac = normalize(ac, true);
		bc = normalize(bc, true);

		divideTriangle( a, ab, ac, count - 1 );
		divideTriangle( ab, b, bc, count - 1 );
		divideTriangle( bc, c, ac, count - 1 );
		divideTriangle( ab, bc, ac, count - 1 );
	}
	else{
		triangle( a, b, c );
	}
}

function tetrahedron(a, b, c, d, n) {
	divideTriangle(a, b, c, n);
	divideTriangle(d, c, b, n);
	divideTriangle(a, d, b, n);
	divideTriangle(a, c, d, n);
}

function normal_newell_method(vectors){
	/*
		Computes the normal via the newwell method for the m_x, m_y, and m_z

		returns [m_x,m_y,m_z]
	*/

	var normal = vec3(0.0,0.0,0.0); // [m_x,m_y,m_z]

	//mx - sum(y-y_1)*(z+z_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][1]-vectors[ii+1][1])*
				(vectors[ii][2]+vectors[ii+1][2]);	
		}
	normal[0] = sum;
	//my - sum(z-z_1)*(x+x_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][2]-vectors[ii+1][2])*
				(vectors[ii][0]+vectors[ii+1][0]);		
		}
	normal[1] = sum
	
	//mz - sum(x-x_1)*(y+y_1)
	var sum = 0;
		for(ii=0;ii<vectors.length-1;ii++){	
			sum += (vectors[ii][0]-vectors[ii+1][0])*
				(vectors[ii][1]+vectors[ii+1][1]);	
		}
	normal[2] = sum;	
	return normal;
}

function computeHierarchyModel(){
	/*
		Computes a model hierarchy for 3 distinct levels 
					o					level 0 obects	
					|				
			o---------------o			level 1 objects
			|				|
		o-------o		o-------o		level 2 objects

		0. Reset: All objects start out as centered, the 0th object is translated 
			to the top 
		1. Draw lines: Vertical and horzontal lines are drawn from the parent level 
			to the child level.
		2. Child objects are then translated to the ends of the horzontal lines in
			step 1
		3. Repeat steps 1 & 2 for each level.
	*/
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, translate(0, 12, -5));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));	// 
		draw_sphere();	// draw the root sphere

		modelRotations(1); // Increment rotation angle
		mvMatrix = mult(mvMatrix,rotateY(-beta));					// Rotations 
		treeDisplacementX = 10;										// reset tree displacement
		attach_subtrees(numberOfBranches);	
	mvMatrix = stack.pop();	
}

function attach_subtrees(numberOfBranches){
	/* 
		Recusively attach lower leveled objects in the hierarachy model
	*/
	stack.push(mvMatrix);
	treeDisplacementX /=2;
	if(numberOfBranches>0){
		draw_lines();
		if (stack.length%2>0){
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));
			draw_cube();
			attach_subtrees(numberOfBranches-1);
			//draw the left object
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix) );
			draw_cube();
			attach_subtrees(numberOfBranches-1);
		}else{
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));
			draw_sphere();
			attach_subtrees(numberOfBranches-1);
			// draw the left object
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(mvMatrix));
			draw_sphere();
			attach_subtrees(numberOfBranches-1);
		}
	}
	treeDisplacementX*=2;
	mvMatrix = stack.pop();
}

function calculateNumberObjects(numObjects){
	//recusively calculate the number of objects on the screen.
	if (numObjects>0){
		calculateNumberObjects(numObjects-1);
	}
	numberOfObjects += Math.pow(2,numObjects);
}

function generateMaterialLighting(){

	materialAmbientList = [];
	materialDiffuseList = [];
	materialSpecularList = [];
	materialShininessList = [];

	//randomly generate colors of each object
	calculateNumberObjects(numberOfBranches);
	for (var i = 0;i<numberOfObjects;i++){
		randomVec = vec4(Math.random(),Math.random(),Math.random(),1)
		materialAmbientList.push(randomVec);
		materialDiffuseList.push(randomVec);
		materialSpecularList.push(randomVec);
		materialShininessList.push(Math.random()*100);
	}
}

function modelRotations(direction){
	// incrementes beta by 0.5 degrees. If beta reaches 360 degree, reset to 0
	beta +=1*direction;
	if (beta%360==0){
		beta = 0;
	}
}

function drawPlane(color,type){

	gl.uniform1i(gl.getUniformLocation(program, "useLighting"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useTexture"), viewTextures);
	gl.uniform1f(gl.getUniformLocation(program, "useVertexTexture"), true);
	gl.uniform1f(gl.getUniformLocation(program, "useReflection"), false);
	gl.uniform1f(gl.getUniformLocation(program, "useRefraction"), false);
	
	var cColor = [];
	for(i = 0; i<thePlane.length;i++){
		cColor.push(color);
	};
	
	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(thePlane), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
	
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cColor), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal)

	gl.activeTexture(gl.TEXTURE0);

	if(type == 'floor'){	
		gl.bindTexture(gl.TEXTURE_2D, textures[0]);
	}else if (type == 'wall'){
		gl.bindTexture(gl.TEXTURE_2D, textures[1]);
	}
	
	var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord );

	gl.drawArrays(gl.TRIANGLES, 0, thePlane.length);
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
	gl.disableVertexAttribArray( vTexCoord );
	gl.deleteBuffer(tBuffer);
}

function plane(){
	// Create the plane using 4 points. Push the texture coordinates to the texCoordsArray
	//	and oversample the texture to create a tiling effect. 
	var verts = [];
	verts = verts.concat(quad(  4, 5, 6, 7 ));
	i = 0;

	while(i<6){
		texCoordsArray.push(-3,  4,);
		texCoordsArray.push(-3, -1);
		texCoordsArray.push( 2, -1);
		texCoordsArray.push(-3,  4);
		texCoordsArray.push( 2, -1,);
		texCoordsArray.push( 2,  4,);
		i+=6;
	}

	return verts;
}

function draw_background(){
	// Draws the background using the plane and hierachy model. 

	//draw the floor
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, rotateX(90));
		mvMatrix = mult(mvMatrix, translate(0, 0, 30));
		mvMatrix = mult(mult(mvMatrix,translate(0, 0, 0)), scalem(planeScale,planeScale,planeScale));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
		drawPlane(vec4(0.5,0.5,0.5,1),'floor');
	mvMatrix = stack.pop();

	// draw the wall on the left
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, rotateY(90));
		mvMatrix = mult(mvMatrix, translate(0, 0, wallDisplacementZ));
		mvMatrix = mult(mult(mvMatrix,translate(0, 0, 0)), scalem(planeScale,planeScale,planeScale));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
		drawPlane(vec4(0,0,0.75,1),'wall');
	mvMatrix = stack.pop();

	//draw the wall in the back
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, translate(0, 0, wallDisplacementZ));
		mvMatrix = mult(mult(mvMatrix,translate(0, 0, 0)), scalem(planeScale,planeScale,planeScale));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
		drawPlane(vec4(0,0,0.75,1),'wall');
	mvMatrix = stack.pop();

	//draw the wall in the front front
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, rotateX(180));
		mvMatrix = mult(mvMatrix, translate(0, 0, wallDisplacementZ));
		mvMatrix = mult(mult(mvMatrix,translate(0, 0, 0)), scalem(planeScale,planeScale,planeScale+2));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
		drawPlane(vec4(0,0,0.75,1),'wall');
	mvMatrix = stack.pop();

	//draw the wall on the left
	stack.push(mvMatrix);
		mvMatrix = mult(mvMatrix, rotateY(-90));
		mvMatrix = mult(mvMatrix, translate(0, 0, wallDisplacementZ));
		mvMatrix = mult(mult(mvMatrix,translate(0, 0, 0)), 
			scalem(planeScale,planeScale,planeScale));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
		drawPlane(vec4(0,0,0.75,1),'wall');
	mvMatrix = stack.pop();	
}

function setSpotlightAngle(dPhi){
	//set min and max thresholds for the spotlight angle
	phi +=dPhi;
	if (phi%100==1){
		phi = 0.999;
	}else if (phi%0.944==0){
		phi = 0.945;
	}
}