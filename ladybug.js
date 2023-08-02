/* 
	1. global variables + setup
	2. event listeners
	3. function definitions
*/


// this array contains the lat-lon data which will be plotted and is populated either from localStorage or an uploaded csv or remain empty
//var locations = [];

// display the map
mapboxgl.accessToken = 'pk.eyJ1IjoicnRob21hc2lhbiIsImEiOiJjamY5NWt1MWIwZXBxMnFxb3N6NHphdHN3In0.p80Ttn1Zyoaqk-pXjMV8XA';
let map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v9', // other choices: light-v9; dark-v9; streets-v10
  center: [-95.7129, 37.0902], // Hamilton, ON [-79.8711, 43.2557], US [-95.7129, 37.0902]
  zoom: 3
});

//ifLocalStorageContainsDataThenSetLocationsArrayAndAddLayer();

if_localStorage_contains_data_set_data();

// event listeners

document.getElementById('deleteLocalStorageDataButton').addEventListener('click', function() {
	localStorage.earthquakes = '';
	locations = [];
	resetTheDataLayer();
});



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
	//localStorage.earthquakes = fileContentAsCSVString;

	// convert the csv string to an array
	//var arr = convertCSVFileIntoArray(fileContentAsCSVString);

	// convert the array to a geojson object
	//let my_geojson_obj = convertArrayIntoGeoJsonObject(arr);
	
	//resetTheDataLayer();  // if existing data; remove it
	//addMyLayerToTheMap(my_geojson_obj);	// add the new layer (via locations array)
	
  }, false); 

  // 3. use the fileReader object to read the file, and return a string
  reader.readAsText(myFile); 

});



// drag and drop

let container = document.getElementById('modal');

// dragenter event listener
container.addEventListener('dragenter', function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.style.border = '1px solid #ddd';
}, false);

// dragover event listener
container.addEventListener('dragover', function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.style.border = '1px solid #ddd';
}, false);

// dragleave event listener
container.addEventListener('dragleave', function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.style.border = '1px solid #222';
}, false);

// DROP EVENT LISTENER
container.addEventListener('drop', function(e) {
  
  e.stopPropagation();
  e.preventDefault();
  this.style.border = '1px solid #222';  

  /* 1. make a fileReader object */
  let reader = new FileReader();
    
  /* 2. we define what happens when the fileReader is done reading something */
  reader.addEventListener('load', function(e) {
    
    // returns a csv string
    let file_contents_as_text = e.target.result;
    // console.log(file_contents_as_text);  // the uploaded csv file
    
    
    localStorage.ladybug_data = file_contents_as_text;
    
    // returns an array of objects
    let arr = csv_string_to_js_array_of_anon_objects(file_contents_as_text);
    
    // RETURNS A GEOJSON OBJ
    let my_geojson_obj = js_arr_of_objects_into_geojson_object(arr);
    
    reset_the_data_layer();
    add_my_layer_to_the_map(my_geojson_obj);	
    
    
  }, false); 

  /* 3. use the fileReader object to read the file, and return a string */
  reader.readAsText(e.dataTransfer.files[0]); 

 }, false);  // CLOSING DROP EVENT LISTENER
 
 

// function definitions below:

// this function will add a layer [an array of geojson data] to the map
function add_my_layer_to_the_map(my_geojson_obj) {

	map.addLayer({
		id: 'locations',
		type: 'circle',
		source: {
			type: 'geojson',
			data: my_geojson_obj  // the name of the array where the data is coming from
		},
		layout: {
			visibility: 'visible'
		},
		paint: {
			'circle-radius': {
				'base': 4,
				'stops': [[4, 4.25], [12, 14]] // circles get bigger between z3 and z14
			},
			'circle-color':[
        'match',
        ['get', 'city_name'],
        'Hamilton',
        '#4477cc',
        [
         'match',
         ['get', 'region'],
         'AF',
         '#44cc33',
         '#FF6EC7'
        ]
      ],
			'circle-opacity':[
        'match',
        ['get', 'city_name'],
        'Hamilton',
        0.95,
        0.6
      ],
		}
	});
	

	map.addLayer({
		id: 'textLabels',
		type: 'symbol',
		source: {
			type: 'geojson',
			data: my_geojson_obj  // the name of the array where the data is coming from
		},
		layout: {
			//"text-field": ["get", "name1"],
      "text-field": ["format",
        ["get","name1"], {"font-scale":1.0}
        //["get","name2"], {"font-scale":0.6}
      ],
			//"text-variable-anchor": ["top", "bottom", "left", "right"],
			//"text-radial-offset": 0.5,
			//"text-justify": "auto",
			//"icon-image": ["concat", ["get", "icon"], "-15"]
			//"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
			"text-size": 20
		},
		paint: {
			"text-color": "#ffccff"
		}
	});

	// to add text
	/*
	map.addLayer({
		id: 'labels',
		type: 'circle',
		source: {
			type: 'geojson',
			data: locations  // the name of the array where the data is coming from
		},
		layout: {
			visibility: 'visible'
		}
	});
	*/
	//map.setLayoutProperty('locations', 'text-field', 'locations')
	
	/*
	['format',
	['get', 'ar'], { 'font-scale': 1.2 },
	'\n', {},
	['get', 'ar'], {
	'font-scale': 0.8,
	'text-font': ['literal', [ 'DIN Offc Pro Italic', 'Arial Unicode MS Regular' ]]
	}
	]);	
	*/

	
};


// routine to check localStorage for data
function if_localStorage_contains_data_set_data() {
	if (localStorage.ladybug_data) {
		let file_content_as_text = localStorage.ladybug_data;
    let arr = csv_string_to_js_array_of_anon_objects(file_content_as_text);
    let my_geojson_obj = js_arr_of_objects_into_geojson_object(arr);
    console.log(my_geojson_obj);

		map.on('load', function(e) {
      reset_the_data_layer();
      add_my_layer_to_the_map(my_geojson_obj);
		});
	}
}


function reset_the_data_layer() {
  if (map.getSource('locations') && map.getLayer('locations')) {
    map.removeLayer('locations');
    map.removeSource('locations');	 
  }
  if (map.getSource('textLabels') && map.getLayer('textLabels')) {
    map.removeLayer('textLabels');
    map.removeSource('textLabels');	 
  }
}


