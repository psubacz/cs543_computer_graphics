/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Joshua Cuneo
 * @author Peter Subacz
 */

function parse_text_file(rawText){
	/*
		quick and dirty parser used to get 2D vector points. the parser goes
		line and splits the file by new lines and then bywhite spaces. if 
		an item in a line is not empty, the item is cast as a float and 
		stored in a vec4. If the 0th and 1st positions of the vec4 are set, 
		the vec4 is added to a ploygon list. If there is a break in the lines, 
		i 
		item is then cast to covectors from text file
		make a list of new points

		returns list
	*/
	var floatCast = 0.0;//
	var dataType = '';
	var vectors = [];	// list to hold vectors
	var vector = [];	// list of dump vector points 
	var index = 0;			//indexes points written
	var vectorIndex = 0;	//index to count number of vectors
	var vectorsIndex = 0;	//indexes to count vectors in list
	var lines = rawText.split(/\r?\n/g);
	var point = vec4(0.0, 0.0, 0.0, 1.0);
	var firstRun = true;
	var extent = vec4(0.0, 0.0, 0.0, 1.0);

	for(i=0;i<lines.length;i++){
		point = vec4(0.0, 0.0, 0.0, 1.0);
		index = 0;

		var lineArray = lines[i].split(/(\s+)/);
		for(ii=0;ii<lineArray.length;ii++){
			if (lineArray[ii].length>0){
				floatCast = parseFloat(lineArray[ii])
				if (!isNaN(floatCast))
				{
					point[index] = floatCast;
					index++
				}}}
		if (point[0]!=0.0 && point[1]!=0.0){
			if (firstRun == true){
				firstRun = false;
				extent = point;
			}
			vector[vectorIndex] = point;
			vectorIndex++;
			if (dataType==''){
				if (point[0]>1){
					dataType='int';
				}else{
					dataType='flt';
				}}
		}else{
			if (vector.length>0){
				vectors[vectorsIndex] = vector;
				vector=[];
				vectorsIndex++;
				vectorIndex = 0;
			}}

		}
	return [vectors,dataType,extent];
}

function draw_mode()
{
	document.getElementById("pageMode").innerHTML = 'Draw Mode';	//Display the mode
	document.getElementById('image-file').style.display = 'none';	//Display the button
	// await ;
}

function reset_canvas(gl){
		// Set clear color
		gl.clearColor(1.0, 1.0, 1.0, 1.0);
		// Clear <canvas> by clearing the color buffer
		gl.clear(gl.COLOR_BUFFER_BIT);
}

function set_colors(gl,vectorList,colorIndex){
	/*** COLOR DATA ***/
	var colors = [];
	for(ii=1;ii<vectorList.length+1;ii++){
		switch (colorIndex){
			case 0:
				colors.push(vec4(0.0, 0.0, 0.0, 1.0));
				break;
			case 1:
				colors.push(vec4(1.0, 0.0, 0.0, 1.0));
				break;
			case 2:
				colors.push(vec4(0.0, 1.0, 0.0, 1.0));
				break;
   			case 3:
				colors.push(vec4(0.0, 0.0, 1.0, 1.0));
				break;
		default:
			colors.push(vec4(0.0, 0.0, 0.0, 1.0));
		}
	}

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);
}

function set_vector_points(gl,vectorList,vectorType){
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vectorList), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
}

function set_viewports(gl,extents)
{
	// If the aspect ratio is less than 1, calculate the width
	// If the aspect ratio is greator than 1, calculate the 
	// If the aspect ration is 1, do nothing?
	// w	 w
	// -  = -
	// h 	 h

	//Set up the viewport
	//x, y - specify the lower-left corner of the viewport rectangle (in pixels)
	//In WebGL, x and y are specified in the <canvas> coordinate system
	//width, height - specify the width and height of the viewport (in pixels)
	//canvas is the window, and viewport is the viewing area within that window
	//This tells WebGL the -1 +1 clip space maps to 0 <-> gl.canvas.width for x and 0 <-> gl.canvas.height for y
	
	//order of extents being passed left, top, right, bottom.
	//left,right,bottom,top,near,far
	console.log(extents[0][0]);
	var projMatrix = ortho(extents[0],extents[2],extents[3],extents[1],-1,1);			 
	var projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
	gl.uniformMatrix4fv(projMatrixLoc,false,flatten(projMatrix));
	// gl.viewport( 0, 0, canvas.width, canvas.height);
}

function sum_(vector){
	var vectorSum =0.0;
	for(i=0; i<vector.length;i++){
		vectorSum = vectorSum+vector[i];
	}
	return vectorSum;
}
function file_mode(gl,vectorList,vectorType,extent,colorIndex){
	var vectorSum = 0.0;
	if (vectorList == null){
		document.getElementById('pageMode').innerHTML = 'File Mode';
	}else{
		// var extent = vectorList[0][0]
		vectorSum = sum_(extent);
		if (vectorSum>0.0 || vectorSum<0.0){
			// set_viewports(gl,vectorList[0]);
			set_viewports(gl,extent);
		}
		// 
		reset_canvas(gl);
		var offsetLoc = gl.getUniformLocation(program, "vPointSize");
		gl.uniform1f(offsetLoc, 1.0);
		// start at the 2nd index becuase 0 = canvas
		for(i=1;i<vectorList.length;i++){
			//set the vectors to be drawn
			set_vector_points(gl,vectorList[i],vectorType);
			//set the colors to be painted
			set_colors(gl,vectorList[i],colorIndex);
			// Draw a point
			gl.drawArrays(gl.LINES, 0, vectorList[i].length);
		}}}

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
	var colorIndex = 0;
	var colorList = ["Color: Black", "Color: Red", "Color: Green", "Color: Blue"];
	var currentColor = colorList[colorIndex];
	var resultsList = [];

	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = WebGLUtils.setupWebGL(canvas);

	// Initialize the document mode and settings
	//display the file upload button
	document.getElementById('image-file').style.display = 'block';
	//display the current mode the user is in.
	document.getElementById('pageMode').innerHTML = 'File Mode';
	//display the default color being displayed mode 
	document.getElementById('colorMode').innerHTML = currentColor
	// Add the event listener to parse input file
	document.getElementById('image-file').addEventListener('change', function() {
		var fr = new FileReader();
		fr.onload= function (e){
			resultsList = parse_text_file(fr.result);
			console.log('Jobs Done')
			// var vectorsReady = true;
			file_mode(gl,resultsList[0],resultsList[1],resultsList[2],colorIndex)
		}
		fr.readAsText(this.files[0]);
	}) 


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
	gl.viewport( 0, 0, canvas.width, canvas.height);

	//start off in filemode
	file_mode(gl,null,null,null,null);

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
			colorIndex++;
			if (colorIndex >= colorList.length)
			{
				colorIndex = 0;
			}
			document.getElementById("colorMode").innerHTML = colorList[colorIndex];
			file_mode(gl,resultsList[0],resultsList[1],resultsList[2],colorIndex)
		}
	}
}
