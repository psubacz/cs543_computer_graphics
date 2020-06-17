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
 * features:
 *  Parse a .ply file 
 * 	Translate around the XYZ:
 * 		Press ' X ' or ' x ' Translate your wireframe in the + x
 * 		Press ' C ' or ' c ' Translate your wireframe in the - x
 * 		Press ' y ' or ' y ' Translate your wireframe in the + y
 * 		Press ' U ' or ' u ' Translate your wireframe in the - y
 * 		Press ' Z ' or ' z ' Translate your wireframe in the + z
 * 		Press ' A ' or ' a ' Translate your wireframe in the - z
 * 	Rotate around the Roll,Pitch,Yaw
 * 		Press ' R ' or ' r ' Rotate your wireframe in an + Roll
 * 		Press ' R ' or ' r ' Rotate your wireframe in an + Roll
 * 		Press ' T ' or ' T ' Rotate your wireframe in an - Pitch
 * 		Press ' O ' or ' o ' Rotate your wireframe in an + Pitch
 * 		Press ' K ' or ' k ' Rotate your wireframe in an + Yaw
 * 		Press ' L ' or ' l ' Rotate your wireframe in an - Yaw
 * 	Breathing animation
 * 		Press ' B ' or ' b ' to toggle the breathing (pulsing).
 * 	Reset rotations and Translations
 * 
 * 
 * 
 * 
 * 
 * 
 */

// global variables
var gl;
var program;
var extents;
var canvas;
var id;
var rotMatrix;
var translateMatrix;
var polygons = [];
var key = '';
var theta = 0; 	//degrees x rotation
var beta = 0;	//degrees y rotation
var gamma = 0;	//degrees z rotation
var dx = 0;		//units x translation
var dy = 0;		//units y translation
var dz = 0;		//units z translation
var c = 0.005;
var pulse_scale = 0.9;
var pulse_delay = 1; //time in ms
var disp = 0;
var x = 0.0;
var y = 0.0;
var z = 0.0;
var zNear = 0.1;
var zFar = 100;
var avg_x = 1;
var avg_y = 1;
var avg_z = 1;
var animation = true;
var pulse = false;
var rotPosX = false;
var rotNegX = false;
var rotPosY = false;
var rotNegY = false;
var rotPosZ = false;
var rotNegZ = false;
var transPosX = false;
var transPosY = false;
var transPosZ = false;
var transNegX = false;
var transNegY = false;
var transNegZ = false;

function main() {
	update_state_output(); // update the status box with current status
	process_keypress(' '); // show the possible inputs
	window.onkeypress = function (event) { //when a key is pressed, process the input
		process_keypress(event.key)
	}

	// Add the event listener to parse input file
	document.getElementById('ply-file').addEventListener('change', function () {
		var fileReader = new FileReader();
		fileReader.onload = function (e) {
			extents = [];
			polygons = [];
			var vertexCoordsList = []; // list of vertex cordinates 
			var polygonIndexList = []; // list of polygon indexs within the vertexCoordsList.
			extents = [];
			[vertexCoordsList, polygonIndexList, extents] = parse_ply_file(vertexCoordsList, polygonIndexList, fileReader.result);
			polygons = construct_polygon_points(vertexCoordsList, polygonIndexList);
			init();
			render();
		}
		fileReader.readAsText(this.files[0]);
	})
}

function init(){
	/*
		Initialize webgl, and set: viewports, cameras, points
	*/
	canvas = document.getElementById('webgl');// Retrieve <canvas> element
	gl = WebGLUtils.setupWebGL(canvas, undefined);	// Get the rendering context for WebGL
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);		// Setup camera

	// Tell WebGL how to convert from clip space to pixels
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.enable(gl.CULL_FACE);	//enable culling - default backfacing triangles
	gl.enable(gl.DEPTH_TEST);	//enable depth testing
	set_perspective_view();		//set the camera
	set_point_size();			//set the point size
}

