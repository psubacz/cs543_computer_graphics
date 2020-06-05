/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Joshua Cuneo
 * @author Peter Subacz
 */

function init(){
	//display the file upload button
	document.getElementById('image-file').style.display = 'block';
	//display the current mode the user is in.
	document.getElementById('pageMode').innerHTML = 'File Mode';
	//display the default color being displayed mode 
	document.getElementById('colorMode').innerHTML = 'Color: Black'
}

function parse_text_file(rawText){
	/*
		quick and dirty parser used to get polygons from text file
		make a list of new points

		returns list
	*/
	var polygons = [];
	var polygonsIndex = 0;
	var polygon = [];
	var polygonIndex = 0;
	var lines = rawText.split(/\r?\n/g);
	var floatCast = 0.0;
	var index = 0;

	for(i=0;i<lines.length;i++){
		var point = vec4(0.0, 0.0, 0.0, 1.0);
		var lineArray = lines[i].split(/(\s+)/);
		for(ii=0;ii<lineArray.length;ii++){
			if (lineArray[ii].length>2){
				floatCast = parseFloat(lineArray[ii])
				if (!isNaN(floatCast))
				{
					point[index] = floatCast
					index++
				}
			}
		}
		if (index>0){
			polygon[polygonIndex] = point;
			polygonIndex++;
			index = 0;
		}else{
			if (polygon.length>0){
				polygons[polygonsIndex] = polygon
				polygon=[];
				polygonsIndex++;
				polygonIndex = 0;
			}
		}
	}
	return polygons;
}

async function draw_mode()
{
	document.getElementById("pageMode").innerHTML = 'Draw Mode';	//Display the mode
	document.getElementById('image-file').style.display = 'none';	//Display the button
	// await ;
}

 function file_mode(gl,polygonList)
{
	if (polygonList == null){
		document.getElementById("fileContent").innerHTML = 'Upload a file to draw.';

	}else{
		// Set clear color
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		// Clear <canvas> by clearing the color buffer
		gl.clear(gl.COLOR_BUFFER_BIT);
		console.log(polygonList.size)
		for(i=1;i<polygonList.length;i++){
			var vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(polygonList[i]), gl.STATIC_DRAW);

			var vPosition = gl.getAttribLocation(program, "vPosition");
			gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vPosition);

			var offsetLoc = gl.getUniformLocation(program, "vPointSize");
			gl.uniform1f(offsetLoc, 1.0);

			/*** COLOR DATA ***/
			var colors = [];
			for(ii=1;ii<polygonList[i].length+1;ii++){
				colors.push(vec4(0.0, 0.0, 0.0, 1.0));
			}

			var cBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

			var vColor = gl.getAttribLocation(program, "vColor");
			gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vColor);
			
			// Draw a point
			gl.drawArrays(gl.LINES, 0, polygonList[i].length);
		}
	}
}

function change_color(colorIndex,colorList)
{
	if (colorIndex >= colorList.length)
	{
		colorIndex = 0;
	}
	document.getElementById("colorMode").innerHTML = colorList[colorIndex];
	console.log(colorIndex);
	colorIndex++;
	return colorIndex;
}

async function upload_image() 
{
	// Async ingest and parse a 
	// logic src: https://www.w3schools.com/jsref/prop_fileupload_files.asp
	var x = document.getElementById("image-file");
	var outputMessage = "";
	if ('files' in x) {
		if (x.files.length == 0) {
		  outputMessage = "Select one or more files.";
		} else {
		  	for (var i = 0; i < x.files.length; i++) {
				// for file in files
				outputMessage += "<br><strong>" + (i+1) + ". file</strong><br>"; //display file index (if multiple files)
				var file = x.files[i];
				if ('name' in file) {
				  outputMessage += "name: " + file.name + "<br>";
			}
			if ('size' in file) {
			  outputMessage += "size: " + file.size + " bytes <br>";
			}
		}
	}
	} 
	  else {
		if (x.value == "") {
		//   outputMessage += "Select one or more files.";
		} else {
		//   outputMessage += "The files property is not supported by your browser!";
		//   outputMessage  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead. 
		}}

	//display output to message
	document.getElementById("fileContent").innerHTML = outputMessage; 
	// console.log(outputMessage);
}

function main() 
{
	var colorList = ["Color: Black",
		"Color: Red", 
		"Color: Green",
		"Color: Blue"];
	var colorIndex = 0;
	   
	// Initialize the document mode and settings
	init();

	var polygonsList = [];
	// Add the event listener to parse input file
	document.getElementById('image-file').addEventListener('change', function() {
		var fr = new FileReader();
		fr.onload= function (e){
			polygonsList = parse_text_file(fr.result);
			console.log('Jobs Done')
			// var polygonsReady = true;
			file_mode(gl,polygonsList)
		}
		fr.readAsText(this.files[0]);
	}) 

	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = WebGLUtils.setupWebGL(canvas);
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

	//start off in filemode
	file_mode(gl,null);

	window.onkeypress = function(event)
	{
		var key = event.key;
		switch(key)
		{
		case 'a':
			//Note that calling an event automatically clears the canvas. This has to do with how
			//WebGL manages the memory buffer. See the following URLs for more information on this:
			//https://stackoverflow.com/questions/9491417/when-webgl-decide-to-update-the-display
			//https://stackoverflow.com/questions/35493509/webgl-draw-in-event-handler-seems-to-clear-the-canvas
			//https://stackoverflow.com/questions/9843492/webgl-drawing-failure-after-mouse-click
			gl.drawArrays(gl.TRIANGLES, 0, points.length);
			// window.alert('Key pressed is ' + key);
			break;

		case 'f':
			//file mode
			document.getElementById("pageMode").innerHTML = 'File Mode';	//Display the mode
			document.getElementById('image-file').style.display = 'block';	//Display the button
			break;

		case 'd':
			//draw mode
			draw_mode()
			break;

		case 'c':
			//changes color by indexing +1
			colorIndex = change_color(colorIndex,colorList);
		}
	}
}
