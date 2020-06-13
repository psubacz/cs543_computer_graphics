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
function display_file_metadata(numberVertices,numberPolygons){
	/*
		This function displays metadata parsed from the a textfile at the end.
		 this infomation is displayed belwo the broswe button. The infomation 
		 shown in the file name, file size, number of vertices, and number of 
		 polygones in the file. 

		Returns null
	*/

	var uploadedFile = document.getElementById("ply-file");
	var outputMessage = "";		//clear the output message
	var file = uploadedFile.files[0]; // sinse we are only working with one file, get the first element
	if ('name' in file) {
		outputMessage += "File name: " + file.name + "<br>"; //display the file name
	}
	if ('size' in file) {
		outputMessage += "File size: " + file.size + " bytes <br>"; //display the size of the file
	}
	if (fileType != null){
		outputMessage += "Number of Vertices: " + file.size + " bytes <br>";
		outputMessage += "File size: " + file.size + " bytes <br>";
	}else{

	}
	document.getElementById("pageContent").innerHTML = outputMessage;	//display output to mess
}

function parse_ply_file(rawFile){
	/*
		ply
		format ascii 1.0
		element vertex 8
		property float32 x
		property float32 y
		property float32 z
		element face 12
		property list uint8 int32 vertex_indices
		end_header
	*/

	


	display_file_metadata(numberVertices,numberPolygons);
	return [];
}

var vertexList = []

function main() 
{
	// Add the event listener to parse input file
	document.getElementById('ply-file').addEventListener('change', function() {
		var fileReader = new FileReader();
		fileReader.onload= function (e){
			vertexList = parse_ply_file(fileReader.result);
			// [vectorList,dataType,extent] = parse_text_file(fileReader.result);
			console.log('Jobs Done')
			// var vectorsReady = true;
			// vectorList= render(gl,vectorList,dataType,extent,colorIndex,false)
		}
		fileReader.readAsText(this.files[0]);
	}) 

	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl) 
	{
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
	gl.viewport( 0, 0, canvas.width, canvas.height );
	
	/**********************************
	* Points, Lines, and Fill
	**********************************/
	
	/*** VERTEX DATA ***/
	//Define the positions of our points
	//Note how points are in a range from 0 to 1
	points = [];
	colors = [];

	quad( 1, 0, 3, 2 );
	quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );


	//Create the buffer object
	var vBuffer = gl.createBuffer();

	//Bind the buffer object to a target
	//The target tells WebGL what type of data the buffer object contains, 
	//allowing it to deal with the contents correctly
	//gl.ARRAY_BUFFER - specifies that the buffer object contains vertex data
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

	//Allocate storage and write data to the buffer
	//Write the data specified by the second parameter into the buffer object
	//bound to the first parameter
	//We use flatten because the data must be a single array of ints, uints, or floats (float32 or float64)
	//This is a typed array, and we can't use push() or pop() with it
	//
	//The last parameter specifies a hint about how the program is going to use the data
	//stored in the buffer object. This hint helps WebGL optimize performance but will not stop your
	//program from working if you get it wrong.
	//STATIC_DRAW - buffer object data will be specified once and used many times to draw shapes
	//DYNAMIC_DRAW - buffer object data will be specified repeatedly and used many times to draw shapes
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	//Get the location of the shader's vPosition attribute in the GPU's memory
	var vPosition = gl.getAttribLocation(program, "vPosition");

	//Specifies how shader should pull the data
	//A hidden part of gl.vertexAttribPointer is that it binds the current ARRAY_BUFFER to the attribute.
	//In other words now this attribute is bound to vColor. That means we're free to bind something else
	//to the ARRAY_BUFFER bind point. The attribute will continue to use vPosition.
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

	//Turns the attribute on
	gl.enableVertexAttribArray(vPosition);

	//Specify the vertex size
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 10.0);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	//This is how we handle extents
	//var thisProj = ortho(-5, 5, -5, 5, .1, 100);

	var fovy = 30;
	var thisProj = perspective(fovy, 1, .1, 100);

	var projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));

	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	gl.enable(gl.DEPTH_TEST);

	//Necessary for animation
	render();

}

var id;

function render() {
	var rotMatrix = rotateX(0);
	var translateMatrix = translate(0, 0, 0);
	var ctMatrix = mult(translateMatrix, rotMatrix);

	theta -= 0.5;
	alpha += 0.005;

	var eye = vec3(-4.0, -1.0, 9.0);
	var at = vec3(1.0, 1.0, -1.0);
	var up = vec3(0.0, 1.0, 0.0);

	var viewMatrix = lookAt(eye, at, up);


	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	var viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, points.length);

	id = requestAnimationFrame(render);

}

function quad(a, b, c, d)
{
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

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);

    }
}