function render(){   
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	// We tell WebGL which shader program to execute.

	set_rotation();			// set rotation if active
	set_translation(); 		// set translation if active
	
	rotMatrix = mult(rotateZ(gamma),mult(rotateY(beta),rotateX(theta)));
	
	for(var i = 0; i < polygons.length; ++i) {
		var vBuffer = gl.createBuffer();		// Create vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(polygons[i][0]), gl.STREAM_DRAW);
		//Get the location of the shader's vPosition attribute in the GPU's memory
		var vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);			//Turns the attribute on

		var cBuffer = gl.createBuffer();		// Create color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(polygons[i][1]), gl.STREAM_DRAW);
		//Get the location of the shader's vColor attribute in the GPU's memory
		var vColor = gl.getAttribLocation(program, "vColor");
		gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vColor);//Turns the attribute on

		if(pulse){ 
			polygon_pulse(i);	
		}

		translateMatrix = translate(dx+polygons[i][3][0], dy+polygons[i][3][1], dz+polygons[i][3][2]);
		var ctMatrix = mult(translateMatrix, rotMatrix);
		var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

		gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));
		gl.drawArrays(gl.LINE_LOOP, 0, polygons[1][0].length);
		update_state_output()
	}

	// if (show_normals){
	// 	for(var i = 0; i < polygons.length; ++i) {
	// 		var vBuffer = gl.createBuffer();		// Create vertex buffer
	// 		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	// 		gl.bufferData(gl.ARRAY_BUFFER, flatten(polygons[i][0]), gl.STREAM_DRAW);
	// 		//Get the location of the shader's vPosition attribute in the GPU's memory
	// 		var vPosition = gl.getAttribLocation(program, "vPosition");
	// 		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	// 		gl.enableVertexAttribArray(vPosition);			//Turns the attribute on
	
	// 		var cBuffer = gl.createBuffer();		// Create color buffer
	// 		gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	// 		gl.bufferData(gl.ARRAY_BUFFER, flatten(polygons[i][1]), gl.STREAM_DRAW);
	// 		//Get the location of the shader's vColor attribute in the GPU's memory
	// 		var vColor = gl.getAttribLocation(program, "vColor");
	// 		gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	// 		gl.enableVertexAttribArray(vColor);//Turns the attribute on
	
	// 		if(pulse){ 
	// 			polygon_pulse(i);	
	// 		}
	
	// 		translateMatrix = translate(dx+polygons[i][3][0], dy+polygons[i][3][1], dz+polygons[i][3][2]);
	// 		var ctMatrix = mult(translateMatrix, rotMatrix);
	// 		var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	
	// 		gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));
	// 		gl.drawArrays(gl.LINE_LOOP, 0, polygons[1][0].length);
	// 		update_state_output()
	// 	}

	// }
	id = requestAnimationFrame(render);
}

function polygon_pulse(i){
	/*
		Displaces a polygon a using the following equation: 		c*n*sin(alpha)*100
			where: c is the scaling factor, n is the normal, sin(alpha) is the direction. Alpha is scaled between 
			0.0 -> pi/16. When alpha exceeds each limit the directional is changed to reverse the interpolation.
	*/
	polygons[i][4]+=0.01*polygons[i][5]; // multiply by the directionality constant

	disp = Math.sin(polygons[i][4]); 	 // get displacement

	// translate & correct the translation relevative the any rotations
	var tem = mult(rotMatrix,translate(c*polygons[i][2][0]*disp*100, c*polygons[i][2][1]*disp*100, c*polygons[i][2][2]*disp*100,1));

	polygons[i][3][0] = tem[0][3]; // set pulse x dir
	polygons[i][3][1] = tem[1][3]; // set pulse y dir
	polygons[i][3][2] = tem[2][3]; // set pulse z dir
	if (polygons[i][4]>=(Math.PI/16) || polygons[i][4]<=0.0){  //0.382 is pi/8
		polygons[i][5] *= -1
	}
}

