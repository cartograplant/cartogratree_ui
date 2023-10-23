var ct_ready_map_click_events = function() {
	/**************************************************

	* ONCLICK EVENTS *

	**************************************************/
    // https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js


	// var html2canvas_loaded = false;

	// jQuery.loadAsync = function(url, callback) {
	// 	// Don't use $.getScript since it disables caching
	// 	jQuery.ajax({
	// 		'url': url,
	// 		'dataType': 'script',
	// 		'cache': true,
	// 		'success': callback || jQuery.noop
	// 	});
	// };

	// function saveAs(uri, filename) {
    //     var link = document.createElement('a');
    //     if (typeof link.download === 'string') {
    //       link.href = uri;
    //       link.download = filename;

    //       //Firefox requires the link to be in the body
    //       document.body.appendChild(link);

    //       //simulate click
    //       link.click();

    //       //remove the link when done
    //       document.body.removeChild(link);
    //     } else {
    //       window.open(uri);
    //     }
    // }	
	// $('#link_take_screenshot').on("click", function() {
	// 	const screenshotTarget = document.body;
	// 	if (confirm('Taking a screenshot can temporarily freeze your browser, should we proceed?')) {
	// 		// Save it!
	// 		if(html2canvas_loaded == false) {
	// 			$.loadAsync('https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js', function() {
	// 				html2canvas_loaded = true;
	// 				setTimeout(function() {
	// 					html2canvas(screenshotTarget).then((canvas) => {
	// 						const base64image = canvas.toDataURL("image/png");
	// 						//console.log(base64image);
	// 						saveAs(base64image, 'canvas.png');
	// 						// window.location.href = base64image;
	// 					});
	// 				}, 500);
	
				
	// 			});
	// 		}
	// 		else {
	// 			setTimeout(function() {
	// 				html2canvas(screenshotTarget).then((canvas) => {
	// 					const base64image = canvas.toDataURL("image/png");
	// 					//console.log(base64image);
	// 					saveAs(base64image, 'canvas.png');
	// 					// window.location.href = base64image;
	// 				});
	// 			},500);
						
	// 		}
	// 	} else {
	// 		// Do nothing!
	// 		console.log('Screenshot processing cancelled');
	// 	}


	// });

	$('#btn-find-unique-species').on("click", function() {
		console.log(mapState.includedTrees);
		$('#modal-unique-species .modal-status').html('');
		$('#modal-unique-species .modal-table').html('');
		var tree_counter = 0;
		var unique_species = {};
		if(mapState.includedTrees.length == 0) {
			$('#modal-unique-species .modal-status').html('You must select some trees in order to determine unique species information.');
			$('#modal-unique-species ').modal();
			return;
		}
		$('#modal-unique-species .modal-status').html('<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> ' + ' Analyzing selected trees... ' + tree_counter + ' of ' + mapState.includedTrees.length + ' (' + Math.ceil((tree_counter/mapState.includedTrees.length) * 100) +   '%). This could take a while depending on how many trees you selected.');
		for (var i=0; i<mapState.includedTrees.length; i++) {
			var tree_id = mapState.includedTrees[i];
			$.ajax({
				url: Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_id=" + tree_id,
				dataType: "json",
				async: true,
				success: function (data) {
					console.log(data);
					tree_counter = tree_counter + 1;
					console.log("unique_species[data.species]", unique_species[data.species]);
					if(unique_species[data.species] == undefined) {
						unique_species[data.species] = true;
					}

					$('#modal-unique-species .modal-status').html('<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> ' + ' Analyzing selected trees... ' + tree_counter + ' of ' + mapState.includedTrees.length + ' (' + Math.ceil((tree_counter/mapState.includedTrees.length) * 100) +   '%). This could take a while depending on how many trees you selected.');
					var unique_species_list = Object.keys(unique_species).sort();
					var table_html = "";
					table_html += '<tr><td style="padding-top: 10px; font-weight: bold;">Unique Species (' + unique_species_list.length + ')</td></tr>';
					for(var j=0; j < unique_species_list.length; j++) {
						table_html += '<tr><td><i class="fas fa-seedling"></i> '  + unique_species_list[j] + '</td></tr>';
					}
					$('#modal-unique-species .modal-table').html(table_html);
					if(tree_counter == mapState.includedTrees.length) {
						$('#modal-unique-species .modal-status').html("Successfully processed. There are " + unique_species_list.length + " unique species from the trees/region you selected.");
					}
				},
				error: function (xhr, textStatus, errorThrown) {
					tree_counter = tree_counter + 1;
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			});			
		}
		$('#modal-unique-species ').modal();
	});

	$("#view-saved-session").on("click", function () {
		$("#saved-session-list").empty();
		$.ajax({
			method: "GET",
			url: Drupal.settings.ct_nodejs_api + "/v2/user/session/by-user/all?api_key=" + Drupal.settings.ct_api + "&user_id=" + Drupal.settings.user.user_id,
			dataType: "json",
			success: function (data) {
				if(cartograplant.debug) {
					console.log('Session data for this logged in user:');
					console.log(data);
				}
				Drupal.settings.user["sessions"] = data;
				cartograplant.renderUserSessions(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(cartograplant.debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(eval("(" + xhr.responseText + ")"));
				}
			}
		});
		$("#saved-session").modal("toggle");
	});

	$(document).on("click", ".delete-saved-session", function () {
		var title = $(this).parent().prev().find("h4.session-title").text();
		if(cartograplant.debug) {
			console.log(title);
			console.log($(this)[0].id);
		}
		if ($(this)[0].id == Drupal.settings.session.session_id) {
			alert("You can't delete the currently loaded session");
			return;
		}

		if (confirm("Are you sure you want to permanently remove '" + title + "'?")) {
			$(this).parent().prev().remove();
			$(this).next().remove();
			$(this).remove();
			$.ajax({
				method: "GET",
				url: Drupal.settings.ct_nodejs_api + "/v2/user/session/delete?api_key=" + Drupal.settings.ct_api + "&user_id=" + Drupal.settings.user.user_id + "&session_id=" + $(this)[0].id,
				success: function (data) {
					if ($("#saved-session-list").children().length == 0) {
						$("#load-old-session").prop("disabled", true);
					}
				},
				error: function (xhr, textStatus, errorThrown) {
					if(cartograplant.debug) {
						console.log({
							textStatus
						});
						console.log({
							errorThrown
						});
						console.log(eval("(" + xhr.responseText + ")"));
					}
				}
			});
		}
	});
    
	$(document).on("click", ".share-saved-session", function () {
		var session_id = $(this).parent().children(":first")[0].id;
		//alert("Link: " + getSessionUrl()); //This pulls the current session which is technically wrong for this function
		var sessionUrl = Drupal.settings.base_url + Drupal.settings.basePath +  "cartogratree" + '?session_id=' + session_id;
		alert("Link: " + sessionUrl); 
	}); 
    
    
	$('#select-num-trees').on("click", function() {
		var active = $(this).hasClass("active");
		if(!active) {
			$(this).text('UNSEL ALL');
			//Add to selected
			mapState.includedTrees = cartograplant.currently_filtered_trees;
			cartograplant.update_overlay_selected_trees();
			$(this).toggleClass("active");
			
		}
		else {
			$(this).text('SEL ALL');
			//Remove selected
			mapState.includedTrees = [];
			cartograplant.update_overlay_selected_trees();
			$(this).toggleClass("active");
			
		}
	}); 

	$("#add-all-trees").on("click", function () {
		$(this).toggleClass("active");
		var isActive = $(this).hasClass("active");

		if (!isActive) {
			mapState.includedTrees = mapState.includedTrees.diff(cartograplant.clickedTrees);
			for (var i = 0; i < cartograplant.clickedTrees.length; i++) {
				cartograplant.activeTrees[cartograplant.clickedTrees[i]] = false;
			}
			$(".add-tree").removeClass("active");
		}
		else {
			mapState.includedTrees = cartograplant.unionArrays(mapState.includedTrees, cartograplant.clickedTrees);
			for (var i = 0; i < cartograplant.clickedTrees.length; i++) {
				cartograplant.activeTrees[cartograplant.clickedTrees[i]] = true;
			}
			$(".add-tree").addClass("active");
		}
		cartograplant.notifyNumSelectedTrees();

	});

    
	$(".carousel-control-prev-icon").click(function() {
        $("#tree-img-carousel").carousel("prev");
    });

    $(".carousel-control-next-icon").click(function() {
        $("#tree-img-carousel").carousel("next");
    });  
	
	$(document).on('click', 'i[id*="layer_info_icon_"]', function() {
		// Get layer id
		console.log('click detected...');
		var layer_id_number = $(this).attr("id").replace('layer_info_icon_','');
		console.log('tried to get the layer id from the tag id from info icon:' + layer_id_number)

		if($('#layer_info_' + layer_id_number).length) {
			// exists
			console.log('Info container already exists');
			/*
			if($(element).is(":visible")) {
				$('layer_info_' + layer_id_number).hide();
			}
			else {
				$('layer_info_' + layer_id_number).show();
			}
			*/
			$('#layer_info_' + layer_id_number).toggle();
			
		}
		else {
			console.log('Info container does not exist... creating and populating');
			var layer_info_container = '<div style="margin-left: 20px; width: 100%; font-size: 10px;" id="layer_info_' + layer_id_number + '">This layer does not have additional information.</div>';
			$("#ct-layer-title-" + layer_id_number).parent().parent().append(layer_info_container);	
			var url_uiapi_get_layer_info = Drupal.settings.base_url + "/cartogratree_uiapi/get_layer_info/" + Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_id'];
			$.ajax({
				method: "GET",
				url: url_uiapi_get_layer_info,
				dataType: "json",
				success: function (data) {
					console.log(data);
					try {
						console.log(data['layer_legend_html']);
						if(data['layer_legend_html'] != null && data['layer_legend_html'] != undefined && data['layer_legend_html'] != "") {
							$('#layer_info_' + layer_id_number).html(data['layer_legend_html']);
						}
						else {
							
						}
					}
					catch(err) {
						console.log('ERROR:' + err);
					}									
				},
				error: function (xhr, textStatus, errorThrown) {
					if(debug) {
						console.log({
							textStatus
						});
						console.log({
							errorThrown
						});
						console.log(eval("(" + xhr.responseText + ")"));
					}
				}
			}).done(function() {
	
			});				
		}
	});	



	$(document).on('change', '.query-builder input.selectized', function() {
		console.log('DETECTED selectize change in value');
		$(this).each(function () {
			var filter_value = $(this).val();
			// console.log('VALUE CHANGED TO:' + filter_value);

			// Get the overall rule container
			var rule_container = $(this).parent().parent();

			// Find whether the filter was study / accession
			var filter_type = rule_container.find('.rule-filter-container select').val();
			// console.log(filter_type);
			if (filter_type == 'accession') {
				// Check CP API for list of phenotypes for this study accession
				var study = filter_value;
				var url = Drupal.settings.ct_nodejs_api + "/v2/phenotypes/phenotype_names_per_study"
				$.ajax({
					url: url,
					method: 'POST',
					data: {
						study: filter_value
					},
					success: function(data) {
						// data = JSON.parse(data);
						console.log(data);
						var phenotype_list_container = undefined;
						rule_container.find('.phenotypes_list').each(function () {
							phenotype_list_container = $(this);
						});
						if (phenotype_list_container == undefined) {
							// create a sub container to put this phenotype list
							var phenotype_list_container_html = '';
							phenotype_list_container_html += '<div class="phenotypes_list" style="font-size: 13px; margin: 10px;"></div>';
							phenotype_list_container = $(phenotype_list_container_html);
							rule_container.append(phenotype_list_container);
						}

						// Now go through each data row and add it to the container
						var phenotype_list_html = '';
						phenotype_list_html += '🅿 <b>' + data.length + ' phenotypes found in study</b>';
						if (data.length > 0) {
							phenotype_list_html += ': ';
						}
						for(var i = 0; i<data.length; i++) {
							var row = data[i];
							phenotype_list_html += row['phenotype'] + ', ';
						}

						// Remove the last comma if it exists
						if (phenotype_list_html.endsWith(", "))   {
							phenotype_list_html = phenotype_list_html.slice(0, -2); 
						}
						phenotype_list_container.html(phenotype_list_html);
					}
				});
			}
			else {

			}
		});
	});

	$(document).on('change', '.query-builder .rule-filter-container select', function() {
		var filter_type = $(this).val();
		if (filter_type != 'accession') {
			// remove .phenotypes_list since the filter is not of type 'accession'
			var rule_container = $(this).parent().parent();
			// remove phenotype_list_container since it means the user changed the filter type
			rule_container.find('.phenotypes_list').each(function() {
				$(this).remove();
			});

		}
	});

}
$(ct_ready_map_click_events);