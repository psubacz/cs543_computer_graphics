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
var theta = 0;
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

function degToRad(deg){
	return deg*pi/180
}

var cameraAngleRadians = degToRad(0);
var fieldOfViewRadians = degToRad(60);

function main() {
	update_state_output(breathing, 0, 0, 0, 0, 0); // update the status box with current status

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

	set_projection();
	render();

	window.onkeypress = function (event) {
		process_keypress(event.key)
	}
}

function draw_polygons(polygons){
	// For polygon in polygons, extract each point and draw them
	for (var i = 0; i < polygons.length; ++i) {
		for(var ii = 0; ii < 3; ++ii) {
			// set points 
			points.push(polygons[i][0][ii]);
			// for solid colored faces use
			colors.push(polygons[i][1][ii]);
	}}
	//
	set_vector_points();
	set_point_size();
	set_color_points();
	set_projection();
	render();
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
	gl.uniform1f(offsetLoc, 5.0);
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

function set_projection(){
	//This is how we handle extents
	var thisProj = ortho(-2.5, 1.5, -2.5, 1.5, -1.5, 1.5);

	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 10;
	// var thisProj = perspective(fieldOfViewRadians, aspect, zNear, zFar);

	var projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
}

function render() {
	var rotMatrix = rotateX(0);
	var translateMatrix = translate(0, 0, 0);
	var ctMatrix = mult(translateMatrix, rotMatrix);

	theta -= 0.5;
	alpha += 0.005;

	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	var eye = vec3(0.0, 1.0, 2.0);
	var at  = vec3(1.0, 1.0, 1.0);
	var up  = vec3(0.0, 1.0, 0.0);
	var viewMatrix = lookAt(eye, at, up);
	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.LINES, 0, points.length);

	id = requestAnimationFrame(render);

}

function update_state_output(breathing, disp, x, y, z, roll) {
	msg = "";
	msg += " Breathing: " + breathing + '<br>';
	msg += " Normal Disp: " + disp + '<br>';
	msg += " -------------------<br>";
	msg += " X: " + x + '<br>';
	msg += " Y: " + y + '<br>';
	msg += " Z: " + z + '<br>';
	msg += " Roll:" + roll + '<br>';
	document.getElementById("meshState").innerHTML = msg;
}

function process_keypress(theKey) {
	//on key presses, do change the colors or modes
	switch (theKey) {
		case 'X':
		case 'x':
			break;

		case 'C':
		case 'c':
			break;

		case 'Y':
		case 'y':
			break;

		case 'U':
		case 'u':
			break;

		case 'Z':
		case 'z':
			break;

		case 'A':
		case 'a':
			break;

		case 'R':
		case 'r':
			break;


		case 'B':
		case 'b':
			break;

		default:
			var outputMessage = 'No function set for keypress: ' + theKey + '<br>';		//clear the output message
			outputMessage += 'Current keypress actions are: <br>';
			outputMessage += "-- ' X ' or ' x ' Translate your wireframe in the positive x direction. <br>";
			outputMessage += "-- ' C ' or ' c ' Translate your wireframe in the negative x direction.<br>";
			outputMessage += "-- ' y ' or ' y ' Translate your wireframe in the positive y direction.<br>";
			outputMessage += "-- ' U ' or ' u ' Translate your wireframe in the negative y direction.<br>";
			outputMessage += "-- ' Z ' or ' z ' Translate your wireframe in the positive z direction. <br>";
			outputMessage += "-- ' A ' or ' a ' Translate your wireframe in the negative z direction.<br>";
			outputMessage += "-- ' R ' or ' r ' Rotate your wireframe in an X-roll about it's CURRENT position.<br>";
			outputMessage += "-- ' B ' or ' b ' Toggle pulsing meshes. <br>";
			document.getElementById('pageContent').innerHTML = outputMessage;
	}
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
		for (ii=1;ii<4;ii++){
			polygon[0][ii-1] = vertexCoordsList[polygonIndexList[i][ii]]
			polygon[1][ii-1]= [1.0, 1.0, 1.0, 1.0]   // white
		}
		polygon[2] = normal_newell_method(polygon[0]);
		polygons[i] = polygon;
	}
	// console.log(polygons);
	return polygons;
}