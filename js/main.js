"use strict";
var mapState;
//var treeDataStore = {};
var cartograplant = {};
cartograplant['scripts'] = {};
cartograplant['ajax_calls'] = {}; // this contains ajax handles used for control/aborts if necessary
var ct_ready_mainjs = function () {
	console.log(Drupal.settings);
	//query builder set up

	var rulesBasic = {
		condition: "AND",
		rules: [{
			id: "family",
			operator: "equal",
		}, ]
	};
	cartograplant['rulesBasic'] = rulesBasic;

	var filtersList = [];
	cartograplant['filtersList'] = filtersList;

	function buildSelectOption(optionId, optionLabel, optionType, optionOps) {
		return {
			id: optionId,
			label: optionLabel,
			type: optionType,
			input: "select",
			values: {},
			operators: optionOps,
		}
	}
	cartograplant['buildSelectOption'] = buildSelectOption;
	
	function buildAutocompleteOption(optionId, optionLabel, optionType, optionOps) {
		return {
			id: optionId,
			label: optionLabel,
			plugin: 'selectize',
			type: optionType,
			// input: "select",
			// values: {},
			// operators: optionOps,
			
			plugin_config: {
				valueField: 'id',
				labelField: 'name',
				searchField: 'name',
				sortField: 'tgdr_number',
				create: true,
				maxItems: 1,
				plugins: ['remove_button'],
				onInitialize: function() {
					var that = this;
					// console.log('optionOps', optionOps);

					var options = [];
					for(var i=0; i<optionOps.length;i++) {
						console.log(optionOps[i]);
						that.addOption({id: optionOps[i],name:optionOps[i],tgdr_number:parseInt(optionOps[i].substr(4))});
					}
		  
				  
					// $.getJSON('https://querybuilder.js.org/assets/demo-data.json', function(data) {
					// 	console.log(data);
					// 	//localStorage.demoData = JSON.stringify(data);
					// 	data.forEach(function(item) {
					// 		console.log(item);
					// 		that.addOption(item);
					// 	});
					// });

				}
			  },
			  valueSetter: function(rule, value) {
				rule.$el.find('.rule-value-container input')[0].selectize.setValue(value);
			  }
					
		}
	}
	cartograplant['buildAutocompleteOption'] = buildAutocompleteOption;



	function populateOptions(idx, optionsList, replaceLabels = null) {
		var optionObj = cartograplant.filtersList[idx];
		for (var i = 0; i < optionsList.length; i++) {
			if (optionsList[i] != null && optionsList[i].length > 0) {
				if(replaceLabels == null) {
					optionObj["values"][optionsList[i]] = optionsList[i];
				}
				else {
					var replacementLabel = replaceLabels[optionsList[i]];
					console.log('replacementLabel', replacementLabel);
					if(replacementLabel != undefined) {
						optionObj["values"][optionsList[i]] = replacementLabel;
					}
					else {
						optionObj["values"][optionsList[i]] = optionsList[i];
					}
				}
				cartograplant.filtersList[idx] = optionObj;
			}
		}
	}
	cartograplant['populateOptions'] = populateOptions;
	
	function reload_filter_system() {

		cartograplant.filtersList = [
			cartograplant.buildSelectOption("family", "Family", "string", ["equal", "not_equal"]),	 // 0
			cartograplant.buildSelectOption("genus", "Genus", "string", ["equal", "not_equal"]), // 1
			cartograplant.buildSelectOption("species", "Species", "string", ["equal", "not_equal"]), // 2
			// cartograplant.buildSelectOption("marker_type", "Markers", "string", ["equal", "not_equal"]),
			cartograplant.buildSelectOption("markers", "Markers", "string", ["equal", "not_equal"]), // 3
			cartograplant.buildSelectOption("category", "Category", "string", ["equal", "not_equal"]), // 4
			cartograplant.buildSelectOption("structure_name", "Plant Structure", "string", ["equal", "not_equal"]), //5
			// cartograplant.buildSelectOption("phenotype_name", "Phenotype Attribute", "string", ["equal", "not_equal"]), // 6
			cartograplant.buildAutocompleteOption("phenotype_name", "Phenotype Attribute", "string", Drupal.settings.options_data["cvterm"]), // 6
			cartograplant.buildSelectOption("title", "Study Title", "string", ["equal", "not_equal"]), // 7

			cartograplant.buildAutocompleteOption("author", "Study First Author", "string", Drupal.settings.options_tgdr["pub_author"].sort()), // 8
			
			cartograplant.buildAutocompleteOption("accession", "Study Accession", "string", Drupal.settings.options_tgdr["pub_tgdr"]), // 9
			// buildSelectOption("study_accession", "Study Accession", "string", ["equal", "not_equal"]),
		];


		cartograplant.populateOptions(0, Object.keys(Drupal.settings.options_data.organism_data["family"]).sort());
		cartograplant.populateOptions(1, Object.keys(Drupal.settings.options_data.organism_data["genus"]).sort());
		cartograplant.populateOptions(2, Drupal.settings.options_data.organism_data["species"].sort());
		// cartograplant.populateOptions(3, Drupal.settings.options_data.marker_type, {'SSR':'nSSR'});
		cartograplant.populateOptions(3, Drupal.settings.options_data.markers, {'SSR':'nSSR'});
		cartograplant.populateOptions(4, Drupal.settings.options_data.categories);
		cartograplant.populateOptions(5, Drupal.settings.options_data.plant_ontology);
		// cartograplant.populateOptions(6, Drupal.settings.options_data["cvterm"]);
		// populateOptions(5, Drupal.settings.options_data.phenotype);
		cartograplant.populateOptions(7, Drupal.settings.options_tgdr["pub_title"].sort());
		// cartograplant.populateOptions(7, Drupal.settings.options_tgdr["pub_author"].sort());
		// cartograplant.populateOptions(8, Drupal.settings.options_tgdr["pub_tgdr"].sort());

		// $('#builder').html('');

		console.log('filtersList', cartograplant.filtersList);

		// Clean up weird values
		for(var i=0; i<cartograplant.filtersList.length; i++) {
			var filter_list = cartograplant.filtersList[i];
			console.log('filter_list', filter_list);
			var values = filter_list['values'];
			if (
				typeof values === 'object' &&
				!Array.isArray(values) &&
				values !== null
			) {
				// this is an object
				var keys = Object.keys(values);
				for (var j=0; j<keys.length; j++) {
					var val = parseInt(values[keys[j]]);
					console.log(val);
					if(isNaN(val) == false) {

						delete values[keys[j]];
					}
				}
			}
		}

		console.log('rulesBasic', cartograplant.rulesBasic);
		if($('#builder').hasClass('query-builder')) {
			// This means query builder has already been initialized
			console.log('Query Builder destroy');
			$('#builder').queryBuilder('reset');
			$('#builder').queryBuilder('clear');
			$('#builder').queryBuilder('destroy');
			$('#builder').html('');
		}
		else {
			// This means query builder has not been initialized so init it.
		}
		console.log("Query Builder initialize");
		$("#builder").queryBuilder({
			filters: cartograplant.filtersList,
			rules: cartograplant.rulesBasic,
			default_filter: 'family'
		});
		$('#builder').on('afterAddRule.queryBuilder', function() {
			querybuilder_change_delete();
		});
		querybuilder_change_delete();

		console.log('reload filter system executed');
	}
	reload_filter_system();
	cartograplant['reload_filter_system'] = reload_filter_system;

	function querybuilder_change_delete() {
		$('.rule-actions').each(function () {
			$(this).find('button').html('<i class="fa-solid fa-xmark"></i>');
		});
		$('.group-actions').each(function () {
			$(this).find('button[data-delete="group"]').html('<i class="fa-solid fa-xmark"></i>');
		});
	}
	
	$("#body-row .collapse").collapse("hide");
	$("#collapse-icon").addClass("fa-angle-double-left");
	$("#map-options").collapse("show");	
	$("#map-summary").collapse("show");
	$("#dataset-options").collapse("show");

	$("body").tooltip({
		selector: "[data-toggle='tooltip']",
		html: true,
	});

	$(".analysis-form-next").click(function() {
		console.log("go next");
		$(".nav-tabs > li > .active").parent().next("li").find("a").trigger("click");
		//$(".nav-tabs > .active").
	});

	$(".analysis-form-prev").click(function() {
		$(".nav-tabs > li > .active").parent().prev("li").find("a").trigger("click");
	});

	$(document).on("click", ".saved-session", function () {
		$(".saved-session.active").toggleClass("active");
		$(this).toggleClass("active");
	});

	//Change layout based on screen size
	modifyMapContainer();
	function modifyMapContainer() {
		if ($(window).width() <= 700) {
			$("#map-container").removeClass("col");
			$("#map-container").removeClass("py-3");
			$("#body-row").removeClass("row");
		}
		else {
			if (!$("#map-container").hasClass("col")) {
				$("#map-container").removeClass("col");
				$("#map-container").removeClass("py-3");
				$("#body-row").removeClass("row");
			}
		}
	}

	//change layout if screen size changes
	$(window).resize(function () {
		modifyMapContainer();
	});

	$(document).on("click", "#logout-btn", function () {
		if (confirm("Are you sure you want to logout?")) {
			window.open("/user/logout", "_blank");
			location.reload();
		}
	});
	
	$(document).on("click", ".map-state", function () {
		$(".map-state").removeClass("active").removeClass("bg-warning");
		if($(this).hasClass("active")){
			$(this).removeClass("active").removeClass("bg-warning");
		}
		else{
			$(this).addClass("active").addClass("bg-warning");
		}
	});

	$("#regenerate-api-key").on("click", function() {
		$.ajax({
			method: "GET",
			url: Drupal.settings.ct_nodejs_api + "/v2?user_id=" + Drupal.settings.user.user_id + "&new_key=true",
			contentType: "application/json", 
			success: function (data) {
				Drupal.settings.token = data;
				console.log(data);
				$("#api-key-holder").val(data);
				/*
				data = Object.values(data["snps_to_missing_freq"]));
				console.log(data);	
				renderChart(data, true);*/		
			},	
			error: function (xhr, textStatus, errorThrown) {
				console.log({
					textStatus
				});
				console.log({
					errorThrown
				});
				console.log(eval("(" + xhr.responseText + ")"));
			}
		});
	});

	$("#copy-api-key").on("click", function() {
		var copyText = document.getElementById("api-key-holder");
		copyText.select();
  		document.execCommand("copy");
	});

	$("#show-form-btn").on("click", function () {
		$("#save-query-title").val("");
		$("#save-query-comments").val("");
		$("#save-success-message").text("");
		if (!$("#save-success-container").hasClass("hidden")) {
			$("#save-success-container").addClass("hidden");
		}
		if ($("#submit-save-query").hasClass("hidden")) {
			$("#submit-save-query").removeClass("hidden");
		}
		if ($("#save-query-form").hasClass("hidden")) {
			$("#save-query-form").removeClass("hidden");
		}
		$("#save-form").modal("toggle");
	});

	$("#toggle-map-summary").on("click", function () {
		$("#map-summary").toggleClass("hidden");
	});


	$(".btn-toggle").on("click", function() {
		$(this).toggleClass("active");
	});	

	// -- Loading spinner when requesting data using ajax, will stop spinning once all ajax calls are done
	$(document).ajaxStop(function() {
		$(".loading-spinner").addClass("hidden");
		$(".dynamic-data").removeClass("hidden");
	});



}
$(ct_ready_mainjs);


function show_full_image(img) {
	$('#tree-full-picture-img').attr("src",img);
	$('#tree-full-picture').modal();
}

function show_filter_instructions() {
	$('#filter-instructions').modal();
}	
