/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Joshua Cuneo
 * @author Peter Subacz
 * 
 * 
 */

var gl;
var program;
var points;
var colors;

var theta = 0; 	//degrees x rotation
var beta = 0;	//degrees y rotation
var gamma =0;	//degrees z rotation
var alpha = 0;

var id;
var key = '';

var breathing = true;
var x = 0.0;
var y = 0.0;
var z = 0.0;

var roll = 0.0;
var extents;	
var polygons;
var canvas;

var pi = 3.14159265359;
var zNear = 0.1;
var zFar =100;

var avg_x =1;
var avg_y =1;
var avg_z =1;

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

// breathing, disp, x, y, z, rotPosX

function radToDeg(rad) {
    return rad * 180 / Math.PI;
  }

function degToRad(deg) {
    return deg * Math.PI / 180;
  }
  
function dot_product(vector1, vector2) {
	//https://www.w3resource.com/javascript-exercises/javascript-basic-exercise-108.php
	var result = 0;
	for (var i = 0; i < 3; i++) {
	  result += vector1[i] * vector2[i];
	}
	return result;
  }



function main() {
	update_state_output(); // update the status box with current status

	// Add the event listener to parse input file
	document.getElementById('ply-file').addEventListener('change', function () {
		var fileReader = new FileReader();
		fileReader.onload = function (e) {
			points = [];
			colors = [];
			extents = [];
			polygons = [];
			var vertexCoordsList = []; // list of vertex cordinates 
			var polygonIndexList = []; // list of polygon indexs within the vertexCoordsList.
			extents = [];
			[vertexCoordsList, polygonIndexList, extents] = parse_ply_file(vertexCoordsList, polygonIndexList, fileReader.result);
			var polygons = construct_polygon_points(vertexCoordsList, polygonIndexList);
			draw_polygons(polygons);

		}
		fileReader.readAsText(this.files[0]);
	})

	// Retrieve <canvas> element
	canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");

	// We tell WebGL which shader program to execute.
	gl.useProgram(program);

	//Set up the viewport
	//x, y - specify the lower-left corner of the viewport rectangle (in pixels)
	//In WebGL, x and y are specified in the <canvas> coordinate system
	//width, height - specify the width and height of the viewport (in pixels)
	//canvas is the window, and viewport is the viewing area within that window
	//This tells WebGL the -1 +1 clip space maps to 0 <-> gl.canvas.width for x and 0 <-> gl.canvas.height for y
	gl.viewport(0, 0, canvas.width, canvas.height);

	points = [];
	colors = [];
	extents = [];
	polygons = [];

	render();
	process_keypress(' ');
	window.onkeypress = function (event) {
		process_keypress(event.key)
	}
}

function draw_polygons(polygons){   
	// Clear the canvas AND the depth buffer.
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Turn on culling. By default backfacing triangles
    // will be culled.
    // gl.enable(gl.CULL_FACE);
    // Enable the depth buffer
	gl.enable(gl.DEPTH_TEST);

	set_perspective_view();
	set_point_size();
	// For polygon in polygons, extract each point and draw them
	for (var i = 0; i < polygons.length; ++i) {
		for(var ii = 0; ii <polygons[i][0].length; ++ii) {
			// console.log(polygons[i][0][ii]);
			// set points 
			points.push(polygons[i][0][ii]);
			// for solid colored faces use
			colors.push(polygons[i][1][ii]);
		}
		set_vector_points();
		set_color_points();
		render();
	}
}

function set_vector_points(){
	//
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
	//
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
}

function set_point_size(){
	//Specify the vertex size
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 2.0);
}

function set_color_points(){
	//
	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
	//
	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
}

function set_perspective_view(){
	//https://community.khronos.org/t/automatically-center-3d-object/20892/6

		// use the extents to make a bounding sphere
		var dx=0;
		var dy=0;
		var dz=0;
		if (extents.length){
			avg_x = (extents[3]+extents[0])/2.0;
			avg_y = (extents[4]+extents[1])/2.0;
			avg_z = (extents[5]+extents[2])/2.0;
			//calcualte the radius 
			dx = extents[3] - avg_x;
			dy = extents[4] - avg_y;
			dz = extents[5] - avg_z;
			var r = Math.sqrt((dx)*(dx) + (dy)*(dy) + (dz)*(dz));
		}else{
			r=1;
		}
		var fieldOfView = 60;					//assumed to be 90 for now
		var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;

		var fDistance = r / Math.tan(fieldOfView); 
	
		zNear = fDistance - r;
		zFar = fDistance + r;
		
		var thisProj = perspective(fieldOfView, aspect, zNear, zFar);
	
		var projMatrix = gl.getUniformLocation(program, 'projMatrix');
		gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));
	
		// Set clear color
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		// CENTER THE OBJECT around the origin

		// dx = 1 - avg_x;
		// dy = 1 - avg_y;
		// dz = 1 - avg_z;

		// var dot_x=dot_product([1,0,0], [avg_x,avg_y,avg_z]);
		// var dot_y=dot_product([0,1,0], [avg_x,avg_y,avg_z]);
		// var dot_z=dot_product([0,0,1], [avg_x,avg_y,avg_z]);
	
		var eye = vec3(0.0, 0.0, zNear*1.5); 	// position at camera at XYZ
		var at  = vec3(0.0, 0.0, 0.0);		// center point of what is being looked at XYZ
		var up  = vec3(0.0, 1.0, 0.0); // any dirction use 
		var viewMatrix = lookAt(eye, at, up);
		var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
		gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
}

