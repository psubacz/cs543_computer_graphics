/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Peter Subacz
 * 
 * using multiple draw calls example: https://webglfundamentals.org/webgl/lessons/webgl-less-code-more-fun.html
 * strats to draw multiple objects to a screen: 
 * 
 * This program allows a user to upload a ply file and draw that file as a polygon mesh to the screen. The mesh
 * 	can then be translated in the x,y, or z direction as well as be rotated around the roll, pitch, and yaw
 * 	axis. 
 * 
 * A breathing animation can be enabled that will displace a polygon about its surface normal.
 * 
 * Note: this program is extremely computationally heavy with regards to the breathing animation.
 * 
 * Interactive features:
 *		Press ' p ' - Increase spotlight cut off angle (increase cone angle).
 *		Press ' P ' - Decrease spotlight cut off angle (decrease cone angle).
 *		Press ' m ' - The scene is shaded using Gouraud lighting (smooth shading). 
 *		Press ' M ' - The scene is shaded using flat shading.
  *		Press ' o ' - Swap between present colors and randomly generated colors. 
 * 		Press ' w ' to reset spotlight angle.
 * 
 */

var gl;	//webgl
var id; //animation id

var fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var program;

var mvMatrix, pMatrix;
var modelView, projection;
var eye;

var stack = []; //Hierarchy model stack

//cubes 
var gouraudLightingNormalsArrayCube = [];
var flatShadingNormalsArrayCube = [];
var theCube = cube();

//spheres
var numTimesToSubdivide = 5;
var gouraudLightingnormalsArraySphere = [];
var flatShadingNormalsArraySphere = [];
var pointsArray = [];
var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);

//tree size
var numberOfBranches = 3;		//number of subtrees within 
var treeDisplacementX = 2.5;
var treeDisplacementY = 2.5;
var treeDisplacementZ = 0;
var treeLineDecay = 1.5;

var numberOfObjects = 0;

//point lighting location
var pointLightPosition = vec4(0.0, 1.0, 5.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

//Line materials
var materialAmbient = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialDiffuse = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialShininess = 100.0;

var diffuseProduct;
var specularProduct;
var diffuseProduct;

// spot light
var phi = 0.99;

//yaw rotation variables
var beta = 0;

//control booleans
var animation = true;
var gouraudLighting = false;
var flatShading = false;

var index = 0;
var materialAmbientList = [];
var materialDiffuseList = [];
var materialSpecularList = [];
var materialShininessList = [];

function calculateNumberObjects(numObjects){
	//recusively calculate the number of objects on the screen.
	if (numObjects>0){
		calculateNumberObjects(numObjects-1);
	}
	numberOfObjects += 1*Math.pow(2,numObjects);
}

function generateMaterialLighting(){
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
function modelRotations(){
	beta +=0.5;
	if (beta%360==0){
		beta = 0;
	}
}

function spotlightAngle(dPhi){
	phi +=dPhi;
	if (phi%100==1){
		phi = 0.999;
	}else if (phi%0.944==0){
		phi = 0.945;
	}
}

function main(){
	window.onkeypress = function (event) { //when a key is pressed, process the input
		process_keypress(event.key)
	}

	generateMaterialLighting();

	console.log(numberOfObjects);
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas);
	
	if (!gl){//Check that the return value is not null.
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);

	//Set up the viewport
	gl.viewport( 0, 0, 400, 400);

	aspect =  canvas.width/canvas.height;
	
	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.enable(gl.DEPTH_TEST);	//enable depth testing
	// gl.enable(gl.CULL_FACE);	//enable culling - default backfacing triangles

	points = [];
	colors = [];

	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

	projection = gl.getUniformLocation(program, "projectionMatrix");
	modelView = gl.getUniformLocation(program, "modelMatrix");
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 7.5);

	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix");
	aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	pMatrix = perspective(fovy, aspect, 0.001, 50);
	gl.uniformMatrix4fv( projection, false, flatten(pMatrix));
	
	eye = vec3(0, -5, -25);
	at = vec3(0.0, -5, 0.0);
	up = vec3(0.0, 1.0, 0.0);
	mvMatrix = lookAt(eye, at , up);
	modelViewMatrix = mvMatrix; 

	process_keypress('');

	render();
}


