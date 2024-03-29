

function js_arr_of_objects_into_geojson_object(arr) {
  let obj = {
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
  for (var i = 0; i < arr.length; i++) {
    let a = {
      'type':'Feature',
      'id':i,  // added this as part of step 13
      'geometry': {
        'type':'Point',
        'coordinates': [
          arr[i].longitude,
          arr[i].latitude
        ]
      },
      'properties': {
        'rowId': i,
        'city_name':arr[i].city_name,
        'country_name':arr[i].country_name,
        'region':arr[i].region
      }
    }
    // inside the for loop, push the object a into the obj object
    obj.features.push(a);
  }
  return obj;
}