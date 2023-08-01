
function csv_string_to_js_array_of_anon_objects(csv_string) {
  
  var data = csv_string.split(/\n/);
  let rows = [];
  
  // toLowerCase()
  // toUpperCase()
  
  for (let i = 0; i < data.length; i++) {
    let row = data[i].split(/,/);
    rows.push(row);
  }
  
  
  let row_headers = [];
  for (let x = 0; x < rows[0].length; x++) {
    row_headers[x] = rows[0][x].toLowerCase();
  }
  
  let arr = [];
  for (let i = 1; i < rows.length; i++) {
    let obj = {};
    
    for (let x = 0; x < rows[0].length; x++) {
      obj[row_headers[x]] = rows[i][x];
    }
    arr.push(obj);
  }
  return arr;
}