function render(){
	index = 0;
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.uniform1f(gl.getUniformLocation(program, "phi"), phi);
	computeHierarchyModel();	//compute hierachy model
	if (animation){ 			//recursive animation 
		id = requestAnimationFrame(render);
	}
	mvMatrix = modelViewMatrix; 
	update_state_output()
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
	
	modelRotations(); // Increment rotation angle
	mvMatrix = mult(mvMatrix,rotateY(-beta));					// Rotations 
	gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));	// 
	draw_sphere();	// draw the root sphere
	treeDisplacementX = 10;										// reset tree displacement
	attach_subtrees(numberOfBranches);							
}

function attach_subtrees(numberOfBranches){
	/* 
		Recusively attach lower leveled objects.
	*/
	stack.push(mvMatrix);
	treeDisplacementX /=2;
	if(numberOfBranches>0){
		draw_lines();
		if (stack.length%2>0){
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_cube();
			attach_subtrees(numberOfBranches-1);
			//draw the left object
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix) );
			draw_cube();
			attach_subtrees(numberOfBranches-1);
		}else{
			//draw the right object
			mvMatrix = mult(mvMatrix, translate(treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_sphere();
			attach_subtrees(numberOfBranches-1);
			// draw the left object
			mvMatrix = mult(mvMatrix, rotateY(2*beta));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix,translate(-treeDisplacementX, -treeDisplacementY, 0));
			mvMatrix = mult(mvMatrix, rotateY(-2*beta));
			gl.uniformMatrix4fv( modelView, false, flatten(mvMatrix));
			draw_sphere();
			attach_subtrees(numberOfBranches-1);
		}
	}
	treeDisplacementX*=2;
	mvMatrix = stack.pop();
}

function draw_cube(color){
	// materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
	// materialDiffuse = vec4( 1.0, 0.0, 1.0, 1.0 );
	// materialSpecular = vec4( 1.0, 0.0, 1.0, 1.0 );
	// materialShininess = 20.0;
	materialAmbient = materialAmbientList[index];
	materialDiffuse = materialDiffuseList[index];
	materialSpecular = materialSpecularList[index];
	materialShininess = materialShininessList[index];
	index+=1;
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

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
	}else if(flatShading == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(flatShadingNormalsArrayCube), gl.STATIC_DRAW );
	}else{
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingNormalsArrayCube), gl.STATIC_DRAW );
	}

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal);

	gl.drawArrays( gl.TRIANGLES, 0, theCube.length);

	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
}

function draw_sphere(color){
	// materialAmbient = vec4( 0.0, 1.0, 1.0, 1.0 );
	// materialDiffuse = vec4( 0.0, 1.0, 1.0, 1.0 );
	// materialSpecular = vec4( 0.0, 1.0, 1.0, 1.0 );
	// materialShininess = 10.0;

	materialAmbient = materialAmbientList[index];
	materialDiffuse = materialDiffuseList[index];
	materialSpecular = materialSpecularList[index];
	materialShininess = materialShininessList[index];
	index+=1;

	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "pointLightPosition"), flatten(pointLightPosition));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
	
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	if(gouraudLighting == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingnormalsArraySphere), gl.STATIC_DRAW );
	}else if(flatShading == true){
		gl.bufferData( gl.ARRAY_BUFFER, flatten(flatShadingNormalsArraySphere), gl.STATIC_DRAW );
	}else{
		gl.bufferData( gl.ARRAY_BUFFER, flatten(gouraudLightingnormalsArraySphere), gl.STATIC_DRAW );
	}


	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal);

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation( program, "vPosition");
 	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length );
	gl.deleteBuffer(vBuffer);
	gl.deleteBuffer(nBuffer);
}