function set_perspective_view(){
	/*
	
	*/

	// use the extents to make a bounding sphere
	if (extents.length){
		avg_x = (extents[3]+extents[0])/2.0;
		avg_y = (extents[4]+extents[1])/2.0;
		avg_z = (extents[5]+extents[2])/2.0;
		//calcualte the radius 
		var r = Math.sqrt(Math.pow(extents[3] - avg_x, 2)+ Math.pow(extents[4] - avg_y, 2) + Math.pow(extents[5] - avg_z, 2));
	}else{
		r=1;
	}

	var fieldOfView = 60;
	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	var fDistance = r / Math.tan(fieldOfView); 

	zNear = fDistance - r;
	zFar = fDistance + r;
	
	var thisProj = perspective(fieldOfView, aspect, zNear*0.1, zFar*1.1);

	var projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	var eye = vec3(0.0, 0.0, zNear*1.4); 	// position at camera at XYZ
	var at  = vec3(avg_x, avg_y, avg_z);		// center point of what is being looked at XYZ
	var up  = vec3(0.0, 1.0, 0.0); // any dirction use 
	var viewMatrix = lookAt(eye, at, up);
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
}

function set_point_size(){
	//Specify the vertex size
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 2.0);
}

function set_rotation(){
	// camera transforms
	if (rotPosX){
		theta += 15;
	}else if (rotNegX){
		theta -= 15;
	}else{
		//do nothing
	}
	if (rotPosY){
		beta += 15;
	}else if (rotNegY){
		beta -= 15;
	}else{
		//do nothing
	}
	if (rotPosZ){
		gamma += 15;
	}else if (rotNegZ){
		gamma -= 15;
	}else{
		//do nothing
	}
	if (theta%360==0){
		theta = 0;
	}
	if (beta%360==0){
		beta = 0;
	}
	if (gamma%360==0){
		gamma = 0;
	}
}

function set_translation(){
	if( transPosX== true){
		dx += 0.005;
	}else if(transNegX== true){
		dx -= 0.005;
	}else{
		//do nothing
	}
	if(transPosY == true){
		dy += 0.005;
	}else if(transNegY == true){
		dy -= 0.005;
	}else{
		//do nothing
	}
	if(transPosZ == true){
		dz += 0.005;
	}else if(transNegZ== true){
		dz -= 0.005;
	}else{
		//do nothing
	}
}

function update_state_output() {
	msg = "";
	if (pulse == true){
		msg += " Breathing: On<br>";
	}else{
		msg += " Breathing: Off<br>";
	}

	msg += "--------Translation-----------<br>";
	msg += " X: "+dx.toFixed(3)+"<br>";
	msg += " Y: "+dy.toFixed(3)+"<br>";
	msg += " Z: "+dz.toFixed(3)+"<br>";

	msg += "--------Rotation---------------<br>";
	//rotations
	msg += " Roll: " + theta.toFixed(0) + "<br>";
	msg += " Pitch: " + beta.toFixed(0) + "<br>";
	msg += " Yaw: " + gamma.toFixed(0) + "<br>";

	msg += "--------Pulse---------------<br>";
	//rotations
	msg += " Disp: " + disp.toFixed(3) + "<br>";
	document.getElementById("meshState").innerHTML = msg;
}

