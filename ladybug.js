
// make sure when i click a point, it gets added to selected
// and when i click again, it is removed from selected - should be easy

// when it gets added to selected, removeClassFromView('item') and addClassIntoView('selected') very inefficient but it will works
// also, it means that whenever we click on a point, we automatically see the selected ones

var clickToShowSelected = document.getElementById('clickToShowSelected');
var clickToShowAll = document.getElementById('clickToShowAll');
var listings = document.getElementById('listings');
var whatIsBeingListed = document.getElementById('whatIsBeingListed');

function removeClassFromView(x) {
	// a contains all the children nodes
	var a = listings.children;
	for (var i = 0; i < a.length; i++) {
		var c = listings.children[i];
		if (c.classList.contains(x)) { // classList returns an array-like object; cannot use arr.indexOf(i) on it
			c.style.display = 'none';
		}
	}
	//document.getElementById('infoTable').style.display = 'none';
}
// i will need to include these functions

function addClassIntoView(x) {
	// a contains all the children nodes
	var a = listings.children;
	for (var i = 0; i < a.length; i++) {
		var c = listings.children[i];
		if (c.classList.contains(x)) { // classList returns an array-like object; cannot use arr.indexOf(i) on it
			c.style.display = 'block';
		}
	}
	//document.getElementById('infoTable').style.display = 'none';
}

clickToShowSelected.addEventListener('click', function() {
	whatIsBeingListed.textContent = 'Selected points';
	removeClassFromView('item');
	addClassIntoView('selected');
});

clickToShowAll.addEventListener('click', function() {
	whatIsBeingListed.textContent = 'All the points!';
	removeClassFromView('selected');
	addClassIntoView('item');
});

/*
var myButton = document.getElementById('myButton');
myButton.addEventListener('click', function() {
	//console.log(localStorage.earthquakes);
	localStorage.clear();
	document.getElementById('filename').innerHTML = '';
});
*/

/* 1. display the map */

mapboxgl.accessToken = 'pk.eyJ1IjoicnRob21hc2lhbiIsImEiOiJjamY5NWt1MWIwZXBxMnFxb3N6NHphdHN3In0.p80Ttn1Zyoaqk-pXjMV8XA';

// this bit of code will add the map itself to my webpage
// i should only have to run this bit once
var map = new mapboxgl.Map({

  // container id specified in the HTML
  container: 'map',
  
  // style URL
  style: 'mapbox://styles/mapbox/dark-v9', //light-v9; dark-v9; streets-v10
  
  // initial position in [lon, lat] format
  center: [-95.7129, 37.0902], // Hamilton, ON [-79.8711, 43.2557], US [-95.7129, 37.0902]
  
  // initial zoom
  zoom: 3
});

/* 2. define locations array as a global array which will be populated from localstorage or an upload or left blank */

var locations = [];

/* 3. check localStorage for data */

if (localStorage.earthquakes) {
	
	// retrieve the csv data string
	
	var fileContentAsCSVString = localStorage.earthquakes;
	
	// convert to an array
	
	var arr = convertCSVFileIntoArray(fileContentAsCSVString);
	
	/* convert the array to a geojson object */
	
	locations = convertArrayIntoGeoJsonObject(arr);
	
    /* now the locations array is updated with the correct data */
	
	//resetTheDataLayer();
	
	/* naturally, this next function will update the sidebar */
	
	createLocationListInSidebar(locations);

    /* i added an event listener to wait for the map to load in the case that there is localStorage data */	
	
	map.on('load', function(e) {
		// Add the data to your map as a layer
		addMyLayerToTheMap();
		createLocationListInSidebar(locations);
	});
}


/* 4. define the function that takes the data we add and returns the sidebar list */