function draw_lines(){
	materialAmbient = vec4( 0.23125, 0.23125, 0.23125, 1 );
	materialDiffuse = vec4( 0.2775, 0.2775, 0.2775, 1.0 );
	materialSpecular = vec4( 0.773911, 0.773911, 0.773911, 1.0 );
	materialShininess = 89.6;
	diffuseProduct = mult(lightDiffuse, materialDiffuse);
	specularProduct = mult(lightSpecular, materialSpecular);
	ambientProduct = mult(lightAmbient, materialAmbient);

	gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
	gl.uniform4fv(gl.getUniformLocation(program, "pointLightPosition"), flatten(pointLightPosition));
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
	
	var cCenter = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
					vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
					vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2, 0, 1),	//right verticle line
					vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2, 0, 1)];	//left verticle line

	var cColor = [vec4( 0, -0.5, 0, 1),vec4( 0, -1.5, 0, 1),		//verticle line
		vec4( -treeDisplacementX-0.2, -1.5, 0, 1),vec4( treeDisplacementX+0.2, -1.5, 0, 1),		//horzontal line
		vec4( -treeDisplacementX, -1.5, 0, 1),vec4( -treeDisplacementX, -2, 0, 1),	//right verticle line
		vec4( treeDisplacementX, -1.5, 0, 1),vec4( treeDisplacementX, -2, 0, 1)];	//left verticle line

	// var cColor = [vec4( 1, 1, 1, 1), vec4( 1, 1, 1, 1),		//verticle line
	// 		vec4( 1, 1, 1, 1),vec4( 1, 1, 1, 1),		//horzontal line
	// 		vec4( 1, 1, 1, 1),vec4( 1, 1, 1, 1),	//right verticle line
	// 		vec4( 1, 1, 1, 1),vec4( 1, 1, 1, 1)];	//left verticle line
	
	var pBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(cCenter), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program,  "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);		//Turns the attribute on
	
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cColor), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal)

	gl.drawArrays(gl.LINES, 0,8);
	gl.deleteBuffer(pBuffer);
	gl.deleteBuffer(nBuffer);
}

function cube(){
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
		gouraudLightingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		i+=1;
	}
	i = 0;
	while(i<verts.length){
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		flatShadingNormalsArrayCube.push(vec4(verts[i][0],verts[i][1],verts[i][2],0));
		i+=4;
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
	pointsArray.push(a);
	pointsArray.push(b);
	pointsArray.push(c);
	// normals are vectors

	gouraudLightingnormalsArraySphere.push(a[0],a[1], a[2], 0.0);
	gouraudLightingnormalsArraySphere.push(b[0],b[1], b[2], 0.0);
	gouraudLightingnormalsArraySphere.push(c[0],c[1], c[2], 0.0);

	flatShadingNormalsArraySphere.push(a[0],a[1], a[2], 0.0);
	flatShadingNormalsArraySphere.push(a[0],a[1], a[2], 0.0);
	flatShadingNormalsArraySphere.push(a[0],a[1], a[2], 0.0);
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

function process_keypress(theKey){
	// function to toggle modes,
	var outputMessage = '';

	//on key presses, do change the colors or modes
	switch (theKey) {
		case 'p':
			//increasing angle by +0.01
			spotlightAngle(0.001);
			break;
		case 'P':
			//decreasing angle by -0.01
			spotlightAngle(-0.001);
			break;
		case 'm':
			//Gouraud lighting 
			if (gouraudLighting == false){
				gouraudLighting = true;
				flatShading = false;
			}else{
				gouraudLighting = false;
			}
			break;
		case 'M':
			// flat shading 
			if (flatShading == false){
				flatShading = true;
				gouraudLighting = false;
			}else{
				flatShading = false;
			}
			break;

		case 'w':
			phi = 0.99;
			break;

		default:
			// var outputMessage = 'No function set for keypress: ' + theKey + '<br>';		//clear the output message			
	}
	
	outputMessage = 'Current keypress actions are: <br>';
	outputMessage += '- Interaction: <br>';
	outputMessage += "-- Press ' p ' - Increase spotlight cut off angle (increase cone angle).<br>";
	outputMessage += "-- Press ' P ' - Decrease spotlight cut off angle (decrease cone angle) .<br>";
	outputMessage += "-- Press ' m ' - The scene is shaded using Gouraud lighting (smooth shading) .<br>";
	outputMessage += "-- Press ' M ' - The scene is shaded using flat shading . <br>";
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
	msg += " Spotlight Angle:"+phi+"<br>";
	msg += " Model Angle:"+beta+"<br>";
	document.getElementById("pageMode").innerHTML = msg;
}