function process_keypress(theKey) {
	// function to toggle modes,

	//on key presses, do change the colors or modes
	switch (theKey) {
		case 'X':
		case 'x':
			// Translate your wireframe in the + x direction.
			if (transPosX == false){
				transPosX = true;
				transNegX = false;
			}else{
				transPosX = false;
			}
			break;
		case 'C':
		case 'c':
			//Translate your wireframe in the - x direction
			if (transNegX == false){
				transPosX = false;
				transNegX = true;		//turn on
			}else{
				transNegX = false;
			}
			break;

		case 'Y':
		case 'y':
			//Translate your wireframe in the + y direction.
			if (transPosY == false){
				transPosY = true;//turn on
				transNegY = false;//turn off
			}else{
				transPosY = false;
			}
			break;
		case 'U':
		case 'u':
			//Translate your wireframe in the - y direction
			if (transNegY == false){
				transPosY = false;
				transNegY = true;
			}else{
				transNegY = false;
			}
			break;

		case 'Z':
		case 'z':
			//Translate your wireframe in the + z direction.
			if (transPosZ == false){
				transPosZ = true;
				transNegZ = false;
			}else{
				transPosZ = false;
			}

			break;
		case 'A':
		case 'a':
			//Translate your wireframe in the - z direction.
			if (transNegZ == false){
				transPosZ = false;
				transNegZ = true;
			}else{
				transNegZ = false;
			}

			break;

		case 'R':
		case 'r':
			//Rotate your wireframe in an +X-roll about it's CURRENT position.
			if (rotPosX==false){
				rotNegX = false;
				rotPosX = true;
			}else{
				rotPosX = false;
			}
			break;
		case 'T':
		case 't':

			//Rotate your wireframe in an -X-roll about it's CURRENT position.
			if (rotNegX == false){
				rotNegX = true;
				rotPosX = false;
			}else{
				rotNegX = false;
			}
			break;
		
		case 'O':
		case 'o':
			//Rotate your wireframe in an +Y-roll about it's CURRENT position.
			if (rotPosY == false){
				rotNegY = false;
				rotPosY = true;	
			}else{
				rotPosY = false;
			}
			break;
		case 'P':
		case 'p':
			//Rotate your wireframe in an -Y-roll about it's CURRENT position.
			if(rotNegY == false){
				rotNegY = true;
				rotPosY = false;
			}else{
				rotNegY = false;
			}
			break;

		case 'L':
		case 'l':
			//Rotate your wireframe in an +Z-roll about it's CURRENT position.
			if(rotNegZ == false){
				rotNegZ = true;
				rotPosZ = false;
			}else{
				rotNegZ = false;
			}
			break;
		case 'K':
		case 'k':
			//Rotate your wireframe in an -Z-roll about it's CURRENT position.
			if(rotPosZ==false){
				rotNegZ = false;
				rotPosZ = true;
			}else{
				rotPosZ = false;
			}

			break;

		case 'B':
		case 'b':
			if (pulse == false){//turn on
				pulse = true;				
			}else{//turn off
				pulse = false;
			}
			//Toggle pulsing meshes
			break;
		case 'Q':
		case 'q':
			//stop all actions
			//disable translation
			transPosX = false;
			transNegX = false;
			transPosY = false;
			transNegY = false;
			transPosZ = false;
			transNegZ = false;
			//disable rotations
			rotNegX = false;
			rotPosX = false;
			rotNegY = false;
			rotPosY = false;
			rotNegZ = false;
			rotPosZ = false;
			//reset translations
			dx = 0;
			dy = 0;
			dz = 0;
			//reset rotation
			theta = 0;
			beta = 0;
			gamma = 0;

			//pulse settings
			t = 0
			pulse = false;

			break;		
		default:
			var outputMessage = 'No function set for keypress: ' + theKey + '<br>';		//clear the output message
			outputMessage += 'Current keypress actions are: <br>';
			outputMessage += '-Translations: <br>';
			outputMessage += "-- ' X ' or ' x ' Translate your wireframe in the + x direction. <br>";
			outputMessage += "-- ' C ' or ' c ' Translate your wireframe in the - x direction.<br>";
			outputMessage += "-- ' y ' or ' y ' Translate your wireframe in the + y direction.<br>";
			outputMessage += "-- ' U ' or ' u ' Translate your wireframe in the - y direction.<br>";
			outputMessage += "-- ' Z ' or ' z ' Translate your wireframe in the + z direction. <br>";
			outputMessage += "-- ' A ' or ' a ' Translate your wireframe in the - z direction.<br>";
			outputMessage += '-Rotations: <br>';
			outputMessage += "-- ' R ' or ' r ' Rotate your wireframe in an + roll about it's CURRENT position.<br>";
			outputMessage += "-- ' T ' or ' T ' Rotate your wireframe in an - roll about it's CURRENT position.<br>";
			outputMessage += "-- ' O ' or ' o ' Rotate your wireframe in an + pitch about it's CURRENT position.<br>";
			outputMessage += "-- ' P ' or ' p ' Rotate your wireframe in an - pitch about it's CURRENT position.<br>";
			outputMessage += "-- ' K ' or ' k ' Rotate your wireframe in an + yaw about it's CURRENT position.<br>";
			outputMessage += "-- ' L ' or ' l ' Rotate your wireframe in an - yaw about it's CURRENT position.<br>";
			outputMessage += '-Pulse <br>';
			outputMessage += "-- ' B ' or ' b ' Toggle pulsing meshes. <br>";
			outputMessage += '-Reset <br>';
			outputMessage += "-- ' Q ' or ' q ' Resets the mesh to the orgin and turns off translations/rotations <br>";
			document.getElementById('pageContent').innerHTML = outputMessage;
	}
	update_state_output();
}

