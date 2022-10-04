

	/**************************************************
 
	* CT API WEBSOCKET IMPLEMENTATION                 *
 	
	**************************************************/
	
	//var LZUTF8 = require('lzutf8');  TODO - DEPRECATED
	/* These variables are used by websocket functions to pull data from CT API Websocket Server subsection */
	
	var trees_by_source_id_cache_object = {};
	var trees_by_source_id_in_progress = false;

	var trees_by_source_id_array_json_objects = []; //This is the new version which is an array in which there will be sub json objects per dynamic dataset layer
	var trees_by_source_id_array_json_objects_count = 0; //This keeps a current of the current interation of loading data - done during a retrieval by source_id at this point

	var trees_by_source_id_total_tree_count = 0; // POSSIBLY TO BE DEPRECATED
	var trees_by_source_id_tree_count = 0;
	var trees_by_source_id_timer;//This is the timer that does the elapsed time feature - TODO - NEED TO RENAME AT SOME POINT
	var trees_by_source_id_size = 0;
	var trees_by_source_id_timer_seconds = 0;//This is the timer seconds count (elapsed_time) - TODO - NEED TO RENAME AT SOME POINT
	var ctapiwss_conn = new WebSocket("wss://treegenesdb.org/ctapiwss/", "protocolOne");
	
	
	//Open websocket connection
	ctapiwss_conn.onopen = socket_onopen;
	function socket_onopen(event) {
		console.log('CTAPIWSS OPEN');
		ctapiwss_conn.send('hello');
	}
	
	//On websocket received message (from CT API server)
	ctapiwss_conn.onmessage = socket_onmessage;	
	function socket_onmessage(event) {
		var msg = event.data.toString();
		console.log(msg);
		
		if(msg.startsWith('environmental_data_csv_line::')) {
			var msg_parts = msg.split('::');
			analysis_envdata_csv_data += msg_parts[1] + "\n";
			analysis_envdata_current_progress_tree_count++;

			//Update progressbar
			var aes_progressbar = $("#analysis-envdata-section-progressbar");
			aes_progressbar.progressbar({ value: ((analysis_envdata_current_progress_tree_count / analysis_envdata_current_progress_tree_total) * 100) });
			var aes_progressbar_description = $("#analysis-envdata-section-progressbar-description");
			aes_progressbar_description.html("Received tree data for " + analysis_envdata_current_progress_tree_count + " of " + analysis_envdata_current_progress_tree_total + " trees");			

			if(analysis_envdata_current_progress_tree_count == analysis_envdata_current_progress_tree_total) {
				var item_html = "<button id='download_analysis_envdata_csv_data_button' class='btn btn-primary'>Download ENVDATA</button>";
				$('#download_analysis_envdata_csv_data_button_container').html(item_html);				
			}

		}
		else if (msg.startsWith('snps_to_missing_freq_single_tree::')) {
			var msg_parts = msg.split('::');
			if(msg_parts.length > 1) {
				var snp_response_object = JSON.parse(msg_parts[1]);
				var tree_id = snp_response_object.tree_acc;
				generate_snps_to_missing_freq_objects_array.push(snp_response_object); // init in map.js
				generate_snps_to_missing_freq_objects_current = generate_snps_to_missing_freq_objects_current + 1; // init in map.js

				// The following progressbar and status is initialized in the map.js
				$('#analysis-filter-snp-progressbar-status').html(generate_snps_to_missing_freq_objects_current + "/" + generate_snps_to_missing_freq_objects_total + " tree SNP data received.");
				var afs_progressbar = $("#analysis-filter-snp-progressbar");
				afs_progressbar.progressbar({ value: (generate_snps_to_missing_freq_objects_current / generate_snps_to_missing_freq_objects_total) * 100});


				if(generate_snps_to_missing_freq_objects_current == generate_snps_to_missing_freq_objects_total) {
					var data = ct_ready_mapjs.generate_snps_to_missing_freq_data(); // this function is within map.js and returns data
					console.log(data);
					console.log("Attempting to rendering the Analysis chart on the first tab of Analysis modal / popup");
					ct_ready_mapjs.renderChart(data, true); // this function is within map.js
				}
			}
		}
		else if(msg.startsWith('trees_by_source_id_total_tree_count_start:')) { //This message tells UI to reset total_tree_count
			var msg_parts = msg.split(':');
			console.log(msg_parts);
			trees_by_source_id_total_tree_count = 0; //reset to 0 count
			
			//$('#background-num-trees').html("" + count + "");
		}		
		else if(msg.startsWith('trees_by_source_id_total_tree_count:')) { //This message tells UI to set the total tree count for a load (if applicable)
			var msg_parts = msg.split(':');
			console.log(msg_parts);
			trees_by_source_id_total_tree_count = msg_parts[2]; //set value
		}			
		else if(msg.startsWith('trees_by_source_id_start:')) { //This message tells UI to initialize some settings before import data comes in
			/*
			if (trees_by_source_id_cache_object["source_id_" + source_id] == undefined || trees_by_source_id_cache_object["source_id_" + source_id] == null) {
				trees_by_source_id_cache_object["source_id_" + source_id] = []; //this creates an array to hold the layered json objects
			}
			*/
			var msg_parts = msg.split(':');
			var source_id = msg_parts[1];
			trees_by_source_id_cache_object["source_id_" + source_id] = [];// initialize an empty array
			
			trees_by_source_id_in_progress = true;
			trees_by_source_id_timer_seconds = 0;
			trees_by_source_id_size = 0;
			trees_by_source_id_timer = setInterval(function() {
				trees_by_source_id_timer_seconds = trees_by_source_id_timer_seconds + 1;
				$('#trees-by-source-id-import-time-elapsed-text').html(trees_by_source_id_timer_seconds + ' secs');
			}, 1000);
			trees_by_source_id_tree_count = 0; // reset to 0 count

			var msg_parts = msg.split(':');
			if ($('#trees-by-source-id-import-status').hasClass('hidden') == true) {
				$('#trees-by-source-id-import-status').removeClass('hidden');
				$('#trees-by-source-id-import-time-status').removeClass('hidden');
				$('#trees-by-source-id-import-datasize-status').removeClass('hidden');
			}
			//$('#background-num-trees').html("" + count + "");
		}		
		else if(msg.startsWith('tbsiit:')) { //This message tells UI to that a new individual tree has been received so process it
			
			var msg_parts = msg.split('::'); //we need :: because json already has lots of single : and so we cannot use the single : to split parts
			//console.log(msg_parts);
			var source_id = msg_parts[1];
			var source_name = '';
			if(source_id == 3) {
				source_name = 'BIEN';
			}
			var count = msg_parts[2];
			var json_text = msg_parts[3];
			
			trees_by_source_id_size = trees_by_source_id_size + json_text.length; //byte count
			
			//Recreate the proper format
			json_text = json_text.replace('ex1', '{"t1":"F1","p1":{"id":"');
			json_text = json_text.replace('ex2', '","it1":0},"g1":{"t1":"p1","c1":[');
			json_text = json_text.replace('t1','type');
			json_text = json_text.replace('F1','Feature');
			json_text = json_text.replace('p1','properties');
			json_text = json_text.replace('it1','icon_type');
			json_text = json_text.replace('g1','geometry');
			json_text = json_text.replace('p2','point');
			json_text = json_text.replace('c1','coordinates');
			
			//trees_by_source_id_size = trees_by_source_id_size + json_text.length; //byte count

			
			//This clause divides data per million of records to create a json object which will then be stored in the array trees_by_source_id_array_json_objects
			if(trees_by_source_id_tree_count % 1000000 == 0) {
				if(trees_by_source_id_tree_count == 0) {
					//if this is the start, tree count would be zero
					//trees_by_source_id_array_json_objects.push([]); //create first empty json object
					//trees_by_source_id_array_json_objects_count = 0; //objects_count is 0 (which is standard first array index - so technically 1st object)
				
					
					trees_by_source_id_cache_object["source_id_" + source_id].push([]);//create next empty json object
					var index = trees_by_source_id_cache_object["source_id_" + source_id].length - 1;
					console.log('Index:' + index);
				}
				else {
					//Update UI
					//addDynamicDatasetLayer(trees_by_source_id_array_json_objects[trees_by_source_id_array_json_objects_count], trees_by_source_id_array_json_objects_count); // this means it finished getting 1 million trees so create a dynamic layer
					//initMapSummary(trees_by_source_id_tree_count); //update the map summary
					
					
					//trees_by_source_id_array_json_objects.push([]); //create next empty json object
					//trees_by_source_id_array_json_objects_count = trees_by_source_id_array_json_objects_count + 1; //increment the objects count


					//Update UI
					var index = trees_by_source_id_cache_object["source_id_" + source_id].length - 1;
					console.log('Index:' + index);
					try {
						console.log(source_id);
						addDynamicDatasetLayer(trees_by_source_id_cache_object["source_id_" + source_id][index], 'source_id_' + source_id + '_' + index); // this means it finished getting 1 million trees so create a dynamic layer
					}
					catch(err) {
						console.log(err);
					}
					initMapSummary(trees_by_source_id_tree_count); //update the map summary					
					trees_by_source_id_cache_object["source_id_" + source_id].push([]);//create next empty json object
					console.log('New index:' + (trees_by_source_id_cache_object["source_id_" + source_id].length - 1));
				}
			}
			
			//This happens every time a new tree is received from CT API, we add it to the current json object within the array
			//trees_by_source_id_array_json_objects[trees_by_source_id_array_json_objects_count].push(JSON.parse(json_text));
			

			var add_tree = true;
			
			/*
			if(trees_by_source_id_tree_count > -1) {
				var temp_arr = JSON.parse(json_text);
				//console.log('DEBUG SEA CHECK:');
				//console.log(temp_arr);
				try {
					
					var lat = temp_arr.geometry.coordinates[1];
					var lon = temp_arr.geometry.coordinates[0];
					var wms_url = 'https://tgwebdev.cam.uchc.edu/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=ct:wc2_0_30s_prec_01&LAYERS=ct:wc2_0_30s_prec_01&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&STYLES=&BBOX=' + (lat - 0.1) + '%2C' + (lon - 0.1) + '%2C' + (lat + 0.1) + '%2C' + (lon + 0.1);
					if(trees_by_source_id_tree_count < 10) {
						console.log(wms_url);
					}
					//console.log(wms_url);
					$.ajax({
						url: wms_url,
						type: 'GET',
						async: true,
						cache: false,
						timeout: 3500,
						error: function(){
							console.log('Error retrieving sea data query');
						},
						success: function(data){
							//console.log(data);
							if(code_method == 2) {
								var add_tree = true;
							}
							
							var precip_val = 0;
							try {
								precip_val = data.features[0].properties.Precipitation;
							}
							catch(err) {
								console.log(err);
								precip_val = 0; //ignore it being false since we couldn't retrieve any precip data... failsafe
							}
							
							if(precip_val < 0) {
								add_tree = false;
								console.log('Found a tree with a false coordinate:');
								console.log(data);
							}

							if(code_method == 2) {
								if(add_tree == true) {
									//This happens every time a new tree is received from CT API, we add it to the current json object within the array
									trees_by_source_id_cache_object["source_id_" + source_id][trees_by_source_id_cache_object["source_id_" + source_id].length - 1].push(JSON.parse(json_text));			
									
									//This updates the UI elements based on...
									if(trees_by_source_id_tree_count % 2500 == 0) { //per 2500 tree count
										$('#trees-by-source-id-import-status-text').html(trees_by_source_id_tree_count); //this updates the count
										$('#trees-by-source-id-import-datasize-text').html(trees_by_source_id_size);
									}
									if(trees_by_source_id_tree_count % 50000 == 0) { //per 50000 tree count
										if(trees_by_source_id_total_tree_count == 0) {
											toastr.info(source_name + ' import is still in progress. (' + trees_by_source_id_tree_count + ' trees)');
										}
										else {
											toastr.info(source_name + ' import is still in progress. (' + trees_by_source_id_tree_count + ' / ' + trees_by_source_id_total_tree_count + ' trees)');
										}
									}

									//trees_by_source_id_tree_count = trees_by_source_id_tree_count + 1; // increment count
								}	
							}
						}
					});
					
				}
				catch(err) {
					console.log(err);
				}
			}
			*/

			

			if(add_tree == true) {
				//This happens every time a new tree is received from CT API, we add it to the current json object within the array
				trees_by_source_id_cache_object["source_id_" + source_id][trees_by_source_id_cache_object["source_id_" + source_id].length - 1].push(JSON.parse(json_text));			
				
				//This updates the UI elements based on...
				if(trees_by_source_id_tree_count % 2500 == 0) { //per 2500 tree count
					$('#trees-by-source-id-import-status-text').html(trees_by_source_id_tree_count); //this updates the count
					$('#trees-by-source-id-import-datasize-text').html(trees_by_source_id_size);
				}
				if(trees_by_source_id_tree_count % 50000 == 0) { //per 50000 tree count
					if(trees_by_source_id_total_tree_count == 0) {
						toastr.info(source_name + ' import is still in progress. (' + trees_by_source_id_tree_count + ' trees)');
					}
					else {
						toastr.info(source_name + ' import is still in progress. (' + trees_by_source_id_tree_count + ' / ' + trees_by_source_id_total_tree_count + ' trees)');
					}
				}

				trees_by_source_id_tree_count = trees_by_source_id_tree_count + 1; // increment count
			}		
			
			
			//console.log('Add plant:' + add_tree);


		}
		else if(msg.startsWith('trees_by_source_id_stop:')) { //This message tells UI that the data load has been completed.
			clearInterval(trees_by_source_id_timer);
						
			var msg_parts = msg.split(':');
			var source_id = msg_parts[1];
			//Make sure if it the rows didn't reach a remaining 1 million, to add the remaining trees as well to a dynamic layer
			//addDynamicDatasetLayer(trees_by_source_id_array_json_objects[trees_by_source_id_array_json_objects_count], trees_by_source_id_array_json_objects_count);
			var index = trees_by_source_id_cache_object["source_id_" + source_id].length - 1;
			addDynamicDatasetLayer(trees_by_source_id_cache_object["source_id_" + source_id][index], 'source_id_' + source_id + '_' + index); // this means it finished getting 1 million trees so create a dynamic layer
			
			trees_by_source_id_timer_seconds = 0; //reset time seconds
			trees_by_source_id_size = 0; //reset size
			
			var msg_parts = msg.split(':');
			console.log('FINISHED trees_by_source_id load.');
			$('#trees-by-source-id-import-status-text').html(trees_by_source_id_tree_count + " of " + trees_by_source_id_tree_count); //this updates the count
			
			//Make it appear on the map
			var source_id = msg_parts[1];
			var source_name = '';
			if(source_id == 3) {
				source_name = 'BIEN';
			}			
			toastr.info(source_name + ' import is processing. This could take some extra seconds if its thousands of trees, thank you for your patience!');
			//console.log(data);

			
			
			//UI updates
			initMapSummary(trees_by_source_id_tree_count);
			filterNotification(trees_by_source_id_tree_count);
			
			//This hides the loading information UI elements like time elapsed, data size, status etc.
			if ($('#trees-by-source-id-import-status').hasClass('hidden') == false) {
				$('#trees-by-source-id-import-status').addClass('hidden');
				$('#trees-by-source-id-import-time-status').addClass('hidden');
				$('#trees-by-source-id-import-datasize-status').addClass('hidden');
			}			

		}
		
	}
	
	//On close
	ctapiwss_conn.onclose = socket_onclose;	
	function socket_onclose(event) {
		console.log('CTAPIWSS CLOSED');
	}