function createLocationListInSidebar(data) {

  // there was no reason for this to be inside the for loop, i think they just made a slip up. good thing i was here!
  // clear the div of all content so each time we can start fresh
  var listings = document.getElementById('listings');
  listings.innerHTML = '';

  
  // Iterate through the list of stores
  for (i = 0; i < data.features.length; i++) { // makes sense
  
    var currentFeature = data.features[i];
	
    // Shorten data.feature.properties to just `prop` so we're not
    // writing this long form over and over again.
	// good idea
	// this is the subobject that contains the data about the location point
    var prop = currentFeature.properties;
	
    // Select the listing container in the HTML and append a div
    // with the class 'item' for each store
    
	
	// this is an interesting way of writing it
	// it is different than how I would have done it but now i like it
    var listing = listings.appendChild(document.createElement('div'));
    listing.className = 'item';
    listing.id = 'listing-' + i; // this step is probably useful when we start doing the interactions

    // Create a new link with the class 'title' for each store
    // and fill it with the store address
    var link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'title';
    link.dataPosition = i;
    link.innerHTML = prop.address1; /* this bit here is the first time we used any of the properties from the prop object */

	var details1 = listing.appendChild(document.createElement('div'));
	details1.innerHTML = prop.city + ', ' + prop.state;
	
	// naturally we do the same here
    // Create a new div with the class 'details' for each store
    // and fill it with the city and phone number
    var details2 = listing.appendChild(document.createElement('div'));
    details2.innerHTML = prop.rowId + ': ' + prop.ar;
    if (prop.order) {
      details2.innerHTML += ' &middot; ' + prop.order;
    }
	
	
	/* this is part of section 13 of my code */
	
	// Add an event listener for the links in the sidebar listing
	link.addEventListener('click', function(e) {
	  // Update the currentFeature to the store associated with the clicked link
	  var clickedListing = data.features[this.dataPosition];
	  // 1. Fly to the point associated with the clicked link
	  flyToStore(clickedListing);
	  // 2. Close all other popups and display popup for clicked store
	  createPopUp(clickedListing);
	  // 3. Highlight listing in sidebar (and remove highlight for all other listings)
	  var activeItem = document.getElementsByClassName('active');
	  if (activeItem[0]) {
		activeItem[0].classList.remove('active');
	  }
	  this.parentNode.classList.add('active');
	});
	
	
  }
}

/* 5. added function which accepts a csv string and returns an array */

function convertCSVFileIntoArray(CSVString) {

  // convert CSV string to an array of strings
  var data = CSVString.split(/\n/);
  data.splice(data.length-1, 1);
  // now the data array contains as many elements as we have rows in our data
  // data[0] will contain headers

  var totalEntities = 0;
  
  var entities = [];
  
  var numberOfRows = data.length;
  
  var numberOfRowsWithout18Elements = 0;
  for (var i = 0; i < data.length; i++) {
    // x is a single row of data but in array format
    var x = data[i].split(/,/);
	data[i] = x;
    totalEntities += x.length;
	entities.push(x.length);
    if (x.length !== 18) { // i want to know all the rows that do not have 18 elements (the only acceptable one is the last one)
	  numberOfRowsWithout18Elements++;
      console.log(x);
    }
  }
  //console.log(entities);
  console.log('number of rows without 18 elements: ' + numberOfRowsWithout18Elements);
  
  console.log('number of elements: ' + totalEntities);
  console.log('number of rows: ' + numberOfRows);

  var elementsPerRow = totalEntities/numberOfRows;
  
  // now that i have the avg, i can find the variance
  
  //var n  = numberOfRows;
  var ss = 0;
  for (var i = 0; i < entities; i++) {
	ss += Math.sq(entities[i] - elementsPerRow);
  }
  
  console.log('Each row must have 18 elements, so I am taking the mean and the variance of the number of elements per row. So this means the mean has to be 18, and the variance has to be 0. I am using the sum of squares instead since it shows the same thing');
  console.log('mean: ' + elementsPerRow);
  console.log('ss: ' + ss);
  
  return data;
}

/* 6. convert array into geojson object */

function convertArrayIntoGeoJsonObject(arr) {
  var obj = {
    'type': 'FeatureCollection',
    'features': []
  };
 
	/* 
	 it looks like a geojson file has 2 main objects
	 1. type
	 2. features, which is an array containing anonymous objects (each is a location) each with 3 sub-objects
		 1. type
		 2. geometry
		 3. properties
	*/

  // start iterating from 1 bc data[0] is a header row
  for (var i = 1; i < arr.length; i++) {
    var a = {
			'type': 'Feature',
			'id': i-1,  // added this as part of step 13
      'geometry': {
        'type': 'Point',
        'coordinates': [
	      arr[i][17],
	      arr[i][16]
	    ]
      },
			'properties': {
			'rowId': i-1,
			'ar': arr[i][0],
			'name': arr[i][1],
			'order': arr[i][2],
			'orderDate': arr[i][3],
			'displays': arr[i][4],
			'cases': arr[i][5],
			'totalPieces': arr[i][6],
			'netWeight': arr[i][7],
			'grossWeight': arr[i][8],
			'relativeCube': arr[i][9],
			'address1': arr[i][10],
			'address2': arr[i][11],
			'city': arr[i][12],
			'state': arr[i][13],
			'postal': arr[i][14],
			'country': arr[i][15]
      }
    }
  
  // inside the for loop, push the object a into the obj object
  obj.features.push(a);
  }
  return obj;
}