function display_file_metadata(plyDataType, endHeader, numberVertices, numberPolygons,
	processedVertices, processedPolygons) {
	/*
		This function displays metadata parsed from the a textfile at the end.
		 this infomation is displayed belwo the broswe button. The infomation 
		 shown in the file name, file size, number of vertices, and number of 
		 polygones in the file.
	
			Error messages will occur if ply or end_header tags are missing from header.
	
		warning messages will fire if mismatch between header and processed data. 
	*/

	var uploadedFile = document.getElementById("ply-file");
	var outputMessage = "";		//clear the output message
	var file = uploadedFile.files[0]; // sinse we are only working with one file, get the first element
	if ('name' in file) {
		outputMessage += "------- Metadata -------<br>"; //display the file name
		outputMessage += "File name: " + file.name + "<br>"; //display the file name
	}
	if ('size' in file) {
		outputMessage += "File size: " + file.size + " bytes <br>"; //display the size of the file
	}

	if (plyDataType == true && numberVertices == processedVertices && numberPolygons == processedPolygons) {
		outputMessage += "Number of Vertices: " + numberVertices + ", Number of vertices processed: " + processedVertices + "<br>";
		outputMessage += "Number of Polygons: " + numberPolygons + ", Number of polygons processed: " + processedPolygons + "<br>";
	} else if (plyDataType == false) {
		outputMessage += "Error! File header 'ply' tag not set. Add the 'ply' tag to the header to continue with this file. Exiting parsing...<br>"; //no ply txt string in header
	} else if (endHeader == false) {
		outputMessage += "Error! File header 'end_header' tag not set. Add the 'end_header' tag to the header to continue with this file. Exiting parsing...<br>"; //no ply txt string in header
	}
	if (numberVertices != processedVertices && (plyDataType != false && endHeader != false)) {
		outputMessage += "Warning! Mismatch in file header and data. Header lists: " + numberVertices + " vertices and processed: " + processedVertices + " vertices. <br>";
	}
	if (numberPolygons != processedPolygons && (plyDataType != false && endHeader != false)) {
		outputMessage += "Warning! Mismatch in file header and data. Header lists: " + numberPolygons + " vertices and processed: " + processedPolygons + " vertices. <br>";
	}
	document.getElementById("pageContent").innerHTML = outputMessage;	//display output to mess
}

