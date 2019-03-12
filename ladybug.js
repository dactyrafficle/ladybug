/* 
	1. global variables + setup
	2. event listeners
	3. function definitions
*/


// this array contains the lat-lon data which will be plotted and is populated either from localStorage or an uploaded csv or remain empty
var locations = [];

// display the map
mapboxgl.accessToken = 'pk.eyJ1IjoicnRob21hc2lhbiIsImEiOiJjamY5NWt1MWIwZXBxMnFxb3N6NHphdHN3In0.p80Ttn1Zyoaqk-pXjMV8XA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v9', // other choices: light-v9; dark-v9; streets-v10
  center: [-95.7129, 37.0902], // Hamilton, ON [-79.8711, 43.2557], US [-95.7129, 37.0902]
  zoom: 3
});

ifLocalStorageContainsDataThenSetLocationsArrayAndAddLayer();

// event listeners

document.getElementById('deleteLocalStorageDataButton').addEventListener('click', function() {
	localStorage.earthquakes = '';
	locations = [];
	resetTheDataLayer();
});

var modal = document.getElementById('modal');
document.getElementById('hamburger-container').addEventListener('click', function() {
	if (modal.style.display === 'block') {
		modal.style.display = 'none';
	} else {
		modal.style.display = 'block';
	}
});

var input = document.getElementById('myInput');
input.addEventListener('change', function(e) {
  
  var myFile = e.target.files[0];
	
  // 1. make a fileReader object
  var reader = new FileReader();

  // 2. we define what happens when the fileReader is done reading something
  reader.addEventListener('load', function(e) {
  
	// grab the contents of the csv file as a string
	var fileContentAsCSVString = e.target.result; // e.target.result is fine bc that terminology is unique to the load event

	// save in localStorage
	localStorage.earthquakes = fileContentAsCSVString;

	// convert the csv string to an array
	var arr = convertCSVFileIntoArray(fileContentAsCSVString);

	// convert the array to a geojson object
	locations = convertArrayIntoGeoJsonObject(arr);
	
	resetTheDataLayer();  // if existing data; remove it
	addMyLayerToTheMap();	// add the new layer (via locations array)
	
  }, false); 

  // 3. use the fileReader object to read the file, and return a string
  reader.readAsText(myFile); 

});


// function definitions below:

// this function will add a layer [an array of geojson data] to the map
function addMyLayerToTheMap() {
	map.addLayer({
		id: 'locations',
		type: 'circle',
		source: {
			type: 'geojson',
			data: locations  // the name of the array where the data is coming from
		},
		layout: {
			visibility: 'visible'
		},
		paint: {
			'circle-radius': {
				'base': 4,
				'stops': [[4, 4.25], [12, 14]] // circles get bigger between z3 and z14
			},
			'circle-color': '#FF6EC7',
			'circle-opacity': 0.6
		}
	});
};

// routine to check localStorage for data
function ifLocalStorageContainsDataThenSetLocationsArrayAndAddLayer() {
	if (localStorage.earthquakes) {
		var fileContentAsCSVString = localStorage.earthquakes;
		var arr = convertCSVFileIntoArray(fileContentAsCSVString);
		locations = convertArrayIntoGeoJsonObject(arr);
		map.on('load', function(e) {
			addMyLayerToTheMap();
		});
	}
}

// routine to convert a csv file into an array
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
		if (x.length !== 18) { // spleen
			numberOfRowsWithout18Elements++;
			console.log(x);
		}
	}
	// spleen code
  console.log('number of rows without 18 elements: ' + numberOfRowsWithout18Elements);
  console.log('number of elements: ' + totalEntities);
  console.log('number of rows: ' + numberOfRows);

  var elementsPerRow = totalEntities/numberOfRows;
  
  var ss = 0;
  for (var i = 0; i < entities; i++) {
		ss += Math.sq(entities[i] - elementsPerRow);
  }
  console.log('mean: ' + elementsPerRow);
  console.log('ss: ' + ss);
  
  return data;
}

// convert array into geojson object
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
	console.log('convertArrayIntoGeoJsonObject');
  // start iterating from 1 bc data[0] is a header row
  for (var i = 1; i < arr.length; i++) {
    var a = {
			'type': 'Feature',
			'id': i-1,  // added this as part of step 13
      'geometry': {
        'type': 'Point',
        'coordinates': [
					arr[i][1],
					arr[i][0]
				]
      },
			'properties': {
			'rowId': i-1,
			'ar': arr[i][2],
			'name': arr[i][3],
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
			'state': arr[i][13]
      }
    }
  
  // inside the for loop, push the object a into the obj object
  obj.features.push(a);
  }
  return obj;
}

function resetTheDataLayer() {
	if (map.getSource('locations') && map.getLayer('locations')) {
		map.removeLayer('locations');
		map.removeSource('locations');	 
	}
	if (map.getSource('highlights') && map.getLayer('highlights')) {
		map.removeLayer('highlights');
		map.removeSource('highlights');	 
	}
}