/* 7. this fn will add the layer */

function addMyLayerToTheMap() {

    // this is the first layer
	map.addLayer({
		id: 'locations',
		type: 'circle', //Required enum. One of "fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "background".
		// Add a GeoJSON source containing place coordinates and information.
		source: {
		  type: 'geojson',
		  data: locations
		},
		layout: {
			visibility: 'visible'
		  //'icon-image': 'cat', restaurant-15
		  //'icon-allow-overlap': true,
		},
		paint: {
			'circle-radius': {
                'base': 4,
                'stops': [[4, 4.25], [12, 14]] // circles get bigger between z3 and z14
            },
			'circle-color': '#FF6EC7',
			'circle-opacity': 0.6// interesting choice: '#D49A66'
		}
	});
	
	// this is the highlight layer
	map.addLayer({
		id: 'highlights',
		type: 'circle', //Required enum. One of "fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "background".
		// Add a GeoJSON source containing place coordinates and information.
		source: {
		  type: 'geojson',
		  data: locations
		},
		layout: {
			visibility: 'visible'
		  //'icon-image': 'cat', restaurant-15
		  //'icon-allow-overlap': true,
		},
		paint: {
			'circle-radius': {
                'base': 7,
                'stops': [[3, 7.25], [12, 24]] // circles get bigger between z3 and z14
            },
			'circle-color': 'rgb(255, 175, 0)', // interesting choice: '#D49A66'
			"circle-opacity": ["case",
                ["boolean", ["feature-state", "click"], false],
                1,
                0
            ]
		}
	});
	

	
};

/* 17 added selectedArray as a global variable */

var selectedArray = [];
var infoBoxArray = [];

/* 13 adding click interactivity to the points on the map */

// When the user moves their mouse over the state-fill layer, we'll update the feature state for the feature under the mouse.
map.on("click", "highlights", function(e) {

    var hoveredStateId = null;

    // e.features.length is the array of all the points clicked on
	if (e.features.length > 0) {
		
		for (var i = 0; i < e.features.length; i++) {
			hoveredStateId = e.features[i].id;
			
			console.log(hoveredStateId);
			
			e.features[i].timeClicked = Date.now();
			
			
			
			//console.log(e.features[i]);
			
			// grab the element and add a class
			var element = document.getElementById('listing-' + hoveredStateId);
			
			
			// this works well! it lets me check the state of the feature
			var x = map.getFeatureState({source: 'highlights', id: hoveredStateId});
			console.log(x);
			
			/* 19 cleaned up add and remove from selectedArray */
			
			// if i use e.features[i].id it works nicely
			// but e.features[i] gives me errors, i think i know why, its because some elements are different; see true/false!!!
			
			/* i hear 'BE CAREFUL WITH OBJECT EQUALITY' */
			
			var a = e.features[i];
			
			if (x.click == true) {
			
				map.setFeatureState({source: 'highlights', id: hoveredStateId}, { click: false});
				element.classList.remove('selected');
				removeClassFromView('item');
				addClassIntoView('selected');
							
				
				/***** you cannot directly compare 2 arrays or objects *****/
				// plus, the timestamps are different so that means the object/array is different
				// that rules out a simple arr.indexOf(a) type search
				
				var id = e.features[i].id; // this is the id of the row i want to delete
				
				/* 20 -- i will search thru selectedArray's elements for the one that contains this id, and delete it
				
				/* 20 this worked! */
				
				for (var k = 0; k < selectedArray.length; k++) {
				  if (e.features[i].id == selectedArray[k].id) {
				    selectedArray.splice(k, 1);
				  }
				}
				
				// this next line wont work! 2018-10-23-2323 -Raffi
				//selectedArray.splice(selectedArray.indexOf(a), 1);
				
				
			} else {
				map.setFeatureState({source: 'highlights', id: hoveredStateId}, { click: true});
				element.classList.add('selected');
				removeClassFromView('item');
				addClassIntoView('selected');
				
				/* 18 pushing features into selectedArray based on hoveredStateId */
				
				selectedArray.push(a);
				
				
			}
							
		}
	}
	
	



	/* 22 this will store the data in an array that will be very easy for export to a csv */
	/* 2018-10-24-2204 */
	
	var whatToInclude = [
		['id'],
		['timeClicked'],
		['properties', 'ar'],
		['properties', 'name'],
		['properties', 'order'],
		['properties', 'orderDate'],
		['properties', 'displays'],
		['properties', 'cases'],
		['properties', 'totalPieces'],
		['properties', 'netWeight'],
		['properties', 'grossWeight'],
		['properties', 'relativeCube'],
		['properties', 'address1'],
		['properties', 'address2'],
		['properties', 'city'],
		['properties', 'state'],
		['properties', 'postal']
	];
	
	infoBoxArray = [];
	var row = [];
	for (var i = 0; i < whatToInclude.length; i++) { 
	 row.push(whatToInclude[i][whatToInclude[i].length-1]);
	}
	infoBoxArray.push(row);
	
	for (var i = 0; i < selectedArray.length; i++) {
	  var x = selectedArray[i];
	  var row = [];
	 
	 for (var j = 0; j < whatToInclude.length; j++) {
		if (whatToInclude[j].length == 1) {
			var a = x[whatToInclude[j][0]];
		} else if (whatToInclude[j].length == 2) {
			var a = x[whatToInclude[j][0]][whatToInclude[j][1]];
		}
		row.push(a);
	 }
	 
	  infoBoxArray.push(row);
	}
	
	
	infoBoxArray.sort(function(a, b) {
		return a[1] - b[1];
	});
	
	console.log(infoBoxArray);
	
	
	/* 24 i need to recalc the table here too */

	recalculateInfoTable();
	
	
});
	