function parse_ply_file(vertexCoordsList, polygonIndexList, rawText) {
	/*
		This parser will process raw text uploaded to the application. The parser will
		 split the text by new lines and then by white space to process each word inside
		 raw text. The parser will read in the header information if header fails, the 
		 program will return an error message to the screen. If it passes the the 
		 coordinates of the vertices will be parsed as vec4s and the polygons will be 
		 processed in turn as vec4 as required. if the index is only moves 3 times the
		 parser assumes 
	
		file format
		---
		ply											***Required tag
		format ascii 1.0			
		element vertex 8							
		property float32 x
		property float32 y
		property float32 z
		element face 12
		property list uint8 int32 vertex_indices
		end_header									***Required tag
		
		-0.5 -0.5 -0.5 	//vertex format
		3 3 2 1			//polygon format
		---
	
		returns [list,list,list]
	*/
	vertexCoordsList = [];			// clear the vertex list
	polygonIndexList = [];			// clear the polygon list
	var endHeader = false;			// bool end of header marker
	var plyDataType = false;		// bool ply designation present in file header
	var vertexIndex = 0;			// int index of vertices
	var polygonIndex = 0;			// int index of polygon
	var x_max = 0;
	var x_min = 0;
	var y_max = 0;
	var y_min = 0;
	var z_max = 0;
	var z_min = 0;

	var lines = rawText.split(/\r?\n/g);			//split the string by new lines
	for (i = 0; i < lines.length; i++) {					//for line in lines
		var point = vec4(0.0, 0.0, 0.0, 1.0);		//  points to be written too
		var index = 0;								//  indexes points written
		var lineArray = lines[i].split(/(\s+)/);	//  split the string by spaces
		for (ii = 0; ii < lineArray.length; ii++) {			//  for each item in the line, cast to float 
			if (lineArray[ii].length > 0) {			//		if the item exists(skip empty lines)
				if (endHeader == false) {			//	parse the header
					switch (lineArray[ii]) {
						case 'ply':
							plyDataType = true;
							break;
						case 'vertex':
							numberVertices = parseInt(lineArray[lineArray.length - 1]);
							break;
						case 'face':
							numberPolygons = parseInt(lineArray[lineArray.length - 1]);
							break;
						case 'end_header':
							endHeader = true;
							break;
						default:
						//do nothing
					}
				} else {							//parse the file content						
					var floatCast = parseFloat(lineArray[ii])	//cast string to float
					if (!isNaN(floatCast))				// 	if not NaN, set as point
					{
						point[index] = floatCast;		// set point to float value
						index++							//	increment the counter
					}
				}
			}
		}

		if (endHeader == true && plyDataType == true) {
			if (index > 0) {								//if values have been set
				if (index == 3) {							// four values set mean its a extent (homogeneous unit will not change in this app)
					vertexCoordsList[vertexIndex] = point;
					// vertexCoordsList.push(point);
					vertexIndex++;
					//update extents
					if (point[0] > x_max) {
						x_max = point[0];
					} else if (point[0] < x_min) {
						x_min = point[0];
					}
					if (point[1] > y_max) {
						y_max = point[0];
					} else if (point[1] < y_min) {
						y_min = point[0];
					}
					if (point[0] > z_max) {
						z_max = point[0];
					} else if (point[0] < z_min) {
						z_min = point[0];
					}

				} else if (index == 4) {
					polygonIndexList[polygonIndex] = point;
					// numberPolygons.push(point);				// set total number of vertices
					polygonIndex++;
				} else {
					console.log("Warning, line " + i + " has more than 4 items.");// do nothing, log line to console 
				}
			}
		}
	}
	// display_file_metadata(plyDataType, endHeader, numberVertices, numberPolygons, vertexIndex, polygonIndex);
	return [vertexCoordsList, polygonIndexList, [x_min, y_min, z_min, x_max, y_max, z_max]];
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

function construct_polygon_points(vertexCoordsList, polygonIndexList)
{
	/*
		this function constructs the list of points for each polygon to drawn to the screen. Each polygon
		 is held inside a nested list where:

		 ploygons= [
			polygon_n =[
				points = [
					vec4(),
					vec4(),
					vec4(),
				],
				colors = [
					vec4(),
					vec4(),
					vec4(),
				]
				normal = vec4();
				displacement=vec4();
				alpha =0;
				directionality = 1;
				]
			],
		 ]
		 returns [polygons]
	*/

	var polygons = [];
	for(i=0;i<polygonIndexList.length;i++){
		var polygon = [[],[],[]];
		var a = polygonIndexList[i][1]
		var b = polygonIndexList[i][2]
		var c = polygonIndexList[i][3]
		var indices = [ a, b, c, a, c, b ];
		for (var ii = 0; ii < indices.length-2; ++ii ){
			polygon[0][ii] = vertexCoordsList[indices[ii]];		// vertices list
			polygon[1][ii]= [1.0, 1.0, 1.0, 0.0];   			// color list
		}
		polygon[2] = normal_newell_method(polygon[0]);			// normal
		polygon[3] = vec3(0.0,0.0,0.0,0.0);   					// displacement
		polygon[4] = 0;											// alpha
		polygon[5] = 1;											// directionality constant	
		polygons[i] = polygon;									//store polygon in the array
	}
	return polygons;
}