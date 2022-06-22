var ct_ready_map_analysis = function() {
	var galaxy_id = null; // the galaxy server / connection to be used for analysis
	var workflow_id = null; // the workflow id to be used for the analysis
	var workflow_name = null;
	var history_id = null; // the history id to be used for analysis
	var detected_studies = null; // This contains detected studies and trees selected within each study from user selections on the map
	var analysis_trees = []; // After necessary filter, this will contain the applicable trees
	var analysis_timers = {};
	var analysis_data_store = {};
	var current_analysis_id = -1;
	var workflow_inputs_state = {};
	var analysis_workflow_step_indexes = {};
	var analysis_job_check_timers = {};
	var genotype_filtering = {};
	var loading_icon_src = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/resources_imgs/loader-ring.gif';
	cartograplant.loading_icon_src = loading_icon_src;
	// When the Analsis link is clicked at the top menu of CartograPlant
	$('#analysis-btn').click(function() {


		// We need to create a new analysis automatically
		var user_email = Drupal.settings.user.email;
		console.log('user_email', user_email);
		$.ajax({
			method: 'GET',
			url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/create?user_email=' + user_email,
			success: function(data) {
				var results = JSON.parse(data);
				if(results.analysis_id == -1) {
					// This is a fatal error which will cause everything else to fail with Analysis
					alert('Fatal error: Could not create a new analysis id, please contact administrator');
				}
				else {
					current_analysis_id = results.analysis_id;
					$('#analysis_id').html('Your unique analysis ID: <b>' + results.analysis_id + '</b>');
					$('#analysis_id').attr('value', results.analysis_id);
				}
			}
		});

		$('#analysis-initial-configuration-tab').click();

	});

	$('#btn_update_analysis_name').click(function() {
		var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/update_analysis_name';
		url += "?analysis_id=" + current_analysis_id + '&analysis_name=' + $('#analysis_name').val();
		$.ajax({
			method: 'GET',
			url: url,
			success: function(data) {
				var result = JSON.parse(data);
				console.log(result);
				if(result['updated'] == true) {
					alert('Analysis name has been updated');
				}
				else {
					alert('Analysis name could not be updated. Please contact administrator.');
				}
			}
		});
	})


	/**
	 * This detects the studies of current trees selected on the map.
	 * It puts this information into a global like variable called detected_studies
	 * since theoretically speaking - this shouldn't change in the user 'workflow' steps
	 */
	function get_detected_studies_from_selected_trees() {
		detected_studies = {};
		// console.log(mapState.includedTrees);
		for(var i=0; i < mapState.includedTrees.length; i++) {
			if(mapState.includedTrees[i].includes('TGDR')) {
				var tree_parts = mapState.includedTrees[i].split('-');
				var study = tree_parts[0];
				// console.log(study);
				if(study != "") {
					// console.log(detected_studies[study]);
					if(detected_studies[study] == undefined) {
						detected_studies[study] = [];
					}
					detected_studies[study].push(mapState.includedTrees[i]);
				}
			}
		}
	}

	// This happens when someone clicks on the genotype overlap analysis tab
	$('a[href="#analysis-overlapping-genotypes"]').on('click', function() {
		// load_analysis_overlapping_genotypes_snp_grid_filter();
		get_detected_studies_from_selected_trees();
		console.log(detected_studies);

		var studies = Object.keys(detected_studies);
		
		console.log('Genotype tab click');
		// Overlapping Genotype tab
		var study_info_html = studies.length + ' studies detected based on the trees you selected on the map<br />';
		for(var i=0; i<studies.length; i++) {
			if(i > 0) {
				// study_info_html += ', ';
			}
			study_info_html += '<div style="display: inline-block; padding: 3px; border-radius: 2px; background-color: #036e63; color: #FFFFFF; margin-right: 3px;">' + studies[i] + '</div>';
		}
		$('#analysis-overlapping-genotypes-detected-studies').html(study_info_html);

		// Overlapping Genotype tab
		$.ajax({
			method: 'POST',
			data: {
				studies: JSON.stringify(studies) // array in JSON format
			},
			url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/by_study_ids',
			success: function(data) {
				console.log('overlapping_genotypes', data);
				if(data.length > 0) {
					$('#analysis-overlapping-genotypes-across-studies').html('Overlapping genotypes: ' + data[0]['cardinality']);
				}
			}
		});


		// $.ajax({
		// 	method: 'POST',
		// 	data: {
		// 		study_ids: JSON.stringify(studies) // array in JSON format
		// 	},
		// 	url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/snps_overlaps_by_studies_views',
		// 	success: function(data) {
		// 		console.log(data);
		// 		data = JSON.parse(data);
		// 		var insights_html = "";
		// 		if(data.snps_grid_overlap_array != undefined) {
		// 			var overlap_arr = data.snps_grid_overlap_array;
		// 			insights_html += "We analyzed " + overlap_arr.length + ' studies and discovered the following:<br />';
		// 			insights_html += "There are a total of " + overlap_arr[0]['overlap_all'] + ' SNP overlaps across all ' + overlap_arr.length + ' studies<br />';
					
		// 			// Check for highest total overlaps
		// 			var highest_overlap_total_study = "";
		// 			var highest_overlap_total_value = -1;
		// 			for(var i=0; i<overlap_arr.length; i++) {
		// 				var study_id = overlap_arr[i]['study_name'];
		// 				if(highest_overlap_total_value < (parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']))) {
		// 					highest_overlap_total_study = study_id;
		// 					highest_overlap_total_value = parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']);
		// 				}
		// 			}
		// 			if(highest_overlap_total_value > -1 && highest_overlap_total_value > 0) {
		// 				insights_html += "Study " + highest_overlap_total_study + " contains the highest SNP overlaps (" + highest_overlap_total_value + ") between all studies<br />";
		// 			}					
					
		// 			// Check for highest overlap some
		// 			var highest_overlap_some_study = "";
		// 			var highest_overlap_some_value = -1;
		// 			for(var i=0; i<overlap_arr.length; i++) {
		// 				var study_id = overlap_arr[i]['study_name'];
		// 				if(highest_overlap_some_value < parseInt(overlap_arr[i]['overlap_some'])) {
		// 					highest_overlap_some_study = study_id;
		// 					highest_overlap_some_value = parseInt(overlap_arr[i]['overlap_some']);
		// 				}
		// 			}
		// 			if(highest_overlap_some_value > -1 && highest_overlap_some_value > 0) {
		// 				insights_html += "Study " + highest_overlap_some_study + " contains the highest SNP overlaps (" + highest_overlap_some_value + ") between some studies<br />";
		// 			}
					

		// 		}
		// 		$('#analysis-overlapping-genotypes-summary-insights').html(insights_html);

		// 		create_filter_grid('#analysis-overlapping-genotypes-snp-grid-filter', data.snps_grid_overlap_array);
		// 	}
		// });
		
		// Venn diagram
		// analysis-overlapping-genotypes-snp-venn-diagram
		jQuery.ajax({
			method: "POST",
			url: Drupal.settings.base_url + "/cartogratree/api/v2/genotypes/snps_overlaps_by_studies_views_venn_format",
			data: {
				"data": "-",
				"study_ids": JSON.stringify(studies)
			},
			success: function (data) {
				console.log(data);
				try {
					var data = JSON.parse(data);
					var fake_venn_array = data["venn_array"];
					var overlap_none = data["overlap_none"];
					var sets = JSON.parse(JSON.stringify(data["venn_array"])); // this clones the venn_array result
					// sets.map(function(set) {
					// 	set.size = Math.sqrt(set.size);
					// 	return set;
					// });

					// We want to adjust the fake_venn_array to produce a nice 
					// looking venn diagram just for display purposes.
					for(var i=0; i<fake_venn_array.length; i++) {
						var object = fake_venn_array[i];
						var object_real = sets[i];
						if(object['sets'].length == 1) {
							var study_name = object['sets'][0];
							// Get the value of overlap none for this study
							var overlap_none_value = overlap_none[study_name];

							object['size'] = 10;
							object['label'] = object['sets'][0] + ' ' + overlap_none_value;
							
						}
						else if(object['sets'].length > 1) {
							object['size'] = 2;
							object['label'] = object_real['size'];
						}
					}
					console.log('fake_venn_array', fake_venn_array);
					try {
						var chart = venn.VennDiagram().width(350).height(250);

						d3.select("#analysis-overlapping-genotypes-snp-venn-diagram").datum(fake_venn_array).call(chart);
					} catch (err) {
						console.log(err);
					}

					$.ajax({
						method: 'POST',
						data: {
							study_ids: JSON.stringify(studies) // array in JSON format
						},
						url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/snps_overlaps_by_studies_views',
						success: function(data) {
							console.log(data);
							data = JSON.parse(data);
							var insights_html = "";
							if(data.snps_grid_overlap_array != undefined) {
								var overlap_arr = data.snps_grid_overlap_array;
								insights_html += "<h4>Insights</h4>";
								insights_html += "We analyzed " + overlap_arr.length + ' studies and discovered the following:<br />';
								insights_html += "There are a total of " + overlap_arr[0]['overlap_all'] + ' SNP overlaps across all ' + overlap_arr.length + ' studies<br />';
								
								// Check for highest total overlaps
								var highest_overlap_total_study = "";
								var highest_overlap_total_value = -1;
								for(var i=0; i<overlap_arr.length; i++) {
									var study_id = overlap_arr[i]['study_name'];
									if(highest_overlap_total_value < (parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']))) {
										highest_overlap_total_study = study_id;
										highest_overlap_total_value = parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']);
									}
								}
								if(highest_overlap_total_value > -1 && highest_overlap_total_value > 0) {
									insights_html += "Study " + highest_overlap_total_study + " contains the highest SNP overlaps (" + highest_overlap_total_value + ") between all studies<br />";
								}					
								
								// Check for highest overlap some
								var highest_overlap_some_study = "";
								var highest_overlap_some_value = -1;
								for(var i=0; i<overlap_arr.length; i++) {
									var study_id = overlap_arr[i]['study_name'];
									if(highest_overlap_some_value < parseInt(overlap_arr[i]['overlap_some'])) {
										highest_overlap_some_study = study_id;
										highest_overlap_some_value = parseInt(overlap_arr[i]['overlap_some']);
									}
								}
								if(highest_overlap_some_value > -1 && highest_overlap_some_value > 0) {
									insights_html += "Study " + highest_overlap_some_study + " contains the highest SNP overlaps (" + highest_overlap_some_value + ") between some studies<br />";
								}
								
								// Process the venn_array
								var set_html = "";
								for(var i=0; i<sets.length; i++) {
									var set_object = sets[i];
									console.log('set_object', set_object);
									var set = set_object['sets'];
									// if the set size is more than 1, it's overlap between
									if(set.length > 1) {
										var data_venn_sets = "";
										for(var j=0; j<set.length; j++) {
											if (j>0) {
												data_venn_sets += '_';
											}
											data_venn_sets += set[j];
										}

										set_html += "<div style='text-decoration: underline; display: inline-block;' class='selection_set_overlap' data-venn-sets='" + data_venn_sets + "'>";
										set_html += '<input class="snp_overlap_checkbox" type="checkbox" value="' + data_venn_sets + '" /> ';
										set_html += "SNP overlaps ";
										set_html += "between ";
										for(var j=0; j<set.length; j++) {
											if (j>0) {
												set_html += ', ';
											}
											set_html += set[j];
										}
										set_html += ': ' +  parseInt(set_object['size']) + '</div><br />';
									}
								}

								// Do code for non overlaps
								
								for(var i=0; i<sets.length; i++) {
									var set_object = sets[i];
									console.log('set_object', set_object);
									var set = set_object['sets'];
									// if the set size is more than 1, it's overlap between
									if(set.length == 1) {
										var study_name = set[0];
										var overlap_none_value = overlap_none[study_name];
										set_html += "<div style='text-decoration: underline; display: inline-block;' class='selection_set_none_overlap' data-venn-sets='" + study_name + "'>";
										
										set_html += '<input class="snp_none_overlap_checkbox" type="checkbox" value="' + study_name + '" /> ';
										set_html += study_name + ' has ' + overlap_none_value + " ";
										set_html += "SNPs that do not overlap";
										set_html += "</div><br />";
									}
								}
							}
							$('#analysis-overlapping-genotypes-summary-insights').html(insights_html + "<br />" + set_html);
							
							// On click checkbox (insert into the database overlaps) using CT API
							$('.snp_overlap_checkbox').click(function() {
								var is_checked = false;
								if ($(this).is(':checked')) {
									is_checked = true;
								}

								if(is_checked) {
									// Checked so we need to insert this analysis_data
									console.log('insert_snp_overlap')
									// Get the studies
									var studies = $(this).parent().attr('data-venn-sets');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_studies_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: current_analysis_id,
											study_ids_arr: JSON.stringify(study_ids_arr)
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});
								}
								else {
									// unchecked so call the API function to delete the data
									console.log('delete_snp_overlap')
									// Get the studies
									var studies = $(this).parent().attr('data-venn-sets');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_studies_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: current_analysis_id,
											study_ids_arr: JSON.stringify(study_ids_arr)
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});
								}
							});

							// On click checkbox (insert into the database overlaps) using CT API
							$('.snp_none_overlap_checkbox').click(function() {
								var is_checked = false;
								if ($(this).is(':checked')) {
									is_checked = true;
								}

								if(is_checked) {
									// Checked so we need to insert this analysis_data
									console.log('insert_snp_none_overlap')
									// Get the studies
									var studies = $(this).parent().attr('data-venn-sets');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_studies_none_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: current_analysis_id,
											study_ids_arr: JSON.stringify(study_ids_arr)
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});
								}
								else {
									// unchecked so call the API function to delete the data
									console.log('delete_snp_overlap')
									// Get the studies
									var studies = $(this).parent().attr('data-venn-sets');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_studies_none_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: current_analysis_id,
											study_ids_arr: JSON.stringify(study_ids_arr)
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});
								}
							});							
							
							// Hover for intersections
							$('.selection_set_overlap').hover(
								function(event) {
									var data_venn_sets_val = $(this).attr('data-venn-sets');
									console.log('hover:' + data_venn_sets_val);
									// now try to find the intersection
									var path = d3.select('.venn-intersection[data-venn-sets="' + data_venn_sets_val + '"] path');
									
									path.style('fill-opacity', 0.35);
								},
								function(event) {
									var data_venn_sets_val = $(this).attr('data-venn-sets');
									console.log('hover:' + data_venn_sets_val);
									// now try to find the intersection
									var path = d3.select('.venn-intersection[data-venn-sets="' + data_venn_sets_val + '"] path');
									
									path.style('fill-opacity', 0.2);
								}
							);
							// Hover for none overlaps
							$('.selection_set_none_overlap').hover(
								function(event) {
									
									$('.venn-circle').css('filter', 'saturate(0)');
									$('.venn-intersection').css('filter', 'saturate(0)');

									// Hide the intersection shapes
									$('.venn-intersection').css('display', 'none');

									// Hide the intersection text labels
									$('.venn-intersection').find('.label').css('display', 'none');

									// Hide the intersection text labels
									$('.venn-circle').find('.label').css('display', 'none');




									
									var data_venn_sets_val = $(this).attr('data-venn-sets');
									// Make this specific hover spot saturated
									$('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"]').css('filter', 'saturate(1)');
									// Make sure this specific hover spot text is visible
									$('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] .label').css('display', 'inline-block');

									// For all circles paths, remember the original fill-color and fill-opacity
									$('.venn-circle path').each(function() {
										$(this).attr('original-fill-color', $(this).css('fill'));
										$(this).attr('original-fill-opacity', $(this).css('fill-opacity'));
									});

									// Now set all circles paths to white (so it looks hidden)
									$('.venn-circle path').css('fill','rgb(240, 240, 240)');
									$('.venn-circle path').css('fill-opacity',1);
									// Now set the selected circle path to the original color to make it visible
									$('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path').css('fill', $('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path').attr('original-fill-color'));
									// Now also set the selected circle path to the original fill opacity
									// $('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path').css('fill-opacity', $('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path').attr('original-fill-opacity'));
									$('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path').css('fill-opacity', 0.5);

									// Lower the element 
									d3.select('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"]').lower();

									console.log('hover:' + data_venn_sets_val);
									// now try to find the intersection
									var path = d3.select('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path');
									
									// path.style('fill-opacity', 0.35);
								},
								function(event) {
									$('.venn-circle').css('filter', 'saturate(1)');
									$('.venn-intersection').css('filter', 'saturate(1)');

									
									// Unide the intersection text labels
									$('.venn-intersection').find('.label').css('display', 'inline-block');
									// Unhide the intersection shapes
									$('.venn-intersection').css('display', 'inline-block');

									// Unide the circle text labels
									$('.venn-circle').find('.label').css('display', 'inline-block');
									// Unhide the intersection shapes
									$('.venn-intersection').css('display', 'inline-block');									
									
									// Restore all fill colors for the circle paths
									$('.venn-circle path').each(function() {
										$(this).css('fill', $(this).attr('original-fill-color'));
										$(this).css('fill-opacity', $(this).attr('original-fill-opacity'));
									});

									var data_venn_sets_val = $(this).attr('data-venn-sets');
									console.log('unhover:' + data_venn_sets_val);


									// now try to find the intersection
									var path = d3.select('.venn-circle[data-venn-sets="' + data_venn_sets_val + '"] path');
									
									path.style('fill-opacity', 0.2);
								}
							);
							// create_filter_grid('#analysis-overlapping-genotypes-snp-grid-filter', data.snps_grid_overlap_array);
						}
					});
				} catch (err) { console.log(err) }                        
			}
		});			

	});

	// This happens when someone clicks on the phenotype / traits analysis tab
	$('a[href="#analysis-overlapping-traits"]').on('click', function() {
		console.log('Analysis overlap tab click detected');
		$('#analysis-overlapping-traits-studies').html('<i class="fas fa-clock"></i> Detecting studies...');
		$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-clock"></i> Querying ' + mapState.includedTrees.length + ' trees ' + '<span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />');
		$('#analysis-overlapping-traits-traits-list').html('<i class="fas fa-clock"></i> Awaiting query...');
		$('#analysis-overlapping-traits-traits-operation-container').fadeOut(500);
		$('#analysis-overlapping-traits-download-by-selected-phenotypes').fadeOut(500);

		get_detected_studies_from_selected_trees();
		console.log(detected_studies);

		var studies = Object.keys(detected_studies);


		$('#analysis-overlapping-traits-studies').html('<i class="fas fa-book"></i> Detected studies: ' + Object.keys(detected_studies).length);
		
		if(studies.length > 0) {
			var timer_name = 'studies_intersecting_traits_timer';
			if(analysis_timers[timer_name] != undefined) {
				clearInterval(analysis_timers[timer_name]);
			}
			else {
				analysis_timers[timer_name] = {};
				analysis_timers[timer_name]['current_value'] = 0;
				analysis_timers[timer_name]['timer'] = setInterval(function (element_id) {
					analysis_timers[timer_name]['current_value'] = analysis_timers[timer_name]['current_value'] + 1;
					$(element_id).html(analysis_timers[timer_name]['current_value'] + 's (please wait...)');
				}, 1000, '#studies_intersecting_traits_timer_div');
			}
			var send_data = JSON.stringify(detected_studies);
			var url = Drupal.settings.base_url + "/cartogratree/api/v2/traits/union/by_batch";
			$('#analysis-overlapping-traits-status').html('Status: Finding all traits across all studies ... ');
			$.ajax({
				method: "POST",
				data: {
					'data': send_data
				},
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					if(data.length > 0) {
						var html = "";
						var all_traits = []; // collect all_traits for later on
						for(var i=0; i<data.length; i++) {
							all_traits.push(data[i].name);
						}


						$('#analysis-overlapping-traits-status').html('Status: Finding tree counts for each trait <span class="loading"></span> <span id="status_finding_tree_counts_remaining"></span>');
						for(var i=0; i<data.length; i++) {
							var removeRegEx = /[^\w]+/g;
							var id_name_potential_filtered_trees_nospaces = "analysis-overlapping-traits-filtered-trees-checkbox-" +  data[i].name.replaceAll("%", "_").replaceAll(removeRegEx, "_");
							var id_name_has_overlap_trees_nospaces = "analysis-overlapping-has-overlap-trees-checkbox-" +  data[i].name.replaceAll(removeRegEx, "_");
							html += '<div style="margin-top: 5px; margin-bottom: 5px; display: flex;">';
							html += '<div style="width: 25%;">';
							html += '<input type="checkbox" value="' + data[i].name +  '" class="analysis-overlapping-traits-overlap-phenotype-checkbox"> <span style="background-color: #007eff; color: #FFFFFF; padding: 5px; border-radius: 5px;">Trait</span> ' + data[i].name;
							html += '</div>';
							html += '<div style="width: 35%;" id="' + id_name_potential_filtered_trees_nospaces + '">';
							html += '<i class="fas fa-hourglass"></i> Counting trees <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />';
							html += '</div>';
							html += '<div style="width: 35%;" id="' + id_name_has_overlap_trees_nospaces + '">';
							html += '<i class="fas fa-hourglass"></i> Checking for overlaps <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />';
							html += '</div>';							
							html += '</div>';

							var trees = mapState.includedTrees;
							var operand = 'union'; // I don't think this matters per say for this check since it's a single trait but still needed to fulfill the API requirement
							var traits = [data[i].name];
							analysis_overlapping_traits_tree_count_by_specific_trait(trees, 'union', traits, id_name_potential_filtered_trees_nospaces, i, data.length);
							// analysis_overlapping_traits_tree_count_overlap_by_specific_trait(detected_studies, trait, id_name_potential_overlap_trees_nospaces);
						}

						// Update UI
						$('#analysis-overlapping-traits-traits-operation-container').fadeIn(500);
						$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-smile"></i> ' + data.length +  ' traits detected!');
						$('#analysis-overlapping-traits-traits-list').html(html);
						$('#analysis-overlapping-traits-traits-list').fadeIn(500);

						// Check which traits have overlap between all studies selected and update the UI
						analysis_has_overlapping_traits(detected_studies, all_traits);

					}
					else {
						$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-not-equal"></i> Sorry, no phenotypes overlap.');
						$('#analysis-overlapping-traits-traits-list').fadeOut(500);
						$('#analysis-overlapping-traits-traits-operation-container').fadeOut(500);
					}
					clearInterval(analysis_timers[timer_name]['timer']);
					analysis_timers[timer_name] = undefined;
					$('#studies_intersecting_traits_timer_div').html('');
				},
				error: function() {
					clearInterval(analysis_timers[timer_name]['timer']);
					analysis_timers[timer_name] = undefined;
					$('#studies_intersecting_traits_timer_div').html('');
				}
			});
		}
		else {

		}		
	});


	// Function to get traits that overlap all studies
	function analysis_has_overlapping_traits(detected_studies, all_traits) {
		var send_data = JSON.stringify(detected_studies);
		var url = Drupal.settings.base_url + "/cartogratree/api/v2/traits/intersect/by_batch";
		
		$.ajax({
			method: "POST",
			data: {
				'data': send_data
			},
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				if(data.length > 0) {
					var html = "";
					for(var i=0; i<data.length; i++) {
						// Update the UI
						var removeRegEx = /[^\w]+/g;
						var id_name_has_overlap_trees_nospaces = "analysis-overlapping-has-overlap-trees-checkbox-" +  data[i].name.replaceAll(removeRegEx, '_');
						$('#' + id_name_has_overlap_trees_nospaces).html('<span style="padding: 4px; border-radius: 5px; background-color: purple; color: #FFFFFF;"><i class="fas fa-check-square"></i> Trait overlaps with all studies</span>');
						all_traits.splice(all_traits.indexOf(data[i].name),1);
					}
				}
				// Now all_traits will now contain traits that do not have overlaps so iterate through them and update UI to say no overlaps found
				for(var i=0; i<all_traits.length; i++) {
					var removeRegEx = /[^\w]+/g;
					var id_name_has_overlap_trees_nospaces = "analysis-overlapping-has-overlap-trees-checkbox-" +  all_traits[i].replaceAll(removeRegEx,'_');
					$('#' + id_name_has_overlap_trees_nospaces).html('');
				}
				$('#analysis-overlapping-traits-status').html('Status: Processing complete.');				

			}
		});


	}

	// Function to get tree count by specific trait
	function analysis_overlapping_traits_tree_count_by_specific_trait(trees, operand, traits, id_name_nospaces, i, total) {
		// Perform check on each trait for trees count
		var send_object = {};
		send_object['trees'] = trees;
		send_object['operand'] = operand;
		send_object['traits'] = traits;
		var send_data = JSON.stringify(send_object);
		var url = Drupal.settings.base_url + "/cartogratree/api/v2/traits/filter_trees/by_traits";
		
		$.ajax({
			method: "POST",
			data: {
				'data': send_data
			},
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(id_name_nospaces);
				console.log(data.length);
				$("#status_finding_tree_counts_remaining").html((total - i) + ' remaining <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />');
				if (i == total - 1) {
					$('#analysis-overlapping-traits-status').html('Status: Finding traits overlapping all studies <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />');
				}
				$('#' + id_name_nospaces).html('<i class="fas fa-tree"></i> ' + data.length + ' of ' + data.length + ' trees');
			},
			error: function() {
				$('#' + id_name_nospaces).html('<i class="fas fa-tree"></i>  0 of ' + mapState.includedTrees.length + ' trees (query failed)');
			}
		});	
	}


	// Perform traits filtering
	$('#analysis-overlapping-traits-filter-by-selected-phenotypes').click(function() {
		$('#analysis-overlapping-traits-download-by-selected-phenotypes').hide();
		var trees = mapState.includedTrees;
		var operand = $('#analysis-overlapping-traits-traits-operation').val();
		var traits = [];

		$('.analysis-overlapping-traits-overlap-phenotype-checkbox').each(function() {
			if($(this).prop('checked')) {
				traits.push($(this).val());
				console.log('Found checkbox with value: ' + $(this).val());
			}
		});
		if(traits.length < 1) {
			alert('No traits were selected to filter by, make sure at least one checkbox is checked to perform filter.');
			return;
		}

		$('#analysis-overlapping-traits-filter-by-selected-phenotypes-results').html('<i class="fas fa-clock"></i> Filtering, please wait...');
		var send_object = {};
		send_object['trees'] = trees;
		send_object['operand'] = operand;
		send_object['traits'] = traits;
		var send_data = JSON.stringify(send_object);
		var url = Drupal.settings.base_url + "/cartogratree/api/v2/traits/filter_trees/by_traits";
		$.ajax({
			method: "POST",
			data: {
				'data': send_data
			},
			url: url,
			dataType: "json",
			success: function (data) {
				analysis_trees = data;

				//CSV data
				var csv_data = "tree_id,trait,value,units\n"; // header of file

				for(var i=0; i<data.length; i++) {
					var row = data[i];
					csv_data += row['tree_acc'] + ',' + row['name'] + ',' + row['value'] + ',' + row['units'] + "\n";
				}
				
				analysis_data_store['traits_filtered_csv'] = csv_data;
				$('#analysis-overlapping-traits-download-by-selected-phenotypes').fadeIn(500);
				$('#analysis-overlapping-traits-filter-by-selected-phenotypes-results').html('<i class="fas fa-check-square"></i> Completed! ' + analysis_trees.length + ' of ' + mapState.includedTrees.length + ' trees were found to contain traits you selected!');	
			}
		});	
	});

	$('#analysis-overlapping-traits-download-by-selected-phenotypes').click(function() {
		if(analysis_data_store['traits_filtered_csv'] != undefined) {
			generateFileDownload("traits_filtered.csv", analysis_data_store['traits_filtered_csv']);
		}
		else {
			alert('No data found for filtered traits. Make sure to run the filter before clicking download button.');
		}
	});	

	function convert_array_items_to_csv($arr) {
		//console.log(analysis_envdata_array_items);
		analysis_envdata_csv_data = "";
		for(var i = 0; i < analysis_envdata_array_items.length; i++) {
			var row_array = analysis_envdata_array_items[i];
			for(var j = 0; j < row_array.length; j++) {
				if (j < row_array.length - 1) {
					analysis_envdata_csv_data += row_array[j] + ',';
				}
				else {
					analysis_envdata_csv_data += row_array[j];
				}
			}
			analysis_envdata_csv_data += "\n";
		}
	}

	$('#analysis-initial-configuration-tab').click(function() {
		console.log($('#create-analysis-select-galaxy-account').html());
		if($('#create-analysis-select-galaxy-account').html() == "") {
			var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_galaxy_accounts";
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					var html = '';
					for(var i=0; i<data.length; i++) {
						html += '<option value="' + data[i].galaxy_id+ '">' + data[i].servername +  '</option>';
					}
					$('#create-analysis-select-galaxy-account').html(html);
				}
			});
		}
		else {
			//$('#analysis-retrieve-envdata-section-layers-list').html("");
			console.log("Interface already populated with data");
		}
	});



	// When the analysis section tab is clicked in the Analysis popup window
	// populate steps and form items to begin asking user for more input
	$('#analysis-create-analysis-section-tab').click(function() {
		console.log($('#create-analysis-select-galaxy-account').html());
		if($('#create-analysis-select-galaxy-account').html() == "") {
			var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_galaxy_accounts";
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					var html = '';
					for(var i=0; i<data.length; i++) {
						html += '<option value="' + data[i].galaxy_id+ '">' + data[i].servername +  '</option>';
					}
					$('#create-analysis-select-galaxy-account').html(html);
				}
			});
		}
		else {
			//$('#analysis-retrieve-envdata-section-layers-list').html("");
			console.log("Interface already populated with data");
		}
	});


	$('#create-analysis-select-galaxy-account').click(function() {
		// window.alert("Nice");
		galaxy_id = $('#create-analysis-select-galaxy-account').val();


		cartograplant_analysis_populate_histories_select_list();
		cartograplant_analysis_populate_workflow_select_list();
		
	});	

	function cartograplant_analysis_populate_histories_select_list() {
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_history_from_galaxy_account/" + galaxy_id;
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				var key = Object.keys(data);
				var html = '';
				var workflow_ids = Object.keys(data[key]);
				for(var i=0; i<workflow_ids.length; i++) {
					console.log(data[key][workflow_ids[0]]);
					html = html +  '<option value="' + workflow_ids[i] + '">' + data[key][workflow_ids[i]] +  '</option>';
				}
				$('#create-analysis-select-history').html(html);
			}
		});
	}

	$('#create-analysis-select-history').change(function() {
		cartograplant_analysis_populate_history_contents_list();
	});

	function cartograplant_analysis_populate_history_contents_list() {
		try {
			// Populate a list of history contents which can be managed (which really allows a user to delete essentially)
			history_id = $('#create-analysis-select-history').val();
			var url_history_contents = Drupal.settings.base_url + '/cartogratree_uianalysis/get_history_details/' + galaxy_id + '/' + history_id;
			console.log(url_history_contents);
			$.ajax({
				method: 'GET',
				url: url_history_contents,
				success: function(data) {
					console.log(data);
					$('#manage-history-contents').html('');
					if(data.length > 0) {
						var div = "<h2>Manage workspace files</h2>";
						for(var i=0; i<data.length; i++) {
							var history_item = data[i];
							//if(history_item['deleted'] == false) {
								
								div += '<div style="display: flex;"></div>';
								div += '<div style="">';
								// id, history_id, dataset_id
								div += '<button id="manage-history-contents-delete-' + history_item['dataset_id'] + '" style="">Delete</button>';
								div += ' <div style="display: inline-block;">' + history_item['dataset_name'] + '</div>';
								div += '</div>';
								
							//}
						}
						$('#manage-history-contents').append(div);
					}
					else {
						$('#manage-history-contents').html('This workspace currently contains no files');
					}
				}
			});	
		}
		catch (err) {
			console.log(err);
		}	
	} 

	$(document).on("click", "button[id*=manage-history-contents-delete-]", function() {
		var id = $(this).attr('id');
		var id_parts = id.split("-");
		var content_id = id_parts[4];
		var url_delete_history_content_id = Drupal.settings.base_url + '/cartogratree_uianalysis/delete_history_content_id/' + galaxy_id + '/' + history_id + '/' + content_id;
		console.log(url_delete_history_content_id);
		$.ajax({
			method: 'GET',
			url: url_delete_history_content_id,
			success: function(data) {
				console.log(data);
				cartograplant_analysis_populate_history_contents_list();
			}
		});		
	});

	function cartograplant_analysis_populate_workflow_select_list() {
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_workflows_from_galaxy_account/" + galaxy_id;
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				var html = '';
				for(var i=0; i<data.length; i++) {
					html = html +  '<option value="' + data[i].workflow_id + '">' + data[i].workflow_name +  '</option>';
				}
				$('#create-analysis-select-workflow').html(html);
			}
		});		
	}

	// create-analysis-select-workflow
	$('#create-analysis-select-workflow').click(function() {
		workflow_inputs_state = {}; // reset
		cartograplant_analysis_populate_workflow_submit_form();
	});

	$('.button-refresh-workflow').click(function() {
		cartograplant_analysis_populate_workflow_submit_form();
	});

	function cartograplant_analysis_populate_workflow_submit_form() {
		$('.button-refresh-workflow-status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
		workflow_id = $('#create-analysis-select-workflow').val();
		history_id = $('#create-analysis-select-history').val();
		workflow_name = $('#create-analysis-select-workflow option:selected').text();
		console.log('workflow_id', workflow_id);
		
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_workflow_input_types/" + galaxy_id + '/' + workflow_id + '/' + history_id + '?nocache=' + Math.floor(Date.now() / 1000);
		console.log(url);
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				var ui_controls = data.ui_controls;
				var step_indexes = data.step_indexes;
				analysis_workflow_step_indexes[workflow_id] = step_indexes;
				
				$('#create-analysis-workflow-submit-form').html('');
				//$('#create-analysis-workflow-submit-form').append('<div id="workflow_form">');
				$('#create-analysis-workflow-submit-form').append('<div style="display: inline-block; margin-top: 5px; margin-bottom: 5px; background-color: #d8e3e2; padding: 5px; color: #000000; border-radius: 5px; text-transform: uppercase; font-size: 18px;">' + $('#create-analysis-select-workflow option:selected').text() +  ' Analysis Configuration</div>');
				if(data.overall_annotation != undefined) {
					$('#create-analysis-workflow-submit-form').append('<div>' + data.overall_annotation + '</div><hr />');
				}
				if(ui_controls.length != undefined) {
					for (var i=0; i<ui_controls.length; i++) {
						var ui_control_info = ui_controls[i];
						if(ui_control_info['name'] == undefined) {
							// No name for a control means it's either not required
							// or something went wrong - a name is needed for the controls 
						}
						else {
							var name = ui_control_info['name'];
							var title = ui_control_info['title'];
							var description = ui_control_info['description'];
							$('#create-analysis-workflow-submit-form').append('<div style=""><div style="font-size: 16px; margin-top: 5px; margin-bottom: 5px;"><i class="fas fa-cog"></i> '  + title +  '</div></div>');
							if(description != undefined) {
								$('#create-analysis-workflow-submit-form').append('<div style="display: inline-block; margin-top: 5px; margin-bottom: 5px; background-color: #d8e3e2; color: #000000; padding: 5px; font-size: 12px; border-radius: 4px;"><div><i class="fas fa-info-circle"></i> '  + description +  '</div></div>');	
							}

							if(ui_control_info['type'] == "text") {
								// Show option to choose either file upload
								// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');

								var text_html = '<div style="margin-top: 5px; margin-bottom: 5px;"><input type="text" style="min-width: 15%;" id="' + name +  '-text" name="' + name + '-text" value="' + ui_control_info['default_value'] + '" /></div>';
								$('#create-analysis-workflow-submit-form').append(text_html);
							}
							else if(ui_control_info['type'] == "float") {
								// Show option to choose either file upload
								// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');

								var float_html = '<div style="margin-top: 5px; margin-bottom: 5px;"><input type="text" style="min-width: 15%;" id="' + name +  '-float" name="' + name + '-float" value="' + ui_control_info['default_value'] + '" /></div>';
								$('#create-analysis-workflow-submit-form').append(float_html);
							}							
							else if(ui_control_info['type'] == "selectfile") {
								// Show option to choose either file upload
								// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');
								$('#create-analysis-workflow-submit-form').append('<div style="margin-top: 5px; margin-bottom: 5px;"><input type="file" id="' + name + '-upload" name="' + name + '-upload" /><button class="history_file_upload_button" id="' + name + '-upload-button">Upload to workspace</button><div style="display: inline-block; padding-left: 5px;" id="' + name + '-upload-status"></div></div>');
								
								var options_html = "";
								if(ui_control_info['options'] != undefined) {
									var options_keys = Object.keys(ui_control_info['options']);
									for(var options_html_counter = 0; options_html_counter < options_keys.length; options_html_counter++) {
										// The key is a json encoded string containing the id and src, while value is name of file
										var key_object = JSON.parse(options_keys[options_html_counter]);
										var galaxy_history_file_id = key_object['id'];
										var galaxy_history_file_src = key_object['src'];
										var galaxy_history_file_name = ui_control_info['options'][options_keys[options_html_counter]];
										options_html += "<option value='" + options_keys[options_html_counter] + "'>" + galaxy_history_file_name +  '</option>';
									}
								}

								var select_html = '<div style="margin-top: 5px; margin-bottom: 5px;">Workspace available files: <select style="min-width: 15%;" id="' + name +  '-selectfile" name="' + name + '-selectfile">' + options_html + '</select></div>';
								$('#create-analysis-workflow-submit-form').append(select_html);
								// or select from galaxy history (if option exists)

							}
							else if (ui_control_info['type'] == "select") {
								// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');
								var options_html = "";
								if(ui_control_info['options'] != undefined) {
									var options_keys = Object.keys(ui_control_info['options']);
									for(var options_html_counter = 0; options_html_counter < options_keys.length; options_html_counter++) {
										// The key is a json encoded string containing the id and src, while value is name of file
										var option_value = options_keys[options_html_counter];
										var option_label = ui_control_info['options'][options_keys[options_html_counter]];
										options_html += "<option value='" + option_value + "'>" + option_label +  '</option>';
									}
								}

								var select_html = '<div style="margin-top: 5px; margin-bottom: 5px;"><select style="min-width: 15%;" id="' + name +  '-select" name="' + name + '-select">' + options_html + '</select></div>';
								$('#create-analysis-workflow-submit-form').append(select_html);	
														
							}
							$('#create-analysis-workflow-submit-form').append('<div style="border-bottom: 1px solid #dfdfdf; margin-top: 25px; margin-bottom: 25px;"></div>');
						}		
					}
					$('#create-analysis-workflow-submit-form').append('<div style="margin-top: 5px; margin-bottom: 5px;"><button class="initiate_analysis_job_button" id="' + workflow_id + '_intiate_analysis_job-button">Initiate analysis job</button></div>');
					// $('#create-analysis-workflow-submit-form').append('</div>');
					$('#create-analysis-workflow-submit-form').append('<div id="analysis_job_results_status" style="margin-top: 5px; margin-bottom: 5px;"></div>');
					$('#create-analysis-workflow-submit-form').append('<div id="analysis_job_results" style="margin-top: 5px; margin-bottom: 5px;"></div>');
				}
				else {
					$('#create-analysis-workflow-submit-form').html('<div style="margin-top: 5px; margin-bottom: 5px;">No requirements needed for this analysis, you may continue to send to Galaxy for processing.</div>');
				}
				$('.button-refresh-workflow-status').html('');
				try {
					restore_inputs_state_create_analysis_workflow_submit_form();
				}
				catch (err) {

				}
			}
		});
	}


	// This code will attempt to store changes to the form like input typing etc
	// into memory incase of a workflow reload due to file uploads for example

	$(document).on('input', '#create-analysis-workflow-submit-form input', function() {
		console.log('Detected input in workflow form item(s)');
		console.log($(this).attr('id'));
		save_inputs_state_create_analysis_workflow_submit_form()
	});

	$(document).on('change', '#create-analysis-workflow-submit-form select', function() {
		console.log('Detected input in workflow form item(s)');
		console.log($(this).attr('id'));
		save_inputs_state_create_analysis_workflow_submit_form()
	});

	function save_inputs_state_create_analysis_workflow_submit_form() {
		//reset it
		workflow_inputs_state = {};
		$('#create-analysis-workflow-submit-form input, #create-analysis-workflow-submit-form select').each(function() {
			var id = $(this).attr('id');
			var val = $(this).val();
			workflow_inputs_state[id] = val;
			console.log('Saved input state for id:' + id + ' value:' + val);
		});
	}

	function restore_inputs_state_create_analysis_workflow_submit_form() {
		var keys = Object.keys(workflow_inputs_state);
		for (var i=0; i<keys.length; i++) {
			$('#' + keys[i]).val(workflow_inputs_state[keys[i]]);
		}
	}




	// This should cater for initiating a job analysis by clicking on the button
	$(document).on('click', '.initiate_analysis_job_button', function() {
		// We'll need to get creative here, try to select elements that contain workflow
		// To do that, we'll need to get workflow from this button clicked
		var workflow_id = ($(this).attr('id')).split('_')[0];
		
		var step_indexes = analysis_workflow_step_indexes[workflow_id]; // we need to send this to initiate_analysis_job endpoint

		console.log('galaxy_id', galaxy_id);

		var inputs = {}; // new array

		//        id* means id contains      id$ means ends with
		$("select[id*='" + workflow_id + "'][id$='-selectfile']").each(function(index) {
			console.log('Found a match item:', $(this).attr('id'));
			var selected_value = JSON.parse($(this).val());
			var step_number = ($(this).attr('id')).split('_')[1];
			var step_input_name = ((($(this).attr('id')).split('__')[1]).split('___'))[0];
			// push this to inputs array
			if(inputs[step_number] == undefined) {
				inputs[step_number] = {};
			}
			inputs[step_number][step_input_name] = selected_value;
		});

		//        id* means id contains      id$ means ends with
		$("select[id*='" + workflow_id + "'][id$='-select']").each(function(index) {
			console.log('Found a match item:', $(this).attr('id'));
			var selected_value = $(this).val();
			var step_number = ($(this).attr('id')).split('_')[1];
			var step_input_name = ((($(this).attr('id')).split('__')[1]).split('___'))[0];
			// push this to inputs array
			if(inputs[step_number] == undefined) {
				inputs[step_number] = {};
			}			
			inputs[step_number][step_input_name] = selected_value;
		});	
		
		//        id* means id contains      id$ means ends with
		$("input[id*='" + workflow_id + "'][id$='-text']").each(function(index) {
			console.log('Found a match item:', $(this).attr('id'));
			var selected_value = $(this).val();
			var step_number = ($(this).attr('id')).split('_')[1];
			var step_input_name = ((($(this).attr('id')).split('__')[1]).split('___'))[0];
			// push this to inputs array
			if(inputs[step_number] == undefined) {
				inputs[step_number] = {};
			}			
			inputs[step_number][step_input_name] = selected_value;
		});				

		//        id* means id contains      id$ means ends with
		$("input[id*='" + workflow_id + "'][id$='-float']").each(function(index) {
			console.log('Found a match item:', $(this).attr('id'));
			var selected_value = $(this).val();
			var step_number = ($(this).attr('id')).split('_')[1];
			var step_input_name = ((($(this).attr('id')).split('__')[1]).split('___'))[0];
			// push this to inputs array
			if(inputs[step_number] == undefined) {
				inputs[step_number] = {};
			}			
			inputs[step_number][step_input_name] = selected_value;
		});			


		console.log('inputs', inputs);
		console.log('step_indexes', step_indexes);
		var formData = new FormData();
		formData.append('history_id', history_id);
		formData.append('workflow_id', workflow_id);
		formData.append('workflow_name', workflow_name);
		formData.append('galaxy_id', galaxy_id);
		formData.append('inputs', JSON.stringify(inputs));
		formData.append('step_indexes', JSON.stringify(step_indexes));
 
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/initiate_job";
        $.ajax({
            url: url,
            method: 'POST',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
			success: function (data) {
				console.log(data);
				if(data.response == "success") {
					$('#analysis_job_results_status').html('');
					$('#analysis_job_results_status').append('<div>Successfully submitted job to Galaxy server</div>');
					$('#analysis_job_results_status').append('<div>Invocation ID: ' + data.invocation.id + '</div>');
					$('#analysis_job_results_status').append('<div id="analysis_job_status">Status: Submitted <div style="display: inline-block" class="loading"></div> <img style="height: 16px;" src="' + loading_icon_src + '" /></div>');
					$('#analysis_job_results_status').append('<div id="analysis_job_outputs"></div>');
					if(analysis_job_check_timers[data.invocation.id] == undefined) {
						// create a new interval timer
						var invocation_id = data.invocation.id;
						analysis_job_check_timers[data.invocation.id] = setInterval(function(galaxy_id, history_id, workflow_id, invocation_id) {
							var url_invocation_outputs_details = Drupal.settings.base_url + "/cartogratree_uianalysis/get_invocation_outputs/" + galaxy_id + '/' + history_id + '/' + workflow_id + '/' + invocation_id;
							console.log(url_invocation_outputs_details);
							
							$.ajax({
								url: url_invocation_outputs_details,
								method: 'GET',
								success: function (invocation_outputs_details_data) {
									$('#analysis_job_outputs').html('');
									console.log(invocation_outputs_details_data);
									var job_finished = true;
									var job_error = false;
									var job_paused = false;
									var job_states = invocation_outputs_details_data.job_states;
									for(var i = 0; i<job_states.length; i++) {
										if(job_states[i] == "ok" || job_states[i] == "error" || job_states[i] == "paused") {
											if(job_states[i] == "error") {
												job_error = true;
											}
											else if(job_states[i] == "paused") {
												job_paused = true;
											}
										}
										else {
											job_finished = false;
										}
									}

									var output_details = invocation_outputs_details_data.output_details;
									$('#analysis_job_outputs').append('<div id="analysis_job_outputs_status" style="font-weight: bold; font-size: 16px; margin-top: 5px; margin-bottom: 5px;">Output Results (running) <span class="loading"><span> <img style="height: 16px;" src="' + loading_icon_src + '" /></div>');
									for(i = 0; i<output_details.length; i++) {
										var tmp_name = output_details[i]['name'];
										var tmp_file_ext = output_details[i]['file_ext'];
										var tmp_file_size = output_details[i]['file_size'];
										var tmp_state = output_details[i]['state'];
										var tmp_download_url = output_details[i]['download_url'];
										if(tmp_state == "ok") {
											$('#analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #00d100;">Completed</span> File download: <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
										}
										else if(tmp_state == "error") {
											$('#analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span> <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
										}
										else if(tmp_state == "paused") {
											$('#analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused</span> <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
										}										
										else {
											$('#analysis_job_outputs').append('<div style="margin-bottom: 5px;"><img style="height: 16px;" src="' + loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span> File ' + tmp_name + ' (' + tmp_file_size + ' bytes)</div>');
										}
									}

									if(job_finished) {
										clearInterval(analysis_job_check_timers[data.invocation.id]);
										
										if(job_error) {
											$('#analysis_job_status').html("Status: Error, incompleted, stopped.");
											$('#analysis_job_outputs_status').html("Output results (Error!)");
										}
										else if(job_paused) {
											$('#analysis_job_status').html("Status: Error, paused.");
											$('#analysis_job_outputs_status').html("Output results (Paused, error!)");
										}
										else if (job_finished) {
											$('#analysis_job_status').html("Status: Successfully completed.");
											$('#analysis_job_outputs_status').html("Output results (Completed successfully!)");
										}
									}
								}
							});


											
						}, 10000, galaxy_id, history_id, workflow_id, invocation_id);
					}

				}
			}
		});		
	});

	// This should cater for file uploading to the currently selected history then maybe refresh the select list
	$(document).on('click', '.history_file_upload_button', function() {
		// alert('This should upload the file to galaxy history');

		// Get the control id of the file
		var upload_button_id = $(this).attr('id');
		var status_container = upload_button_id.replaceAll('-upload-button', '-upload-status');
		$('#' + status_container).html('Uploading <div style="display: inline-block;" class="loading"></div>');
		var file_id = upload_button_id.replaceAll('-button','');
		console.log('file_id', file_id);

		var formData = new FormData();
		formData.append('galaxy_id', galaxy_id);
		formData.append('workflow_id', workflow_id);
		formData.append('history_id', history_id);
		var file_upload_element = document.getElementById(file_id);
		formData.append('file1', file_upload_element.files[0]);

		
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_to_history";
        $.ajax({
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
			
				xhr.upload.addEventListener("progress", function(evt) {
					if (evt.lengthComputable) {
						var percentComplete = evt.loaded / evt.total;
						percentComplete = parseInt(percentComplete * 100);
						console.log(percentComplete);
						$('#' + status_container).html('Uploading ... ' + percentComplete + '% completed.');
				
						if (percentComplete === 100) {
				
						}
			
					}
				}, false);
			
				return xhr;
			},			
            url: url,
            method: 'POST',
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
			success: function (data) {
				console.log(data);
				if(data.result != undefined) {
					if(data.result == "uploaded") {
						$('#' + status_container).html('<br /><div style="padding: 5px; border-radius: 3px; background-color: #fffd9c;">Successfully uploaded! Please refresh workflow until it appears in the select list</div>');
						// Refresh the history files by reloading the entire submit form
						/*
						setTimeout(function() {
							console.log('Attempt to reload the form to update the workflow input files etc...');
							cartograplant_analysis_populate_workflow_submit_form();
						}, 7000);	
						*/					
					}
				}

				
			}
		});
		
	});


	$('#analysis-retrieve-envdata-section-tab').click(function() {
		// window.alert("Nice");
		if($('#analysis-retrieve-envdata-section-layers-list').html() == "") {
			var url = Drupal.settings.base_url + "/cartogratree_uiapi/get_analysis_categories_list";
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					for(var i=0; i<data.length; i++) {
						var item_html = "<div><input type='checkbox' class='analysis_category_checkbox' id='analysis_category_" + data[i]['category_id'] + "'><div style='display: inline-block; color:#FFFFFF; background-color: #439085; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>category</div> " + data[i]['title'] + "</div>";
						item_html += "<div id='analysis_category_groups_" + data[i]['category_id'] + "'></div>";
						$('#analysis-retrieve-envdata-section-layers-list').append(item_html);
					}
				}
			});
		}
		else {
			//$('#analysis-retrieve-envdata-section-layers-list').html("");
			console.log("Interface already populated with data");
		}
	});

	// This will show the container that contains the option to create a new history
	$(document).on('click', '#create-analysis-new-history-button', function() {
		if ($('#create-analysis-new-history-configuration').css('display') == 'none') {
			$('#create-analysis-new-history-configuration').css('display','flex');
		}
		else {
			$('#create-analysis-new-history-configuration').css('display', 'none');
		}
	});


	$(document).on('click', '#create-analysis-new-history-name-button', function() {
		// Here we need to make an api call to create a new history or return an error that this history name
		// has already been taken

		console.log($('#create-analysis-new-history-name').val());
		var history_name = ($('#create-analysis-new-history-name').val()).trim();
		if (history_name == "") {
			alert("The history name cannot be empty!");
		}
		else {
			var url = Drupal.settings.base_url + "/cartogratree_uianalysis/create_new_history_for_user/" + galaxy_id + '/' + history_name;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					// Repopulate the histories list which should now contain 
					cartograplant_analysis_populate_histories_select_list();
					console.log(data);
					$('#create-analysis-new-history-configuration').hide();
					alert('Created new history:' + history_name);


				}
			});
		}

		// alert('Success');
	});

	$(document).on('click','.analysis_category_checkbox',function () {
		var this_id = $(this).attr("id");
		var category_id = this_id.split("_", 3)[2];
		console.log('category_id=' + category_id);
		if($(this).is(':checked')) {
			// get the groups
			var url = Drupal.settings.base_url + "/cartogratree_uiapi/get_groups_by_analysis_category_id/" + category_id;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					for(var i=0; i<data.length; i++) {
						var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div><input type='checkbox' class='analysis_category_group_checkbox' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "'><div style='display: inline-block; color:#FFFFFF; background-color: #814390; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>group</div>" + data[i]['group_name'] + "</div>";
						item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + data[i]['group_id'] + "_layers'></div>";
						$('#analysis_category_groups_' + category_id).append(item_html);
					}
				}
			});				
		}
		else {
			// clear the div
			$('#analysis_category_groups_' + category_id).html("");
		}
		console.log(category_id);
	});

	$(document).on('click','.analysis_category_group_checkbox',function () {
		var this_id = $(this).attr("id");
		var this_id_parts = this_id.split("_", 5);
		var category_id = this_id_parts[2];
		var group_id = this_id_parts[4];
		console.log('category_id=' + category_id);
		console.log('group_id=' + group_id);
		if($(this).is(':checked')) {
			// get the groups
			var url = Drupal.settings.base_url + "/cartogratree_uiapi/get_layers_by_analysis_category_id_and_group_id/" + category_id + '/' + group_id;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					for(var i=0; i<data.length; i++) {
						// var item_html = "<div style='padding-left: 10px;'><input type='checkbox' class='analysis_category_group_checkbox' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "'> " + data[i]['group_name'] + "</div>";
						// item_html += "<div style='padding-left: 20px;' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "_layers'></div>";
						// $('#analysis_category_groups_' + category_id).append(item_html);
						
						var layer_id_number = data[i]['layer_id'];
						// Use layer_id_number to see whether this is a multilayer layer and try to expand out the layers
						console.log(Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]);
						var isMultiLayeredYear = Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]['layer_multilayer_rangeslider_year_option'];
						var layer_list_ids = [];
						var layer_list_names = [];
						if (isMultiLayeredYear == 1) {
							var start_year = Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]['layer_multilayer_rangeslider_start_year'];
							var end_year = Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]['layer_multilayer_rangeslider_end_year'];
							var layer_name_with_wildcard = Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]['name'];

							// We need to go through each year
							for(var j=start_year; j<=end_year; j++) {
								var search_layer_name = (layer_name_with_wildcard + '').replace('%', j);
								console.log(search_layer_name);

								// We need to find these layers to get the layer_ids
								var layer_keys = Object.keys(Drupal.settings['layers']);
								for(var k=0; k<layer_keys.length; k++) {
									var tmp_layer_id = Drupal.settings['layers'][layer_keys[k]]['layer_id'];
									var tmp_layer_name = Drupal.settings['layers'][layer_keys[k]]['name'];
									if(tmp_layer_name.includes(search_layer_name)) {
										// add the id
										console.log(tmp_layer_name);
										console.log(tmp_layer_id)
										layer_list_ids.push(tmp_layer_id);
										layer_list_names.push(tmp_layer_name);
										// break for statement
										break;
									}
								}
							}
						}
						else {
							layer_list_ids.push(layer_id_number);
							layer_list_names.push(Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]['name']);							
						}

						console.log(layer_list_ids);
						console.log(layer_list_names);
						for(var k=0; k<layer_list_ids.length; k++)  {
							// var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + data[i]['layer_id'] + "_checkbox' class='analysis_category_groups_layer_checkbox' type='checkbox' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>layer</div>" + data[i]['title'] + "</div>";
							// item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + data[i]['layer_id'] + "'></div>";
							var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_list_ids[k] + "_checkbox' class='analysis_category_groups_layer_checkbox' type='checkbox' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>layer</div>" + data[i]['title'] + "</div>";
							item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_list_ids[k] + "'></div>";							
							$('#analysis_category_' + category_id + '_groups_' + group_id + '_layers').append(item_html);
						}
						// $('#analysis_category_groups_' + category_id).fadeIn(500);
					}
				}
			});				
		}
		else {
			// clear the div
			$('#analysis_category_' + category_id + '_groups_' + group_id + '_layers').html("");			
		}
		console.log(category_id);
	});	


	
	$(document).on('click', '.analysis_category_groups_layer_checkbox', function() {
		var this_id = $(this).attr("id");
		var this_id_parts = this_id.split("_");
		var category_id = this_id_parts[2];
		var group_id = this_id_parts[4];	
		var layer_id = this_id_parts[6];
		console.log(Drupal.settings);
		console.log(layer_id);
		var layer_name = Drupal.settings.layers['cartogratree_layer_' + layer_id]['name'];
		//var bbox = '0,0,256,256';
		var bbox = '24.26795744042827,-89.80302970226862,24.467957440428272,-89.60302970226863';
		//var url = Drupal.settings.cartogratree.gis + "/../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" + layer_name + "&maxFeatures=1&outputFormat=json&BBOX=" + bbox;	
		var url = Drupal.settings.cartogratree.gis + "/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=" + layer_name + "&LAYERS=" + layer_name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
		console.log(url);
		if($(this).is(':checked')) {
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log(data);
					var properties = [];
					if (data['features'].length >= 1) {
						var properties = data['features'][0]['properties'];
						var keys = Object.keys(properties);
						for(var i = 0; i < keys.length; i++) {
							var key_name = keys[i];
							// Create a checkbox element for this key / property
							var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪</div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id + "_property_" + i + "_checkbox' class='analysis_category_groups_layer_property_checkbox' type='checkbox' data-value='" + key_name + "' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>property</div>" + key_name +  "</div>";
							$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).append(item_html);
						}
					}
				},
				error: function(data) {
					console.log('Error - usually happens when this is a single band geotiff?');
				}
			});	
		}
		else {
			$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).html("");
		}
	});

	var analysis_environmental_data_selected_properties = [];
	// This is the on click event for an actual environment property found in layer
	$(document).on('click','.analysis_category_groups_layer_property_checkbox', function() {

		console.log($(this).is(":checked"));
		if ($(this).is(":checked") == true) {
			var this_id = $(this).attr("id");
			var this_id_parts = this_id.split("_");
			var category_id = this_id_parts[2];
			var group_id = this_id_parts[4];	
			var layer_id = this_id_parts[6];
			var layer_name = Drupal.settings.layers['cartogratree_layer_' + layer_id]['name'];
			var property_id = this_id_parts[8];
			var property_value = $(this).attr("data-value");
			
			var object = {
				'category_id':category_id, 
				'group_id': group_id, 
				'layer_id': layer_id,
				'layer_name': layer_name, 
				'property_id': property_id, 
				'property_value': property_value
			};
			console.log(object);
			analysis_environmental_data_selected_properties.push(object);
		}
		else {
			var found_index = analysis_environmental_data_selected_properties.indexOf(object);
			analysis_environmental_data_selected_properties.splice(found_index,1);
		}


	});

	/*
		The below code will initialize the progress bars and description for the Analysis
		Environmental Data tab interface
	*/

	var aes_progressbar = $("#analysis-envdata-section-progressbar");
	aes_progressbar.progressbar({ value: 0});
	var aes_progressbar_description = $("#analysis-envdata-section-progressbar-description");
	aes_progressbar_description.html("");

	var aes_progressbar2 = $("#analysis-envdata-section-progressbar2");
	aes_progressbar2.progressbar({ value: 0});
	var aes_progressbar2_description = $("#analysis-envdata-section-progressbar2-description");
	aes_progressbar2_description.html("");

	var aes_progressbarValue = aes_progressbar.find(".ui-progressbar-value");
	aes_progressbarValue.css({
		"background": '#009135'
	});

	var aes_progressbar2Value = aes_progressbar2.find(".ui-progressbar-value");
	aes_progressbar2Value.css({
		"background": '#009135'
	});	

	/*
		The code below will execute when clicking on the Environmental Data tab
	*/

	
	
	var analysis_envdata_array_items = [];
	var analysis_envdata_array_header_properties_start_index = 0;

	var analysis_envdata_current_progress_properties_count = 0;
	var analysis_envdata_current_progress_properties_total = 0;
	var analysis_envdata_start_time = 0;
	var analysis_envdata_end_time = 0;


	// This is version 3
	$(document).on('click', '#analysis-generateoutput-envdata-section-button', function() {
		var tree_list_for_websocket_command = '';

		// Create a string containing tree_ids delimited by commas
		for(var i=0; i < mapState.includedTrees.length; i++) {
			aes_progressbar_description.html("Requesting tree " + (i+1) + " of " + mapState.includedTrees.length);
			if (i == 0) {
				tree_list_for_websocket_command += mapState.includedTrees[i]
			}
			else {
				tree_list_for_websocket_command += ',' + mapState.includedTrees[i]
			}
		}
		analysis_envdata_csv_data = "";
		analysis_envdata_current_progress_tree_count = -1;
		analysis_envdata_current_progress_tree_total = mapState.includedTrees.length;

		// We need to get the selected layer and corresponding data property names
		var analysis_envdata_array_items = [];
		for(i = 0; i < analysis_environmental_data_selected_properties.length; i++) {
			var property_object = analysis_environmental_data_selected_properties[i];

			analysis_envdata_array_items.push(property_object);//0 is assumed to be headers
		}
		

		console.log('Trying to send data to CTAPIWSS CONN');
		console.log(JSON.stringify(analysis_envdata_array_items));
		ctapiwss_conn.send('generate_environmental_data_for_csv_from_trees' 
			+ '::' + Drupal.settings.cartogratree.gis
			+ '::' + tree_list_for_websocket_command 
			+ '::' + JSON.stringify(analysis_envdata_array_items)
		);
		console.log('End of sending data to CTAPIWSS CONN');
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



	$(document).on('click', '#analysis-generateoutput-envdata-section-button-v2', function() {
		analysis_envdata_start_time = Math.round((new Date()).getTime() / 1000);
		// console.log('analysis-generateoutput-envdata-section-button has been clicked');
		
		// console.log(mapState.includedTrees);

		$('#download_analysis_envdata_csv_data_button_container').html("");
		analysis_envdata_array_items.push(["TREE_ID","LATITUDE","LONGITUDE","GENUS","SPECIES"]);

		analysis_envdata_csv_data = "";
		// analysis_envdata_csv_data = "TREE_ID,LATITUDE,LONGITUDE,GENUS,SPECIES";
		analysis_envdata_array_header_properties_start_index = analysis_envdata_array_items[0].length;
		for(i = 0; i < analysis_environmental_data_selected_properties.length; i++) {
			var property_object = analysis_environmental_data_selected_properties[i];
			// analysis_envdata_csv_data += "," + property_object.property_value;
			analysis_envdata_array_items[0].push(property_object.property_value);//0 is assumed to be headers
		}
		// analysis_envdata_csv_data += "\n"; 
		analysis_envdata_current_progress_tree_count = 0;
		analysis_envdata_current_progress_properties_count = 0;
		analysis_envdata_current_progress_properties_total = mapState.includedTrees.length * analysis_environmental_data_selected_properties.length;
		console.log("Analysis Environmental Data Selected Properties");
		console.log(analysis_environmental_data_selected_properties);
		for(var i=0; i < mapState.includedTrees.length; i++) {
			//Create empty arrays (space holders) within the array_items array
			analysis_envdata_array_items.push([]);
		}
		for(var i=0; i < mapState.includedTrees.length; i++) {
			// Query the db for each tree lat and lon
			generate_envdata_for_selected_tree(i);
		}
	});


	function generate_envdata_for_selected_tree(i) {
		$.ajax({
			url:  Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_id=" + mapState.includedTrees[i],
			dataType: "json",
			async: true,
			success: function (data) {
				//console.log(data.uniquename + ' retrieved tree data like lat lon etc');
				//console.log('Tree Index from mapState.includedTrees: ' + i);

				// analysis_envdata_csv_data += data.uniquename + ',' + data.latitude + ',' + data.longitude + ',' + data.genus + ',' + data.species;
				
				// Go through the geoserver queries per property
				for(var j = 0; j < analysis_environmental_data_selected_properties.length; j++) {
					var property_object = analysis_environmental_data_selected_properties[j];
					console.log(property_object);
					var layer_id = property_object.layer_id;
					var layer_name = Drupal.settings.layers['cartogratree_layer_' + layer_id]['name'];
					//var bbox = '0,0,256,256';
					var bbox = data.latitude + ',' + data.longitude + ',' + (data.latitude + 0.00000000000001) + ',' + (data.longitude + 0.00000000000001);
					//var url = Drupal.settings.cartogratree.gis + "/../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" + layer_name + "&maxFeatures=1&outputFormat=json&BBOX=" + bbox;	
					var url = Drupal.settings.cartogratree.gis + "/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=" + layer_name + "&LAYERS=" + layer_name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
					console.log("Iteration: " + ((i+1) * (j+1)));
					generate_envdata_tree_properties_data(i,url,property_object, data,bbox);
				}
				
				// analysis_envdata_csv_data += "\n";
				analysis_envdata_current_progress_tree_count = analysis_envdata_current_progress_tree_count + 1;
				
				aes_progressbar.progressbar( "option", {
					value: Math.ceil((analysis_envdata_current_progress_tree_count / mapState.includedTrees.length) * 100),
				});
				analysis_envdata_end_time = Math.round((new Date()).getTime() / 1000);
				aes_progressbar_description.html("Basic metadata for tree " + analysis_envdata_current_progress_tree_count + " of " + mapState.includedTrees.length + " downloaded.");
				$("#analysis-generateoutput-elapsed-time").html("(" + Math.ceil(analysis_envdata_end_time - analysis_envdata_start_time) + "s)");
			}
		});
	}

	function generate_envdata_tree_properties_data(i,url,property_object, data = "",bbox = "") {

		analysis_envdata_array_items[i+1] = [data.uniquename,data.latitude,data.longitude,data.genus,data.species];
		$.ajax({
			method: "GET",
			url: url,
			//async: false,
			dataType: "json",
			success: function (data_prop_query) {
				console.log(data_prop_query);
				//console.log(data.uniquename);
				//console.log(bbox);
				analysis_envdata_current_progress_properties_count = analysis_envdata_current_progress_properties_count + 1;
				aes_progressbar2.progressbar( "option", {
					value: Math.ceil((analysis_envdata_current_progress_properties_count / analysis_envdata_current_progress_properties_total) * 100),
				});
				analysis_envdata_end_time = Math.round((new Date()).getTime() / 1000);
				aes_progressbar2_description.html("Property <i>" + key_name +  "</i> for tree " + analysis_envdata_current_progress_properties_count + " of " + analysis_envdata_current_progress_properties_total + " downloaded.");
				$("#analysis-generateoutput-elapsed-time").html("(" + Math.ceil(analysis_envdata_end_time - analysis_envdata_start_time) + "s)");
				var properties = [];
				if (data_prop_query['features'].length >= 1) {
					var properties = data_prop_query['features'][0]['properties'];
					var keys = Object.keys(properties);

					for(var k = 0; k < keys.length; k++) {
						var key_name = keys[k];
						var key_value = properties[key_name];
						console.log(key_name + ',' + key_value);
						console.log(k + ',' + property_object.property_id);

						if(k == property_object.property_id) {
							// Add this one to the CSV
							// analysis_envdata_csv_data += ',' + key_value;

							analysis_envdata_array_items[i+1].push(key_value);

						}

						// Create a checkbox element for this key / property
						//var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪</div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id + "_property_" + i + "_checkbox' class='analysis_category_groups_layer_property_checkbox' type='checkbox' data-value='" + key_name + "' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>property</div>" + key_name +  "</div>";
						//$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).append(item_html);
					}
				}
				else {
					var key_value = "NA";
					analysis_envdata_array_items[i+1].push(key_value);
				}
				if(analysis_envdata_current_progress_properties_count == analysis_envdata_current_progress_properties_total) {
					convert_envdata_array_items_to_csv();
					var item_html = "<button id='download_analysis_envdata_csv_data_button' class='btn btn-primary'>Download ENVDATA</button>";
					$('#download_analysis_envdata_csv_data_button_container').html(item_html);

				}					
			},
			error: function(data) {
				console.log('Error - usually happens when this is a single band geotiff?');
				console.log(data);
				for (var i = 0; i<analysis_environmental_data_selected_properties.length; i++) {
					analysis_envdata_array_items[j+1].push('ERROR');
				}
				analysis_envdata_current_progress_properties_count = analysis_envdata_current_progress_properties_count + analysis_environmental_data_selected_properties.length;
				if(analysis_envdata_current_progress_properties_count == analysis_envdata_current_progress_properties_total) {
					convert_envdata_array_items_to_csv();
					var item_html = "<button id='download_analysis_envdata_csv_data_button' class='btn btn-primary'>Download ENVDATA</button>";
					$('#download_analysis_envdata_csv_data_button_container').html(item_html);
				}					
			}
		});				
	}

	function convert_envdata_array_items_to_csv() {
		//console.log(analysis_envdata_array_items);
		analysis_envdata_csv_data = "";
		for(var i = 0; i < analysis_envdata_array_items.length; i++) {
			var row_array = analysis_envdata_array_items[i];
			for(var j = 0; j < row_array.length; j++) {
				if (j < row_array.length - 1) {
					analysis_envdata_csv_data += row_array[j] + ',';
				}
				else {
					analysis_envdata_csv_data += row_array[j];
				}
			}
			analysis_envdata_csv_data += "\n";
		}
	}

	$(document).on('click', '#download_analysis_envdata_csv_data_button', function() {
		generateFileDownload("envdata.csv",analysis_envdata_csv_data);
	});

    cartograplant.generateFileDownload = generateFileDownload;
	function generateFileDownload(filename, text) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);
	  
		element.style.display = 'none';
		document.body.appendChild(element);
	  
		element.click();
	  
		document.body.removeChild(element);
	}  
	
	// DEPRECATED USING EMILY VIEWS
	// $('#analysis-overlapping-genotypes-tab').click(function() {
		
	// 	genotype_filtering['snps'] = null;
	// 	genotype_filtering['ssrs'] = null;
	// 	// Get selected tree_ids
	// 	var tree_ids_arr = mapState.includedTrees;
	// 	var send_object = {
	// 		tree_ids: tree_ids_arr
	// 	}
	// 	var send_data = JSON.stringify(send_object);
		
	// 	$('#analysis-overlapping-genotypes-snps-tree-count').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
	// 	$('#analysis-overlapping-genotypes-study-types').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
	// 	$('#analysis-overlapping-genotypes-overlapped').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
	// 	$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Querying SNPs and SSRs for selected trees ... ');
	// 	// var url_snps = Drupal.settings.base_url + "/cartogratree/api/v2/genotypes/snps_by_batch";
	// 	// $('#analysis-overlapping-genotypes-algorithm-status').html('Awaiting SNPs data before performing calculations...');
	// 	// $.ajax({
	// 	// 	xhr: function() {
	// 	// 		var xhr = new window.XMLHttpRequest();
		
	// 	// 		// Upload progress
	// 	// 		xhr.upload.addEventListener("progress", function(evt){
	// 	// 			if (evt.lengthComputable) {
	// 	// 				var percentComplete = evt.loaded / evt.total;
	// 	// 				//Do something with upload progress
	// 	// 				// console.log(percentComplete);
	// 	// 			}
	// 	// 	   }, false);
		
	// 	// 	   // Download progress
	// 	// 	   xhr.addEventListener("progress", function(evt){
	// 	// 		   if (evt.lengthComputable) {
	// 	// 			   var percentComplete = evt.loaded / evt.total;
	// 	// 			   // Do something with download progress
	// 	// 			   $('#analysis-overlapping-genotypes-algorithm-status').html('Receiving SNPs: ' + Math.ceil(percentComplete * 100) + '%');
	// 	// 			   // console.log(percentComplete);
	// 	// 		   }
	// 	// 	   }, false);
		
	// 	// 	   return xhr;
	// 	// 	},
	// 	// 	method: "POST",
	// 	// 	data: {
	// 	// 		'data': send_data
	// 	// 	},
	// 	// 	url: url_snps,
	// 	// 	dataType: "json",
	// 	// 	success: function (data) {
	// 	// 		$('#analysis-overlapping-genotypes-snps-tree-count').html(data.length);
	// 	// 		if(data.length > 0) {
	// 	// 			$('#analysis-overlapping-genotypes-snps-tree-count').append(' <button id="analysis-overlapping-genotypes-snps-csv-download">Download SNPs</button>')
	// 	// 		}
	// 	// 		genotype_filtering['snps'] = data;
	// 	// 		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Finished retrieving SNPs for selected trees ... ');

	// 	// 		// window.alert('SNPS received');
	// 	// 		console.log(data);



	// 	// 		if(genotype_filtering['snps'] != null && genotype_filtering['ssrs'] != null) {

					
	// 	// 			// Find overlapping genotypes
	// 	// 			cartograplant_analysis_genotypes_detect_overlapping_genotypes();

	// 	// 			// DEPRECATED - WRONG LOGIC based on meeting
	// 	// 			// cartograplant_analysis_genotypes_detect_studies();
	// 	// 		}
	// 	// 	}
	// 	// });


	// 	// This is the download button for snps
	// 	$(document).on('click', '#analysis-overlapping-genotypes-snps-csv-download', function() {
	// 			// CSV conversion
	// 			console.log('clicked');
	// 			var snps_csv_text = "";
	// 			for(var i=0; i<genotype_filtering['snps'].length; i++) {
	// 				var keys = Object.keys(genotype_filtering['snps'][i]);
	// 				for (var j=0; j<keys.length; j++) {
	// 					if(j > 0) {
	// 						snps_csv_text += ','
	// 					}
	// 					snps_csv_text += genotype_filtering['snps'][i][keys[j]];
	// 				}
	// 				snps_csv_text += "\n";
	// 			}
	// 			generateFileDownload("snp-data.csv",snps_csv_text);
	// 	});
		
	// 	// $('#analysis-overlapping-genotypes-algorithm-status').html('Awaiting SSRs data before performing calculations...');
	// 	// $('#analysis-overlapping-genotypes-ssrs-tree-count').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
	// 	// var url_ssrs = Drupal.settings.base_url + "/cartogratree/api/v2/genotypes/ssrs_by_batch";
	// 	// $.ajax({
	// 	// 	xhr: function() {
	// 	// 		var xhr = new window.XMLHttpRequest();
		
	// 	// 		// Upload progress
	// 	// 		xhr.upload.addEventListener("progress", function(evt){
	// 	// 			if (evt.lengthComputable) {
	// 	// 				var percentComplete = evt.loaded / evt.total;
	// 	// 				//Do something with upload progress
	// 	// 				// console.log(percentComplete);
	// 	// 			}
	// 	// 	   }, false);
		
	// 	// 	   // Download progress
	// 	// 	   xhr.addEventListener("progress", function(evt){
	// 	// 		   if (evt.lengthComputable) {
	// 	// 			   var percentComplete = evt.loaded / evt.total;
	// 	// 			   // Do something with download progress
	// 	// 			   $('#analysis-overlapping-genotypes-algorithm-status').html('Receiving SSRs: ' + Math.ceil(percentComplete * 100) + '%');
	// 	// 			   // console.log(percentComplete);
	// 	// 		   }
	// 	// 	   }, false);
		
	// 	// 	   return xhr;
	// 	// 	},			
	// 	// 	method: "POST",
	// 	// 	data: {
	// 	// 		'data': send_data
	// 	// 	},
	// 	// 	url: url_ssrs,
	// 	// 	dataType: "json",
	// 	// 	success: function (data) {
	// 	// 		$('#analysis-overlapping-genotypes-ssrs-tree-count').html(data.length);
	// 	// 		if(data.length > 0) {
	// 	// 			$('#analysis-overlapping-genotypes-ssrs-tree-count').append(' <button id="analysis-overlapping-genotypes-ssrs-csv-download">Download SSRs</button>')
	// 	// 		}				
	// 	// 		genotype_filtering['ssrs'] = data;
	// 	// 		// window.alert('SSRS received');
	// 	// 		console.log(data);
	// 	// 		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Finished retrieving SSRs for selected trees ... ');
	// 	// 		if(genotype_filtering['snps'] != null && genotype_filtering['ssrs'] != null) {
	// 	// 			// cartograplant_analysis_genotypes_detect_studies();
	// 	// 			cartograplant_analysis_genotypes_detect_overlapping_genotypes();
	// 	// 		}				
	// 	// 	}
	// 	// });

		
		
	// 	// This is the download button for ssrs
	// 	$(document).on('click', '#analysis-overlapping-genotypes-ssrs-csv-download', function() {
	// 		// CSV conversion
	// 		console.log('clicked');
	// 		var ssrs_csv_text = "";
	// 		for(var i=0; i<genotype_filtering['ssrs'].length; i++) {
	// 			var keys = Object.keys(genotype_filtering['ssrs'][i]);
	// 			for (var j=0; j<keys.length; j++) {
	// 				if(j > 0) {
	// 					ssrs_csv_text += ','
	// 				}
	// 				ssrs_csv_text += genotype_filtering['ssrs'][i][keys[j]];
	// 			}
	// 			ssrs_csv_text += "\n";
	// 		}
	// 		generateFileDownload("ssr-data.csv",ssrs_csv_text);
	// 	});	
		
	// 	// This is the new code to get all SNPS for the studies it detects
		
	// 	var url_snps_by_studies = Drupal.settings.base_url + "/cartogratree/api/v2/genotypes/snps_by_studies";
	// 	$.ajax({
	// 		xhr: function() {
	// 			var xhr = new window.XMLHttpRequest();
		
	// 			// Upload progress
	// 			xhr.upload.addEventListener("progress", function(evt){
	// 				if (evt.lengthComputable) {
	// 					var percentComplete = evt.loaded / evt.total;
	// 					//Do something with upload progress
	// 					// console.log(percentComplete);
	// 				}
	// 		   }, false);
		
	// 		   // Download progress
	// 		   xhr.addEventListener("progress", function(evt){
	// 			   if (evt.lengthComputable) {
	// 				   var percentComplete = evt.loaded / evt.total;
	// 				   // Do something with download progress
	// 				   $('#analysis-overlapping-genotypes-algorithm-status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />' + 'Receiving SNPs: ' + Math.ceil(percentComplete * 100) + '%');
	// 				   $('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />' + 'Downloading SNPs: ' + Math.ceil(percentComplete * 100) + '%');  
	// 				   // console.log(percentComplete);
	// 			   }
	// 		   }, false);
		
	// 		   return xhr;
	// 		},	
	// 		method: 'POST',
	// 		url: url_snps_by_studies,
	// 		data: {
	// 			'data': JSON.stringify({
	// 				study_ids: Object.keys(detected_studies)
	// 			})
	// 		},
	// 		dataType: 'json',
	// 		success: function(data) {
	// 			genotype_filtering['snps'] = data;
	// 			genotype_filtering['ssrs'] = []; // TODO
	// 			cartograplant_analysis_genotypes_detect_overlapping_genotypes();
	// 		}
	// 	});
	// });

	function cartograplant_analysis_genotypes_detect_overlapping_genotypes() {
		$('#analysis-overlapping-genotypes-snps-tree-count').html(genotype_filtering['snps'].length);
		$('#analysis-overlapping-genotypes-ssrs-tree-count').html(genotype_filtering['ssrs'].length);
		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Indexing genotypes for optimized searching ... ');
		
		// index by marker_name and store the studies (all genotypes - both SNPs and SSRs)
		genotype_filtering['index_genotypes'] = {};

		// index by marker_name and store the studies (SNPs only)
		genotype_filtering['index_genotypes_snps'] = {}

		// index by marker_name and store the studies (SSRs only)
		genotype_filtering['index_genotypes_ssrs'] = {}

		// store only those markers with multiple studies
		genotype_filtering['overlapped_genotypes'] = {};

		// store only those markers with multiple studies (SNPs only)
		genotype_filtering['overlapped_genotypes_snps'] = {};

		// store only those markers with multiple studies (SSRs only)
		genotype_filtering['overlapped_genotypes_ssrs'] = {};		

		genotype_filtering['index_studies'] = {};

		// STEP 1 - Indexing
		// Let's index SNPs by adding marker_name as a key and check to see if the TGDR*** part of tree_acc is different
		console.log('Found ' + genotype_filtering['snps'].length + ' SNP markers for indexing');

		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />' + 'Indexing SNPs ...');  
		
		for(var i=0; i<genotype_filtering['snps'].length; i++) {
			var marker_name = genotype_filtering['snps'][i]['marker_name'];
			var tree_acc = genotype_filtering['snps'][i]['tree_acc'];
			// TGDR***
			var study = tree_acc.substring(0,7);
			
			// Compile an index for study names
			if(genotype_filtering['index_studies'][study] == undefined) {
				// we need to add this study to the index_study
				genotype_filtering['index_studies'][study] = true;
			}


			if(genotype_filtering['index_genotypes'][marker_name] == undefined) {
				// new genotype found
				genotype_filtering['index_genotypes'][marker_name] = {}; 
				genotype_filtering['index_genotypes'][marker_name]['studies'] = {}; 
			}
			genotype_filtering['index_genotypes'][marker_name]['studies'][study] = true;
			if (genotype_filtering['index_genotypes'][marker_name]['data'] == undefined) {
				genotype_filtering['index_genotypes'][marker_name]['data'] = [];
			}
			genotype_filtering['index_genotypes'][marker_name]['data'].push(genotype_filtering['snps'][i]);


			// do the same for only snps index
			if(genotype_filtering['index_genotypes_snps'][marker_name] == undefined) {
				// new genotype found
				genotype_filtering['index_genotypes_snps'][marker_name] = {}; 
				genotype_filtering['index_genotypes_snps'][marker_name]['studies'] = {}; 
			}
			genotype_filtering['index_genotypes_snps'][marker_name]['studies'][study] = true;
			if (genotype_filtering['index_genotypes_snps'][marker_name]['data'] == undefined) {
				genotype_filtering['index_genotypes_snps'][marker_name]['data'] = [];
			}
			genotype_filtering['index_genotypes_snps'][marker_name]['data'].push(genotype_filtering['snps'][i]);

			// console.log('Indexing SNP ' + i);
			if(i%1000 == 0) {
				$('#analysis-overlapping-genotypes-algorithm-status').html('Indexing ' + i + ' of ' + genotype_filtering['snps'].length + ' SNPs before checking for tallying overlaps...');
			}
			
			
		}

		console.log('After indexing, we have ' + Object.keys(genotype_filtering['index_genotypes_snps']).length + ' SNPs');

		// From the above data, get marker_names that overlap all studies for SNPs only
		var total_index_studies_count = Object.keys(genotype_filtering['index_studies']).length;
		var genotypes_snps_unique_marker_names = Object.keys(genotype_filtering['index_genotypes_snps']);
		$('#analysis-overlapping-genotypes-algorithm-status').html('Generating grid data to display grid overlap widget...');
		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />' + 'Using index to generate grid data ...'); 
		for(var i=0; i<genotypes_snps_unique_marker_names.length; i++) {
			var marker_name = genotypes_snps_unique_marker_names[i];

			var studies_overlapped = Object.keys(genotype_filtering['index_genotypes_snps'][marker_name]['studies']);

			// debug code 
			if( i < 10) {
				console.log(marker_name + ' ' + JSON.stringify(studies_overlapped));
			}
			// check if the studies_overlapped = 1 (this means no overlaps)
			if(genotype_filtering['genotype_snps_grid'] == undefined) {
				genotype_filtering['genotype_snps_grid'] = {
					// format would be study name as object key etc.
					// study1: {
					// 	overlap_all: 5,
					// 	overlap_some: 25,
					// 	overlap_none: 70
					// },						
				};
			}

			// IF only 1 study is found in studies_overlapped of specific marker
			// then it didn't overlap with other studies...
			if(studies_overlapped.length <= 1) {
				if(genotype_filtering['genotype_snps_grid'][studies_overlapped[0]] == undefined) {
					genotype_filtering['genotype_snps_grid'][studies_overlapped[0]] = {
						overlap_all: 0,
						overlap_some: 0,
						overlap_none: 0
					}
				}
				genotype_filtering['genotype_snps_grid'][studies_overlapped[0]]['overlap_none']++;
			}
			// If for this marker, more than 1 study was found and the number of studies for this marker
			// is less than than the total studies count, then it's partially overlapped
			else if(studies_overlapped.length > 1 && studies_overlapped < total_index_studies_count) {
				//for(var j=0; j<studies_overlapped.length; j++) {
					if(genotype_filtering['genotype_snps_grid'][studies_overlapped[j]] == undefined) {
						genotype_filtering['genotype_snps_grid'][studies_overlapped[j]] = {
							overlap_all: 0,
							overlap_some: 0,
							overlap_none: 0
						}
					}

					genotype_filtering['genotype_snps_grid'][studies_overlapped[j]]['overlap_some'] = genotype_filtering['genotype_snps_grid'][studies_overlapped[j]]['overlap_some'] + 1;

				
				//}
			}
			// if the studies overlapped is equal to the total studies, this means the overlap is over all 
			// the studies
			else if (studies_overlapped.length == total_index_studies_count) {
				for(var j=0; j<studies_overlapped.length; j++) {
					if(genotype_filtering['genotype_snps_grid'][studies_overlapped[j]] == undefined) {
						genotype_filtering['genotype_snps_grid'][studies_overlapped[j]] = {
							overlap_all: 0,
							overlap_some: 0,
							overlap_none: 0
						}
					}
					genotype_filtering['genotype_snps_grid'][studies_overlapped[j]]['overlap_all'] = genotype_filtering['genotype_snps_grid'][studies_overlapped[j]]['overlap_all'] + 1;
				}
			}
		}	
		

		var snps_grid_array = [];
		var studies_detected = Object.keys(detected_studies);
		for(var i=0; i < studies_detected.length; i++) {
			var study_snps_row = {
				'study_name': studies_detected[i],
				'overlap_all': genotype_filtering['genotype_snps_grid'][studies_detected[i]]['overlap_all'],
				'overlap_some': genotype_filtering['genotype_snps_grid'][studies_detected[i]]['overlap_some'],
				'overlap_none': genotype_filtering['genotype_snps_grid'][studies_detected[i]]['overlap_none']
			}
			snps_grid_array.push(study_snps_row);
		}

		console.log('genotype_snps_grid', genotype_filtering['genotype_snps_grid']);
		// $('#analysis-overlapping-genotypes-algorithm-status').html(JSON.stringify(genotype_filtering['genotype_snps_grid']));
		$('#analysis-overlapping-genotypes-algorithm-status').html(JSON.stringify(snps_grid_array));
		create_filter_grid('#analysis-overlapping-genotypes-snp-grid-filter', snps_grid_array);
		
		// Let's index SSRs by adding marker_name as a key and check to see if the TGDR*** part of tree_acc is different
		for(var i=0; i<genotype_filtering['ssrs'].length; i++) {
			var marker_name = genotype_filtering['ssrs'][i]['marker_name'];
			var tree_acc = genotype_filtering['ssrs'][i]['tree_acc'];
			// TGDR***
			var study = tree_acc.substring(0,6);

			if(genotype_filtering['index_genotypes'][marker_name] == undefined) {
				// new genotype found
				genotype_filtering['index_genotypes'][marker_name] = {};
				genotype_filtering['index_genotypes'][marker_name]['studies'] = {}; 
			}
			genotype_filtering['index_genotypes'][marker_name]['studies'][study] = true;
			if (genotype_filtering['index_genotypes'][marker_name]['data'] == undefined) {
				genotype_filtering['index_genotypes'][marker_name]['data'] = [];
			}
			genotype_filtering['index_genotypes'][marker_name]['data'].push(genotype_filtering['ssrs'][i]);

			// index markers for only ssrs
			if(genotype_filtering['index_genotypes_ssrs'][marker_name] == undefined) {
				// new genotype found
				genotype_filtering['index_genotypes_ssrs'][marker_name] = {};
				genotype_filtering['index_genotypes_ssrs'][marker_name]['studies'] = {}; 
			}
			genotype_filtering['index_genotypes_ssrs'][marker_name]['studies'][study] = true;
			if (genotype_filtering['index_genotypes_ssrs'][marker_name]['data'] == undefined) {
				genotype_filtering['index_genotypes_ssrs'][marker_name]['data'] = [];
			}
			genotype_filtering['index_genotypes_ssrs'][marker_name]['data'].push(genotype_filtering['ssrs'][i]);

			console.log('Indexing SSR ' + i);
		}	
		
		$('#analysis_genotypes_overall_status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Finding genotype overlaps ... ');
		// STEP 2 - Find overlapping
		// Nice now we have indexed them in the index_genotypes by marker_name
		// Now check each of these to see if more than 1 study has been indexed per marker_name
		var object_keys = Object.keys(genotype_filtering['index_genotypes']);
		for(var i=0; i < object_keys.length; i++) {
			var marker_name = object_keys[i];

			if(Object.keys(genotype_filtering['index_genotypes'][marker_name]['studies']).length > 1) {
				// genotype_filtering['overlapped_genotypes'] 
				genotype_filtering['overlapped_genotypes'][marker_name] = genotype_filtering['index_genotypes'][marker_name];
			}
		}

		// OUTPUT the results of overlapped_genotypes

		$('#analysis_genotypes_overall_status').html('Operations completed!');
		$('#analysis-overlapping-genotypes-overlapped').html(Object.keys(genotype_filtering['overlapped_genotypes']).length);
		if(Object.keys(genotype_filtering['overlapped_genotypes']).length > 0) {
			$('#analysis-overlapping-genotypes-overlapped').append(' <button id="analysis-overlapping-genotypes-csv-download">Download overlapping genotypes</button>')
		}	
		

	}	

	// This is the download button for overlapping genotypes
	$(document).on('click', '#analysis-overlapping-genotypes-csv-download', function() {
		// CSV conversion
		console.log('clicked');
		var overlapping_csv_text = "";
		var object_keys = Object.keys(genotype_filtering['overlapped_genotypes']); // by marker_name
		for(var i=0; i<object_keys.length; i++) {
			console.log(object_keys[i]);
			var data_array = genotype_filtering['overlapped_genotypes'][object_keys[i]]['data']; // this contains the row data
			for (var k=0; k<data_array.length; k++) {
				var keys = Object.keys(data_array[k]);
				for (var j=0; j<keys.length; j++) {
					if(j > 0) {
						overlapping_csv_text += ','
					}
					//overlapping_csv_text += genotype_filtering['ssrs'][i][keys[j]];
					overlapping_csv_text += genotype_filtering['overlapped_genotypes'][object_keys[i]]['data'][k][keys[j]];
				}
				overlapping_csv_text += "\n";
			}
		}
		generateFileDownload("overlapping-genotypes-data.csv",overlapping_csv_text);
	});	


	// DEPRECATED SINCE WE DO NOT NEED TO FILTER BY DETECTED STUDIES
	// function cartograplant_analysis_genotypes_detect_studies() {
	// 	$('#analysis-overlapping-genotypes-study-types').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
		
	// 	console.log('genotype_filtering[snps]', genotype_filtering['snps']);
	// 	console.log('genotype_filtering[ssrs]', genotype_filtering['ssrs']);

		
	// 	var study_types = {};
	// 	for(var i=0; i<genotype_filtering['snps'].length; i++) {
	// 		var s_types = Object.keys(study_types);
	// 		// console.log('s_types', s_types);
	// 		var temp_study_type = genotype_filtering['snps'][i]['study_type'];
	// 		if(temp_study_type != undefined) {
	// 			if(s_types.includes(temp_study_type) != true) {
	// 				study_types[temp_study_type] = true;
	// 			}
	// 		}
	// 	}

	// 	for(var i=0; i<genotype_filtering['ssrs'].length; i++) {
	// 		var s_types = Object.keys(study_types);
	// 		// console.log('s_types', s_types);
	// 		var temp_study_type = genotype_filtering['ssrs'][i]['study_type'];
	// 		if(temp_study_type != undefined) {
	// 			if(s_types.includes(temp_study_type) != true) {
	// 				study_types[temp_study_type] = true;
	// 			}
	// 		}
	// 	}	
		
	// 	var study_types_arr = Object.keys(study_types);
	// 	var html = "<br />";
	// 	for(var i=0; i<study_types_arr.length; i++) {
	// 		html += '<input type="checkbox" class="analysis_genotypes_select_study_type" value="' + study_types_arr[i] + '"/> <span>' + study_types_arr[i] + '</span><br />';
	// 	}
	// 	html += '<button id="analysis_genotypes_download_filtered">Download (filtered)</button>';
	// 	$('#analysis-overlapping-genotypes-study-types').html(html);
	// }

	// $(document).on('click', '#analysis_genotypes_download_filtered', function() {
	// 	// Check to see which checkboxes are selected

	// 	var is_snps = false;
	// 	var is_ssrs = false;
		
	// 	if($("#analysis_genotypes_select_snps").is(':checked')) {
	// 		is_snps = true;
	// 	}
	// 	if($("#analysis_genotypes_select_ssrs").is(':checked')) {
	// 		is_ssrs = true;
	// 	}

	// 	var rows = [];
	// 	$('.analysis_genotypes_select_study_type').each(function() {
	// 		var study_type = $(this).attr('value');
	// 		if(is_ssrs) {
	// 			for(var i=0; i<genotype_filtering['ssrs'].length; i++) {
	// 				if(genotype_filtering['ssrs'][i]['study_type'] == study_type) {
	// 					rows.push(genotype_filtering['ssrs'][i]);
	// 				}
	// 			}
	// 		}
	// 		if(is_snps) {
	// 			for(var i=0; i<genotype_filtering['snps'].length; i++) {
	// 				if(genotype_filtering['snps'][i]['study_type'] == study_type) {
	// 					rows.push(genotype_filtering['snps'][i]);
	// 				}
	// 			}
	// 		}			
	// 	});

	// 	// generate csv
	// 	var rows_csv_text = "";
	// 	for(var i=0; i<rows.length; i++) {
	// 		var keys = Object.keys(rows[i]);
	// 		for (var j=0; j<keys.length; j++) {
	// 			if(j > 0) {
	// 				rows_csv_text += ','
	// 			}
	// 			rows_csv_text += rows[i][keys[j]];
	// 		}
	// 		rows_csv_text += "\n";
	// 	}
	// 	if(rows.length > 0) {
	// 		generateFileDownload("genotype-filtered-data.csv",rows_csv_text);
	// 	}	
	// 	else {
	// 		alert("It seems there are no genotype data to generate. Make sure you selected at least one genotype and a corresponding study type");
	// 	}		

	// });

	

}
$(ct_ready_map_analysis);