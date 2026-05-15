var ct_ready_map_jobs = function() {
    var jobs_data_store = {};
	var job_details_timer = null;

	// Start up code for if a job_id has been specificed in the Cartogratree URL
	if(Drupal.settings.job_boot != undefined) {
		console.log('JOB BOOT DETECTED');
		var checkExist = setInterval(function() {
			if ($('#jobs-btn').length) {
			   console.log("Exists!");
			   clearInterval(checkExist); // stop checking
			   var job_boot = Drupal.settings.job_boot;
			   $('#jobs-btn').click(); // open jobs window
			   $('#jobs-details-tab').click();
			   load_job_details(job_boot.galaxy_id, job_boot.history_id, job_boot.workflow_id, job_boot.invocation_id);
	   
			}
		 }, 1000); // check every 1000ms

	}


	$("#jobs-btn").on("click", function () {
		if ($(this).hasClass("disabled")) {
			alert("You must login to view your analysis jobs");
			return;
		}

		// else if (mapState.includedTrees.length <= 0) {
		// 	alert("You have no trees selected for analysis");
		// 	return;
		// }
		

	
		$("#jobs-form").modal();


		jobs_get_nextflow_jobs_list(1);
        // jobs_get_jobs_list(1);
		
	});	

	function jobs_get_nextflow_jobs_list(page_no) {
		var url_user_jobs = Drupal.settings.base_url + "/cartogratree_uijobs/get_nextflow_user_jobs/" + page_no;
		$('#job-analyses-list').fadeOut(200);
		console.log(url_user_jobs);
		$.ajax({
			method: "GET",
			url: url_user_jobs,
			dataType: "json",
			success: function (data) {
				console.log(data);
				nextflow_jobs_generate_table_list(data);
			}
		});
	}

	$(document).off('click', '.button_jobs_show_popstruct_results'); // remove previous click handlers to avoid duplicates
	$(document).on('click', '.button_jobs_show_popstruct_results', function() {
		var td = $(this).closest('td');
		console.log('TD element with popstruct_completion_message data attribute', td);
		var popstruct_completion_message_json = $(this).closest('td').attr('data-completion_message');
		console.log('Encoded popstruct_completion_message_json', popstruct_completion_message_json);
		var popstruct_completion_message = atob(popstruct_completion_message_json);
		console.log('popstruct_completion_message', popstruct_completion_message);

		toastr.clear();
		toastr.info('Loading population structure jobs results into analysis panel...', {timeOut: 2000});

		// Close the jobs modal
		$('#jobs-form').find('button.close').click();


		// Waiting a few seconds and then open the Analysis panel and switch to the population structure tab
		setTimeout(function() {
			$('#analysis-btn').click();
			// Check every 3 seconds if the analysis panel is loaded by checking if the analysis ID element is present, then open the population structure tab
			toastr.clear();
			toastr.info('Automation: Waiting for analysis panel to boot...', {timeOut: 2000});
			var analysis_panel_check_count = 0;
			var interval_check_analysis_panel = setInterval(function() {
				var analysis_summary_analysis_id = $('#analysis_summary_analysis_id').text();
				if (isNaN(analysis_summary_analysis_id)) {
					console.log('Analysis panel is not yet loaded');
				}
				else if (analysis_panel_check_count >= 5) {
					console.log('Analysis panel failed to load in time');
					clearInterval(interval_check_analysis_panel);
					alert('Failed to load analysis panel in time. Please go back to the Jobs section and click "Show results in Analysis Panel" again to retry.');
				}
				else {
					console.log('Analysis panel is loaded');
					clearInterval(interval_check_analysis_panel);
					// Open the population structure tab in the analysis panel
					toastr.clear();
					toastr.info('Automation: Waiting for analysis population structure section to render...', {timeOut: 2000});
					$('#analysis-popstruct-section-tab').click();

					var popstruct_tab_check_count = 0;
					var interval_check_popstruct_tab = setInterval(function() {
						if ($('#nextflow-population-structure-workflow .status_output').length > 0) {
							
							console.log('Population structure tab is loaded');
							clearInterval(interval_check_popstruct_tab);
							// Render the popstruct results into the population structure tab in the analysis panel
							toastr.clear();
							toastr.info('Automation: Rendering population structure results...', {timeOut: 2000});
							cartograplant['analysis_process_popstruct_results'](popstruct_completion_message);
						}
						else if (popstruct_tab_check_count >= 5) {
							console.log('Population structure tab failed to load in time');
							clearInterval(interval_check_popstruct_tab);
							alert('Failed to load population structure tab in time. Please go back to the Jobs section and click "Show results in Analysis Panel" again to retry.');
						}
						popstruct_tab_check_count++;
					}, 3000);
				}
				analysis_panel_check_count++;
			}, 3000);
		}, 2000);

	
	});

	function nextflow_jobs_generate_table_list(data) {
		// To be implemented
		$('#job-analyses-list').html(''); // clear
		$('#job-analyses-list').fadeIn(200);

		jobs_data_store.jobs = [];
		jobs_data_store.jobs = data.analysis;
		var total_jobs_count = data.total_count;
		var page_no = data.page_no;
		var items_limit = data.items_limit;

		// Add pager
		var pager_html = '<style>span[class*=job_list_pager_item_]:hover {background-color: #33b093;} </style>';
		pager_html += '<div style="text-align: center; margin-top: 10px; margin-bottom: 10px; overflow-x: auto;overflow-y: hidden;">';
		var curr_page_no = 0;
		for(var i=0; i<total_jobs_count; i++) {
			if (i % items_limit == 0 && ((items_limit * (curr_page_no + 1)) < total_jobs_count)) {
				curr_page_no =  curr_page_no + 1;
				if(curr_page_no != page_no) {
					pager_html += '<span style="border-radius: 25%; cursor: pointer; padding: 5px; padding-left: 10px; padding-right: 10px; margin-right: 5px; background-color:rgb(225, 255, 248); color: #000000;" class="jobs_list_pager_item_' + curr_page_no +  '">' + curr_page_no + '</span>';
				}
				else {
					pager_html += '<span style="border-radius: 25%; cursor: pointer; padding: 5px; padding-left: 10px; padding-right: 10px; margin-right: 5px; background-color:rgb(225, 255, 248); color: #000000; font-weight: bold;" class="jobs_list_pager_item_' + curr_page_no +  '">' + curr_page_no + '</span>';
				}
			}
		}
		pager_html += '</div>';
		$('#job-analyses-list').append(pager_html);

		var analyses = data.analysis;
		var html = '';
		html += '<table style="width: 100%;">';
		html += '<tr style="border: 1px solid #cccccc; background-color: #f2f2f2; font-weight: bold; ">';
		html += '<td style="padding: 10px; vertical-align: top; width: 200px;">Analysis ID</td>';
		html += '<td style="padding: 10px; vertical-align: top; width: 200px;">Analysis Name</td>';
		html += '<td style="padding: 10px; vertical-align: top;">Popstruct Status</td>';
		html += '<td style="padding: 10px; vertical-align: top;">VCF Merge Status</td>';
		html += '<td style="padding: 10px; vertical-align: top;">GWAS Status</td>';
		html += '</tr>';
		for (var i=0; i<analyses.length; i++) {
			var analysis_row = analyses[i];
			console.log('analysis_row', analysis_row);
			html += '<tr style="border: 1px solid #cccccc; margin-bottom: 10px;">';
			html += '<td style="padding: 10px; vertical-align: top; width: 200px;">';
			html += '<b>' + analysis_row['analysis_id'] + '</b><br />';
			html += '</td>';
			html += '<td style="padding: 10px; vertical-align: top;">';
			html += '<b>' + analysis_row['analysis_name'] + '</b><br />';
			html += '</td>';
			html += '<td style="padding: 10px; vertical-align: top;" data-payload="' + btoa(JSON.stringify(analysis_row['payload'])) + '" data-completion_message="' + btoa(JSON.stringify(analysis_row['popstruct_completion_message'])) + '">';
			if (analysis_row['popstruct_completion_message'] != null) {
				// console.log('Analysis row PopStruct completion message is not null', analysis_row['popstruct_completion_message']);
				// Get PopStruct completion message details
				
				if (analysis_row['popstruct_completion_message']['success'] == 'true') {
					html += 'POPSTRUCT Status: <span style="color:rgb(0, 172, 92)">Completed</span><br />';
					html += 'Time duration: ' + analysis_row['popstruct_completion_message']['duration'] + '<br />';
					// html += 'Go to Analysis section and manage workspace to view output files<br />';
					html += '<button class="btn btn-primary button_jobs_show_popstruct_results">Show results in Analysis Panel</button><br />';
				}
				else if (analysis_row['popstruct_completion_message']['success'] == 'true' && analysis_row['popstruct_completion_message']['errorMessage'] != "null") {
					html += 'POPSTRUCT Status: <span style="color:rgb(219, 2, 2)">Error</span><br />';
					if (analysis_row['popstruct_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['popstruct_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['popstruct_completion_message']['errorMessage'] + '<br />';
				}
				else if (analysis_row['popstruct_completion_message']['success'] == 'false' && analysis_row['popstruct_completion_message']['errorMessage'] != "null") {
					html += 'POPSTRUCT Status: <span style="color:rgb(255, 34, 0)">Failed</span><br />' 
					if (analysis_row['popstruct_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['popstruct_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['popstruct_completion_message']['errorMessage'] + '<br />';
				}
				else {
					// Other cases
					html += 'POPSTRUCT Status: <span style="color:rgb(255, 115, 0)">In progress</span><br />';
					if (analysis_row['popstruct_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['popstruct_completion_message']['duration'] + '<br />';	
					}
				}
				html += '<button class="btn btn-primary button_jobs_show_run_command">Show run command</button><br />';
			}
			else {
				html += 'No POPSTRUCT workflow has been run<br />';
			}
			html += '</td>';
			html += '<td style="padding: 10px; vertical-align: top;" data-payload="' + btoa(JSON.stringify(analysis_row['payload'])) + '" data-completion_message="' + btoa(JSON.stringify(analysis_row['vcfmerge_completion_message'])) + '">';
			if (analysis_row['vcfmerge_completion_message'] != null) {
				// console.log('Analysis row VCF Merge (Variant filtering) completion message is not null', analysis_row['vcfmerge_completion_message']);
				// Get PopStruct completion message details
				if (analysis_row['vcfmerge_completion_message']['success'] == 'true') {
					html += 'VCFMERGE Status: <span style="color:rgb(0, 172, 92)">Completed</span><br />';
					html += 'Time duration: ' + analysis_row['vcfmerge_completion_message']['duration'] + '<br />';
					html += 'Go to Analysis section and manage workspace to view output files<br />';
				}
				else if (analysis_row['vcfmerge_completion_message']['success'] == 'true' && analysis_row['vcfmerge_completion_message']['errorMessage'] != "null") {
					html += 'VCFMERGE Status: <span style="color:rgb(219, 2, 2)">Error</span><br />';
					if (analysis_row['vcfmerge_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['vcfmerge_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['vcfmerge_completion_message']['errorMessage'] + '<br />';
				}
				else if (analysis_row['vcfmerge_completion_message']['success'] == 'false' && analysis_row['vcfmerge_completion_message']['errorMessage'] != "null") {
					html += 'VCFMERGE Status: <span style="color:rgb(255, 34, 0)">Failed</span><br />' 
					if (analysis_row['vcfmerge_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['vcfmerge_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['vcfmerge_completion_message']['errorMessage'] + '<br />';
				}
				else {
					// Other cases
					html += 'VCFMERGE Status: <span style="color:rgb(255, 115, 0)">In progress</span><br />';
					if (analysis_row['vcfmerge_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['vcfmerge_completion_message']['duration'] + '<br />';	
					}
				}
				html += '<button class="btn btn-primary button_jobs_show_run_command">Show run command</button><br />';
			}
			else {
				html += 'No VCFMERGE workflow has been run<br />';
			}
			html += '</td>';
			html += '<td style="padding: 10px; vertical-align: top;" data-payload="' + btoa(JSON.stringify(analysis_row['payload'])) + '" data-completion_message="' + btoa(JSON.stringify(analysis_row['gwas_completion_message'])) + '">';
			if (analysis_row['gwas_completion_message'] != null) {
				// console.log('Analysis row GWAS completion message is not null', analysis_row['gwas_completion_message']);
				// Get GWAS completion message details
				if (analysis_row['gwas_completion_message']['success'] == 'true') {
					html += 'GWAS Status: <span style="color:rgb(0, 172, 92)">Completed</span><br />';
					html += 'Time duration: ' + analysis_row['gwas_completion_message']['duration'] + '<br />';
					html += 'Go to Analysis section and manage workspace to view output files<br />';
				}
				else if (analysis_row['gwas_completion_message']['success'] == 'true' && analysis_row['gwas_completion_message']['errorMessage'] != "null") {
					html += 'GWAS Status: <span style="color:rgb(219, 2, 2)">Error</span><br />';
					if (analysis_row['gwas_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['gwas_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['gwas_completion_message']['errorMessage'] + '<br />';
				}
				else if (analysis_row['gwas_completion_message']['success'] == 'false' && analysis_row['gwas_completion_message']['errorMessage'] != "null") {
					html += 'GWAS Status: <span style="color:rgb(255, 34, 0)">Failed</span><br />' 
					if (analysis_row['gwas_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['gwas_completion_message']['duration'] + '<br />';
					}
					html += analysis_row['gwas_completion_message']['errorMessage'] + '<br />';
				}
				else {
					// Other cases
					html += 'GWAS Status: <span style="color:rgb(255, 115, 0)">In progress</span><br />';
					if (analysis_row['gwas_completion_message']['duration']	!= null) {
						html += 'Time duration: ' + analysis_row['gwas_completion_message']['duration'] + '<br />';	
					}
				}
				html += '<button class="btn btn-primary button_jobs_show_run_command">Show run command</button><br />';
			}
			else {
				html += 'No GWAS workflow has been run<br />';
			}
			html += '</td>';
			html += '</tr>';
			// $('#job-analyses-list').append(div);
		}
		html += '</table>';
		$('#job-analyses-list').append(html);
		$('#job-analyses-list').append(pager_html);
	}

	$(document).off('click', '.button_jobs_show_run_command');
	$(document).on('click', '.button_jobs_show_run_command', function() {
		console.log('Show run command button clicked');
		var completion_message_json_encoded = $(this).closest('td').attr('data-completion_message');
		var completion_message_json = atob(completion_message_json_encoded);
		var completion_message = JSON.parse(completion_message_json);

		var payload_json_encoded = $(this).closest('td').attr('data-payload');
		var payload_json = atob(payload_json_encoded);
		var payload = JSON.parse(payload_json);

		var commandLine = completion_message['commandLine'];
		// Open a custom popup to show the command line with better formatting
		var popup_html = '<div style="padding: 20px;">';
		popup_html += '<h4>Workflow run command</h4>';
		// Wrap the command line in a pre tag to preserve formatting and make it more readable, also add some styling to make it look better
		// and also wrap the command line if it is too long to fit in the popup so that it displays multiline and is scrollable if it exceeds the max height of the popup
		popup_html += '<pre style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;">' + commandLine + '</pre>';
		if (payload != null && payload != undefined && payload != false) {
			popup_html += '<pre style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto;">PAYLOAD.JSON:<br />' + payload + '</pre>';
		}
		popup_html += '</div>';
		// Show the popup as a div that hovers over the job modal, must have a close button and should be styled to be easily readable
		var $popup = $(popup_html).appendTo('body');
		// Do not use the dialog function
		$popup.css({
			'position': 'fixed',
			'top': '50%',
			'left': '50%',
			'transform': 'translate(-50%, -50%)',
			'z-index': 9999,
			'box-shadow': '0 0 10px rgba(0,0,0,0.5)',
			'background-color': '#ffffff',
			'border': '1px solid #cccccc',
			'border-radius': '5px',
			'padding': '20px',
			'max-width': '80%',
			'max-height': '80%',
			'overflow': 'auto'
		});
		// Add a copy to clipboard button
		var $copyButton = $('<button style="position: absolute; top: 10px; right: 80px;" class="btn btn-secondary">Copy</button>').appendTo($popup);
		$copyButton.on('click', function() {
			navigator.clipboard.writeText(commandLine).then(function() {
				toastr.clear();
				toastr.success('Command copied to clipboard', {timeOut: 2000});
			}, function(err) {
				toastr.clear();
				toastr.error('Failed to copy command to clipboard', {timeOut: 2000});
			});
		});
		// Add a close button to the popup next to the clipboard button
		var $closeButton = $('<button style="position: absolute; top: 10px; right: 10px;" class="btn btn-secondary">Close</button>').appendTo($popup);
		// var $closeButton = $('<button style="position: absolute; top: 10px; right: 10px;" class="btn btn-secondary">Close</button>').appendTo($popup);
		$closeButton.on('click', function() {
			$popup.remove();
		});



	});

    function jobs_get_jobs_list(page_no) {
		var url_user_jobs = Drupal.settings.base_url + "/cartogratree_uijobs/get_user_jobs/" + page_no;
		$('#job-analyses-list').fadeOut(200);
        console.log(url_user_jobs);
		// $('#analysis-overlapping-traits-status').html('Status: Finding all traits across all studies ... ');
		$.ajax({
			method: "GET",
			// data: {
			// 	'data': send_data
			// },
			url: url_user_jobs,
			dataType: "json",
			success: function (data) {
				console.log(data);
				jobs_generate_table_list(data);
				
			}
		});	
    }

	function jobs_generate_table_list(data) {
		jobs_data_store.jobs = [];
		jobs_data_store.jobs = data.jobs;
		var total_jobs_count = data.total_count;
		var page_no = data.page_no;
		var items_limit = data.items_limit;
		
		$('#job-analyses-list').html(''); // clear
		var pager_html = '<style>span[class*=job_list_pager_item_]:hover {background-color: #33b093;} </style>';
		pager_html += '<div style="text-align: center; margin-top: 10px; margin-bottom: 10px; ">';
		var curr_page_no = 0;
		for(var i=0; i<total_jobs_count; i++) {
			if (i % 10 == 0 && ((items_limit * (curr_page_no + 1)) < total_jobs_count)) {
				curr_page_no =  curr_page_no + 1;
				if(curr_page_no != page_no) {
					pager_html += '<span style="cursor: pointer; padding: 5px; padding-left: 10px; padding-right: 10px; margin-right: 5px; background-color: #b8f4e6; color: #000000;" class="jobs_list_pager_item_' + curr_page_no +  '">' + curr_page_no + '</span>';
				}
				else {
					pager_html += '<span style="cursor: pointer; padding: 5px; padding-left: 10px; padding-right: 10px; margin-right: 5px; background-color: #b8f4e6; color: #000000; font-weight: bold;" class="jobs_list_pager_item_' + curr_page_no +  '">' + curr_page_no + '</span>';
				}
			}
		}
		pager_html += '</div>';
		$('#job-analyses-list').append(pager_html);
		$('#job-analyses-list').append('<div style="display: flex;"><div style="width: 100%;">Job ID</div><div style="width: 100%;">Status</div><div style="width: 100%;">Workflow</div><div style="width: 100%;">Galaxy ID</div><div style="width: 100%;">Invocation ID</div><div style="width: 100%;">Created</div><div style="width: 100%;">Updated</div></div>');
		for(var i=0; i<data.jobs.length; i++) {
			var results = JSON.parse(data.jobs[i].results);
			console.log(results);
			var submit_args = JSON.parse(data.jobs[i].submit_args);
			console.log(submit_args);
			var div = "";
			div += '<style>.job_list_item:hover {background-color: #b8f4e6; cursor: pointer;} .job_list_item {background-color: #FFFFFF;} </style>';
			div += '<div class="job_list_item" id="jobs_list_item_' + data.jobs[i]['invocation_id'] + '" style="display: flex;">';				
			div += '<div style="width: 100%;">';
			div += data.jobs[i]['id'];
			div += '</div>';						
			div += '<div id="job_state_' + data.jobs[i]['invocation_id'] + '" style="width: 100%;">';
			div += '<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> ' + results['state'];
			div += '</div>';
			div += '<div style="width: 100%;">';
			div += data.jobs[i]['workflow_name'];
			div += '</div>';						
			div += '<div style="width: 100%;">';
			div += data.jobs[i]['galaxy_id'];
			div += '</div>';
			if(data.jobs[i]['invocation_id'] == null || data.jobs[i]['invocation_id'] == undefined) {
				div += '<div style="width: 100%;">';
				div += "-";
				div += '</div>';						
				div += '<div style="width: 100%;">';
				div += "-";
				div += '</div>';
				div += '<div style="width: 100%;">';
				div += "-"
				div += '</div>';
			}	
			else {
				div += '<div style="width: 100%;">';
				div += data.jobs[i]['invocation_id'];
				div += '</div>';						
				div += '<div style="width: 100%;">';
				div += results['create_time'];
				div += '</div>';
				div += '<div style="width: 100%;">';
				div += results['update_time'];
				div += '</div>';
			}			
			div += '</div>';
			$('#job-analyses-list').append(div);
		}
		$('#job-analyses-list').append(pager_html);
		// $('#job-analyses-list').append('<div id="job_analyses_list_dialog">ok</div>');
		$('#job-analyses-list').fadeIn(200);


		// Perform ajax pulls for every job listed to update status live (???)
		for(var i=0; i<data.jobs.length; i++) {
            var results = JSON.parse(data.jobs[i].results);
            var submit_args = JSON.parse(data.jobs[i].submit_args);
			
			var galaxy_id = data.jobs[i]['galaxy_id'];
			var history_id = submit_args['history_id'];
			var workflow_id = submit_args['workflow_id'];
			var invocation_id = data.jobs[i]['invocation_id'];
			var url_io = Drupal.settings.base_url + "/cartogratree_uianalysis/get_invocation_outputs/" + galaxy_id +"/" + history_id + "/" + workflow_id + "/" + invocation_id;
			console.log(url_io);
			$.ajax({
				method: "GET",
				
				// data: {
				//  	'job': data.jobs[i]
				// },
				
				url: url_io,
				dataType: "json",
				success: function (data_io) {
					console.log(data_io);
					var invocation_id = data_io['invocation_id'];
					var completed = true;
					var error = false;
					var paused = false;
					for(var j=0; j<data_io.job_states.length; j++) {
						var tmp_state = data_io.job_states[j];
                        console.log('tmp_state', tmp_state);
						if(tmp_state == "ok" || tmp_state == "error" || tmp_state == "paused" || tmp_state == "discarded" || tmp_state == "deleted") {
							completed = true;
							if(tmp_state == "error") {
								error = true;
							}
							else if(tmp_state == "paused") {
								paused = true;
							}
						}
						else {
							completed = false;
						}
                    }
					
					if (data_io.invocation_state == undefined || data_io.invocation_state == "null") {
						$('#job_state_' + invocation_id).html('Failed to invoke');
					}   					
                    else if(error) {
                        $('#job_state_' + invocation_id).html('Error');
                    }
                    else if(paused) {
                        $('#job_state_' + invocation_id).html('Paused, error');
                    }
                    else if(completed) {
                        $('#job_state_' + invocation_id).html('Completed');
                    }                 
                    else {
						console.log('State:', data_io.invocation_state);
                        $('#job_state_' + invocation_id).html(data_io.invocation_state);
                    }



				}
			});			
		}
        

	}

	// On clicking a job pager item (page no)
	// $(document).on('click', 'span[class*=jobs_list_pager_item_]', function() {
	// 	console.log('Job pager item clicked');
	// 	var className = $(this).attr('class');
	// 	var page_no = className.split('_')[4];
	// 	jobs_get_jobs_list(page_no);
	// });
	$(document).on('click', 'span[class*=jobs_list_pager_item_]', function() {
		console.log('Job pager item clicked');
		var className = $(this).attr('class');
		var page_no = className.split('_')[4];
		jobs_get_nextflow_jobs_list(page_no);
	});

	// On clicking a job 'row' list item
    $(document).on('click', 'div[id*=jobs_list_item_]', function() {
		try {
			clearInterval(job_details_timer);
		}
		catch (err) {
			
		}		
        console.log('clicked');
		var id = $(this).attr('id');
		var id_parts = id.split("_");
		var find_invocation_id = id_parts[3];
		
		var found = false;
		for (var i=0; i < jobs_data_store.jobs.length; i++) {
			var job = jobs_data_store.jobs[i];
            var results = JSON.parse(job.results);
            var submit_args = JSON.parse(job.submit_args);
			var galaxy_id = job['galaxy_id'];
			var history_id = submit_args['history_id'];
			var workflow_id = submit_args['workflow_id'];
			var invocation_id = job['invocation_id'];
			if (invocation_id == find_invocation_id) {
				$('#jobs-details-tab').click();
				found = true;
				load_job_details(galaxy_id, history_id, workflow_id, invocation_id);
				break;
			}
		}
		if(found == false) {
			// alert("No job details can be loaded because it failed requirements to execute the analysis.");
			console.log('Attempting to open job_analysis_list_dialog');
			try {
				alert('No job details can be loaded because it failed requirements to execute the analysis.');
				// $('#job_analyses_list_dialog').modal();
			}
			catch (err) {
				console.log(err);
			}
		}

    });

	function load_job_details(galaxy_id, history_id, workflow_id, invocation_id) {
				
		$('#jobs-details-info').html('');

		$('#jobs-details-info').append('<div id="jobs_details_public_link">Shareable link: ' + Drupal.settings.base_url + '/cartogratree?job_id='+ invocation_id + '</div><hr />');
		$('#jobs-details-info').append('Galaxy ID:'  + galaxy_id);
		$('#jobs-details-info').append(' History ID:'  + history_id);
		$('#jobs-details-info').append(' Workflow ID:'  + workflow_id);
		$('#jobs-details-info').append(' Invocation ID:'  + invocation_id);
		
		$('#jobs-details-info').append('<hr />');
		$('#jobs-details-info').append('<span id="jobs_details_overall_status"></span>');
		$('#jobs_details_overall_status').append('<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" />');
		var url_io = Drupal.settings.base_url + "/cartogratree_uianalysis/get_invocation_outputs/" + galaxy_id +"/" + history_id + "/" + workflow_id + "/" + invocation_id;
		console.log(url_io);
		$.ajax({
			method: "GET",
			
			// data: {
			//  	'job': data.jobs[i]
			// },
			
			url: url_io,
			dataType: "json",
			success: function (data_io) {
				console.log(data_io);

				// Get overall job status
				var invocation_id = data_io['invocation_id'];
				var completed = true;
				var error = false;
				var paused = false;
				for(var j=0; j<data_io.job_states.length; j++) {
					var tmp_state = data_io.job_states[j];
					console.log('tmp_state', tmp_state);
					if(tmp_state == "ok" || tmp_state == "error" || tmp_state == "paused" || tmp_state == "discarded" || tmp_state == "deleted") {
						
						if(tmp_state == "error") {
							error = true;
						}
						else if(tmp_state == "paused") {
							paused = true;
						}
					}
					else {
						completed = false;
					}
				}
				
				var overall_status = '';
				if(error) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span>';
				}
				else if(paused) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused, error</span>';
				}
				else if(completed) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span>';
				}                    
				else {
					overall_status += '<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span>';
					//overall_status += data_io.invocation_state;
				}
				overall_status += '';
				$('#jobs_details_overall_status').html(overall_status);
				$('#jobs-details-info').append('<span id="jobs-details-output-details"></span>')

				if(data_io.output_details.length > 0) {
					$('#jobs-details-output-details').append('<h1>Output details</h1>');
				}
				for(var od_count=0; od_count < data_io.output_details.length; od_count++) {
					var output_details = data_io.output_details[od_count];
					if(output_details.state == "ok") {
						$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
					}
					else if (output_details.state == "paused") {
						$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused, error</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
					}
					else if (output_details.state == "error") {
						$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
					}
					else {
						$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span>'  + output_details.name + '</div>');
					}
				}


				if(completed) {
					clearInterval(job_details_timer);
				}
				else {
					job_details_timer = setInterval(function(galaxy_id, history_id, workflow_id, invocation_id) {
						update_job_details(galaxy_id, history_id, workflow_id, invocation_id);
					}, 7000, galaxy_id, history_id, workflow_id, invocation_id);
				}				
			}
		});				

	}	

	function update_job_details(galaxy_id, history_id, workflow_id, invocation_id) {
				

		var url_io = Drupal.settings.base_url + "/cartogratree_uianalysis/get_invocation_outputs/" + galaxy_id +"/" + history_id + "/" + workflow_id + "/" + invocation_id;
		console.log(url_io);
		$.ajax({
			method: "GET",
			
			// data: {
			//  	'job': data.jobs[i]
			// },
			
			url: url_io,
			dataType: "json",
			success: function (data_io) {
				console.log(data_io);

				// Get overall job status
				var invocation_id = data_io['invocation_id'];
				var completed = true;
				var error = false;
				var paused = false;
				for(var j=0; j<data_io.job_states.length; j++) {
					var tmp_state = data_io.job_states[j];
					console.log('tmp_state', tmp_state);
					if(tmp_state == "ok" || tmp_state == "error" || tmp_state == "paused") {
						
						if(tmp_state == "error") {
							error = true;
						}
						else if(tmp_state == "paused") {
							paused = true;
						}
					}
					else {
						completed = false;
					}
				}
				
				var overall_status = '';
				if(error) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span>';
				}
				else if(paused) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused, error</span>';
				}
				else if(completed) {
					overall_status += '<span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span>';
				}                    
				else {
					overall_status += '<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span>';
					//overall_status += data_io.invocation_state;
				}
				$('#jobs_details_overall_status').html(overall_status);
				//overall_status += '</span>';
				//$('#jobs-details-info').append(overall_status);


				$('#jobs-details-output-details').html('');
				if(data_io.output_details.length > 0) {
					$('#jobs-details-output-details').append('<h1>Output details</h1>');
				}
				for(var od_count=0; od_count < data_io.output_details.length; od_count++) {
					var output_details = data_io.output_details[od_count];
					if(output_details.state == "ok" || output_details.state == "paused" || output_details.state == "error") {
						if(output_details.state == "ok") {
							$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
						}
						else if (output_details.state == "paused") {
							$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused, error</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
						}
						else if (output_details.state == "error") {
							$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span>' + ' <a href="' + output_details.download_url + '">' + output_details.name + '</a></div>');
						}


					}
					else {
						$('#jobs-details-output-details').append('<div style="margin-bottom: 5px;"><img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span> '  + output_details.name + '</div>');
						//$('#jobs-details-output-details').append('<img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> [' + output_details.state + '] <a href="' + output_details.download_url + '">' + output_details.name + '</a><br />');
						// <img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" />
					}
				}


				if(completed) {
					clearInterval(job_details_timer);
				}
				// else {
				// 	job_details_timer = setInterval(function(galaxy_id, history_id, workflow_id, invocation_id) {
				// 		update_job_details(galaxy_id, history_id, workflow_id, invocation_id);
				// 	}, 10000, galaxy_id, history_id, workflow_id, invocation_id);
				// }				
			}
		});				

	}

}
$(ct_ready_map_jobs);