function render() {
	/*
	Q. How do I calculate my FOV and camera (eye) position?

A: Once you know your bounding box (your extents), you can use those to help you calculate FOV and camera location.
 Since the perspective projection function also takes in an aspect ratio, your model should not get distorted.

For your camera (eye) position, think about how you can use your extents to help you determine how far back you should pull your camera from the mesh. 
There's no one right way to do this, so please pick a method that makes logical sense to you.

Once you know your camera position, you can calculate your FOV using your camera position, your extents, and some trigonometry. 
Take a look at the image below:
	*/
	// camera transforms
	if (rotPosX){
		theta -= 0.5;
	}else if (rotNegX){
		theta += 0.5;
	}else{
		//do nothing
	}
	if (rotPosY){
		beta -= 0.5;
	}else if (rotNegY){
		beta += 0.5;
	}else{
		//do nothing
	}
	if (rotPosZ){
		gamma -= 0.5;
	}else if (rotNegZ){
		gamma += 0.5;
	}else{
		//do nothing
	}
	var rotMatrix = mult(mult(rotateX(theta),rotateY(beta)),rotateZ(gamma));


	// translate the model to the center of the screen
	var translateMatrix = translate(-avg_x, -avg_y, -avg_z);

	var ctMatrix = mult(translateMatrix, rotMatrix);
	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));


	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.LINES, 0, points.length);
	id = requestAnimationFrame(render);

}

function update_state_output() {
	msg = "";
	if (pulse == true){
		msg += " Breathing: On<br>";
	}else{
		msg += " Breathing: Off <br>";
	}

	msg += " -------------------<br>";
	if (transPosX == true){
		msg += " X: +<br>";
	}else if (transNegX == true){
		msg += " X: -<br>";
	}else{
		msg += " X: <br>"
	}

	if (transPosY == true){
		msg += " Y: +<br>";
	}else if (transNegY == true){
		msg += " Y: -<br>";
	}else{
		msg += " Y: <br>"
	}

	if (transPosZ == true){
		msg += " Z: +<br>";
	}else if (transNegZ == true){
		msg += " Z: -<br>";
	}else{
		msg += " Z: <br>";
	}

	msg += " -------------------<br>";
	//rotations
	if (rotPosX == true){
		msg += " X Rotation: +<br>";
	}else if (rotNegX == true){
		msg += " X Rotation: -<br>";
	}else{
		msg += " X Rotation: <br>";
	}
	if (rotPosY == true){
		msg += " Y Rotation: +<br>";
	}else if (rotNegY == true){
		msg += " Y Rotation: -<br>";
	}else{
		msg += " Y Rotation: <br>";
	}
	if (rotPosZ == true){
		msg += " Z Rotation: +<br>";
	}else if (rotNegZ == true){
		msg += " Z Rotation: -<br>";
	}else{
		msg += " Z Rotation: <br>";
	}
	document.getElementById("meshState").innerHTML = msg;
}

function process_keypress(theKey) {
	// function to toggle modes,x

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
				rotNegZ == false;
			}
			break;
		case 'K':
		case 'k':
			//Rotate your wireframe in an -Z-roll about it's CURRENT position.
			rotNegZ = false;
			rotPosZ = true;
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
			theta = 0;
			beta = 0;
			gramma = 0;
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
			outputMessage += "-- ' R ' or ' r ' Rotate your wireframe in an + X-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' T ' or ' T ' Rotate your wireframe in an - X-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' O ' or ' o ' Rotate your wireframe in an + Y-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' P ' or ' p ' Rotate your wireframe in an - Y-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' K ' or ' k ' Rotate your wireframe in an + Z-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' L ' or ' l ' Rotate your wireframe in an - Z-roll about it's CURRENT position.<br>";
			outputMessage += '-Pulse <br>';
			outputMessage += "-- ' B ' or ' b ' Toggle pulsing meshes. <br>";
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
	var numberVertices = 0;			// int number for vertices metadata
	var numberPolygons = 0;			// int number for polygons metadata
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
	display_file_metadata(plyDataType, endHeader, numberVertices, numberPolygons, vertexIndex, polygonIndex);
	return [vertexCoordsList, polygonIndexList, [x_min, y_min, z_min, x_max, y_max, z_max]];
}

function normal_newell_method(triVertex){
	/*
		Computes the normal via the newwell method for the m_x, m_y, and m_z

		returns [m_x,m_y,m_z]
	*/
	
	var normal = [0.0,0.0,0.0]; // [m_x,m_y,m_z]
	var order = [1,2,0,2,0,1] 	// [y,z,x,z,x,y]
	for(n=0;n<normal.length;n++){
		var sum = 0;
		for(ii=0;ii<triVertex.length-1;ii++){	
			sum += (triVertex[ii][order[n]]-triVertex[ii+1][order[n]])*
					(triVertex[ii][order[n+3]]+triVertex[ii+1][order[n+3]]);	
		}
		normal[n] = sum;		
	}
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
				normal = 
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
		for ( var ii = 0; ii < indices.length; ++ii ){
			polygon[0][ii] = vertexCoordsList[indices[ii]];
			polygon[1][ii]= [1.0, 1.0, 1.0, 0.0];   // white
		}


		polygon[2] = normal_newell_method(polygon[0]);
		polygon[1][3]= [1.0, 1.0, 1.0, 1.0]   // white
		polygons[i] = polygon;
	}
	// console.log(polygons);
	return polygons;
}