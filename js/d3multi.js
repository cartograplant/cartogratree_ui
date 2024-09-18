/**
 * Coded by Risharde Ramnath
 * Use case: To be able to run different types of D3 code based on the D3 version
 * Since for example, D3 v3 code may not execute on the D3 v5 version of the D3
 * library.
 */

var d3m = {}
var d3m_current_version = "v5"; // default value

// THERE IS AN ISSUE WITH D3M EXECUTE WHERE EVENTS DO NOT GET RELOADED - DO NOT USE.
// d3m_execute will check to see whether a specific version of the D3 library is loaded.
// if it does not find it, it will dynamically download it and run it.
// callback is a function that will be executed after the d3 library is loaded or detected.
function d3m_execute(version, callback = null) {
  if(d3m[version + '_original'] != undefined) {
      // d3 = d3m[version];
      d3 = jQuery.extend(true, {}, d3m[version]);
      console.log('D3MULTI has changed d3 to version ' + version);
      if(callback != null) {
        callback();
      }
  }
  else {
      console.log('D3MULTI could not find this version, please d3multi_load');
      console.log('Current D3 is running as version ' + d3m_current_version);
      d3m_load(version, callback);
  }
}

// d3m_load will dynamically load
function d3m_load(version = "v5", callback = null, callback_args = null, async = true) {
    console.log('D3MULTI - ASYNC MODE is set to ' + async);
    var url = "https://d3js.org/d3." + version + ".min.js";
    console.log('Loading D3 resource:' + url);
    if(async == false) {
      jQuery.ajaxSetup({async:false});
    }
    jQuery.getScript(url, function( data, textStatus, jqxhr ) {
      // console.log( data ); // Data returned
      console.log('D3MULTI [' + version + ' script download response]: ' + textStatus ); // Success
      // console.log( jqxhr.status ); // 200
      // Now that D3 is loaded, copy it into the d3m object
      d3m[version] = jQuery.extend(true, {}, d3);
      d3m[version + '_original'] = jQuery.extend(true, {}, d3); // record an original unaltered object
      // d3m[version]['event'] = d3.event;

      // Perform a test to see if d3 can select an item
      try {
        var body = d3m[version].select('body');
        // console.log(body);
        if(body != undefined) {
            console.log('d3m_load ' + version + ' was successful.');
            if(callback != undefined) {
              if(callback != null) {
                if(callback_args == null) {
                  callback();
                }
                else {
                  var command = "callback(";
                  for(var i=0; i<callback_args.length; i++) {
                    if (i == 0) {
                       
                    }
                    else {
                      command += ",";
                    }
                    command += "callback_args[" + i + "]";
                  }
                  command += ");";
                  eval(command);
                }
              }
            }
        }
      }
      catch (err) {
        console.log(err);
        console.log('d3m_load check failed, could not run the select on body element');
        
      }
      if (async = false) {
        jQuery.ajaxSetup({async:true});
      }
    });
}