/* 8. this function will reset the layer */

function resetTheDataLayer() {

	/*
	  we need to clean the layer before we can replace the data:
	    1. remove the layer from the map
		2. remove the source from the layer
		*note that the layer still exists
	*/
	
	// but i only have to do this IFF there is a layer to begin with, if there is none, then this will return an error
	/*
	try {
		map.removeLayer('locations');
		map.removeSource('locations');
	}
	catch (err) {
		// do nothing
	}
	*/
	
	/* 2018-10-20-1819: check if the layer exists before trying to remove it */
	
	if (map.getSource('locations') && map.getLayer('locations')) {
		map.removeLayer('locations');
		map.removeSource('locations');	 
	}
	
	if (map.getSource('highlights') && map.getLayer('highlights')) {
		map.removeLayer('highlights');
		map.removeSource('highlights');	 
	}
	
	/* now we can reconstruct the layer with the new data and add it to the map in the same function */
	/* this function is taking place outside any map-related events */
	
	addMyLayerToTheMap();

}

/* 9. upload function captures the csv string and executes all the fns */

var input = document.getElementById('myInput');
input.addEventListener('change', function(e) {
  //console.log(e);
  
  var myFile = e.target.files[0];
  console.log(myFile);
    
  document.getElementById('filename').textContent = myFile.name;

  /* 1. make a fileReader object */
  var reader = new FileReader();

  /* 2. we define what happens when the fileReader is done reading something */
  reader.addEventListener('load', function(e) {
  
	/* grab the contents of the csv file as a string */
  
    var fileContentAsCSVString = e.target.result; // e.target.result is fine bc that terminology is unique to the load event
	
	/* 2018-10-20-1737: now that i have the csv string, i can save it to localStorage */
	
	localStorage.earthquakes = fileContentAsCSVString;
	
	/* convert the csv string to an array */
	
    var arr = convertCSVFileIntoArray(fileContentAsCSVString);
	
	/* convert the array to a geojson object */
	
	locations = convertArrayIntoGeoJsonObject(arr);
	
    /* now the locations array is updated with the correct data */
	
	resetTheDataLayer();
	
	/* naturally, this next function will update the sidebar */
	
	createLocationListInSidebar(locations);
	
	
	/* this is how i would add an image in place of forks or dots

map.loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Cat_silhouette.svg/400px-Cat_silhouette.svg.png', function(error, image) {
        if (error) throw error;
        map.addImage('cat', image);
		});
	*/
	
  }, false); 

  /* 3. use the fileReader object to read the file, and return a string */
  reader.readAsText(myFile); 

});

