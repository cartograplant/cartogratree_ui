var analysis_study_context = {};
var shared_analysis_name = null;
var analysis_completion_json = {
	analysis_study_context: {},
	analysis_study_filter_markers_and_genotypes: {},
}
var ct_ready_map_analysis = function() {
	var galaxy_id = null; // the galaxy server / connection to be used for analysis
	var workflow_id = null; // the workflow id to be used for the analysis
	var workflow_name = null;
	var history_id = null; // the history id to be used for analysis
	var detected_studies = null; // This contains detected studies and trees selected within each study from user selections on the map
	var analysis_trees = []; // After necessary filter, this will contain the applicable trees
	var analysis_timers = {};
	var analysis_initial_configuration_tab = false;
	var analysis_traits_configuration_tab = false;
	var analysis_genotypes_configuration_tab = false;
	var analysis_data_store = {};
	var current_analysis_id = -1;
	var workflow_inputs_state = {};
	var analysis_workflow_step_indexes = {};
	var analysis_job_check_timers = {};
	var analysis_snp_filtering_final_output_file = {};
	
	var genotype_filtering = {};
	var loading_icon_src = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/resources_imgs/loader-ring.gif';
	var analysis_includedTrees = undefined; // [IMPORTANT!] Initialized on first tab load 
	var analysis_tabs_all = [
		'#analysis-initial-configuration-tab',
		'#analysis-overlapping-traits-tab',
		'#analysis-overlapping-genotypes-tab',
		'#analysis-filter-snp-section',
		'#analysis-popstruct-section-tab',
		//'.analysis-filter-indv-section',
		'#analysis-retrieve-envdata-section-tab',
		'#analysis-create-analysis-section-tab',
		'#analysis-confirm-section-tab',

	];
	cartograplant.analysis_tabs_all = analysis_tabs_all;
	var analysis_tabs_enabled = [
		'#analysis-initial-configuration-tab',
		'#analysis-overlapping-traits-tab',
		'#analysis-overlapping-genotypes-tab',
		'#analysis-filter-snp-section-tab',
		'#analysis-popstruct-section-tab',
		// '.analysis-filter-indv-section',
		'#analysis-retrieve-envdata-section-tab',
		'#analysis-create-analysis-section-tab',
		'#analysis-confirm-section-tab'
	];
	cartograplant.analysis_tabs_enabled = analysis_tabs_enabled;
	cartograplant.loading_icon_src = loading_icon_src;

	cartograplant['analysis_snp_filtering_final_output_file'] = analysis_snp_filtering_final_output_file;



	// Eventually turn all the above variables into public cartograplant[var_name] variables
	cartograplant['analysis_workflow_step_indexes'] = analysis_workflow_step_indexes;
	cartograplant['analysis_job_check_timers'] = analysis_job_check_timers;
	cartograplant['workflow_name'] = workflow_name;
	cartograplant['detected_studies'] = detected_studies;
	cartograplant['current_analysis_id'] = current_analysis_id;
	cartograplant['galaxy_id'] = galaxy_id;
	cartograplant['history_id'] = history_id;
	// When the Analysis link is clicked at the top menu of CartograPlant
	// $('#analysis-btn').click(function() {
	cartograplant['analysis_boot_function'] = function() {
		interactive_histograms_selected_data = {};

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
					cartograplant.current_analysis_id = results.analysis_id;
					$('#analysis_id').html('Your unique Analysis ID: <b>' + results.analysis_id + '</b>');
					$('#analysis_id').attr('value', results.analysis_id);

					// Update analysis type
					analysis_update_type();
					// Update analysis summary
					analysis_summary_update();
				}
			}
		});

		$('#analysis-initial-configuration-tab').click();
	}
	// });


	/**
	 * This code checks which analysis tab has been clicked
	 * It checks if pop struct tab is going to be changed and if user
	 * wants to continue to the tab they clicked away
	 */
	try {
		$('a.analysis-nav-tab[data-toggle="tab"]').off('show.bs.tab');
	} catch (err) {}
	$('a.analysis-nav-tab[data-toggle="tab"]').on('show.bs.tab', function (e) {
		// test = true;
		// if(test){
		// 	e.preventDefault();
		// 	return false;
		// }
		var analysis_current_tab = cartograplant['analysis_tab_current'];
		var analysis_new_current_tab = $(this).attr('class');
		console.log('TABS comparison: ', analysis_current_tab, analysis_new_current_tab);
		cartograplant['analysis_tab_current'] = analysis_new_current_tab; // Should save the classes of the tab
		if (analysis_current_tab != undefined) {
			if (analysis_current_tab.includes('analysis-popstruct-section-tab') && !analysis_new_current_tab.includes('analysis-popstruct-section-tab')) {
				// a switch to another tab is happening
				if (cartograplant['generate_fast_structure_running'] == true) {
					var response = confirm("Moving away from this tab while a population structure is running may cause you to miss results and responses");
					console.log('response', response)
					if (response == true) {
						// Let the user continue
						
					}
					else {
						cartograplant['analysis_tab_current'] = analysis_current_tab; // this keeps the old current (not the newly clicked current)
						// event.preventDefault();
						// event.stopPropagation();
						return false;
					}
				}
			}
		}		
	});

	function evaluate_tabs_visibility() {
		console.log('evaluate_tabs_visibility');
		for (var i = 0; i<cartograplant.analysis_tabs_all.length; i++) {
			var selector = cartograplant.analysis_tabs_all[i];
			console.log('selector', selector);
			if (cartograplant.analysis_tabs_enabled.includes(selector)) {
				$(cartograplant.analysis_tabs_enabled[i]).show().parent().show();
			}
			else {
				$(selector).hide().parent().hide();
			}
		}
	}

	$('body').off('click', '.variant-filtering-study-interface .checkboxes input[type="checkbox"]');
	$('body').on('click', '.variant-filtering-study-interface .checkboxes input[type="checkbox"]', function() {
		console.log('CLICK');
		var variable_name = $(this).attr('data-statistic-variable');
		var directive = $(this).attr('data-directive');
		console.log('variable_name', variable_name);
		var study_accession = $(this).closest('.variant-filtering-study-interface').attr('data-study-accession');
		console.log('study_accession', study_accession);
		var histogram_container = 'histogram_' + study_accession + '_' + variable_name;
		var interface = $(this).closest('.variant-filtering-study-interface');
		if ($(this).is(':checked')) {
			var container_object = $('.' + histogram_container);
			console.log('container_object', container_object);
			try {
				container_object.remove();
			}
			catch (err) {
				console.log(err);
			}
			// create container object
			$(interface).find('.statistics-histograms').append('<div style="display: inline-block; padding: 10px;" class="' + histogram_container + '"><i class="fa-solid fa-sync fa-spin"></i> Retrieving ' + variable_name + '... </div>')


			// Get the vcf_filename_without_ext from the parent variant-filtering-study-interface
			var vcf_filename_without_ext = $(this).closest('.variant-filtering-study-interface').attr('data-vcf-filename-without-ext');

			$.ajax({
				url: Drupal.settings.ct_nodejs_api + '/v2/genotypes/variant_filtering_panel_get_statistics',
				method: 'POST',
				data: {
					user_id: Drupal.settings.user.user_id,
					workspace_name: $('#nextflow-create-analysis-select-history').val(),
					analysis_id: cartograplant['current_analysis_id'],
					variable_name: variable_name,
					directive: directive,
					study_accession: study_accession,
					vcf_filename_without_ext: vcf_filename_without_ext
				},
				success: function (data) {
					try {
						console.log('variable data', data);
						var data_object = JSON.parse(data);
						console.log('data_object', data_object);
						var values = [];
						for (var i = 0; i < data_object['values'].length; i++) {
							values.push({
								value: data_object['values'][i]
							})
						}
						console.log('values', values);

						$(interface).find('.statistics-histograms').find('.' + histogram_container).html('');

						
						interactive_histogram_create_v5(
							'.' + histogram_container, 
							variable_name,//unique_id
							variable_name, 
							250, 250, 
							values,['value'], 
							false
						);
					}
					catch (err) {
						console.log(err);
						$(interface).find('.statistics-histograms').append('<div style="display: inline-block; padding: 10px;" class="' + histogram_container + '"><i class="fa-solid fa-sync fa-spin"></i> Could not retrieve statistics for ' + variable_name +  ' </div>')
					}
				}
			});
		}
		else {
			// uncheck
			// remove the histogram
			$(interface).find('.statistics-histograms').find('.' + histogram_container).remove();
		}
	});


	$('#analysis-form').off("hidden.bs.modal");
	$('#analysis-form').on("hidden.bs.modal", function () {
		// put your default event here
		console.log('analysis form closed');
		console.log('performing cleanup');
		try {
			var timer_keys = Object.keys(cartograplant['generate_nextflow_variant_filtering_ui']);
			for (var i = 0; i <= timer_keys.length; i++) {
				var timer_name = timer_keys[i];
				console.log('Removing timer for variant filtering: ' + timer_name);
				clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][timer_name]);
				delete cartograplant['generate_nextflow_variant_filtering_ui'][timer_name];
			}
		} catch (err) { console.log(err) }
		try {
			console.log('Reset current UI tab');
			cartograplant['analysis_filter_snp_section_loaded'] = false;
		} catch (err) {
			console.log(err);
		}
	});

	var generate_nextflow_variant_filtering_ui_timers = {};
	cartograplant['generate_nextflow_variant_filtering_ui'] = generate_nextflow_variant_filtering_ui_timers;
	function generate_nextflow_variant_filtering_ui(options) {
		console.log('generate_nextflow_variant_filtering_ui', options);
		// Version 1 of options was simple
		// var study_accession = options['study_accession'];
		// var vcf_location = options['vcf_location'];
		var studies = Object.keys(options['studies']);
		// Version 2 requires a for loop
		for (var i = 0; i < studies.length; i++) {
			var study_accession = studies[i];
			var vcf_location = "";
			try {
				vcf_location = options['studies'][study_accession][0];
			} catch (err) {}
			console.log('vcf_location', vcf_location);
			if (vcf_location != undefined && vcf_location != null && vcf_location != "") {

				html = '<div style="bottom: 10px;" class="variant-filtering-study-interface" data-study-accession="' + study_accession + '" data-vcf-location="' + vcf_location + '">';
				html += '<table>';
				html += '<tr>';
				html += '<td style="width: 75%; vertical-align: top;">';
				html += '<h4>Variant filtering - ' + study_accession + '</h4>';
				html += '<div class="row" style="margin: 0px;">';
				// html += '	<button class="tag" style="background-color: rgb(16, 166, 137); color: white; border: 0px; padding: 10px; margin-right: 5px;">Generate Site Statistics</button> ';
				// html += '	<button class="tag" style="background-color: rgb(16, 166, 137); color: white; border: 0px; padding: 10px; margin-right: 5px;">Generate Sample Statistics</button>';
				html += '	<button class="tag filter_and_imputation" style="background-color: rgb(16, 166, 137); color: white; border: 0px; padding: 10px; margin-right: 5px;">Filter and Imputation</button>';
				html += '</div>';
				html += '<div class="status-process" style="padding: 5px"></div>';
				html += '<div class="statistics-variables" style="padding: 5px"></div>';
				html += '<code class="command-flags" style="padding: 5px"></code>';
				html += '<h5>Filter and imputation rules</h5>';
				html += '<div class="rules_ui" style="padding: 5px"></div>';
				html += '</div>';
				html += '</td>';;
				html += '<td style="vertical-align: top;">';
				html += '<div style="overflow-y: auto; max-height: 500px;" class="statistics-histograms">';

				html += '</div>';
				html += '</td>';
				html += '</tr>';
				html += '</table>';
				html += '</div>'; // version 2 - 5/6/2025 since it was probably missing before
				$('.nextflow_variant_filtering_pipeline').append(html);
			
			

				// Perform Nextflow Workflow to get the options for this particular VCF
				// and create the rules
				$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
				.html('<i class="fa-solid fa-sync fa-spin"></i> Looking up filtering variables to be used for this VCF file...');


				// cartograplant['generate_nextflow_variant_filtering_ui'][study_accession] = setInterval(function (study_accession, vcf_location) {
				// 	$.ajax({
				// 		url: Drupal.settings.ct_nodejs_api + '/v2/genotypes/variant_filtering_panel_filter_by_genotypes_rules_json',
				// 		method: 'POST',
				// 		data: {
				// 			analysis_id: cartograplant['current_analysis_id'],
				// 			study_accession: study_accession,
				// 			vcf_location: vcf_location
				// 		},
				// 		success: function (data) {
				// 			data = JSON.parse(data);
				// 			console.log('data', data);
				// 			console.log('Polling filter_by_genotypes rules_json', data);
				// 			if (data['status'] == true) {
				// 				console.log('Stopping filter_by_genotypes rules_json timer from polling [' + study_accession +']');
								
				// 				try {
				// 					var keys = Object.keys(data['rules_json']);
				// 					console.log('Rules_json parent keys', keys);
				// 					var rendered_vcf_location = Object.keys(data['rules_json'])[0];

				// 					// Generate the statistics checkboxes
				// 					// var directives_list = Object.keys(data['rules_json'][data['vcf_filename_without_ext']]);
				// 					var directives_list = Object.keys(data['rules_json'][rendered_vcf_location]);

				// 					// Set vcf_filename_without_ext for later use
				// 					$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"]').attr('data-vcf-filename-without-ext', data['vcf_filename_without_ext']);

									
				// 					console.log('directives_list', directives_list);
				// 					var statistics_variables_object = {};

				// 					for (var i = 0; i < directives_list.length; i++) {
				// 						var directive = directives_list[i];
				// 						if (directive == 'INFO' || directive == 'FORMAT') {
				// 							var directive_data = data['rules_json'][rendered_vcf_location][directive];
				// 							console.log('directive_data', directive_data);
				// 							var directive_data_keys = Object.keys(directive_data);
				// 							console.log('directive_data_keys', directive_data_keys);
				// 							for (var j = 0; j < directive_data_keys.length; j++) {
				// 								statistics_variables_object[directive_data_keys[j]] = directive;
				// 							}
				// 						}
				// 					}

				// 					var statistics_variables = Object.keys(statistics_variables_object);
				// 					console.log('statistics_variables_object', statistics_variables_object);
				// 					$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables')
				// 					.append('<h5>Statistics variables</h5>');
				// 					$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables')
				// 					.append('<div class="checkboxes"></div>');
				// 					for (var i = 0; i < statistics_variables.length; i++) {
				// 						console.log('statistics_variable', statistics_variables[i]);
				// 						var directive = statistics_variables_object[statistics_variables[i]];
				// 						var statistics_variable_human_readable_name = data['rules_json'][rendered_vcf_location][directive][statistics_variables[i]]['Description'];
				// 						$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables .checkboxes')
				// 						.append('<div style="display: inline-block; margin-right: 10px;"><input type="checkbox" data-statistic-variable="' + statistics_variables[i] + '" /> ' + statistics_variable_human_readable_name + '</div>');
				// 					}

				// 					$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
				// 					.html('🌟 Filtering variables retrieved, rules can now be created.');

				// 					$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"]').attr('data-rules_data', btoa(JSON.stringify(data)));

				// 					// TODO work on the options which we need to put into the container
				// 					if (data['study_accession'] != undefined) {
				// 						// generate_nextflow_variant_filtering_ui_add_rule({
				// 						// 	study_accession: data['study_accession']
				// 						// });
				// 						var rules_basic = {
				// 							condition: 'AND',
				// 							rules: [
				// 							{
				// 							id: 'price',
				// 							operator: 'less',
				// 							value: 10.25
				// 							}, 
				// 							{
				// 							condition: 'OR',
				// 							rules: [
				// 								{
				// 								id: 'category',
				// 								operator: 'equal',
				// 								value: 2
				// 								}, 
				// 								{
				// 									id: 'category',
				// 									operator: 'equal',
				// 									value: 1
				// 								}
				// 							]
				// 							}
				// 							]
				// 						};

				// 						var query_builder_filters = {
				// 							filters: []
				// 						};
				// 						var study_specific_options = data['rules_json'][rendered_vcf_location];
				// 						var directives_list = Object.keys(study_specific_options);
				// 						for (var i = 0; i < directives_list.length; i++) {
				// 							try {

				// 								var directive = directives_list[i];
				// 								var directive_human_readable_name = study_specific_options['uiMetaData'][directive];
				// 								var options = study_specific_options[directive];
				// 								var options_keys = Object.keys(study_specific_options[directive]);
				// 								if (typeof options === 'object' && Array.isArray(options) == false && directive != 'uiMetaData') {
				// 									console.log('options', options);
				// 									console.log('options_keys', options_keys);

				// 									var filter_variable_object = {
				// 										id: directive,
				// 										label: directive_human_readable_name,
				// 										data: {
				// 											study_accession: data['study_accession']
				// 										},
				// 										type: 'string',
				// 										// input: 'select',
				// 										input: function(rule, name) {
				// 											var $container = rule.$el.find('.rule-value-container');
				// 										},
				// 										operators: [
				// 											'equal',
				// 											'greater',
				// 											'less'
				// 										],
				// 										values: {},
				// 										valueGetter: function(rule) {
				// 											return rule.$el.find('.rule-value-container select').val()
				// 												+ '-DELIMITER-' + rule.$el.find('.rule-value-container input').val();
				// 										},
				// 										// valueSetter: function(rule, value) {
				// 										// 	if (rule.operator.nb_inputs > 0) {
				// 										// 		var val = value.split('.');
														
				// 										// 		rule.$el.find('.rule-value-container select').val(val[0]).trigger('change');
				// 										// 		rule.$el.find('.rule-value-container input').val(val[1]).trigger('change');
				// 										// 	}
				// 										// }
				// 									}
				// 									var select_html = '<select style="padding: 10px;">';
				// 									for (var j = 0; j < options_keys.length; j++) {
				// 										var raw_variable = options_keys[j];
				// 										var variable_options_object = options[raw_variable];
				// 										select_html += '<option value="' + raw_variable + '">' + variable_options_object['Description'] + '</option>';
				// 										// filter_variable_object['values'][raw_variable] = variable_options_object['Description'];
				// 									}
				// 									select_html += '</select>';
				// 									select_html += ' <input style="padding: 6px;" type="text" class="value_raw" placeholder="value" />';
				// 									if (cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']] == undefined) {
				// 										cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']] = {};
				// 									}
				// 									cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']][directive] = select_html;
				// 									filter_variable_object['input'] = function(rule, name) {
				// 										var rule_element = rule.$el;
				// 										var directive = rule_element.find('.rule-filter-container select').val();
				// 										console.log('directive', directive);

				// 										console.log('custom rules_ui input');
				// 										console.log('rule', rule);
				// 										console.log('name', name);
				// 										console.log('ui_values_study', cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']]);
				// 										console.log(cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive]);
				// 										var html = cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive];
				// 										return html;
				// 									}
				// 									query_builder_filters['filters'].push(filter_variable_object);

				// 									console.log('filter_variable_object', filter_variable_object);
				// 								}
				// 							} catch (err) { console.log(err) }
				// 						}
				// 						console.log('query_builder_filters', query_builder_filters);

				// 						// Shared (copied from above code)
				// 						var study_specific_options = data['rules_json'];
				// 						console.log('study_specific_options', study_specific_options);
				// 						var directives_list = ['Shared'];
				// 						console.log('directives_list', directives_list);
				// 						for (var i = 0; i < directives_list.length; i++) {
				// 							try {
				// 								var directive = directives_list[i];
				// 								var options = study_specific_options[directive];
				// 								var options_keys = Object.keys(study_specific_options[directive]);
				// 								console.log('options', options);
				// 								console.log('options_keys', options_keys);
				// 								if (typeof options === 'object' && Array.isArray(options) == false) {


				// 									var filter_variable_object = {
				// 										id: directive,
				// 										label: directive,
				// 										data: {
				// 											study_accession: data['study_accession']
				// 										},
				// 										type: 'string',
				// 										// input: 'select',
				// 										input: function(rule, name) {
				// 											var $container = rule.$el.find('.rule-value-container');
				// 										},
				// 										operators: [
				// 											'equal',
				// 											'greater',
				// 											'less'
				// 										],
				// 										values: {},
				// 										valueGetter: function(rule) {
				// 											return rule.$el.find('.rule-value-container select').val()
				// 												+ '-DELIMITER-' + rule.$el.find('.rule-value-container input').val();
				// 										},
				// 										// valueSetter: function(rule, value) {
				// 										// 	if (rule.operator.nb_inputs > 0) {
				// 										// 		var val = value.split('.');
														
				// 										// 		rule.$el.find('.rule-value-container select').val(val[0]).trigger('change');
				// 										// 		rule.$el.find('.rule-value-container input').val(val[1]).trigger('change');
				// 										// 	}
				// 										// }
				// 									}
				// 									var select_html = '<select style="padding: 10px;">';
				// 									for (var j = 0; j < options_keys.length; j++) {
				// 										var raw_variable = options_keys[j];
				// 										var variable_options_object = options[raw_variable];
				// 										select_html += '<option value="' + raw_variable + '">' + variable_options_object['Description'] + '</option>';
				// 										// filter_variable_object['values'][raw_variable] = variable_options_object['Description'];
				// 									}
				// 									select_html += '</select>';
				// 									select_html += ' <input style="padding: 6px;" type="text" class="value_raw" placeholder="value" />';
				// 									if (cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']] == undefined) {
				// 										cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']] = {};
				// 									}
				// 									cartograplant['analysis_variant_filtering_rules_ui_values_' + data['study_accession']][directive] = select_html;
				// 									filter_variable_object['input'] = function(rule, name) {
				// 										var rule_element = rule.$el;
				// 										var directive = rule_element.find('.rule-filter-container select').val();
				// 										console.log('directive', directive);

				// 										console.log('custom rules_ui input');
				// 										console.log('rule', rule);
				// 										console.log('name', name);
				// 										console.log('ui_values_study', cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']]);
				// 										console.log(cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive]);
				// 										var html = cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive];
				// 										return html;
				// 									}
				// 									query_builder_filters['filters'].push(filter_variable_object);

				// 									console.log('filter_variable_object', filter_variable_object);
				// 								}
				// 							} catch (err) { 
				// 								console.log(err);
				// 							}
				// 						}
				// 						console.log('query_builder_filters', query_builder_filters);
								
				// 						$('.variant-filtering-study-interface[data-study-accession="' + data['study_accession'] + '"] .rules_ui').queryBuilder(
				// 							query_builder_filters
				// 						);
				// 					}

				// 					clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][study_accession]);
				// 					delete cartograplant['generate_nextflow_variant_filtering_ui'][study_accession];
				// 				}
				// 				catch (err) {
				// 					console.log(err)
				// 				}
				// 			}
				// 		}
				// 	});
				// }, 7000, study_accession, vcf_location);

				// Version 2 due to Gabe's changes on 9/8/2025
				cartograplant['generate_nextflow_variant_filtering_ui'][study_accession] = setInterval(function (study_accession, vcf_location) {
					$.ajax({
						url: Drupal.settings.ct_nodejs_api + '/v2/genotypes/variant_filtering_panel_filter_by_genotypes_completion_json',
						method: 'POST',
						data: {
							analysis_id: cartograplant['current_analysis_id'],
							study_accession: study_accession,
							vcf_location: vcf_location
						},
						success: function (data) {
							data = JSON.parse(data);
							console.log('data', data);
							console.log('Polling filter_by_genotypes completion_json', data);
							if (data['success'] == "true") {
								analysis_completion_json['analysis_study_filter_markers_and_genotypes'][data['ui_study_accession']] = data;
								var study_accession = data['ui_study_accession'];
								console.log('Stopping filter_by_genotypes completion_json timer from polling [' + study_accession +']');
								
								try {
									var vcf_loc = data['studies'][data['ui_study_accession']]['vcf'];
									var vcf_loc_slash_parts = vcf_loc.split('/');
									var vcf_filename_without_ext = vcf_loc_slash_parts[vcf_loc_slash_parts.length - 1];
									// var header_vcf = Object.keys(data['studies'][data['ui_study_accession']]['header'])[0];
									// var study_rules_json = data['studies'][data['ui_study_accession']]['header'][header_vcf];
									var study_rules_json = data['studies'][data['ui_study_accession']]['header'];
									var keys = Object.keys(study_rules_json);
									console.log('Rules_json parent keys', keys);
									// var rendered_vcf_location = Object.keys(data['rules_json'])[0];

									// Generate the statistics checkboxes
									// var directives_list = Object.keys(data['rules_json'][data['vcf_filename_without_ext']]);
									var directives_list = Object.keys(study_rules_json);

									// Set vcf_filename_without_ext for later use
									$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"]').attr('data-vcf-filename-without-ext', vcf_filename_without_ext);

									
									console.log('directives_list', directives_list);
									var statistics_variables_object = {};

									for (var i = 0; i < directives_list.length; i++) {
										var directive = directives_list[i];
										if (directive == 'INFO' || directive == 'FORMAT' || directive == 'INDV') {
											var directive_data = study_rules_json[directive];
											console.log('directive_data', directive_data);
											var directive_data_keys = Object.keys(directive_data);
											console.log('directive_data_keys', directive_data_keys);
											for (var j = 0; j < directive_data_keys.length; j++) {
												statistics_variables_object[directive_data_keys[j]] = directive;
											}
										}
									}

									var statistics_variables = Object.keys(statistics_variables_object);
									console.log('statistics_variables_object', statistics_variables_object);
									$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables')
									.append('<h5>Statistics variables</h5>');
									$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables')
									.append('<div class="checkboxes"></div>');
									for (var i = 0; i < statistics_variables.length; i++) {
										console.log('statistics_variable', statistics_variables[i]);
										var directive = statistics_variables_object[statistics_variables[i]];
										var statistics_variable_human_readable_name = study_rules_json[directive][statistics_variables[i]]['Description'];
										$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .statistics-variables .checkboxes')
										.append('<div style="display: inline-block; margin-right: 10px;"><input type="checkbox" data-directive="' + directive + '" data-statistic-variable="' + statistics_variables[i] + '" /> ' + statistics_variable_human_readable_name + '</div>');
									}

									$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
									.html('🌟 Filtering variables retrieved, rules can now be created.');

									$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"]').attr('data-rules_data', btoa(JSON.stringify(study_rules_json)));

									// TODO work on the options which we need to put into the container
									if (data['ui_study_accession'] != undefined) {
										// generate_nextflow_variant_filtering_ui_add_rule({
										// 	study_accession: data['study_accession']
										// });
										var rules_basic = {
											condition: 'AND',
											rules: [
											{
											id: 'price',
											operator: 'less',
											value: 10.25
											}, 
											{
											condition: 'OR',
											rules: [
												{
												id: 'category',
												operator: 'equal',
												value: 2
												}, 
												{
													id: 'category',
													operator: 'equal',
													value: 1
												}
											]
											}
											]
										};

										var query_builder_filters = {
											filters: []
										};
										var study_specific_options = study_rules_json;
										var directives_list = Object.keys(study_specific_options);
										for (var i = 0; i < directives_list.length; i++) {
											try {

												var directive = directives_list[i];
												// var directive_human_readable_name = study_specific_options['uiMetaData'][directive];
												var options = study_specific_options[directive];
												var options_keys = Object.keys(study_specific_options[directive]);
												if (typeof options === 'object' && Array.isArray(options) == false && directive != 'uiMetaData') {
													console.log('options', options);
													console.log('options_keys', options_keys);

													var filter_variable_object = {
														id: directive,
														// label: directive_human_readable_name,
														label: directive,
														data: {
															study_accession: data['ui_study_accession']
														},
														type: 'string',
														// input: 'select',
														input: function(rule, name) {
															var $container = rule.$el.find('.rule-value-container');
														},
														operators: [
															'equal',
															'greater',
															'less'
														],
														values: {},
														valueGetter: function(rule) {
															return rule.$el.find('.rule-value-container select').val()
																+ '-DELIMITER-' + rule.$el.find('.rule-value-container input').val();
														},
														// valueSetter: function(rule, value) {
														// 	if (rule.operator.nb_inputs > 0) {
														// 		var val = value.split('.');
														
														// 		rule.$el.find('.rule-value-container select').val(val[0]).trigger('change');
														// 		rule.$el.find('.rule-value-container input').val(val[1]).trigger('change');
														// 	}
														// }
													}
													var select_html = '<select style="padding: 10px;">';
													for (var j = 0; j < options_keys.length; j++) {
														var raw_variable = options_keys[j];
														var variable_options_object = options[raw_variable];
														select_html += '<option value="' + raw_variable + '">' + variable_options_object['Description'] + '</option>';
														// filter_variable_object['values'][raw_variable] = variable_options_object['Description'];
													}
													select_html += '</select>';
													select_html += ' <input style="padding: 6px;" type="text" class="value_raw" placeholder="value" />';
													if (cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']] == undefined) {
														cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']] = {};
													}
													cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']][directive] = select_html;
													filter_variable_object['input'] = function(rule, name) {
														var rule_element = rule.$el;
														var directive = rule_element.find('.rule-filter-container select').val();
														console.log('directive', directive);

														console.log('custom rules_ui input');
														console.log('rule', rule);
														console.log('name', name);
														console.log('ui_values_study', cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']]);
														console.log(cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive]);
														var html = cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive];
														return html;
													}
													query_builder_filters['filters'].push(filter_variable_object);

													console.log('filter_variable_object', filter_variable_object);
												}
											} catch (err) { console.log(err) }
										}
										console.log('query_builder_filters', query_builder_filters);

										// Shared (copied from above code)
										var study_specific_options = study_rules_json;
										console.log('study_specific_options', study_specific_options);
										var directives_list = ['Shared'];
										console.log('directives_list', directives_list);
										for (var i = 0; i < directives_list.length; i++) {
											try {
												var directive = directives_list[i];
												var options = study_specific_options[directive];
												var options_keys = Object.keys(study_specific_options[directive]);
												console.log('options', options);
												console.log('options_keys', options_keys);
												if (typeof options === 'object' && Array.isArray(options) == false) {


													var filter_variable_object = {
														id: directive,
														label: directive,
														data: {
															study_accession: data['ui_study_accession']
														},
														type: 'string',
														// input: 'select',
														input: function(rule, name) {
															var $container = rule.$el.find('.rule-value-container');
														},
														operators: [
															'equal',
															'greater',
															'less'
														],
														values: {},
														valueGetter: function(rule) {
															return rule.$el.find('.rule-value-container select').val()
																+ '-DELIMITER-' + rule.$el.find('.rule-value-container input').val();
														},
														// valueSetter: function(rule, value) {
														// 	if (rule.operator.nb_inputs > 0) {
														// 		var val = value.split('.');
														
														// 		rule.$el.find('.rule-value-container select').val(val[0]).trigger('change');
														// 		rule.$el.find('.rule-value-container input').val(val[1]).trigger('change');
														// 	}
														// }
													}
													var select_html = '<select style="padding: 10px;">';
													for (var j = 0; j < options_keys.length; j++) {
														var raw_variable = options_keys[j];
														var variable_options_object = options[raw_variable];
														select_html += '<option value="' + raw_variable + '">' + variable_options_object['Description'] + '</option>';
														// filter_variable_object['values'][raw_variable] = variable_options_object['Description'];
													}
													select_html += '</select>';
													select_html += ' <input style="padding: 6px;" type="text" class="value_raw" placeholder="value" />';
													if (cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']] == undefined) {
														cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']] = {};
													}
													cartograplant['analysis_variant_filtering_rules_ui_values_' + data['ui_study_accession']][directive] = select_html;
													filter_variable_object['input'] = function(rule, name) {
														var rule_element = rule.$el;
														var directive = rule_element.find('.rule-filter-container select').val();
														console.log('directive', directive);

														console.log('custom rules_ui input');
														console.log('rule', rule);
														console.log('name', name);
														console.log('ui_values_study', cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']]);
														console.log(cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive]);
														var html = cartograplant['analysis_variant_filtering_rules_ui_values_' + rule.filter.data['study_accession']][directive];
														return html;
													}
													query_builder_filters['filters'].push(filter_variable_object);

													console.log('filter_variable_object', filter_variable_object);
												}
											} catch (err) { 
												console.log(err);
											}
										}
										console.log('query_builder_filters', query_builder_filters);
								
										$('.variant-filtering-study-interface[data-study-accession="' + data['ui_study_accession'] + '"] .rules_ui').queryBuilder(
											query_builder_filters
										);
									}

									clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][study_accession]);
									delete cartograplant['generate_nextflow_variant_filtering_ui'][study_accession];
								}
								catch (err) {
									console.log(err)
								}
							}
						}
					});
				}, 7000, study_accession, vcf_location);				
			}
			else {
				$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
				.html('No VCF found for this study, this study will not be used for filtering');
				// $('.nextflow_variant_filtering_pipeline').append('<div style="padding: 10px; background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; border-radius: 5px; margin-bottom: 10px;">No VCF file found for this study ' + study_accession + '</div>');
			}
		}

		// TODO: call the api
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + '/v2/genotypes/variant_filtering_panel_filter_by_genotypes',
			method: 'POST',
			// Version 1
			// data: {
			// 	user_id: Drupal.settings.user.user_id,
			// 	workspace_name: $('#nextflow-create-analysis-select-history').val(),
			// 	analysis_id: cartograplant['current_analysis_id'],
			// 	study_accession: study_accession,
			// 	vcf_location: vcf_location
			// },
			// Version 2 5/6/2025
			data: {
				user_id: Drupal.settings.user.user_id,
				workspace_name: $('#nextflow-create-analysis-select-history').val(),
				analysis_id: cartograplant['current_analysis_id'],
				structured_json: JSON.stringify(options),
				//study_accession: study_accession,
				//vcf_location: vcf_location
			},
			success: function (data) {

				data = JSON.parse(data);
				console.log('data', data);
				if (data['status'] != undefined) {
					// Version 1
					// var study_accession = data['study_accession'];
					// if (data['status'] == 'failed') {
					// 	try {
					// 		clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][study_accession]);
					// 		delete cartograplant['generate_nextflow_variant_filtering_ui'][study_accession];
					// 	} catch (err) { console.log(err) }
					// 	$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
					// 	.html('Filtering by genotypes sub process has failed<br />' + JSON.stringify(data['error_msg']));
					// }
					// Version 2
					var studies = data['studies'];
					for (var i = 0; i < studies.length; i++) {
						var study_accession = studies[i];
						if (data['status'] == 'failed') {
							try {
								clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][study_accession]);
								delete cartograplant['generate_nextflow_variant_filtering_ui'][study_accession];
							} catch (err) { console.log(err) }
							if ($('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process').html().includes('filtering variables')) {
								$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process').html('Filtering by genotypes sub process has failed<br />' + JSON.stringify(data['error_msg']));
							}
						}
					}
				}

			}
		});

		// generate_nextflow_variant_filtering_ui_add_rule(study_accession);
	}
	cartograplant['generate_nextflow_variant_filtering_ui'] = generate_nextflow_variant_filtering_ui;


	$('body').off('click', '.nextflow_variant_filter_ui_remove_rule');
	$('body').on('click', '.nextflow_variant_filter_ui_remove_rule', function() {
		if ($(this).closest('.variant-filtering-study-interface').find('.nextflow_variant_filtering_ui_rule').length >= 2) {
			$(this).closest('.nextflow_variant_filtering_ui_rule').fadeOut(100).remove();
		}
		else {
			alert('You must have at least one rule');
		}
	});

	$('body').off('click', '.filter_and_imputation');
	$('body').on('click', '.filter_and_imputation', function() {
		var study_accession = $(this).closest('.variant-filtering-study-interface').attr('data-study-accession');
		var vcf_location = $(this).closest('.variant-filtering-study-interface').attr('data-vcf-location');
		var variant_filtering_study_interface_element = $(this).closest('.variant-filtering-study-interface');
		var rules_json = $('.nextflow_variant_filtering_pipeline .rules_ui').queryBuilder('getRules');
		var cmd = '';
		var cmd_result = variant_filtering_study_interface(rules_json, undefined, 0, 0);
		console.log('rules_json', rules_json);
		console.log('rules_json_stringified', JSON.stringify(rules_json));
		var filter = cmd_result;
		$(variant_filtering_study_interface_element).find('.command-flags').html(cmd_result);
		$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
		.html('<i class="fa-solid fa-sync fa-spin"></i> Performing filtering...');

		var payload = analysis_completion_json['analysis_study_context'];
		console.log('DEBUG: analysis_study_context', analysis_completion_json['analysis_study_context'])
		console.log('DEBUG: payload', payload);
		console.log('DEBUG: analysis_study_filter_markers_and_genotypes', analysis_completion_json['analysis_study_filter_markers_and_genotypes']);
		// payload['studies'][study_accession]['vcf'] = analysis_completion_json['analysis_study_filter_markers_and_genotypes'][study_accession]['studies'][study_accession]['vcf'];
		payload = analysis_filter_and_imputation_structure_json;
		if (payload == null || payload == undefined) {
			alert('Payload is empty, this data comes from the study context step, please redo that step.');
		}
		console.log('Payload generated for variant_filtering_panel_filter_and_imputation', payload);


		$.ajax({
			url: Drupal.settings.ct_nodejs_api + '/v2/genotypes/variant_filtering_panel_filter_and_imputation',
			method: 'POST',
			data: {
				user_id: Drupal.settings.user.user_id,
				workspace_name: $('#nextflow-create-analysis-select-history').val(),
				analysis_id: cartograplant['current_analysis_id'],
				study_accession: study_accession,
				vcf_location: vcf_location,
				filter: filter,
				payload: JSON.stringify(payload)
			},
			success: function (data) {
				$('.variant-filtering-study-interface[data-study-accession="' + study_accession + '"] .status-process')
				.html('Filtering has completed.');
				console.log('Filter and imputation data response', data);
				data = JSON.parse(data);
				if (data['completion_message'] != undefined) {
					console.log('data completion_message', data['completion_message']);
					$('#analysis_summary_genotypes_count').html(data['completion_message']['studies']['combined_filltags']['markerCount'] + ' filtered');
					$('#analysis_summary_plants_count').html(data['completion_message']['studies']['combined_filltags']['sampleCount'] + ' filtered');
				}
			}
		});


	});

	function variant_filtering_study_interface(json, parent_json, rules_index, rules_total) {
		// This is an actual group
		if (json['condition'] != undefined) {
			var condition = json['condition'];
			console.log(condition);
			var real_condition = '';
			switch (condition) {
				case 'AND':
				real_condition = '&&';
				break;
				case 'OR':
				real_condition = '||';
				break;
			}
      		var rules = json['rules'];
			var str = '';
			//str += '(';
			for (var i = 0; i < rules.length; i++) {
				var rule = rules[i];
				if (i > 0) {
					str += real_condition + ' ';
				}
				str += " (" + variant_filtering_study_interface(rule, json, i + 1, rules.length) + ") ";
			}
			// str += ')';
      		console.log(str);
			return str;
    	}
		else  {
			var condition = parent_json['condition'];
			var real_condition = '';
			switch (condition) {
			case 'AND':
				real_condition = '&&';
				break;
			case 'OR':
				real_condition = '||';
				break;
			}
		
			var rule = json;
			var directive = rule['field'];
			var operator = rule['operator'];
			var value = rule['value'];
			// console.log(directive, operator, value);

			var real_operator = '';
			switch (operator) {
				case 'equal':
					real_operator = '=';
					break;
				case 'greater':
					real_operator = '>';
					break;
				case 'less':
					real_operator = '<';
					break;
			}

			var formula_parts = value.split('-DELIMITER-');
			var variable = formula_parts[0];
			var value = formula_parts[1];

			var str = '';
			// Original version
			// if (rules_index > 1) {
			// 			str += ' ' + real_condition + ' ';
			// }
			if (rules_index > 1 && parent_json['rules'].length == rules_index) {
				str += ' ' + real_condition + ' ';
			}
			if (parent_json['rules'].length == rules_index) {
				str = '';
			}

			// AI Version that did not work as well
			// if (rules_index > 1 && rules_index <= rules_total) {
			// 	str += ' ' + real_condition + ' ';
			// }


			console.log(rules_total);
			str += directive + '/' + variable + ' ' + real_operator + ' ' + value;
			console.log('str', str);
			// cmd = cmd + ' ' + str;
			return str;
		}
	}

	// RECURSIVE FUNCTION TO GENERATE THE FILTER flags
	function variant_filtering_study_interface_v1(json, condition, cmd, nest = 0) {
		console.log('nest', nest);
		console.log('json_condition', json['condition']);
		if (json['condition'] == undefined) {
			console.log('json', json);
			console.log('cmd', cmd);
			var real_condition = '';
			switch (condition) {
				case 'AND':
					real_condition = '&&';
					break;
				case 'OR':
					real_condition = '||';
					break;
			}

			if (nest <= 1) {
				cmd += real_condition + ' ';
			}
			cmd += '(';
			var rules = json;
			if (rules != undefined) {

				for (var i = 0; i < rules.length; i++) {
					console.log('rule number', i);
					var rule = rules[i];

					
					if (rule['condition'] != undefined) {
						cmd = variant_filtering_study_interface(rule['rules'], rule['condition'], cmd, nest + 1);
					} 
					else {
						//cmd += '(';
						var directive = rule['field'];
						var operator = rule['operator'];
						var value = rule['value'];
						console.log(directive, operator, value);
  
						var real_operator = '';
						switch (operator) {
							case 'equal':
								real_operator = '=';
								break;
							case 'greater':
								real_operator = '>';
								break;
							case 'less':
								real_operator = '<';
								break;
						}
  
  
  
						var formula_parts = value.split('-DELIMITER-');
						var variable = formula_parts[0];
						var value = formula_parts[1];
  
  
						var str = directive + '/' + variable + ' ' + real_operator + ' ' + value;
						console.log('str', str);
						// if (i != 0) {
						// 	cmd += ' ' + real_condition;
						// }
						cmd = cmd + ' ' + str + ' ';
						// cmd += ')';
						console.log('piece_cmd', cmd);
						// return cmd;
					}
				}
			}
			cmd += ')';
			// if (nest >= 1) {
			// 	if (rules['rules'] != undefined) {
			// 		cmd = real_condition + ' ' + cmd ;
			// 	}
			// }
			console.log(cmd);
			return cmd;
		} else {
			console.log('recursive call since there is a condition');
			return variant_filtering_study_interface(json['rules'], json['condition'], cmd, nest + 1);
		}
	}

	$('#analysis_type').change(function() {
		analysis_update_type();
		var val = $('#analysis_type').val();
		console.log('analysis_type', val);
		if(val == 'GxPxE') {
			cartograplant.analysis_tabs_enabled = [
				'#analysis-initial-configuration-tab',
				'#analysis-overlapping-traits-tab',
				'#analysis-overlapping-genotypes-tab',
				'#analysis-filter-snp-section-tab',
				'#analysis-popstruct-section-tab',
				// '.analysis-filter-indv-section',
				'#analysis-retrieve-envdata-section-tab',
				'#analysis-create-analysis-section-tab',
				'#analysis-confirm-section-tab'
			];
			evaluate_tabs_visibility();
			// $('#analysis-initial-configuration-tab').show().parent().show();
			// $('#analysis-overlapping-traits-tab').show().parent().show();
			// $('#analysis-overlapping-genotypes-tab').show().parent().show();
			// $('.analysis-filter-snp-section').show().parent().show();
			// $('.analysis-filter-indv-section').show().parent().show();
			// $('#analysis-retrieve-envdata-section-tab').show().parent().show();
		}
		else if(val == "GxP") {
			cartograplant.analysis_tabs_enabled = [
				'#analysis-initial-configuration-tab',
				'#analysis-overlapping-traits-tab',
				'#analysis-overlapping-genotypes-tab',
				'#analysis-filter-snp-section-tab',
				'#analysis-popstruct-section-tab',
				// '.analysis-filter-indv-section',
				'#analysis-create-analysis-section-tab',
				'#analysis-confirm-section-tab'
			];
			evaluate_tabs_visibility();
			// $('#analysis-initial-configuration-tab').show().parent().show();
			// $('#analysis-overlapping-traits-tab').show().parent().show();
			// $('#analysis-overlapping-genotypes-tab').show().parent().show();
			// $('.analysis-filter-snp-section').show().parent().show();
			// $('.analysis-filter-indv-section').show().parent().show();
			// $('#analysis-retrieve-envdata-section-tab').hide().parent().hide();			
		}
		else if(val == "GxE") {
			cartograplant.analysis_tabs_enabled = [
				'#analysis-initial-configuration-tab',
				'#analysis-overlapping-genotypes-tab',
				'#analysis-filter-snp-section-tab',
				// '.analysis-filter-indv-section',
				'#analysis-popstruct-section-tab',
				'#analysis-retrieve-envdata-section-tab',
				'#analysis-create-analysis-section-tab',
				'#analysis-confirm-section-tab'
			];
			evaluate_tabs_visibility();
			// $('#analysis-initial-configuration-tab').show().parent().show();
			// $('#analysis-overlapping-traits-tab').hide().parent().hide();
			// $('#analysis-overlapping-genotypes-tab').show().parent().show();
			// $('.analysis-filter-snp-section').show().parent().show();
			// $('.analysis-filter-indv-section').show().parent().show();
			// $('#analysis-retrieve-envdata-section-tab').show().parent().show();			
		}	
	});

	function analysis_summary_update() {
		var html = "";

		// Analysis ID
		$('#analysis_summary_html').html(html);
		var el_aid = $('<div class="d-inline-block tag" style="background-color: rgb(94 199 64); color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 5em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Analysis ID</div><div style="text-align: center;">' + cartograplant.current_analysis_id + '</div></div>').fadeOut(100);
		
		// Studies count
		var studies = Object.keys(cartograplant.detected_studies);
		$('#analysis-num-pub').html(studies.length);
		var el_st = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 5em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Studies</div><div style="text-align: center;">' + studies.length + '</div></div>').fadeOut(100);

		// Trees count
		var trees_count = analysis_includedTrees.length;
		//$('#analysis-num-pub').html(trees_count);
		var el_tc = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 6em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Plants</div><div id="analysis_summary_plants_count" style="text-align: center;">' + trees_count + '</div></div>').fadeOut(100);


		// // Unique Species count
		// // Try to get species for each selected tree
		// var species_unique = [];
		// for (var i = 0; i < analysis_includedTrees.length; i++) {
		// 	var tree = cartograplant.searchTreeDataStore(analysis_includedTrees[i]);
		// 	var species = "";
		// 	try {
		// 		species = tree.data.species.toLowerCase();
		// 		console.log('tree ' + (i+1) + ' species', species);
		// 	}
		// 	catch(err) {

		// 	}
		// 	if(species_unique.includes(species) != true) {
		// 		species_unique.push(species);
		// 	}
		// }
		console.log('unique species', cartograplant['analysis_unique_species']);
		//if (cartograplant['analysis_unique_species'] == undefined) {
		cartograplant['analysis_unique_species'] = {}; // reset
		//}

		// Check whether the studies checkboxes are checked, if they are, add it to the (cartograplant['analysis_unique_species'])
		var study_selected_checkboxes = $('#analysis_detections_study_summary .checkbox_option input[type="checkbox"]');
		for (var i = 0; i < study_selected_checkboxes.length; i++) {
			var checkbox = study_selected_checkboxes.eq(i);
			if (checkbox.is(':checked')) {
				// Get the closest tr that contains the attribute data-species
				var tr_element = checkbox.closest('tr');
				var species = tr_element.attr('data-species');
				if (species != undefined) {
					cartograplant['analysis_unique_species'][species] = true;
				}
			}
		}

		var el_sp = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 7em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Species</div><div style="text-align: center;">' + Object.keys(cartograplant['analysis_unique_species']).length + '</div></div>').fadeOut(100);
		// $('#analysis-num-species').html(species_unique.length);
		$('#analysis-num-species').html(Object.keys(cartograplant['analysis_unique_species']).length);


		var phenotypes_selected_count = 0;
		// Calculate phenotypes_selects_count
		if ($('.trait_select_checkbox').length != undefined) {
			var elements = $('.trait_select_checkbox');
			// console.log('elements', elements);
			for(var i=0; i<elements.length; i++) {
				if(elements.eq(i).is(':checked')) {
					phenotypes_selected_count += 1;
				}
			}
		}
		$('#analysis-phenotypes').html(phenotypes_selected_count);
		var el_ph = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 8em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Phenotypes</div><div style="text-align: center;">' + phenotypes_selected_count + '</div></div>').fadeOut(100);
		var genotypes_selected_count = 0;
		var elements = $('#analysis-overlapping-genotypes-upset-2 .checkbox_image');
		for(var i=0; i<elements.length; i++) {
			var checkbox = elements.eq(i);
			if (checkbox.css('display') == 'block') {
				var text_el = checkbox.closest('g').find('text[class^="cBarTextStyle-upset-"]');
				genotypes_selected_count += parseInt(text_el.html().replaceAll(',',''));
			}
		}
		


		// // snp_overlap_checkbox
		// if ($('.snp_all_checkbox').length != undefined) {
		// 	var elements = $('.snp_all_checkbox');
		// 	// console.log('elements', elements);
		// 	for(var i=0; i<elements.length; i++) {
		// 		if(elements.eq(i).is(':checked')) {
		// 			// sum the counts attribute
		// 			var count = elements.eq(i).attr('count');
		// 			if(count != undefined) {
		// 				genotypes_selected_count += parseInt(count);
		// 			}
		// 		}
		// 	}
		// }

		// // snp_overlap_checkbox
		// if ($('.snp_overlap_checkbox').length != undefined) {
		// 	var elements = $('.snp_overlap_checkbox');
		// 	// console.log('elements', elements);
		// 	for(var i=0; i<elements.length; i++) {
		// 		if(elements.eq(i).is(':checked')) {
		// 			// sum the counts attribute
		// 			var count = elements.eq(i).attr('count');
		// 			if(count != undefined) {
		// 				genotypes_selected_count += parseInt(count);
		// 			}
		// 		}
		// 	}
		// }


		// // snp_none_overlap_checkbox
		// if ($('.snp_none_overlap_checkbox').length != undefined) {
		// 	var elements = $('.snp_none_overlap_checkbox');
		// 	// console.log('elements', elements);
		// 	for(var i=0; i<elements.length; i++) {
		// 		if(elements.eq(i).is(':checked')) {
		// 			// sum the counts attribute
		// 			var count = elements.eq(i).attr('count');
		// 			if(count != undefined) {
		// 				genotypes_selected_count += parseInt(count);
		// 			}
		// 		}
		// 	}
		// }



		var el_ge = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 9em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Genotypes</div><div id="analysis_summary_genotypes_count" style="text-align: center;">' + genotypes_selected_count + '</div></div>').fadeOut(100);
		
		var environmentals_selected_count = 0;
		$('.analysis_category_groups_layer_property_checkbox').each(function () {
			if ($(this).is(':checked')) {
				environmentals_selected_count = environmentals_selected_count + 1;
			}
		});
		$('#analysis-env-vals').html(environmentals_selected_count);
		var el_el = $('<div class="d-inline-block tag" style="background-color: rgb(16, 166, 137);color: rgb(255, 255, 255);margin-right: 10px;/* padding: 10px; */padding-left: 0px !important;padding-right: 0px !important;border-radius: 8px;width: 10em;"><div style="font-size: 12px;background-color: #00000033;margin: 0px !important;padding: 2px;text-align: center;">Environmental layers</div><div style="text-align: center;">' + environmentals_selected_count + '</div></div>').fadeOut(100);
		

		//$('#analysis_summary_html').html(html);
		$('#analysis_summary_html').append(el_aid).append(el_st).append(el_tc).append(el_sp).append(el_ph).append(el_ge).append(el_el);
		$(el_aid).fadeOut(200).delay(0).fadeIn(500);
		$(el_st).fadeOut(200).delay(1000).fadeIn(500);
		$(el_tc).fadeOut(200).delay(1000).fadeIn(500);
		$(el_ph).fadeOut(200).delay(2000).fadeIn(500);
		$(el_ge).fadeOut(200).delay(4000).fadeIn(500);
		$(el_el).fadeOut(200).delay(6000).fadeIn(500);
	}

	function analysis_update_type() {
		// Delete the value
		$.ajax({
			method: 'POST',
			url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_data',
			data: {
				analysis_id: cartograplant.current_analysis_id,
				variable_name: 'analysis_type',
			},
			success: function (data) {
				console.log(data);
			}
		});			
		// Now also set the analysis type
		$.ajax({
			method: 'POST',
			url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_data',
			data: {
				analysis_id: cartograplant.current_analysis_id,
				variable_name: 'analysis_type',
				variable_data: $('#analysis_type').val(),
			},
			success: function (data) {
				console.log(data);
			}
		});	
		analysis_summary_update();	
	}

	try {
		$('#btn_update_analysis_name').off('click');
	} catch (err) {}
	$('#btn_update_analysis_name').click(function() {
		var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/update_analysis_name';
		url += "?analysis_id=" + cartograplant.current_analysis_id + '&analysis_name=' + $('#analysis_name').val();
		$.ajax({
			method: 'GET',
			url: url,
			success: function(data) {
				var result = JSON.parse(data);
				console.log(result);
				if(result['updated'] == true) {
					analysis_update_type();
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
	cartograplant.get_detected_studies_from_selected_trees = get_detected_studies_from_selected_trees;
	function get_detected_studies_from_selected_trees() {
		cartograplant.detected_studies = {};
		// console.log(analysis_includedTrees);
		if (analysis_includedTrees.length > 0) {
			for(var i=0; i < analysis_includedTrees.length; i++) {
				if(analysis_includedTrees[i].includes('TGDR')) {
					var tree_parts = analysis_includedTrees[i].split('-');
					var study = tree_parts[0];
					// console.log(study);
					if(study != "") {
						// console.log(detected_studies[study]);
						if(cartograplant.detected_studies[study] == undefined) {
							cartograplant.detected_studies[study] = [];
						}
						cartograplant.detected_studies[study].push(analysis_includedTrees[i]);
					}
				}
			}
			console.log('Studies detected: ' + Object.keys(cartograplant.detected_studies));
		}
		else {
			// Doing a full search is probably a bad idea (thought about this on 5/9/2024)
		}
	}

	// Clear on clicks for this tab (this happens due to dynamic script reloads)
	var gt_check_payload = {};
	try {
		$('body').off('click', '#btn_snps_gt_check');
	} catch (err) {}
	$('body').on('click', '#btn_snps_gt_check', function() {
		if (analysis_completion_json['analysis_study_context'] == {} || analysis_completion_json['analysis_study_context'] == undefined) {
			alert('No study context was found. Please go to the manage tab, select studies with genotypes and run the study context process, then return here to perform the merge.');
			return;
		}
		gt_check_payload = {
			studies: {},
			// markers: [], // DEPRECATED 12/10/2025 - Nextflow now looks up the markers from the DB based on the studies selected for overlap
			sampleDiscordance: null
		};
		console.log('analysis_study_context', analysis_completion_json['analysis_study_context']);
		if (analysis_completion_json['analysis_study_context']['studies'] == undefined) {
			alert('No VCF files were found. Please go to the manage tab, select studies with genotypes and run the study context process, then return here to perform the merge.');
		}
		else {
			
			if (analysis_completion_json['analysis_study_context']['sampleDiscordance'] != undefined) {
				gt_check_payload['sampleDiscordance'] = analysis_completion_json['analysis_study_context']['sampleDiscordance'];
			}

			var studies_overlap_selections = [];

			// OLD CODE - 12/10/2025 DEPRECATED IN FAVOR OF NEXTFLOW LOOKING UP THE QUERY FOR OVERLAPS FROM THE DB
			// var studies_overlap_csv_keys = Object.keys(shared_marker_information);
			// var markers_tmp = {};
			// for (var i = 0; i < studies_overlap_csv_keys.length; i++) {
			// 	var studies_csv = studies_overlap_csv_keys[i];

			// 	// Use shared_marker_information to get the markers and put this into an object
			// 	// so that we only get unique keys/markers
			// 	var marker_information = shared_marker_information[studies_csv];
			// 	for (var j = 0; j < marker_information['markers'].length; j++) {
			// 		var marker = marker_information['markers'][j];
			// 		markers_tmp[marker] = true;
			// 	}

			// 	// Now add the studies to the studies_overlap_selections
			// 	// if the studies_overlap_selections does not include the study, then add it
			// 	var studies_arr = studies_csv.split(',');
			// 	for (var j = 0; j < studies_arr.length; j++) {
			// 		// if the studies_overlap_selections does not include the study, then add it
			// 		if (studies_overlap_selections.includes(studies_arr[j]) == false) {
			// 			studies_overlap_selections.push(studies_arr[j]);
			// 		}
			// 	}
			// }
			// var markers = Object.keys(markers_tmp);
			// gt_check_payload['markers'] = markers;

			var studies_overlap_csv_keys = Object.keys(shared_marker_information);
			for (var i = 0; i < studies_overlap_csv_keys.length; i++) {
				var studies_csv = studies_overlap_csv_keys[i];
				// Now add the studies to the studies_overlap_selections
				// if the studies_overlap_selections does not include the study, then add it
				var studies_arr = studies_csv.split(',');
				for (var j = 0; j < studies_arr.length; j++) {
					// if the studies_overlap_selections does not include the study, then add it
					if (studies_overlap_selections.includes(studies_arr[j]) == false) {
						studies_overlap_selections.push(studies_arr[j]);
					}
				}
			}

			var studies = Object.keys(analysis_completion_json['analysis_study_context']['studies']);
			for (var i = 0; i < studies.length; i++) {
				var study = studies[i];
				if (studies_overlap_selections.includes(study) == true) {
					var vcf_location = analysis_completion_json['analysis_study_context']['studies'][study]['vcf'];
					gt_check_payload['studies'][study] = [vcf_location];
				}
			}

			console.log('gt_check_payload', gt_check_payload);
			$('#analysis_gt_check_status').html('<i class="fa-solid fa-sync fa-spin"></i> Genotypes check... please wait...');
			var url = Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/gt_check/run';
			$.ajax({
				method: 'POST',
				url: url,
				data: {
					user_id: Drupal.settings.user.user_id,
					workspace_name: $('#nextflow-create-analysis-select-history').val(),
					analysis_id: cartograplant.current_analysis_id,
					payload: JSON.stringify(gt_check_payload)
				},
				success: function(data) {
					// Success does not matter - we use the timer below to check the completion json to confirm completion
					//alert('Successfully saved study context.');
					console.log('Data:', data);
					try {
						data = JSON.parse(data);
					} catch (err) {console.log(err)}
				}
			});

			try {
				clearInterval(analysis_timers['gt_check_completion_json']);
			} catch  (err) {
				console.log('Error clearing timer', err);
			}
			analysis_timers['gt_check_completion_json'] = setInterval(function() {
				// Check if the study context is completed
				var url = Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/gt_check/check_completion_json';
				$.ajax({
					method: 'POST',
					data: {
						analysis_id: cartograplant.current_analysis_id,
						workspace_name: $('#nextflow-create-analysis-select-history').val(),
						user_id: Drupal.settings.user.user_id,
					},
					url: url,
					success: function(data) {
						
						try {
							data = JSON.parse(data);
						} catch (err) {console.log(err)}
						console.log('Genotypes check completion json:', data);
						if (data['response']['success'] == 'true') {
							console.log('Genotypes check Completion:', data);
							try {
								clearInterval(analysis_timers['gt_check_completion_json']);
							} catch  (err) {
								console.log('Error clearing timer', err);
							}
							analysis_completion_json['analysis_study_context'] = data['response'];
							try {
								clearInterval(analysis_timers['gt_check_completion_json']);
							} catch (err) {
								console.log('Error clearing timer', err);
							}
							
							$('#analysis_gt_check_status').html('✅ Genotypes check completed! <br />');
							$('#analysis_gt_check_status').append(generate_completion_message_html(data));
							
							var gt_check_study_refinement_html = '';
							var study_combinations = Object.keys(data['response']['sampleDiscordance']);
							if (study_combinations.length == 0) {
								gt_check_study_refinement_html += '<div>No marker discordance was detected between samples in the selected studies.</div>';
								gt_check_study_refinement_html += '<div style="margin-top: 5px;">You may now continue to MERGE VCFS</div>';
								$('#analysis_gt_check_study_refinement').html(gt_check_study_refinement_html);
							}
							else {
								for (var i = 0; i<study_combinations.length; i++) {
									var study_combination = study_combinations[i];
									var study_comb_arr = study_combination.split('-');
									gt_check_study_refinement_html += '<div>Marker discordance between pairwise comparisons of genotypes in study ' + study_comb_arr[0] + ' and study ' + study_comb_arr[1] +'</div>';
								}
								gt_check_study_refinement_html += '<div style="max-height: 200px; overflow-y: auto;">';
								gt_check_study_refinement_html += '<table border=1 style="width: 100%;">';
								gt_check_study_refinement_html += '<tr><th>Sample names</th>';
								var study_combinations = Object.keys(data['response']['sampleDiscordance']);
								for (var i = 0; i<study_combinations.length; i++) {
									var study_combination = study_combinations[i];
									gt_check_study_refinement_html += '<th>' + study_combination + '</th>';
								}
								gt_check_study_refinement_html += '</tr>';

								for (var i = 0; i<study_combinations.length; i++) {
									var study_combination = study_combinations[i];
									var samples = Object.keys(data['response']['sampleDiscordance'][study_combination]);
									for (var samples_i = 0; samples_i< samples.length; samples_i++) {
										var sample = samples[samples_i];
										gt_check_study_refinement_html += '<tr>';
										gt_check_study_refinement_html += '<td>' + sample + '</td>';
										gt_check_study_refinement_html += '<td>' + data['response']['sampleDiscordance'][study_combination][sample]['normDiscordance'] + '</td>';
										gt_check_study_refinement_html += '</tr>';
									}
								}
								gt_check_study_refinement_html += '</table>';
								gt_check_study_refinement_html += '</div>';
								gt_check_study_refinement_html += '<div style="margin-top: 10px;">* Please select one study to retain clones and then continue to MERGE VCFS</div>';
								var studies = Object.keys(data['response']['vcfs']);
								for (var i = 0; i < studies.length; i++) {
									var study = studies[i];
									gt_check_study_refinement_html += '<div><input type="checkbox" class="gt_check_study_refinement_checkbox" data-study="' + study + '" /> ' + study + '</div>';
								}
								
								$('#analysis_gt_check_study_refinement').html(gt_check_study_refinement_html);
							}

						}
						else if (data['response']['success'] == 'false') {
							$('#analysis_gt_check_status').html('<i class="fas fa-triangle-exclamation"></i> Genotypes check failed - please contact administration for more details.<br />');
							if (data['response']['success'] != undefined) {
								$('#analysis_gt_check_status').append(generate_completion_message_html(data));
							}
							else {
								$('#analysis_gt_check_status').append('Awaiting status...');
							}
							try {
								clearInterval(analysis_timers['gt_check_completion_json']);
							} catch  (err) {
								console.log('Error clearing timer', err);
							}
						}
						else {
							// $('#btn_snps_merge_vcfs').html('<i class="fa-solid fa-sync fa-spin"></i> Merging VCFs... please wait...');
							console.log('Continuing to check for genotypes check completion');
						}
					}
				});
			}, 5000);
		}
	});

	try {
		$('body').off('click', '.gt_check_study_refinement_checkbox');
	} catch (err) {}
	$('body').on('click', '.gt_check_study_refinement_checkbox', function() {
		console.log('gt_check_study_refinement_checkbox clicked');
		if ($(this).is(':checked') == true) {
			var selected_study = $(this).data('study');
			var checkboxes_elements = $('.gt_check_study_refinement_checkbox');
			for (var i = 0; i<checkboxes_elements.length; i++) {
				var checkbox = checkboxes_elements.eq(i);
				if ($(checkbox).is(':checked')) {
					$(checkbox).prop('checked', false);	
				}
			}
			$(this).prop('checked', true);

			gt_check_payload['study_to_retain_clones'] = selected_study;
		}
		console.log('gt_check_payload', gt_check_payload);
	});

	// Clear on clicks for this tab (this happens due to dynamic script reloads)
	try {
		$('body').off('click', '#btn_snps_merge_vcfs');
	} catch (err) {}
	$('body').on('click', '#btn_snps_merge_vcfs', function() {
		if (analysis_completion_json['analysis_study_context'] == {} || analysis_completion_json['analysis_study_context'] == undefined) {
			alert('No study context was found. Please go to the manage tab, select studies with genotypes and run the study context process, then return here to perform the merge.');
			return;
		}
		// var merge_payload = {
		// 	studies: {},
		// 	markers: [],
		// 	sampleDiscordance: null
		// };
		console.log('analysis_study_context', analysis_completion_json['analysis_study_context']);
		if (analysis_completion_json['analysis_study_context']['studies'] == undefined) {
			alert('No VCF files were found. Please go to the manage tab, select studies with genotypes and run the study context process, then return here to perform the merge.');
		}
		else {
			
			// if (analysis_study_context['sampleDiscordance'] != undefined) {
			// 	merge_payload['sampleDiscordance'] = analysis_study_context['sampleDiscordance'];
			// }

			// var studies = Object.keys(analysis_study_context['vcfs']);
			// for (var i = 0; i < studies.length; i++) {
			// 	var study = studies[i];
			// 	var vcf_location = analysis_study_context['vcfs'][study];
			// 	merge_payload['studies'][study] = [vcf_location];
			// }

			// console.log('merge_payload', merge_payload);
			$('#analysis_merge_vcfs_status').html('<i class="fa-solid fa-sync fa-spin"></i> Merging VCFs... please wait...');
			var url = Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/merge_vcfs/run';
			$.ajax({
				method: 'POST',
				url: url,
				data: {
					user_id: Drupal.settings.user.user_id,
					workspace_name: $('#nextflow-create-analysis-select-history').val(),
					analysis_id: cartograplant.current_analysis_id,
					payload: JSON.stringify(gt_check_payload)
				},
				success: function(data) {
					// Success does not matter - we use the timer below to check the completion json to confirm completion
					//alert('Successfully saved study context.');
					console.log('Data:', data);
					try {
						data = JSON.parse(data);
					} catch (err) {console.log(err)}
				}
			});

			try {
				clearInterval(analysis_timers['merge_vcfs_completion_json']);
			} catch  (err) {
				console.log('Error clearing timer', err);
			}
			analysis_timers['merge_vcfs_completion_json'] = setInterval(function() {
				// Check if the study context is completed
				var url = Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/merge_vcfs/check_completion_json';
				$.ajax({
					method: 'POST',
					data: {
						analysis_id: cartograplant.current_analysis_id,
						workspace_name: $('#nextflow-create-analysis-select-history').val(),
						user_id: Drupal.settings.user.user_id,
					},
					url: url,
					success: function(data) {
						console.log('Merge VCFs Completion:', data);
						try {
							data = JSON.parse(data);
						} catch (err) {console.log(err)}
						if (data['response']['success'] == 'true') {
							analysis_completion_json['analysis_study_context'] = data['response'];
							console.log('Merge VCFs Completion updated analysis_study_context:', data);
							try {
								clearInterval(analysis_timers['merge_vcfs_completion_json']);
							} catch (err) {
								console.log('Error clearing timer', err);
							}
							if (data['response']['success'] == "true") {
								$('#analysis_merge_vcfs_status').html('✅ Merge VCFs completed! <br />');
								$('#analysis_merge_vcfs_status').append(generate_completion_message_html(data));
								try {
									clearInterval(analysis_timers['study_context_completion_json']);
								} catch  (err) {
									console.log('Error clearing timer', err);
								}
							}
							else {
								// $('#analysis_merge_vcfs_status').append('Awaiting status...');
							}
						}
						else if (data['response']['success'] == 'false') {
							$('#analysis_merge_vcfs_status').html('<i class="fas fa-triangle-exclamation"></i> Study context failed - please contact administration for more details.<br />');
							$('#analysis_merge_vcfs_status').append(generate_completion_message_html(data));
							try {
								clearInterval(analysis_timers['merge_vcfs_completion_json']);
							} catch  (err) {
								console.log('Error clearing timer', err);
							}
						}
						else {
							// $('#btn_snps_merge_vcfs').html('<i class="fa-solid fa-sync fa-spin"></i> Merging VCFs... please wait...');
							console.log('Continuing to check for merge_vcfs completion');
						}

					}
				});
			}, 5000);
		}
	});

	// Clear on clicks for this tab (this happens due to dynamic script reloads)
	var shared_marker_information = {};
	try {
		$('a[href="#analysis-overlapping-genotypes"]').off('click');
		shared_marker_information = {};
	} catch (err) {}
	// This happens when someone clicks on the genotype overlap analysis tab
	$('a[href="#analysis-overlapping-genotypes"]').on('click', function() {

		if (analysis_genotypes_configuration_tab == true) {
			console.log('#analysis-overlapping-genotypes tab already generated - bypassing');
			return;
		}

		// Set configuration tab as loaded
		analysis_genotypes_configuration_tab = true;

		// load_analysis_overlapping_genotypes_snp_grid_filter();
		//get_detected_studies_from_selected_trees();
		//console.log('detected_studies', cartograplant.detected_studies);

		// var studies = Object.keys(cartograplant.detected_studies);
		var studies = get_selections_studies();

		// $('#analysis-overlapping-genotypes-summary-insights').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Loading genotypic information... please wait...');
		$('#analysis-overlapping-genotypes-summary-insights').html('');
		console.log('Genotype tab click');
		// Overlapping Genotype tab
		var study_info_html = "<div class='top-description' style='margin-bottom: 10px;'>This page enables the study-level selection of genotypic data. Marker counts both per study and per intersection of studies are displayed within the UpSet plot below. Clicking a bar within this plot will select all markers associated with the bar's associated study or studies. If a bar associated with more than one study is selected, the button Run VCF-merge must be clicked before continuing with analysis. This button merges all VCF data associated with selected studies into a single VCF.</div>";
		// study_info_html += '<div>Instructions: Please select the studies or study intersections by clicking on the Upset plot bars below. Then you can perform a genotypes check to identify potential duplicate samples across studies. Finally, you can merge the VCF files from the selected studies into a single VCF file for downstream analysis.</div>';
		study_info_html += '';
		if (studies.length == 0) {
			study_info_html += '⚠️ ';
		}
		study_info_html += studies.length + ' studies based on analysis study context choices<br />';
		for(var i=0; i<studies.length; i++) {
			if(i > 0) {
				// study_info_html += ', ';
			}
			study_info_html += '<div style="display: inline-block; padding: 3px; border-radius: 2px; background-color: #036e63; color: #FFFFFF; margin-right: 3px;">' + studies[i] + '</div>';
		}
		
		//study_info_html += '<div style="margin-top: 5px; margin-bottom: 5px;"><button class="btn btn-primary" id="btn_snps_merge_vcfs">Merge VCFs</button></div>';
		//study_info_html += '<div id="analysis_merge_vcfs_status" style="margin-top: 5px; margin-bottom: 5px;"></div>';
		$('#analysis-overlapping-genotypes-detected-studies').html(study_info_html);

		var gt_check_html = '';
		gt_check_html += '<div style="margin-top: 5px; margin-bottom: 5px;"><button class="btn btn-primary" id="btn_snps_gt_check">Genotypes check</button></div>';
		gt_check_html += '<div id="analysis_gt_check_status" style="margin-top: 5px; margin-bottom: 5px;"></div>';
		gt_check_html += '<div id="analysis_gt_check_study_refinement" style="margin-top: 5px; margin-bottom: 5px;"></div>';
		$('#analysis-overlapping-genotypes-gt-check').html(gt_check_html);

		var merge_vcfs_html = '';
		merge_vcfs_html += '<div style="margin-top: 5px; margin-bottom: 5px;"><button class="btn btn-primary" id="btn_snps_merge_vcfs">Merge VCFs</button></div>';
		merge_vcfs_html += '<div id="analysis_merge_vcfs_status" style="margin-top: 5px; margin-bottom: 5px;"></div>';
		$('#analysis-overlapping-genotypes-merge-vcfs').html(merge_vcfs_html);

		// Generate the UpSet plot boot code
		// Use the studies to then get the trees from the filter variable which we use to create the plots
		// var data = [];
		// for (var i = 0; i<studies.length; i++) {
		// 	var study_accession = studies[i];
		// 	if (data[study_accession] == undefined) {
		// 		data[study_accession] = {
		// 			name: study_accession,
		// 			elems: []
		// 		}
		// 	}
		// 	// Search for all trees in that study
		// 	for (var j = 0; j < analysis_includedTrees.length; j++) {
		// 		var tree_id = analysis_includedTrees[j];
		// 		if (tree_id.includes(study_accession)) {
		// 			data[study_accession]['elems'].push(analysis_includedTrees[j]);
		// 		}
		// 	}
		// 	console.log(study_accession + ' UpSet tree set', data[study_accession]);
		// }
		// console.log('UpSet data',data);

		// const data = [
		// 	{ name: 'S1', elems: [0,1,2] },
		// 	{ name: 'S2', elems: [1,2,3] },
		// 	{ name: 'S3', elems: [0,2,4] },
		// ];

		// Lookup reference genomes for each study
		$('#analysis-overlapping-genotypes-refgenome').html('');
		
		for(var i=0; i<studies.length; i++) {
			var study_name = studies[i];
			console.log('study_name', study_name);
			var ref_genome_url = Drupal.settings.base_url + '/cartogratree_uianalysis/cartogratree_analysisapi_lookup_study_ref_genome/' + study_name;
			$.ajax({
				method: 'GET',
				url: ref_genome_url,
				success: function(data) {
					// var data = JSON.parse(data);
					console.log('ref_genome data', data);

					var ref_genomes_string = '';
					for(var i = 0; i < data['ref_genomes'].length; i++) {
						if (data['ref_genomes'][i] != null && data['ref_genomes'][i] != undefined) {
							// if (i == 0) {
							// 	ref_genomes_string += data['organism_names'][i] + ' has reference genome: ' + data['ref_genomes'][i];
							// }
							// else {
							// 	ref_genomes_string += ', ' + data['organism_names'][i] + ' has reference genome: ' + data['ref_genomes'][i];	
							// }
							ref_genomes_string += '<li style="margin-left: 30px;">' + data['organism_names'][i] + ' has reference genome: ' + data['ref_genomes'][i] + '</li>';
						}
						else {
							if (i == 0) {
								// ref_genomes_string += data['organism_names'][i] + ' has no reference genome';
							}
							else {
								// ref_genomes_string += ', ' + data['organism_names'][i] + ' has no reference genome';
							}
						}
					}

					var set_html = "<div>";
					set_html += data['study_accession'] + ': ' + ref_genomes_string;
					set_html += "</div>";
					if (data['ref_genomes'].length > 0 && data['ref_genomes'][0] != null) {
						$('#analysis-overlapping-genotypes-refgenome').append(set_html);
					}
				}
			});
		}

		



		// If there is only one study, we have to generate a checkbox for the study
		// since the code below to create a venn diagram will fail gracefully
		if(studies.length == 1) {
			for(var i=0; i<studies.length; i++) {
				var study_name = studies[i];
				console.log('study_name', study_name);
				$.ajax({
					method: 'POST',
					url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/snps_count_by_study',
					data: {
						study: study_name
					},
					success: function(data) {
						var data = JSON.parse(data);
						var count = data['cardinality'];
						var set_html = "<div>";
						set_html += "<h4>Insights</h4>";
						set_html += '<input style="display: inline-block;" class="snp_all_singlestudy_checkbox" count="' + count + '" type="checkbox" value="' + study_name + '" /> ';
						set_html += study_name + ' has ' + count + " ";
						set_html += " SNPs";
						set_html += "</div><br />";
		
						$('#analysis-overlapping-genotypes-summary-insights').html(set_html);
						
					}
				})					
			}
		}

		$('body').on('click', '.snp_all_singlestudy_checkbox', function() {
			cartograplant['analysis_filter_snp_section_loaded'] = false;				
			analysis_summary_update();
			var is_checked = false;
			if ($(this).is(':checked')) {
				is_checked = true;
			}

			if(is_checked) {
				// Checked so we need to insert this analysis_data
				console.log('insert_all_snp_overlap');
				// Get the studies
				var study_id = $(this).attr('value');
				var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_study_all';
				$.ajax({
					method: 'POST',
					url: url,
					data: {
						analysis_id: cartograplant.current_analysis_id,
						study_id: study_id
					},
					success: function(data) {
						var results = JSON.parse(data);
						console.log(results);
					}
				});										
				
			}
			else {
				// Checked so we need to insert this analysis_data
				console.log('delete_all_snp_overlap');
				// Get the studies
				var study_id = $(this).attr('value');
				var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_study_all';
				$.ajax({
					method: 'POST',
					url: url,
					data: {
						analysis_id: cartograplant.current_analysis_id,
						study_id: study_id
					},
					success: function(data) {
						var results = JSON.parse(data);
						console.log(results);
					}
				});
			}
								
		});			

		// Overlapping Genotype tab
		// $.ajax({
		// 	method: 'POST',
		// 	data: {
		// 		studies: JSON.stringify(studies) // array in JSON format
		// 	},
		// 	url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/by_study_ids',
		// 	success: function(data) {
		// 		console.log('overlapping_genotypes', data);
		// 		if(data.length > 0) {
		// 			$('#analysis-overlapping-genotypes-across-studies').html('Overlapping genotypes: ' + data[0]['cardinality']);
		// 		}
		// 	}
		// });


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
						if(object['sets'] != undefined) {
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
						else {
							console.log("NOTE: object['sets'] is null for some reason");
						}
					}
					console.log('fake_venn_array', fake_venn_array);
					try {
						// RISH: Remove request by Meghan and confirmed by Gabe via Slacxk on 9/8/2025
						// var chart = venn.VennDiagram().width(350).height(250);
						// d3.select("#analysis-overlapping-genotypes-snp-venn-diagram").datum(fake_venn_array).call(chart);
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
							console.log('snps_overlaps_by_studies_views data results', data);
							data = JSON.parse(data);
							// var insights_html = "";
							// if(data.snps_grid_overlap_array != undefined) {
							// 	var overlap_arr = data.snps_grid_overlap_array;
							// 	insights_html += "<h4>Insights</h4>";
							// 	insights_html += "We analyzed " + overlap_arr.length + ' studies and discovered the following:<br />';
							// 	insights_html += "There are a total of " + overlap_arr[0]['overlap_all'] + ' SNP overlaps across all ' + overlap_arr.length + ' studies<br />';
							// 	insights_html += '<div id="genotype-insights-shared-dataset-status"></div>';
							// 	insights_html += '<div id="genotype-insights-shared-trees-status"></div>';
								
							// 	// Check for highest total overlaps
							// 	var highest_overlap_total_study = "";
							// 	var highest_overlap_total_value = -1;
							// 	for(var i=0; i<overlap_arr.length; i++) {
							// 		var study_id = overlap_arr[i]['study_name'];
							// 		if(highest_overlap_total_value < (parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']))) {
							// 			highest_overlap_total_study = study_id;
							// 			highest_overlap_total_value = parseInt(overlap_arr[i]['overlap_some']) + parseInt(overlap_arr[i]['overlap_all']);
							// 		}
							// 	}
							// 	if(highest_overlap_total_value > -1 && highest_overlap_total_value > 0) {
							// 		if(studies.length > 2) {
							// 			insights_html += "Study " + highest_overlap_total_study + " contains the highest SNP overlaps (" + highest_overlap_total_value + ") between all studies<br />";
							// 		}
							// 	}					
								
							// 	// Check for highest overlap some
							// 	var highest_overlap_some_study = "";
							// 	var highest_overlap_some_value = -1;
							// 	for(var i=0; i<overlap_arr.length; i++) {
							// 		var study_id = overlap_arr[i]['study_name'];
							// 		if(highest_overlap_some_value < parseInt(overlap_arr[i]['overlap_some'])) {
							// 			highest_overlap_some_study = study_id;
							// 			highest_overlap_some_value = parseInt(overlap_arr[i]['overlap_some']);
							// 		}
							// 	}
							// 	if(highest_overlap_some_value > -1 && highest_overlap_some_value > 0) {
							// 		insights_html += "Study " + highest_overlap_some_study + " contains the highest SNP overlaps (" + highest_overlap_some_value + ") between some studies<br />";
							// 	}
								
							// 	// Process the venn_array
							// 	// var track_data_venn_sets = {};
							// 	var set_html = "";
							// 	// set_html += '<div class="h4">Genotype marker overlaps between studies</div>';
							// 	// for(var i=0; i<sets.length; i++) {
							// 	// 	var set_object = sets[i];
							// 	// 	console.log('set_object', set_object);
							// 	// 	var set = set_object['sets'];
							// 	// 	// if the set size is more than 1, it's overlap between
							// 	// 	if(set != undefined) {
							// 	// 		if(set.length > 1) {
							// 	// 			var data_venn_sets = "";
							// 	// 			for(var j=0; j<set.length; j++) {
							// 	// 				if (j>0) {
							// 	// 					data_venn_sets += '_';
							// 	// 				}
							// 	// 				data_venn_sets += set[j];
							// 	// 			}
											
							// 	// 			// check to data_venn_set overlap checkbox not already in the set_html code
							// 	// 			if(track_data_venn_sets[data_venn_sets] == undefined) {
							// 	// 				track_data_venn_sets[data_venn_sets] = true;
							// 	// 				set_html += "<div style='text-decoration: underline; display: inline-block;' class='selection_set_overlap' data-venn-sets='" + data_venn_sets + "'>";
							// 	// 				set_html += '<div class="d-inline-block" style="vertical-align:top; text-decoration: none; width: 25px;"><input class="snp_overlap_checkbox" type="checkbox" count="' + parseInt(set_object['size']) + '" value="' + data_venn_sets + '" /> </div>';
							// 	// 				set_html += "<div class='d-inline-block' style='width: 90%;'>";
												
							// 	// 				set_html += "<div class='d-inline-block' style='text-decoration: underline;'>SNPs between ";
							// 	// 				for(var j=0; j<set.length; j++) {
							// 	// 					if (j>0) {
							// 	// 						set_html += ', ';
							// 	// 					}
							// 	// 					set_html += set[j];
							// 	// 				}
							// 	// 				set_html += '</div>';
							// 	// 				set_html += ' <div style="background-color: rgb(16, 166, 137); color: #FFFFFF; padding: 3px; padding-left: 5px; padding-right: 5px; font-size: 0.7em; border-radius: 2px;" class="d-inline-block">' +  parseInt(set_object['size']) + '</div>'
							// 	// 				set_html += '</div></div>';
							// 	// 			}
							// 	// 		}
							// 	// 	}
							// 	// }
							// 	// set_html += '<br />';

							// 	// Do code for entire study
							// 	// set_html += '<div class="h4">Genotype markers per study</div>';
							// 	// for(var i=0; i<sets.length; i++) {
							// 	// 	var set_object = sets[i];
							// 	// 	console.log('set_object', set_object);
							// 	// 	var set = set_object['sets'];
							// 	// 	var size = set_object['size'];
							// 	// 	// if the set size is more than 1, it's overlap between
							// 	// 	if(set != undefined) {
							// 	// 		if(set.length == 1) {
							// 	// 			var study_name = set[0];
							// 	// 			set_html += "<div style='text-decoration: underline; display: inline-block;' class='selection_set_all' data-venn-sets='" + study_name + "'>";
											
							// 	// 			set_html += '<input style="" class="snp_all_checkbox" count="' + size + '" type="checkbox" value="' + study_name + '" /> ';
							// 	// 			set_html += study_name + ' has ' + size + " ";
							// 	// 			set_html += " SNPs";
							// 	// 			set_html += "</div>";
							// 	// 		}
							// 	// 	}
							// 	// }
							// 	// set_html += '<br />';								

							// 	// Do code for non overlaps
							// 	// set_html += '<div class="h4">Non-overlapping genotype markers per study</div>';
							// 	// for(var i=0; i<sets.length; i++) {
							// 	// 	var set_object = sets[i];
							// 	// 	console.log('set_object', set_object);
							// 	// 	var set = set_object['sets'];
							// 	// 	// if the set size is more than 1, it's overlap between
							// 	// 	if(set != undefined) {
							// 	// 		if(set.length == 1) {
							// 	// 			var study_name = set[0];
							// 	// 			var overlap_none_value = overlap_none[study_name];
							// 	// 			set_html += "<div style='text-decoration: underline; display: inline-block;' class='selection_set_none_overlap' data-venn-sets='" + study_name + "'>";
											
							// 	// 			set_html += '<input style="display: none;" class="snp_none_overlap_checkbox" count="' + overlap_none_value + '" type="checkbox" value="' + study_name + '" /> ';
							// 	// 			set_html += study_name + ' has ' + overlap_none_value + " ";
							// 	// 			set_html += " non-overlaps";
							// 	// 			set_html += "</div>";
							// 	// 		}
							// 	// 	}
							// 	// }
							// 	// set_html += '<br />';
							// }
							// $('#analysis-overlapping-genotypes-summary-insights').html(insights_html + "<br />" + set_html);

							// Lookups of shared trees by first getting all study combinations
							// genotype-insights-shared-trees-status
							const items = studies;
							const combinations = []; 
							
							for (let i = 1; i <= items.length; i++) { 
							  for (let j = 0; j <= items.length - i; j++) {
								combinations.push(items.slice(j, j + i)); 
							  } 
							} 
							
							// This contains the non-unique combos including single studies
							// So we need to filter this out a bit
							console.log('combinations', combinations);
							var unique_combinations = {};
							// This will check to see if the combos are more than 1 study,
							// Make sure they are in ascending order (TGDR001,TGDR002)
							// Then store that as keys, so you remove duplicates in the process
							for (var ci = 0; ci < combinations.length; ci++) {
								var c_temp = combinations[ci];
								if (c_temp.length > 1) {
									c_temp.sort();
									var c_temp_csv = c_temp.join(',');
									unique_combinations[c_temp_csv] = true;
								}
							}

							// This will contain the unique combinations as keys
							console.log('unique_combinations', unique_combinations);

							var csv_combos = Object.keys(unique_combinations);
							console.log('csv_combos', csv_combos);
							$('#genotype-insights-shared-trees-status').html('');
							var csv_combos_finished = 0;
							var csv_combos_with_overlaps = [];
							for (var ci = 0; ci<csv_combos.length; ci++) {
								var combo_studies = csv_combos[ci].split(',');
								console.log('combo_studies', combo_studies)
								$.ajax({
									url: Drupal.settings.base_url + '/cartogratree/api/v2/trees/shared_trees',
									method: 'POST',
									data: {
										studies: combo_studies
									},
									success: function (data) {
										console.log('shared_trees api response', data);
										try {
											if (data['rows'] != null) {
												if (data['rows'].length > 0) {
													csv_combos_with_overlaps.push(data['studies_csv'].replaceAll("'", '').replaceAll(',',','));
													var shared_html = '';
													shared_html += '<div>';
													shared_html += '🪴' + data['rows'][0]['shared_trees_across_all_studies'] + ' shared plants between ' + data['studies_csv'].replaceAll("'", '').replaceAll(',',', ');
													shared_html += '</div>';
													var element = $(shared_html);
													$('#genotype-insights-shared-trees-status').append(shared_html);
													element.hide().fadeIn(200);
												}
												else {
													// var shared_html = '';
													// shared_html += '<div style="padding-left:20px;">';
													// shared_html += '0 shared plants between ' + data['studies_csv'].replaceAll("'", '').replaceAll(',',', ');
													// shared_html += '</div>';
													// var element = $(shared_html);
													// $('#genotype-insights-shared-trees-status').append(shared_html);
													// element.hide().fadeIn(200);
												}
											}
										}
										catch (err) {
											console.log(err);
										}
										csv_combos_finished = csv_combos_finished + 1;
									},
									error: function (err) {
										console.log(err);
										csv_combos_finished = csv_combos_finished + 1;
									}
								});
							}
							// combinations.forEach((x) => {
							// 	console.log(x);
							// });
							
							// Get all markers per study combinations to attempt to create an UpSet plot
							// var data_upset_plot_2 = [
							// 	{ name: 'S1', elems: [0,1,2] },
							// 	{ name: 'S2', elems: [1,2,3] },
							// 	{ name: 'S3', elems: [0,2,4] },
							// ];

							var data_upset_plot_2 = [
							];							

							var upset_plot_2_studies_finished = 0;
							$('#analysis-overlapping-genotypes-upset-2-status').html('UpSet plot queued for generation... please wait while system establishes requirements');
							$('.upset_plot_bar_author_text').remove();
							for (var i = 0; i < studies.length; i++) {
								var study = studies[i];
								console.log('study', study);
								console.log('shared_analysis_name', shared_analysis_name);
								$.ajax({
									method: 'POST',
									data: {
										study: study, // array in JSON format
										analysis_name: shared_analysis_name
									},
									url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/snps_by_study',
									success: function(data) {
										try {
											data = JSON.parse(data);
										} catch (err) {
											data = [];
										}
										console.log('genotype_markers', data);
										
										if(data.length > 0) {
											console.log('markers', data[0]['markers']);
											console.log('markers_count', data[0]['markers'].length);
											var set_object = {
												name: data[0]['accession'],
												elems: data[0]['markers']
											}
											data_upset_plot_2.push(set_object); 
											$('#analysis-overlapping-genotypes-upset-2-status').html('<img style="height: 16px;" src="' + loading_icon_src + '" /> Loaded ' + (upset_plot_2_studies_finished +  1) + ' of ' + studies.length + ' study genotypic information (' + data[0]['markers'].length + ' genotype markers downloaded). UpSet plot will be created on completion.' );
										}
										upset_plot_2_studies_finished = upset_plot_2_studies_finished + 1;
										
										if (upset_plot_2_studies_finished == studies.length) {
											$('#analysis-overlapping-genotypes-upset-2-status').html('');
											// render the UpSet Plot 2
											console.log('data_upset_plot_2', data_upset_plot_2);
											var sets_2 = UpSetJS.asSets(data_upset_plot_2);
											// UpSetJS.render(document.getElementById("analysis-overlapping-genotypes-upset-2"), { 
											// 	sets: sets,
											// 	width: 600,
											// 	height: 450,
											// });

											const props_2 = {
												sets: sets_2,
												width: 800,
												height: 600,
												combinations: {
													type: 'intersection',
													min: 1,
													limit: 100,
													order: 'cardinality',
												},
												selection: null
											}
											props_2.onHover = (set) => {
												props_2.selection = set;
												UpSetJS.render(document.getElementById("analysis-overlapping-genotypes-upset-2"), props_2);
											};
											UpSetJS.render(document.getElementById("analysis-overlapping-genotypes-upset-2"), props_2);

											// Change Y-Axis from Intersection size to Set size
											$('#analysis-overlapping-genotypes-upset-2 text[class^="cChartTextStyle-upset-"]').html('Set size');

											// Change color of bars to match Cartograplant a little more
											$('g[data-upset="cs"] rect[class^="fillPrimary-upset-"]').css('fill', '#ffb000');
											$('g[data-upset="csaxis"] line').css('stroke-dasharray', '0').css('stroke-width', '1px');
											
											// Hack to shift counts to vertical
											$('g[data-upset="cs"] text[class^="cBarTextStyle-upset-"]').each(function() {

												// Change the text size to 14px
												$('g[data-upset="cs"] text[class^="cBarTextStyle-upset-"]').css('font-size', '24px');

												// Get the width of the fillPrimary-upset element and use it for the y value
												var width = $('g[data-upset="cs"] text[class^="cBarTextStyle-upset-"]').closest('g').find('rect[class^="fillPrimary-upset-"]').attr('width');
												// Get the height of the column which can be found from the hoverBar
												var height_total = $('g[data-upset="cs"] text[class^="cBarTextStyle-upset-"]').closest('g').find('rect[class^="hoverBar-upset-"]').attr('height');
											
												// Now we have an issue if the fillBar because if it's tall, it will be black
												// So we should change the color of the text if this happens to white to show up
												// on the black fillBar
												var height_fillBar = $('g[data-upset="cs"] text[class^="cBarTextStyle-upset-"]').closest('g').find('rect[class^="fillPrimary-upset-"]').attr('height');
											
												// Calculate a location of where the count text should be (for example half way)
												var x_location_of_text = (parseFloat(height_total) / 2);

												// Check if the location of the text overlaps with the height_fill_bar
												var overlap_boolean = false;
												if (x_location_of_text < height_fillBar) {
													overlap_boolean = true;
												}


												$(this).css('transform', 'rotate(-90deg)')
													.attr('x', x_location_of_text * -1) // multiply by one to bring it down
													.attr('y', parseFloat(width) - 5)
												if (overlap_boolean) {
													$(this).css('fill', '#000000');
												}

												// Does not work - SVG redrawing?
												// var image_element =  $('<image></image>');
												// image_element.attr('href', '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/ui_icons_imgs/checkbox-checked-regular-24.png');
												// image_element.attr('width', '24');
												// image_element.attr('height', '24');
												// image_element.attr('x', '24');
												// image_element.attr('y', '24');
												// console.log('image_element', image_element)
												// $(this).closest('g').append(image_element);

												var parent_element = $(this).closest('g')[0];

												// This is the only way to auto rerender SVG elements
												var image_element = document.createElementNS('http://www.w3.org/2000/svg', 'image');
												image_element.setAttribute('href', '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/ui_icons_imgs/checkbox-checked-regular-24.png');
												image_element.setAttribute('x', -5);
												image_element.setAttribute('y', -15);
												image_element.classList.add("checkbox_image");
												$(image_element).css('display', 'none');
												parent_element.appendChild(image_element);

												
											});

											// Find g element that has an attribute data-upset="sets"
											var g_sets_element = $('#analysis-overlapping-genotypes-upset-2 g[data-upset="sets"]');
											// Get each text element that starts with class text 'setTextStyle-upset-'
											var study_name_text_elements = g_sets_element.find('text[class^="setTextStyle-upset-"]');
											// Go through each text element using a for statement
											for (var i = 0; i < study_name_text_elements.length; i++) {
												var text_element = $(study_name_text_elements[i]);

												// Get the parent g element - class starts with interactive-upset-
												var parent_g_element = text_element.closest('g')[0];

												// Get the study name from the text element
												var study_name = text_element.html();
												// Get the x and y position of the text element
												var x_position = text_element.attr('x');
												var y_position = text_element.attr('y');

												// Create text element
												var text2_element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
												
												text2_element.setAttribute('href', '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/ui_icons_imgs/checkbox-checked-regular-24.png');
												text2_element.setAttribute('x', parseFloat(x_position) - 38);
												text2_element.setAttribute('y', parseFloat(y_position) + 20);
												text2_element.setAttribute('font-size', '12px');
												text2_element.classList.add("upset_plot_bar_author_text");
												

												// Get year from study information
												var year = $('#analysis_detections_study_summary tr[data-value="' + study_name + '"]').attr('data-year');
												// Get author from study information
												var author_name = $('#analysis_detections_study_summary tr[data-value="' + study_name + '"]').attr('data-author');
												// Remove trailing , if one exists from author
												if (author_name.endsWith(',')) {
													author_name = author_name.slice(0, -1);
												}
												text2_element.textContent = author_name + '  (' + year + ')';

												// Append the author text element to the g_sets_element
												parent_g_element.appendChild(text2_element);
											}

											var upset_bar_selector = '#analysis-overlapping-genotypes-upset-2 g[class^="interactive-upset-"]';
											// On hover event for when an upset bar mouse is over it
											$(document).off('mouseover', upset_bar_selector);
											$(document).on('mouseover', upset_bar_selector, function() {
												//console.log('mouseover');
												// Reset all other text back to black
												$('#analysis-overlapping-genotypes-upset-2 text[class^="setTextStyle-upset-"]').css('fill', '#000000');

												// Get the study or studies text for this bar
												var studies_arr = $(this).closest('g').find('text[class^="hoverBarTextStyle-upset-"]').html().replaceAll(')','').replaceAll('(','').split(' ∩ ');
												console.log('studies_arr', studies_arr);
												
												// Now go through the horizontal column of studies and change their colors if they match any in the studies_arr
												$('#analysis-overlapping-genotypes-upset-2 text[class^="setTextStyle-upset-"]').each(function () {
													var study_text = $(this).html();
													// console.log('study_text', study_text);
													if (studies_arr.includes(study_text)) {
														console.log('Study match found: ', study_text);
														$(this).css('fill', '#ffb000');
													}
												});
												// #036e63
											});

											// On hover event for when an upset bar mouse is over it
											$(document).off('mouseout', upset_bar_selector);
											$(document).on('mouseout', upset_bar_selector, function() {
												// console.log('mouseout');
												// Reset all other text back to black
												$('#analysis-overlapping-genotypes-upset-2 text[class^="setTextStyle-upset-"]').css('fill', '#000000');
											});	
											
											$(document).off('hover', upset_bar_selector);
											$(document).on('hover', upset_bar_selector, function() {
												// Find the checkbox_image class element
												var display_value = $(this).find('.checkbox_image').css('display');
												if (display_value == 'none') {
													$(this).find('rect[class^="fillPrimary-upset-"]').css('fill', 'rgb(255, 176, 0)');
													
												}
												else {
													$(this).find('rect[class^="fillPrimary-upset-"]').css('fill', 'rgb(0 169 114)');
												}
											});

											// On click event for when an upset bar is selected
											$(document).off('click', upset_bar_selector);
											$(document).on('click', upset_bar_selector, function() {
												console.log('Upset bar click detected');
												cartograplant['analysis_filter_snp_section_loaded'] = false;
												// Find the checkbox_image class element
												var display_value = $(this).find('.checkbox_image').css('display');
												if (display_value == 'none') {
													// Change color to fill: rgb(0, 169, 114);
													$(this).find('rect[class^="fillPrimary-upset-"]').css('fill', 'rgb(0 169 114)');
													// Select it
													$(this).find('.checkbox_image').css('display', 'block')
													// checked so call the API function to insert the data
													console.log('insert_snp_overlap')
													var study_ids_arr = [];
													study_ids_arr_text = $(this).find('text[class^="hoverBarTextStyle-upset-"]').html();
													study_ids_arr_text = study_ids_arr_text.replaceAll(')','').replaceAll('(','');
													study_ids_arr = study_ids_arr_text.split(' ∩ ');
													if (study_ids_arr.length > 1) {
														var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_studies_overlap';
														$.ajax({
															method: 'POST',
															url: url,
															data: {
																analysis_id: cartograplant.current_analysis_id,
																study_ids_arr: JSON.stringify(study_ids_arr)
															},
															success: function(data) {
																var results = JSON.parse(data);
																console.log(results);
																var studies_csv = results['studies'].join(',').replace('(', '').replace(')', '');
																// var markers = results['markers'];
																var markers = results['marker_feature_ids'];
																
																shared_marker_information[studies_csv] = {
																	'markers': markers,
																	'studies': studies_csv
																}
																console.log('shared_marker_information', shared_marker_information);
															}
														});
													}
												}
											
												else {
													// Change color back to fill: rgb(255, 176, 0);
													$(this).find('rect[class^="fillPrimary-upset-"]').css('fill', 'rgb(255, 176, 0)');
													// Deselect it
													$(this).find('.checkbox_image').css('display', 'none')
													// unchecked so call the API function to delete the data
													console.log('delete_snp_overlap')
													var study_ids_arr = $(this).find('text[class^="hoverBarTextStyle-upset-"]').html().split(' ∩ ');
													var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_studies_overlap';
													$.ajax({
														method: 'POST',
														url: url,
														data: {
															analysis_id: cartograplant.current_analysis_id,
															study_ids_arr: JSON.stringify(study_ids_arr)
														},
														success: function(data) {
															var results = JSON.parse(data);
															console.log(results);
														}
													});
													var studies_csv = study_ids_arr.join(',');
													if (shared_marker_information[studies_csv] != undefined) {
														delete shared_marker_information[studies_csv];
													}
												}
												analysis_summary_update();
											});	
										}	
									},
									error: function (err) {
										upset_plot_2_studies_finished = upset_plot_2_studies_finished + 1;
									}
								});
							}

							// const sets = UpSetJS.asSets(data_upset_plot_2);
							// UpSetJS.render(document.getElementById('analysis-overlapping-genotypes-upset-2'), { 
							// 	sets: sets,
							// 	width: 400,
							// 	height: 300,
							// });

							
							// Check to see whether studies are using shared datasets (if so, add a warning)
							// VERSION 1 uses Form State lookup which we don't want any more
							// var vcf_files_ui_api_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files/' + Object.keys(cartograplant['detected_studies']).join(',');
							// VERSION 2 uses Gabe's vcf_location tabe
							var vcf_files_ui_api_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files_indexed/' + Object.keys(cartograplant['detected_studies']).join(',');
							console.log('vcf_files_ui_api_url', vcf_files_ui_api_url);
							$.ajax({
								method: 'GET',
								url: vcf_files_ui_api_url,
								success: function(data) {
									var all_data = data;
									data = data['vcf_locations'];
									console.log('snp_vcf_files', data);
									var vcf_found_count = 0;
									if(data != undefined) {
										var vcf_info = data;
										var studies_tmp = Object.keys(data);
										
										if (studies_tmp.length > 0) {
											var detected_vcf_overlaps_html = "";
											var unique_combinations = {};
											for (var studies_tmp_i = 0; studies_tmp_i < studies_tmp.length; studies_tmp_i++) {
												var study_tmp_i = studies_tmp[studies_tmp_i];
												console.log('study_tmp_i', study_tmp_i);
												var vcf_location_tmp_i = vcf_info[study_tmp_i];
												console.log('vcf_location_tmp_i', vcf_location_tmp_i);
												for(var studies_tmp_j = 0; studies_tmp_j < studies_tmp.length; studies_tmp_j++) {
													var study_tmp_j = studies_tmp[studies_tmp_j];
													console.log('study_tmp_j', study_tmp_j);
													var vcf_location_tmp_j = vcf_info[study_tmp_j];
													console.log('vcf_location_tmp_j', vcf_location_tmp_j);
													if (studies_tmp_i != studies_tmp_j) {
														if (vcf_location_tmp_i == vcf_location_tmp_j) {
															if (unique_combinations[study_tmp_i + ',' + study_tmp_j] == undefined && unique_combinations[study_tmp_j + ',' + study_tmp_i] == undefined) { 
																detected_vcf_overlaps_html += '<div>';
																detected_vcf_overlaps_html += '🔀 ' + study_tmp_i + " and " + study_tmp_j + " have shared datasets<br />";
																detected_vcf_overlaps_html += '</div>';
																console.log('unique combination found:' + study_tmp_i + ' and ' + study_tmp_j);
																unique_combinations[study_tmp_i + ',' + study_tmp_j] = true; // record this new combination																
															}
														}
													}
													else {
														// don't record a match if i == j (same study)
													}
												}
											}
											$('#analysis-overlapping-genotypes-summary-insights #genotype-insights-shared-dataset-status').html(detected_vcf_overlaps_html);
				
										}
									}
								}
							});
						


							// On click checkbox with individual study (when there is only a single study)
							// On click checkbox (insert into the database entire study SNPS) using CT API
												

							// On click checkbox (insert into the database entire study SNPS) using CT API
							$('.snp_all_checkbox').click(function() {
								cartograplant['analysis_filter_snp_section_loaded'] = false;
								analysis_summary_update();
								var is_checked = false;
								if ($(this).is(':checked')) {
									is_checked = true;
								}

								if(is_checked) {
									// Checked so we need to insert this analysis_data
									console.log('insert_all_snp_overlap');
									// Get the studies
									var study_id = $(this).parent().attr('data-venn-sets');
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_study_all';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
											study_id: study_id
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});										
									
								}
								else {
									// Checked so we need to insert this analysis_data
									console.log('delete_all_snp_overlap');
									// Get the studies
									var study_id = $(this).parent().attr('data-venn-sets');
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_study_all';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
											study_id: study_id
										},
										success: function(data) {
											var results = JSON.parse(data);
											console.log(results);
										}
									});		
								}	
													
							});

							// On click checkbox (insert into the database overlaps) using CT API
							$('.snp_overlap_checkbox').click(function() {
								cartograplant['analysis_filter_snp_section_loaded'] = false;
								analysis_summary_update();
								var is_checked = false;
								if ($(this).is(':checked')) {
									is_checked = true;
								}

								if(is_checked) {
									
									// Checked so we need to insert this analysis_data
									console.log('insert_snp_overlap')
									// Get the studies
									// var studies = $(this).parent().attr('data-venn-sets');
									var studies = $(this).attr('value');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_studies_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
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
									// var studies = $(this).parent().attr('data-venn-sets');
									var studies = $(this).attr('value');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_studies_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
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
								cartograplant['analysis_filter_snp_section_loaded'] = false;
								analysis_summary_update();
								var is_checked = false;
								if ($(this).is(':checked')) {
									is_checked = true;
								}

								if(is_checked) {
									// Checked so we need to insert this analysis_data
									console.log('insert_snp_none_overlap')
									// Get the studies
									// var studies = $(this).parent().attr('data-venn-sets');
									var studies = $(this).attr('value');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_markers_studies_none_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
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
									// var studies = $(this).parent().attr('data-venn-sets');
									var studies = $(this).attr('value');
									var study_ids_arr = studies.split("_");
									
									var url = Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_markers_studies_none_overlap';
									$.ajax({
										method: 'POST',
										url: url,
										data: {
											analysis_id: cartograplant.current_analysis_id,
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

	// This looks for changes to the analysis phenotypes section that lists phenotypes and a select element if
	// the phenotype has multiple units
	$(document).on('change', '#analysis-overlapping-traits-traits-list td.phenotype_units select', function() {
		console.log('Phenotype units select element has changed to ' + $(this).val());
		var phenotype_name = $(this).parent().attr('phenotype_name');
		var studies_csv = $(this).attr('studies_csv');
		var units_csv = $(this).attr('units_csv');
		console.log('Phenotype_name', phenotype_name);

		// Remove the old histogram (grid_element class)
		$('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + phenotype_name + '"]').html('');

		analysis_overlapping_traits_grid_histogram_element_add('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + phenotype_name + '"]', phenotype_name, studies_csv, units_csv, $(this).val());
	});

	// This happens when someone clicks on the phenotype / traits analysis tab
	$('#analysis-overlapping-traits-tab').off('click');
	$('#analysis-overlapping-traits-tab').on('click', function() {
	// $('a[href="#analysis-overlapping-traits"]').on('click', function() {
	
		if (analysis_traits_configuration_tab == true) {
			console.log('#analysis-overlapping-traits-tab already generated - bypassing')
			return;
		}

		// Sets this tab as loaded
		analysis_traits_configuration_tab = true;

		// TEST PCA / SCATTERPLOT
		try {
			// $('#analysis-overlapping-traits-scatterplot').html('');
			// scatterplot_basic_set_container('#analysis-overlapping-traits-scatterplot');
			// scatterplot_basic_create();
		}
		catch (err) {
			console.log('pca_error', err);
		}

		// // TEST TRIPALD3 interactive histogram
		// // #analysis-overlapping-traits-histogram
		// try {
		// 	$('#analysis-overlapping-traits-histogram').html('');
		// 	var histoData = [
		// 		4.1     	,
		// 		5.3     	,
		// 		4.4     	,
		// 		3.9     	,
		// 		5.5     	,
		// 		5.3     	,
		// 		5.4     	,
		// 		4.3     	,
		// 		4.2     	,
		// 		4.0     	,
		// 		6.3     	,
		// 		7.9     	,
		// 		4.5     	,
		// 		5.2     	,
		// 		4.6     	,
		// 		5.4     	,
		// 		5.6     	,
		// 		4.6     	,
		// 		5.1     	,
		// 		4.6     	,
		// 		3.7     	,
		// 		4.8     	,
		// 		7.7     	,
		// 		4.3     	,
		// 		3.8     	,
		// 		5.0     	,
		// 		4.5     	,
		// 		4.6     	,
		// 		4.1     	,
		// 		4.6     	,
		// 		7.1     	,
		// 		5.5     	,
		// 		5.2     	,
		// 		4.5     	,
		// 		4.8     	,
		// 		4.1     	,
		// 		4.4     	,
		// 		4.8     	,
		// 		4.8     	,
		// 		3.9     	,
		// 		3.9     	,
		// 		8.2     	,
		// 		6.2     	,
		// 		3.7     	,
		// 		5.4     	,
		// 		5.1     	,
		// 		3.7     	,
		// 		5.2     	,
		// 		7.1     	,
		// 		4.4     	,
		// 		3.8     	,
		// 		6.8     	,
		// 		4.9     	,
		// 		4.7     	,
		// 		4.2     	,
		// 		4.2     	,
		// 	];
		
		// 	// Change to version D3 version 3
		// 	d3m_execute('v3', function() {
		// 		// Draw your chart.
		// 		tripalD3.drawFigure(
		// 			histoData,
		// 			{
		// 				"chartType" : "histogram",
		// 				"elementId": "analysis-overlapping-traits-histogram",
		// 				"height": 500,
		// 				"width": 1000,
		// 				"keyPosition": "right",
		// 				"title": "SNPs available for the selection of <em>Tripalus databasica</em>",
		// 				"legend": "The above histogram depicts the number of SNPs available per selected tree for <em>Tripalus databasica</em>.",
		// 				"chartOptions": {
		// 				"xAxisTitle": "",
		// 				"yAxisTitle": "",
		// 				}
		// 			}
		// 		);
		// 		d3m_execute('v5');	
		// 	});

		// }
		// catch (err) {
		// 	console.log('tripald3 interactive histogram',err);
		// }


		console.log('Analysis overlap tab click detected');
		console.log('html', $('#analysis-overlapping-traits-studies').html());
		//if ($('#analysis-overlapping-traits-studies').html() == "") {
			console.log('Generating html');
			$('#analysis-overlapping-traits-studies').html('<i class="fas fa-clock"></i> Detecting studies...');
			$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-clock"></i> Querying ' + analysis_includedTrees.length + ' plants ' + '<span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />');
			$('#analysis-overlapping-traits-traits-list').html('<i class="fas fa-clock"></i> Awaiting query...');
			$('#analysis-overlapping-traits-traits-operation-container').fadeOut(500);
			$('#analysis-overlapping-traits-download-by-selected-phenotypes').fadeOut(500);

			//get_detected_studies_from_selected_trees();
			//console.log(cartograplant.detected_studies);

			//var studies = Object.keys(cartograplant.detected_studies);
			var studies = get_selections_studies();
			// if(studies.length <= 1) {
			// 	$('#analysis-overlapping-traits-studies').html('⚠️ You must select at least 2 studies to begin trait overlap detection. Please return to the map filter section to include additional studies.');
			// 	return;
			// 	// $('#analysis-overlapping-traits-traits-list').html('You must select at least 2 studies to begin trait overlap detection. Please return to the map filter section to include additional studies.')
			// }

			var study_info_html = '';
			if (studies.length == 0) {
				study_info_html += '⚠️ ';
			}
			study_info_html += studies.length + ' studies based on analysis study context choices<br />';
			for(var i=0; i<studies.length; i++) {
				if(i > 0) {
					// study_info_html += ', ';
				}
				study_info_html += '<div style="display: inline-block; padding: 3px; border-radius: 2px; background-color: #036e63; color: #FFFFFF; margin-right: 3px;">' + studies[i] + '</div>';
			}
			$('#analysis-overlapping-traits-studies').html(study_info_html);

			// Make main container visible
			$('#analysis-overlapping-traits-traits-operation-container').fadeIn(500);

			// Make the traits list container visible
			$('#analysis-overlapping-traits-traits-list').fadeIn(500);


			var phenotypes_all = {};
			var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_all_by_studies_views";
			var phenotype_names_with_overlaps = {};
			$.ajax({
				method: 'POST',
				url: url,
				data: {
					studies: JSON.stringify(studies)
				},
				success: function(data) {
					console.log('all-phenotypes-data', data);
					if(data.length > 0) {
						for(var i=0; i<data.length; i++) {
							var row = data[i];
							var phenotypes = row.phenotypes;
							var accession = row.accession;
							for(var j=0; j<phenotypes.length; j++) {
								var phenotype = phenotypes[j];
								if(phenotypes_all[phenotype] == undefined) {
									//add it to phenotypes_all
									phenotypes_all[phenotype] = {
										studies: {},
										units: "NA"
									};
								}
								// Now add this study to the key: studies
								phenotypes_all[phenotype]['studies'][accession] = true;
							}

							// RISH 1/8/2025: Emily recoded a view and so logic changed
							// var phenotype = row.phenotype;
							// var accession = row.accession;
							// if(phenotypes_all[phenotype] == undefined) {
							// 	//add it to phenotypes_all
							// 	phenotypes_all[phenotype] = {
							// 		studies: {},
							// 		units: "NA"
							// 	};
							// }
							// // Now add this study to the key: studies
							// phenotypes_all[phenotype]['studies'][accession] = true;
						}

						// Now output the list of phenotypes to the UI
						var phenotypes_arr = Object.keys(phenotypes_all);
						
						// Clear the traits grid container before generating any detected histograms
						$('#analysis-overlapping-traits-traits-histogram-grid').html('');

						// Clear the traits list container before adding the phenotypes and checkboxes
						$('#analysis-overlapping-traits-traits-list').html('');
						var phenotypes_items_html = '<table id="analysis-overlapping-traits-traits-table" style="width: 100%; border-collapse:separate; border-spacing:5px;">';
						
						
						for(var i=0; i<phenotypes_arr.length; i++) {
							var studies_csv = "";
							if(phenotypes_all[phenotypes_arr[i]]['studies'] != undefined) {
								studies_csv = Object.keys(phenotypes_all[phenotypes_arr[i]]['studies']).join(',');
							}

							// check if overlap with all studies
							var overlap_html = '<div style="text-align: center;">No overlaps</div>';
							console.log(Object.keys(phenotypes_all[phenotypes_arr[i]]['studies']).length);

							// if overlaps are found
							
							if(Object.keys(phenotypes_all[phenotypes_arr[i]]['studies']).length == studies.length) {
								overlap_html = '<div style="display: inline-block; padding: 3px; color: #FFFFFF; background-color: #036e63; border-radius: 2px;">Overlaps with all studies</div>';

								// If these are the overlaps detected, we can generate a grid of histograms for these below.
								var traits_grid_html = '<div class="grid_element trait_grid_element" style="display: inline-block;" studies="' + studies_csv + '" phenotype_name="' + phenotypes_arr[i] + '"></div>';
								$('#analysis-overlapping-traits-traits-histogram-grid').append(traits_grid_html);


								// // Load the histogram into the grid elememt
								// analysis_overlapping_traits_grid_histogram_element_add('#analysis-overlapping-traits-traits-histogram-grid .grid_element[phenotype_name="' + phenotypes_arr[i] + '"]', phenotypes_arr[i], studies_csv)

								// Record that this phenotype has overlaps between all studies
								// This is needed for later on code to either generate or block generation of the histogram
								phenotype_names_with_overlaps[phenotypes_arr[i]] = true;
							}
							console.log('phenotype_names_with_overlaps', phenotype_names_with_overlaps)

							phenotypes_items_html += '<tr>';
							phenotypes_items_html += '<td style="min-width: 30%;"><input class="trait_select_checkbox" type="checkbox" studies="' + studies_csv + '" phenotype_name="' + phenotypes_arr[i] + '"><span style="margin-left: 5px; text-decoration: none; cursor: pointer; text-decoration: none;" class="trait_description" studies="' + studies_csv + '" phenotype_name="' + phenotypes_arr[i] + '">' + phenotypes_arr[i] + '</span></td>';
							phenotypes_items_html += '<td phenotype_name="' + phenotypes_arr[i] + '" class="counts" ' + 'style="min-width: 20%;">Querying phenotype counts</td>';
							phenotypes_items_html += '<td phenotype_name="' + phenotypes_arr[i] + '" class="phenotype_units" ' + 'style="min-width: 15%;">Loading...</td>';
							phenotypes_items_html += '<td phenotype_name="' + phenotypes_arr[i] + '" class="phenotype_units_processing" ' + 'style="min-width: 5%;"></td>';
							phenotypes_items_html += '<td phenotype_name="' + phenotypes_arr[i] + '" class="phenotype_overlap_status" style="min-width: 30%;">' + overlap_html + '</td>';
							phenotypes_items_html += '</tr>';
							// phenotypes_items_html += '<div style="margin-bottom: 5px;"><div style="width: 25%; display: inline-block;"><input type="checkbox" studies="' + studies_csv + '" value="' + phenotypes_arr[i] + '"> ' + phenotypes_arr[i] + '</div>' + overlap_html + '<div>';
						}
						phenotypes_items_html += "</table>";
						$('#analysis-overlapping-traits-traits-list').append(phenotypes_items_html);


						// We need to check the units of each study for this particular phenotype
						// to see if they match or not
						for(var i=0; i<phenotypes_arr.length; i++) {
							var phenotype_name = phenotypes_arr[i];

							$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + phenotype_name + '"].phenotype_units').html('Retrieving');
							var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/single_phenotype_name_units_per_studies";
							$.ajax({
								method: 'POST',
								url: url,
								data: {
									studies: JSON.stringify(studies),
									phenotype_name: phenotype_name
								},
								success: function(data) {
									console.log('phenotypes_single_phenotype_name_units_per_studies', data);

									// this means we got back rows for each study based on the phenotype
									// which is good - this means we have possible options for units
									
									// Let's see if the units match or not using a simple object
									var units_options_obj = {};

									// Go through each row and get the units used
									var row = undefined;
									var units_csv = "";
									var studies_csv = "";
									for (var i =0; i < data.length; i++) {
										row = data[i];
										console.log('row', row);
										var units = row['units'];
										var accession = row['accession'];
										units_options_obj[units] = true; // the value true just acts as a placeholder, it's the key were interested in.
										if (i > 0) {
											units_csv += ",";
											studies_csv += ",";
										}
										units_csv += units;
										studies_csv += accession;
									}
									console.log('units_options_obj', units_options_obj);

									// Get studies related to this specific phenotype
									// var studies_csv = "";
									// if(phenotypes_all[row['phenotype']]['studies'] != undefined) {
									// 	studies_csv = Object.keys(phenotypes_all[row['phenotype']]['studies']).join(',');
									// }

									var units_options = Object.keys(units_options_obj);
									console.log('units_options', units_options);

									if (units_options.length <= 1) {
										if (units_options.length == 0) {
											$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + row['phenotype'] + '"].phenotype_units').html('⛔');
										}
										else {
											// One common unit was found for the phenotype_name in the specified combinations
											if (units_options[0] == 'null') {
												$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + row['phenotype'] + '"].phenotype_units').html('⛔');
												// Load the histogram into the grid elememt (if units is null - assume they are the same)
												// analysis_overlapping_traits_grid_histogram_element_add('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + row['phenotype'] + '"]', row['phenotype'], studies_csv)
											}
											else {
												$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + row['phenotype'] + '"].phenotype_units').html(units_options[0]);
												// Load the histogram into the grid element if the units for the studies are the same type
												if (phenotype_names_with_overlaps[row['phenotype']] != undefined) {
													analysis_overlapping_traits_grid_histogram_element_add('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + row['phenotype'] + '"]', row['phenotype'], studies_csv)
												}
											}
										}
									}
									else {
										// This means there are different units so create a select list to let user choose
										var select_html = '<select studies_csv="' + studies_csv + '" units_csv="' + units_csv + '">';
										for(var i=0; i<units_options.length; i++) {
											var is_selected = "";
											if (i == 0) {
												is_selected = "selected";
											}
											select_html += '<option ' + is_selected + 'value="' + units_options[i]  + '">';
											select_html += units_options[i];
											select_html += '</option>';
										}
										select_html += '</select>';
										$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + row['phenotype'] + '"].phenotype_units').html(select_html);
										// Load the histogram into the grid elememt (REMOVE THIS LATER ON SINCE WE ACTUALLY WANT
										// THE USER TO SPECIFY THE UNITS FOR CONVERSION BEFORE SHOWING IT)
										console.log(row);
										if (phenotype_names_with_overlaps[row['phenotype']] != undefined) {
											analysis_overlapping_traits_grid_histogram_element_add('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + row['phenotype'] + '"]', row['phenotype'], studies_csv, units_csv, $('#analysis-overlapping-traits-traits-list td[phenotype_name="' + row['phenotype'] + '"].phenotype_units select').val());
										}
									}
									



								}
							});						
						}
								

						// Now perform the counts dynamically as well
						for(var i=0; i<phenotypes_arr.length; i++) {
							var phenotype_name = phenotypes_arr[i];
							var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_count_by_overlapping_studies";
							$.ajax({
								method: 'POST',
								url: url,
								data: {
									studies: JSON.stringify(studies),
									phenotype_name: phenotype_name
								},
								success: function(data) {
									console.log('phenotypes_values_by_overlapping_studies', data);
									// var values = [];
									var rows = [];
									if(data['rows'] != undefined) {
										rows = data['rows'];
									}

									var phenotype_name = data.phenotype_name;
									for(var i=0; i<rows.length; i++) {
										var row = rows[i];
										// console.log('value', row.value);
										var count = parseInt(row.c1).toLocaleString();
										
										// update the row in the table
										$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"].counts').html(count + ' phenotypes');
										// $('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"].phenotype_units').html(row.units);
									}
									if (rows.length == 0) {
										$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"].counts').html('0 phenotypes');
										$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"].phenotype_overlap_status').html('');
										// Hide this phenotype row since there are no phenotypes found for it
										$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"]').parent().hide();
									}
									else {
										$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"]').parent().show();
									}				
								}
							});						
						}
					}
					else {
						$('#analysis-overlapping-traits-traits-list').html('No phenotypes found for these studies.');
						// Clear the traits grid container before generating any detected histograms
						$('#analysis-overlapping-traits-traits-histogram-grid').html('');			
					}
					// data = JSON.parse(data);
					// console.log('overlapping-phenotypes-data', data);
				}
			});
		// }
		// else {
		// 	console.log('Do not regenerate the phenotype overlap interface since it already has been generated');
		// }

		// We need to query the API for the studies detected (phenotypes_phenotypes_overlaps_by_studies_views)
		// var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_overlaps_by_studies_views";
		// $.ajax({
		// 	method: 'POST',
		// 	url: url,
		// 	data: {
		// 		studies: JSON.stringify(studies)
		// 	},
		// 	success: function(data) {
		// 		console.log('overlapping-phenotypes-data', data);
		// 		// data = JSON.parse(data);
		// 		// console.log('overlapping-phenotypes-data', data);
		// 	}
		// });


		//$('#analysis-overlapping-traits-studies').html('<i class="fas fa-book"></i> Detected studies: ' + Object.keys(detected_studies).length);
		
		// if(studies.length > 0) {
		// 	var timer_name = 'studies_intersecting_traits_timer';
		// 	if(analysis_timers[timer_name] != undefined) {
		// 		clearInterval(analysis_timers[timer_name]);
		// 	}
		// 	else {
		// 		analysis_timers[timer_name] = {};
		// 		analysis_timers[timer_name]['current_value'] = 0;
		// 		analysis_timers[timer_name]['timer'] = setInterval(function (element_id) {
		// 			analysis_timers[timer_name]['current_value'] = analysis_timers[timer_name]['current_value'] + 1;
		// 			$(element_id).html(analysis_timers[timer_name]['current_value'] + 's (please wait...)');
		// 		}, 1000, '#studies_intersecting_traits_timer_div');
		// 	}
		// 	var send_data = JSON.stringify(detected_studies);
		// 	var url = Drupal.settings.base_url + "/cartogratree/api/v2/traits/union/by_batch";
		// 	$('#analysis-overlapping-traits-status').html('Status: Finding all traits across all studies ... ');
		// 	$.ajax({
		// 		method: "POST",
		// 		data: {
		// 			'data': send_data
		// 		},
		// 		url: url,
		// 		dataType: "json",
		// 		success: function (data) {
		// 			console.log(data);
		// 			if(data.length > 0) {
		// 				var html = "";
		// 				var all_traits = []; // collect all_traits for later on
		// 				for(var i=0; i<data.length; i++) {
		// 					all_traits.push(data[i].name);
		// 				}


		// 				$('#analysis-overlapping-traits-status').html('Status: Finding tree counts for each trait <span class="loading"></span> <span id="status_finding_tree_counts_remaining"></span>');
		// 				for(var i=0; i<data.length; i++) {
		// 					var removeRegEx = /[^\w]+/g;
		// 					var id_name_potential_filtered_trees_nospaces = "analysis-overlapping-traits-filtered-trees-checkbox-" +  data[i].name.replaceAll("%", "_").replaceAll(removeRegEx, "_");
		// 					var id_name_has_overlap_trees_nospaces = "analysis-overlapping-has-overlap-trees-checkbox-" +  data[i].name.replaceAll(removeRegEx, "_");
		// 					html += '<div style="margin-top: 5px; margin-bottom: 5px; display: flex;">';
		// 					html += '<div style="width: 25%;">';
		// 					html += '<input type="checkbox" value="' + data[i].name +  '" class="analysis-overlapping-traits-overlap-phenotype-checkbox"> <span style="background-color: #007eff; color: #FFFFFF; padding: 5px; border-radius: 5px;">Trait</span> ' + data[i].name;
		// 					html += '</div>';
		// 					html += '<div style="width: 35%;" id="' + id_name_potential_filtered_trees_nospaces + '">';
		// 					html += '<i class="fas fa-hourglass"></i> Counting trees <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />';
		// 					html += '</div>';
		// 					html += '<div style="width: 35%;" id="' + id_name_has_overlap_trees_nospaces + '">';
		// 					html += '<i class="fas fa-hourglass"></i> Checking for overlaps <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />';
		// 					html += '</div>';							
		// 					html += '</div>';

		// 					var trees = mapState.includedTrees;
		// 					var operand = 'union'; // I don't think this matters per say for this check since it's a single trait but still needed to fulfill the API requirement
		// 					var traits = [data[i].name];
		// 					analysis_overlapping_traits_tree_count_by_specific_trait(trees, 'union', traits, id_name_potential_filtered_trees_nospaces, i, data.length);
		// 					// analysis_overlapping_traits_tree_count_overlap_by_specific_trait(detected_studies, trait, id_name_potential_overlap_trees_nospaces);
		// 				}

		// 				// Update UI
		// 				$('#analysis-overlapping-traits-traits-operation-container').fadeIn(500);
		// 				$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-smile"></i> ' + data.length +  ' traits detected!');
		// 				$('#analysis-overlapping-traits-traits-list').html(html);
		// 				$('#analysis-overlapping-traits-traits-list').fadeIn(500);

		// 				// Check which traits have overlap between all studies selected and update the UI
		// 				analysis_has_overlapping_traits(detected_studies, all_traits);

		// 			}
		// 			else {
		// 				$('#analysis-overlapping-traits-traits-list-summary').html('<i class="fas fa-not-equal"></i> Sorry, no phenotypes overlap.');
		// 				$('#analysis-overlapping-traits-traits-list').fadeOut(500);
		// 				$('#analysis-overlapping-traits-traits-operation-container').fadeOut(500);
		// 			}
		// 			clearInterval(analysis_timers[timer_name]['timer']);
		// 			analysis_timers[timer_name] = undefined;
		// 			$('#studies_intersecting_traits_timer_div').html('');
		// 		},
		// 		error: function() {
		// 			clearInterval(analysis_timers[timer_name]['timer']);
		// 			analysis_timers[timer_name] = undefined;
		// 			$('#studies_intersecting_traits_timer_div').html('');
		// 		}
		// 	});
		// }
		// else {

		// }
	});



	function analysis_overlapping_trait_select_checkbox(el) {
		var element = $(el);
		var unique_id = element.attr('phenotype_name');
		console.log('Checkbox clicked:' + unique_id);

		// check if the checkbox is already selected or not
		console.log(interactive_histograms_selected_data[unique_id]);

		analysis_summary_update();
		if(element.is(":checked") == true) {
			// perform an insert (since the checkbox is now selected)
			// Check to see whether an interactive histogram with container name exists
			//console.log(Object.keys(interactive_histograms_selected_data));
			// Count the items
			var phenotypes_count = 0;
			if(interactive_histograms_selected_data[unique_id] != undefined) {
				// there is already a threshold object created

				console.log('interactive_histograms_selected_data[unique_id]',interactive_histograms_selected_data[unique_id]);
				var csv_data = "phenotype_id,phenotype_name,plant_accession,value\n"; // used to upload csv file to workspace
				if(interactive_histograms_selected_data[unique_id].length > 0) {
					var keys = Object.keys(interactive_histograms_selected_data[unique_id]);
					for(var i=0; i<interactive_histograms_selected_data[unique_id].length; i++) {
						var phenotype_id_arr = interactive_histograms_selected_data[unique_id][i]['phenotype_id'].split(',');
						var plant_accession_arr = interactive_histograms_selected_data[unique_id][i]['plant_accession'].split(',');
						var phenotype_value_arr = interactive_histograms_selected_data[unique_id][i]['value'].split(',');
						var phenotype_name = unique_id;

						// Generate the csv_data
						for (var j=0; j<phenotype_id_arr.length; j++) {
							csv_data += phenotype_id_arr[j] + ',' + phenotype_name + ',' + plant_accession_arr[j] + ',' + phenotype_value_arr[j] + "\n";
						}

						phenotypes_count += phenotype_id_arr.length;
					}
					console.log('phenotypes_count', phenotypes_count);
					$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + unique_id + '"].counts').html(phenotypes_count.toLocaleString() + ' phenotypes');

					// Upload to history / workspace
					// Upload to history
					var formData = new FormData();
					// formData.append('galaxy_id', cartograplant.galaxy_id);
					// formData.append('workflow_id', workflow_id);
					// formData.append('history_id', cartograplant.history_id);
					// var file_upload_element = document.getElementById(file_id);
					formData.append('raw_data', csv_data);
					formData.append('file_name', 'AN' + cartograplant.current_analysis_id + '_PHENOVER_' + phenotype_name + '_adjusted-overlaps.csv');
					formData.append('workspace_name', $('#nextflow-create-analysis-select-history').val());
					// if(cartograplant.history_id == null) {
					// 	alert('Cannot upload a file without selecting a workspace to store the file, please visit the Begin tab to select or create a workspace');
					// 	return;
					// }
			
					
					// var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_history";
					var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_nextflow_workspace";
					$.ajax({
						xhr: function() {
							var xhr = new window.XMLHttpRequest();
						
							xhr.upload.addEventListener("progress", function(evt) {
								if (evt.lengthComputable) {
									var percentComplete = evt.loaded / evt.total;
									percentComplete = parseInt(percentComplete * 100);
									console.log(percentComplete);
									// $('#' + status_container).html('Uploading ... ' + percentComplete + '% completed.');
							
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
							if(data['status'] != undefined) {
								if(data['status'] == true) {
									alert('Phenotype ' + phenotype_name + ' overlaps adjusted uploaded to workspace')
									// $('#' + status_container).html('<br /><div style="padding: 5px; border-radius: 3px; background-color: #fffd9c;">Successfully uploaded! Please refresh workflow until it appears in the select list</div>');
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

				}

				console.log('Found unique_id: ' + unique_id, ' with data:', interactive_histograms_selected_data[unique_id])
				var data = JSON.stringify(interactive_histograms_selected_data[unique_id]);
				// push to analysis_data
				$.ajax({
					method: 'POST',
					url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_data',
					data: {
						analysis_id: cartograplant.current_analysis_id,
						variable_name: 'phenotype_threshold_' + unique_id,
						variable_data: data
					},
					success: function (data) {
						console.log(data);
					}
				});

			}
			else {
				// Perform a full pull and push (we could do this mostly with API only
				// but this seems easier to manage)
				var phenotype_name = $(element).attr('phenotype_name');
				var studies = $(element).attr('studies');
				if(studies != undefined) {
					studies = studies.split(',');// since this is a csv, we split by commas
				}
				var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_values_by_overlapping_studies";
				$.ajax({
					method: 'POST',
					url: url,
					data: {
						studies: JSON.stringify(studies),
						phenotype_name: phenotype_name,
						compression: true
					},
					success: function(data) {
						console.log('phenotypes_values_by_overlapping_studies', data);
	
						if(data['zlib_deflated_base64'] != undefined) {
							// This is JSON stringified, zlib deflated and base 64 encoded so we need to undo that
							var base64Data = data.zlib_deflated_base64;
							// console.log('base64Data', base64Data);
							var compressData = atob(base64Data);
							var compressData = compressData.split('').map(function(e) {
								return e.charCodeAt(0);
							});				
							var inflate = new Zlib.Inflate(compressData);
							var output = inflate.decompress(); // UINT8Arra
							output = new TextDecoder().decode(output);
							// console.log('ungzipped output', output);
							var data = JSON.parse(output);
							phenotypes_count = data.length;
							$('#analysis-overlapping-traits-traits-table td[phenotype_name="' + phenotype_name + '"].counts').html(phenotypes_count.toLocaleString() + ' phenotypes');			
						}
	
						var values = [];
						for(var i=0; i<data.length; i++) {
							var row = data[i];
							// console.log('value', row.value);
							var obj = {};
							// values.push(parseFloat(row.value));
							obj['year'] = row.year;
							obj['value'] = row.value;
							obj['phenotype_id'] = row.phenotype_id;
							obj['phenotype_name'] = phenotype_name;
							obj['plant_accession'] = row.plant_accession;
							obj['study_accession'] = row.study_accession;
							
							
							values.push(obj);
										
						}

						// Insert data into databse
						try {
							console.log('Inserting data');
							$.ajax({
								method: 'POST',
								url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/insert_data',
								data: {
									analysis_id: cartograplant.current_analysis_id,
									variable_name: 'phenotype_threshold_' + unique_id,
									variable_data: JSON.stringify(values)
								},
								success: function (data) {
									console.log(data);
								}
							});
						}
						catch (err) {
							console.log('traits interactive histogram error', err);
						}
						
						// Generate the CSV and push to workspace
						var csv_data = 'phenotype_id,phenotype_name,plant_accession,study_accession,year,value\n';
						console.log(data);
						for(var i=0; i<data.length; i++) {
							var row = data[i];
							// console.log('value', row.value);
							var obj = {};
							// values.push(parseFloat(row.value));
							obj['year'] = row.year;
							obj['value'] = row.value;
							obj['phenotype_id'] = row.phenotype_id;
							obj['phenotype_name'] = phenotype_name;
							obj['plant_accession'] = row.plant_accession;
							obj['study_accession'] = row.study_accession;
							if (obj['value'] != 'NA') {
								csv_data += obj['phenotype_id'] + ',' + obj['phenotype_name'] + ',' + obj['plant_accession'] + ',' + obj['study_accession'] + ',' +  obj['year'] + ',' + obj['value'] + '\n';					
							}
						}

						// Upload to history
						var formData = new FormData();
						//formData.append('galaxy_id', cartograplant.galaxy_id);
						//formData.append('workflow_id', workflow_id);
						//formData.append('history_id', cartograplant.history_id);
						// var file_upload_element = document.getElementById(file_id);
						formData.append('raw_data', csv_data);
						formData.append('file_name', 'AN' + cartograplant.current_analysis_id + '_PHENOVER_' + phenotype_name + '_all-overlaps.csv');
						formData.append('workspace_name', $('#nextflow-create-analysis-select-history').val());
						// if(cartograplant.history_id == null) {
						// 	alert('Cannot upload a file without selecting a workspace to store the file, please visit the Begin tab to select or create a workspace');
						// 	return;
						// }
				
						
						// var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_history";
						var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_nextflow_workspace";
						$.ajax({
							xhr: function() {
								var xhr = new window.XMLHttpRequest();
							
								xhr.upload.addEventListener("progress", function(evt) {
									if (evt.lengthComputable) {
										var percentComplete = evt.loaded / evt.total;
										percentComplete = parseInt(percentComplete * 100);
										console.log(percentComplete);
										// $('#' + status_container).html('Uploading ... ' + percentComplete + '% completed.');
								
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
								if(data['status'] != undefined) {
									if(data['status'] == true) {
										alert('Phenotype '  + phenotype_name + ' overlaps uploaded to workspace')
										// $('#' + status_container).html('<br /><div style="padding: 5px; border-radius: 3px; background-color: #fffd9c;">Successfully uploaded! Please refresh workflow until it appears in the select list</div>');
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
					}
				});
			}
		}
		else {
			// perform a delete
			// If not, perform a full pull and push to the db
			$.ajax({
				method: 'POST',
				url: Drupal.settings.base_url + '/cartogratree/api/v2/analysis/delete_data',
				data: {
					analysis_id: cartograplant.current_analysis_id,
					variable_name: 'phenotype_threshold_' + unique_id,
				},
				success: function (data) {
					console.log(data);
				}
			});	
		}

		// Also generate the PCA 
		var checkboxes = $('.trait_select_checkbox');
		var phenotypes = [];
		var studies = [];
		for (var i = 0; i < checkboxes.length; i++) {
			// Using $() to re-wrap the element.
			// Check whether the checkbox is checked or not
			if($(checkboxes[i]).is(':checked')) {
				var e_phenotype = $(checkboxes[i]).attr('phenotype_name');
				if(phenotypes.includes(e_phenotype) == false) {
					phenotypes.push(e_phenotype);
				}
				var e_studies = $(checkboxes[i]).attr('studies').split(','); // comma separated
				for(var j=0; j<e_studies.length; j++) {
					if(studies.includes(e_studies[j]) == false) {
						studies.push(e_studies[j]);
					}
				}
			}
		}

		// send phenotypes and studies to the CP API endpoint
		// there must be at least 2 phenotypes to generate a PCA
		if(phenotypes.length > 1) {
			// alert('Generating a PCA');
			$('#analysis-overlapping-traits-pca').html('<div style="text-align: center"><img src="' + loading_icon_src + '" /><br />Generating a PCA for ' + phenotypes.length + ' phenotypes.</div>');
			$.ajax({
				method: 'POST',
				url: Drupal.settings.base_url + '/cartogratree/api/v2/phenotypes/phenotypes_pca',
				data: {
					analysis_id: cartograplant.current_analysis_id,
					phenotypes: JSON.stringify(phenotypes),
					studies: JSON.stringify(studies)
				},
				success: function (data) {
					console.log(data);
					data = JSON.parse(data);
					console.log('Phenotype PCA data', data);
					if(data['error'] == undefined) { 
						$('#analysis-overlapping-traits-pca').html('');
						const blob = b64toBlob(data['data_base64'], 'image/png');
						var html = "";
						html += '<center><div style="background-color: #036e63;color: #FFFFFF;font-size: 14px;display: inline-block;padding: 5px;border-radius: 2px;">PCA (' + phenotypes.length + ' phenotypes)</div></center><br />';
						html += '<img style="width: 100%;" src="' + URL.createObjectURL(blob) + '" />';
						$('#analysis-overlapping-traits-pca').html(html);

						$('#analysis-overlapping-traits-pca img').wrap('<span style="display:inline-block"></span>')
						.css('display', 'block')
						.parent().zoom({magnify:1.5});
					}
				}
			});	
		}
		else {
			$('#analysis-overlapping-traits-pca').html('');
		}
					
	}
		
	/**
	 * This code will pull all the data from the first histogram which has the adjust threshold button
	 * Creates a new histogram on the right side of the UI which allows dragging the line thresholds
	 * @param {*} element 
	 */
	function analysis_overlapping_traits_histogram_dataselect_element(element) {
		var phenotype_name = $(element).attr('phenotype_name');
		var studies = $(element).attr('studies');
		if(studies != undefined) {
			studies = studies.split(',');// since this is a csv, we split by commas
		}
		// var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_values_by_overlapping_studies";
		// $.ajax({
		// 	method: 'POST',
		// 	url: url,
		// 	data: {
		// 		studies: JSON.stringify(studies),
		// 		phenotype_name: phenotype_name,
		// 		compression: true
		// 	},
		// 	success: function(data) {
		// 		console.log('phenotypes_values_by_overlapping_studies', data);

		// 		if(data['zlib_deflated_base64'] != undefined) {
		// 			// This is JSON stringified, zlib deflated and base 64 encoded so we need to undo that
		// 			var base64Data = data.zlib_deflated_base64;
		// 			// console.log('base64Data', base64Data);
		// 			var compressData = atob(base64Data);
		// 			var compressData = compressData.split('').map(function(e) {
		// 				return e.charCodeAt(0);
		// 			});				
		// 			var inflate = new Zlib.Inflate(compressData);
		// 			var output = inflate.decompress(); // UINT8Arra
		// 			output = new TextDecoder().decode(output);
		// 			// console.log('output', output);
		// 			var data = JSON.parse(output);				
		// 		}

		// 		var values = [];
		// 		for(var i=0; i<data.length; i++) {
		// 			var row = data[i];
		// 			// console.log('value', row.value);
		// 			var obj = {};
		// 			// values.push(parseFloat(row.value));
		// 			obj['value'] = row.value;
		// 			obj['phenotype_id'] = row.phenotype_id;
		// 			obj['plant_accession'] = row.plant_accession;
		// 			obj['study_accession'] = row.study_accession;
		// 			values.push(obj);						
		// 		}
		// 		try {
		// 			$('#analysis-overlapping-traits-histogram').html(
		// 				'<div class="histogram_container"></div>' + 
		// 				'<center><button class="histogram_button_save">Save adjustment</button></center>' +
		// 				'<div style="">&nbsp;</div>'
		// 			);

		// 			interactive_histogram_create_v5(
		// 				'#analysis-overlapping-traits-histogram .histogram_container',
		// 				phenotype_name,// unique_id
		// 				phenotype_name,400,400,
		// 				values,['phenotype_id','plant_accession', 'value']
		// 			);
					
		// 		}
		// 		catch (err) {
		// 			console.log('traits interactive histogram error', err);
		// 		}					
		// 	}
		// });

		// This instead uses the values already stringified from the original histogram
		var values = [];
		// try {
			console.log(phenotype_name);
			var source_histogram = $('#analysis-overlapping-traits-traits-table td.phenotype_overlap_status[phenotype_name="' + phenotype_name + '"]');
			console.log('source_histogram', source_histogram);
			console.log('values', source_histogram.attr('data-values'));
			values = JSON.parse(source_histogram.attr('data-values')); // get the values from data-values and parse it since it is in JSON string format
			$('#analysis-overlapping-traits-histogram').html(
				'<div class="histogram_container"></div>' + 
				'<center><button class="histogram_button_save">Save adjustment</button></center>' +
				'<div style="">&nbsp;</div>'
			);

			interactive_histogram_create_v5(
				'#analysis-overlapping-traits-histogram .histogram_container',
				phenotype_name,// unique_id
				phenotype_name,350,350,
				values,['phenotype_id','plant_accession', 'value']
			);
			
		// }
		// catch (err) {
		// 	console.log('traits interactive histogram error', err);
		// }	
	}

	// This old version is when the histogram is on the right
	// $('body').on('click', '#analysis-overlapping-traits-histogram .histogram_button_save', function() {
	// 	console.log('histogram button save clicked');
	// 	var element = $(this);
	// 	var phenotype_name = element.parent().parents().find('.histogram_container').attr('unique_id');
	// 	console.log('phenotype_name', phenotype_name);
	// 	if($('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').is(':checked')) {
	// 		// uncheck it
	// 		$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
	// 		setTimeout(function() {
	// 			$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
	// 		}, 3000);
	// 	}
	// 	else {
	// 		$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
	// 	}
	// });

	$('body').on('click', '.phenotype_overlap_status .histogram_button_save', function() {
		console.log('histogram button save clicked');
		var element = $(this);
		var phenotype_name = element.closest('.phenotype_overlap_status').attr('unique_id');
		console.log('phenotype_name', phenotype_name);
		if($('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').is(':checked')) {
			// uncheck it
			$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
			setTimeout(function() {
				$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
			}, 3000);
		}
		else {
			$('.trait_select_checkbox[phenotype_name="' + phenotype_name + '"]').click();
		}
	});	


	function analysis_overlapping_traits_grid_histogram_element_add(container, phenotype_name, studies, phenotype_units = undefined, phenotype_default_unit = undefined) {
		$(container).html('<center><img style="height: 300px;" src="' + loading_icon_src + '" /></center>');
		
		console.log('analysis_overlapping_traits_grid_histogram_element_add was executed');
		console.log('phenotype_name', phenotype_name);
		// console.log('studies', studies);
		// console.log('phenotype_units', phenotype_units);
		console.log('phenotype selected', phenotype_default_unit);

		// var phenotype_name = phenotypes_arr[i];
		// var studies = studies_csv;
		if(studies != undefined) {
			studies = studies.split(',');// since this is a csv, we split by commas
		}
		var units = undefined;
		if(phenotype_units != undefined) {
			units = phenotype_units.split(',');// since this is a csv, we split by commas
		}
		console.log('studies', studies);
		if (units != undefined) {
			$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + phenotype_name + '"].phenotype_units_processing').html('<center><img style="height: 16px;" src="' + loading_icon_src + '" /></center>');
			console.log('units', units);
		}
		else {
			console.log('Error units not defined');
		}
		
		var url = Drupal.settings.base_url + "/cartogratree/api/v2/phenotypes/phenotypes_values_by_overlapping_studies";
		$.ajax({
			method: 'POST',
			url: url,
			data: {
				studies: JSON.stringify(studies),
				phenotype_name: phenotype_name,
				compression: true
			},
			success: function(data) {
				console.log('phenotypes_values_by_overlapping_studies', data);

				if(data['zlib_deflated_base64'] != undefined) {
					// This is JSON stringified, zlib deflated and base 64 encoded so we need to undo that
					var base64Data = data.zlib_deflated_base64;
					// console.log('base64Data', base64Data);
					var compressData = atob(base64Data);
					var compressData = compressData.split('').map(function(e) {
						return e.charCodeAt(0);
					});				
					var inflate = new Zlib.Inflate(compressData);
					var output = inflate.decompress(); // UINT8Arra
					output = new TextDecoder().decode(output);
					// console.log('output', output);
					var data = JSON.parse(output);				
				}


				var values = [];
				console.log('phenotypes_values_by_overlapping_studies decoded', data);
				for(var i=0; i<data.length; i++) {
					var row = data[i];
					// console.log('value', row.value);
					var obj = {};
					// values.push(parseFloat(row.value));
					obj['year'] = row.year;
					obj['value'] = row.value;
					obj['phenotype_id'] = row.phenotype_id;
					obj['plant_accession'] = row.plant_accession;
					obj['study_accession'] = row.study_accession;

					// check if units defined (then we need to do conversion)
					if (units != undefined) {
						if (units.length > 1) { // there is at least 2 units specified

							
							
							// get the index of the study based on the row data received
							var study_index = studies.indexOf(obj['study_accession']);
							var value_unit = units[study_index]; // this is because they should correspond in the arrays
							// console.log('study_index', study_index);
							// console.log('value_unit', value_unit);
							// console.log('phenotype_default_unit', phenotype_default_unit);
							if (phenotype_default_unit != value_unit) {
								// the default unit does not match to the value in this row of data, do conversion
								var units_db = {
									meter: 1000,
									decimeter: 100,
									centimeter: 10,
									millimeter: 1,
								}
								//if (value_unit.includes(phenotype_default_unit)) {
									var value_unit_multiple = units_db[value_unit];
									var phenotype_default_unit_multiple = units_db[phenotype_default_unit];
									// console.log('value_unit', value_unit, 'default_unit', phenotype_default_unit);
									var original_value = obj['value'];
									obj['value'] = obj['value'] * (value_unit_multiple / phenotype_default_unit_multiple);
									// Example, let's say we had a value of 1 meter and wanted to convert to cm
									// then value_unit_multiple = 1000, phenotype_default_unit_multiple = 10
									// so it would be 1 (the value) * (1000/10) = 100 cm
									console.log(original_value + ' ' + value_unit + ' converted to ' + phenotype_default_unit + ' = ' + obj['value'] + ' ' + phenotype_default_unit);
								// }
							}
						}
					}
					if (obj['value'] != NaN) {
						values.push(obj);
					}
					else {
						console.log('Object value was NaN so it was not added to values');
					}
				}

				console.log('Values count for phenotype', phenotype_name, values.length);

				// Add the json_encoded values to the container
				$(container).attr('data-values', JSON.stringify(values));

				if (values.length > 0) {

					$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + phenotype_name + '"].phenotype_units_processing').html('');
					try {
						$(container).html('');
						// $(element).html('');
						console.log('Adding to container:' + container);
						interactive_histogram_create_v5(
							container, 
							phenotype_name,//unique_id
							phenotype_name, 
							350, 350, 
							values,['phenotype_id','plant_accession','value'], 
							true
						);
						// Add a filter button which opens the interactive histogram with line thresholds

						// Old button removed on 6/10/2024 since this would open up an extra right side histogram which
						// we do not want anymore
						// var button_html = '<div><center><button style="border-radius: 3px;" phenotype_name="' + phenotype_name + '" studies="' + studies + '" class="filter_trait_interactive_histogram">Adjust thresholds</button></center></div>';
						var button_html = '<center><button class="histogram_button_save">Save adjustment</button></center>';
						$(container).append(button_html);
					}
					catch (err) {
						$(container).html('Histogram error, please see logs');
						console.log('traits interactive histogram error', err);
					}
				}
				//Remove calculator icon
				$('#analysis-overlapping-traits-traits-list td[phenotype_name="' + phenotype_name + '"].phenotype_units_processing').html('');			
			}
		});				
	}

	$(document).on('click', '.trait_description', function() {
		// alert('Click detected');
		console.log('.trait_description on click detected');
		// analysis_overlapping_traits_histogram_dataselect_element(this);
	});

	$(document).on('click', '.filter_trait_interactive_histogram', function() {
		document.getElementById("analysis-overlapping-traits-histogram").scrollIntoView();
		analysis_overlapping_traits_histogram_dataselect_element(this);
	});

	/**
	 * On clicking phenotype checkbox from phenotype / traits tab, perform function
	 */
	$(document).off('click', '.trait_select_checkbox');
	$(document).on('click', '.trait_select_checkbox', function() {
		// alert('click detected');
		console.log($(this)[0]);
		analysis_overlapping_trait_select_checkbox($(this)[0]);


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
				$('#' + id_name_nospaces).html('<i class="fas fa-tree"></i> ' + data.length + ' of ' + data.length + ' plants');
			},
			error: function() {
				$('#' + id_name_nospaces).html('<i class="fas fa-tree"></i>  0 of ' + analysis_includedTrees.length + ' plants (query failed)');
			}
		});	
	}

	function get_selections_studies() {
		var studies_selected_elements = $('#analysis_detections_study_summary').find('.checkbox_option input');
		console.log('studies_selected_elements', studies_selected_elements);
		var studies_selected_values = [];
		for (var i = 0; i < studies_selected_elements.length; i++) {
			var element = $(studies_selected_elements[i]);
			var study_name = $(element).closest('tr').attr('data-value');
			console.log('study_name', study_name);
			if ($(element).is(':checked')) {
				// This study is selected
				studies_selected_values.push(study_name);
				//payload['studies'][study_name] = null;
			}
			else {
				// This study is not selected
				//payload['studies'][study_name] = null;
			}
		}
		return studies_selected_values
	}

	function generate_completion_message_html(data) {
		var html = '<div class="completion_output">';
		var response = data['response'];
		var response_keys = Object.keys(response);
		if (data['response']['errorMessage'] == undefined || data['response']['errorMessage'] == "null" || data['response']['errorMessage'] == null) {
			// html += 'Success';
		}
		else {
			html += 'Error: ' + data['response']['errorMessage'];
		}
		// html += '<table border="1" style="margin-top: 10px; width: 100%; border-collapse: collapse;">';
		// for (var i = 0; i < response_keys.length; i++) {
		// 	var key = response_keys[i];
		// 	var value = response[key];
		// 	if (typeof value == 'object') {
		// 		html += "<table style='width: 100%; border-collapse: collapse;'>";
		// 		// If the value is an object, we need to convert it to a string
		// 		var sub_keys = Object.keys(value);
		// 		for (var j = 0; j < sub_keys.length; j++) {
		// 			var sub_key = sub_keys[j];
		// 			var sub_value = value[sub_key];

		// 			// html += '<div><strong>' + key + ' - ' + sub_key + ':</strong> ' + sub_value + '</div>';
		// 			html += "<tr>";
		// 			html += "<td style='padding: 5px; border: 1px solid #ddd; font-weight: 500;'>" + key + '</td>';
		// 			html += "<td>" + sub_value + "</td>";
		// 			//  + sub_key + "</td>";
		// 			html += "</tr>";
		// 		}
		// 		html += "</table>";
		// 	}
		// 	else {
		// 		//html += '<div><strong>' + key + ':</strong> ' + value + '</div>';
		// 		html += '<tr>';
		// 		html += '<td style="padding: 5px; border: 1px solid #ddd; font-weight: 500;">' + key + '</td>';
		// 		html += '<td style="padding: 5px; border: 1px solid #ddd;">' + value + '</td>';
		// 		html += '</tr>';
		// 	}
		// }
		// html += '</table>';
		html += '</div>';
		return html;
	}

	$('body').off('click', '#analysis_detections_confirm_selection_button');
	$('body').on('click', '#analysis_detections_confirm_selection_button', function() {
		$('#analysis_detections_confirm_selection_status').html('<i class="fas fa-clock"></i> Processing, please wait...');
		var payload = {};
		
		var trees = analysis_includedTrees; // DEFAULT
		// If the user has selected individual trees, then we use those instead
		var samples_checkboxes = $('#analysis_detections_study_summary').find('.samples_checkbox');
		if (samples_checkboxes.length > 0) {
			var trees_object = {};
			trees = [];
			for (var i = 0; i < samples_checkboxes.length; i++) {
				var element = $(samples_checkboxes[i]);
				if ($(element).is(':checked')) {
					console.log('Samples checkbox checked', element);
					var samples_div = $(element).closest('tr').find('.samples');
					var samples_csv = $(samples_div).attr('data-samples');
					var samples_array = samples_csv.split(',');
					for (var j = 0; j < samples_array.length; j++) {
						var sample_name = samples_array[j];
						trees_object[sample_name] = true;
					}
				}
			}
			trees = Object.keys(trees_object);
			delete trees_object;
		}
		payload['trees'] = trees;
		payload['studies'] = {};
		console.log('Included Trees:', trees);

		var studies_selected_values = get_selections_studies();


		// Get the selected studies
		// VERSION 1: OLD USES FORM STATE BUT NOT WHAT WE WANT
		// var vcf_files_ui_api_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files/' + studies_selected_values.join(',');
		// VERSION 2 (5/15/2025): Uses Gabe's vcf_locations table
		var vcf_files_ui_api_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files_indexed/' + studies_selected_values.join(',');
		console.log('vcf_files_ui_api_url', vcf_files_ui_api_url);
		$.ajax({
			async: false,
			timeout: 4000,
			method: 'GET',
			url: vcf_files_ui_api_url,
			success: function(data) {
				
				var all_data = data;
				console.log('VCF Locations Data:', all_data);
				data = data["vcf_locations"];
				shared_analysis_name = all_data['shared_analysis'];
				console.log('Shared Analysis Name:', shared_analysis_name);
				var keys = Object.keys(data);
				for (var i = 0; i<keys.length; i++) {
					var key = keys[i];
					var value = data[key];
					payload['studies'][key] = [value];
				}

				// payload['studies'] = data;
			}
		});

		var studies = studies_selected_values;
		for (var i = 0; i<studies.length; i++) {
			var study_name = studies[i];
			if (payload['studies'][study_name] == undefined) {
				payload['studies'][study_name] = null;
			}
		}

		console.log('Payload: ', payload);
		console.log('Payload JSON: ', JSON.stringify(payload));
		$('#analysis_detections_confirm_selection_status').html('<i class="fas fa-check"></i> ' + trees.length + ' plants selected. ' + studies.length + ' studies selected. ' + '<span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" /> Running study context processing...');

		// Now we need to send this payload to the server
		var url = Drupal.settings.base_url + '/cartogratree/api/v2/manage/study_context/run';
		$.ajax({
			method: 'POST',
			url: url,
			data: {
				user_id: Drupal.settings.user.user_id,
				workspace_name: $('#nextflow-create-analysis-select-history').val(),
				analysis_id: cartograplant.current_analysis_id,
				payload: JSON.stringify(payload)
			},
			success: function(data) {
				// Success does not matter - we use the timer below to check the completion json to confirm completion
				//alert('Successfully saved study context.');
				console.log('Data:', data);
				try {
					data = JSON.parse(data);
				} catch (err) {console.log(err)}
			}
		});

		try {
			clearInterval(analysis_timers['study_context_completion_json']);
		} catch  (err) {
			console.log('Error clearing timer', err);
		}
		analysis_timers['study_context_completion_json'] = setInterval(function() {
			// Check if the study context is completed
			var url = Drupal.settings.base_url + '/cartogratree/api/v2/manage/study_context/check_completion_json';
			$.ajax({
				method: 'POST',
				data: {
					analysis_id: cartograplant.current_analysis_id,
					workspace_name: $('#nextflow-create-analysis-select-history').val(),
					user_id: Drupal.settings.user.user_id,
				},
				url: url,
				success: function(data) {
					console.log('Study Context Completion:', data);
					try {
						data = JSON.parse(data);
					} catch (err) {console.log(err)}
					if (data['response']['success'] == 'true') {
						analysis_completion_json['analysis_study_context'] = data['response'];
						console.log('analysis_study_context', analysis_completion_json['analysis_study_context']);
						try {
							clearInterval(analysis_timers['study_context_completion_json']);
						} catch (err) {
							console.log('Error clearing timer', err);
						}
						$('#analysis_detections_confirm_selection_status').html('✅ Study context completed! <br />');
						$('#analysis_detections_confirm_selection_status').append(generate_completion_message_html(data));
						try {
							clearInterval(analysis_timers['study_context_completion_json']);
						} catch  (err) {
							console.log('Error clearing timer', err);
						}
					}
					else if (data['response']['success'] == 'false') {
						$('#analysis_detections_confirm_selection_status').html('<i class="fas fa-triangle-exclamation"></i> Study context failed - please contact administration for more details.');
						if (data['response']['success'] != undefined) {
							$('#analysis_detections_confirm_selection_status').append(generate_completion_message_html(data));
						}
						else {
							$('#analysis_detections_confirm_selection_status').append('Awaiting status...');
						}
						try {
							clearInterval(analysis_timers['study_context_completion_json']);
						} catch  (err) {
							console.log('Error clearing timer', err);
						}
					}
					else {
						console.log('Continuing to check for study_context completion');
					}

				}
			});
		}, 5000);

		// if (data['status'] == 'success') {
		// 	// $('#analysis_detections_confirm_selection_status').html('<span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" /> Running study context...');
		// }
		// else {
		// 	$('#analysis_detections_confirm_selection_status').html('<i class="fas fa-exclamation-triangle"></i> Failed to run study context.');
		// 	//alert('Failed to save study context.');
		// }		

	});


	// Perform traits filtering
	try {
		$('#analysis-overlapping-traits-filter-by-selected-phenotypes').off('click');
	} catch (err) {}
	$('#analysis-overlapping-traits-filter-by-selected-phenotypes').click(function() {
		$('#analysis-overlapping-traits-download-by-selected-phenotypes').hide();
		var trees = analysis_includedTrees;
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
				$('#analysis-overlapping-traits-filter-by-selected-phenotypes-results').html('<i class="fas fa-check-square"></i> Completed! ' + analysis_trees.length + ' of ' + analysis_includedTrees.length + ' plants were found to contain traits you selected!');	
			}
		});	
	});

	try {
	$('#analysis-overlapping-traits-download-by-selected-phenotypes').off('click');
	} catch (err) {}
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

	// Individual samples checkbox clicks
	try {
		$('body').off('click', '#analysis_detections_study_summary .samples_checkbox');
	}
	catch (err) {}
	$('body').on('click', '#analysis_detections_study_summary .samples_checkbox', function() {
		console.log('samples_checkbox clicked');
		// Check if checkbox is checked
		if ($(this).is(':checked')) {
			// Make sure the main study checkbox is also checked
			$(this).closest('tr').find('.checkbox_option input').prop('checked', true);
		}
		else{
			$(this).closest('tr').find('.checkbox_option input').prop('checked', false);
		}
	});

	// Main study checkbox clicks
	try {
		$('body').off('click', '#analysis_detections_study_summary .checkbox_option input');
	}
	catch (err) {}
	$('body').on('click', '#analysis_detections_study_summary .checkbox_option input', function() {
		if ($(this).is(':checked')) {
			$(this).closest('tr').find('.samples_checkbox').prop('checked', true);
		}
		else {
			$(this).closest('tr').find('.samples_checkbox').prop('checked', false);
		}
	})





	try {
		$('#analysis-initial-configuration-tab').off('click');
	}
	catch (err) {}
	$('#analysis-initial-configuration-tab').click(function() {
		console.log('Config/Manage tab load');

		if (analysis_initial_configuration_tab == true) {
			return;
		}


		// Check to see if there are studies filtered (from UI filters) - add these trees
		var rule_containers = $('.rule-container .rule-filter-container select');

		// This variable will keep track of if study filter has been selected
		var found_study_filter_option = false;
		
		// Search to see whether filter option is a study filter
		if(rule_containers.length > 0) {
			for(var i=0; i<rule_containers.length;i++) {
				var element = rule_containers.eq(i);
				console.log('value', element.val());
				if(element.val() == "accession") {
					found_study_filter_option = true;
					// Load all trees into included trees
					mapState.includedTrees = cartograplant.currently_filtered_trees;
				}	
			}
		}

		// [RISH] 5/15/2024
		// Order matters, this should be done before get_detected_studies_from_selected_trees
		// since it is used by the function. Failure to do so will result in study detection inaccuracies.
		// analysis_includedTrees will have the filtered trees based on the checkboxes on the first analysis page
		// THIS FILTER DOES NOT TAKE PLACE HERE BUT RATHER FROM THE CHECKBOX CLICKS
		// THIS JUST INITIALIZES THE VARIABLE SO IT DOES NOT REMAIN UNDEFINED AND HAS ALL SELECTED TREES FROM CP MAIN
		analysis_includedTrees = JSON.parse(JSON.stringify(mapState.includedTrees)); // makes a complete copy
		console.log('analysis_includedTrees', analysis_includedTrees);

		// Populate cartograplant studies variables which is used throughout the panel
		get_detected_studies_from_selected_trees();
		
		console.log('cartograplant.detected_studies', cartograplant.detected_studies);
		var studies = Object.keys(cartograplant.detected_studies);
		// The code below generates the study summary table including the checkboxes to be used for filtering
		$('#analysis_detections').html(''); // empty
		var analysis_detections_html = '';
		analysis_detections_html += '<div class="row mb-3">';
		analysis_detections_html += '<div class="col-2">';
		analysis_detections_html += '	<div class="tag-header" style="width: 100%;background-color: #fff3d7;color: #75736e;"><div style="text-transform: uppercase; font-size: 10px;">Step 3</div>Setup analysis study context</div>';
		analysis_detections_html += '</div>';
		analysis_detections_html += '<div class="col-10">';
		if (studies.length == 0) {
			analysis_detections_html += ' <div>No studies detected from your plant selections. ⚠️ <br />Please return to the map and select plants within studies to get most out of this analysis system.</div>';
		}
		else {
			analysis_detections_html += '<h4 style="color:rgb(1, 77, 70) !important;margin-left: 4px;">Study summary</h4>';
			analysis_detections_html += ' <div>' + studies.length + ' studies (' + studies.join(',') + ') found associated with the plants you selected. ✅</div>';

			if (studies.length == 1) {
				analysis_detections_html += '<div>To get the best out of the analysis system, 2 studies or more are recommended</div>';
			}
			analysis_detections_html += '<div id="analysis_detections_genotype_capability" class="mt-1 mb-1"></div>';
			analysis_detections_html += '<div id="analysis_detections_phenotype_capability" class="mt-1 mb-3"></div>';
			
			analysis_detections_html += '<div class="mt-2" id="analysis_detections_study_summary">';
			analysis_detections_html += '<table><tr><th>Select study data</th><th>Accession</th><th>Title</th><th>Genotypes</th><th>Phenotypes</th><th>Plants</th><tr></table>';
			analysis_detections_html += '</div>';
			analysis_detections_html += '<div class="mt-2" id="analysis_detections_confirm_selection">';
			analysis_detections_html += '<button id="analysis_detections_confirm_selection_button" class="btn btn-primary">Apply selections to this analysis session</button>';
			analysis_detections_html += '<div class="mt-2" id="analysis_detections_confirm_selection_status"></div>';
			analysis_detections_html += '</div>';

		}
		analysis_detections_html += '</div> <!-- end of col-md-6 -->';
		analysis_detections_html += '</div>';
		
		$('#analysis_detections').html(analysis_detections_html);
		
		// Dynamic lookup of study info is done to avoid slow page load - this will populate the study summary table
		var study_data = [];
		var studies_with_genotypes_count = 0;
		var studies_with_phenotypes_count = 0;
		cartograplant['analysis_unique_species'] = {};
		for (var i = 0; i<studies.length; i++) {
			var study = studies[i];

			// Go through all filtered trees and see how many trees are associated with this study
			var trees_in_study = 0;
			var trees_csv = "";
			for (var j = 0; j<analysis_includedTrees.length; j++) {
				var tree = analysis_includedTrees[j];
				if (tree.startsWith(study)) {
					trees_in_study = trees_in_study + 1;
					if (trees_csv.length == 0) {
						trees_csv = tree;
					}
					else {
						trees_csv = trees_csv + ',' + tree;
					}
				}
			}


			var table_row_html = "";
			table_row_html += "<tr data-value='" + study + "'>";
			table_row_html += "<td class='checkbox_option'><input type='checkbox' checked /></td>";
			table_row_html += "<td class='accession'>" + study + "</td>";
			table_row_html += "<td class='title_container'>";
			table_row_html += '<div class="title" style="margin-bottom:10px; ">Attempting to gather data for this study...</div>';
			table_row_html += '<div class="samples_container">';
			table_row_html += '	<div class="samples" data-samples="' + trees_csv + '">';
			table_row_html += '		<input type="checkbox" class="samples_checkbox" checked /> ';
			table_row_html += '		<i class="fas fa-tree"></i> ' + trees_in_study + ' individual plants';
			table_row_html += '	</div>';
			table_row_html += '</div>';
			table_row_html += "</td>";
			table_row_html += "<td class='gen_count' style='text-align: center;'>-</td>";
			table_row_html += "<td class='phen_count' style='text-align: center;'>-</td>";
			table_row_html += "<td class='tree_count' style='text-align: center;'>-</td>";
			table_row_html += "</tr>";

			$('#analysis_detections_study_summary table').append(table_row_html);
			var pop_study_table_state = {
				study_retrieved_count: 0,
			}
			// var study_retrieved_count = 0;
			populate_study_table_row(studies, study, study_data, trees_in_study, pop_study_table_state);
			function populate_study_table_row(studies, study, study_data, trees_in_study, pop_study_table_state) {
				$.ajax({
					url: '/cartogratree_uianalysis/cartogratree_analysisapi_lookup_study_info/' + study,
					method: 'GET',
					success: function(data) {
						cartograplant['analysis_unique_species'][data['species']] = true;
						console.log('lookup_study_info study row data', data);
						study_data.push(data);
						$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .accession').html(data['accession']);
						$('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"]').attr("data-species", data["species"]);
						$('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"]').attr("data-author", data["author"]);
						$('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"]').attr("data-year", data["year"]);
						if (data['title'] !== undefined && data['title'] != null && data['title'] != "null" && data['title'].length > 0) {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .title').html(data['title']);
						}
						else {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .title').html('<i>No title found</i>');
						}
						$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .tree_count').html(data['tree_count']);

						// Hide the individual samples checkbox if they are equal to the tree count
						var tree_count = parseInt(data['tree_count']);
						if (tree_count == trees_in_study) {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .samples_container').hide();
						}
						else {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .samples_container').show();
						}

						if (data['gen_count'] != null) {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .gen_count').html(parseInt(data['gen_count']).toLocaleString());
						}
						if (data['phen_count'] != null) {
							$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .phen_count').html(parseInt(data['phen_count']).toLocaleString());
						}

						$.ajax({
							url: '/cartogratree_uianalysis/cartogratree_analysisapi_lookup_study_info_overlap_count/' + study,
							method: 'GET',
							success: function(data) {
								if (data['row']['overlap_count'] != null) {
									$(document).find('#analysis_detections_study_summary table tr[data-value="' + data['accession'] + '"] .gen_count').html(parseInt(data['row']['overlap_count']).toLocaleString());
								}
							},
							error: function() {
							}
						});
					}
				}).always(function() {
					pop_study_table_state.study_retrieved_count = pop_study_table_state.study_retrieved_count + 1;
					
					if (pop_study_table_state.study_retrieved_count == studies.length) {
						for (var j = 0; j<pop_study_table_state.study_retrieved_count; j++) {
							// check if there are at least 2 studies with genotypes
							var single_study_data = study_data[j];
							if (single_study_data['gen_count'] != null) {
								studies_with_genotypes_count = studies_with_genotypes_count + 1;
							}
							if (single_study_data['marker_count'] != null) {
								studies_with_phenotypes_count = studies_with_phenotypes_count + 1;
							}
						}
						if (studies_with_genotypes_count > 1) {
							$('#analysis_detections_genotype_capability').html('Genotypic overlap analysis may be possible for these studies. ✅');

						}
						if (studies_with_phenotypes_count > 1) {
							$('#analysis_detections_phenotype_capability').html('Phenotypic overlap analysis may be possible for these studies. ✅');
						}
					}
					
					analysis_summary_update();
				});
			}
			analysis_initial_configuration_tab = true;



		}


		// [RISH] This code caters for when a study summary study checkbox is clicked or unclicked 
		// This will filter out trees or filter in trees as is necessary into analysis_includedTrees
		$(document).off('click', '#analysis_detections_study_summary table .checkbox_option input[type="checkbox"]');
		$(document).on('click', '#analysis_detections_study_summary table .checkbox_option input[type="checkbox"]', function() {
			console.log('analysis_detections_study_summary checkbox selection has been detected');
			console.log('mapState.includedTrees', mapState.includedTrees);
			console.log('analysis_includedTrees', analysis_includedTrees);

			// This might not matter since once something is checked, we need to re-evaluate all trees
			if ($(this).is(':checked')) {
				console.log('is checked')
			}
			else {
				console.log('is unchecked');
			}

			var selected_studies = [];
			// Go through all checkboxes
			var study_checkboxes = $('#analysis_detections_study_summary table .checkbox_option input[type="checkbox"]');
			for (var i=0; i<study_checkboxes.length; i++) {
				var checkbox = $(study_checkboxes.get(i));
				var tr = $(checkbox.closest('tr'));
				// console.log('tr',tr);
				var study_acccession = tr.attr('data-value');
				if (checkbox.is(':checked')) {
					selected_studies.push(study_acccession);
				}
				//console.log(study_acccession);
			}
			console.log('selected_studies', selected_studies);
			analysis_includedTrees = [];
			for (var i = 0; i < selected_studies.length; i++) {
				var study_accession = selected_studies[i];
				for (var j = 0; j < mapState.includedTrees.length; j++) {
					var treeid_tmp = mapState.includedTrees[j];
					// Check if treeid contains study accession, add it to analysis_includedTrees
					if (treeid_tmp.includes(study_accession)) {
						analysis_includedTrees.push(treeid_tmp);
					}
				}
			}
			console.log('Analysis filtered trees: ' + analysis_includedTrees.length + ' compared with Map included trees: ' + mapState.includedTrees.length);
			get_detected_studies_from_selected_trees();
			// Reset the traits configuration
			analysis_traits_configuration_tab = false;
			// Reset the genotypes configuration
			analysis_genotypes_configuration_tab = false;
			analysis_summary_update();
		});		

		console.log($('#create-analysis-select-galaxy-account').html());
		//if($('#create-analysis-select-galaxy-account').html() == "") {
		// var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_galaxy_accounts";
		// $.ajax({
		// 	method: "GET",
		// 	url: url,
		// 	dataType: "json",
		// 	success: function (data) {
		// 		console.log(data);
		// 		var html = '';
		// 		var found_ct_default_server = false;
		// 		var galaxy_server_name = 'TreeGenes w/ CartograPlant API Key';
		// 		var default_galaxy_id = -1;
		// 		for(var i=0; i<data.length; i++) {
		// 			// Because now we use a specific galaxy account, search to see if it exists
		// 			if (data[i].servername == galaxy_server_name) {
		// 				found_ct_default_server = true;
		// 				default_galaxy_id = data[i].galaxy_id;
		// 			}
		// 			html += '<option value="' + data[i].galaxy_id + '">' + data[i].servername +  '</option>';
		// 		}
		// 		$('#create-analysis-select-galaxy-account').html(html);

		// 		if(found_ct_default_server) {
		// 			console.log('default_galaxy_id', default_galaxy_id);
		// 			cartograplant.galaxy_id = default_galaxy_id;
		// 			$('#create-analysis-select-galaxy-account-container').hide();
		// 			$('#create-analysis-select-galaxy-account').val(default_galaxy_id);
		// 			$('#create-analysis-select-galaxy-account').click();
		// 		}
		// 		else {
		// 			alert('Could not find default Cartograplant Galaxy ID. Please contact administration.');
		// 		}

		// 	}
		// });
		//}
		//else {
			//$('#analysis-retrieve-envdata-section-layers-list').html("");
			console.log("Interface already populated with data");
			
			// Refresh the selected workflow to get file list
			console.log('Refresh the file history');
			$('#create-analysis-select-history').click();
		//}
	});


	$('body').off('click', '#nextflow-population-structure-button-generate-popstruct');
	$('body').on('click', '#nextflow-population-structure-button-generate-popstruct', function() {
		// Perform the nextflow population structure
		$('#nextflow-population-structure-workflow .status_output').html('<i class="fa-solid fa-sync fa-spin"></i> Running Nextflow Population Structure...');
		var properties = {};
		var properties_field_container_elements = $('#nextflow-population-structure-workflow .property_form_field_container');
		console.log(properties_field_container_elements);

		for (var i = 0; i<properties_field_container_elements.length; i++) {
			var property_name = $(properties_field_container_elements[i]).closest('.property').attr('data-property-name');
			var property_value = $(properties_field_container_elements[i]).find('.property_form_field').val();
			properties[property_name] = property_value;
		}
		console.log('workflow properties compiled', properties);
		$.ajax({
			url: Drupal.settings.base_url + '/cartogratree/api/v2/popstruct/nextflow_workflow',
			method: 'POST',
			data: {
				user_id: Drupal.settings.user.user_id,
				workspace_name: $('#nextflow-create-analysis-select-history').val(),
				properties: JSON.stringify(properties),
				analysis_id: cartograplant.current_analysis_id
			},
			success: function(data) {
				console.log(data);
				var data = JSON.parse(data);
				$('#nextflow-population-structure-workflow .status_output').html(data['status']);

				$('#nextflow-population-structure-workflow .status_output').append('<div id="nextflow-population-structure-visualization" style="100%;"></div>');
				// Load the visualization
				// nextflow-population-structure-visualization
				$('#nextflow-population-structure-visualization').html('');
				$('#nextflow-population-structure-visualization').html('<div class="vis-img-container"><img style="width: 100%;" src="' + Drupal.settings.base_url + '/cartogratree/api/v2/popstruct/nextflow_visualization?analysis_id=' + cartograplant.current_analysis_id + '" /></div><div class="vis-img-zoom" style="height: 300px; width: 100%;"></div>');
				$('#nextflow-population-structure-visualization .vis-img-container').zoom({
					magnify:1.5,
					target: '.vis-img-zoom'
				});
			}
		});
	})

	// When the popstruct tab is clicked
	$('.analysis-popstruct-section-tab').click(function() {
		try {

			// Get the nextflow UI json to produce the UI form
			$.ajax({
				url: Drupal.settings.ct_nodejs_api + '/v2/popstruct/get_ui_json',
				method: 'POST',
				// dataType: 'json',
				data: {
					// analysis_id: cartograplant['current_analysis_id'],
					// study_accession: study_accession,
					// vcf_location: vcf_location
				},
				success: function (data) {
					// data = JSON.parse(data);
					console.log('get_ui_json', data);
					var properties_data = data['definitions']['input_output_options']['properties'];
					var properties_list = Object.keys(properties_data);
					// nextflow-population-structure-workflow
					$('#nextflow-population-structure-workflow').html('');

					for (var i = 0; i < properties_list.length; i++) {
						var property_data = properties_data[properties_list[i]];
						var property_name = properties_list[i];
						console.log('property_data', property_data);
						console.log('property_name', property_name);
						
						
						$('#nextflow-population-structure-workflow').append('<div class="property" data-property-name="' + property_name + '" style="margin-bottom: 10px;"></div>');
						$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"]').append('<div style="text-transform: capitalize">' + property_data['description'] + '</div>');
						$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"]').append('<div class="property_form_field_container"></div>');
						var placeholder = '';
						switch (property_data['type']) {
							case 'float':
								placeholder = '0.0'
								break;
							case 'Integer':
								placeholder = '0';
						} 
						var default_value = '';
						if (property_data['default'] != undefined) {
							default_value = property_data['default'];
						}
						if (property_data['format'] == 'file-path') {
							// $('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"] .property_form_field_container')
							// .append('<select class="' + property_name + ' property_form_field"></select>')
							var regex_pattern = '';
							if (property_data['pattern'] != undefined) {
								regex_pattern = property_data['pattern'];
							}

							$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"] .property_form_field_container')
							.append(nextflow_workflow_files_select(regex_pattern, property_name, 'nextflow_gwas_property property_form_field ' + property_name))
							// nextflow_workflow_files_select('', property_name, 'nextflow_gwas_property property_form_field');
							var detected_studies = Object.keys(cartograplant.detected_studies);
							console.log('detected_studies', detected_studies);
							for (var ds_i = 0; ds_i < detected_studies.length; ds_i++) {
								// Lookup VCF file per study
								var study_accession = detected_studies[ds_i];
								// VERSION 1 uses the form state info which we don't want
								// var vcf_files_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files/' + study_accession;
								// VERSION 2 uses Gabe's vcf_locations table which is preprocessed
								var vcf_files_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files_indexed/' + study_accession;
								$.ajax({
									async: false,
									url: vcf_files_url,
									method: 'GET',
									success: function(data) {
										var all_data = data;
										data = data['vcf_locations'];
										console.log('vcf_files', data);
										var study_keys = Object.keys(data);
										for (var sk_i = 0; sk_i < study_keys.length; sk_i++) {
											var study_key = study_keys[sk_i];
											console.log('study_key', study_key);
											var filename_parts = data[study_keys[sk_i]].split('/');
											console.log('filename_parts', filename_parts);
											var filename = filename_parts[filename_parts.length - 1];
											$('.' + property_name).append('<option value="' + data[study_key] + '">' + filename + '</option>');
										}
									}
								});
							}
						}
						else if (property_data['options'] != undefined) {
							var select_html = '<select style="padding: 5px;" class="' + property_name + ' property_form_field">';
							var options = property_data['options'];
							var options_keys = Object.keys(options);
							for (var options_i = 0; options_i<options_keys.length; options_i++) {
								var option_key = options_keys[options_i];
								var option_desc = options[option_key];
								select_html += '<option value="' + option_key + '">' + option_desc + '</option>';
							}
							select_html += '</select>';
							$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"] .property_form_field_container')
							.append(select_html);
						}
						else {
							$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"] .property_form_field_container')
							.append('<input type="text" placeholder="' + placeholder + '" class="' + property_name + ' property_form_field" name="" value="' + default_value +'"/>');
						}
						if (property_data['help_text'] != undefined) {
							$('#nextflow-population-structure-workflow .property[data-property-name="' + property_name + '"]')
							.append('<div style="font-size: 0.8em;">' + property_data['help_text'] + '</div>');
						}
						// html += '</div>';
						// $('#nextflow-population-structure-workflow').append(html);
					}
					$('#nextflow-population-structure-workflow').append('<button class="btn btn-info" id="nextflow-population-structure-button-generate-popstruct">Generate population structure</button>');
					$('#nextflow-population-structure-workflow').append('<div class="status_output" style="margin-top: 10px; margin-bottom: 10px;"><div>');
					$('#nextflow-population-structure-workflow').append('<hr />');
				}
			});




			// Populate a list of history contents which can be managed (which really allows a user to delete essentially)
			// cartograplant.history_id = $('#create-analysis-select-history').val();
			var url_history_contents = Drupal.settings.base_url + '/cartogratree_uianalysis/get_history_details/' + cartograplant.galaxy_id + '/' + cartograplant.history_id;
			console.log(url_history_contents);
			console.log('Populating VCF select list...');
			$('.analysis-tab-content .select_loading').html('<span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />');
			$('.analysis-tab-content .select_loading').fadeIn(200);
			// <span class="loading"></span> <img style="height: 16px;" src="' + loading_icon_src + '" />
			$('#analysis-popstruct-section-vcf-selectfile').html('');
			$.ajax({
				method: 'GET',
				url: url_history_contents,
				success: function(data) {
					console.log(data);
					
					if(data.length > 0) {
						var options_html = '';
						for(var i=0; i<data.length; i++) {
							var file_name_caption = cartograplant.get_file_name_caption(data[i]['dataset_name']);
							options_html += "<option value='" + data[i]['dataset_url'] + "'>" + file_name_caption + "</option>"
						}
						$('#analysis-popstruct-section-vcf-selectfile').html(options_html);
					}
					$('.analysis-tab-content .select_loading').fadeOut(200);
				}
			});
		}
		catch (err) {
			console.log(err);
		}
	});


	$('#analysis-popstruct-section-button-generate-fast-structure').click(function() {
		console.log('generate-fast-structure');
		cartograplant['generate_fast_structure_running'] = true;
		// formData.append('galaxy_id', cartograplant.galaxy_id);
		// formData.append('workflow_id', workflow_id);
		// formData.append('history_id', cartograplant.history_id);
		// // var file_upload_element = document.getElementById(file_id);
		// formData.append('raw_data', csv_data);
		// formData.append('file_name', 'AN' + cartograplant.current_analysis_id + '_PHENOVER' + phenotype_name + '_adjusted-overlaps.csv');

		try {
			console.log('analysis-popstruct-section-vcf-selectfile value', $('#analysis-popstruct-section-vcf-selectfile').val());
			$('#analysis-popstruct-dapc-step1-plot-container').html('<div style="text-align: center">This can take minutes, please be patient...</div>');
			var url = Drupal.settings.base_url + "/cartogratree/api/v2/popstruct/fast_structure";
			$.ajax({
				method: "POST",
				url: url,
				data: {
					realtime_client_id: cartograplant['realtime']['client_id'],
					galaxy_id: cartograplant.galaxy_id,
					workflow_id: workflow_id,
					history_id: cartograplant.history_id,
					vcf_url: $('#analysis-popstruct-section-vcf-selectfile').val(),
					k_value: $('#analysis-popstruct-section-k-value').val(),
					analysis_id: cartograplant.current_analysis_id,
					history_upload_url: Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_history",
					// pcs_to_retain: $('#analysis-popstruct-section-input-pcs-to-retain').val(),
					// clusters_to_retain: $('#analysis-popstruct-section-input-clusters-to-retain').val()
				},
				success: function (data) {
					console.log(data);
					var data = JSON.parse(data);
					if(data['success'] == true) {
						// alert('Success');
						// const blob = b64toBlob(data['data_base64'], 'image/jpeg');
						// var html = "";
						// html += '<img style="width: 100%;" src="' + URL.createObjectURL(blob) + '" />';
						// $('#analysis-popstruct-dapc-step1-plot-container').html(html);
					}
					else {
						// alert('Failed');
					}
				},
				error: function (err) {
					console.log(err);
					alert(err);
				}
			});	
		}
		catch (err) {
			console.log(err);
		}
	});


	function nextflow_workflow_files_select(pattern = '', input_name= '', classes = '') {
		var html = '';
		html += '<div>';
		html+= '<select class="' + classes + '" data-input-name="' + input_name + '">';
		var workspace_name = $('#nextflow-create-analysis-select-history').val();
		var workspace_files_url = Drupal.settings.base_url + '/cartogratree_uianalysis/get_nextflow_workspace_files/' + workspace_name;
		const regex = new RegExp(pattern);
		console.log('Regular expression: ' + regex);
		$.ajax({
			url: workspace_files_url,
			method: 'GET',
			async: false,
			success: function(data) {
				for (var i = 0; i < data.length; i++) {

					var show_option = false;
					if (pattern != '') {
						var matches = regex.exec(data[i]);
						console.log('matches', matches);
						if (matches != null) {
							if (matches.length >= 1) {
								show_option = true;
							}
						}
					}
					else {
						show_option = true;
					}
					if (show_option == true) {
						html += '<option value="' + data[i] + '">';
						// file_location_parts
						var file_location_parts = data[i].split('/');
						var filename = file_location_parts[file_location_parts.length - 1];

						// This code to format the filenames into human readable needs more work - 9/25/2025
						// // Check to see if there's a unixtimestamp at the start
						// var filename_dash_parts = filename.split('-');
						// var unixtimestamp = parseInt(filename_dash_parts[0]);
						// if (unixtimestamp != NaN) {
						// 	// const date = new Date(unixtimestamp * 1000);
						// 	// Override the filename
						// 	filename = timeConverter(unixtimestamp);
						// 	for (let j = 1; j < filename_dash_parts.length; j++) {
						// 		filename += "-" + filename_dash_parts[j];
						// 	}
						// }
						html += filename;
						html += '</option>';
					}
				}
			}
		})
		html += '</select>';
		html += '</div>';
		return html;
	}

	function timeConverter(UNIX_timestamp){
		var a = new Date(UNIX_timestamp * 1000);
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var year = a.getFullYear();
		var month = months[a.getMonth()];
		var date = a.getDate();
		var hour = a.getHours();
		var min = a.getMinutes();
		var sec = a.getSeconds();
		var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
		return time;
	  }

	$('body').off('click', '.gwas_button_stop_step');
	$('body').on('click', '.gwas_button_stop_step', function() {
		console.log('GWAS Stop Step button clicked');
		var pid = $('#nextflow-gwas-data').attr('data-gwas-pid');
		if (pid != null && pid != '') {
			var url = Drupal.settings.base_url + '/cartogratree/api/v2/gwas/step_stop_execution';
			$.ajax({
				url: url,
				method: 'POST',
				data: {
					pid: pid,
					user_id: Drupal.settings.user.user_id,
				},
				success: function(data) {
					var data = JSON.parse(data);
					console.log('GWAS Step Stop:', data);
					$('#nextflow-gwas-results').html('🛑 GWAS Step Stopped');
					// Remove the PID
					$('#nextflow-gwas-data').attr('data-gwas-pid', '');
					clearInterval(analysis_timers['gwas_step_execution_completion_json']);

				}
			});
		}
	});


	$('body').off('click', '.gwas_button_run_step');
	$('body').on('click', '.gwas_button_run_step', function() {
		console.log('GWAS Run Step button clicked');
		var vis_file = $(this).attr('data-vis-file');
		console.log('VIS FILE:' + vis_file);
		// Get flags from the main form (not the models)
		var flags = {};
		var form_field_elements = $('#nextflow_gwas_options_main .property_form_field');
		for (var i = 0; i < form_field_elements.length; i++) {
			var form_field_element = $(form_field_elements[i]);
			var flag_name = $(form_field_element).attr('data-input-name');
			var flag_value = $(form_field_element).val();
			flags[flag_name] = flag_value;
		}

		var form_field_elements = $('#nextflow-gwas-interface-submodel-options .property_form_field');
		for (var i = 0; i < form_field_elements.length; i++) {
			var form_field_element = $(form_field_elements[i]);
			var flag_name = $(form_field_element).attr('data-input-name');
			var flag_value = $(form_field_element).val();
			flags[flag_name] = flag_value;
		}

		// Get flags from the step form
		var form_field_elements = $(this).closest('table').find('.property_form_field');
		for (var i = 0; i < form_field_elements.length; i++) {
			var form_field_element = $(form_field_elements[i]);
			var flag_name = $(form_field_element).attr('data-input-name');
			var flag_value = $(form_field_element).val();
			flags[flag_name] = flag_value;
		}

		// Get model from the step form eg relatedness
		var step_detail_element = $(this).closest('table').find('.gwas_step');
		var step_name = $(step_detail_element).attr('data-step');
		var flag_name = 'model';
		flags[flag_name] = step_name;
		console.log('Flags from the form', flags);
		// return;
		
		$('#nextflow-gwas-visualization').html(''); // clear the visualization

		var url = Drupal.settings.base_url + '/cartogratree/api/v2/gwas/step_execution';
		$('#nextflow-gwas-results').html('<i class="fa-solid fa-sync fa-spin"></i> Performing GWAS processing...');
		$.ajax({
			url: url,
			method: 'POST',
			data: {
				workspace_name: $('#nextflow-create-analysis-select-history').val(),
				user_id: Drupal.settings.user.user_id,
				analysis_id: cartograplant.current_analysis_id,
				flags: JSON.stringify(flags),
			},
			success: function(data) {
				var run_data = JSON.parse(data);
				console.log('gwas step execution response run_data', run_data);
				console.log('PID: ' + run_data['pid']);

				// Get the PID and store it in the nextflow-gwas-data element
				$('#nextflow-gwas-data').attr('data-gwas-pid', run_data['pid']);

				// console.log('gwas response', data);
				// $('#nextflow-gwas-results').html('Finished!');
				// var workspace_name = $('#nextflow-create-analysis-select-history').val();
				// var vis_file_url = Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_download_workspace_file/' + workspace_name + '/' + vis_file;
				// $('.gwas_vis_container').html('<img style="width: 100%;" src="' + vis_file_url + '" />');
				analysis_timers['gwas_step_execution_completion_json'] = setInterval(function() {
					// Check if the study context is completed
					var url = Drupal.settings.base_url + '/cartogratree/api/v2/gwas/check_completion_json';
					$.ajax({
						method: 'POST',
						data: {
							analysis_id: cartograplant.current_analysis_id,
							workspace_name: $('#nextflow-create-analysis-select-history').val(),
							user_id: Drupal.settings.user.user_id,
						},
						url: url,
						success: function(data) {
							var data = JSON.parse(data);
							console.log('GWAS Step Completion:', data);



							if (data['response']['success'] == "true") {
								// Remove the PID
								$('#nextflow-gwas-data').attr('data-gwas-pid', '');
								$('#nextflow-gwas-results').html('✅ GWAS Step Completed');
								$('#nextflow-gwas-results').append(generate_completion_message_html(data));
								if (data['response']['image'] != null) {
									$('#nextflow-gwas-visualization').html('');
									$('#nextflow-gwas-visualization').html('<div class="vis-img-container"><img style="width: 100%;" src="' + Drupal.settings.base_url + '/cartogratree/api/v2/gwas/nextflow_visualization?analysis_id=' + cartograplant.current_analysis_id + '" /></div>');
									//$('#nextflow-gwas-visualization').html($('#nextflow-gwas-visualization').html() + '<div class="vis-img-zoom" style="height: 300px; width: 100%;"></div>');
									//$('#nextflow-gwas-visualization .vis-img-container').zoom({
									//	magnify:1.5,
									//	target: '.vis-img-zoom'
									//});
								}
								clearInterval(analysis_timers['gwas_step_execution_completion_json']);
							}
							else if (data['response']['success'] == "false") {
								$('#nextflow-gwas-data').attr('data-gwas-pid', '');
								$('#nextflow-gwas-results').html('GWAS Step was unsuccessful');
								$('#nextflow-gwas-results').append(generate_completion_message_html(data));
								clearInterval(analysis_timers['gwas_step_execution_completion_json']);
							}
							else {
								// $('#nextflow-gwas-results').html('<i class="fa-solid fa-sync fa-spin"></i> GWAS Step still running...');
							}
							
						}
					});
				}, 5000);
			},
			error: function (err) {
				$('#nextflow-gwas-results').html('An error occurred during processing of GWAS');
				$('#nextflow-gwas-results').append(generate_completion_message_html(data));
				try {
					clearInterval(analysis_timers['gwas_step_execution_completion_json']);
				} catch (err) {
					console.log('Error clearing GWAS step execution completion timer', err);
				}
			}

		});
		console.log('Flags', flags);
		// $('#nextflow-gwas-flags').html(JSON.stringify(flags));
	});


	// This function will return html code as a string
	function gwas_process_steps(data, parentl_model_name, model_data) {
		// var model_data = data['definitions']['input_output_options']['properties']['model']['options'][model];
		var html = '';
		var steps = model_data['steps'];
		console.log('steps', steps);
		var steps_keys = Object.keys(steps);
		if (model_data['title'] != undefined) {
			html += '<div style="text-transform: uppercase; font-weight: 500; margin-top: 15px; margin-bottom: 10px;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAONJREFUOE+tlIENwjAMBL+bwCTAJrAJTAKbwCbAJNBDSeWkTpuIWKrUNt/L2049qHMMnXkqAfeSuJbiJemWCzzgRtKz0vlh3PhhtR7wKukYRBfPRVhjU2BAp8iB0R1CUiatbcFt3DhxmQOtCDjPp4JLu/nk0gJzQXxucmmBXgrUssmlBX6cIluXOPUiHq9fLSPQrYfpJuslIGtEAuTFPXTWdm0tZb5LMltqCmLOGg5Kf9Ss7rnQulw7NjN3vFg62ACb3HlAW0vu//71gHQfDkDp7m5l4rzH9XPN+KqcXL6s+8T+AmgCRRUPcuWxAAAAAElFTkSuQmCC" /> ' + model_data['title'] + '</div>';
		}
		if (model_data['warning'] != undefined) {
			html += '<div style="text-transform: uppercase; font-weight: 500; margin-bottom: 10px;">WARNING: ' + model_data['warning']  + '</div>';
		}
		
		console.log('steps_keys', steps_keys);
		for (var sk_i = 0; sk_i < steps_keys.length; sk_i++) {
			html += '<table>';
			var step_key = steps_keys[sk_i];
			var step_prefix = parentl_model_name + "_" + steps[step_key];
			console.log('step_prefix', step_prefix);
			var step_ui = data['definitions'][step_prefix + '_options'];
			var step_properties = step_ui['properties'];
			var step_properties_keys = Object.keys(step_properties);
			html += '<tr>';
			html += '<td class="gwas_step" data-step="' + steps[step_key] +'" style="padding-bottom: 10px;">Step ' + (sk_i + 1) + ' - '  + step_prefix.toUpperCase() + '</td><td></td>';
			html += '</tr>';
			for (var spk_i = 0; spk_i < step_properties_keys.length; spk_i++) {
				var step_property_key = step_properties_keys[spk_i];
				var step_property_object = step_properties[step_property_key];
				console.log(step_property_object);
				var step_property_type = step_property_object['type'];
				// var step_property_format = step_property_object['format'];
				var step_property_description = step_property_object['description'];
				var step_property_default_value = '';
				if (step_property_object.hasOwnProperty('default')) {
					step_property_default_value = step_property_object['default'];
				}
				switch (step_property_type) {
					case 'string':
						if (step_property_object.hasOwnProperty('options')) {
							// select list
							html += '<tr>';
							html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
							html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
							html += '<select class="property_form_field" data-input-name="' + step_property_key + '">';
							var options = step_property_object['options'];
							var options_keys = Object.keys(options);
							for (var o_i = 0; o_i < options_keys.length; o_i++) {
								var option_key = options_keys[o_i];
								html += '<option value="' + option_key + '">';
								html += options[option_key];
								html += '</option>';
							}
							html += '</select>';
							html += '</td>';
							html += '</tr>';
						}
						else if (step_property_object.hasOwnProperty('format')) {
							if (step_property_object['format'] == 'file-path') {
								var regex_pattern = '';
								if (step_property_object['pattern'] != undefined) {
									regex_pattern = step_property_object['pattern'];
								}
								html += '<tr>';
								html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
								html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
								html += nextflow_workflow_files_select(regex_pattern, step_property_key, 'nextflow_gwas_step_property property_form_field');
								html += '</td>';
								html += '</tr>';
							}
						}
						else {
							// input field
							html += '<tr>';
							html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
							html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
							html += '<input class="property_form_field" type="text" value="' + step_property_default_value + '" data-input-name="' + step_property_key +'" />';
							html += '</td>';
							html += '</tr>';
						}
						break;
					case 'float':
						html += '<tr>';
						html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
						html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
						html += '<input class="property_form_field" type="text" value="' + step_property_default_value + '" data-input-name="' + step_property_key +'" />';
						html += '</td>';
						html += '</tr>';
						break;
					case 'integer':
						html += '<tr>';
						html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
						html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
						html += '<input class="property_form_field" type="text" value="' + step_property_default_value + '" data-input-name="' + step_property_key +'" />';
						html += '</td>';
						html += '</tr>';
						break;
					case 'boolean':
						html += '<tr>';
						html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + step_property_description + '</td>';
						html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
						// html += '<input class="property_form_field" type="text" value="' + step_property_default_value + '" data-input-name="' + step_property_key +'" />';
						html += '<select class="property_form_field" data-input-name="' + step_property_key + '">';
						html += '<option value="true">True</option>';
						html += '<option value="false">False</option>';
						html += '</select>';
						html += '</td>';
						html += '</tr>';
						break;
				}
			}
			html += '<tr>';
			var data_vis_file = '';
			if (sk_i == step_properties_keys.length - 1) {
				data_vis_file = 'gwasVis.png';
			}
			html += '<td><button class="btn btn-primary gwas_button_run_step" data-vis-file="' + data_vis_file + '" style="margin-bottom: 10px;">Run step</button> <button class="btn btn-primary gwas_button_stop_step" data-vis-file="' + data_vis_file + '" style="margin-bottom: 10px;">Stop step</button></td><td></td>';
			html += '</tr>';
			html += '</table>';
		}
		html += '<div class="gwas_vis_container"></div>';
		return html;
	}


	$('body').off('click', '#nextflow-gwas-interface select#gwas_choose_sub_workflow');
	$('body').on('click', '#nextflow-gwas-interface select#gwas_choose_sub_workflow', function() {
		console.log('gwas_choose_sub_workflow selected');
		var model = $(this).val();
		console.log('gwas_parent_model_name', gwas_parent_model_name);
		console.log('model', model);

		var gwas_sub_model_data = gwas_model_data[model];
		var html = '';
		html += gwas_process_steps(gwas_data, gwas_parent_model_name, gwas_sub_model_data);
		$('#nextflow-gwas-interface-model-options').html(html);
		

		// var b64_data = $(this).closest('#nextflow_gwas_options_main').attr('data-schema');
		// var data = atob(b64_data);
		// data = JSON.parse(data); // convert json to object
		// console.log('data', data);
		// var parent_model_name = $(this).closest('#nextflow_gwas_options_main').attr('data-parent-model-name');
		// console.log('parent_model_name', parent_model_name);
		// var model_data = data['definitions']['input_output_options']['properties']['model']['options'][parent_model_name][model];
		// console.log('model_data', model_data);
		// var html = gwas_process_steps(data, parent_model_name, model_data);
		// $('#nextflow-gwas-interface-model-options').html(html);
	});


	// When the analysis section tab is clicked in the Analysis popup window
	// populate steps and form items to begin asking user for more input
	var gwas_data = '';
	var gwas_parent_model_name = '';
	var gwas_model_data = '';
	$('#analysis-create-analysis-section-tab').click(function() {

		$('body').off('click', '#nextflow-gwas-interface select[data-input-name="workflow"]');
		$('body').on('click', '#nextflow-gwas-interface select[data-input-name="workflow"]', function() {
			console.log('GWAS model selected');
			$('#nextflow-gwas-interface-model-options').html(''); // clear previous model UI

			// Get the ui json
			var b64_data = $(this).closest('#nextflow_gwas_options_main').attr('data-schema');
			var data = atob(b64_data);
			
			data = JSON.parse(data); // convert json to object
			gwas_data = data;
			console.log('data', data);
			var workflow = $(this).val();
			console.log('workflow', workflow);

			var parent_workflow_name = workflow;
			gwas_parent_model_name = parent_workflow_name;
			var workflow_data = data['definitions']['input_output_options']['properties']['workflow']['options'][workflow];
			gwas_model_data = workflow_data;
			console.log('workflow_data', workflow_data);
			var html = '';
			
			$('#nextflow-gwas-interface-submodel-options').html(''); // clear previous submodel UI
			var html_submodels_choice_html = '';
			html_submodels_choice_html += '<table>';
			html_submodels_choice_html += '<tr>';
			html_submodels_choice_html += '<td style="padding-bottom: 10px; text-transform: capitalize;">Choose sub workflow</td>';
			html_submodels_choice_html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
			html_submodels_choice_html += '<select id="gwas_choose_sub_workflow">';
			// The keys will contain the submodels
			var submodels_keys = Object.keys(workflow_data);
			for (var sm_i = 0; sm_i < submodels_keys.length; sm_i++) {
				var submodel_key = submodels_keys[sm_i];
				console.log('submodel_key', submodel_key);
				html_submodels_choice_html += '<option value="' + submodel_key + '">' + workflow_data[submodel_key]['title'] + '</option>';
			}
			html_submodels_choice_html += '</select>';
			html_submodels_choice_html += '<table>';
			html_submodels_choice_html += '</td>';
			$('#nextflow-gwas-interface-submodel-options').html(html_submodels_choice_html);
			
			$('#nextflow-gwas-interface-model-options').html('Please select model to see options');

			// if (typeof model_data === 'object') {
			// 	if (model_data['steps'] == undefined) {
			// 		var sub_models = Object.keys(model_data);
			// 		for (var sm_i = 0; sm_i < sub_models.length; sm_i++) {
			// 			var sub_model_data = model_data[sub_models[sm_i]];
			// 			console.log('sub_model_data', sub_model_data);
			// 			html += gwas_process_steps(data, parent_model_name, sub_model_data);
			// 		}

			// 	}
			// 	else {
			// 		console.log('Uncatered condition - the GWAS JSON should not be in this format so something is wrong there')
			// 		// html += gwas_process_steps(data, parent_model_name, model_data);
			// 	}
			// }
			// else {
			// 	html += '<table>';
			// 	html += '<tr>';
			// 	html += '<td><i>No options available for this model</i></td>';
			// 	html += '</tr>';
			// 	html += '</table>';
			// }
			// $('#nextflow-gwas-interface-model-options').html(html);
		});



		// Load Nextflow GWAS UI elements
		var gwas_ui_url = Drupal.settings.base_url + '/cartogratree/api/v2/gwas/get_ui_json';
		$.ajax({
			url: gwas_ui_url,
			method: 'GET',
			success: function(data) {
				console.log('GWAS UI JSON', data);
				var input_properties = data['definitions']['input_output_options']['properties'];
				var input_properties_keys = Object.keys(input_properties);
				var interface_html = '<div id="nextflow_gwas_options_main" data-schema="' + btoa(JSON.stringify(data)) + '">';
				for (var ipk_i = 0; ipk_i < input_properties_keys.length; ipk_i++) {
					var property_name = input_properties_keys[ipk_i];

					console.log('property_name', property_name);
					var property_type = input_properties[property_name]['type'];
					console.log('property_type', property_type);
					var property_format = input_properties[property_name]['format'];
					console.log('property_format', property_format);
					var property_options = input_properties[property_name]['options'];
					console.log('property_options', property_options);
					switch (property_type) {
						case 'string':
							if (property_format == 'file-path') {
								// interface_html += '<tr>';
								interface_html += '<div style="padding-bottom: 10px; text-transform: capitalize;">' + input_properties[property_name]['description'] + '</div>';
								interface_html += '<div style="padding-bottom: 10px;">';
								var regex_pattern = '';
								if (input_properties[property_name]['pattern'] != undefined) {
									regex_pattern = input_properties[property_name]['pattern'];
								}
								interface_html += nextflow_workflow_files_select(regex_pattern, property_name, 'nextflow_gwas_property property_form_field');
								interface_html += '</div>';
								// interface_html += '</tr>';
							}
							else if (property_options != undefined) {
								// fix Gabe's adjustments
								var din = property_name;
								if (din == 'model') {
									din = 'workflow';
								}
								// interface_html += '<tr>';
								interface_html += '<div style="padding-bottom: 10px; text-transform: capitalize;">' + input_properties[property_name]['description'] + '</div>';
								interface_html += '<div style="padding-bottom: 10px;">';
								// interface_html += '<input type="text" data-input-name="' + property_name + '" />'
								interface_html += '<select class="property_form_field" data-input-name="' + din + '">';
								var property_options_keys = Object.keys(property_options);
								console.log('property_options_keys', property_options_keys);
								for (var ok_i = 0; ok_i < property_options_keys.length; ok_i++) {
									var property_option_name = property_options_keys[ok_i];
									console.log('property_option_name', property_option_name);
									var property_option_title = '';
									if (typeof property_options[property_option_name] !== 'object') {
										property_option_title = property_options[property_option_name];
									}
									else if (property_options[property_option_name]['title'] !== undefined) {
										property_option_title = property_options[property_option_name]['title'];
									}
									else {
										property_option_title = property_option_name;
									}
									interface_html += '<option value="' + property_option_name + '">';
									interface_html += property_option_title;
									interface_html += '</option>';
								}
								interface_html += '</select>';
								interface_html += '</div>';
								// interface_html += '</tr>';
							}
							break;
						/*
						case 'boolean':
							interface_html += '<tr>';
							interface_html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + input_properties[property_name]['description'] + '</td>';
							interface_html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
							interface_html += '<select class="property_form_field" data-input-name="' + property_name + '">';
							interface_html += '<option value="true">true</option>';
							interface_html += '<option value="true">false</option>';
							interface_html += '</select>';
							interface_html += '</td>';
							interface_html += '</tr>';
							break;
						case 'integer':
							interface_html += '<tr>';
							interface_html += '<td style="padding-bottom: 10px; text-transform: capitalize;">' + input_properties[property_name]['description'] + '</td>';
							interface_html += '<td style="padding-left: 10px; padding-bottom: 10px;">';
							interface_html += '<input type="text" class="property_form_field" data-input-name="' + property_name + '" />';
							interface_html += '</td>';
							interface_html += '</tr>';
							break;
						*/
					}
				}
				interface_html += '</div>';
				interface_html += '<h5>Models available</h5>';
				interface_html += '<div id="nextflow-gwas-interface-submodel-options">';
				interface_html += 'Please choose program to view available models';
				interface_html += '</div>';

				interface_html += '<h5>Model options</h5>';
				interface_html += '<div id="nextflow-gwas-interface-model-options">';
				interface_html += 'Model options will be displayed here after model selection';
				interface_html += '</div>';
				interface_html += '<hr />';
				$('#nextflow-gwas-interface').html(interface_html);
				$('#nextflow-gwas-interface select[data-input-name="workflow"]').click()
				$('#nextflow-gwas-interface-submodel-options #gwas_choose_sub_workflow').delay(2000).click();
			}
		});

		console.log($('#create-analysis-select-galaxy-account').html());
		// if($('#create-analysis-select-galaxy-account').html() == "") {
			// var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_galaxy_accounts";
			// $.ajax({
			// 	method: "GET",
			// 	url: url,
			// 	dataType: "json",
			// 	success: function (data) {
			// 		console.log(data);
			// 		var html = '';
			// 		for(var i=0; i<data.length; i++) {
			// 			html += '<option value="' + data[i].galaxy_id+ '">' + data[i].servername +  '</option>';
			// 		}
			// 		$('#create-analysis-select-galaxy-account').html(html);
			// 	}
			// });
		// }
		// else {
		// 	//$('#analysis-retrieve-envdata-section-layers-list').html("");
		// 	console.log("Interface already populated with data");
		// }
	});


	$('#create-analysis-select-galaxy-account').click(function() {
		// window.alert("Nice");
		cartograplant.galaxy_id = $('#create-analysis-select-galaxy-account').val();


		// cartograplant_analysis_populate_histories_select_list();
		// Do not show any of the SNP Quality Filtering
		console.log('Populate Workflow select list for Run Analysis');
		// cartograplant_analysis_populate_workflow_select_list({
		// 	'show': ['GWAS with EMMAX', 'Multiple Testing Correction']
		// });
		
	});	

	cartograplant_analysis_nextflow_populate_workspaces_select_list();
	function cartograplant_analysis_nextflow_populate_workspaces_select_list() {
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_nextflow_workspaces";
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				var html = '';
				for (var i = 0; i < data.length; i++) {
					var workspace_name = data[i];
					html +=  '<option value="' + workspace_name + '">' + workspace_name +  '</option>';
				}
				$('#nextflow-create-analysis-select-history').html(html);
				$('#nextflow-create-analysis-select-history').click();
				// var key = Object.keys(data);
				// var html = '';
				// var workflow_ids = Object.keys(data[key]);
				// for(var i=0; i<workflow_ids.length; i++) {
				// 	console.log(data[key][workflow_ids[0]]);
				// 	var workspace_raw_label = data[key][workflow_ids[i]];
				// 	// Filter by start substring workspace-
				// 	if(workspace_raw_label.startsWith('workspace-')) {
				// 		var workspace_processed_label = workspace_raw_label;
				// 		workspace_processed_label = workspace_processed_label.replace('workspace-', '');
				// 		var workspace_processed_label_2underscore_parts = workspace_processed_label.split('__');
				// 		workspace_processed_label = workspace_processed_label_2underscore_parts[1].split('_')[1];

				// 		// If the workspace is owned/created by the current user id
				// 		if(workspace_processed_label_2underscore_parts[0].split('_')[1] == Drupal.settings.user.user_id) {
				// 			html = html +  '<option value="' + workflow_ids[i] + '">' + workspace_processed_label +  '</option>';
				// 		}
				// 	}
				// }
				// $('#create-analysis-select-history').html(html);
				// $('#create-analysis-select-history').click(); // removed on click due to slow ajax calls and added next line to remember history
				// cartograplant.history_id = $('#create-analysis-select-history').val();
			}
		});
	}

	function cartograplant_analysis_populate_histories_select_list() {
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_history_from_galaxy_account/" + cartograplant.galaxy_id;
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
					var workspace_raw_label = data[key][workflow_ids[i]];
					// Filter by start substring workspace-
					if(workspace_raw_label.startsWith('workspace-')) {
						var workspace_processed_label = workspace_raw_label;
						workspace_processed_label = workspace_processed_label.replace('workspace-', '');
						var workspace_processed_label_2underscore_parts = workspace_processed_label.split('__');
						workspace_processed_label = workspace_processed_label_2underscore_parts[1].split('_')[1];

						// If the workspace is owned/created by the current user id
						if(workspace_processed_label_2underscore_parts[0].split('_')[1] == Drupal.settings.user.user_id) {
							html = html +  '<option value="' + workflow_ids[i] + '">' + workspace_processed_label +  '</option>';
						}
					}
				}
				$('#create-analysis-select-history').html(html);
				$('#create-analysis-select-history').click(); // removed on click due to slow ajax calls and added next line to remember history
				cartograplant.history_id = $('#create-analysis-select-history').val();
			}
		});
	}

	try {
		$('#nextflow-create-analysis-select-history').off('change');
	} catch (err) {}
	$('#nextflow-create-analysis-select-history').change(function() {
		cartograplant_analysis_nextflow_populate_workspace_contents_list();
	});

	try {
		$('.nextflow-manage-workspace-files-refresh').off('click');
	} catch (err) {}
	$('.nextflow-manage-workspace-files-refresh').click(function() {
		cartograplant_analysis_nextflow_populate_workspace_contents_list(true);
	});

	try {
		$('#create-analysis-select-history').off('change');
	} catch (err) {}
	$('#create-analysis-select-history').change(function() {
		cartograplant_analysis_populate_history_contents_list();
	});

	try {
		$('.manage-workspace-files-refresh').off('click');
	} catch (err) {}
	$('.manage-workspace-files-refresh').click(function() {
		cartograplant_analysis_populate_history_contents_list(true);
	});

	// try {
	// 	$('#create-analysis-select-history').off('click');
	// } catch (err) {}
	// $('#create-analysis-select-history').click(function() {
	// 	cartograplant_analysis_populate_history_contents_list();
	// });


	$('body').off('click', '#nextflow-upload-workspace-file-button');
	$('body').on('click', '#nextflow-upload-workspace-file-button', function() {
		// nextflow-upload-workspace-file
		console.log('Click to upload a file');
		var workspace_name = $('#nextflow-create-analysis-select-history').val();
		// var filename = $(this).attr('data-filename');
		var url_nextflow_upload_file = Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_upload_workspace_file/' + workspace_name;
		var form_data = new FormData();
		console.log('file_data', $('#nextflow-upload-workspace-file')[0].files);
		form_data.append('file1', $('#nextflow-upload-workspace-file')[0].files[0] );
		$.ajax({
			xhr: function() {
				var xhr = new window.XMLHttpRequest();
			
				xhr.upload.addEventListener("progress", function(evt) {
					if (evt.lengthComputable) {
						var percentComplete = evt.loaded / evt.total;
						percentComplete = parseInt(percentComplete * 100);
						console.log(percentComplete);
						$('#nextflow-upload-workspace-file-progress').html(percentComplete + '%');
						if (percentComplete === 100) {
							$('#nextflow-upload-workspace-file-progress').html('File upload complete.');
						}
					}
				}, false);
			
				return xhr;
			},
			method: 'POST',
			type: 'POST',
			url: url_nextflow_upload_file,
			contentType: false,
			processData: false,
			cache: false,
			// enctype: 'multipart/form-data',
			data: form_data,
			success: function(data) {
				cartograplant_analysis_nextflow_populate_workspace_contents_list(true);
			}
		});
	});

	$('body').off('click', '#nextflow-manage-workspace-files-delete');
	$('body').on('click', '#nextflow-manage-workspace-files-delete', function() {
		console.log('Click to delete a file');
		var workspace_name = $('#nextflow-create-analysis-select-history').val();
		var filename = $(this).attr('data-filename');
		var url_nextflow_delete_file = Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_delete_workspace_file/' + workspace_name + '/' + filename;
		$.ajax({
			method: 'GET',
			url: url_nextflow_delete_file,
			success: function(data) {
				console.log(data);
				if (data['status'] == true) {
					cartograplant_analysis_nextflow_populate_workspace_contents_list(true);
				}
				else {
					alert('Failed to delete file. Please contact administrator.');
				}
			}
		});

	});
	
	function cartograplant_analysis_nextflow_populate_workspace_contents_list(force = false) {
		var workspace_name = $('#nextflow-create-analysis-select-history').val();
		var url_nextflow_workspace_files = Drupal.settings.base_url + '/cartogratree_uianalysis/get_nextflow_workspace_files/' + workspace_name;
		$('.nextflow-workspace-nextflow-files-loader').html('<i class="fa-solid fa-sync fa-spin"></i>');
		$.ajax({
			method: 'GET',
			url: url_nextflow_workspace_files,
			success: function(data) {
				console.log(data);
				$('#nextflow-manage-workspace-contents').html('');
				$('.nextflow-workspace-nextflow-files-loader').html('');
				var div = '';
				for (var i = 0; i < data.length; i++) {
					div += '<div style="display: flex;"></div>';
					div += '<div style="margin-bottom: 5px;">';
					// id, history_id, dataset_id
					var file_location_parts = data[i].split('/');
					var filename = file_location_parts[file_location_parts.length - 1];
					div += '<button style="display: inline-block; vertical-align: top;" class="btn btn-danger" id="nextflow-manage-workspace-files-delete" data-filename="' + filename + '" data-toggle="tooltip" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button>';
					div += '<button style="display: inline-block; vertical-align: top;" class="btn btn-info" id="nextflow-manage-workspace-file-download" data-toggle="tooltip" title="Download"><a href="' + Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_download_workspace_file/' +  workspace_name + '/' + filename + '"><i class="fa fa-download" aria-hidden="true"></i></a></button>';
					// <i class="fa fa-download" aria-hidden="true"></i>
					// div += '<button class="btn btn-info" id="manage-history-contents-delete-' + history_item['dataset_id'] + '" style=""><i class="fa fa-download" aria-hidden="true"></i></button>';
					
					div += ' <div style="display: inline-block; vertical-align: top; width: 80%;"><a href="' + Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_download_workspace_file/' +  workspace_name + '/' + filename + '">' + filename + '</a></div>';
					div += '</div>';
				}
				$('#nextflow-manage-workspace-contents').append(div);
			}
		});
	}

	function cartograplant_analysis_populate_history_contents_list(force = false) {
		try {
			// Populate a list of history contents which can be managed (which really allows a user to delete essentially)
			cartograplant.history_id = $('#create-analysis-select-history').val();
			var url_history_contents = Drupal.settings.base_url + '/cartogratree_uianalysis/get_history_details/' + cartograplant.galaxy_id + '/' + cartograplant.history_id;
			if (force == true) {
				url_history_contents += "?force";
			}
			console.log(url_history_contents);
			$('.workspace-files-loader').html('<i class="fa-solid fa-sync fa-spin"></i>');
			$.ajax({
				method: 'GET',
				url: url_history_contents,
				success: function(data) {
					console.log(data);
					$('#manage-history-contents').html('');
					if(data.length > 0) {
						var div = '';
						for(var i=0; i<data.length; i++) {
							// console.log(data);
							var history_item = data[i];
							//if(history_item['deleted'] == false) {
								
								div += '<div style="display: flex;"></div>';
								div += '<div style="margin-bottom: 5px;">';
								// id, history_id, dataset_id
								div += '<button style="display: inline-block; vertical-align: top;" class="btn btn-danger" id="manage-history-contents-delete-' + history_item['dataset_id'] + '" data-toggle="tooltip" title="Delete"><i class="fa fa-trash" aria-hidden="true"></i></button>';
								div += '<button style="display: inline-block; vertical-align: top;" class="btn btn-info" id="manage-history-contents-download-' + history_item['dataset_id'] + '" data-toggle="tooltip" title="Download"><a href="' + history_item['dataset_url'] + '"><i class="fa fa-download" aria-hidden="true"></i></a></button>';
								// <i class="fa fa-download" aria-hidden="true"></i>
								// div += '<button class="btn btn-info" id="manage-history-contents-delete-' + history_item['dataset_id'] + '" style=""><i class="fa fa-download" aria-hidden="true"></i></button>';
								var file_name_caption = cartograplant.get_file_name_caption(history_item['dataset_name']);
								div += ' <div style="display: inline-block; vertical-align: top; width: 80%;"><a href="' + history_item['dataset_url'] + '">' + file_name_caption + '</a></div>';
								div += '</div>';
								
							//}
						}
						$('#manage-history-contents').append(div);
					}
					else {
						$('#manage-history-contents').html('This workspace currently contains no files');
					}
					$('.workspace-files-loader').html('');
				},
				error: function(err) {
					$('.workspace-files-loader').html('');
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
		var url_delete_history_content_id = Drupal.settings.base_url + '/cartogratree_uianalysis/delete_history_content_id/' + cartograplant.galaxy_id + '/' + cartograplant.history_id + '/' + content_id;
		console.log(url_delete_history_content_id);
		$('.workspace-files-loader').html('<i class="fa-solid fa-trash fa-fade"></i>');
		$.ajax({
			method: 'GET',
			url: url_delete_history_content_id,
			success: function(data) {
				console.log(data);
				cartograplant_analysis_populate_history_contents_list();
			}
		});		
	});

	function cartograplant_analysis_populate_workflow_select_list(filters = undefined) {
		// filters can contain keys: hide, show
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_workflows_from_galaxy_account/" + cartograplant.galaxy_id;
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log('workflow options', data);
				var html = '';
				var show_items = {};

				for(var i=0; i<data.length; i++) {
					if (filters != undefined) {
						if(filters.show != undefined) {
							console.log(data[i].workflow_name);
							console.log('filters.show', filters.show);
							if (filters.show.includes(data[i].workflow_name)) {
							// if (data[i].workflow_name.includes(filters.show)) {
								console.log('show');
								// show it
								show_items[data[i].workflow_name] = {
									workflow_name: data[i].workflow_name,
									workflow_id: data[i].workflow_id
								}
								html = html +  '<option value="' + data[i].workflow_id + '">' + data[i].workflow_name +  '</option>';
							}
						}
						else if (filters.hide != undefined) {
							var hide = false;
							for(var j=0; j<filters.hide.length; j++) {
								var filter_name = filters.hide[j];
								if(data[i].workflow_name.includes(filter_name) == true) {
									console.log('Filter found in hide');
									hide = true;
								}
							}
							if (hide == false) {
							// if (filters.hide.includes(data[i].workflow_name) == undefined) {
								// show it
								show_items[data[i].workflow_name] = {
									workflow_name: data[i].workflow_name,
									workflow_id: data[i].workflow_id
								}
								html = html +  '<option value="' + data[i].workflow_id + '">' + data[i].workflow_name +  '</option>';
							}
						}
					}
					else {
						show_items[data[i].workflow_name] = {
							workflow_name: data[i].workflow_name,
							workflow_id: data[i].workflow_id
						}
						html = html +  '<option value="' + data[i].workflow_id + '">' + data[i].workflow_name +  '</option>';
					}
					console.log('html', html);
				}

				var html = "";
				// Order matters if listed in filters.show
				if(filters.show != undefined) {
					for (var i = 0; i<filters.show.length; i++) {
						var fname = filters.show[i];
						// Get the info from show_items
						var item = show_items[fname];
						html = html + '<option value="' + item.workflow_id + '">' + item.workflow_name +  '</option>';
					}
				}
				// Else order does not matter 
				else {
					var keys = Object.keys(show_items);
					for (var i = 0; i<keys.length; i++) {
						var item = show_items[keys[i]];
						html = html + '<option value="' + item.workflow_id + '">' + item.workflow_name +  '</option>';
					}
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
		// cartograplant.history_id = $('#create-analysis-select-history').val();
		cartograplant.workflow_name = $('#create-analysis-select-workflow option:selected').text();
		console.log('workflow_id', workflow_id);
		
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_workflow_input_types/" + cartograplant.galaxy_id + '/' + workflow_id + '/' + cartograplant.history_id + '?nocache=' + Math.floor(Date.now() / 1000);
		console.log(url);
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log(data);
				var ui_controls = data.ui_controls;
				var step_indexes = data.step_indexes;
				cartograplant.analysis_workflow_step_indexes[workflow_id] = step_indexes;
				
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
										var file_name_caption = cartograplant.get_file_name_caption(galaxy_history_file_name);
										options_html += "<option value='" + options_keys[options_html_counter] + "'>" + file_name_caption +  '</option>';
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
	try {
		$(document).off('click', '.initiate_analysis_job_button');
	} catch (err) {}
	$(document).on('click', '.initiate_analysis_job_button', function() {
		// We'll need to get creative here, try to select elements that contain workflow
		// To do that, we'll need to get workflow from this button clicked
		var workflow_id = ($(this).attr('id')).split('_')[0];
		
		var step_indexes = cartograplant.analysis_workflow_step_indexes[workflow_id]; // we need to send this to initiate_analysis_job endpoint

		console.log('galaxy_id', cartograplant.galaxy_id);

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
		formData.append('history_id', cartograplant.history_id);
		formData.append('workflow_id', workflow_id);
		formData.append('workflow_name', cartograplant.workflow_name);
		formData.append('galaxy_id', cartograplant.galaxy_id);
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
					if(cartograplant.analysis_job_check_timers[data.invocation.id] == undefined) {
						// create a new interval timer
						var invocation_id = data.invocation.id;
						cartograplant.analysis_job_check_timers[data.invocation.id] = setInterval(function(galaxy_id, history_id, workflow_id, invocation_id) {
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
											$('#analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span> File download: <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
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
										clearInterval(cartograplant.analysis_job_check_timers[data.invocation.id]);
										
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


											
						}, 10000, cartograplant.galaxy_id, cartograplant.history_id, workflow_id, invocation_id);
					}

				}
			}
		});		
	});

	// This should cater for file uploading to the currently selected history then maybe refresh the select list
	try {
	$(document).off('click', '.history_file_upload_button');
	} catch (error) {}
	$(document).on('click', '.history_file_upload_button', function() {
		// alert('This should upload the file to galaxy history');

		// Get the control id of the file
		var upload_button_id = $(this).attr('id');
		var status_container = upload_button_id.replaceAll('-upload-button', '-upload-status');
		$('#' + status_container).html('Uploading <div style="display: inline-block;" class="loading"></div>');
		var file_id = upload_button_id.replaceAll('-button','');
		console.log('file_id', file_id);

		var formData = new FormData();
		formData.append('galaxy_id', cartograplant.galaxy_id);
		formData.append('workflow_id', workflow_id);
		formData.append('history_id', cartograplant.history_id);
		var file_upload_element = document.getElementById(file_id);
		formData.append('file1', file_upload_element.files[0]);
		
		// if(cartograplant.history_id == null) {
		// 	alert('Cannot upload a file without selecting a workspace to store the file, please visit the Begin tab to select or create a workspace');
		// 	return;
		// }

		
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


	try {
	$(document).off('click', '#analysis-retrieve-envdata-section-tab');
	} catch (error) {}
	$(document).on('click', '#analysis-retrieve-envdata-section-tab', function() {
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
					$('#analysis-retrieve-envdata-section-layers-list .analysis_category_checkbox').click();
				}

			});
		}
		else {
			//$('#analysis-retrieve-envdata-section-layers-list').html("");
			console.log("Interface already populated with data");
		}
	});

	// This will show the container that contains the option to create a new history
	try {
		$(document).off('click', '#nextflow-create-analysis-new-workspace-button');
	} catch (error) {}
	$(document).on('click', '#nextflow-create-analysis-new-workspace-button', function() {
		if ($('#nextflow-create-analysis-new-workspace-configuration').css('display') == 'none') {
			$('#nextflow-create-analysis-new-workspace-configuration').css('display','flex');
		}
		else {
			$('#nextflow-create-analysis-new-workspace-configuration').css('display', 'none');
		}
	});

	// This will show the container that contains the option to create a new history
	try {
	$(document).off('click', '#create-analysis-new-history-button');
	} catch (error) {}
	$(document).on('click', '#create-analysis-new-history-button', function() {
		if ($('#create-analysis-new-history-configuration').css('display') == 'none') {
			$('#create-analysis-new-history-configuration').css('display','flex');
		}
		else {
			$('#create-analysis-new-history-configuration').css('display', 'none');
		}
	});

	try {
		$(document).off('click', '#nextflow-create-analysis-new-workspace-name-button');
	} catch (error) {}
	$(document).off('click', '#nextflow-create-analysis-new-workspace-name-button');
	$(document).on('click', '#nextflow-create-analysis-new-workspace-name-button', function() {
		console.log($('#nextflow-create-analysis-new-workspace-name').val());
		var workspace_name = $('#nextflow-create-analysis-new-workspace-name').val();
		if (workspace_name == "") {
			alert('The workspace name cannot be empty!');
		}
		else {
			var url = Drupal.settings.base_url + "/cartogratree_uianalysis/nextflow_create_new_workspace_for_user/" + workspace_name;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					// Repopulate the workspaces list which should now contain 
					console.log(data);
					cartograplant_analysis_nextflow_populate_workspaces_select_list();
					$('#nextflow-create-analysis-new-workspace-configuration').hide();
					alert('Created new workspace:' + workspace_name);


				}
			});	
		}
	});

	try {
	$(document).off('click', '#create-analysis-new-history-name-button');
	} catch (error) {}
	$(document).on('click', '#create-analysis-new-history-name-button', function() {
		// Here we need to make an api call to create a new history or return an error that this history name
		// has already been taken

		console.log($('#create-analysis-new-history-name').val());
		var history_name = ($('#create-analysis-new-history-name').val()).trim();
		if (history_name == "") {
			alert("The history name cannot be empty!");
		}
		else {
			var url = Drupal.settings.base_url + "/cartogratree_uianalysis/create_new_history_for_user/" + cartograplant.galaxy_id + '/workspace-uid_' + Drupal.settings.user.user_id + '__name_' + history_name;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					// Repopulate the histories list which should now contain 
					// cartograplant_analysis_populate_histories_select_list();
					console.log(data);
					$('#create-analysis-new-history-configuration').hide();
					alert('Created new history:' + history_name);


				}
			});

		
		}

		// alert('Success');
	});

	try {
		$(document).off('click','.analysis_category_checkbox');
	}
	catch (error) {}
	$(document).on('click','.analysis_category_checkbox',function () {
		var this_id = $(this).attr("id");
		var category_id = this_id.split("_", 3)[2];
		console.log('category_id=', category_id);
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
						var category_group_container_html = "<div class='category_group_container' style='padding-left: 5px;'>";
						category_group_container_html += "</div>";
						var category_group_container = $(category_group_container_html);

						var item_html = "<div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div><input type='checkbox' class='analysis_category_group_checkbox' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "'><div style='display: inline-block; color:#FFFFFF; background-color: #dc6e00; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>group</div>" + data[i]['group_name'] + "</div>";
						item_html += '<div style="padding-left: 20px;" class="search_box_container" id="analysis_category_' + category_id + '_groups_' + data[i]['group_id'] + '_search_box_container" data-category="' + category_id +  '" data-group="' + data[i]['group_id'] + '">';
						item_html += '<div data-toggle="tooltip" title="Search group properties" style="display: inline-block; color:#FFFFFF; background-color: #ae46ef; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; padding-left: 4px; padding-right: 4px; vertical-align: middle;"><i class="fa fa-search" aria-hidden="true"></i> Search</div>'
						item_html += '<input style="text-align: center;" data-toggle="tooltip" title="contains" class="properties_search_box" type="text" />';
            item_html += '<i style="margin-left: 3px; cursor: pointer;" data-toggle="tooltip" title="Clear search" class="fa fa-times-circle properties_search_clear" aria-hidden="true"></i>'
						item_html += '<div style="display: inline-block; margin-left: 5px;" class="results_summary_search_box"></div>'
						item_html += '</div>';
						item_html += '<div class="properties_select_all" data-state="unchecked" style="cursor: pointer; display: inline-block; color:#FFFFFF; background-color: #007bff; border-radius: 2px; font-size: 10px; margin-left: 25px; margin-right: 5px; text-transform: uppercase; padding: 2px; padding-left: 4px; padding-right: 4px; vertical-align: middle;" id="analysis_category_' + category_id + "_groups_" + data[i]['group_id'] + '_select_all"><span class="icon"><i class="fa fa-check-square" aria-hidden="true"></i></span> <span class="text">SELECT ALL</span></div>';
						item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + data[i]['group_id'] + "_layers'>";
						category_group_container.html(item_html);

						$('#analysis_category_groups_' + category_id).append(category_group_container);

						// Hide the search box container until the group checkbox has been clicked
						$('#analysis_category_' + category_id + '_groups_' + data[i]['group_id'] + '_search_box_container').hide();
						$('#analysis_category_' + category_id + '_groups_' + data[i]['group_id'] + '_select_all').hide();
					}
					// $('#analysis-retrieve-envdata-section-layers-list .analysis_category_group_checkbox').click();

				}
			});				
		}
		else {
			// clear the div
			$('#analysis_category_groups_' + category_id).html("");
		}
		console.log('category_id', category_id);
	});

	try {
		$(document).off('click','.analysis_category_group_checkbox');
	} catch (err) {}
	$(document).on('click','.analysis_category_group_checkbox',function () {
		console.log('Source JS script: map_analysis.js');
		var this_id = $(this).attr("id");
		var this_id_parts = this_id.split("_", 5);
		var category_id = this_id_parts[2];
		var group_id = this_id_parts[4];
		console.log('[map_analysis.js] category_id=' + category_id);
		console.log('[map_analysis.js] group_id=' + group_id);
		if($(this).is(':checked')) {
			// get the groups
			var url = Drupal.settings.base_url + "/cartogratree_uiapi/get_layers_by_analysis_category_id_and_group_id/" + category_id + '/' + group_id;
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {
					console.log('map_analysis.js - group layers', data);

          // Make search container visible
          $('#analysis_category_' + category_id + '_groups_' + group_id + '_search_box_container').show();
		      $('#analysis_category_' + category_id + '_groups_' + group_id + '_select_all').show();

					for(var i=0; i<data.length; i++) {
						// var item_html = "<div style='padding-left: 10px;'><input type='checkbox' class='analysis_category_group_checkbox' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "'> " + data[i]['group_name'] + "</div>";
						// item_html += "<div style='padding-left: 20px;' id='analysis_category_" + category_id + "_group_" + data[i]['group_id'] + "_layers'></div>";
						// $('#analysis_category_groups_' + category_id).append(item_html);
						
						var layer_id_number = data[i]['layer_id'];
						// Use layer_id_number to see whether this is a multilayer layer and try to expand out the layers
						console.log('[map_analysis.js] layer info from uiapi endpoint', Drupal.settings['layers']['cartogratree_layer_' + layer_id_number]);
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
								console.log('[map_analysis.js] search_layer_name',search_layer_name);

								// We need to find these layers to get the layer_ids
								var layer_keys = Object.keys(Drupal.settings['layers']);
								for(var k=0; k<layer_keys.length; k++) {
									var tmp_layer_id = Drupal.settings['layers'][layer_keys[k]]['layer_id'];
									var tmp_layer_name = Drupal.settings['layers'][layer_keys[k]]['name'];
									if(tmp_layer_name.includes(search_layer_name)) {
										// add the id
										console.log('[map_analysis.js] tmp_layer_name',tmp_layer_name);
										console.log('[map_analysis.js] tmp_layer_name',tmp_layer_id)
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

						console.log('[map_analysis.js] layer_list_ids',layer_list_ids);
						console.log('[map_analysis.js] layer_list_names',layer_list_names);
						console.log('[map_analysis.js] Creating all layers checkbox lists for this grouping');
						for(var k=0; k<layer_list_ids.length; k++)  {
							var layer_id_k = layer_list_ids[k];

							// var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + data[i]['layer_id'] + "_checkbox' class='analysis_category_groups_layer_checkbox' type='checkbox' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>layer</div>" + data[i]['title'] + "</div>";
							// item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + data[i]['layer_id'] + "'></div>";
							var item_html = "<div class='property_container' style='padding-left: 5px;' layer_title='" + data[i]['title'] + "'>"
							item_html += "<div class='env_layer_meta' style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪ </div>";
							item_html += "<input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id_k + "_checkbox' class='analysis_category_groups_layer_checkbox env_layer_meta' type='checkbox' />";
							item_html += "<div class='env_layer_meta' style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>layer</div>";
							item_html += "<div class='env_layer_meta' style='display: inline-block;'>" + data[i]['title'] + "</div>";
							item_html += "<div class='env_layer_meta' style='display: inline-block;'><img style='width: 16px;' src='" + loading_icon_src + "' /></div>";
							item_html += "<div style='padding-left: 10px;' id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id_k + "'></div>";
							item_html += "</div>";							
							$('#analysis_category_' + category_id + '_groups_' + group_id + '_layers').append(item_html);

							// Click to open the layer to get the list of possible fields
							console.log('[map_analysis.js] automated layer checkbox clicked');
							$('#' + "analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id_k + "_checkbox").click();
						}
						// $('#analysis_category_groups_' + category_id).fadeIn(500);
					}
				}
			});
		}
		else {
			// hide search
			$('#analysis_category_' + category_id + '_groups_' + group_id + '_search_box_container').hide();
			$('#analysis_category_' + category_id + '_groups_' + group_id + '_select_all').hide();

			// clear the div
			$('#analysis_category_' + category_id + '_groups_' + group_id + '_layers').html("");			
		}
	});	



	// Analysis Category Groups Layer Checkbox click
	// This will CREATE the checkboxes for PROPERTIES
	try {
		$(document).off('click', '.analysis_category_groups_layer_checkbox');
	} catch (err) {}
	$(document).on('click', '.analysis_category_groups_layer_checkbox', function() {
		var checkbox_element = $(this);
		var layer_title = $(this).parent().attr('layer_title');
		var this_id = $(this).attr("id");
		var this_id_parts = this_id.split("_");
		var category_id = this_id_parts[2];
		var group_id = this_id_parts[4];	
		var layer_id = this_id_parts[6];
		console.log('[map_analysis.js] layer id autoclicked via checkbox', layer_id);
		var layer_name = Drupal.settings.layers['cartogratree_layer_' + layer_id]['name'];
		//var bbox = '0,0,256,256';
		var bbox = '24.26795744042827,-89.80302970226862,24.467957440428272,-89.60302970226863';
		//var url = Drupal.settings.cartogratree.gis + "/../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" + layer_name + "&maxFeatures=1&outputFormat=json&BBOX=" + bbox;	
		var url = Drupal.settings.cartogratree.gis + "/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=" + layer_name + "&LAYERS=" + layer_name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
		
		console.log('[map_analysis.js] url', url);
		if($(this).is(':checked')) {
			$.ajax({
				method: "GET",
				url: url,
				dataType: "json",
				success: function (data) {

					// We need to pull information about the fields for this layer
					// to determine if any are hidden or renamed
					var url_field_details = Drupal.settings.base_url + "/cartogratree_uiapi/get_layer_fields_adjustments/" + layer_id;
					console.log('Environmental layer get field details hidden and renamed');
					console.log('[map_analysis.js] url_field_details',url_field_details);
					$.ajax({
						url: url_field_details,
						method: 'GET',
						success: function(url_field_details_data) {
							
							if (url_field_details_data != undefined) {
								
								console.log('url_field_details_data', url_field_details_data);
								var replacements = {}; // replacements will hold key which is field name
								for (var r_index=0; r_index < url_field_details_data['layer_embedded_fields_rename'].length; r_index++) {
									var r_raw_data = url_field_details_data['layer_embedded_fields_rename'][r_index];
									var r_comma_data = r_raw_data.split(',');
									replacements[r_comma_data[0]] = r_comma_data[1];
								}

								// Use the above info to go through the layer embedded fields if available:
								console.log(data);
								var properties = [];
								if (data['features'].length >= 1) {
									checkbox_element.parent().find('img').hide();
									// This is a band layer most likely with at least one band that represents some type of value
									var properties = data['features'][0]['properties'];
									var keys = Object.keys(properties);

									// If ths keys.length is equal to 1, we don't need to show the 'Layer' checkbox
									// since it just takes up space
									if (keys.length == 1) {
										checkbox_element.parent().find('.env_layer_meta').css('display', 'none');
									}
									for(var i = 0; i < keys.length; i++) {
										var key_name = keys[i];
										if (url_field_details_data['layer_embedded_fields_hide'].includes(key_name) == false) {	
											if(replacements[key_name] != undefined) {
												key_name = replacements[key_name];
											}

											// Alter the key_name if the keys.length was equal to 1 since we hid the env_layer_meta elements
											var key_name_original = key_name;
											if (keys.length == 1) {
												key_name = layer_title + ' (' + key_name + ')';
											}

											var unit_type = undefined;
											var layer_title_cleaned_up = layer_title; // default value
											// Detect if unit type is within the layer_title
											if (layer_title.includes(' - ') == true) {
												// This is a unit type (based on CP meetings)
												var layer_title_dash_parts = layer_title.split('-');
												unit_type = layer_title_dash_parts[1];
												layer_title_cleaned_up = layer_title_dash_parts[0];
											}

											// Check if this layer is a layer that has been enabled on the map by using LayersState
											var layer_settings_object = cartograplant['findLayerInLayersState'](layer_id);
											// Checkbox_state will be used in the checkbox input field to make it checked or not
											var checkbox_state = '';
											if (layer_settings_object != undefined) {
												console.log('[LAYER IS CHECKED]');
												checkbox_state = 'checked';
											}

											// Create a checkbox element for this key / property
											// var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪</div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id + "_property_" + i + "_checkbox' class='analysis_category_groups_layer_property_checkbox' type='checkbox' data-value='" + key_name + "' /><div style='display: inline-block; color:#FFFFFF; background-color: #12ae68; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>property</div>" + key_name +  "</div>";
											var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪</div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id + "_property_" + i + "_checkbox' class='analysis_category_groups_layer_property_checkbox' type='checkbox' " + checkbox_state + " data-value='" + key_name + "' /><div style='display: inline-block; color:#FFFFFF; background-color: #12ae68; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>property</div>" + layer_title_cleaned_up +  "</div>";
											if (key_name_original != undefined && key_name_original != "") {
												item_html += "<div style='display: inline-block; font-size: 9px; padding: 3px; margin-left: 92px;'>Variable</div>"
												item_html += "<div style='display: inline-block; font-size: 9px; margin-right: 20px;'>" + key_name_original + "</div>";
											}
											// Check if layer_name contains a dash (-) and assume anything after it is the units
											if (layer_title.includes(' - ') == true) {
												// This is a unit type (based on CP meetings)
												var layer_title_dash_parts = layer_title.split('-');
												var unit_type = layer_title_dash_parts[1];
												item_html += '<br /><div style="display: inline-block; font-size: 9px; padding: 3px; margin-left: 92px;">Unit type</div>';
												item_html += '<div style="display: inline-block; font-size: 10px; font-weight: 600; margin-left: 10px;">' + unit_type + '</div>';
											}
											$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).append(item_html);

											// Reorder the element to the top, the reason for this is because there may be layers which will show the subgroup
											// which can be confusing
											if (keys.length == 1) {

												var element = $("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id);
												var parent_container = element.parent().parent();
												var parent = element.parent();

                        // Manipulate the dom elements depending on if there is a classification or not
												parent.remove();

                        // Setup a classification if one isn't created based on key_name (get lowercase value, search for strings)
                        var key_name_lowercase = key_name.toLowerCase();
                        var classification = undefined;
						            var sub_classification = undefined;
                        if (key_name_lowercase.includes('temp') || key_name_lowercase.includes('temperature')) {
                          var classification = "temperature";
                          if (key_name_lowercase.includes('maximum')) {
                            sub_classification = 'maximum';
                          }
                          else if (key_name_lowercase.includes('minimum')) {
                            sub_classification = 'minimum';
                          }
                          else if (key_name_lowercase.includes('mean')) {
                            sub_classification = 'mean';
                          }                          
                          else if (key_name_lowercase.includes('average')) {
                            sub_classification = 'average';
                          }
                        }
                        else if (key_name_lowercase.includes('precipitation')) {
                          var classification = "precipitation";
                        }
                        else if (key_name_lowercase.includes('moisture')) {
                          var classification = "moisture";
                        }
                        else if (key_name_lowercase.includes('period')) {
                          var classification = "period";
                        }                          
                        else if (key_name_lowercase.includes('day') && !key_name_lowercase.includes('days')) {
                          var classification = "day";
                        }                        
                        else if (key_name_lowercase.includes('days')) {
                          var classification = "days";
                        }                        

                        // Create a classification element once classification is defined
                        var classification_id = undefined;
                        var classification_container = undefined;
                        if (classification != undefined) {
                          // This is the potential classification id we would use. Use this to check if there is
                          // already a classification element or to create a new one
                          classification_id = "analysis_category_" + category_id + "_groups_" + group_id + '_classification_' + classification;
                        
                          // check if there's a container element created already, if not, create one
                          if ($('#' + classification_id).length) {
                            
                          }
                          else {
                            // jQuery classification_container object
                            classification_container = $('<div class="classification_container" id=' + classification_id + ' data-classification="' + classification + '"></div>');
                            classification_container.css('margin-left', '20px');
                            
                            // *** Overall inner HTML for classification container (contents)
                            var classification_html = '';

                            // This is the L sub marker
                            classification_html += '<div style="display: inline-block; font-size: 20px; position: relative;top: -5px;">˪</div>';

                            // This is the checkbox for the classification grouping
                            classification_html += '<input id="analysis_category_1_groups_27_classification_checkbox" class="analysis_category_groups_classification_checkbox" type="checkbox" data-value="' + classification + '">';

                            classification_html += '<div style="display: inline-block; color:#FFFFFF; background-color: #dc6e00; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 0px; text-transform: uppercase; padding: 2px; vertical-align: middle;">';
                            classification_html += '<i class="fa fa-star" aria-hidden="true"></i> ' + 'CLASSIFICATION'
                            classification_html += '</div>';

                            // This is the category label div element
                            classification_html += '<div style="display: inline-block; color:#FFFFFF; background-color: #008756; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 0px; text-transform: uppercase; padding: 2px; vertical-align: middle;">';
                            classification_html += '<b>' + classification.toLocaleUpperCase() + '</b>';
                            classification_html += '</div>';

                            // This is the sub_classifications_container in case there are sub classifications
                            classification_html += '<div style="margin-left: 20px;" class="sub_classifications_container"></div>';

                            // This is the property container which will hold the parent which was removed before
                            classification_html += '<div class="properties_container"></div>';

                            classification_container.html(classification_html);

                            
                            // Attempt to order alphabetically
                            console.log('parent_container', parent_container);
                            var classification_elements = parent_container.find('.classification_container');
                            console.log('classification_elements', classification_elements);
                            var el = undefined;
                            for (var i=0; i<classification_elements.size(); i++) {
                              el = $(classification_elements[i]);
                              console.log('el', el);
                              var el_classification = el.attr('data-classification');
                              console.log('el_classification', el_classification);
                              var string_comparison = classification.localeCompare(el_classification);
                              if(string_comparison <= 0) {
                                break;
                              } 
                            }

                            if (el == undefined) {
                              // This will happen when it's the first element in the parent_container
                              parent_container.prepend(classification_container);
                            }
                            else {
                              classification_container.insertBefore($('#' + el.attr('id')));
                            }


                            // parent_container.prepend(classification_container);
                          }
                        }

                        // Check if sub_classification is defined
                        console.log('sub_classification', sub_classification);
                        if (sub_classification != undefined) {
                          // Check if there is already a container for this sub-classification
                          if ($('#' + classification_id + ' .sub_classification_container[data-sub-classification="' + sub_classification + '"]').length) {
                            // already exists, no need to create
                          }
                          else {
                            // does not exist so create the sub-classification
                            var sub_classifications_container = $('#' + classification_id + ' .sub_classifications_container');
                            var sub_classification_html = '';
                            sub_classification_html += '<div class="sub_classification_container" data-sub-classification="' + sub_classification + '">';
                            
                            // This is the L sub marker
                            sub_classification_html += '<div style="display: inline-block; font-size: 20px; position: relative;top: -5px;">˪</div>';

                            // This is the checkbox for the classification grouping
                            sub_classification_html += '<input id="analysis_category_1_groups_27_sub_classification_checkbox" class="analysis_category_groups_sub_classification_checkbox" type="checkbox" data-classification="' + classification + '" data-sub-classification="' + sub_classification + '">';

                            sub_classification_html += '<div style="display: inline-block; color:#FFFFFF; background-color: #dc6e00; border-radius: 2px; font-size: 10px; margin-left: 5px; padding-right: 5px !important; text-transform: uppercase; padding: 2px; vertical-align: middle;">';
                            sub_classification_html += '<i style="margin-left: 3px; margin-right: 3px;" class="fa fa-tag" aria-hidden="true"></i> ';
                            sub_classification_html += 'SUB CLASS ';
                            // sub_classification_html += ' TAG ';
                            sub_classification_html += '</div>';

                            // This is the category label div element
                            sub_classification_html += '<div style="display: inline-block; color:#FFFFFF; background-color: #008756; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 0px; text-transform: uppercase; padding: 2px; vertical-align: middle;">';
                            sub_classification_html += '<b>'  + sub_classification.toLocaleUpperCase() + '</b>';
                            sub_classification_html += '</div>';
                            sub_classification_html += '<div class="properties_container"></div>';
                            sub_classification_html += '</div>';
                            sub_classifications_container.append(sub_classification_html);
                          }
                        }


                        // We cannot assume the classification_container already exists, so get back the
                        // the jquery object reference
                        // if (classification != undefined) {
                        //   var classification_container = $('#' + classification_id);
                        //   classification_container.children('.properties_container').prepend(parent);
                        // }
                        // else {
												//   parent_container.append(parent);
                        // }

                        console.log('classify_data', {
                          'classification': classification,
                          'sub_classification': sub_classification
                        });
                        if (classification != undefined && sub_classification != undefined) {
                          var sub_classification_container = $('#' + classification_id + ' .sub_classification_container[data-sub-classification="' + sub_classification + '"]');
                          console.log('example1', sub_classification_container);
                          sub_classification_container.children('.properties_container').prepend(parent);
                        }
                        else if ((classification != undefined && sub_classification == undefined)) {
                          var classification_container = $('#' + classification_id);
                          console.log('example2', classification_container);
                          classification_container.children('.properties_container').prepend(parent);
                        }
                        else {
                          console.log('example3', parent_container);
												  parent_container.append(parent);
                        }
											}
										}
									}
								}
								else {
									// This might be a layer with a db embeddeded which may contain multiple fields
									// We need to use the WFS system to try to get these fields
									var wfs_bbox = "0,0,256,256";
									var wfs_url = Drupal.settings.cartogratree.gis + "/../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" + layer_name + "&maxFeatures=1&outputFormat=csv&BBOX=" + wfs_bbox;
									console.log('wfs_url', wfs_url);
									$.ajax({
										url: wfs_url,
										method: 'get',
										// contentType: 'application/json',
										success: function(data) {
											checkbox_element.parent().find('img').hide();
											if(data != undefined) {
												// this should be csv
												// console.log('data',data);

													var keys = data.split(',');
													for(var i = 0; i < keys.length; i++) {
														var key_name = keys[i];
														// Create a checkbox element for this key / property
														if (url_field_details_data['layer_embedded_fields_hide'].includes(key_name) == false) {
															
															if(replacements[key_name] != undefined) {
																key_name = replacements[key_name];
															}

															var item_html = "<div style='padding-left: 5px;'><div style='display: inline-block; font-size: 20px; position: relative;top: -5px;'>˪</div><input id='analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id + "_property_" + i + "_checkbox' class='analysis_category_groups_layer_property_checkbox' type='checkbox' data-value='" + key_name + "' /><div style='display: inline-block; color:#FFFFFF; background-color: #0984ec; border-radius: 2px; font-size: 10px; margin-left: 5px; margin-right: 5px; text-transform: uppercase; padding: 2px; vertical-align: middle;'>property</div>" + key_name +  "</div>";
															$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).append(item_html);
													
														}
													}
												
											}
										},
										error: function(err) {
											checkbox_element.parent().find('img').hide();
										}
									})
								}
							}
						}
					});
					


				},
				error: function(data) {
					console.log('Error - usually happens when this is a single band geotiff?');
				}
			});	
		}
		else {
			$("#analysis_category_" + category_id + "_groups_" + group_id + "_layer_" + layer_id).html("");
		}

		if($(this).is(':checked')) {
			// var url_rest = Drupal.settings.cartogratree.gis + '/rest/' + layer_name;
			var bbox = "0,0,256,256";
			var wfs_url = Drupal.settings.cartogratree.gis + "/../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" + layer_name + "&maxFeatures=1&outputFormat=csv&BBOX=" + bbox;
			console.log('wfs_url', wfs_url);
			$.ajax({
				url: wfs_url,
				method: 'get',
				contentType: 'application/json',
				success: function(data) {
					console.log('REST layer query response: ' + data);
				}
			})
		}
		else {
			// not checked
		}
	});

  $(document).on('click', '.properties_select_all', function() {
    // Get each classification container
    var group_container = $(this).parent();
    var classification_containers_checkboxes = group_container.find('.analysis_category_groups_classification_checkbox');
    var data_state = $(this).attr('data-state');
    // If select_all is unchecked (unclicked), check all classification containers
    if (data_state == 'unchecked') {
      // Perform clicks on all classifications
      for (var i=0; i<classification_containers_checkboxes.length; i++) {
        var classification_containers_checkbox = $(classification_containers_checkboxes[i]);
        // If already check, reset it by unchecking
        if (classification_containers_checkbox.is(':checked') == true) {
          classification_containers_checkbox.click(); // uncheck it first
        }
        // Then forcing back a check
        classification_containers_checkbox.click();
      }
      $(this).css('background-color','#d9534f');
      $(this).find('.icon').html('<i class="fa fa-times-circle" aria-hidden="true"></i>');
      $(this).find('.text').html('Unselect all');
      $(this).attr('data-state', 'checked');
    }
    // If select_all was already checked (clicked), unclear
    else {
      for (var i=0; i<classification_containers_checkboxes.length; i++) {
        var classification_containers_checkbox = $(classification_containers_checkboxes[i]);
        // If uncheck, reset it by checking
        if (classification_containers_checkbox.is(':checked') == false) {
          classification_containers_checkbox.click(); // uncheck it first
        }
        // Then forcing back a click to uncheck
        classification_containers_checkbox.click(); 
      }
      $(this).css('background-color','#007bff');
      $(this).find('.icon').html('<i class="fa fa-check-square" aria-hidden="true"></i>');
      $(this).find('.text').html('Select all');
      $(this).attr('data-state', 'unchecked');    
    }
  });

  // When a classification is checked
  $(document).on('click', '.analysis_category_groups_classification_checkbox', function() {
    console.log('Classification checkbox clicked');
    // Find sub classification items and select corresponding checkbox
    var classification_element = $(this);
    var classification_container = classification_element.parent();
    console.log('checkbox is checked:', classification_element.is(':checked'));
    if (classification_element.is(':checked') == true) {
      // find all property elements within the classification only
      var classification_container_id = classification_container.attr('id');
      var property_checkboxes_under_classification_only = $('#' + classification_container_id + ' > ' + '.properties_container' + ' > .property_container .analysis_category_groups_layer_property_checkbox');
      console.log(property_checkboxes_under_classification_only);
      for (var i=0; i<property_checkboxes_under_classification_only.length; i++) {
        var property_checkbox = $(property_checkboxes_under_classification_only[i]);
        if (property_checkbox.is(':checked') == false) {
          property_checkbox.click();
        }
      }

      // find all sub_classification elements
      var sub_class_checkboxes = classification_container.find('.sub_classification_container .analysis_category_groups_sub_classification_checkbox');
      for (var i=0; i<sub_class_checkboxes.length; i++) {
        var sub_class_checkbox = $(sub_class_checkboxes[i]);
        if (sub_class_checkbox.is(':checked') == false) {
          sub_class_checkbox.click();
        }
      }
    }
    else {
      // find all property elements within the classification only
      var classification_container_id = classification_container.attr('id');
      var property_checkboxes_under_classification_only = $('#' + classification_container_id + ' > ' + '.properties_container' + ' > .property_container .analysis_category_groups_layer_property_checkbox');
      console.log(property_checkboxes_under_classification_only);
      for (var i=0; i<property_checkboxes_under_classification_only.length; i++) {
        var property_checkbox = $(property_checkboxes_under_classification_only[i]);
        if (property_checkbox.is(':checked') == true) {
          property_checkbox.click();
        }
      }

      // find all sub_classification elements
      var sub_class_checkboxes = classification_container.find('.sub_classification_container .analysis_category_groups_sub_classification_checkbox');
      for (var i=0; i<sub_class_checkboxes.length; i++) {
        var sub_class_checkbox = $(sub_class_checkboxes[i]);
        if (sub_class_checkbox.is(':checked') == true) {
            sub_class_checkbox.click();
        }
      }      
    }

  });
  
  // When sub-class checkbox is clicked
  $(document).on('click', '.analysis_category_groups_sub_classification_checkbox', function() {
    console.log('Classification checkbox clicked');
    // Find sub classification items and select corresponding checkbox
    var sub_classification_element = $(this);
    var sub_classification_container = sub_classification_element.parent();
    console.log('checkbox is checked:', sub_classification_element.is(':checked'));
    if (sub_classification_element.is(':checked') == true) {
      // find all property elements within the classification only
      var sub_classification_container_id = sub_classification_container.attr('id');
      var property_checkboxes_under_sub_classification_only = sub_classification_container.find('.properties_container' + ' > .property_container .analysis_category_groups_layer_property_checkbox');
      console.log(property_checkboxes_under_sub_classification_only);
      for (var i=0; i<property_checkboxes_under_sub_classification_only.length; i++) {
        var property_checkbox = $(property_checkboxes_under_sub_classification_only[i]);
        if (property_checkbox.is(':checked') == false) {
          if (property_checkbox.is(':visible') == true) {
            property_checkbox.click();
          }
        }
      }
    }
    else {
      // find all property elements within the classification only
      var sub_classification_container_id = sub_classification_container.attr('id');
      var property_checkboxes_under_sub_classification_only = sub_classification_container.find('.properties_container' + ' > .property_container .analysis_category_groups_layer_property_checkbox');
      console.log(property_checkboxes_under_sub_classification_only);
      for (var i=0; i<property_checkboxes_under_sub_classification_only.length; i++) {
        var property_checkbox = $(property_checkboxes_under_sub_classification_only[i]);
        if (property_checkbox.is(':checked') == true) {
        	property_checkbox.click();    
        }
      }      
    } 
  });

  $(document).on('click', '.properties_search_clear', function() {
    $(this).parent().find('.properties_search_box').val('').keyup();
  });

  // Layer search box for Environmental layers list
  $(document).on('keyup', '#analysis-retrieve-envdata-section-layers-list .properties_search_box', function() {
    // console.log('properties search box change detected');
    var search_element = $(this);
	  var matches_count = 0;
    var value = search_element.val();
    if (value != undefined) {
      value = value.toLowerCase();
    }
    // console.log('value', value);

    // Only search if the text in the textbox is more than or equal to 3 characters long
    if (value.length >= 0) {
      // Find the parent group container by parent() which goes to the search container
      // then another parent() which is the overall group container element
      var group_container_element = search_element.parent().parent();
      // console.log('group_container_element', group_container_element);
      
      // Find all properties containers that are nested children of the group_container
      // This is because these properties containers can be in classifcation or sub-classification containers
      var properties_containers = group_container_element.find('.properties_container');
      // console.log('properties_containers', properties_containers);


      for (var i=0; i<properties_containers.length; i++) {
        var properties_container = $(properties_containers[i]);
        properties_container.show();
        var properties = properties_container.children();

        // Keep track of all hidden properties and shown properties
        // for this specific properties container (CLASSIFICATIONS and SUB-CLASSIFICATIONS)
        var hidden_properties = 0;
        var shown_properties = 0;
        for (var j=0; j<properties.length; j++) {
          
          var property_container = $(properties[j]);
          console.log('property_container', property_container);
          var checkbox_element = property_container.find('.analysis_category_groups_layer_property_checkbox');
          var property_value = checkbox_element.attr('data-value');
          if  (property_value != undefined) {
            property_value = property_value.toLowerCase();
          }
          console.log('property_value', property_value);
          if (property_value.includes(value)) {
            property_container.fadeIn(300).show();
            shown_properties = shown_properties + 1;
            matches_count = matches_count + 1;
            search_element.parent().find('.results_summary_search_box').html(matches_count + ' matches found.')
            .css('font-style', 'italic')
            .css('font-size', '10px');
            
          }
          else {
            hidden_properties = hidden_properties + 1;
            property_container.fadeOut(300).hide();
          }



          // Hide the properties container PARENT since no properties are viewable
          console.log('hidden_properties', hidden_properties);
          console.log('properties.length', properties.length);
          if (hidden_properties == properties.length) {
            // Check if this was from a sub classification
            if (properties_container.parent().hasClass('sub_classification_container')) {
              properties_container.parent().fadeOut(300).hide();
            }
			      // Cater for classifications at the end of the code.
          }
          else {
            if (properties_container.parent().hasClass('sub_classification_container')) {
              properties_container.parent().show();
            }
			      // Cater for classifications at the end of the code
          }
        }
      }

	  
      // After all changes, check if there are empty classifications, remove those
      var classifications = group_container_element.find('.classification_container');
      for (var i=0; i<classifications.length; i++) {
        var classification = $(classifications[i]);
		    // Default is to show the classification
		    classification.show();

        // get all property_containers
        var property_containers = classification.find('.property_container');
        // Default is all_hidden true, but check if any element is visible it becomes false
        // which is efficient to not go through entire for loop
        var all_hidden = true;
        for (var j=0; j<property_containers.length; j++) {
          var property = $(property_containers[j]);
		      console.log('property', property);
          if ($(property).is(':visible') == true) {
            all_hidden = false;
            break;
          }
        }
		    // If all properties are hidden, hide the classification container
        if (all_hidden == true) {
          classification.hide();
        }
      }

    }
  });

	var analysis_environmental_data_selected_properties = [];
	// This is the on click event for an actual environment PROPERTY found in layer
	$(document).on('click','.analysis_category_groups_layer_property_checkbox', function() {

		console.log('[map_analysis.js]', $(this).is(":checked"));
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
			console.log('[map_analysis.js]', object);
			analysis_environmental_data_selected_properties.push(object);
		}
		else {
			var found_index = analysis_environmental_data_selected_properties.indexOf(object);
			analysis_environmental_data_selected_properties.splice(found_index,1);
		}

		analysis_summary_update();
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


	try {
		$(document).off('click', '#analysis-generateoutput-envdata-section-button');
	}
	catch (error) {}

	// This is version 3
	$(document).on('click', '#analysis-generateoutput-envdata-section-button', function() {
		var tree_list_for_websocket_command = '';

		var selections_studies = get_selections_studies();

		aes_progressbar_description.html("Sending payload to the environmental server...");
		// Create a string containing tree_ids delimited by commas
		for(var i=0; i < analysis_includedTrees.length; i++) {
			aes_progressbar_description.html("Requesting plant " + (i+1) + " of " + analysis_includedTrees.length);
			for (var j=0; j<selections_studies.length; j++) {
				var study_tmp = selections_studies[j];
				if (analysis_includedTrees[i].startsWith(study_tmp + "-")) {
					tree_list_for_websocket_command += analysis_includedTrees[i] + ',';
				}
			}
		}
		if (tree_list_for_websocket_command.endsWith(',')) {
			tree_list_for_websocket_command = tree_list_for_websocket_command.substring(0, tree_list_for_websocket_command.length - 1);
		}
		
		analysis_envdata_csv_data = "";
		analysis_envdata_current_progress_tree_count = -1;
		analysis_envdata_current_progress_tree_total = analysis_includedTrees.length;


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
		aes_progressbar_description.html("Payload sent, awaiting environmental stream response...");
	});

	// This is to retrieve envdata from the dynamic database tables instead
	try {
		$('#analysis-generateoutput-envdata-section-from-db-button').off('click');
	} catch (error) {}
	$('#analysis-generateoutput-envdata-section-from-db-button').click(function() {
		console.log('Checking database for plants with locations');
		console.log('detected_studies', Object.keys(cartograplant.detected_studies))
		// We first need to get all the tree ids
		// console.log(analysis_includedTrees);

		// STEP 1 - Check if SNPs were selected using the analysis_id

		$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(500).html('Looking up plant ids from filters snps... ' + '<img style="height: 16px;" src="' + loading_icon_src + '" />').fadeIn(500);
		$.ajax({
			method: 'POST',
			url: Drupal.settings.base_url + '/cartogratree/api/v2/genotypes/snps_get_tree_ids_by_analysis_id',
			data: {
				analysis_id: cartograplant.current_analysis_id,
				studies: JSON.stringify(Object.keys(cartograplant.detected_studies)),
			},
			success: function(data) {
				console.log('treeids_by_analysis_id', data);
				var rows = JSON.parse(data);
				$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(500).html('Found ' + rows.length + ' plant ids from selected SNPs subsets...' + '<img style="height: 16px;" src="' + loading_icon_src + '" />').fadeIn(500);

				var tree_ids = [];
				for(var i=0; i<rows.length; i++) {
					tree_ids.push(rows[i]['tree_accessions']);
				}
				console.log('tree_ids', tree_ids);
				var selections_studies = get_selections_studies();
				if(tree_ids.length <= 0) {
					tree_ids = [];
					for (var k = 0; k < analysis_includedTrees.length; k++) {
						for (var j = 0; j < selections_studies.length; j++) {
							var study_tmp = selections_studies[j];
							if (analysis_includedTrees[k].startsWith(study_tmp + "-")) {
								tree_ids.push(analysis_includedTrees[k]);
							}
						}
					}
					console.log('Checking currently filtered plants (by study selections) since no snps subset plants were found');
					console.log('Filtered plants that will be used', tree_ids);
					if (tree_ids.length > 0) {
						console.log('Using currently filtered plants (by study selections) since no snps subset plants were found');
						process_retrieve_environmental_data(tree_ids);
					}
					else {
						alert('No plant_ids were deteted from studies and no plants were selected from the map. Please ensure that you choose an option from the Filter by Genotypes tab if you selected a study.')
					}
				}
				else {
					process_retrieve_environmental_data(tree_ids);
				}
			},
			error: function(data) {
				alert('An error occurred retrieving environmental data, please ensure you selected SNPs in the Filter by Genotypes and try again. If this does not work, please contact us!');
				console.log(data);
				console.log('treeids_by_analysis_id error occurred');
			}

		});

		function process_retrieve_environmental_data(tree_ids) {
			var treeids_locations = [];
			var treeids_locations_completed = false;

			// STEP 1 - get all tree_id and locations
			$.ajax({
				url: Drupal.settings.base_url + '/cartogratree/api/v2/environmental/get_locations_from_treeids',
				method: 'POST',
				data: {
					tree_ids: JSON.stringify(tree_ids)
				},
				success: function(data) {
					// console.log('get_locations_from_treeids', data);
					for(var i=0; i<data.length; i++) {
						treeids_locations.push(data[i]);
					}
					treeids_locations_completed = true;
					console.log('treeids_locations', treeids_locations);
				},
				error: function(err) {
					treeids_locations_completed = true;
				}
			});

			// STEP 2 - get unique locations
			// We need to send these tree ids to the CT API to get the distinct locations (lat lon vals);
			$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(500).html('Looking up locations for ' + analysis_includedTrees.length + ' plant ids...' + '<img style="height: 16px;" src="' + loading_icon_src + '" />').fadeIn(500);
			$.ajax({
				url: Drupal.settings.base_url + '/cartogratree/api/v2/environmental/get_unique_locations_from_treeids',
				method: 'POST',
				data: {
					tree_ids: JSON.stringify(tree_ids)
				},
				success: function(data) {
					console.log('get_unique_loctions_from_treeids', data); // this is the distinct rows of lat lon values

					// Translate the rows to location objects
					var locations = [];
					for(var i=0; i<data.length; i++) {
						console.log('data[i][row]', data[i]['row']);
						// This code using the distinct clause from the CT API endpoint
						var row_string = data[i]['row'];
						row_string = row_string.replaceAll('(','');
						row_string = row_string.replaceAll(')','');
						console.log('row_string',row_string);
						var row_string_parts = row_string.split(',');
						var location_object = {
							latitude: row_string_parts[0],
							longitude: row_string_parts[1]
						}
						locations.push(location_object);
						
						// BACKUP CODE IN CASE: This is the new version which returns the tree_id (this is slower but needed)
						// var location_object = {
						// 	latitude: data[i]['latitude'],
						// 	longitude: data[i]['longitude']
						// }
						// locations.push(location_object);
					}
					console.log('unique_locations', locations);
					


					$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(2000).html('Found ' + data.length + ' locations from the database!').fadeIn(2000);
					// We need to check which layers were selected from the checkboxes
					// This reuses code from the original generate button which sends to websocket
					// We need to get the selected layer and corresponding data property names
					// var analysis_envdata_array_items = [];


					// analysis_timers['analysis_environmental_data_generate_csv_output']
					// This timer would listen and wait until all data has been pulled
					var analysis_environmental_data_count_per_data_batch = 0;
					var analysis_environmental_data_results = [];
					analysis_timers['analysis_environmental_data_generate_csv_output'] = setInterval(function() {
						if(analysis_environmental_data_count_per_data_batch >= analysis_environmental_data_selected_properties.length && treeids_locations_completed == true) {
							// stop the interval check
							clearInterval(analysis_timers['analysis_environmental_data_generate_csv_output']);
							// generate CSV
							// var csv_data_full = '';
							// var csv_data_full_header = 'latitude,longitude,';
							var locations_indexes_with_env_data = {};
							var property_names = []; // holds the names of the properties by index 0, 1 etc
							var csv_data = '';
							var csv_data_header = '';
							var dataset_rows_length = -1;
							// Generate the header first
							for(var i=0; i<analysis_environmental_data_results.length; i++) {
								
								var dataset = analysis_environmental_data_results[i];
								property_names.push(dataset['property_name']);
								if(i > 0) {
									csv_data_header += ',' + dataset['property_name'];
									// csv_data_full_header += ',' + dataset['property_name'];
								}
								else {
									csv_data_header += dataset['property_name'];
									// csv_data_full_header += dataset['property_name'];
									dataset_rows_length = dataset['rows'].length;
								}
							}
							csv_data_header += "\n";

							// Go through each dataset rows length
							for(var i=0; i<dataset_rows_length;i++) {
								// go through each datasets
								for(var j=0; j < analysis_environmental_data_results.length; j++) {

									// dataset = analysis_environmental_data_results[j];
									dataset = analysis_environmental_data_results[j]['rows'][i];
									if(dataset != undefined) {
										var latitude = analysis_environmental_data_results[j]['rows'][i]['latitude'];
										var longitude = analysis_environmental_data_results[j]['rows'][i]['longitude'];
										if(locations_indexes_with_env_data[latitude + ',' + longitude] == undefined) {
											locations_indexes_with_env_data[latitude + ',' + longitude] = {};
										}
										if (locations_indexes_with_env_data[latitude + ',' + longitude][j] == undefined) {
											locations_indexes_with_env_data[latitude + ',' + longitude][j] = analysis_environmental_data_results[j]['rows'][i]['property_value'];
										}
										console.log('row val:', analysis_environmental_data_results[j]['rows'][i]);
										if(j > 0) {
											csv_data += ',' + analysis_environmental_data_results[j]['rows'][i]['property_value'];
											// csv_data_full += ',' + analysis_environmental_data_results[j]['rows'][i]['property_value'];
										}
										else {
											csv_data += analysis_environmental_data_results[j]['rows'][i]['property_value'];
											// csv_data_full += analysis_environmental_data_results[j]['rows'][i]['property_value'];
										}
									}
								}
								csv_data += "\n";
								// csv_data_full += "\n";
							}

							console.log('locations_indexes_with_env_data', locations_indexes_with_env_data);


							csv_data = csv_data_header + csv_data;
							console.log('csv_data', csv_data);


							// Compile the full csv file with the tree_id,lat,lon,propname1,propname2 etc
							var csv_data_full = "tree_id,latitude,longitude";
							// Generate header
							for(var i=0; i<property_names.length; i++) {
								csv_data_full += ',' + property_names[i];
							}
							csv_data_full += "\n";
							// Generate the values
							console.log('treeids_locations.length', treeids_locations.length);
							var tree_id_already_in_csv = {}; // used to remove duplicates
							for(var i=0; i<treeids_locations.length; i++) {
									
								var row = treeids_locations[i];
								console.log('row',row);

								// check if tree_id not already in csv
								if (tree_id_already_in_csv[row['uniquename']] == undefined) {
									if(row != undefined) {
										tree_id_already_in_csv[row['uniquename']] = true; // this tree_id will now be added to the CSV

										csv_data_full += row['uniquename']+','+row['latitude']+','+row['longitude'];

										// Cross reference to the locations_indexes_with_env_data
										var cross_reference = row['latitude']+','+row['longitude'];
										// each dataset
										for(var j=0; j<analysis_environmental_data_results.length;j++) {
											// use the index i
											if(locations_indexes_with_env_data[cross_reference] == undefined) {
												csv_data_full += ',NA';
											}
											else {
												if (locations_indexes_with_env_data[cross_reference][j] == undefined) {
													csv_data_full += ',NA';
												}
												else {
													csv_data_full += ',' + locations_indexes_with_env_data[cross_reference][j];
												}
											}
										}
										csv_data_full += "\n";
									}
								}
							}
							tree_id_already_in_csv = {}; // reset to empty


							
							console.log('csv_data_full', csv_data_full);
							// Push to csv_data_full (all columns) to galaxy history
							// Upload to history / workspace
							var formData = new FormData();
							// formData.append('galaxy_id', cartograplant.galaxy_id);
							// formData.append('workflow_id', workflow_id);
							// formData.append('history_id', cartograplant.history_id);
							// var file_upload_element = document.getElementById(file_id);
							formData.append('raw_data', csv_data_full);
							var env_property_text_list = "";
							for(var i=0; i<property_names.length; i++) {
								if (i == 0) {
									env_property_text_list += property_names[i];
								}
								else {
									env_property_text_list += '-' + property_names[i];
								}
							}
							if (property_names.length > 3) {
								env_property_text_list = 'Numerous Properties';
							}
							formData.append('file_name', 'AN' + cartograplant.current_analysis_id + '_ENVDATA_' + env_property_text_list + '.csv');
							formData.append('workspace_name', $('#nextflow-create-analysis-select-history').val());
							// if(cartograplant.history_id == null) {
							// 	alert('Cannot upload a file without selecting a workspace to store the file, please visit the Begin tab to select or create a workspace');
							// 	return;
							// }
					
							
							// [RISH] 2025/1/2 - Changed the original endpoint for galaxy
							// var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_history";
							// [RISH] 2025/1/2 - New endpoint to work with nextflow workspace
							var url = Drupal.settings.base_url + "/cartogratree_uianalysis/upload_file_raw_data_to_nextflow_workspace";
							$.ajax({
								xhr: function() {
									var xhr = new window.XMLHttpRequest();
								
									xhr.upload.addEventListener("progress", function(evt) {
										if (evt.lengthComputable) {
											var percentComplete = evt.loaded / evt.total;
											percentComplete = parseInt(percentComplete * 100);
											console.log(percentComplete);
											// $('#' + status_container).html('Uploading ... ' + percentComplete + '% completed.');
									
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
									if(data['status'] != undefined) {
										if(data['status'] == true) {
											alert('Environmental data uploaded to workspace!');
											// $('#' + status_container).html('<br /><div style="padding: 5px; border-radius: 3px; background-color: #fffd9c;">Successfully uploaded! Please refresh workflow until it appears in the select list</div>');
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


							// Push csv_data (only values of each property) to the environmental scatter plot API endpoint
							$.ajax({
								url: Drupal.settings.base_url + '/cartogratree/api/v2/environmental/environmental_scatter_plot',
								method: 'POST',
								data: {
									analysis_id: cartograplant.current_analysis_id,
									csv_data: csv_data
								},
								success: function(data) {
									// show picture
									console.log('environmental_scatter_plot', data)
									data = JSON.parse(data);
									if(data['error'] == undefined) { 
										$('#envdata_scatter_plot').html('');
										const blob = b64toBlob(data['data_base64'], 'image/jpeg');

										// const byteCharacters = atob(data['data_base64']);
										// const byteNumbers = new Array(byteCharacters.length);
										// for (let i = 0; i < byteCharacters.length; i++) {
										// 	byteNumbers[i] = byteCharacters.charCodeAt(i);
										// }
										// const byteArray = new Uint8Array(byteNumbers);
										// const blob = new Blob([byteArray], {type: 'image/jpeg'});

										var html = "";
										html += '<img style="width: 100%;" src="' + URL.createObjectURL(blob) + '" />';
										$('#envdata_scatter_plot').html(html);
			
										$('#envdata_scatter_plot img').wrap('<span style="display:inline-block"></span>')
										.css('display', 'block')
										.parent().zoom({magnify:1.5});
									}										
								}
							})
						}
					},1000);

					for(i = 0; i < analysis_environmental_data_selected_properties.length; i++) {
						try {
							var property_object = analysis_environmental_data_selected_properties[i];
							console.log(property_object);
							$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(500).html('Looking up ' + property_object['property_value'] + ' values from database...' + '<img style="height: 16px;" src="' + loading_icon_src + '" />').fadeIn(500);
							$.ajax({
								method: 'POST',
								url: Drupal.settings.base_url + '/cartogratree/api/v2/environmental/get_envdata_from_db_table',
								data: {
									layer_id: property_object['layer_id'],
									property_id: property_object['property_id'],
									property_name: property_object['property_value'],
									locations: JSON.stringify(locations),
								},
								success: function(data) {
									analysis_environmental_data_count_per_data_batch = analysis_environmental_data_count_per_data_batch + 1;
									console.log('get_envdata_from_db_table', data);
									if(data['rows'] != undefined) {
										if(data['rows'].length > 0) {
											analysis_environmental_data_results.push(data);
										}
									}
									
									$('#analysis-generateoutput-envdata-section-from-db-status').fadeOut(500).html('Found ' + data['rows'].length + ' ' + data['property_name'] + ' values.').fadeIn(500);
								},
								error: function(err) {
									analysis_environmental_data_count_per_data_batch = analysis_environmental_data_count_per_data_batch + 1;
								}
							});
						}
						catch (err) {
							analysis_environmental_data_count_per_data_batch = analysis_environmental_data_count_per_data_batch + 1;
						}
						//analysis_envdata_array_items.push(property_object);//0 is assumed to be headers
					}


					// console.log(analysis_envdata_array_items);



				},
				error: function(data) {
					alert('An error occurred. Please ensure you selected at least one option in the Filter by Genotypes tab.');
					console.log('Error received while trying to get locations. Please contact administrator.')
				}
			})				
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
		analysis_envdata_current_progress_properties_total = analysis_includedTrees.length * analysis_environmental_data_selected_properties.length;
		console.log("Analysis Environmental Data Selected Properties");
		console.log(analysis_environmental_data_selected_properties);
		for(var i=0; i < analysis_includedTrees.length; i++) {
			//Create empty arrays (space holders) within the array_items array
			analysis_envdata_array_items.push([]);
		}
		for(var i=0; i < analysis_includedTrees.length; i++) {
			// Query the db for each tree lat and lon
			generate_envdata_for_selected_tree(i);
		}
	});


	function generate_envdata_for_selected_tree(i) {
		$.ajax({
			url:  Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_id=" + analysis_includedTrees[i] + "&cpapi_token=" + Drupal.settings.user.cpapi_token,
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
					value: Math.ceil((analysis_envdata_current_progress_tree_count / analysis_includedTrees.length) * 100),
				});
				analysis_envdata_end_time = Math.round((new Date()).getTime() / 1000);
				aes_progressbar_description.html("Basic metadata for plant " + analysis_envdata_current_progress_tree_count + " of " + analysis_includedTrees.length + " downloaded.");
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
				aes_progressbar2_description.html("Property <i>" + key_name +  "</i> for plant " + analysis_envdata_current_progress_properties_count + " of " + analysis_envdata_current_progress_properties_total + " downloaded.");
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


	try {
		$(document).off('click', '#download_analysis_envdata_csv_data_button');
	} catch (error) {}
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
		var studies_detected = Object.keys(cartograplant.detected_studies);
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

	// From: https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
	const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
		const byteCharacters = atob(b64Data);
		const byteArrays = [];
		
		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);
		
			const byteNumbers = new Array(slice.length);
			for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
			}
		
			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		
		const blob = new Blob(byteArrays, {type: contentType});
		return blob;
	}		

}
$(ct_ready_map_analysis);