/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 * 
 * @author Joshua Cuneo
 * @author Peter Subacz
 */


function display_file_data()
{
	//displays file name and size of image to be displayed.
	var uploadedFile = document.getElementById("image-file");
	var outputMessage = "";		//clear the output message
	var file = uploadedFile.files[0]; // sinse we are only working with one file, get the first element
	if ('name' in file) {
		outputMessage += "name: " + file.name + "<br>"; //display the file name
	}
	if ('size' in file) {
		outputMessage += "size: " + file.size + " bytes <br>"; //display the size of the file
	}
	document.getElementById("pageContent").innerHTML = outputMessage;	//display output to message
}

function parse_text_file(rawText){
	/*
		Parser used to get 2D vector points. the parser goes splits the file by 
		new lines and then bywhite spaces. if an item in a line is not empty, the 
		item is cast as a float and stored in a vec4. If the 0th and 1st positions 
		of the vec4 are set, the vec4 is added to a ploygon list. If there is a 
		break in the lines, a new list of points in started.

		returns list
	*/
	var extent = null
	var dataType = '';			// data inside file, can be float of int
	var vectors = [];			// list to hold vectors
	var vector = [];			// list of dump vector points 
	var creatingVertex = false;	// bool to create vertices
	var totalVertex = 0;		// total number of vertices
	var vertexPoints = 0;		// number of points in a vertex
	var vectorIndex = 0;		// index to count number of vectors
	var vectorsIndex = 0;		// indexes to count vectors in list
	var lines = rawText.split(/\r?\n/g);			//split the string by new lines
	for(i=0;i<lines.length;i++){					//for line in lines
		var point = vec4(0.0, 0.0, 0.0, 1.0);		//  points to be written too
		var index = 0;								//  indexes points written
		var lineArray = lines[i].split(/(\s+)/);	//  split the string by spaces
		for(ii=0;ii<lineArray.length;ii++){			//  for each item in the line, cast to float 
			if (lineArray[ii].length>0){			//		if the item exists
				var floatCast = parseFloat(lineArray[ii])	//cast string to float
				if (!isNaN(floatCast))				// 			if not NaN, set as point
				{
					point[index] = floatCast;		// set point to float value
					index++							//	increment the counter
		}}}
	
		if(index>0){								//if values have been set
			if(index == 4){							// four values set mean its a extent (homogeneous unit will not change in this app)
				var extent = point;					// set the extents
			}else if (index<4){					 
				if (totalVertex == 0){				// set total number of vertices
					totalVertex = point[0];
				}else if (vertexPoints == 0 && creatingVertex == false){	// being creating a vertex
					creatingVertex = true;
					vertexPoints = point[0];
				}else if (creatingVertex = true){			//while creating a vertes, set the points
					if (vectorIndex < vertexPoints){
						vector[vectorIndex] = point;
						vectorIndex++;
						if (dataType==''){		//set the data type
							if (point[0]>1){
								dataType='int';
							}else{
								dataType='flt';
							}}
						if (vectorIndex >= vertexPoints){	//if we have looped throught the points in a vertex, reset the creation values
							creatingVertex = false;
							vertexPoints = 0;
							vectors[vectorsIndex] = vector;
							vector=[];
							vectorsIndex++;
							vectorIndex = 0;
			}}}}else{
				console.log("Warning, line "+i+" has more than 4 items.");// do nothing, log line to console 
	}}}
	return [vectors,dataType,extent];
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
				colors.push(vec4(0.0, 0.0, 0.0, 1.0)); //black
				break;
			case 1:
				colors.push(vec4(1.0, 0.0, 0.0, 1.0)); //red
				break;
			case 2:
				colors.push(vec4(0.0, 1.0, 0.0, 1.0)); //green
				break;
   			case 3:
				colors.push(vec4(0.0, 0.0, 1.0, 1.0)); //blue
				break;
		default:
			colors.push(vec4(0.0, 0.0, 0.0, 1.0)); //black
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

function set_projection(gl,extents)
{
	/*
		set the matrix projection, extent and aspect ratio to view image
	*/
	var canvas = document.getElementById('webgl');	//get the canvas in the webpage
	gl.viewport( 0, 0,  canvas.width, canvas.height);//set the viewport into the virtual world
	if (extents != null){	//if a extent is given, use that 
		var projMatrix = ortho(extents[0],extents[2],extents[3],extents[1],-1,1);	
	}else{	//if not, assume a target width &hieght and scale the image to the aspect ratio
		var targetWidth = 640;
		var targetHieght = 480;
		var viewAspectRatio = canvas.width/canvas.height;
		var targetAspectRatio =targetWidth /targetHieght; 
		if (viewAspectRatio>=targetAspectRatio){
			var projMatrix = ortho(0,targetAspectRatio*targetWidth,0,targetHieght,-1,1);
		}else{
			var projMatrix = ortho(0,targetWidth,0,targetAspectRatio*targetHieght,-1,1);
		}
	}
	var projMatrixLoc = gl.getUniformLocation(program, "projMatrix"); //grab the location is memory
	gl.uniformMatrix4fv(projMatrixLoc,false,flatten(projMatrix));	//construct the uniform matrix
}

function render(gl,vectorList,vectorType,extent,colorIndex){
	/*
		Render the array of array of points to a screen, 
		if there is a single point, draw it as points,
		if there are mulitple points, draw a lines.
	*/
	if (vectorList.length ==0){
		//there are no points to draw, do nothing
		}else{//if the are points to draw
		reset_canvas(gl);				//reset the canvas when called
		set_projection(gl,extent);		//set the orthographic projection for 2d data
		var offsetLoc = gl.getUniformLocation(program, "vPointSize");		//set the draw point size
		gl.uniform1f(offsetLoc, 3.0);		// for vector in vectors, draw and color each vector point
		for(i=0;i<vectorList.length;i++){	// for each array in arries
			set_vector_points(gl,vectorList[i],vectorType);//set the vectors to be drawns
			set_colors(gl,vectorList[i],colorIndex);//set the colors to be painted
			if (vectorList[i].length<=1){ // if there is only one point to draw as a point
				gl.drawArrays(gl.POINTS, 0, vectorList[i].length);
			}else{	//else draw as a line strip
				gl.drawArrays(gl.LINE_STRIP, 0, vectorList[i].length)
			}}}
	return vectorList;
}

function file_mode(){
	// displays html items for the file mode
	document.getElementById("pageMode").innerHTML = 'Mode: File';	//Display the mode
	document.getElementById('image-file').style.display = 'block';	//Display the button
	document.getElementById('pageContent').innerHTML = 'Upload a file to draw!';
	return 0;
}

function draw_mode()
{
	// displays html items for the draw mode
	document.getElementById("pageMode").innerHTML = 'Mode: Draw';	//Display the mode
	document.getElementById('image-file').style.display = "none"	//hid the button
	document.getElementById('pageContent').innerHTML = 'Click inside the box to draw!';
	return 1;
}

function shear_array(list0, list1, index){
	//shear the array and start a new subarray
	list0.push(list1);
	index++;
	list0[index] = [];
	return [list0,list1,index];
}

function main(gl,drawPoints) 
{
	// Initialize the document mode and settings
	var colorIndex = 0;
	var pageMode = file_mode();
	var colorList = ["Color: Black", "Color: Red", "Color: Green", "Color: Blue"];
	var currentColor = colorList[colorIndex];
	var vectorList = [];
	var dataType = '';
	var extent = null;		//draw mode points
	var drawIndex = 0;

	// display the current color
	document.getElementById('colorMode').innerHTML = currentColor;

	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	var gl = WebGLUtils.setupWebGL(canvas);

	// Add the event listener to parse input file
	document.getElementById('image-file').addEventListener('change', function() {
		var fileReader = new FileReader();
		fileReader.onload= function (e){
			// resultsList = parse_text_file(fileReader.result);
			[vectorList,dataType,extent] = parse_text_file(fileReader.result);
			console.log('Jobs Done')
			// var vectorsReady = true;
			vectorList= render(gl,vectorList,dataType,extent,colorIndex,false)
		}
		fileReader.readAsText(this.files[0]);
	}) 

	// add event listener for draw mode
	canvas.addEventListener("click", function() {
		if (pageMode ==1)
		{
			var rect = canvas.getBoundingClientRect();//get bounding box of the canvas
			var xPos = 1-((arguments[0].clientX - rect.left)/canvas.width); //cast the x coordinate into webgl coordinate
			var yPos = 1-((arguments[0].clientY - rect.top)/canvas.height); //cast the y coordinate into webgl coordinate
			extent = vec4(1,1,0,0)	//set the default extent
			vectorList[drawIndex].push(vec4(xPos, yPos,0.0,1.0)); // add the point to a array
			if (vectorList[drawIndex].length>99){ // if the array is bigger that 100 points, start a new array
				[vectorList, drawPoints, drawIndex] = shear_array(vectorList, drawPoints, drawIndex);
			}
			render(gl,vectorList,'flt',extent,colorIndex); // render points to a screen
		}})

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

	//on key presses, do change the colors or modes
	window.onkeypress = function(event)
	{
		var key = event.key;
		switch(key)
		{
		case 'A':
		case 'a':
			//Note that calling an event automatically clears the canvas. This has to do with how
			//WebGL manages the memory buffer. See the following URLs for more information on this:
			//https://stackoverflow.com/questions/9491417/when-webgl-decide-to-update-the-display
			//https://stackoverflow.com/questions/35493509/webgl-draw-in-event-handler-seems-to-clear-the-canvas
			//https://stackoverflow.com/questions/9843492/webgl-drawing-failure-after-mouse-click
			gl.drawArrays(gl.TRIANGLES, 0, points.length);
			// window.alert('Key pressed is ' + key);
			break;
		case 'F':
		case 'f':
			//file mode
			vectorList = [];
			pageMode = file_mode();
			break;
		case 'D':
		case 'd':
			//draw mode
			vectorList = [[]];
			pageMode = draw_mode();
			break;
		case 'C':
		case 'c':
			//changes color by indexing +1
			colorIndex++;
			if (colorIndex >= colorList.length)
			{
				colorIndex = 0;
			}
			document.getElementById("colorMode").innerHTML = colorList[colorIndex];
			break;
		case 'B':
		case 'b':
			[vectorList, drawPoints, drawIndex] = shear_array(vectorList, drawPoints, drawIndex);
			break;
		case 'Q':
		case 'q':
			reset_canvas(gl)
			vectorList = [];
			pageMode = file_mode();
			// if (pageMode==0){
				
			// }else{
			// 	pageMode = draw_mode();
			// }
			break;
		default:
			var outputMessage = 'No function set for keypress: '+key+'<br>';		//clear the output message
			outputMessage += 'Current actions are: <br>';
			outputMessage += "- 'F' or 'f' changes the progam mode to: File.<br>";
			outputMessage += "- 'D' or 'd' changes the progam mode to: Draw.<br>";
			outputMessage += "- 'C' or 'c' changes the color of items drawn to the screen.<br>";
			outputMessage += "- 'B or 'b' breaks the the starts a new array of points to be drawn (draw mode only).<br>";
			outputMessage += "- 'Q' or 'q' resets the page mode and clears the canvas<br>";
			document.getElementById('pageContent').innerHTML = outputMessage;
		}
	render(gl,vectorList,dataType,extent,colorIndex)
	}
}