/* 13  - part of this the link event listener lives in section 4 */

// geojson objects have 2 main objects: type and features; features has 3 objects: type, features, properties
function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 5
  });
}

function createPopUp(currentFeature) {
  var popUps = document.getElementsByClassName('mapboxgl-popup');
  
  // Check if there is already a popup on the map and if so, remove it
  /* makes sense if mapboxgl-popup is a class name as we expect only 1 to be active at a time */
  // then if it exists when we create a new popup, we destroy the old one
  
  if (popUps[0]) {
    popUps[0].remove();
  }
  
  // This will let you use the .remove() function later on
  if (!('remove' in Element.prototype)) {
    Element.prototype.remove = function() {
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
  }
  
  // exciting notation!
  var popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML('<h3>' + currentFeature.properties.name + '</h3>' +
      '<h4>' + currentFeature.properties.address1 + '</h4>')
    .addTo(map);
}

/* 21 adding a download function */

var downloadListingsAsCSV = document.getElementById('downloadListingsAsCSV');
downloadListingsAsCSV.addEventListener('click', function() {
 var delimiter = ',';
 var newLineCharacter = '\n';
 var x = '';
 
 for (var i = 0; i < infoBoxArray.length; i++) {
	for (j = 0; j < infoBoxArray[i].length; j++) {
		var element = infoBoxArray[i][j];
		x += element + delimiter
	}
	x += newLineCharacter;
 }

 
 var a = document.createElement('a');
 a.href = 'data:,' + encodeURI(x);
 a.target = '_blank';
 a.download = 'gudetamaTheLazyEgg.csv'; // gudetama is the lazy egg
 a.click();
 a.remove();

});


/* 24 populate infoTable function */

function recalculateInfoTable() {
	var cols = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15];
	var x = document.getElementById('infoTable');
	x.innerHTML = '';
	x.style.display = 'block';
	
	var table = document.createElement('table');
	x.appendChild(table);
	
	for (var i = 0; i < infoBoxArray.length; i++) {
	 var row = document.createElement('tr');
	 for (var j = 0; j < infoBoxArray[i].length; j++) {
		if (cols.indexOf(j) != -1) {
			var el = document.createElement('td');
			el.textContent = infoBoxArray[i][j];
			row.appendChild(el);
		}
	 }
	 table.appendChild(row);
	}
}

/* 25 added an unclick button */

var unclickAllPoints = document.getElementById('unclickAllPoints');
unclickAllPoints.addEventListener('click', function() {
	var a = document.getElementsByClassName('selected');
	for (var i = a.length-1; i >= 0; i--) {
		a[i].classList.remove('selected');
	}
	addClassIntoView('item');
	for (var i = 0; i < locations.features.length; i++) {
		map.setFeatureState({source: 'highlights', id: i}, { click: false});
	}
	selectedArray = [];
	infoBoxArray = [];
	recalculateInfoTable();
});

/* 26 click to resize infoTable */



window.onload = function() {
	
	var infoTable = document.getElementById('infoTable');
	var sidebar = document.getElementById('sidebar');
	
	var mouseIsDown = false;
	//console.log(mouseIsDown);
	var dy = 0;
	var y1 = 0;
	var y2 = 0;

	var h = 300;

	infoTable.addEventListener('mousedown', function(e) {
		mouseIsDown = true;
		//console.log(e.screenY);
		y1 = e.screenY;
	});
	infoTable.addEventListener('mouseup', function() {
		mouseIsDown = false;
		//console.log(mouseIsDown);
	});
	infoTable.addEventListener('mouseleave', function() {
		mouseIsDown = false;
		//console.log(mouseIsDown);
	});
	infoTable.addEventListener('mousemove', function(e) {
		if (mouseIsDown) {
			//console.log(e.screenY);
			y2 = e.screenY;
			dy = -(y2 - y1);
			dy = parseInt(dy);
			console.log(dy);
			y1 = y2;
			h = h + dy;
			console.log('h: ' + h + 'px');
			
			this.style.height = h + 'px';
			sidebar.style.bottom = h + 'px';
			
		}
	});

};