"use strict";
//var mapState;
var analysis_envdata_csv_data = "";
var analysis_envdata_current_progress_tree_count = 0;
var analysis_envdata_current_progress_tree_total = 0;

var generate_snps_to_missing_freq_objects_array = [];
var generate_snps_to_missing_freq_objects_total = 0;
var generate_snps_to_missing_freq_objects_current = 0;

var ct_ready_mapjs = function() {
//$(function () {
	console.log(Drupal.settings);

	/**
	 * CONSTANTS
	 */
	
	const bottomMostLayer = "soils-layer";
	const datasetLayerId = "tree-points";
	cartograplant.datasetLayerId = datasetLayerId;

	const datasetSourceId = "trees";
	cartograplant.datasetSourceId = datasetSourceId;

	const datasetClusterId = "tree-cluster";
	cartograplant.datasetClusterId = datasetClusterId;

	
	const clusterProps = [[0, "#d4942c"], [250,"#3c8048"], [1000, "#046c64"]];
	// const clusterProps = [[0, "#6082b6"], [250,"#738678"], [1000, "#645452"]];
	// const clusterProps = [[0, "#6082b6"], [1000,"#738678"], [2500, "#645452"]];
	cartograplant.clusterProps = clusterProps;

	const defaultTreeImgs = ["https://via.placeholder.com/150/e7e7e7/000000/?text=Image%201", "https://via.placeholder.com/150/e7e7e7/000000/?text=Image%202", "https://via.placeholder.com/150/e7e7e7/000000/?text=Image%203"];	
	const geoserver_tileset_styles = ['point','stack'];

	var loading_icon_src = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/theme/templates/resources_imgs/loader-ring.gif';
	cartograplant['loading_icon_src'] = loading_icon_src;

	// This variable stores unique species per layer
	var unique_species = {};
	cartograplant.unique_species = unique_species;

	// This variable stores trees_count
	var trees_count = {};
	cartograplant.trees_count = trees_count;

	// This variable stores trees_count_cached
	var trees_count_cache = {};
	cartograplant.trees_count_cache = trees_count_cache;

	cartograplant.tree_count_last_filter = 0;

	// This variable has the dataset names and corresponding source_ids
	var datasetKey = {"treegenes": 0, "treesnap": 1, "datadryad": 2, 'wfid': 4, 'bien': 3, 'evome': 5};
	
	var dynamicDatasetLayersKeys = ['wfid'];

	// This variable will get populated by CT ADMIN configuration Datasets
	var datasetGeoserverLayerConfig = {
		"bien_geoserver_tileset":{
			layerName: "ct:bienv4_w_props",
			layerFilterFields: ['family', 'genus', 'species'],
		},
	};


	var debug = true;
	cartograplant.debug = debug;
	var mapActivityStatus = 'idle'; //This holds the current status of the map
	var Querystatus = "";
	var Querystatusinterval;
	var treeImgsStore = {};

	// Currently filtered trees store current selected trees
	cartograplant.currently_filtered_trees = [];
	var currently_filtered_trees = cartograplant.currently_filtered_trees;

	// treeDataStore stores per tree data when clicked (as a cache)
	cartograplant.treeDataStore = [];
	var treeDataStore = cartograplant.treeDataStore;

	// all_tree_ids stores all initially loaded tree_ids
	// used for search for study tree ids to make add all study plants
	// button work
	cartograplant.json_tree_ids = [];
	var json_tree_ids = cartograplant.json_tree_ids;

	var multilayers_layer_progressbar_timer = {};
	cartograplant.current_dataset_data = {
		'type': 'FeatureCollection',
		'features': null
	};

	// This variable attempts to keep track / hold all jQuery ajax calls
	var ajax_requests = {
		'map_filtering': null,
		'environmental_data_lookups': {
			'current_bbox': null,
			'data_lookup_objects': [],
		},
	}; 

	// hold the current mode the mouse pointer is in
	cartograplant.mouse_mode = 'simple_select'; 

	// stores all the drawn polygons within the map
	cartograplant.map_polygons = {}; 

	//This caters for added Geoserver Datasets from CT Admin UI
	var geoserver_tilesets_keys = Object.keys(Drupal.settings.geoserver_datasets);
	for(var i=0; i<geoserver_tilesets_keys.length; i++) {
		var tileset_temp = Drupal.settings.geoserver_datasets[geoserver_tilesets_keys[i]];
		var dataset_name_temp = tileset_temp.geoserver_dataset_name;
		dataset_name_temp = dataset_name_temp.replace(/ /g, '_').toLowerCase();
		datasetKey[dataset_name_temp + '_geoserver_tileset'] = parseInt(tileset_temp.geoserver_dataset_id);
		datasetGeoserverLayerConfig[dataset_name_temp + '_geoserver_tileset'] = {'layerName':tileset_temp.geoserver_dataset_layer_name};
	}
	console.log(datasetKey);
	console.log(datasetGeoserverLayerConfig);


	var treesnapMetaCodes =	{
            "ashSpecies": "Species",
            "seedsBinary": "Seeds",
            "flowersBinary": "Flowers",
            "emeraldAshBorer": "Ash Borer",
            "woollyAdesCoverage": "Woolly Adelgids",
            "chestnutBlightSigns": "Chestnut Blight",
            "acorns": "Acorns",
            "cones": "Cones",
            "heightFirstBranch": "Height of First Branch",
            "oakHealthProblems": "Health Problems",
            "diameterNumeric": "Tree Diameter",
            "crownHealth": "Crown Health",
            "crownClassification": "Crown Classification",
            "otherLabel": "Tree Type",
            "locationCharacteristics": "Habitat",
            "nearbyTrees": "Trees Nearby",
            "nearByHemlock": "Nearby Hemlocks",
            "treated": "Treated",
            "partOfStudy": "Study",
            "heightNumeric": "Tree Height",
            "burrs": "Nuts/burrs",
            "catkins": "Catkins",
            "comment": "Comment",
            "diameterNumeric_confidence": "Diameter Confidence",
            "heightFirstBranch_confidence": "Height of First Branch Confidence",
            "numberRootSprouts": "Number of Root Sprouts",
            "numberRootSprouts_confidence": "Number of Root Sprouts Confidence",
            "heightNumeric_confidence": "Tree Height Confidence",
            "torreyaFungalBlight": "Fungal Blight",
            "conesMaleFemale": "Cones",
            "deerRub": "Deer Rub",
            "madroneDisease": "Disease",
            "crownAssessment": "Tree Crown Assessment",
            "standDiversity": "Stand Diversity"
	};
	var activeDatasets = {0: false, 1: false, 2: false, 4: false, 5: false};
	var dataDatasets = {0: null, 4: null}; // 0 is basically going to store all from the api/trees or filter, 4 is wfid
	
	cartograplant.activeTrees = {};
	var activeTrees = cartograplant.activeTrees;

	var currentSession = Drupal.settings.session.session_id;
	
	cartograplant.filterQuery = {};
	var filterQuery = cartograplant.filterQuery;

	cartograplant.filterMapCache = {};
	var filterMapCache = cartograplant.filterMapCache;

	// All selected trees gets stores in this clickTrees variable
	cartograplant.clickedTrees = [];
	var clickedTrees = cartograplant.clickedTrees;

	var map_unique_species = [];
	var geojson_unique_species = [];

	// Keeps track of the last clicked tree's coordinate key
	var current_coordKey = "";

	var prevSessionFilters = {};

	// This should contains all selected layers on the map by the user
	cartograplant.layersList = null;
	var layersList = cartograplant.layersList;

	
	cartograplant.currMarker = null;
	var currMarker = cartograplant.currMarker;

	var chartProperties = (function() {
		// set the dimensions and margins of the graph
		var margin = {top: 10, right: 30, bottom: 50, left: 40};
		var width = 460 - margin.left - margin.right;
		var height = 400 - margin.top - margin.bottom;

		if(debug) {
			console.log(margin + " w: " + width + " h: " + height);
		}

		function getHeight() {
			return height;
		}

		function getWidth() {
			return width;
		}	

		function getMargin() {
			return margin;
		}

		return {
			//chartSVG: svg,
			chartHeight: height,
			chartWidth: width,
			chartMargin: margin,
		}
	})();


	$('#map-dataset-loading').slideUp(500);
	$('#map-summary-loading').slideUp(500);
	$('#map-opened-layers-container').slideUp(0);
	$('#pop-struct-options-container').slideUp(500);

	/**************************************************
 
	* MAPBOX INITIALIZATION *
 	
	**************************************************/
	mapboxgl.accessToken = Drupal.settings.mapbox_token;
	// properties of map on load 
	var map = new mapboxgl.Map({
		container: "map",
		style: "mapbox://styles/snkb/cjrgce15209bi2spi9f2ddvch",
		center: [-20, 20],
		// center: [-90, 40],
		scrollWheelZoom: true,
		dragPan: true,
		keyboard: true,
		zoom: 1,
		pitch: 0,
		bearing: 0,
		minZoom: 0,
		// maxZoom: 15,
	});
	window.cartograplant.map = map;
	

	// toastr notifications options
	toastr.options = {
		"closeButton": false,
		"debug": false,
		"newestOnTop": true,
		"progressBar": false,	
		"positionClass": "toast-top-right",
		"preventDuplicates": false,
		"onclick": null,
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	}
		
	/**
	 * A class that represents the environmental layers of the map
	 * @class
	*/
	class Layer {
		/**
		 * The constructor for the Layer class
		 * @param {string} layerId - The id of the layer
		 * @param {object} legend - The legend associated with the layer
		 * @param {integer} layerHost - Layers can come from mapbox or geoserver, 0 for geoserver 1 for mapbox
		 * @param {float} opacity - The opacity of the layer, 0-1
		 * @param {boolean} canQuery - Sets whether a layer can be queried for values and has variables
		*/
		constructor(layerId, legend, layerHost, opacity, canQuery) {
			this.id = layerId;
			this.sourceId = layerId;
			this.legend = legend;
			this.queryable = canQuery;
			this.opacity = opacity;
			this.active = false;
			this.host = layerHost;
			this.priority = 0;
			this.sourceLoaded = true;
			if (layerHost == 0) {
				this.sourceLoaded = false;
			}
		}
		
		/**
		 * The layers are ordered on the map, low priority number = higher priority = will be on top of other layers and most visible
		 * When a new layer is added it"s added to the top of the layers stack
		 * @param {integer} newPriority - representing the priority of the current layer relative to other layers 	 
		*/
		updatePriority(newPriority) {
			this.priority = newPriority;
		}

		/**
		 * Updates the opacity slider and its value when opacity changes
		*/	
		updateOpacity() {
			var layerNum = this.id.split("_")[2];
			$("#slider-" + layerNum + "-" + this.host).val(this.opacity*100);
			$("#opacity-value-" + layerNum).text(this.opacity*100 + "%");
		}
	}
	

	

	/**
	 * A class for the geoserver layers extends from the Layer class
	 * @class
	*/	
	class GeoserverLayer extends Layer {
		/**
		 * The constructor for GeoserverLayer class, it calls the parent class to create a Layer object
		 * @param {string} layerId - The id of the layer
		 * @param {object} legend - The legend associated with the layer
		 * @param {float} opacity - The opacity of the layer, 0-1
		 * @param {string} sourceType - What kind of layer is being loaded, can be raster or vector
		 * @param {boolean} queryable - Sets whether a layer can be queried for values and has variables
		*/
		constructor(layerId, legend, opacity, sourceType = "raster", queryable = true) {
			super(layerId, legend, 0, opacity, queryable);
			this.tileSize = 256;
			this.sourceType = sourceType;
			this.filter_sourceid = -1;
			this.layer_styles = 'point_mod';
			this.isFiltered = false;
			this.previouslyActivated = false;
			//Setup a default source
			if(Drupal.settings.layers[this.id] == undefined) {
				if(debug) {
					console.log('-- no layer with id was found in Drupal.settings.layer for this layer. This might be a manually added layer. So you need to use the setSourceMode function to make this right!');
				}				

			}
			else {
				var source = Drupal.settings.cartogratree.gis + "?service=WMS&version=1.1.0&request=GetMap&layers=";
				//source += Drupal.settings.layers[this.id].name + ',' + Drupal.settings.layers[this.id].name + "&styles=g_stacker,point&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				var layer_styles = Drupal.settings.layers[this.id].layer_styles;
				if(layer_styles == null) {
					layer_styles = '';
				}
				source += Drupal.settings.layers[this.id].name + "&styles=" + layer_styles + "&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				//source += Drupal.settings.layers[this.id].name + "&styles=" + layer_styles + "&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:1000000&format=image/png";
				this.source_url = source;
				console.log('source_url:' + source);

				var source_wfs_count = Drupal.settings.cartogratree.gis +"/wfs?request=GetFeature&typeName=" + Drupal.settings.layers[this.id].name + "&version=1.1.0&resultType=hits";
				this.source_url_wfs_count = source_wfs_count;


			}
			this.cql_filter = '';
			this.feature_count = 0;
			//this.leg = new Legend(Drupal.settings.layers[layerId].name);
		}
		
		updateFilterSourceId(sourceid = -1) {
			this.filter_sourceid = sourceid;
		}

		updateFeatureCount() {
			//this.feature_count = 0;
			console.log('updateFeatureCount function called');
			var layerObj = this;
			if(this.source_type == 'geoserver_tileset') {
				if(layerObj.feature_count != undefined) {
					var current_num_trees_count = parseInt($("#num-trees").text()) - layerObj.feature_count;
					$('#num-trees').text(current_num_trees_count);
				}
				var url = this.source_url_wfs_count;
				if(this.cql_filter != '') {
					url = url + '&cql_filter=' + this.cql_filter;
				}
				if(debug) {
					console.log('-- Feature URL:' + url);
				}
				var f_count = 0;//trees_count
				var s_count = 0;//species_count
				var species_list = [];
				var filter_sourceid = this.filter_sourceid;
				var filter = this.cql_filter;
				$.ajax({
					method: "GET",
					url: url,
					dataType: "html",
					success: function (data) {
						if(debug) {
							console.log(data);
						}
						var tmp_data = data;
						if(debug) {
							console.log(tmp_data);
						}
						var tmp_parts = tmp_data.split('numberOfFeatures="');
						var count = 0;
						try {
							count = parseInt(tmp_parts[1].split('"')[0]);
						}
						catch(err) {
							if(debug) {
								console.log(err);
							}
						}
						if(debug) {
							console.log('Count:' + count);
						}
						Querystatus = '';
						f_count = count;
						layerObj.feature_count = f_count;
						//We need to update the UI Tree Count
						var current_num_trees_count = parseInt($("#num-trees").text()) + count;
						console.log('current_num_trees_count:' + current_num_trees_count);
						$('#num-trees').text(current_num_trees_count);
						
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
							f_count = -1;
						}
					}
				}).done(
					function() {
						//This caters for accuracy of tree counts
						if(f_count == 1000000) {
							//When this happens, it's usually because WFS service doesn't count more than 1 million trees (Geoserver bug)
							//So we go for a more manual approach
							var current_num_trees_count = parseInt($("#num-trees").text()) - 1000000;
							$('#num-trees').text(current_num_trees_count);

							var source_url_ctapi_count = "https://treegenesdb.org/cartogratree/api/v2/trees/count?source_id=" + filter_sourceid + "&filter=" + filter;
							this.source_url_ctapi_count = source_url_ctapi_count;
							if(debug) {
								console.log(this.source_url_ctapi_count);						
							}
							$.ajax({
								method: "GET",
								url: source_url_ctapi_count,
								dataType: "json",
								success: function (data) {
									if(debug){
										console.log('Source URL CT API COUNT:');
										console.log(data);
									}
									f_count = data.tree_count;
									var current_num_trees_count = parseInt($("#num-trees").text()) + parseInt(data.tree_count);
									$('#num-trees').text(current_num_trees_count);									
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
								layerObj.feature_count = f_count;
								
							});


						}
						


						//This caters for accuracy of species count
						var source_url_ctapi_species_count = "https://treegenesdb.org/cartogratree/api/v2/species/count?source_id=" + filter_sourceid + "&filter=" + filter;
						this.source_url_ctapi_species_count = source_url_ctapi_species_count;
						if(debug) {
							console.log(this.source_url_ctapi_species_count);						
						}
						$.ajax({
							method: "GET",
							url: source_url_ctapi_species_count,
							dataType: "json",
							success: function (data) {
								if(debug) {
									console.log('Source URL CT API SPECIES COUNT:');
								}
								//console.log(data);
								species_list = data;

								s_count = data.length;//this is array length
								//f_count = data.tree_count;
								//var current_num_trees_count = parseInt($("#num-trees").text()) + parseInt(data.tree_count);
								//$('#num-trees').text(current_num_trees_count);									
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
							//console.log(layerObj);
							/*
							var species_count = 0;
							if(layerObj.species_count != undefined) {
								species_count = parseInt($('#num-species').text()) - parseInt(layerObj.species_count);
							}
							else {
								species_count = parseInt($('#num-species').text());
							}
							console.log('-- Species count:' + species_count);
							*/

							cartograplant.unique_species[filter_sourceid] = species_list;
							console.log('unique species object', cartograplant.unique_species);

							if(debug) {
								console.log('-- Species list:');
								console.log(species_list);
							}
							//Update map_unique_species
							for(var index=0; index<species_list.length; index++) {
								if(map_unique_species.includes(species_list[index])) {
									//already exists
								}
								else {
									map_unique_species.push(species_list[index]);
								}
							}

							layerObj.species_count = species_list.length;
							layerObj.species_list = species_list;
	
							/*
							species_count = species_count + layerObj.species_count;
							console.log('-- species_count: ' + species_count);
							*/

							if(debug) {
								console.log('map_unique_species length:');
								console.log(map_unique_species.length);
								console.log(map_unique_species);
							}
							$('#num-species').text(map_unique_species.length);
							
						});			


					}
				);	

			}
		}

		setSourceMode(source_mode = 'geoserver_tileset') {
			this.source_type = source_mode;

			if(this.source_type == 'geoserver_tileset') {
				if(debug) {
					console.log('GeoserverLayer extends Layer: getSource() function executed')
					console.log('-- All layers in Drupal.settings.layers:');
					console.log(Drupal.settings.layers);
					console.log('-- source_type set to manual. Manual mode allows us to alter the WMS url');
				}
				var source = Drupal.settings.cartogratree.gis + "?service=WMS&version=1.1.0&request=GetMap&layers=";
				//source += this.layer_name + ',' + this.layer_name + "&styles=g_stacker,point&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				source += this.layer_name + "&styles=" + this.layer_styles + "&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				this.source_url = source;
				if(debug) {
					console.log('-- source: ' + source);
					console.log('-- source length: ' + source.length);
				}

				var source_wfs_count = Drupal.settings.cartogratree.gis + "/wfs?request=GetFeature&typeName=" + this.layer_name + "&version=1.1.0&resultType=hits";
				this.source_url_wfs_count = source_wfs_count;
				if(debug) {
					console.log('-- source wfs count: ' + source_wfs_count);
				}	
										
				//return source;				
			}
			else {
				//console.log(this.id);
				//console.log(Drupal.settings.layers[this.id]);
				//console.log(Drupal.settings.layers);
				var source = Drupal.settings.cartogratree.gis + "?service=WMS&version=1.1.0&request=GetMap&layers=";
				source += Drupal.settings.layers[this.id].name + "&styles=" + this.layer_styles + "&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				this.source_url = source;
				if(debug) {
					console.log('-- source: ' + source);
					console.log('-- source length: ' + source.length);
				}
				//return source;
			}
			if(this.layer_name == "" || this.layer_name == undefined) {
				if(debug) {
					console.log("-- Fatal warning: layer name was not set, you need to make sure to setLayerName() before running this function for it to work!");
				}
			}							
		}
		
		setCQLFilter(filter = '') {
			
			if(filter != '') {
				this.cql_filter = filter;
				
			}
			else {
				this.cql_filter = '';
			}
		}

		setLayerName(layer_name = '') { //you must do this if you set Source Mode to manual
			this.layer_name = layer_name;
		}
	
		setDatasetId(dataset_id = '') {
			this.dataset_id = dataset_id;
		}

		/**
		 * Get the source url for geoserver layer 
		 * @return {string} source - The source of the geoserver layer 
		*/	
		getSource() {
			/*
			if(this.source_type == 'geoserver_tileset') {
				if(debug) {
					console.log('GeoserverLayer extends Layer: getSource() function executed')
					console.log('-- All layers in Drupal.settings.layers:');
					console.log(Drupal.settings.layers);
					console.log('-- source_type set to manual. Manual mode allows us to alter the WMS url');
				}
				var source = Drupal.settings.cartogratree.gis + "?service=WMS&version=1.1.0&request=GetMap&layers=";
				source += this.layer_name + ',' + this.layer_name + "&styles=g_stacker,point&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				this.source_url = source;
				if(debug) {
					console.log('-- source: ' + source);
				}
				return source;				
			}
			else {
				//console.log(this.id);
				//console.log(Drupal.settings.layers[this.id]);
				//console.log(Drupal.settings.layers);
				var source = Drupal.settings.cartogratree.gis + "?service=WMS&version=1.1.0&request=GetMap&layers=";
				source += Drupal.settings.layers[this.id].name + ',' + Drupal.settings.layers[this.id].name + "&styles=g_stacker,point&transparent=true&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png";
				this.source_url = source;
				if(debug) {
					console.log('-- source: ' + source);
				}
				return source;
			}
			*/
			if(this.cql_filter == '') {
				if(debug) {
					console.log(this.source_url);
				}
				return this.source_url;
			}
			else {
				if(debug) {
					console.log(this.source_url + '&cql_filter=' + this.cql_filter);
				}
				return this.source_url + '&cql_filter=' + this.cql_filter;
			}
			//return this.source_url;
		}

		/**
		 * Adds the geoserver layer to the map and places it below the datasets
		*/	
		addLayer() {
			map.addLayer({
				"id": this.id,
				"type": this.sourceType,
				"source": this.sourceId,
				"paint": {
					"raster-opacity": this.opacity
				}
			}, bottomMostLayer);
		}



		/**
		 * Activates a geoserver layer, so it can be viewed and interacted by the user, it does this by updating the opacity and making it visible
		*/	
		activateLayer(update = false) {
			map.setPaintProperty(this.id, "raster-opacity", this.opacity);
			this.active = true;
			this.updateOpacity();
			
			console.log('Activating layer:');
			console.log('Update mode:' + update);
			console.log(Drupal.settings.layers[this.id]);

			var layer = this;

			/*
			 * Render the legend HTML code / containers unto the page
			 */	
			layer.legend.parentLayer = this;//This must be done - keeps reference to the layer		
			layer.legend.render();


			/*
			 * Update the layer legend HTML dynamically calling the UIAPI
			 * function url. 
			 */
			try {
				console.log(this.id);
				console.log(Drupal.settings.layers[this.id]);
				console.log(Drupal.settings.layers[this.id]['layer_legend_html']);
			}
			catch(err) {
				console.log(err);
			}
			if(Drupal.settings.layers[this.id] != undefined) {
				if(Drupal.settings.layers[this.id]['layer_legend_html'] != undefined) {
					layer.legend.setHTML(Drupal.settings.layers[this.id]['layer_legend_html']);
				}
				else {
					var url_uiapi_get_layer_info = Drupal.settings.base_url + "/cartogratree_uiapi/get_layer_info/" + Drupal.settings.layers[this.id]['layer_id'];
					$.ajax({
						method: "GET",
						url: url_uiapi_get_layer_info,
						dataType: "json",
						success: function (data) {
							console.log(data);
							try {
								if(data['layer_legend_html'] != null && data['layer_legend_html'] != undefined) {
									//Let keep it in memory in the Drupal.settings JS object
									Drupal.settings.layers[layer.id]['layer_legend_html'] = data['layer_legend_html'];
									layer.legend.setHTML(data['layer_legend_html']);
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
			}
			else {
				//this is probably a dataset 
			}

			/*
			try {
				if(Drupal.settings.layers[this.id]['layer_legend_html'] != null && Drupal.settings.layers[this.id]['layer_legend_html'] != undefined) {
					this.legend.setHTML(Drupal.settings.layers[this.id]['layer_legend_html']);
				}
			}
			catch(err) {
				console.log('ERROR:' + err);
			}
			this.legend.parentLayer = this;
			*/
			
			

			if(this.previouslyActivated == false) {
				

				//Show layer color options once update is false
				try {
					if(Drupal.settings.layers[this.id]['layer_allow_user_select_colors'] == 1) {
						this.showLayerColorOptions();
					}
				}
				catch (err) {
					console.log('ERROR:' + err);
				}	
				
				try {
					if(Drupal.settings.layers[this.id]['layer_year_range_filter_option'] == 1) {
						this.showLayerFilterByYearOptions(Drupal.settings.layers[this.id]['layer_year_range_filter_geoserver_parameter'], parseInt(Drupal.settings.layers[this.id]['layer_year_range_filter_year_start']), parseInt(Drupal.settings.layers[this.id]['layer_year_range_filter_year_end']));	
					}		
				}
				catch(err) {
					console.log('ERROR:' + err);
				}				
			}
			else {
				//show the filterbyyear
				/*
				try {
					if(Drupal.settings.layers[this.id]['layer_year_range_filter_option'] == 1) { 
						$('#ct-layer-filterbyyear-instructions-' + Drupal.settings.layers[this.id]['layer_id']).show();
					}
				}
				catch(err) {
					console.log(err);
				}

				try {
					if(Drupal.settings.layers[this.id]['layer_year_range_filter_option'] == 1) { 
						$('#ct-layer-filterbyyear-container-' + Drupal.settings.layers[this.id]['layer_id']).show();
					}
				}
				catch(err) {
					console.log(err);
				}
				*/	
			}


			
			this.previouslyActivated = true;
		}

		/**
		 * Show filter by year options for a layer
		 */
		showLayerFilterByYearOptions(year_filter_embedded_parameter = 'start_yr', year_min = 1980, year_max = 2020) {
			console.log('function showLayerFilterByYearOptions called');
			try {
				$("#ct-layer-filterbyyear-instructions-" + Drupal.settings.layers[this.id]['layer_id']).remove();
			}
			catch(err) {

			}

			try {
				$("#ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id']).remove();
			}
			catch(err) {

			}			
			
			var container_layer_filterbyyear_container = "<div style='padding-bottom: 15px;' id='ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id'] + "'></div>";
			$('#legend_container_' + Drupal.settings.layers[this.id]['layer_id']).append(container_layer_filterbyyear_container);
			
			var container_layer_filterbyyear_rangeslider_title = "<div style='text-align: center; font-size: 12px;' id='ct-layer-filterbyyear-rangeslider-title-" + Drupal.settings.layers[this.id]['layer_id'] + "'>Select years</div>";
			$("#ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id']).append(container_layer_filterbyyear_rangeslider_title);

			var container_layer_filterbyyear_rangeslider = "<div id='ct-layer-filterbyyear-rangeslider-" + Drupal.settings.layers[this.id]['layer_id'] + "'></div>";
			$("#ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id']).append(container_layer_filterbyyear_rangeslider);

			var container_layer_filterbyyear_rangeslider_values = "<div style='text-align: center;' id='ct-layer-filterbyyear-rangeslider-values-" + Drupal.settings.layers[this.id]['layer_id'] + "'>" + year_min + " - " + year_max + "</div>";
			$("#ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id']).append(container_layer_filterbyyear_rangeslider_values);

			var envLayer = this;
			$("#ct-layer-filterbyyear-rangeslider-" + Drupal.settings.layers[envLayer.id]['layer_id']).slider({
				range: true,
				min: year_min,
				max: year_max,
				values: [ year_min, year_max ],
				slide: function( event, ui ) {
					envLayer.isFiltered = true;
					console.log('Slider adjusted');
					console.log(Drupal.settings.layers[envLayer.id]);
					$("#ct-layer-filterbyyear-rangeslider-values-" + Drupal.settings.layers[envLayer.id]['layer_id']).html(ui.values[ 0 ] + " - " + ui.values[ 1 ] );

					try{
						layersList.deactivateLayer(envLayer.id, true);
						map.removeLayer(envLayer.id);
						map.removeSource(envLayer.id);
					
						//Add the layer back
						//var layerObj = new GeoserverLayer(layer, new Legend(dataset_id), 1);	
						//layerObj.setLayerName(datasetGeoserverLayerConfig[dataset_id].layerName);
						//layerObj.setDatasetId(dataset_id);

						//this.setSourceMode('geoserver_tileset');
						var cql_filter = year_filter_embedded_parameter + " >= " + ui.values[0] + " AND " + year_filter_embedded_parameter + " <= " + ui.values[1];
						envLayer.setCQLFilter(cql_filter);	
						//this.updateFilterSourceId(datasetKey[dataset_id]);			
						envLayer.addSource();
						layersList.addToMap(envLayer);
						setTimeout(function() {
							console.log('Activating layer after 2500ms');
							layersList.activateLayer(envLayer.id, true);
						}, 2500);
					}
					catch(err) {
						console.log(err);
					}
				}
			});

		}




		/**
		 * Show color options for selection if the layer has select color options enabled from the CT ADMIN interface
		 */
		showLayerColorOptions() {
			try {
				$("#ct-layer-colorinstructions-" + Drupal.settings.layers[this.id]['layer_id']).remove();
			}
			catch(err) {

			}

			try {
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id']).remove();
			}
			catch(err) {

			}	



			var color_instructions = "<div style='font-size: 12px;' id='ct-layer-colorinstructions-" + Drupal.settings.layers[this.id]['layer_id'] + "'><center>Select color</center></div>";
			$('#legend_container_' + Drupal.settings.layers[this.id]['layer_id']).append(color_instructions);

			var container_layer_color_options = "<div style='text-align: center; padding-bottom: 15px;' id='ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "'></div>";
			$('#legend_container_' + Drupal.settings.layers[this.id]['layer_id']).append(container_layer_color_options);

			for(var i=0; i < Drupal.settings.layers_select_color_styles.length; i++) {
				var color_object = Drupal.settings.layers_select_color_styles[i];
				color_object.title = color_object.title.charAt(0).toUpperCase() + color_object.title.slice(1);
				var color_html = "<div title='" + color_object.title + "' id='ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i + "' data='" + color_object.style +  "'></div>";
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id']).append(color_html);
				var layer_obj = this;
				if(i==0) {
					$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('border','1px solid #000000');
				}
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('display','inline-block');
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('width','15px');
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('height','15px');
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('margin-right','4px');
				//$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('border-radius','100px');
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('background-color',color_object.color);
				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('cursor','pointer');

				/*
				if(layer_obj.layer_styles == color_object.style) {
					$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('border','1px solid #000000');
				}
				else {
					$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i ).css('border','0px solid #000000');
				}
				*/

				$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id'] + "-option-" + i).click(function() {
					//Add a black border to the selected option
					//window.alert($(this).attr("id"));
					//console.log($(this));
					
					//window.alert($(this));
					//Remove borders from all the other options
					/*
					for(var j=0; j < Drupal.settings.layers_select_color_styles.length; j++) {
						if(i==j) {

						}
						else {
							
						}
					}
					*/
					$(this).parent().children().css('border', '0px solid #000000');
					$(this).css('border','1px solid #000000');

					var data_value = $(this).attr('data');
					layer_obj.layer_styles = data_value;
					layer_obj.setSourceMode("range"); //this will reset the source_url by including the style set for the color
					layersList.deactivateLayer(layer_obj.id);
					map.removeLayer(layer_obj.id);
					map.removeSource(layer_obj.id);
					layer_obj.addSource();
					layersList.addToMap(layer_obj);
					layersList.activateLayer(layer_obj.id);
					//window.alert('Clicked data: ' + layer_obj.layer_styles);

					
				})
			}
		}

		/**
		 * Deactivates a geoserver layer and makes it invisible to the user
		*/	
		deactivateLayer(update = false) {
			console.log('deactivateLayer function called:' + this.id);
			map.setPaintProperty(this.id, "raster-opacity", 0);

			if(update == true) {//if update is true, don't remove the legend
				
			}
			else {//if update is false, it was clicked off, so remove the legend
				this.legend.remove();
			}

			this.active = false;

			/*
			if(this.previouslyActivated) {
				try {
					$("#ct-layer-filterbyyear-instructions-" + Drupal.settings.layers[this.id]['layer_id']).hide();
				}
				catch(err) {

				}

				try {
					$("#ct-layer-filterbyyear-container-" + Drupal.settings.layers[this.id]['layer_id']).hide();
				}
				catch(err) {

				}
			}
			*/
			
			/*
			if(update == false) {
				try {
					$("#ct-layer-colorinstructions-" + Drupal.settings.layers[this.id]['layer_id']).remove();
				}
				catch(err) {

				}

				try {
					$("#ct-layer-coloroptions-" + Drupal.settings.layers[this.id]['layer_id']).remove();
				}
				catch(err) {

				}
			}
			*/
			
							
		}

		/**
		 * Adds the source of the geoserver layer to the map
		*/	
		addSource() {
			map.addSource(this.id, {
				"type": this.sourceType,
				"tiles": [this.getSource()],
				"tileSize": this.tileSize
			});
			this.sourceLoaded = true;
		}

		

		/**
		 * Changes the opacity of the geoserver layer	
		 * @param {float} newOpacity - a value from 0 to 1
		*/	
		changeOpacity(newOpacity) {
			if (this.host == 0) {
				map.setPaintProperty(this.id, "raster-opacity", newOpacity);
			}
		}
	}

	/**
	 * A class for the Mapbox layers, extends from general Layer class
	 * @class
	*/	
	class MapboxLayer extends Layer {
		/**
		 * The constructor of the MapboxLayer which creates an instance of the Layer class 
		 * @param {string} layerId - The id of the layer
		 * @param {object} legend - The legend associated with the layer
		 * @param {float} opacity - The opacity of the layer, 0-1
		 * @param {array} subLayers - Environmental layers composited into base map typically composed of multiple parts, will contain an array of strings
		 * @param {boolean} queryable - Sets whether a layer can be queried for values and has variables
		*/
		constructor(layerId, legend, opacity, subLayers, queryable = true) {
			super(layerId, legend, 1, opacity, true);
			this.subLayers = subLayers;
		}

		/**
		 * Adds the mapbox layer and its sublayers to the map by making them visible
		*/	
		addLayer() {
			for(var i = 0; i < this.subLayers.length; i++) {
				map.setLayoutProperty(this.subLayers[i], "visibility", "visible");
			}
		}

		/**
		 * Activates a mapbox layer making it visible to the user and can be interacted with
		 * @param {float} opacity - the current opacity of the layer
		*/	
		activateLayer(opacity = this.opacity) {
			this.changeOpacity(opacity);
			this.updateOpacity();
			this.active = true;
			this.legend.parentLayer = this;
			this.legend.render();
		}

		/**
		 * Deactivates a layer by chaning its opacity to 0 rendering it invisible
		*/	
		deactivateLayer() {	
			this.changeOpacity(0);
			this.legend.remove();
			this.active = false;
		}

		/**
		 * Changes the opacity of the layer and its sublayers
		 * @param {float} newOpacity - the new opacity of the layer
		*/	
		changeOpacity(newOpacity) {
			for (var i = 0; i < this.subLayers.length; i++) {
				var paintInfo = map.getLayer(this.subLayers[i]).paint;
				for (var k in paintInfo._values) {
					if (k.indexOf("opacity") !== -1){
						map.setPaintProperty(this.subLayers[i], k, newOpacity);
					}
				}
			}
		}
	}

	//TODO: Currently this only handles the geoserver layers, also need to handle for the mapbox case
	/**
	 * A class for the legend of an environmental layer
	 * @class
	*/	
	class Legend {
		
		/*
		 * Constructor for Legend class
		 * @param {String} title - title of legend
		*/ 
		constructor(title) {
			if(debug) {
				console.log('Legend class executed.')
				console.log('-- Legend title:' + title);
			}
			
			//this.width = 300;
			//this.height = 80;

			this.width = 210;
			this.height = 80;			
			var layersToColors = {
				"Aridity": [["rgb(255,252,252)", "rgb(248,135,135)", "rgb(244,66,66)"], [34880, 0]],
				"Canopy": [["rgb(208,228,235)", "rgb(171,221,164)", "rgb(255,255,191)", "rgb(215,25,28)"], [24,0]],
				"Precipitation": [["rgb(255,255,217)", "rgb(237,248,177)", "rgb(65,182,196)", "rgb(8,29,88)"],[908,0]],
				"SolRad": [["rgb(255,255,250)", "rgb(255,255,170)"], [18.3,0]],
				"PET": [["rgb(242,255,250)", "rgb(120,248,203)", "rgb(66,244,182)"], [296,0]],
				"Solar radiation": [["rgb(255,246,102)", "rgb(255,240,0)", "rgb(255,0,0)"], [50000,0]],
				"temperature": [["rgb(0,0,255)", "rgb(203,203,51)", "rgb(255,255,0)", "rgb(255,187,0)", "rgb(255,0,0)"], [28,-55]],
				"Tree Cover": [["rgb(255,255,255)", "rgb(154,205,154)", "rgb(0,128,0)"], [100,0]],
				"Water vapor pressure": [["rgb(255,255,255)", "rgb(238,255,255)", "rgb(0,238,255)", "rgb(0,128,255)", "rgb(0,24,255)"], [3.6,0]],
				"Wind speed": [["rgb(204,204,204)", "rgb(153,153,153)","rgb(102,102,102)","rgb(0,0,0)"],[40,0]],
				"Soil": null,
				"Sites": null,	
				"Domain": null,
				"Sampling": null,
			}
			var labels = {
				"Aridity": "Aridity (Index)",
				"Canopy": "Canopy Height",
				"Precipitation": "Precipitation (mm)",
				"Water vapor pressure": "Vapor Pressure (kPA)",
				"temperature": "Temperature (C)",
				"SolRad": "Solar Radiation (kJ m^-2 day^-1)",
				"Solar radiation": "Solar Radiation (kJ m^-2 day^-1)",
				"Wind speed": "Wind Speed (m s^-1)",
				"PET": "PET (mm day^-1) ",
				"Tree Cover": "Tree Cover",
				"Soil": null,
				"Sites": null,
				"Domain": null,
				"Sampling": null,
			}

			//determines range of colors for legend based on title
			this.colors = null;
			if (title != null) {
				for (var layerType in layersToColors) {
					if (title.toLowerCase().indexOf(layerType.toLowerCase()) >= 0) {
						this.colors = layersToColors[layerType];
						this.title = labels[layerType];
						break;		
					}
				}
			}
		}

		/*
		 * Removes the legend
		*/ 	
		remove() {
			//$("#legend").html("");
			//d3.select("svg").remove();

			//Get layer id number
			try {
				var layer_id_number = Drupal.settings.layers[this.parentLayer.id]['layer_id'];

				try { 
					$('#legend_container_' + layer_id_number).slideUp();
				}
				catch(err) {

				}
			}
			catch(err) {
				console.log(err);
			}
			
		}

		/*
		 * set HTML for the legend which can then be rendered using the render()
		*/ 		
		setHTML(html = '') {
			this.html = html;
			var layer_id_number = Drupal.settings.layers[this.parentLayer.id]['layer_id'];
			$("#legend_container_html_" + layer_id_number).html(this.html);
		}

		/*
		 * Renders the legend on the map
		 * Creates a D3js svg object
		*/ 
		render() {
			console.log('Parent Layer for this legend is:' + this.parentLayer.id);

			var layer_id_number = -1;
			var legend_orientation = 'horizontal';


			//Get layer id number
			try {
				layer_id_number = Drupal.settings.layers[this.parentLayer.id]['layer_id'];
				console.log('render() layer_id_number:' + layer_id_number);
			}
			catch(err) {
				console.log(err);
			}

			//Update legend_orientation
			try {
				legend_orientation = Drupal.settings.layers[this.parentLayer.id]['layer_legend_orientation'];
			}
			catch(err) {
				console.log(err);
			}

			console.log(Drupal.settings.layers[this.parentLayer.id]);
			//$("#legend").html("");//clears the container
			/*
			try {
				$('#legend_container_' + layer_id_number).remove();
			}
			catch(err) {
				console.log(err);
			}
			*/
			if($('#legend_container_' + layer_id_number).length) {
				$('#legend_container_' + layer_id_number).slideDown();
			}
			else {
				try {
					console.log('Layer legend hide default:' + Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_legend_hide_default']);
					if(Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_legend_hide_default'] == "0") {

					}

					//Recreate a new container
					var legend_container = '<div style="margin-left: 5px;width: 100%; /* padding-left: 20px;padding-right: 10px; */" id="legend_container_' + layer_id_number + '"></div>';
					//$("#legend").append(legend_container);
					$("#ct-layer-title-" + layer_id_number).parent().parent().append(legend_container);
					
					
					// var legend_container_title = '<div style="font-size: 18px; padding-left: 10px; margin-top: 5px;" id="legend_container_title_' + layer_id_number + '"></div>';
					var legend_container_title = '<div style="font-size: 18px; padding-left: 10px; margin-top: 5px;" id="legend_container_title_' + layer_id_number + '">'
					// legend_container_title += '<i title="Legend details" id="legend_legend_icon_' + layer_id_number + '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 10px;" class="fas fa-chart-bar"></i>'
					legend_container_title += '</div>';

					$("#legend_container_" + layer_id_number).append(legend_container_title);

					// Geoserver Legend
					var legend_container_geoserver_legend = '<div style="text-align: center;" id="legend_container_geoserver_legend_' + layer_id_number + '"><img class="geoserver_legend_img" style="margin-left: 10px;width: 100%;"src="' + Drupal.settings.cartogratree.gis +  '?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=10&HEIGHT=10&LEGEND_OPTIONS=layout:' + legend_orientation + ';fontSize:10;&LAYER=' + Drupal.settings.layers[this.parentLayer.id]['name'] + '" /></div>';
					// Add the geoserver legend to legend_container_html
					$("#legend_container_" + layer_id_number).append(legend_container_geoserver_legend);
					
					if(legend_orientation == 'horizontal') {
						$('#legend_container_geoserver_legend_' + layer_id_number + ' img')
						.wrap('<span style="display:inline-block; width: 80%;"></span>')
						.css('display', 'block')
						.parent()
						.zoom();
					}
					else {
						$('#legend_container_geoserver_legend_' + layer_id_number + ' img')
						.wrap('<span style="display:inline-block;"></span>')
						.css('display', 'block')
						.parent()
						.zoom();					
					}
					
					$('#legend_container_geoserver_legend_' + layer_id_number).toggle(); // hide the legend image

					/*	
					var legend_container_html = '<div style="font-size: 10px; margin-left: 10px;" id="legend_container_html_' + layer_id_number + '"></div>';
					$("#legend_container_" + layer_id_number).append(legend_container_html);
					*/

					$("#legend_container_html_" + layer_id_number).toggle();//default hide

					/*
					$("#legend_info_icon_" + layer_id_number).click(function() {
						$("#legend_container_html_" + layer_id_number).toggle();
					});
					*/

					$("#legend_legend_icon_" + layer_id_number).click(function() {
						$('#legend_container_geoserver_legend_' + layer_id_number).toggle();
					});


					//if (this.colors != null) {
					if (false) {
						var colors = this.colors[0];
						var valRange = this.colors[1];
			


						var legend_container_svg = '<div id="legend_container_svg_' + layer_id_number + '"></div>';
						$("#legend_container_" + layer_id_number).append(legend_container_svg);
						
						var svg_height = this.height / 4;

						var svg = d3.select("#legend_container_svg_" + layer_id_number)
						.append("svg")
						.attr("width", this.width)
						.attr("height", svg_height + 20);

						var grad = svg.append("defs")
						.append("linearGradient")
						.attr("id", "grad")
						.attr("x1", "0%")
						.attr("x2", "100%")
						.attr("y1", "0%")
						.attr("y2", "0%");

						grad.selectAll("stop")
						.data(colors)
						.enter()
						.append("stop")
						.style("stop-color", function(d){ return d; })
						.attr("offset", function(d,i){
							return 100 * (i / (colors.length - 1)) + "%";
						});

						svg.append("rect")
						.attr("x", 10)
						.attr("y", 0)
						.attr("width", this.width - 20)
						.attr("height", svg_height)
						.style("fill", "url(#grad)");

						var y = d3.scaleLinear()
						.range([this.width - 20, 0])
						.domain(valRange);
						
						var yAxis = d3.axisBottom()
						.scale(y)
						.tickValues(valRange);
						
						svg.append("text")
							.attr("x", (this.width / 2))             
							.attr("y", 15)
							.attr("text-anchor", "middle")  
							.style("font-size", "10px") 
							.style("text-decoration", "underline")  
							.text(this.title);
						
						svg.append("g")
						.attr("class", "y axis")
						.attr("transform", "translate(10," + (svg_height) + ")")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", -30)
						.attr("x", 50)
						.attr("dy", "0")
						.attr("dx", "0")
						.attr("fill", "#000")

						//This was the original code where the legend was larger
						/*
						var svg = d3.select("#legend_container_svg_" + this.parentLayer.id)
						.append("svg")
						.attr("width", this.width)
						.attr("height", this.height);

						var grad = svg.append("defs")
						.append("linearGradient")
						.attr("id", "grad")
						.attr("x1", "0%")
						.attr("x2", "100%")
						.attr("y1", "0%")
						.attr("y2", "0%");

						grad.selectAll("stop")
						.data(colors)
						.enter()
						.append("stop")
						.style("stop-color", function(d){ return d; })
						.attr("offset", function(d,i){
							return 100 * (i / (colors.length - 1)) + "%";
						});

						svg.append("rect")
						.attr("x", 50)
						.attr("y", 30)
						.attr("width", 200)
						.attr("height", 30)
						.style("fill", "url(#grad)");

						var y = d3.scaleLinear()
						.range([200, 0])
						.domain(valRange);
						
						var yAxis = d3.axisBottom()
						.scale(y)
						.tickValues(valRange);
						
						svg.append("text")
							.attr("x", (this.width / 2))             
							.attr("y", 15)
							.attr("text-anchor", "middle")  
							.style("font-size", "16px") 
							.style("text-decoration", "underline")  
							.text(this.title);
						
						svg.append("g")
						.attr("class", "y axis")
						.attr("transform", "translate(50,60)")
						.call(yAxis)
						.append("text")
						.attr("transform", "rotate(-90)")
						.attr("y", -30)
						.attr("x", 50)
						.attr("dy", "0")
						.attr("dx", "0")
						.attr("fill", "#000")
						*/


						$("#legend_container_" + layer_id_number).append('<hr style="margin-top:0px; margin-bottom: 0px;" />');	
					}
					else {
		
					}

					if(Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_legend_hide_default'] == "1") {
						$('#legend_legend_icon_' + layer_id_number).hide();
					}					
					
				}
				catch (err) {
					console.log(err);
				}
			}
			//$("#legend").animate({ scrollTop: $('#legend').prop("scrollHeight")}, 1000);
			
			//$('#legend').scrollTop($('#legend')[0].scrollHeight);
			
			//$( "#legend" ).draggable({ containment: "parent" });
		}
	}
	
	/**
	 * A class for the layers list which will keep track of all the layer on the map
	 * @class
	*/	
	class LayersList {
		/**
		 * The constructor for LayersList
		 * @param {hashtable} loadedFromSession - takes as an argument all the layers active from a previous session
		*/	
		constructor(loadedFromSession = {}) {
			this.neon = ["neon-fieldsites", "neon-plots-poly", "neon-plots-circular"];
			
			this.mapboxLayers = {
				"cartogratree_layer_187": ["neon-fieldsites"], 
				"cartogratree_layer_188": ["neon-domains-fill", "neon-domains-text"],
				"cartogratree_layer_189": ["neon-plots-poly", "neon-plots-circular"],
				"cartogratree_layer_4": ["soils-layer", "soils-layer-border"],
			};

			this.excludedLayers = ["cartogratree_layer_40", "cartogratree_layer_25", "cartogratree_layer_26", "cartogratree_layer_27", "cartogratree_layer_28"];	
			this.sessionLoadedLayers = loadedFromSession;
			//contains a key/value pair of layer ids and layer objects associated with each loaded layer
			this.layers = {};
			this.layersStack = [];
		}		

		/**
		 * Gets the layer object based on id specified
		 * @param {string} layerId - the id of the layer
		 * @return {object} or null if the layer has not been added
		*/	
		getLayer(layerId) {
			if (this.layers.hasOwnProperty(layerId)) {
				return this.layers[layerId];
			}
			return null;
		}

		/**
		 * Checks if a layer is active
		 * @param {string} layerId - the id of the layer
		 * @return {boolean} if the layer is added and is active then returns true, false otherwise
		*/	
		isActive(layerId) {
			return this.getLayer(layerId) != null && this.layers[layerId].active == true;
		}

		/**
		 * Adds the layer to the map and to the layers list
		 * @param {object} layer - the layer object to be added
		*/	
		addToMap(layer) {
			if (!layer.sourceLoaded) {
				layer.addSource();
			}
			layer.addLayer();
			this.layers[layer.id] = layer;
		}

		/**
		 * Changes the opacity of the layer
		 * @param {string} layerId - the id of the layer
		 * @param {float} newOpacity - the opacity to be set
		*/	
		changeOpacity(layerId, newOpacity) {
			var layer = this.getLayer(layerId);
			if (this.isActive(layerId)) {
				layer.changeOpacity(newOpacity);
				layer.opacity = newOpacity;
				layer.updateOpacity();
			}
		}

		/**
		 * Activates the layer specified and puts it at the top of the stack
		 * @param {string} layerId - id of the layer
		 * @param {string} update - reactivated a layer and consider it an update which executes update on the actual layer.activateLayer function
		*/	
		activateLayer(layerId, update = false) {
			var layer = this.getLayer(layerId);
			if (!this.isActive(layerId)) {
				layer.activateLayer(update);
				this.layersStack.push(layer.id);
				$("#num-layers").text(this.layersStack.length);
			}	
		}

		/**
		 * deactivates the layer specified and removes it from the stack
		 * @param {string} layerId - id of the layer
		*/	
		deactivateLayer(layerId, update = false) {
			var layer = this.getLayer(layerId);
			if (this.isActive(layerId)) {
				if(update == false) {
					layer.deactivateLayer();
				}
				else {
					layer.deactivateLayer(true);
				}
				this.layersStack.splice(layer.id, 1);
				$("#num-layers").text(this.layersStack.length);
			}	
		}

		/**
		 * gets the active layers on the map
		 * @return {array} activeLayers - an array containing the ids of the active environmental layers
		*/	
		getActiveLayers() {
			var activeLayers = [];	
			for (var layerId in this.layers) {
				if (this.layers[layerId].active) {
					activeLayers.push(layerId);
				}
			}
			return activeLayers;
		}

		/**
		 * Deactivate all layers and update number of layers
		*/ 
		resetLayers() {
			var activeLayers = this.getActiveLayers();
			for (var i = 0; i < activeLayers.length; i++) {
				this.deactivateLayer(activeLayers[i]);
			}
			//$("#num-layers").text(0);
		}

		/**
		 * Get all the layers that will be saved for this current session, layers that have been loaded will be saved
		 * @return {hashtable/js object} layersToSave - Will contain a series of key/value pairs for each layer and its properties
		 * layersToSave = {<layer1_id> : {<opacity>:<opacity_val>, <active>:<true/false>, <host>:<0/1>}, <layer2_id> ... }
		*/	
		getLayersToSave() {
			let layersToSave = {};
			for (var layerId in this.layers) {
				let layerObj = this.layers[layerId];
				layersToSave[layerId] = {
					"opacity": layerObj.opacity, 
					"active": layerObj.active, 
					"host": layerObj.host
				};
			}
			return layersToSave;
		}

		/**
		 * loads all the layers that were loaded from the previous session and deactivates/activates them based on the map state at the time of save
		*/	
		initPreloaded() {			
			for (var layer in this.sessionLoadedLayers) {	
				if (this.sessionLoadedLayers.hasOwnProperty(layer) && this.excludedLayers.indexOf(layer) == -1) {
					let layerObj;
					let host = this.sessionLoadedLayers[layer].host;
					if(debug) {
						console.log('initPreloaded() function');
						console.log(layer);
						console.log(this.sessionLoadedLayers[layer]);
					}
					if (host == 0) { //geoserver hosted layers
						if(layer.includes('geoserver_tileset')) {
							if(debug) {
								//We should probably activate the layer
							}
							/*
							var datasetId = layer;
							layerObj = new GeoserverLayer(layer, new Legend(datasetId), 1);
							layerObj.setLayerName(datasetGeoserverLayerConfig[datasetId].layerName);
							layerObj.setDatasetId(datasetId);
							layerObj.updateFilterSourceId(datasetKey[datasetId]);
							layerObj.setSourceMode('geoserver_tileset');				
							layerObj.addSource();
							*/
							//$("#" + layer + "-data").trigger('click');
						}
						else {
							layerObj = new GeoserverLayer(layer, new Legend(Drupal.settings.layers[layer].title), this.sessionLoadedLayers[layer].opacity);	
							layerObj.addSource();
						}
					}
					else { //mapbox supercomposed layers
						layerObj = new MapboxLayer(layer, new Legend(Drupal.settings.layers[layer].title), this.sessionLoadedLayers[layer].opacity, this.mapboxLayers[layer]);
					}
					if (this.sessionLoadedLayers[layer].active) {
						this.addToMap(layerObj);
						this.activateLayer(layer);
						$("#" + layer + "-" + host).addClass("active"); 						
						$("#" + layer + "-" + host).parent().parent().next().toggleClass("hidden");			
					}
				}
			}
		}
	}

	class MapState {	
		constructor(loadedConfigId) {
			this.loadedConfig = loadedConfigId;
			this.includedTrees = []; 
			
			this.sessionLoaded = true;
			this.popupIdx = 0;
			this.selectedConfig = -1;

			//memoization of the publication and phenotype data requested from the server
			//helps to reduce the number of calls by storing previously requested results
			this.pubData = {};
			this.phenoData = {};
			this.trees = [];
			this.species = [];
		}

		loadactiveTrees(treesArray) {
			if (treesArray != undefined) {
				for (var i = 0; i < treesArray.length; i++) {
					cartograplant.activeTrees[treesArray[i]] = true;
				}
				this.includedTrees = treesArray;
			}
		}

		initMapProperties(zoom, pitch, bearing, center) {
			this.zoom = zoom;
			this.pitch = pitch;
			this.bearing = bearing;
			this.center = center;
		}		
	}

	
	const queryString = window.location.search;
	console.log('Query string from URL:');
	console.log('queryString', queryString);
	const urlParams = new URLSearchParams(queryString);
	//var selectedSession = Drupal.settings.user["sessions"][selectedConfig.attr("href").split("-")[1]];
	/*
	//TODO - Fix on session load from URL
	if(urlParams.get('session_id') != '') {
		
		console.log(selectedSession);
		loadSession(selectedSession, true);
	}
	else {
		loadSession();
	}
	*/

	//loadSession();
	cartograplant.ui_add_pop_struct_toggle = ui_add_pop_struct_toggle;
	function ui_add_pop_struct_toggle(settings) {
		// Test settings (REMOVE THIS AFTER DEBUG)
		// var settings = {
		// 	'caption': 'Default caption',
		// 	'name': 'default_name'
		// }
		var html = '';
		html += '<li class="list-group-item list-group-item-action d-flex">';
		html += '	<div class="row row-100">';
		html += '		<div class="col-7">';
		html += '			<h6 class="text-muted" style="line-height: 20px;">';
		html += '				<div style="display: inline-block; width: 20%;"><i class="fas fa-database" style="position:relative; top:-5px;"></i></div><div style="display: inline-block; width: 70%;">' + settings['caption'] + '</div>';
		html += '			</h6>';
		html += '		</div>';
		html += '		<div class="col-4">';
		html += '			<button type="button" data-toggle="button" class="btn btn-toggle tree-dataset-btn" id="' + settings['name'] + 'popstruct_geojson-data" aria-pressed="true" autocomplete="off">';
		html += '				<div class="handle"></div>';
		html += '			</button>';
		html += '		</div>';
		html += '	</div>';
		html += '</li>';
		
		// Append html to container
		$('#pop-struct-options-toggles').append(html);
	}

	//load the layers and filters added in the previous session
	cartograplant.loadSession = loadSession;
	function loadSession(config = null, reload = false) {
		console.log('loadSession() function called');
		var session = Drupal.settings.session;
		if (config !== null) {
			session = config;
		}
		if(debug) {
			console.log(session);
		}
		if (!reload) {
			mapState = new MapState(0);
			layersList = new LayersList(session.layers);
			cartograplant.layersList = layersList;
			var layers_as_keys = [];
			if(layersList.sessionLoadedLayers != null) {
				layers_as_keys = Object.keys(layersList.sessionLoadedLayers);
			}

			for(var i=0; i < layers_as_keys.length; i++) {
				// console.log(layers_as_keys[i]);
				if(layers_as_keys[i].includes('cartogratree_layer_')) {
					// this is an environmental layer which needs to be toggled on
					// console.log('Session says to toggle this layer on:' + layers_as_keys[i]);
					if(!$('#env-layers-btn').hasClass('active')) {
						$('#env-layers-btn').click();
					}					
					$('[id^=' + layers_as_keys[i]).click();
				}
			}
			console.log(layersList);
		}
		else {
			layersList = new LayersList(session.layers);
			cartograplant.layersList = layersList;
			console.log(layersList);
		}
	
		mapState.loadactiveTrees(session.included_trees);
		resetDatasets();

		mapState.initMapProperties(session.zoom, session.pitch, session.bearing, session.center);
			
		if (session.filters != null) {
			filterQuery = typeof(session.filters["query"]) == "object" ? session.filters["query"] : {};
			if(debug) {
				console.log('session.filters found');
				console.log(session.filters);
			}
			if (session.filters["active_sources"].length > 0) {
				for (var i = 0; i < session.filters["active_sources"].length; i++) {
					toggleDataset(parseInt(session.filters["active_sources"][i]), true);
				}
			}

			else {
				toggleDataset(0, true);
				toggleDataset(1, true);
				toggleDataset(2, true);
			}
			if (Object.keys(filterQuery).length > 0) {
				$("#builder").queryBuilder("setRules", filterQuery);
			}
		}
		else {
			toggleDataset(0, true);
			toggleDataset(1, true);
			toggleDataset(2, true);
		}
		
		if (reload) {
			console.log('-- reload');
			filterMap(true, false);
			positionMap();	
			console.log('-- reload end');

		}
		

		/*
		if (reload) {
			layersList.initPreloaded();
			positionMap();
		}*/
	}
	
	/***************************************************************************************************

 	* Initialize the trees of the map and the methods associated with the trees on load of the webpage *

	***************************************************************************************************/


	/*
	window.onload = function () {
		map.on("load", function () {
			//mapActivityStatus = 'map-loading-finished';
			if(debug) {
				console.log('Session from Drupal settings:');
				console.log(Drupal.settings.session);
				console.log('Perform loadSession function()');
			}

			try {
				map.addSource('mapbox-dem', {
					'type': 'raster-dem',
					'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
					'tileSize': 512,
					'maxzoom': 14
				});
				// add the DEM source as a terrain layer with exaggerated height
				map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
			}
			catch (err) {
				console.log(err);
			}
			

			loadSession();	

			positionMap();
	
			//navigation controls
			map.addControl(new mapboxgl.NavigationControl());
			map.getCanvas().addEventListener("keydown", function(e) { 
				if (e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) {
					$("#arrow-controls").css("opacity", 1);
				}
				$("#arrow-controls").fadeTo("fast", 0.5);
            });

			//load the tree images
			loadImageWrapper(Drupal.settings.tree_img["exact"]["gymnosperm"], "gymnosperm_ex");
			loadImageWrapper(Drupal.settings.tree_img["exact"]["angiosperm"], "angiosperm_ex");
			loadImageWrapper(Drupal.settings.tree_img["approximate"]["gymnosperm"], "gymnosperm_app");
			loadImageWrapper(Drupal.settings.tree_img["approximate"]["angiosperm"], "angiosperm_app");
			loadImageWrapper(Drupal.settings.tree_img["treesnap"]["gymnosperm"], "treesnap_gymno");
			loadImageWrapper(Drupal.settings.tree_img["treesnap"]["angiosperm"], "treesnap_angio");	
			loadImageWrapper(Drupal.settings.tree_img["wfid"]["angiosperm"], "wfid_ex");

			//intialize reusable mapbox popups
			var popupInfo = new mapboxgl.Popup();
			var popupHover = new mapboxgl.Popup({closeButton: false});

			

			//load all the tree datasets from treegenes, dryad, treesnap
			initMapTrees();


			// When a click event occurs on a feature in the trees layer, open a popup at the location of the feature
			// The popup will have a more detailed information about the trees
			var clicked = 0;
			map.on("click", function (e) {
				// check the type of click
				if(cartograplant.mouse_mode == "simple_select") {
					clicked = clicked + 1;
					setTimeout(function(){
						if(clicked > 1){
							//marker.setLatLng(event.latlng);
							//marker.addTo(map); 
							//double click
							if(debug) {
								console.log('This is a DOUBLE click:' + clicked);
							}
							clicked = 0;
						}
						if(clicked == 1) {
							//single click
							//console.log('This is a SINGLE click:' + clicked);
							performSingleClickOnMap(e);
							clicked = 0;
						}
					}, 300);

				}

			});

			cartograplant.performSingleClickOnMap = performSingleClickOnMap;
			function performSingleClickOnMap(e) {
				//create a bounding box around the clicked point, to be used to query for features/trees around the bbox
				var treesBbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				if(debug) {
					console.log(treesBbox);
				}

				//create a bounding box based on the lat/long coordinates of the clicked point, will be used to query for environmental data
				var bbox = (e.lngLat.lat - .1) + "%2C" + (e.lngLat.lng - .1) + "%2C" + (e.lngLat.lat + .1) + "%2C" + (e.lngLat.lng + .1);   

				if (isNeonSite(treesBbox)) {
					return;
				}

				//get all the trees around the bounding box if they exist        
				var treesInSameCoord = map.queryRenderedFeatures(treesBbox, {
					layers: [cartograplant.datasetLayerId]//treeDatasets.getActiveDatasets() 
				});
				if(debug) {
					console.log('treesInSameCoord');
					console.log(treesInSameCoord);
				}
				var cluster = map.queryRenderedFeatures(treesBbox, {
					layers: [cartograplant.datasetClusterId]
				});
				
				//a tree wasn"t clicked, treat as random click event and display coords/env values only
				if (treesInSameCoord.length === 0 && cluster.length === 0) {		
					console.log(layersList);
					var layer_names = Object.keys(layersList.layers);
					for (var i=0; i<layer_names.length; i++) {
						var layer_name = layer_names[i];
						if(layer_name.includes('_tileset')) {
							//get the raw layerName used (used on the backend)
							var layer_name_raw = layersList.layers[layer_name]['layer_name'];
							console.log('RAW backend layer name: ' + layer_name_raw);
							//query the specific location for feature information
							
						}
					}
					showEnvData(e.lngLat, bbox, treesBbox, e);
				}
				else if (treesInSameCoord.length > 0 && !treesInSameCoord[0].properties.cluster) {
					clickedTrees = [];
					for (var i = 0; i < treesInSameCoord.length; i++) {
						clickedTrees.push(treesInSameCoord[i].properties.id);
					}

					var coords = treesInSameCoord[0].geometry.coordinates;
					if(debug) {
						console.log(coords);
						console.log(e.lngLat);
						console.log(Drupal.settings.tree_img);
					}
					// create a DOM element for the marker					
					var el = document.createElement("div");
					el.className = "marker";
					el.style.backgroundImage = "url(" + Drupal.settings.tree_img["selected"] + ")";
					el.style.width = "24px";
					el.style.height = "24px"; 
					
					//  el.addEventListener("click", function() {
					//  window.alert(marker.properties.message);
					//  });
					//   
					
					if (currMarker != null) {
						currMarker.remove();
					}
					//add marker to map					
					currMarker = new mapboxgl.Marker(el)
						.setLngLat({"lng": coords[0], "lat": coords[1]})
						.addTo(map);

					//clickedTrees = treesInSameCoord;
					//var coordKey = coords[1] e.lngLat.lat + "_" + e.lngLat.lng;
					var coordKey = coords[1] + "_" + coords[0];
					showTreeDetails(coordKey);

					addEnvData("#tree-details-extra", bbox, map.queryRenderedFeatures(treesBbox), e);
				}				
			}

			function renderNeonPopup(neonSite) {
				map.getCanvas().style.cursor = "pointer";
				var neonHTML = "<div class='card-header bg-secondary text-center'><h4 style='color: white;'>Lat:" + neonSite.properties.Latitude + " | Long: " + neonSite.properties.Longitude + "</h4></div>";
				neonHTML += "<div class='text-center'><h3>NEON Site Type: " + neonSite.properties.SiteType + "</h3><h5>";
				neonHTML += neonSite.properties.SiteHost + "</h5><h5>"; 
				neonHTML += neonSite.properties.DomainName + "</h5><div id='fieldsite-data'></div>";
				
				return neonHTML;
			}

			// a special type of hover event for mapbox layers being tested
			// same ideas as before, but with different layer id and properties of the layer being shown
			map.on("mouseenter", layersList.neon[0], function (e) {
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonSites = map.queryRenderedFeatures(bbox, {
					layers: [layersList.neon[0]]
				});

				if(debug) {
					console.log(neonSites);
				}
				if (neonSites.length > 0) {
					popupHover.setLngLat(e.lngLat)
						.setHTML(renderNeonPopup(neonSites[0]))
						.addTo(map);
				}
				else {
					popupHover.remove();
				}
			});
			
			map.on("click", layersList.neon[0], function (e) {
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonSites = map.queryRenderedFeatures(bbox, {
					layers: [layersList.neon[0]]
				});

				if (neonSites.length > 0) {
					map.getCanvas().style.cursor = "pointer";
					new mapboxgl.Popup().setLngLat(e.lngLat)
						.setHTML(renderNeonPopup(neonSites[0]))
						.addTo(map);

					//requesting additional data and the metadata for sites using this api url
					
					// $.ajax({
					// 	url: "https://phenocam.sr.unh.edu/api/cameras/?Sitename__contains=NEON." + neonSites[0].properties.PMC.substring(0,3) + "." + neonSites[0].properties.SiteID + "&format=json",
					// 	dataType: "json",
					// 	success: function (data, textStatus, jqXHR) {
					// 		if(debug) {
					// 			console.log('map.on("click", layersList.neon[0] click function');
					// 			console.log('-- data:');
					// 			console.log(data);
					// 		}
					// 		$("#fieldsite-data").html("");
					// 		var fieldsiteHTML = "";
					// 		var thisFieldsite = data.results[0];
					// 		if (thisFieldsite.sitemetadata.flux_data) {
					// 			fieldsiteHTML += "<h4>Flux Data: False</h4>";
					// 		}
					// 		else {
					// 			fieldsiteHTML += "<h4>Flux Data: True</h4>";
					// 			fieldsiteHTML += "<h5>Flux Networks: " + thisFieldsite.sitemetadata.flux_networks + "</h5>";
					// 			fieldsiteHTML += "<h5>Flux Sitenames: " + thisFieldsite.sitemetadata.flux_sitenames + "</h5>";
					// 		}						
					// 		fieldsiteHTML += "<h4>Dominant Species: " + thisFieldsite.sitemetadata.dominant_species + "</h4>";
					// 		fieldsiteHTML += "<h5>Primary Veg type: " + thisFieldsite.sitemetadata.primary_veg_type + " | Seconday Veg type: " + thisFieldsite.sitemetadata.secondary_veg_type + "</h5>";	
					// 		fieldsiteHTML += "<h5>NA Ecoregion: " + thisFieldsite.sitemetadata.ecoregion + "</h5>";
					// 		fieldsiteHTML += "<h5>WWF Biome: " + thisFieldsite.sitemetadata.koeppen_geiger + "</h5>";
					// 		fieldsiteHTML += "<h5>Landcover igbp: " + thisFieldsite.sitemetadata.landcover_igbp + "</h5>";
					// 		fieldsiteHTML += "<h5>Elevation: " + data.results[0].Elev + "</h5>";
					// 		fieldsiteHTML += "<img style='width:100%' src='https://phenocam.sr.unh.edu/data/latest/" + thisFieldsite.Sitename + ".jpg'>";
					// 		fieldsiteHTML += "<h5 class='text-muted'>Start: " + data.results[0].date_first + " | End: " + data.results[0].date_last + "</h5>";
					// 		$("#fieldsite-data").append(fieldsiteHTML);
					// 	},
					// 	error: function (xhr, textStatus, errorThrown) {
					// 		console.log({
					// 			textStatus
					// 		});
					// 		console.log({
					// 			errorThrown
					// 		});
					// 		console.log(xhr.responseText);
					// 	}
					// });
					

					$.ajax({
						url: Drupal.settings.ct_nodejs_api + "/v2/data/neon/summary/?site=" + neonSites[0].properties.SiteID,
						dataType: "json",
						success: function (data, textStatus, jqXHR) {
							if(debug) {
								console.log('map.on("click", layersList.neon[0] click function');
								console.log('-- data:');
								console.log(data);
							}
							$("#fieldsite-data").html("");
							var fieldsiteHTML = "";
							if(data.site_name != undefined) {
								fieldsiteHTML += "<h4>" + data.site_name + "</h4>";
							}
							if(data.latlon != undefined) {
								//fieldsiteHTML += "<h5>Latitude/Longitude: " + data.latlon + "</h5>";
							}	
							if(data.elevation != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Elevation:</b> " + data.elevation + "</h5>";
							}	
							if(data.temperature != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Mean Annual Temperature:</b> " + data.temperature + "</h5>";
							}
							if(data.precipitation != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Mean Annual Precipitation:</b> " + data.precipitation + "</h5>";
							}
							if(data.dom_nlcd_classes != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Dominant NLCD Classes:</b> " + data.dom_nlcd_classes + "</h5>";
							}	
							if(data.geology != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Geology:</b> " + data.geology + "</h5>";
							}	
							if(data.dominant_phenology_species != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Dominant Phenology Species:</b> " + data.dominant_phenology_species + "</h5>";
							}	
							if(data.mean_canopy_height != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Mean Canopy Height:</b> " + data.mean_canopy_height + "</h5>";
							}
							if(data.soil_family != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Soil Family:</b> " + data.soil_family + "</h5>";
							}
							if(data.wind_direction != undefined) {
								fieldsiteHTML += "<h5 style='font-weight: normal;'><b>Wind Direction:</b> " + data.wind_direction + "</h5>";
							}																																																																																
							if(data.img_object_html != undefined) {
								fieldsiteHTML += data.img_object_html;
							}
							

							// var fieldsiteHTML = "";
							// var thisFieldsite = data.results[0];
							// if (thisFieldsite.sitemetadata.flux_data) {
							// 	fieldsiteHTML += "<h4>Flux Data: False</h4>";
							// }
							// else {
							// 	fieldsiteHTML += "<h4>Flux Data: True</h4>";
							// 	fieldsiteHTML += "<h5>Flux Networks: " + thisFieldsite.sitemetadata.flux_networks + "</h5>";
							// 	fieldsiteHTML += "<h5>Flux Sitenames: " + thisFieldsite.sitemetadata.flux_sitenames + "</h5>";
							// }						
							// fieldsiteHTML += "<h4>Dominant Species: " + thisFieldsite.sitemetadata.dominant_species + "</h4>";
							// fieldsiteHTML += "<h5>Primary Veg type: " + thisFieldsite.sitemetadata.primary_veg_type + " | Seconday Veg type: " + thisFieldsite.sitemetadata.secondary_veg_type + "</h5>";	
							// fieldsiteHTML += "<h5>NA Ecoregion: " + thisFieldsite.sitemetadata.ecoregion + "</h5>";
							// fieldsiteHTML += "<h5>WWF Biome: " + thisFieldsite.sitemetadata.koeppen_geiger + "</h5>";
							// fieldsiteHTML += "<h5>Landcover igbp: " + thisFieldsite.sitemetadata.landcover_igbp + "</h5>";
							// fieldsiteHTML += "<h5>Elevation: " + data.results[0].Elev + "</h5>";
							// fieldsiteHTML += "<img style='width:100%' src='https://phenocam.sr.unh.edu/data/latest/" + thisFieldsite.Sitename + ".jpg'>";
							// fieldsiteHTML += "<h5 class='text-muted'>Start: " + data.results[0].date_first + " | End: " + data.results[0].date_last + "</h5>";
							


							$("#fieldsite-data").append(fieldsiteHTML);
						},
						error: function (xhr, textStatus, errorThrown) {
							if(debug) {
								console.log({
									textStatus
								});
								console.log({
									errorThrown
								});
								console.log(xhr.responseText);
							}
						}
					});

				}
			});

			map.on("mouseleave", layersList.neon[0], function () {
				map.getCanvas().style.cursor = "";
				popupHover.remove();
			});

			//hover event for neon plot sites
			map.on("mouseenter", layersList.neon[2], function (e) {
				if(debug) {
					console.log('mouseenter laerList.neon[2]');
				}
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonPlots = map.queryRenderedFeatures(bbox, {
					layers: [layersList.neon[1], layersList.neon[2]]
				});
				
				if(debug) {
					console.log('-- neonPlots array:');
					console.log(neonPlots);
				}

				if (neonPlots.length > 0) {
					var date = undefined;
					if(neonPlots[0].properties.date != undefined) {
						var rawDate = neonPlots[0].properties.date.toString();
						console.log(rawDate);
						date = rawDate.substring(0,4) + "-" + rawDate.substring(4,6) + "-" + rawDate.substring(6,8);
					}
					else {
						date = 'Unspecified';
					}
					map.getCanvas().style.cursor = "pointer";
					var neonHTML = "<div class='text-center'><h4>Plot Type: " + neonPlots[0].properties.plotTyp + "</h4><h5>";
					neonHTML += "National Land Cover DB classification: " + neonPlots[0].properties.nlcdCls + "<h5><h5>"; 
					neonHTML += "Subtype: " + neonPlots[0].properties.subtype + "</h5><h5 class='text-muted'>";
					neonHTML += "Date of collection: " + date + "</h5><p class='text-muted'>Lat:";
					neonHTML += neonPlots[0].properties.latitud + " | Long: " + neonPlots[0].properties.longitd + "</p>";
					//new mapboxgl.Popup().setLngLat(e.lngLat)
					popupHover.setLngLat(e.lngLat)
						.setHTML(neonHTML)
						.addTo(map);
				}
			});

			map.on("mouseleave", layersList.neon[2], function () {
				map.getCanvas().style.cursor = "";
				popupHover.remove();
			});
		
			//layersList.initPreloaded(); //Why is this here - seems the maps load good without this so removing it (Rish)
			
		});
	};
	*/
	
	

	map.on("idle",function(){
		//your code here
		console.log('Map idling - this means no operations are happening - this is good'); 
		console.log(mapActivityStatus);
		if(mapActivityStatus == 'map-loading-finished') {
			mapStatusNotification('Map is ready for further interaction', 'success', true, 4000, 0);
		}

	});
	 
	 function mapStatusNotification(text = '', type = 'info', clear = false, timeout = 0, ext_timeout = 0) {
		if(clear == true) {
			// toastr.clear();
			toastr.remove();
		}
		toastr.options = {
			"closeButton": false,
			"debug": false,
			"newestOnTop": false,
			//"progressBar": true,
			"positionClass": "toast-top-right",
			"preventDuplicates": false,
			"onclick": null,
			//"showDuration": "300",
			//"hideDuration": "1000",
			"timeOut": "0",
			"extendedTimeOut": "0",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
		  }

		  if(timeout > 0) {
			  toastr.options.timeOut = timeout;
		  }
		  if(ext_timeout > 0) {
			toastr.options.extendedTimeOut = ext_timeout;
		}		  

		  if(type == 'info') {
		  	toastr.info(text);
		  }	
		  else if (type == 'success') {
			  toastr.success(text);
		  }	 
		  else if(type == 'error') {
			  toastr.error(text);
		  }
	 }

	cartograplant.loadImageWrapper = loadImageWrapper;
	function loadImageWrapper(imagePath, imageName) {
		map.loadImage(imagePath, function (error, icon) {
			map.addImage(imageName, icon);
		});
	}

	cartograplant.showEnvData = showEnvData;
	function showEnvData(lngLat, bbox, treesBbox, e = null ) {
		// We need to get elevation
		// Get Elevation from the GeoServer layer instead
		console.log('showEnvData function');
		var baseUrl = "https://treegenesdb.org/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=";
		var elevation_layer_name = "ct:elevation";
		var getInfoUrl = baseUrl + elevation_layer_name + "&LAYERS=" + elevation_layer_name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
		console.log('getInfoUrl elevation:' . getInfoUrl);
		$.ajax({
			url: getInfoUrl,
			dataType: "text",
			success: function(data) {
				if (debug) {
					console.log(data);
				}
				try {
					var featureProps = JSON.parse(data).features[0].properties;
					console.log(featureProps);
					console.log(featureProps['ELEVATION']);
					if(featureProps['ELEVATION'] != undefined) {
						$('#popup_point_elevation').html('Elevation: '  + featureProps['ELEVATION'] + ' m');
					}
				}
				catch (err) {
					console.log(err);
				}	
			}
		});	


		//create a dynamic html popup
		var popupHTML = "<div class='card' style='margin:0'><div class='card-header bg-secondary'>";
		popupHTML += "<h4 style='color: white'>Latitude: " + roundHundredths(lngLat.lat);
		popupHTML += " | " + "Longitude: " + roundHundredths(lngLat.lng) + "</h4>";
		popupHTML += "<h3 style='color: #FFFFFF; margin-top: 5px; margin-bottom: 2px; background-color: #000000;' id='popup_point_elevation'>Retrieving...</h3></div>";

		//if there are any active layers on the map then add an environmental data section to the popup				
		if (layersList.getActiveLayers().length > 0) {
			popupHTML += "<h3 class='card-title'>Environmental Data</h3><ul class='environmental-values list-group'></ul>";
			$(".environmental-values").html();
		}
		popupHTML += "</div>";

		//show the popup, then request the actual environmental data from geoserver
		new mapboxgl.Popup().setLngLat(lngLat).setHTML(popupHTML).addTo(map);
		addEnvData(".environmental-values", bbox, map.queryRenderedFeatures(treesBbox), e);
	}

	//temp fix for showing the neon meta data
	cartograplant.isNeonSite = isNeonSite;
	function isNeonSite(treesBbox) {
		var neonSites = map.queryRenderedFeatures(treesBbox, {
			layers: [layersList.neon[0]]
		});

		return neonSites.length > 0;
	}

	// This function will set the cartograplant namespace variable current_dataset_data
	// which is used by the polygon tool to determine selected trees which needs this data.
	function setCurrentDatasetData(datasetindex, data) {
		if (datasetindex == -1) { // this is a reset
			dataDatasets[4] = null;
			// for (var i=0; i < Object.keys(dataDatasets).length; i++) {
			// 	dataDatasets[Object.keys(dataDatasets)[i]] = null;
			// }
			// cartograplant.current_dataset_data = {
			// 	'type': 'FeatureCollection',
			// 	'features': null
			// };			
			return;
		}


		dataDatasets[datasetindex] = data;
		console.log('setCurrentDatasetData function executed');
		data = [];
		console.log('dataDatasets Keys', Object.keys(dataDatasets))

		// we need to make sure our dataDatasets don't contain unselected dataset data
		// we do this by going through the activeDatasets object - each key is the index and value is boolean
		var main_datasets_status = false;
		var wfid_datasets_status = false;
		console.log('activeDatasets', activeDatasets);
		for (var j=0; j < Object.keys(activeDatasets).length; j++) {
			var index = Object.keys(activeDatasets)[j];
			var value_boolean = activeDatasets[Object.keys(activeDatasets)[j]];
			if (index == 0 || index == 1 || index == 2 || index == 5) { // if any of these are selected, we keep the data by setting to true
				if(value_boolean == true) {
					main_datasets_status = true;
				}
			}
			else if (index == 4) { // if wfid dataset layer is selected, we keep the data by setting to true
				if(value_boolean == true) {
					wfid_datasets_status = true;
				}
			}
		}

		// now we know the status, clear or keep accordingly, false means we null it, true, we keep the data
		if(main_datasets_status == false) {
			dataDatasets[0] = null;
		}
		if(wfid_datasets_status == false) {
			dataDatasets[4] = null;
		}

		// This joins up all the data from the various datasets to generate the current_dataset_data CT variable
		for (var i=0; i < Object.keys(dataDatasets).length; i++) {
			console.log('dataDatasets ' + i + ': ',dataDatasets[Object.keys(dataDatasets)[i]]);
			if (dataDatasets[Object.keys(dataDatasets)[i]] != null) {
				data = data.concat(dataDatasets[Object.keys(dataDatasets)[i]]);
			}
		}	
		console.log('data compiled:', data);
		console.log('Re counting number of plants since a filter occurred to get the new plants into the map');
		if(cartograplant.tree_count_last_filter == 0) {
			$('#num-trees').html(data.length);
		}
		else {
			var temp_tree_count_calc = parseInt($('#num-trees').text()) - cartograplant.tree_count_last_filter;
			if(temp_tree_count_calc < 0) {
				$('#num-trees').html(data.length);
			}
		}
		cartograplant.tree_count_last_filter = data.length;

		cartograplant.current_dataset_data = {
			'type': 'FeatureCollection',
			'features': data
		};			
	}

	cartograplant.initMapTrees = initMapTrees;
	function initMapTrees() {
		if(debug) {
			console.log('initMapTrees() function');
		}
		if (Object.keys(filterQuery).length == 0 && getActiveDatasets().length == 3) {
			console.log('MAP', map);
			getAllTrees(function(data) {

				// TEMPORARY PATCH - TEST NEW FILTERING MECHANISM UNTIL EMILY FIXES VIEWS
				// var data_tmp = [];
				// for (var d_index = 0; d_index < data.length; d_index++) {
				// 	var item = data[d_index];
				// 	var item_dot_parts = item["geometry"]["coordinates"][0].split('.');
				// 	if (item_dot_parts.length <= 2) {
				// 		data_tmp.push(item);
				// 	}
				// }
				// data = data_tmp;

				addDatasetLayer(data);
				console.log('initMapSummary');
				initMapSummary(data.length);
				


				// if(debug) {
				// 	console.log(data);
				// }

				cartograplant.currently_filtered_trees = [];
				cartograplant.json_tree_ids = [];
				for(var i=0; i < data.length; i++) {
					cartograplant.currently_filtered_trees.push(data[i]["properties"]["id"]);
					cartograplant.json_tree_ids.push(data[i]["properties"]["id"]);
				}

				if(debug) {
					console.log("Added " + data.length + " trees to currently_filtered_trees");		
				}


				dataDatasets[0] = data;
				console.log('dataDatasets', dataDatasets);
				setCurrentDatasetData(0, data);

				//This stores the unique species count per dataset layer enabled
				//This code was coded before we had additional datasets in an unorganized way
				for(var i=0; i<3; i++) {
					updateUniqueSpeciesCount(i, ""); // "" is an empty filter
				}
				// To cater for new datasetlayers after 2 from the for loop above, we need to also updateUniqueSpeciesCounts
				// for these layers
				try {
					updateUniqueSpeciesCount(5, "");
				} catch (err) { console.log(err) }
			});	

				
		}
		else {
			mapActivityStatus = 'map-filtering';
			setTimeout(function() {
				filterMap(false);
			}, 3500);
		}
	}

	/**
	 * Adds the layers for the tree dataset
	 * @param takes no arguments
	 * @return no return value
	*/
	function addDatasetLayer(trees) {
		console.log('DatasetSourceID: '  + datasetSourceId);
		console.log('Actual data', trees);
		try {
			map.addSource(datasetSourceId, {
				"type": "geojson",
				"data": {
					"type": "FeatureCollection",
					"features": trees
				},
				"cluster": true,
				"clusterMaxZoom": 9, // Max zoom to cluster points on
				"clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
			});

			console.log('DatasetLayerID: ' + datasetLayerId);
			map.addLayer({
				"id": datasetLayerId,
				"type": "symbol",
				"source": datasetSourceId,
				"filter": ["!", ["has", "point_count"]],
				"layout": {
					"icon-image": getTreeIconsV2(),
					"icon-allow-overlap": true,
					// "text-allow-overlap": true
				}, 
				}, "state-label", //set below text labels of states
			);

			//the cluster circles which will represent grouped up trees
			//color and size of the circle depends on cluster size, in arbitrary 0->250, 250->1000, 1000+ intervals
			console.log('DatasetClusterID: ' + datasetClusterId);
			map.addLayer({
				"id": datasetClusterId,
				"type": "circle",
				"source": datasetSourceId,
				"filter": ["has", "point_count"],
				"paint": {
					"circle-color": [
						"step",
						["get", "point_count"],
						clusterProps[0][1],
						clusterProps[1][0],	
						clusterProps[1][1],
						clusterProps[2][0],
						clusterProps[2][1],
					],
					"circle-radius": [
						"step",
						["get", "point_count"],
						25,
						clusterProps[1][0],
						35,
						clusterProps[2][0],
						45,
					],
					// "circle-radius": [
					// 	"step",
					// 	["get", "point_count"],
					// 	5,
					// 	clusterProps[1][0],
					// 	10,
					// 	clusterProps[2][0],
					// 	25,
					// ],				
				}
			});

			//the text displayed on top of the circles that give additional information like tree count in this cluster
			console.log('DatasetClusterCountID: ' + datasetClusterId + "-count");
			map.addLayer({
				"id": datasetClusterId + "-count",
				"type": "symbol",
				"source": datasetSourceId,
				"filter": ["has", "point_count"],
				"layout": {
					"text-field": "{point_count_abbreviated}" + " Plants",
					"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
					"text-size": 12,
					// "text-allow-overlap": true
				}
			});
			addDatasetClickEvents(datasetSourceId, datasetLayerId, datasetClusterId);
			console.log('Dataset click events added');
		}
		catch (err) {
			console.log(err);
		}
	}


	/**
	 * Adds a new dynamic layer for the tree dataset
	 * @param takes no arguments
	 * @return no return value
	*/
	function addDynamicDatasetLayer(trees, suffix, icon_function = null, settings = null) {
		var showClusterPoints = true;
		var iconOverlap = true;
		var moveLayerToTop = false;
		console.log('addDynamicDatasetLayer settings:', settings);
		if(settings != null) {
			if (settings['showClusterPoints'] != undefined) {
				showClusterPoints = settings['showClusterPoints'];
				console.log('showClusterPoints:',settings['showClusterPoints']);
			}
			if (settings['iconOverlap'] != undefined) {
				iconOverlap = settings['iconOverlap'];
				console.log('iconOverlap:', settings['iconOverlap']);
			}	
			if (settings['moveLayerToTop'] != undefined) {
				moveLayerToTop = settings['moveLayerToTop'];
				console.log('moveLayerToTop:', settings['moveLayerToTop']);
			}			
		}
		else {
			console.log('addDynamicDatasetLayer: Using default config without settings object');
		}
		if (icon_function == null) {
			icon_function = getTreeIconsV2;
		}
		map.addSource('dynamic-source-' + suffix, {
			"type": "geojson",
			"data": {
				"type": "FeatureCollection",
				"features": trees
			},
			"cluster": showClusterPoints,
			"clusterMaxZoom": 9, // Max zoom to cluster points on
			"clusterRadius": 50 // Radius of each cluster when clustering points (defaults to 50)
		});

		map.addLayer({
			"id": 'dynamic-layer-' + suffix,
			"type": "symbol",
			"source": 'dynamic-source-' + suffix,
			"filter": ["!", ["has", "point_count"]],
			"layout": {
				"icon-image": icon_function(),
				//"icon-size": 0.04,
				"icon-allow-overlap": iconOverlap,
			}, 
			}, "state-label", //set below text labels of states
		);
		if (moveLayerToTop == true) {
			map.moveLayer('dynamic-layer-' + suffix);
			console.log('Moving layer to the top:' + 'dynamic-layer-' + suffix);
		}

		// showClusterPoints feature was added since we want to disable cluster points
		// for PopStruct layers
		if(showClusterPoints) {
			//the cluster circles which will represent grouped up trees
			//color and size of the circle depends on cluster size, in arbitrary 0->250, 250->1000, 1000+ intervals
			map.addLayer({
				"id": 'dynamic-cluster-' + suffix,
				"type": "circle",
				"source": 'dynamic-source-' + suffix,
				"filter": ["has", "point_count"],
				"paint": {
					"circle-color": [
						"step",
						["get", "point_count"],
						clusterProps[0][1],
						clusterProps[1][0],	
						clusterProps[1][1],
						clusterProps[2][0],
						clusterProps[2][1],
					],
					"circle-radius": [
						"step",
						["get", "point_count"],
						25,
						clusterProps[1][0],
						35,
						clusterProps[2][0],
						45,
					],
				}
			});

			//the text displayed on top of the circles that give additional information like tree count in this cluster
			map.addLayer({
				"id": 'dynamic-cluster-' + suffix + "-count",
				"type": "symbol",
				"source": 'dynamic-source-' + suffix,
				"filter": ["has", "point_count"],
				"layout": {
					"text-field": "{point_count_abbreviated}" + " Plants",
					"text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
					"text-size": 12
				}
			});
			//addDatasetClickEvents(datasetSourceId, datasetLayerId, datasetClusterId);
			addDynamicDatasetClickEvents('dynamic-source-' + suffix, 'dynamic-layer-' + suffix, 'dynamic-cluster-' + suffix);
		}
	}

	/**
	 * Removes a new dynamic layer for the tree dataset
	 * @param takes no arguments
	 * @return no return value
	*/
	function removeDynamicDatasetLayer(suffix) {
		try {
			map.removeLayer('dynamic-cluster-' + suffix + "-count");
			map.removeLayer('dynamic-cluster-' + suffix);
			map.removeLayer('dynamic-layer-' + suffix);		
			map.removeSource('dynamic-source-' + suffix);
		}
		catch (err) {
			console.log('removeDynamicDatasetLayer error', err);
		}
	}

	var xhr_progress = function () {
		var xhr = new window.XMLHttpRequest();
		//Download progress
		xhr.addEventListener("progress", function (evt) {
			if (evt.lengthComputable) {
				var percentComplete = evt.loaded / evt.total;
				console.log('percent complete:' + Math.round(percentComplete * 100));
				var percentCompleteRevised = Math.round(percentComplete * 100);
				if($('#map-dataset-loading').css('display') == "none") {
					$('#map-dataset-loading').slideDown(0);
					$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

					// Summary loading progress
					$('#map-summary-loading').slideDown(0);
					$('#map-summary-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
				}
				else {
					$('#map-dataset-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Downloading filtered data (' + percentCompleteRevised + '%)');
					$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
					$('#map-dataset-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');

					// Summary loading progress
					$('#map-summary-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Map summary awaiting revised data... (' + percentCompleteRevised + '%)');
					$('#map-summary-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
					$('#map-summary-loading-progressbar-progress-text').hide();
					// $('#map-summary-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');									
				}
				// progressElem.html(Math.round(percentComplete * 100) + "%");
			}
		}, false);
		return xhr;
	}

	/**
	 * Makes an ajax call to the api to get all the tree ids associated with the dataset
	 * @param {function} handler - The function which the tree data will be passed to, to be processed
	*/
	function getAllTrees(handler) {
		console.log('getAllTrees()');
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/trees",
			dataType: "json",		
			async: true,
			xhr: xhr_progress,
			success: function (data) {	
				$('#map-dataset-loading').slideUp(1000);
				$('#map-dataset-loading-progressbar-progress').css('width','100%');

				// Summary loading progress
				$('#map-summary-loading').slideUp(1000);
				$('#map-summary-loading-progressbar-progress').css('width', '100%');							
				
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
				console.log('v2/trees', data);
				handler(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			}
		});
	}

	/**
	 * Makes an ajax call to the api to get all the tree ids associated with the dataset
	 * @param {function} handler - The function which the tree data will be passed to, to be processed
	*/
	function getWFIDTrees(handler) {
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/trees/wfid",
			dataType: "json",
			async: true,
			xhr: xhr_progress,
			// xhr: function () {
			// 	var xhr = new window.XMLHttpRequest();
			// 	//Download progress
			// 	xhr.addEventListener("progress", function (evt) {
			// 		if (evt.lengthComputable) {
			// 			var percentComplete = evt.loaded / evt.total;
			// 			console.log('percent complete:' + Math.round(percentComplete * 100));
			// 			var percentCompleteRevised = Math.round(percentComplete * 100);
			// 			if(percentCompleteRevised == 0) {
			// 				$('#map-dataset-loading').slideDown(500);
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

			// 			}
			// 			else if (percentCompleteRevised == 100) {
			// 				$('#map-dataset-loading').slideUp(1000);
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

							
			// 			}
			// 			else {
			// 				$('#map-dataset-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Downloading WFID filtered data (' + percentCompleteRevised + '%)');
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
			// 				$('#map-dataset-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');

			// 			}
			// 			// progressElem.html(Math.round(percentComplete * 100) + "%");
			// 		}
			// 	}, false);
			// 	return xhr;
			// },			
			success: function (data) {
				$('#map-dataset-loading').slideUp(1000);
				$('#map-dataset-loading-progressbar-progress').css('width','100%');

				// Summary loading progress
				$('#map-summary-loading').slideUp(1000);
				$('#map-summary-loading-progressbar-progress').css('width', '100%');				
				//current_dataset_data should get handled in the handler
				handler(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			}
		});
	}	

	/**
	 * Makes an ajax call to the api to get all the tree ids associated with the dataset
	 * @param {function} handler - The function which the tree data will be passed to, to be processed
	 * @param String study_accession - The study accession to query the CP API to get the tree_ids
	*/
	function getPopStructTrees(handler, study_accession) {
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/trees/popstruct?study_accession=" + study_accession,
			dataType: "json",
			async: true,
			xhr: xhr_progress,
			// xhr: function () {
			// 	var xhr = new window.XMLHttpRequest();
			// 	//Download progress
			// 	xhr.addEventListener("progress", function (evt) {
			// 		if (evt.lengthComputable) {
			// 			var percentComplete = evt.loaded / evt.total;
			// 			console.log('percent complete:' + Math.round(percentComplete * 100));
			// 			var percentCompleteRevised = Math.round(percentComplete * 100);
			// 			if(percentCompleteRevised == 0) {
			// 				$('#map-dataset-loading').slideDown(500);
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

			// 			}
			// 			else if (percentCompleteRevised == 100) {
			// 				$('#map-dataset-loading').slideUp(1000);
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

							
			// 			}
			// 			else {
			// 				$('#map-dataset-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Downloading WFID filtered data (' + percentCompleteRevised + '%)');
			// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
			// 				$('#map-dataset-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');

			// 			}
			// 			// progressElem.html(Math.round(percentComplete * 100) + "%");
			// 		}
			// 	}, false);
			// 	return xhr;
			// },	
			success: function (data) {
				$('#map-dataset-loading').slideUp(1000);
				$('#map-dataset-loading-progressbar-progress').css('width','100%');

				// Summary loading progress
				$('#map-summary-loading').slideUp(1000);
				$('#map-summary-loading-progressbar-progress').css('width', '100%');

				//current_dataset_data should get handled in the handler
				console.log('Callback:' + study_accession);
				handler(data, study_accession);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			}
		});
	}	
	

	/**
	 * Retrieves the icons that is associated with each plant group and dataset
	 * @return an array representing the icons to be mapped
	 * format is [<icon type>, <icon val>, <icon_type>, <icon val>, ..., <default icon if tree matches with nothing>]
	*/
	function getTreeIcons() {		
		return [
			"match",
			["get", "icon_type"],
			0,
			"angiosperm_ex",
			1,
			"gymnosperm_ex",
			2,
			"angiosperm_app",
			3,
			"gymnosperm_app",
			4,
			"treesnap_gymno",
			5,
			"treesnap_angio",
			6,
			"wfid_ex",			
			"angiosperm_ex",
		];
	}

	function getTreeIconsV2() {	
		console.log('getTreeIconsV2 was called');	
		return [
			// "match", ["get", "is_tree"], "true", "gymnosperm_ex", "false", "plant", "angiosperm_ex"   
			"match", ["get", "is_tree"], 
			"true", [ // if true (tree), check icon_type
				"match",			
				["get", "icon_type"],
				0,
				"angiosperm_ex",
				1,
				"gymnosperm_ex",
				2,
				"angiosperm_app",
				3,
				"gymnosperm_app",
				4,
				"treesnap_gymno",
				5,
				"treesnap_angio",
				6,
				"wfid_ex",			
				"angiosperm_ex",
			], 
			"false", "plant", // if false, is plant
			"angiosperm_ex" // default if none of the above
		]
		
		// return [
		// 	"match",			
		// 	["get", "icon_type"],
		// 	0,
		// 	"angiosperm_ex",
		// 	1,
		// 	"gymnosperm_ex",
		// 	2,
		// 	"angiosperm_app",
		// 	3,
		// 	"gymnosperm_app",
		// 	4,
		// 	"treesnap_gymno",
		// 	5,
		// 	"treesnap_angio",
		// 	6,
		// 	"wfid_ex",			
		// 	"angiosperm_ex",
		// ];
	}	

	
	/**
	 * Adds the click events of the dataset layers
	 * @param takes no arguments
	 * @return no return value
	*/
	
	function addDynamicDatasetClickEvents(sourceId, layerId, clusterId) {
		var treeHover = new mapboxgl.Popup({closeButton: false});
		map.on("mouseenter", layerId, function (e) {
			//console.log('addDynamicDatasetClickEvents on mouseenter');
			//create a bounding box around the clicked point
			var bbox = [
				[e.point.x, e.point.y],
				[e.point.x, e.point.y],
			];

			//get all the trees and their features that are within the bounding box 
			var treesInSameCoord = map.queryRenderedFeatures(bbox, {
				layers: [layerId],
			});
			
			var hoverText = treesInSameCoord.length == 1 ? treesInSameCoord.length + " Plant" : treesInSameCoord.length + " Plants";
			
			//if there are trees within the bounding box, then display the popup, else don"t display anything
			if (treesInSameCoord.length > 0) {
				map.getCanvas().style.cursor = "pointer";
				treeHover.setLngLat(e.lngLat)
					.setText(/*e.features[0].properties.species + " | " +*/ hoverText)
					.addTo(map);
			}
			else {
				treeHover.remove();
			}
		});

		// Change the cursor back to original state and remove any popup once it leaves the area of trees
		map.on("mouseleave", layerId, function () {
			map.getCanvas().style.cursor = "";
			treeHover.remove();
		});

		map.on("click", layerId, function(e) {
			if(debug) {
				console.log('addDynamicDatasetClickEvents on click');
			}
			/*
			var bbox = [
				[e.point.x, e.point.y],
				[e.point.x, e.point.y],
			];

			var features = map.queryRenderedFeatures(bbox, {
				layers: [clusterId]
			});
			//var featureProps = ;
			console.log(features[0]);
			map.getSource(sourceId).getClusterExpansionZoom(features[0].properties.cluster_id, function(err, zoom) {
				if (err) {
					return;
				}
				map.easeTo({
					center: features[0].geometry.coordinates,
					zoom: zoom + 1,
				});
			});
			*/
			
			//create a bounding box around the clicked point, to be used to query for features/trees around the bbox
			var treesBbox = [
				[e.point.x, e.point.y],
				[e.point.x, e.point.y]
			];
			//console.log(treesBbox);

			//create a bounding box based on the lat/long coordinates of the clicked point, will be used to query for environmental data
			var bbox = (e.lngLat.lat - .1) + "%2C" + (e.lngLat.lng - .1) + "%2C" + (e.lngLat.lat + .1) + "%2C" + (e.lngLat.lng + .1);   

			if (isNeonSite(treesBbox)) {
				return;
			}

			//get all the trees around the bounding box if they exist        
			var treesInSameCoord = map.queryRenderedFeatures(treesBbox, {
				layers: [layerId]//treeDatasets.getActiveDatasets() 
			});
			if(debug) {
				console.log('treesInSameCoord');
				console.log(treesInSameCoord);
			}

			var cluster = map.queryRenderedFeatures(treesBbox, {
				layers: [clusterId]
			});
			
			//a tree wasn"t clicked, treat as random click event and display coords/env values only
			if (treesInSameCoord.length === 0 && cluster.length === 0) {		
				showEnvData(e.lngLat, bbox, treesBbox, e);
			}
			else if (treesInSameCoord.length > 0 && !treesInSameCoord[0].properties.cluster) {
				cartograplant.clickedTrees = [];
				for (var i = 0; i < treesInSameCoord.length; i++) {
					cartograplant.clickedTrees.push(treesInSameCoord[i].properties.id);
				}
				
				var coords = treesInSameCoord[0].geometry.coordinates;
				if(debug) {
					console.log(coords);
					console.log(e.lngLat);
					console.log(Drupal.settings.tree_img);
				}
				// create a DOM element for the marker
				var el = document.createElement("div");
				el.className = "marker";
				el.style.backgroundImage = "url(" + Drupal.settings.tree_img["selected"] + ")";
				el.style.width = "24px";
				el.style.height = "24px"; 
				
				//  el.addEventListener("click", function() {
				//  window.alert(marker.properties.message);
				//  });
				//   
				
				if (currMarker != null) {
					currMarker.remove();
				}
				//add marker to map					
				currMarker = new mapboxgl.Marker(el)
					.setLngLat({"lng": coords[0], "lat": coords[1]})
					.addTo(map);

				//clickedTrees = treesInSameCoord;
				//var coordKey = coords[1] e.lngLat.lat + "_" + e.lngLat.lng;
				var coordKey = coords[1] + "_" + coords[0];
				showTreeDetails(coordKey);

				addEnvData("#tree-details-extra", bbox, map.queryRenderedFeatures(treesBbox), e);
			}				
			
		});	
	}	

	/**
	 * Adds the click events of the dataset layers
	 * @param takes no arguments
	 * @return no return value
	*/
	function addDatasetClickEvents(sourceId, layerId, clusterId) {
		try {
			var treeHover = new mapboxgl.Popup({closeButton: false});
			map.on("mouseenter", layerId, function (e) {
				//create a bounding box around the clicked point
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y],
				];

				//get all the trees and their features that are within the bounding box 
				var treesInSameCoord = map.queryRenderedFeatures(bbox, {
					layers: [layerId],
				});
				
				var hoverText = treesInSameCoord.length == 1 ? treesInSameCoord.length + " Plant" : treesInSameCoord.length + " Plants";
				
				//if there are trees within the bounding box, then display the popup, else don"t display anything
				if (treesInSameCoord.length > 0) {
					map.getCanvas().style.cursor = "pointer";
					treeHover.setLngLat(e.lngLat)
						.setText(/*e.features[0].properties.species + " | " +*/ hoverText)
						.addTo(map);
				}
				else {
					treeHover.remove();
				}
			});

			// Change the cursor back to original state and remove any popup once it leaves the area of trees
			map.on("mouseleave", layerId, function () {
				map.getCanvas().style.cursor = "";
				treeHover.remove();
			});

			map.on("click", clusterId, function(e) {
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y],
				];

				var features = map.queryRenderedFeatures(bbox, {
					layers: [clusterId]
				});
				//var featureProps = ;
				if(debug) {
					console.log(features[0]);
				}
				map.getSource(sourceId).getClusterExpansionZoom(features[0].properties.cluster_id, function(err, zoom) {
					if (err) {
						return;
					}
					map.easeTo({
						center: features[0].geometry.coordinates,
						zoom: zoom + 1,
					});
				});
			});	
		}
		catch (err) {
			console.log(err);
		}
	}



	function getActiveDatasets() {
		var activeList = [];
		for (var dataset in activeDatasets) {
			if (activeDatasets[dataset]) {
				activeList.push(dataset);
			}
		}
		//console.log('getActiveDatasets:');
		//console.log(activeList);
		return activeList;
	}	

	function getActiveDatasetsOfTypeGeoserverTileset() {
		var list = [];
		for (var datasetKeyId in datasetKey) {
			if(datasetKeyId.includes('geoserver_tileset')) {
				for(var activeDatasetKey in activeDatasets) {
					if(datasetKey[datasetKeyId] == activeDatasetKey) {
						list.push(activeDatasetKey); // a digit 0,1,2,3 etc
					}
				}
			}
		}
		//console.log('getActiveDatasets:');
		//console.log(activeList);
		return list;
	}

	/**
	 * Updates the source of the dataset layers to the new dataset
	 * @param {array} newData - an array of tree features
	 * @return no return value
	*/
	function setData(newData, datasetSourceId = 'trees') {
		cartograplant.current_dataset_data = {
			'type': 'FeatureCollection',
			'features': newData
		};
		//console.log(newData);
		
		/*
		if(activeDatasets[3] == true) {
			//BIEN is enabled
			var source_id = 3;
			//Get rid of all bien layers
			for(var i=0; i < trees_by_source_id_cache_object["source_id_" + source_id].length; i++) {
				//Remove old layers
				try {
					removeDynamicDatasetLayer('source_id_' + source_id + '_' + i);
				}
				catch(err) {
					//we don't have to worry if this doesn't work, main thing is that it is empty
				}
			}

			//Go through newData and find all BIEN trees
			var bienData = [];
			var i=newData.length;
			while(i--) {
				var tree = newData[i];
				if(tree.properties.id.includes('bien.')) {
					//Add it to bienData
					bienData.push(tree);
					
					//Remove it from newData
					newData.splice(i,1);
				}
			}
			
			//Now make sure to addDynamicDatasetLayer
			addDynamicDatasetLayer(bienData, "source_id_" + source_id + '_0');
		}
		*/
		
		map.getSource(datasetSourceId).setData({
  			"type": "FeatureCollection",
			"features": newData, 
		});
	}


	
	
	
	function updateTreeImgs(imgs, species) {
		var all_imgs = imgs;
		console.log('all_imgs', all_imgs);
		imgs = all_imgs['images'];

		// Add all possible images if these keys exist
		if (all_imgs['Leaves'] != undefined) {
			for (var i = 0; i<all_imgs['Leaves'].length; i++) {
				imgs.push(all_imgs['Leaves'][i]);
			}
		}
		if (all_imgs['Branches'] != undefined) {
			for (var i = 0; i<all_imgs['Branches'].length; i++) {
				imgs.push(all_imgs['Branches'][i]);
			}
		}

		if(debug) {
			console.log('updateTreeImgs() function');
			console.log('-- species:' + species);
		}
		$("#tree-img-carousel .carousel-inner").html("");
		$("#tree-img-carousel .carousel-indicators").html("");
		//$("#tree-img-carousel").carousel("pause").removeData();
		$("#tree-imgs-container").html("");
		$("#tree-img-carousel").css('display','block');

		if(debug) {
			console.log('updateTreeImgs');
		}
		if (imgs == undefined || imgs.length == 0) {
			var speciesSplit = species.split(" ");
			var treeImg = speciesSplit[0].toLowerCase() + "_" + speciesSplit[1] + ".jpg";
			var imgFileName = Drupal.settings.basePath + "sites/default/files/treepictures/" + treeImg;
			// hide arrows
			$('#tree-img-carousel .carousel-control-prev').hide();
			$('#tree-img-carousel .carousel-control-next').hide();
			$.ajax({
				url:imgFileName,
				type:'HEAD',
				error:function() {
					$("#tree-img-carousel").css('display','none');
					if(debug) {
						console.log('Could not find image:' + imgFileName);
					}
					$("#expand-image-view-button").hide();
				},
				success: function() {
					$("#expand-image-view-button").show();
					$("#tree-img-carousel").css('display','block');
					if(debug) {
						console.log('Found image:' + imgFileName);
					}
					$("#tree-img-carousel .carousel-indicators").eq(0).append("<li data-target='#tree-img-carousel' data-slide-to='0'></li>");
					$("#tree-img-carousel .carousel-inner").eq(0).append("<div class='carousel-item tree-img'><img onclick=\"show_full_image('" + imgFileName + "');\" class='d-block w-100' id='tree-view-img0' src='" + imgFileName + "' alt='First image'></div>");
					$("#tree-imgs-container").append("<div class='row'><div class='col img-full'><img onclick=\"show_full_image('" + imgFileName + "');\" src='" + imgFileName + "'/></div></div>");					

					$(".carousel-item").first().addClass("active");
					$(".carousel-indicators > li").first().addClass("active");
				}
			});

		}	
		else {
			$("#expand-image-view-button").show();
			var row = "<div class='row'>";
			var numAddedElements = 0;

			//show arrows
			$('#tree-img-carousel .carousel-control-prev').show();
			$('#tree-img-carousel .carousel-control-next').show();
			for (var i = 0; i < imgs.length; i++) {	
				$("#tree-img-carousel .carousel-indicators").append("<li data-target='#tree-img-carousel' data-slide-to='" + i + "'></li>");
				$("#tree-img-carousel .carousel-inner").append("<div class='carousel-item tree-img'><img class='d-block w-100' onclick=\"show_full_image('" + imgs[i] + "');\" id='tree-view-img" + i + "' src='" + imgs[i] + "' alt='tree img'></div>");	
				if (i % 2 == 0 && numAddedElements > 0) {
					$("#tree-imgs-container").append(row + "</div>");
					numAddedElements = 0;
					row = "<br /><div class='row'>";
				}
				row += "<div class='col img-full'><img onclick='show_full_image(\'" + imgs[i] + "\');' src='" + imgs[i] + "'/></div>";
				numAddedElements++;
			}
			if (numAddedElements > 0) {
				$("#tree-imgs-container").append(row);
			}
			//$("#tree-imgs-container").append("</div>");
		}
		$(".carousel-item").first().addClass("active");
		$(".carousel-indicators > li").first().addClass("active");
	}
	

		

	function getTreegenesData(treeId) {

		// Stops a publication lookup if this is a treesnap tree
		if (treeId.includes('treesnap')) {
			return;
		}

		// Get basic information about the tree
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_acc=" + treeId,
			dataType: "json",
			success: function (data) {
				console.log(data);
			}
		});

		// Get all study details using shared_state
		// https://treegenesdb.org/api/submission/TGDR1243/view/shared_state
		$.ajax({
			url: '/api/submission/' + treeId.split("-")[0] + '/view/shared_state',
			dataType: "json",
			success: function (data) {
				console.log('shared_state', data);
				$('#tree-study-environmental-container').html('');
				var organism_count = 0;
				var keys = Object.keys(data['saved_values'][4]);
				for (var keys_i = 0; keys_i < keys.length; keys_i++) {
					var key = keys[keys_i];
					if (key.includes('organism')) {
						organism_count++;
					}
				}
				var el_html = '<div style="margin-top: 10px;" class="media">';
				el_html += '<i class="fas fa-layer-group fa-4x align-self-center mr-3" style="position: relative; top: -15px;"></i>'
				el_html += '<div class="media-body">';
				el_html += '<h4>Environmental layers associated with study</h4>';
				console.log('organism_count', organism_count);
				for (var organism_i = 1; organism_i <= organism_count; organism_i++) {
					try {
						var env_layers = Object.keys(data['saved_values'][4]['organism-' + organism_i]['environment']['env_layers']);
						for (var el_i = 0; el_i < env_layers.length; el_i++) {
							el_html += '<div>' + env_layers[el_i] + '</div>';
						}
					} catch (err) {
						console.log('env_error', err);
					}
				}
				el_html += '</div>';
				el_html += '</div>';
				console.log('el_html', el_html);
				$('#tree-study-environmental-container').html(el_html);
			}
		});	

		// Get publication info for specific tree
		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/publications?api_key=" + Drupal.settings.ct_api + "&tree_acc=" + treeId.split("-")[0],
			dataType: "json",
			success: function (data) {
				console.log('Specific tree data', data);
				if(debug) {
					console.log('getTreeGenesData treeId:' + treeId);
					
				}
				if (data.length > 0) {
					$("#tree-phenotypes-container").removeClass("hidden");	
					
					try {
						if(data[0].title.length > 0) {
							$("#tree-study-associated-container").removeClass("hidden");					
							$("#tree-study-associated-label").removeClass("hidden");
							$("#tree-pub-title").removeClass("hidden");
							$("#tree-pub-title").html('<a target="_blank" href="/Publication/' + data[0].entity_id + '">' + data[0].title + '</a>');
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}
					
					
					try {
						if(data[0].author.length > 0) {
							$("#tree-pub-author").removeClass("hidden");
							$("#tree-pub-author").text(data[0].author);
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}
					
					try {
						if(data[0].year.length > 0) {
							$("#tree-pub-year").removeClass("hidden");
							$("#tree-pub-year").text(data[0].year);
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}
					
					try {
						if(data[0].markers.length > 0) {
							$("#tree-markers-label").removeClass("hidden");
							$("#tree-markers").removeClass("hidden");
							$("#tree-markers").text(data[0].markers);
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}

					
					$('#tree-markers-count-label').hide();
					$('#tree-markers-count').hide();
					try {
						if(data[0].marker_count.length > 0) {
							$('#tree-markers-count-label').show();
							$('#tree-markers-count').show();	
							$("#tree-markers-count").text(data[0].marker_count);
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}
	
					
					// try {
					// 	if(data[0].study_type.length > 0) {
					// 		$("#tree-study-type-label").removeClass("hidden");
					// 		$("#tree-study-type").removeClass("hidden");
					// 		$("#tree-study-type").text(data[0].study_type);
					// 	}
					// }
					// catch(err) {
					// 	if(debug) {
					// 		console.log(err);
					// 	}
					// }

					try {
						console.log('Checking study type from publication data');
						console.log('study_type_data', data[0]);
						var study_type_html = "";
						if(data[0]['gen_count'] != undefined) {
							if(parseInt(data[0]['gen_count']) > 0) {
								study_type_html += "Genotype";
							}
						}
						if(data[0]['phen_count'] != undefined) {
							if(parseInt(data[0]['phen_count']) > 0) {
								if(study_type_html.includes('Genotype')) {
									study_type_html += " x ";
								}
								study_type_html += "Phenotype";
							}
						}
						console.log('study_type_html', study_type_html);
						if(study_type_html != "") {
							$("#tree-study-type-label").removeClass("hidden");
							$("#tree-study-type").removeClass("hidden");
							$("#tree-study-type").html(study_type_html);
						}
					}
					catch (err) {
						console.log(err);
					}
					
					
					try {
						if(data[0].endangered_cites_status > 0) {
							if(data[0].endangered_cites_status != 'null' && data[0].endangered_cites_status != null) {
								$("#tree-endangered-container").removeClass("hidden");
								$("#tree-endangered-status").html('<i class="fas fa-exclamation-triangle"></i>' + data[0].endangered_cites_status);
							}
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}
					
					try {
						if(data[0].accession.length > 0) {
							$("#tree-pub-link").removeClass("hidden");
							$("#tree-pub-link").text("View Additional Details");
							$("#tree-pub-link").attr("href", "https://treegenesdb.org/tpps/details/" + data[0].accession);
						}
					}
					catch(err) {
						if(debug) {
							console.log(err);
						}
					}


					try {
						$.ajax({
							url: Drupal.settings.base_url + "/cartogratree_uiapi/study_files/" + treeId.split("-")[0],
							dataType: "json",
							success: function (data) {
								console.log('study files', data);
								var keys = Object.keys(data);
								var study_files_html = '';
								if(keys.length > 0) {
									study_files_html += '<h2 style="font-size: 12px; color: #589a60; margin:0;padding:0; margin-bottom: 5px;">Study File Downloads</h2>';
									study_files_html += '<table>';
								}
								for(var i=0; i<keys.length; i++) {
									var key_name = keys[i];
									// console.log('key_name', key_name);
									// console.log('data[key_name]', data[key_name]);
									if (key_name == 'organisms') {
										$('#study-organisms-csv').html('');
										var organisms = data[key_name];
										console.log('study organisms_array', organisms);
										var organisms_html = "";
										for(var j=0; j<organisms.length; j++) {
											if(j>0) {
												organisms_html += ', '
											}
											organisms_html += organisms[j];
										}
										$('#study-organisms-csv').html(organisms_html);
									}
									else if (key_name == 'phenotype-files') {
										// console.log('data[key_name]',data[key_name]);
										// console.log('IT CAME HERE');
										// console.log('data[key_name].length',Object.keys(data[key_name]).length);
										var keys2 = Object.keys(data[key_name]);
										if (keys2.length > 0) {
											// console.log('keys2', keys2);
											for(var j=0; j<keys2.length; j++) {
												var key2_name = keys2[j];
												// console.log('key2_name', key2_name);
												// console.log('data[key_name][key2_name]', data[key_name][key2_name]);
												if(data[key_name][key2_name]['filename'] != null) {
													study_files_html += '<tr>';
													study_files_html += '<td style="padding: 5px; padding-left: 0px;">' + data[key_name][key2_name]['organism_name']+ ' Phenotype File</td>';
													study_files_html += '<td style="padding: 5px;"><a href="' + data[key_name][key2_name]['url'] + '"><i style="color: #5eb761;" class="fas fa-download"></i></a></td>';
													study_files_html += '</tr>';
												}
											}
										}
									}									
									else if (key_name == 'tree-accession-files') {
										// console.log('data[key_name]',data[key_name]);
										// console.log('IT CAME HERE');
										// console.log('data[key_name].length',Object.keys(data[key_name]).length);
										var keys2 = Object.keys(data[key_name]);
										if (keys2.length > 0) {
											// console.log('keys2', keys2);
											for(var j=0; j<keys2.length; j++) {
												var key2_name = keys2[j];
												// console.log('key2_name', key2_name);
												// console.log('data[key_name][key2_name]', data[key_name][key2_name]);
												if(data[key_name][key2_name]['filename'] != null) {
													study_files_html += '<tr>';
													study_files_html += '<td style="padding: 5px; padding-left: 0px;">Tree Accession</td>';
													study_files_html += '<td style="padding: 5px;"><a href="' + data[key_name][key2_name]['url'] + '"><i style="color: #5eb761;" class="fas fa-download"></i></a></td>';
													study_files_html += '</tr>';
												}
											}
										}
									}
									else if (key_name == 'genotype-snp-files') {
										// console.log('data[key_name]',data[key_name]);
										// console.log('IT CAME HERE');
										// console.log('data[key_name].length',Object.keys(data[key_name]).length);
										var keys2 = Object.keys(data[key_name]);
										if (keys2.length > 0) {
											// console.log('keys2', keys2);
											for(var j=0; j<keys2.length; j++) {
												var key2_name = keys2[j];
												// console.log('key2_name', key2_name);
												// console.log('data[key_name][key2_name]', data[key_name][key2_name]);
												if(data[key_name][key2_name]['filename'] != null) {
													study_files_html += '<tr>';
													study_files_html += '<td style="padding: 5px; padding-left: 0px;">Genotype SNP Assay</td>';
													study_files_html += '<td style="padding: 5px;"><a href="' + data[key_name][key2_name]['url'] + '"><i style="color: #5eb761;" class="fas fa-download"></i></a></td>';
													study_files_html += '</tr>';
												}
											}
										}
									}
									else if (key_name == 'genotype-ssrs-files') {
										// console.log('data[key_name]',data[key_name]);
										// console.log('IT CAME HERE');
										// console.log('data[key_name].length',Object.keys(data[key_name]).length);
										var keys2 = Object.keys(data[key_name]);
										if (keys2.length > 0) {
											// console.log('keys2', keys2);
											for(var j=0; j<keys2.length; j++) {
												var key2_name = keys2[j];
												// console.log('key2_name', key2_name);
												// console.log('data[key_name][key2_name]', data[key_name][key2_name]);
												if(data[key_name][key2_name]['filename'] != null) {
													study_files_html += '<tr>';
													study_files_html += '<td style="padding: 5px; padding-left: 0px;">Genotype SSRs/cpSSRs</td>';
													study_files_html += '<td style="padding: 5px;"><a href="' + data[key_name][key2_name]['url'] + '"><i style="color: #5eb761;" class="fas fa-download"></i></a><span style="margin-left: 20px;">'+ data[key_name][key2_name]['organism_name'] + '</span></td>';
													study_files_html += '</tr>';
												}
											}
										}
									}
									if (key_name == 'genotype-assaydesign-files') {
										// console.log('data[key_name]',data[key_name]);
										// console.log('IT CAME HERE');
										// console.log('data[key_name].length',Object.keys(data[key_name]).length);
										var keys2 = Object.keys(data[key_name]);
										if (keys2.length > 0) {
											// console.log('keys2', keys2);
											for(var j=0; j<keys2.length; j++) {
												var key2_name = keys2[j];
												// console.log('key2_name', key2_name);
												// console.log('data[key_name][key2_name]', data[key_name][key2_name]);
												if(data[key_name][key2_name]['filename'] != null) {
													study_files_html += '<tr>';
													study_files_html += '<td style="padding: 5px; padding-left: 0px;">Genotype Assay Design</td>';
													study_files_html += '<td style="padding: 5px;"><a href="' + data[key_name][key2_name]['url'] + '"><i style="color: #5eb761;" class="fas fa-download"></i></a></td>';
													study_files_html += '</tr>';
												}
											}
										}
									}																																				
								}
								if(keys.length > 0) {
									study_files_html += '</table>';
									$('#study-download-files').removeClass('hidden');
									$('#study-download-files').html(study_files_html);
								}								
							}
						});
					}
					catch(err) {
						if(debug) {
							console.log(debug);
						}
					}
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
					console.log(xhr.responseText);
				}
			}
		});	

		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/phenotypes?api_key=" + Drupal.settings.ct_api + "&tree_id=" + treeId,
			dataType: "json",
			success: function (data) {
				console.log('Phenotype data', data);
				var cvtermsSet = {};
				for (var i = 0; i < data.length; i++) {
					if (cvtermsSet[data[i].cvterm_name] == undefined) {
						$("#tree-phenotypes").append("    <span class='badge badge-success'>" + data[i].cvterm_name + "</span>");
						cvtermsSet[data[i].cvterm_name] = true;
					}
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
					console.log(xhr.responseText);
				}
			}
		});	

		/*
		$.ajax({
			url: "https://tgwebdev.cam.uchc.edu/cartogratree/api/v2/markertypes?api_key=" + Drupal.settings.ct_api + "&tree_id=" + treeId,
			dataType: "json",
			success: function (data) {
				console.log("MARKER TYPES");
				console.log(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				console.log({
					textStatus
				});
				console.log({
					errorThrown
				});
					console.log(xhr.responseText);
			}
		});*/	
	}

	function resetTreeModalData() { 		
		$("#tree-pub-title").text(""); 
		$("#tree-pub-title").addClass("hidden");
		
		$("#tree-pub-author").text("");
 		$("#tree-pub-author").addClass("hidden");
		
		$("#tree-pub-year").text(""); 
		$("#tree-pub-year").addClass("hidden");
		
		$("#tree-markers").text(""); 	
		$("#tree-markers").addClass("hidden");	
		$("#tree-markers-label").addClass("hidden");
		
		$("#tree-study-associated-container").addClass("hidden");
		$("#tree-phenotypes-container").addClass("hidden");
		
		$("#tree-study-type").text(""); 	
		$("#tree-study-type").addClass("hidden");	
		$("#tree-study-type-label").addClass("hidden");		

		$("#tree-pub-link").addClass("hidden");
		$("#tree-pub-link").attr("href", "#");	
		$("#tree-pub-link").text("No Publication info found");

		$("#tree-phenotypes-label").addClass("hidden");
 		$("#tree-phenotypes").addClass("hidden");
		$("#tree-phenotypes").html("");

		$('#tree-endangered-container').addClass("hidden");
		$('#tree-endangered-status').html("");

		$('#tree-more-info-phenotype-container').html("");
		$('#tree-more-info-label').html("");

		
	}


	function renderTreeDetails(data) {

		$('#tree-coord-type').html('Approximate');
		$('#tree-details .btn-primary[data-target="#tree-more-info"]').show();
		

		var sourceName = "TreeGenes";
		if(debug) {
			console.log("renderTreeDetails function");
			console.log(data);
		}
		var treeId = data.uniquename;
		var sourceId = data.source_id;
		resetTreeModalData();

		$('#tree-more-info-label-species').html(data.species);

		console.log('tree source_id', data.source_id);
		console.log('species', data.species);
		if (data.source_id == 1  || data.source_id == 5) {
			// If treesnap tree, set the button label to Collection Info (Tree Popup window)
			$('.btn[data-target="#tree-more-info"]').html('Collection Info');
			$('.add-all-study-plants').html('Add all collection plants');
			sourceName = "TreeSnap";

			// Perform a lookup of the tree_id to get the collection name which we will then display on the
			// 'study details' popup.
			$.ajax({
				url: Drupal.settings.ct_nodejs_api + "/v2/trees/treesnap/collection_name_lookup_by_tree_id?tree_id=" + treeId,
				dataType: "json",
				success: function (data) {
					if (data.length > 0) {
						console.log('Collection name response: ', data);
						$("#treesnap-collection-container").removeClass("hidden");					
						$("#treesnap-collection-container").html('<h2 style="padding: 0px;">Treesnap Collection: ' + data[0]['category'] + '</h2>');
						
						$.ajax({
							url: Drupal.settings.base_url + "/cartogratree_uiapi/get_evome_data/" + treeId,
							dataType: "json",
							success: function (evome_data) {
								console.log('evome_data', evome_data);
								for (var i = 0; i<evome_data.length; i++) {
									var evome_row = evome_data[i];
									if (evome_row['name'] == 'willowTreeSampleId') {
										$("#treesnap-collection-container").append('<div style="color: #FFFFFF;margin-top:10px;margin-left: 3px;background-color: #589a60;display: inline-block;padding: 2px;border-radius: 2px;">EVOME Sample ID: ' + evome_row['value'] + '</div>');
									}
								}
							}
						});
						// $("#treesnap-collection-container").append('<div id="sample_id"></div>');
						
						
						// Lookup the number of plants in this collection
						$.ajax({
							url: Drupal.settings.ct_nodejs_api + "/v2/trees/treesnap/collection_lookup_by_tree_id?tree_id=" + treeId,
							dataType: "json",
							success: function (data) {
								if (data.length > 0) {
									console.log('Collection data: ', data);
									$("#treesnap-collection-container").append('<div style="margin-left: 5px; margin-top: 5px;">There are ' + data.length + ' plants in this Treesnap collection</div>')
								}
							}
						});
					}
				}
			});



			if (treeImgsStore[treeId] == undefined) {
				$.ajax({
					url: Drupal.settings.ct_nodejs_api + "/v2/tree/treesnap?api_key=" + Drupal.settings.ct_api + "&tree_id=" + treeId,
					dataType: "json",
					async: false,
					success: function (tsData) {
						console.log('treesnap-data', tsData);
						$("#tree-submitter").text("Taken by: " + tsData.submitter);
						$("#tree-collection-date").text("Collection date: " + tsData.collection_date);
						try {
						updateTreeImgs(tsData.data.images, data.species);
						}
						catch (err) {
							console.log('ERROR FOR TREESNAP IMAGES:' + err);
						}
						try {
							treeImgsStore[treeId] = {"submitter": tsData.submitter, "collection_data": tsData.collection_date, "images": tsData.images.images};
						}
						catch (err) {
							console.log(err);
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
							console.log(xhr.responseText);
						}
						// updateTreeImgs(undefined, "dummy_value");
						updateTreeImgs(undefined, data.species);
					}
				});	
			}
			else {	
				$("#tree-submitter").text("Taken by: " + treeImgsStore[treeId]["submitter"]);
				$("#treesnap-collection-date").text("Collection date: " + treeImgsStore[treeId]["collection_date"]);
				updateTreeImgs(treeImgsStore[treeId], data.species);
			}
		}
		else {
			// If not a treesnap tree, set the button label to Study Info (Tree Popup window)
			$('.btn[data-target="#tree-more-info"]').html('Study Info');
			$('.add-all-study-plants').html('Add all study plants');
			$("#treesnap-collection-container").addClass("hidden");
			updateTreeImgs([], data.species);
			/*
			if(data.source_id == 2) {
				sourceName = "Data Dryad";
				treeId = treeId.split("--")[1];
				
			}
			else {
				//get genotype, phenotype and publication data
				if (treeId.includes("TGDR")) {
					getTreegenesData(treeId);
				}
			}*/
			if(data.source_id == 0) {
				getTreegenesData(treeId);
			}
			else if(data.source_id == 2) {
				sourceName = "Data Dryad";
				if(data.uniquename.includes('TGDR')) {
					getTreegenesData(treeId);
				}
				else {
					treeId = treeId.split("--")[1];				
					getTreegenesData(treeId);
				}
			}
			else if(data.source_id == 3) {
				sourceName = 'BIEN';
				$('#tree-details .btn-primary[data-target="#tree-more-info"]').hide();
				data.coordinate_type = 0;
			}

			$("#tree-submitter").text("This is a default image");
		}

		var source_id = data.source_id;

		// perform biome lookup
		// console.log("IT CAME HERE");
		$('#biome-info-container').hide();
		var biome_url = Drupal.settings.base_url + "/cartogratree_uiapi/get_biome_by_treeid/" + treeId;
		$.ajax({
			url: biome_url,
			dataType: "json",
			success: function (data) {
				console.log(biome_url);
				console.log(data);
				console.log(data.length);
				if(data.length == undefined) {
					// No data available
					// $('#biome-number').html("Unavailable");
					$('#biome-desc').html("No biome number could be retrieved.");
					$('#biome-info-container').hide();
				}
				else if(data.length > 0) {
					console.log(data);
					var biome_row = data[0];
					// $('#biome-number').html(biome_row['biome']);
					$('#biome-desc').html(biome_row['biome_desc']);
					$('#biome-info-container').show();
				}
			}
		});	
		

		// We need to cater for treeIds that are clones by retrieving from the parent
		// Put here so we can use it for phenotypes query and also genotypes query
		var tree_id_parts = treeId.split('-', 3);
		var genotype_treeId = '';
		if(tree_id_parts.length >= 3) {
			genotype_treeId = tree_id_parts[0] + '-' + tree_id_parts[1];
		}
		else {
			genotype_treeId = treeId;
		}

		if (tree_id_parts[0].includes('treesnap')) {
			$('#tree-markers-count-label').hide();
			$('#tree-markers-count').hide();
		}
		else {
			$('#tree-markers-count-label').show();
			$('#tree-markers-count').show();
		}

		$('#tree-phenotypes-count-label').hide();
		$('#tree-phenotypes-count').hide();	
		if (tree_id_parts[0].includes('treesnap') == false) {
			//perform phenotypes count lookup	
			$.ajax({
				url: Drupal.settings.ct_nodejs_api + "/v2/phenotypes/count/all?api_key=" + Drupal.settings.ct_api + "&tree_id=" + genotype_treeId,
				dataType: "json",
				success: function (data) {
					console.log('Phenotypes for ' + genotype_treeId + ' count:');
					console.log(data);
					if(data.length > 0) {
						for (var i = 0; i < data.length; i++) {
							$('#tree-phenotypes-count').html(data[i].c1);
							if(data[i].c1 > 0) {
								$('#tree-phenotypes-count-label').show();
								$('#tree-phenotypes-count').show();
							}
						}
					}

				}
			});	
		}	

		//perform phenotypes lookup
		// Cancel any previous tree_phenotypes ajax_calls lookup 
		console.log('Cancelling ajax_calls[tree_phenotypes]');
		try { cartograplant.ajax_calls['tree_phenotypes'].abort(); } catch (err) { console.log(err) }
		$('#tree-specific-unique-phenotypes-container').hide();
		$('#tree-more-info-phenotype-container').html('Looking up phenotype data for ' + treeId + '... <img style="height: 16px;" src="' + loading_icon_src + '" />');
		$('#tree-more-info-phenotype-container').show();
		cartograplant.ajax_calls['tree_phenotypes'] = $.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/phenotypes?api_key=" + Drupal.settings.ct_api + "&tree_id=" + treeId,
			dataType: "json",
			success: function (data) {
				if(data.length > 0) {
					$('#tree-more-info-phenotype-container').show();
					if(debug) {
						console.log('Phenotypic data');
						console.log(data);
					}
					var cvtermsSet = {};
					var phenotype_html = "";
					$('#tree-more-info-phenotype-container').html();
					phenotype_html = phenotype_html + "<h3 style='padding-top: 0px;padding-bottom: 5px;margin-left: 3px; margin-bottom: 10px;'>Plant Phenotypic Data</h3>";
					phenotype_html = phenotype_html + "<table id='more_info_phenotype_table' style='width: 100%;'>";
					phenotype_html = phenotype_html + "<tr><th>Plant ID</th><th>Name</th><th>Value</th><th>Units</th><th>Structure</th><th>Observation</th></tr>";
					var unique_phenotypes_count = 0;
					if(data.length > 0) {
						unique_phenotypes_count = data.length;
						//set icon if it does not exist in the map summary by number of plants
						if($("#plants_details_phenotype_icon").length) {

						}
						else {
							var icon = '<i id="plants_details_phenotype_icon" title="Plants contain phenotypic data" class="fas fa-eye"></i>';
							$("#plants_details_icons").append(icon);
						}


					}
					// else {
					// 	// $('#tree-specific-unique-phenotypes-container').hide();
					// 	// Also show unique phenotypes tree specific container with details
					// 	// $('#tree-specific-unique-phenotypes-container').show();
					// 	// $('#tree-specific-unique-phenotypes-count').html(data.length);						
					// }
					for (var i = 0; i < data.length; i++) {

						// Patch due to Emily changing the column name of new_pheno_view from phenotype_name to synonym
						if (data[i]['synonym'] != undefined) {
							data[i]['name'] = data[i]['synonym'];
						}
						if (data[i]['name'] == undefined) {
							console.log('phenotype name was null or undefined', data[i]['name']);
							continue;
						}

						for (var k in data[i]) {
							//console.log('KEY:' + k);
							//console.log('VAL:' + data[i][k]);
							//if (data[i].hasOwnProperty(k)) {
						   if(data[i][k] == "null" || data[i][k] == "NULL" || data[i][k] == null || data[i][k] == 'NA') {
							   data[i][k] = "-";
						   }
							//}
						}					
						if (cvtermsSet[data[i].cvterm_name] == undefined) {
							$("#tree-phenotypes").append("    <span class='badge badge-success'>" + data[i].cvterm_name + "</span>");
							cvtermsSet[data[i].cvterm_name] = true;
						}
						if(data[i].name.startsWith('diameterNumeric') || data[i].name.startsWith('willowSample') || data[i].name.startsWith('willowSpecies') || data[i].name.startsWith('otherLabel') || data[i].name.startsWith('heightNumeric') || data[i].value == 'NA' || data[i].value == '' || data[i].value == '-') {
							//don't add to the list to clean up the list
							unique_phenotypes_count = unique_phenotypes_count - 1;
						}
						else {
							if(data[i].mapped_name == '' || data[i].mapped_name == undefined) {
								data[i].mapped_name = data[i].name;
							}
							console.log(data[i].mapped_name);
							
							data[i].units = data[i].units.replace('"]','');
							data[i].units = data[i].units.replace('["','');
							data[i].units = data[i].units.charAt(0).toUpperCase() + data[i].units.slice(1);
							data[i].value = data[i].value.replace('"]','');
							data[i].value = data[i].value.replace('["','');	
							if(data[i].observable_accession != "") {
								data[i].mapped_name = "<a target='_blank' href='https://www.ebi.ac.uk/ols/search?exact=true&q=" + data[i].observable_accession + "'>" + data[i].mapped_name + "</a>";
							}
							if(data[i].confidence != "NULL" && data[i].confidence != "-" && data[i].confidence != undefined) {
								data[i].mapped_name = data[i].mapped_name + ' [' + data[i].confidence + ']';
							}
							
							data[i].structure_name = "<a target='_blank' href='http://browser.planteome.org/amigo/search/ontology?q=" + data[i].structure_accession.replace('_',':') + "'>" + data[i].structure_name + "</a>";
							data[i].observable_name = "<a target='_blank' href='https://www.ebi.ac.uk/ols/search?exact=true&q=" + data[i].observable_accession + "'>" + data[i].observable_name + "</a>";
							//http://browser.planteome.org/amigo/search/ontology?q=
							//https://www.ebi.ac.uk/ols/search?exact=true&q=

							// If this is a treesnap tree, use the units as the cvterm_name
							if(data[i].tree_acc.startsWith('treesnap')) {
								data[i].cvterm_name = data[i].units;
							}

							// If cvterm_name is '-', use data[i].units
							if(data[i].cvterm_name == '-') {
								data[i].cvterm_name = data[i].units;
							}

							// If cvterm is NULL, replace it back with a - (this happens with the new_pheno_view at the moment)
							if (data[i].cvterm_name == undefined) {
								data[i]['cvterm_name'] = '-';
							}

							phenotype_html = phenotype_html + "<tr><td>"  + data[i]['tree_acc'] + "</td><td>" + data[i].mapped_name + "</td><td>" + data[i].value + "</td><td>" + data[i].cvterm_name + "</td><td>" +  data[i].structure_name +"</td><td>" + data[i].observable_name + "</td></tr>";	
						}
					}
					phenotype_html = phenotype_html + "</table>";
					$('#tree-more-info-phenotype-container').html(phenotype_html);

					if(unique_phenotypes_count > 0) {
						// Also show unique phenotypes tree specific container with details
						$('#tree-specific-unique-phenotypes-container').show();
						$('#tree-specific-unique-phenotypes-count').html(unique_phenotypes_count);
					}
					
					if(sourceId == 1) {
						//console.log('Removing PO NAME column');
						//$('#more_info_phenotype_table th:nth-child(4)').addClass('hidden'); //remove PATO NAME header
						//$('#more_info_phenotype_table td:nth-child(4)').addClass('hidden'); //remove PATO NAME data column						
						
						//$('#more_info_phenotype_table th:nth-child(6)').addClass('hidden'); //remove PO NAME header
						//$('#more_info_phenotype_table td:nth-child(6)').addClass('hidden'); //remove PO NAME data column
					}
					
					//Hide PATO Accession column since we add it as a link to the PATO name
					//$('#more_info_phenotype_table th:nth-child(5)').addClass('hidden'); //remove PATO ACCESSION header
					//$('#more_info_phenotype_table td:nth-child(5)').addClass('hidden'); //remove PATO ACCESSION data column					
					
				}
				else {
					$('#tree-more-info-phenotype-container').html();
					$('#tree-more-info-phenotype-container').hide();
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
					console.log(xhr.responseText);
				}
				$('#tree-more-info-phenotype-container').hide();
			}
		});
		


		//perform genotypes count lookup
		//IGNORE THIS SINCE WE CAN GET THE COUNTS VIA THE /v2/publications API we likely also
		//call in the process of rendering the tree details popup
		// $('#tree-markers-count-label').hide();
		// $('#tree-markers-count').hide();
		// $.ajax({
		// 	url: Drupal.settings.ct_nodejs_api + "/v2/genotypes/count/all?api_key=" + Drupal.settings.ct_api + "&tree_id=" + genotype_treeId,
		// 	dataType: "json",
		// 	success: function (data) {
		// 		console.log('Genotypes/Markers for ' + genotype_treeId + ' count:');
		// 		console.log(data);
		// 		if(data.length > 0) {
		// 			for (var i = 0; i < data.length; i++) {
		// 				$('#tree-markers-count').html(data[i].c1);
		// 				if(data[i].c1 > 0) {
		// 					$('#tree-markers-count-label').show();
		// 					$('#tree-markers-count').show();
		// 				}
		// 			}
		// 		}
		// 	}
		// });		

		//perform genotypes lookup
		$('#tree-specific-unique-genotypes-container').hide();
		// $('#tree-more-info-genotype-container').hide();
		// $('#tree-specific-unique-genotypes-count-label').hide();
		// $('#tree-specific-unique-genotypes-count').hide();
		if (tree_id_parts[0].includes('treesnap') == false) {
			// Cancel any previous tree_genotypes ajax lookup 
			console.log('Cancelling ajax_calls[tree_genotypes]');
			try { cartograplant.ajax_calls['tree_genotypes'].abort(); } catch (err) {}			
			$('#tree-more-info-genotype-container').html('Looking up genotype data for ' + treeId + '... <img style="height: 16px;" src="' + loading_icon_src + '" />');
			$('#tree-more-info-genotype-container').show();
			// Perform a tree_genotypes ajax lookup
			cartograplant.ajax_calls['tree_genotypes'] = $.ajax({
				url: Drupal.settings.ct_nodejs_api + "/v2/genotypes?api_key=" + Drupal.settings.ct_api + "&tree_id=" + genotype_treeId,
				dataType: "json",
				success: function (data) {
					console.log('Genotypes for ' + genotype_treeId + ':');
					console.log(data);				
					var tpps_study = '';
					var genotype_html = '';
					genotype_html += "<h3 style='padding-top: 0px;padding-bottom: 5px;margin-left: -3px; margin-bottom: 10px;'>Plant Genotypic Data</h3>";
					genotype_html += "<table id='more_info_genotype_table' style='width: 100%;'>";
					genotype_html += "<tr><th>Plant ID</th><th>Marker Name</th><th>Genotype</th><th>Marker Type</th></tr>";				
					if(data.length > 0) {

						$('#tree-specific-unique-genotypes-container').show();
						$('#tree-specific-unique-genotypes-count-label').show();
						$('#tree-specific-unique-genotypes-count').show();
						$('#tree-specific-unique-genotypes-count').html(data.length);

						$('#tree-more-info-genotype-container').show();
						$('#tree-more-info-genotype-container').html();
						if(debug) {
							console.log('Genotypic data');
							console.log(data);
						}
						var count = 0;
						if(data.length > 0) {
							//set icon if it does not exist in the map summary by number of plants
							if($("#plants_details_genotype_icon").length) {

							}
							else {
								var icon = '<i id="plants_details_genotype_icon" title="Plants contain genotypic data" class="fas fa-dna"></i>';
								$("#plants_details_icons").append(icon);
							}
						}			
						if (data.length <= 15) {
							count = data.length;
						}
						else {
							count = 15;//only allow 15
						}
						for (var i = 0; i < count; i++) {
							for (var k in data[i]) {
								//console.log('KEY:' + k);
								//console.log('VAL:' + data[i][k]);
								//if (data[i].hasOwnProperty(k)) {
							if(data[i][k] == "null" || data[i][k] == "NULL" || data[i][k] == null) {
								data[i][k] = "-";
							}
								//}
							}

							if(i==0 && data[i].tree_acc.includes('TGDR')) {
								tpps_study = data[i].tree_acc.split('-')[0];
							}
							genotype_html +=  "<tr><td>" + data[i].tree_acc + "</td><td>" + data[i].marker_name + "</td><td>" + data[i].description + "</td><td>" + data[i].marker_type + "</td></tr>";
							//genotype_html = genotype_html + "<tr><td>" + data[i].uniquename.replace('-' + data[i].description, '') + "</td><td>" + data[i].description + "</td><td>" + data[i].marker_type + "</td></tr>";
						}
					}
					else {
						$('#tree-more-info-genotype-container').html('');
						$('#tree-more-info-genotype-container').hide();

						// $('#tree-specific-unique-genotypes-container').show();
						// $('#tree-specific-unique-genotypes-count').html(data.length);					
					}
					genotype_html += "</table>";
					
					if(data.length > 15) {
						if(tpps_study != '') {
							genotype_html += "More markers are available for this plant, <a target='_blank' href='/tpps/details/" + tpps_study + "'>click here to view all</a>";
						}
						else {
							genotype_html += "More markers are available for this plant.<br />";
						}
					}

					if (data.length <= 0) {
						genotype_html += "<p style='padding: 5px;'>No genotypes were found for this specific plant</p>";
					}
					
					$('#tree-more-info-genotype-container').html(genotype_html);
					$('#tree-more-info-genotype-container').show();				
				},
				error: function(err) {
					$('#tree-more-info-genotype-container').hide();
				}
			});
		}
		else {
			$('#tree-more-info-genotype-container').hide();
		}

		$("#tree-family").text(data.family == null ? "Unidentified" : data.family);
		if (data.family == null) {
			$("#tree-family").hide();
		}
		else {
			$("#tree-family").show();
		}
		//$("#tree-plant-group").text(data.subkingdom == null ? "Unidentified" : data.subkingdom);
		$("#tree-species").text(data.species);

		// Lookup species information to populate the species-details-info modal
		$('#species-details-info-title').html('<h2>' + data.species + ' overview' + '</h2>');
		$.ajax({
			url: Drupal.settings.base_url + '/cartogratree_uiapi/get_genomes_by_species_text/' + data.species,
			method: 'GET',
			success: function(data) {
				console.log('get_genomes_by_species_text', data);
				for (var i =0; i<data.length; i++) {
					var g_html = '';
					g_html += '<div class="row w-100">';
					g_html += '<div class="col-2">';
					g_html += '<div class="tag" style="background-color: #000000; color: #FFFFFF; margin-right: 10px;">FTP</div>';
					g_html += '<a target="_blank" href="' + Drupal.settings.base_url + '/FTP/Genomes/' + data[i].ftp + '/' + data[i].sourceversion + '/genome">';
					g_html += data[i].sourceversion;
					g_html += '</a>';
					g_html += '</div>';
					g_html += '<div class="col-8">';
					g_html += '<div class="tag" style="background-color: #000000; color: #FFFFFF; margin-right: 10px;">PUBLICATION</div>';
					if (data[i].pub_link == null) {
						data[i].pub_link = '';
					}
					if (data[i].uniquename == null) {
						data[i].uniquename = 'Publication title could not be retrieved.';
					}
					g_html += '<a target="_blank" href="' + data[i].pub_link + '">';
					g_html += data[i].uniquename;
					g_html += '</a>';
					g_html += '</div>';
					g_html += '</div>';
					$('#species-details-info-body-genomes-container').html(g_html);
				}
			}
		});

		$.ajax({
			url: Drupal.settings.base_url + '/cartogratree_uiapi/get_studies_by_species_text/' + data.species,
			method: 'GET',
			success: function(data) {
				console.log('get_studies_by_species_text', data);
				for (var i =0; i<data.length; i++) {
					var g_html = '';
					g_html += '<div class="row w-100">';
					g_html += '<div class="col-2">';
					g_html += '<div class="tag" style="background-color: #000000; color: #FFFFFF; margin-right: 10px;">STUDY</div>';
					g_html += '<a target="_blank" href="' + Drupal.settings.base_url + '/tpps/details/' + data[i].accession + '">';
					g_html += data[i].accession;
					g_html += '</a>';
					g_html += '</div>';
					g_html += '<div class="col-8">';
					// g_html += '<div class="tag" style="background-color: #000000; color: #FFFFFF; margin-right: 10px;">TITLE</div>';
					g_html += '<a>';
					g_html += data[i].name;
					g_html += '</a>';
					g_html += '</div>';
					g_html += '</div>';
					$('#species-details-info-body-studies-container').html(g_html);
				}
			}
		});

		$("#tree-source").text(sourceName);
		$("#tree-id").text('');
		$("#tree-id").text(treeId);
		try {
			console.log('Trying to set elevation from cache...');
			if(data.elevation != undefined) {
				$("#tree-elevation").text('Elevation: ' + data.elevation + ' m');
			}
			else {
				$("#tree-elevation").text('Elevation: Unknown');
			}
		}
		catch(err) {

		}
		$("#tree-more-info-label").text(treeId);
		$("#tree-specific-info-label").text(treeId);
		$("#tree-coord-type").text(data.coordinate_type == 0 ? "Exact" : "Approximate");
		$("#tree-coordinates").text(roundHundredths(data.latitude) + " Lat | " + roundHundredths(data.longitude) + " Lon");
		
		$("#tpps-link").html("");
		if ((sourceName == "TreeGenes" && treeId.includes("TGDR")) || (sourceName == "Data Dryad" && treeId.includes("TGDR"))) {
			// $("#tpps-link").append("<a href='https://treegenesdb.org/tpps/details/" + treeId.split("-")[0] + "' target='_blank'><button class='btn btn-success'>Study TPPS Link</button></a>");
		}
	
		$("#tree-details").removeClass("hidden");
		$("#hide-tree-details").prop("disabled", false);
	}

	cartograplant.searchTreeDataStore = searchTreeDataStore;
	function searchTreeDataStore(nameKey){
		//console.log('searchTreeDataStore for ' + nameKey);
		for (var i=0; i < cartograplant.treeDataStore.length; i++) {
			//console.log(treeDataStore[i]);
			if (cartograplant.treeDataStore[i].tree_id === nameKey) {
				if(debug) {
					console.log('Found an item using searchTreeDataStore');
				}
				return cartograplant.treeDataStore[i];
			}
		}
		return undefined;
	}

	cartograplant.getTreeData = getTreeData;
	function getTreeData(treeId, view = true, coordKey = null) {
		if(coordKey == null) {
			coordKey = current_coordKey;
		}
		else {
			current_coordKey = coordKey;
		}
		if(debug) {
			console.log('getTreeData() function');
			console.log('coordKey:' + coordKey);
		}
		console.log('treeId:' + treeId);
		if(treeId != undefined) { //make sure the treeId is valid and not undefined
			var lon = null;
			var lat = null;
			if(coordKey != null) {
				var lonlat = coordKey.split('_');
				lat = lonlat[0];
				lon = lonlat[1];
			}
			if (searchTreeDataStore(treeId) == undefined) {
				console.log("searchTreeDataStore function found an undefined tree with tree_id:" + treeId);
				$.ajax({
					url:  Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_id=" + treeId,
					dataType: "json",
					async: false,
					success: function (data) {
						if(debug) {
							console.log('-- success tree data:');
							console.log(data);
						}
						if(view == true) {
							renderTreeDetails(data);
							//console.log('DEBUG: TREEDATASTORE LENGTH:' + treeDataStore.length);
							$('#tree-elevation').text('Elevation: Unknown');
							if(coordKey != null) {
								//get elevation
								$.ajax({
									url: "https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/" + lon + "," + lat + ".json?layers=contour&limit=5&access_token=" + mapboxgl.accessToken,

								}).done(function(data_elevation) {
									// Get all the returned features
									var allFeatures = data_elevation.features;
									console.log(allFeatures);
									// Create an empty array to add elevation data to
									var elevations = [];
									// For each returned feature, add elevation data to the elevations array
									for (i = 0; i < allFeatures.length; i++) {
									  elevations.push(allFeatures[i].properties.ele);
									}
									//console.log(elevations);
									var highestElevation = Math.max(...elevations);
									if(highestElevation != undefined) {
										data.elevation = highestElevation;
										$('#tree-elevation').text('Elevation: ' + highestElevation + ' m');
									}
									treeDataStore.push({'tree_id':data.uniquename, 'data':data});
									//console.log('DEBUG: TREEDATASTORE LENGTH:' + treeDataStore.length);
								});
							}
							else {
								treeDataStore.push({'tree_id':data.uniquename, 'data':data});
								//console.log('DEBUG: TREEDATASTORE LENGTH:' + treeDataStore.length);
							}
						}
						else {
							treeDataStore.push({'tree_id':data.uniquename, 'data':data});
							//console.log('DEBUG: TREEDATASTORE LENGTH:' + treeDataStore.length);
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
							console.log(xhr.responseText);
						}
					}
				});		
			}
			else {
				if(view == true) { 
					//renderTreeDetails(treeDataStore[treeId]);
					var tree_data = searchTreeDataStore(treeId).data;
					renderTreeDetails(tree_data);
					//$('#tree-elevation').text('Elevation: ' + tree_data.elevation + ' m');
				}
			}
		}
	}


	$('#tree-details-prev-tree').click(function() {
		console.log(cartograplant.clickedTrees);

		// Get current active
		var current_tree_button = $("#tree-ids-list button.active");
		console.log('Current tree button: ' + current_tree_button);
		console.log(current_tree_button);
		var current_tree_button_id = current_tree_button.attr('id');
		var current_index = cartograplant.clickedTrees.indexOf(current_tree_button_id);
		if(current_index > 0) {
			current_tree_button.removeClass("active");
			current_index = current_index - 1; // this is the prev tree
			$('#' + cartograplant.clickedTrees[current_index]).click();
		}

		/*
		$(this).parent().parent().find("button.active").removeClass("active");
		$(this).addClass("active");
	
		console.log(this.id);	
		getTreeData(this.id);	
		*/	
	});

	$('#tree-details-next-tree').click(function() {
		console.log(cartograplant.clickedTrees);

		// Get current active
		var current_tree_button = $("#tree-ids-list button.active");
		console.log('Current tree button: ' + current_tree_button);
		console.log(current_tree_button);
		var current_tree_button_id = current_tree_button.attr('id');
		console.log('Current button id: ' + current_tree_button_id);
		var current_index = cartograplant.clickedTrees.indexOf(current_tree_button_id);
		if(current_index < cartograplant.clickedTrees.length - 1) {
			current_tree_button.removeClass("active");
			current_index = current_index + 1; // this is the prev tree
			$('#' + cartograplant.clickedTrees[current_index]).click();
		}		
	});	


	cartograplant.showTreeDetails = showTreeDetails;
	function showTreeDetails(coordKey) {
		console.log('showTreeDetails:');
		console.log(coordKey);
		//console.log(clickedTrees);
		getTreeData(cartograplant.clickedTrees[0], true, coordKey);
		$("#add-all-trees").removeClass("active");

		var activeTreesCount = 0;
		$("#tree-ids-list").html("");
		for (var i = 0; i < cartograplant.clickedTrees.length; i++) {
			
			var treeId = cartograplant.clickedTrees[i];
			var treeId_text = '';
			//console.log("TREEID:" + treeId);
			if(treeId == undefined) {

			}
			else {
				treeId_text = treeId;
				if(treeId.startsWith('TGDR')) {
					var treeId_split_parts = treeId_text.split("-",3);
					if(treeId_split_parts.length > 2) {
						treeId_text = treeId_split_parts[1] + '-' + treeId_split_parts[2];
					}
					else {
						treeId_text = treeId_split_parts[1];
					}
				}
				else if(treeId.startsWith('treesnap')) {
					treeId_text = treeId_text.split(".")[1];
				}
				var sourceSymbol = "TG";
				if (treeId.indexOf("treesnap") >= 0) {
					sourceSymbol = "TS";
				}
				else if (treeId.indexOf("dryad") >= 0) {
					sourceSymbol = "DD";
				}
				if (treeId.toLowerCase().includes("dryad")) {	
					treeId = treeId.split("--")[1];
				}
			}



			var activeClass = "";
			if (cartograplant.activeTrees[treeId] != undefined && cartograplant.activeTrees[treeId]) {
				activeClass = "active";
				activeTreesCount++;
			}
			

			var tree_id_html = "";
			tree_id_html += "<div class='w-90 row justify-content-center' style='margin: 2px;'>";
			tree_id_html += '<div class="col-2" style="padding: 2px;">';
			tree_id_html += '<button class="btn btn-success single-tree-more-info" style="padding: 9px;" data-toggle="tooltip" data-placement="bottom" title="Get more plant details"><i style="font-size: 1vw;" class="fas fa-info-circle"></i></button>';
			tree_id_html += '</div>';
			tree_id_html += '<div class="col-5" style="padding: 2px;">';
			tree_id_html += "<button style='padding-left: 2px; padding-right: 2px; font-size: 0.8vw;' class='btn btn-primary tree-ids-select tree-selected' data-toggle='tooltip' data-placement='bottom' title='The ID of this tree.' id='" + cartograplant.clickedTrees[i] + "'>";
			tree_id_html += treeId_text;
			tree_id_html += "</button>";
			tree_id_html += '</div>';
			tree_id_html += '<div class="col-3" style="padding: 2px;">';
			tree_id_html += "<a style='font-size: 1.3vw; padding: 6px' class='btn btn-success add-tree " + activeClass + "' data-toggle='tooltip' data-placement='bottom' title='Add this plant for analysis.'>";
			tree_id_html += ' <i class="fas fa-plus-square"></i>';
			tree_id_html += "</a>"
			tree_id_html += '</div>';
			tree_id_html += "</div>";
			$("#tree-ids-list").append(tree_id_html);/*<span class='badge badge-info' data-toggle='tooltip' data-placement='left' data-html='true' title='Tree data source. <br/> TG = TreeGenes <br/> TS = TreeSnap <br/> DD = DataDryad.'>" + sourceSymbol + "</span>");*/
		}
		$('#add-all-trees').html('Add Selected<br />Plants (' + cartograplant.clickedTrees.length + ')');

		console.log('Checking to see if we need to hide the tree-ids-select buttons', cartograplant.clickedTrees.length);
		if(cartograplant.clickedTrees.length > 1) {
			$('.tree-ids-select').show();
		}
		else {
			$('.tree-ids-select').hide();
			$('.add-tree').attr('style', 'width: 70% !important');
		}

		if (activeTreesCount == cartograplant.clickedTrees.length) {
			$("#add-all-trees").addClass("active");
		}
		
		if(cartograplant.clickedTrees.length <= 1) {
			$("#add-all-trees").addClass("hidden");
		}
		else {
			$("#add-all-trees").removeClass("hidden");
		}
		
		$("#tree-ids-list").first().children().children(":first").addClass("active");
	}

	cartograplant.positionMap = positionMap;
	function positionMap() {
		if (mapState.zoom != null) {
			map.setZoom(mapState.zoom);
			map.setPitch(mapState.pitch);
			map.setBearing(mapState.bearing);
			map.setCenter([mapState.center.lng, mapState.center.lat]);
		}
	}
	
	function resetFilters() {
		map_unique_species = [];
		geojson_unique_species = [];
		$("#builder").queryBuilder("reset");
		
		filterQuery = {};	
		// getAllTrees(function(data) {
		// 	setData(data);
		// 	initMapSummary(data.length);

		// 	setCurrentDatasetData(-1, null); // -1 is to reset
		// });
		
		// activeDatasets[0] = true;
		// activeDatasets[1] = true;
		// activeDatasets[2] = true;

		for(var i=0; i<= 2; i++) {
			var dataset_name = Object.keys(datasetKey)[i];
			if ($('#' + dataset_name + '-data').hasClass('active')) {
				$('#' + dataset_name + '-data').trigger('click'); // unclick
			}
		}


		for(var i=0; i<= 2; i++) {
			var dataset_name = Object.keys(datasetKey)[i];
			$('#' + dataset_name + '-data').trigger('click'); // click
		}		



		/*
		for (var k in datasetKey) {
			activeDatasets[datasetKey[k]] = true;
			if(k.includes('geoserver_tileset')) {
				$("#" + k + "-data").trigger('click');
			}
			else {
				$("#" + k +"-data").addClass("active");
			}
			
		}
		*/
			
	}

	//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ END ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\\
	cartograplant.getClimUnits = getClimUnits;
	function getClimUnits(valueName) { 			
		//a mapping of the name of the stored variables from the climate layers from geoserver to the appropriate units of measurement 			
		var climUnits = { 				
			"minimum_temperature": "°C", 				
			"maximum_temperature": "°C", 				
			"avg_temperature": "°C", 				
			"Precipitation": "mm", 				
			"Solar_radiation": "kJ m<sup>-2</sup> day<sup>-1</sup>", 				
			"wind_speed": "m s<sup>-1</sup>", 				
			"Water_vapor_pressure": "kPa", 			
		} 			
		return climUnits.hasOwnProperty(valueName) ? climUnits[valueName] : "";			
	}

	
	//requests the environmental data located at a particular point from geoserver
	cartograplant.addEnvData = addEnvData;
	function addEnvData(htmlEle, bbox, renderedFeatures, e = null) {
		$(htmlEle).html("");
		//var baseUrl = "https://tgwebdev.cam.uchc.edu/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=";
		var baseUrl = "https://treegenesdb.org/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=";
		// goes through each active layer, and adds the bounding box, and layer to be queried to the request url
		let activeLayers = layersList.getActiveLayers();
		if(debug) {
			console.log('Original bounding box - not used - overriden by details in: https://gis.stackexchange.com/questions/307407/how-to-query-features-of-raster-layers-hosted-on-geoserver-that-are-added-to-map?rq=1');
			console.log(bbox);
			console.log('Event object containing points clicked:');
			console.log(e);
			//console.log(e.point);
			/*
			var x = 0;
			var y = 0;
			if (e != null) {
				x = Math.round(e.point.x);
				y = Math.round(e.point.y);
			}
			*/
			console.log(activeLayers);
		}
		for (var i = 0; i < activeLayers.length; i++) {
			//console.log(Drupal.settings.layers);
			if(debug) {
				console.log('activeLayers:' + activeLayers[i]);
			}
			var envLayer = Drupal.settings.layers[activeLayers[i]];
			if(envLayer == undefined && activeLayers[i].includes('_tileset')) {
				//this is a dataset layer but still a vector tileset layer from geoserver
				/*
				if(activeLayers[i] == 'bien_geoserver_tileset') {
					envLayer = {'name':'ct:bienv4_w_props', 'host': '0', 'layer_type': 'geoserver_tileset'};
				}
				*/
				envLayer = {'name': datasetGeoserverLayerConfig[activeLayers[i]].layerName, 'host': '0', 'layer_type': 'geoserver_tileset'};
				console.log(envLayer);
			}
			if(debug) {
				console.log('envLayer');
				console.log(envLayer);
			}
			if (envLayer.host === "0") {
				//Original
				//var getInfoUrl = baseUrl + envLayer.name + "&LAYERS=" + envLayer.name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&STYLES=&BBOX=" + bbox;
				
				//Alter 1 - not working
				//var getInfoUrl = baseUrl + envLayer.name + "&LAYERS=" + envLayer.name + "&INFO_FORMAT=application%2Fjson&I=" + x + "&J=" + y + "&WIDTH=256&HEIGHT=256&CRS=EPSG%3A4326&STYLES=&BBOX=" + bbox;
				
				/* Dear the heavens! */
				
				//https://gis.stackexchange.com/questions/307407/how-to-query-features-of-raster-layers-hosted-on-geoserver-that-are-added-to-map?rq=1
				var r = 6378137 * Math.PI * 2;
				var x = (e.lngLat.lng / 360) * r;
				var sin = Math.sin(e.lngLat.lat * Math.PI / 180);
				var y = 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI * r;
				
				var zoom = map.getZoom();
				if(debug) {
					console.log(zoom);
				}

				var x2 = Math.round((e.point.x / e.originalEvent.screenX) * 256);
				var y2 = Math.round((e.point.y / e.originalEvent.screenY) * 256);
				if(debug) {
					console.log('This is just me trying to translate the current click x and y into a point on a 256 x 256 tile - this could be totally wrong');
					console.log('X2:' + x2);
					console.log('Y2:' + y2);
				}
				//Factor in the mapzoom
				var offset = 100 + (Math.pow(2,(21 - zoom - 2)));
				if(debug) {
					console.log('OFFSET:');
					console.log(offset);

					console.log('X:' + x + ' used to create bounding box');
					console.log('Y:' + y + ' used to create bounding box');
				}
				var bbox_temp = (x-offset) + ',' + (y-offset) + ',' + (x+offset) + ',' + (y+offset);
				if(debug) {
					console.log('This is the bounding box generated:');
					console.log(bbox_temp);
				}

				//Get feature data for this click for this specific layer
				displayGeoserverLayersData(envLayer, bbox);				

				var getInfoUrl = "";
				if(envLayer.layer_type == null) {
					envLayer.layer_type = '';
				}
				if(envLayer.layer_type.includes('geoserver_tileset') == false) {
					// DEPRECATED since we already call displayGeoserverLayersData function previously
					// which has more features (options) and technically handles multiple layers
					// and integrates with the CT ADMIN UI

					// getInfoUrl = baseUrl + envLayer.name + "&LAYERS=" + envLayer.name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
					// $.ajax({
					// 	url: getInfoUrl,
					// 	dataType: "text",
					// 	success: function(data) {
					// 		if(debug) {
					// 			console.log(data);
					// 		}
					// 		var featureProps = JSON.parse(data).features[0].properties;
					// 		//get the id of the layer requested from the url
					// 		var thisLayer = Drupal.settings.fields[(this.url).split("QUERY_LAYERS=")[1].split("&LAYERS")[0]];

					// 		//will check if the layer returned has a name already specified
					// 		var layerName = thisLayer == undefined ? "" : thisLayer["Human-readable name for the layer"]

					// 		//add the layer value and name to the detailed tree popup
					// 		if (layerName !== "") {
					// 			for (var k in featureProps) {
					// 				var feature = featureProps[k];
					// 				var units = getClimUnits(k);
					// 				if (!isNaN(feature)) {
					// 					feature = roundHundredths(feature);
					// 				}
					// 				var layerHTML = "<li class='list-group-item d-flex justify-content-between align-items-center '>" + layerName + "<span class='text-muted'>"; 
					// 				layerHTML += feature + " " + units + "</span></li>";
					// 				$(htmlEle).append(layerHTML);
					// 			}	
					// 		}
					// 	},
					// 	error: function (xhr, textStatus, errorThrown) {
					// 		if(debug) {
					// 			console.log({
					// 				textStatus
					// 			});
					// 			console.log({
					// 				errorThrown
					// 			});
					// 			console.log(xhr.responseText);
					// 		}
					// 	}
					// });
				}
				else {
					//This is a geoserver tileset layer
					console.log(e);
					getInfoUrl = "https://treegenesdb.org/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName="+ envLayer.name + "&maxFeatures=50&outputFormat=csv&BBOX=" + bbox_temp;
					console.log('WFS Feature data url (csv):' + getInfoUrl);
					$.ajax({
						url: getInfoUrl,
						dataType: "text",
						success: function(data) {
							if(debug) {
								console.log(data);
							}
							var lines = data.split("\n");
							var id_index = -1;
							var species_index = -1;
							
							cartograplant.clickedTrees = [];
							var column_headers = [];
							var id_index = -1;
							var latitude_index = -1;
							var longitude_index = -1;
							var latitude = undefined;
							var longitude = undefined;
							if(lines.length > 1) {
								for(var line_index = 0; line_index < lines.length; line_index++) {
									var line = lines[line_index];
									console.log(line);
									if(line_index == 0) {
										//this is the csv headers
										column_headers = line.toLowerCase().split(",");	
										id_index = column_headers.indexOf('id');
										latitude_index = column_headers.indexOf('latitude');
										longitude_index = column_headers.indexOf('longitude');
									}
									else {
										var column_data = line.split(",");
										// It's possible to receive a blank line in which case
										// so check to make sure column_data is more than 0
										// before adding the clickTrees array which the UI 
										// code uses to add buttons in the tree detail popup
										if (column_data.length > 1) {
											cartograplant.clickedTrees.push(column_data[id_index]);
											
											latitude = column_data[latitude_index];
											longitude = column_data[longitude_index];
											//we only need one tree for the location
										}
										
									}
								}
								if(latitude != undefined && longitude != undefined) {
									var coordKey = latitude + '_' + longitude;
									console.log('Showing tree details for geoserver tileset layer');
									showTreeDetails(coordKey);								
								}
								else {
									latitude = e.lngLat.lat;
									longitude = e.lngLat.lng;
									var coordKey = latitude + '_' + longitude;
									console.log('Showing tree details for geoserver tileset layer');
									showTreeDetails(coordKey);	
								}
							}
							
							/*
							var featureProps = JSON.parse(data).features[0].properties;
							//get the id of the layer requested from the url
							var thisLayer = Drupal.settings.fields[(this.url).split("QUERY_LAYERS=")[1].split("&LAYERS")[0]];

							//will check if the layer returned has a name already specified
							var layerName = thisLayer == undefined ? "" : thisLayer["Human-readable name for the layer"]

							//add the layer value and name to the detailed tree popup
							if (layerName !== "") {
								for (var k in featureProps) {
									var feature = featureProps[k];
									var units = getClimUnits(k);
									if (!isNaN(feature)) {
										feature = roundHundredths(feature);
									}
									var layerHTML = "<li class='list-group-item d-flex justify-content-between align-items-center '>" + layerName + "<span class='text-muted'>"; 
									layerHTML += feature + " " + units + "</span></li>";
									$(htmlEle).append(layerHTML);
								}	
							}
							*/
						},
						error: function (xhr, textStatus, errorThrown) {
							if(debug) {
								console.log({
									textStatus
								});
								console.log({
									errorThrown
								});
								console.log(xhr.responseText);
							}
						}
					});					
				}
				
				if(debug) {
					console.log(getInfoUrl);
				}

			}
			else if (envLayer.host === "1") {
				if(debug) {
					console.log(renderedFeatures);
				}
				for (var l in renderedFeatures) {
					if (renderedFeatures.hasOwnProperty(l)) {
						for (var k in layersList.mapboxLayers) {
							for (var j = 0; j < layersList.mapboxLayers[k].length; j++) {
								if (renderedFeatures[l].layer.id == layersList.mapboxLayers[k][j]) {
									if (envLayer.title === "Major Soil Groups") {
										var soilHTML = "<li class='list-group-item d-flex justify-content-between align-items-center'>Soil Type <span class='text-muted'>";
										soilHTML += renderedFeatures[l].properties.value + "</span></li>";
										soilHTML += "<li class='list-group-item d-flex justify-content-between align-items-center'>Soil Descr <span class='text-muted' style='text-align:right'>";
										soilHTML += renderedFeatures[l].properties.grp_descr + "</span></li>";
										$(htmlEle).append(soilHTML);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	/* IN PROGRESS */
	function displayGeoserverLayersData(envLayer, bbox) {

		// Pull layer embedded fields that need to be hidden (layer_embedded_fields_hide) before
		// pulling data from the Geoserver API for embedded data




		var url_uiapi_get_layer_embedded_fields_hide = Drupal.settings.base_url + '/cartogratree_uiapi/get_layer_embedded_fields_hide/' + envLayer.layer_id;
		var xhr = $.ajax({
			url: url_uiapi_get_layer_embedded_fields_hide,
			dataType: "json",
			success: function(data_fields_hide) {

				console.log('Layer Embedded Fields to hide:');
				console.log(data_fields_hide);

				var url_uiapi_get_layer_embedded_fields_rename = Drupal.settings.base_url + '/cartogratree_uiapi/get_layer_embedded_fields_rename/' + envLayer.layer_id;
				var xhr1 = $.ajax({
					url: url_uiapi_get_layer_embedded_fields_rename,
					dataType: "json",
					success: function(data_fields_rename) {
		

						console.log('Layer Embedded Fields to rename:');
						console.log(data_fields_rename);
						console.log(data_fields_rename['layer_embedded_fields_rename']);
						var replace_keys = [];
						var replace_keys_new = [];
						console.log(data_fields_rename['layer_embedded_fields_rename'].length);
						for(var field_rename_iterator = 0; field_rename_iterator < data_fields_rename['layer_embedded_fields_rename'].length; field_rename_iterator++) {
							console.log('field_rename_iterator:' + field_rename_iterator);
							console.log(data_fields_rename['layer_embedded_fields_rename'][field_rename_iterator]);
							replace_keys.push(data_fields_rename['layer_embedded_fields_rename'][field_rename_iterator].split(',')[0]);
							replace_keys_new.push(data_fields_rename['layer_embedded_fields_rename'][field_rename_iterator].split(',')[1]);
						}	
						console.log(replace_keys);
						console.log(replace_keys_new);		

						/*
						* The code below will pull geoserver layer embedded data for display on the UI
						*/




						console.log('displayGeoserverLayersData:' + envLayer.name);
						console.log(envLayer);
						//var getInfoUrl = "https://treegenesdb.org/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName="+ envLayer.name + "&maxFeatures=50&outputFormat=csv&BBOX=" + bbox;
						var baseUrl = "https://treegenesdb.org/geoserver/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&QUERY_LAYERS=";
						var getInfoUrl = baseUrl + envLayer.name + "&LAYERS=" + envLayer.name + "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=&BBOX=" + bbox;
						console.log(getInfoUrl);
						var xhr2 = $.ajax({
							url: getInfoUrl,
							dataType: "text",
							success: function(data) {
								if (debug) {
									console.log(data);
								}
								try {
									var featureProps = JSON.parse(data).features[0].properties;
									console.log(featureProps);
									console.log(envLayer);
									var layer_text_element = '<div style="font-size: 11px; text-transform: uppercase;width: 100%; background-color: #18bb70; color: #FFFFFF; padding: 4px;">Environmental layer: ' + envLayer.title + '</div>';
									$('.environmental-values').append(layer_text_element);
									var table_container = '<table id="env_layer_' + envLayer.layer_id +  '_values" style="width: 100%;"></table>';
									$('.environmental-values').append(table_container);
									for (var k in featureProps) {
										var feature = featureProps[k];
										console.log(k);
										console.log('feature:' + feature);
										if (feature !== " " && feature !== "") { 
											if(data_fields_hide['layer_embedded_fields_hide'].includes(k)) {
												//hide it
												console.log('Hiding embedded field with key:' + k + ' and values:' + feature);
											}
											else {
												if(isFloat(feature)) {
													//try to round precision to 3 decimal places
													if(envLayer.layer_embedded_data_decimal_precision != null) {
														feature = feature.toFixed(envLayer.layer_embedded_data_decimal_precision);
													}
													else {
														// if null, precision should be set to 3
														feature = feature.toFixed(3);
													}
												}
												var url_uiapi_get_layer_embedded_data_eval = Drupal.settings.base_url + '/cartogratree_uiapi/get_layer_embedded_data_eval/' + envLayer.layer_id;
												console.log(url_uiapi_get_layer_embedded_data_eval);
												perform_layer_embedded_data_eval(url_uiapi_get_layer_embedded_data_eval, k, feature, replace_keys, replace_keys_new, envLayer, bbox);
											}
										}
										//var units = getClimUnits(k);
									}					
								}
								catch (err) {
									console.log(err);
								}

								/*
								var lines = data.split("\n");
								var id_index = -1;
								var species_index = -1;
								
								clickedTrees = [];
								var column_headers = [];
								var id_index = -1;
								var latitude_index = -1;
								var longitude_index = -1;
								var latitude = undefined;
								var longitude = undefined;
								if(lines.length > 1) {
									for(var line_index = 0; line_index < lines.length; line_index++) {
										var line = lines[line_index];
										console.log('displayGeoserverLayersData:' + line);
										if(line_index == 0) {
											//this is the csv headers
											column_headers = line.toLowerCase().split(",");	
											id_index = column_headers.indexOf('id');
										}
										else {
											var column_data = line.split(",");
											
											//latitude = column_data[latitude_index];
											//we only need one tree for the location
											
										}
									}
								}
								*/
							},
							error: function (xhr, textStatus, errorThrown) {
								if (debug) {
									console.log({
										textStatus
									});
									console.log({
										errorThrown
									});
									console.log(xhr.responseText);
								}
							}
						});

						var edl2 = {};
						edl2['xhr'] = xhr2;
						edl2['bbox'] = bbox;
						ajax_requests.environmental_data_lookups.data_lookup_objects.push(edl2);							

					}
				});

				var edl1 = {};
				edl1['xhr'] = xhr1;
				edl1['bbox'] = bbox;
				ajax_requests.environmental_data_lookups.data_lookup_objects.push(edl1);	
			}
		});	
		
		// Developer notes on handling ajax_requests
		// ajax_requests.environmental_data_lookups {
		// 	current_bbox (bbox value)
		// 	data_lookup_objects array
		//}
		// XMLHttpRequest.readyState
		// 0 UNSENT, 1 OPENED, 2 HEADERS_RECEIVED
		// 3 LOADING, 4 DONE

		// EDL (environmental data lookup object which should store bbox and the xhr request object)
		var edl = {};
		edl['xhr'] = xhr;
		edl['bbox'] = bbox;
		ajax_requests.environmental_data_lookups.current_bbox = bbox;

		// Clear up the old XHRs first
		for(var dlo_index=0; dlo_index < ajax_requests.environmental_data_lookups.data_lookup_objects.length; dlo_index++) {
			var data_lookup_object = ajax_requests.environmental_data_lookups.data_lookup_objects[dlo_index];
			if(data_lookup_object['bbox'] != ajax_requests.environmental_data_lookups.current_bbox) {
				// abort the xhr
				try {
					data_lookup_object.xhr.abort();
				}
				catch (err) {
					console.log(err);
				}

				// now remove it from the array
				ajax_requests.environmental_data_lookups.data_lookup_objects.splice(dlo_index, 1);
				dlo_index--;
			}			
		}


		ajax_requests.environmental_data_lookups.data_lookup_objects.push(edl);		


		// edl['bbox'] = bbox;
		// edl['xhr'] = xhr;
		// ajax_requests.environmental_data_lookups.current_bbox = bbox;
		// ajax_requests.environmental_data_lookups.data_lookup_objects.push(edl);
			
		// // Iterate through the other data_lookup_objects to make sure they are within the bbox else
		// // try to abort and also clear them from the array
		// console.log('Current size of data_lookup_objects', ajax_requests.environmental_data_lookups.data_lookup_objects.length);
		// for(var dlo_index=0; dlo_index < ajax_requests.environmental_data_lookups.data_lookup_objects.length; dlo_index++) {
		// 	var data_lookup_object = ajax_requests.environmental_data_lookups.data_lookup_objects[dlo_index];
		// 	console.log('data_lookup_object', data_lookup_object);
		// 	if(data_lookup_object.bbox != ajax_requests.environmental_data_lookups.current_bbox) {
		// 		// abort the xhr
		// 		try {
		// 			data_lookup_object.xhr.abort();
		// 		}
		// 		catch (err) {
		// 			console.log(err);
		// 		}

		// 		// now remove it from the array
		// 		ajax_requests.environmental_data_lookups.data_lookup_objects.splice(dlo_index, 1);
		// 		dlo_index--;
		// 	} 
		// }
		// console.log('After current size of data_lookup_objects', ajax_requests.environmental_data_lookups.data_lookup_objects.length);


	}

	function perform_layer_embedded_data_eval(url_uiapi_get_layer_embedded_data_eval, k, feature, replace_keys, replace_keys_new, envLayer, bbox) {
		var xhr = $.ajax({
			url: url_uiapi_get_layer_embedded_data_eval,
			dataType: "json",
			success: function(data_embedded_data_eval) {
				if(data_embedded_data_eval['layer_embedded_data_eval'].length != 0) {
					for(var data_embedded_data_eval_i = 0; data_embedded_data_eval_i < data_embedded_data_eval['layer_embedded_data_eval'].length; data_embedded_data_eval_i++) {
						var data_embedded_data_eval_parts = data_embedded_data_eval['layer_embedded_data_eval'][data_embedded_data_eval_i].split(',',2);
						var data_embedded_data_eval_part_name = data_embedded_data_eval_parts[0];
						console.log('data_embedded_data_eval_part_name:' + data_embedded_data_eval_part_name);
						var data_embedded_data_eval_part_value = data_embedded_data_eval_parts[1];
						console.log('data_embedded_data_eval_part_value:' + data_embedded_data_eval_part_value);
						console.log('data_embedded_data_eval_i:' + data_embedded_data_eval_i);
						console.log('k', k);
						if(data_embedded_data_eval_part_name == data_embedded_data_eval_i + 1) {
							eval(data_embedded_data_eval_part_value);
							var item_container = '<tr><td style="text-align: left; padding-left: 5px; width: 50%;">' + k.replaceAll('_',' ') + '</td><td style="width: 50%;">' +  feature + '</td></tr>';
							$('#env_layer_' + envLayer.layer_id +  '_values').append(item_container);																	
						}
						else if(data_embedded_data_eval_part_name == k) {
							//Check to see if any of the keys need to be renamed
							if(replace_keys.includes(k)) {
								for(var replace_keys_iterator=0; replace_keys_iterator < replace_keys.length; replace_keys_iterator++) {
									console.log('Replace_keys found k:' + k + ' with ' + replace_keys_new[replace_keys_iterator]);
									if(replace_keys[replace_keys_iterator] == k) {
										console.log('IF STATEMENT - Replace_keys found k:' + k + ' with ' + replace_keys_new[replace_keys_iterator]);
										k = replace_keys_new[replace_keys_iterator];
										break;
									}
								}
							}
							//eval("feature = feature + '_ok';");
							eval(data_embedded_data_eval_part_value);
							var item_container = '<tr><td style="text-align: left; padding-left: 5px; width: 50%;">' + k.replaceAll('_',' ') + '</td><td style="width: 50%;">' +  feature + '</td></tr>';
							$('#env_layer_' + envLayer.layer_id +  '_values').append(item_container);																	
						}
						else {
							var item_container = '<tr><td style="text-align: left; padding-left: 5px; width: 50%;">' + k.replaceAll('_',' ') + '</td><td style="width: 50%;">' +  feature + '</td></tr>';
							$('#env_layer_' + envLayer.layer_id +  '_values').append(item_container);	
						}
					}

				}
				else {
					//Check to see if any of the keys need to be renamed
					console.log('replace_keys', replace_keys);
					if(replace_keys.includes(k)) {
						for(var replace_keys_iterator=0; replace_keys_iterator < replace_keys.length; replace_keys_iterator++) {
							console.log('Replace_keys found k:' + k + ' with ' + replace_keys_new[replace_keys_iterator]);
							if(replace_keys[replace_keys_iterator] == k) {
								console.log('IF STATEMENT - Replace_keys found k:' + k + ' with ' + replace_keys_new[replace_keys_iterator]);
								k = replace_keys_new[replace_keys_iterator];
								break;
							}
						}
					}
					//console.log('It came here 3:' + k + "=" + feature);
					//eval("feature = feature + '_ok';");
					var item_container = '<tr><td style="text-align: left; padding-left: 5px; width: 50%;">' + k.replaceAll('_',' ') + '</td><td style="width: 50%;">' +  feature + '</td></tr>';
					$('#env_layer_' + envLayer.layer_id +  '_values').append(item_container);															
				}
			}
		});

		var edl = {};
		edl['xhr'] = xhr;
		edl['bbox'] = bbox;
		ajax_requests.environmental_data_lookups.data_lookup_objects.push(edl);			
	}

	function updateMapSummary(numTrees, numSpecies, numPubs, numLayers) {
		if(debug) {
			console.log(numTrees + " " + numSpecies + " " + numPubs);
		}
		if (numTrees != -1) {
			$("#num-trees").text(numTrees);
		}	
		/*
		//This seems to be a bug I found on 6/12/2020, mix up of the species in the pubs section and vice versa	
		if (numSpecies != -1) {
			$("#num-pubs").text(numSpecies);
		}		
		if (numPubs != -1) {
			$("#num-species").text(numPubs);
		}
		*/
		if (numSpecies != -1) {
			$("#num-species").text(numSpecies);
		}		
		if (numPubs != -1) {
			$("#num-pubs").text(numPubs);
		}		
		
		if (numLayers != -1) {
			$("#num-layers").text(numLayers);
		}		
	}

	function initMapSummary(numTrees) {
		geojson_unique_species = [];
		map_unique_species = [];
		$("#num-trees").text(numTrees);
		/*
		//Deprecated in favour of next ajax call which gets the actual species names (and so length can also be received)
		$.ajax({
			url: "https://tgwebdev.cam.uchc.edu/cartogratree/api/v2/stats/num/species",
			dataType: "json",
			success: function (data) {
				$("#num-species").text(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				console.log({
					textStatus
				});
				console.log({
					errorThrown
				});
				console.log(xhr.responseText);
			}
		});
		*/

		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/stats/unq/species?q=",
			dataType: "json",
			success: function (data) {
				var species_arr = data;
				geojson_unique_species = []; //reset the global array
				for(var i=0; i<species_arr.length; i++) {
					if(geojson_unique_species.includes(species_arr[i])) {
						//already exists
					}
					else {
						geojson_unique_species.push(species_arr[i]);
						map_unique_species.push(species_arr[i]);//since this is at boot, this would be the same as geojson_unique_species
					}
				}
				$("#num-species").text(map_unique_species.length);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			}
		});		

		$.ajax({
			url: Drupal.settings.ct_nodejs_api + "/v2/stats/num/pub",
			dataType: "json",
			success: function (data) {
				$("#num-pubs").text(data);
			},
			error: function (xhr, textStatus, errorThrown) {
				if(debug) {
					console.log({
						textStatus
					});
					console.log({
						errorThrown
					});
					console.log(xhr.responseText);
				}
			}
		});
	}

	function filterNotification(result) {
		// toastr.clear();
		toastr.remove();
		if (result == 0) {
			toastr.error("Filter successful </br> No trees found that match those parameters.");
		}
		else{
			// setTimeout(function() {
			// 	$('#num-trees').text(result);
			// }, 2000);
			toastr.success("Filter successful </br> Result: " + result + " trees.");
		}
	}
	
	/**
	 * The parser for the json object created from the query builder
	 * @param {JSON object} data - the json object created from the q builder
	 * @param {string} qString - the sql query string
	 */
	function parse_json_query(data, qString) {
		var opMapping = {"equal": "=", "not equal": "<>"}

		if (Object.keys(data).length == 0) {
			return "";
		}
		var cond = data["condition"];
		var rules = data["rules"];
		qString += "(";
		for (var i = 0; i < rules.length; i++) {
			if (rules[i]["condition"] != undefined) {
				//qString = parseJsonQuery(rules[i], qString); //OLD
				qString = parse_json_query(rules[i], qString); //BUG FIX? The name of the function was named incorrectly?
			}
			else {
				console.log('Rules operator', rules[i]["operator"]);
				if(rules[i]["field"] == "accession") {
					console.log('Found accession query in parse_json_query');
					qString += "uniquename ILIKE '" + rules[i]["value"] + "%'";  // ct_trees_all_view 
				}
				else {
					// Updated on 10/25/2024 to be more flexible with wildcards
					qString += rules[i]["field"] + " " + opMapping[rules[i]["operator"]] + " '" + rules[i]["value"] + "'";
					// if (rules[i]["operator"] == 'equal') {
					// 	qString += rules[i]["field"] + " ILIKE '%" + rules[i]["value"] + "%'";
					// }
					// else {
					// 	qString += rules[i]["field"] + " " + opMapping[rules[i]["operator"]] + " '" + rules[i]["value"] + "'";
					// }
				}
			}
			
		
			if (i < rules.length - 1) {
				qString += " " + cond + " ";
			}	
		}
		qString += ")";
		console.log('qString', qString);
		return qString;
	}
	
	function filterMap(mapInit = true, move = true) {
		try {
			clearInterval(Querystatusinterval);
		} catch (err) {}
		// Remove if any markers / trees were previously selected
		if (cartograplant.currMarker != null) {
			cartograplant.currMarker.remove();
		}

		// Remove the location popup if one already is showing
		try {
			$('.mapboxgl-popup-close-button').click();
		} catch (err) {}

		if(mapInit == true) {
			map_unique_species = [];//reset overall map unique species array
			geojson_unique_species = [];//reset overall geojson (sid:0,1,2) unique species array			
		}
		if(debug) {
			console.log('filterMap function executed:')
		}
		mapActivityStatus = 'map-filtering';
		mapStatusNotification('Updating map, please wait...','info',true, 3000, 0);
		
		var active = getActiveDatasets();
		if (active.length == 0) {
			setData([]);
			toastr.success("No datasets active.");
			try {
				// try to cancel any old ajax_requests
				ajax_requests['map_filtering'].abort();
			}
			catch (err) {
				console.log(err);
			}	
			
			$('map-dataset-loading-text-status').html('No actived datasets... download cancelled...');
			$('#map-dataset-loading').slideUp(1000);
			$('#map-summary-loading').slideUp(1000);
		}
		else {
			if (Object.keys(filterQuery) == 0 && active.length == 3 && getActiveDatasetsOfTypeGeoserverTileset().length <= 0) {
				// Try to abort all calls to ajax
				try {
					// try to cancel any old ajax_requests
					ajax_requests['map_filtering'].abort();
				}
				catch (err) {
					console.log(err);
				}

				

				// Check to see if default count is already cached and use the value, else continue to get it from getAllTrees function
				if(cartograplant.trees_count_cache['default'] != undefined) {
					initMapSummary(cartograplant.trees_count_cache['default']);
				}
				getAllTrees(function(data) {

					//addDatasetLayer(data);
					setData(data);
					var dataLength = data.length;
					if(cartograplant.trees_count_cache['default'] == undefined) {
						cartograplant.trees_count_cache['default'] = data.length;
						initMapSummary(dataLength);
					}
					
					filterNotification(dataLength);

					setCurrentDatasetData(0, data);	

					// This updates the unique species count object per layer for default map load (TG, Treesnap and DryAd defaulted)
					for(var i=0; i<3; i++) {
						updateUniqueSpeciesCount(i, ""); // "" is an empty filter
					}
				});	
			}
			else {
				if(debug) {
					console.log('-- filterQuery:');
					console.log(filterQuery);
				}

				var jsonData = {"query": filterQuery, "active_sources": active};
				var query_str = parse_json_query(jsonData.query,'');


				if(debug) {
					console.log('-- jsonData:' + JSON.stringify(jsonData, null, 2));
				}

				// We need to check to see if any of the layers are geoserver_tileset layers (like BIEN for example)
				if(debug) {
					console.log('-- active (dataset indexes):');
					console.log(active);
					console.log('-- layersList Object:');
					console.log(layersList);
				}
				$('#num-trees').text('0');
				
				for(var i=0; i<active.length; i++) {
					var dataset_index = active[i]; //you cannot just use i as the main index because this could vary
					
					// This updates the unique species count per enabled layer
					updateUniqueSpeciesCount(dataset_index, ''); // "" is an empty filter
					

					for(var j=0; j<Object.keys(datasetKey).length; j++) {
						var dataset_id = '';
						if(datasetKey[Object.keys(datasetKey)[j]] == dataset_index) {
							dataset_id = Object.keys(datasetKey)[j];
							if(debug) {
								console.log('-- Dataset ID:' + Object.keys(datasetKey)[j]);
							}
							
							if(dataset_id.includes('geoserver_tileset')) {
								//Get the layer from the layersList global object
								var objLayer = layersList.layers[dataset_id];
								var layer_name = layersList.layers[dataset_id][layer_name];
								if(debug) {
									console.log('-- Geoserver Layer:' + dataset_id);
									console.log(objLayer);
								}

								//Now we need to get the query processed from filterQuery object and convert it into a query string
								var cql_filter = parse_json_query(jsonData.query, '');
								
								var layer = dataset_id;


								//Remove the layer with the id as dataset_id, this sounds confusing but meant to make it easier
								layersList.deactivateLayer(layer);
								map.removeLayer(layer);
								map.removeSource(layer);
							
								//Add the layer back
								var layerObj = new GeoserverLayer(layer, new Legend(dataset_id), 1);	
								//if(dataset_id == 'bien_geoserver_tileset') {
									layerObj.setLayerName(datasetGeoserverLayerConfig[dataset_id].layerName);
									layerObj.setDatasetId(dataset_id);
								//}
								layerObj.setSourceMode('geoserver_tileset');
								layerObj.setCQLFilter(cql_filter);	
								layerObj.updateFilterSourceId(datasetKey[dataset_id]);			
								layerObj.addSource();
								layersList.addToMap(layerObj);
								layersList.activateLayer(layer);
								activeDatasets[datasetKey[dataset_id]] = true;
								layerObj.updateFeatureCount();
								/*
								if (query_conditions.length > 0) {
									query_str = query_str + " " + query_conditions + " AND (";
								}
								else {
									query_str = "SELECT DISTINCT ON(uniquename) * FROM ct_trees WHERE (";
								}
								*/
							}
							// break; // this was removed in the event there are multiple geoserver layers
						}
					}
					
				}				

				//This processed the geojson formatted layers from dataset 0,1,2,3 (TreeGenes via CT API) 
				try {
					// try to cancel any old ajax_requests
					ajax_requests['map_filtering'].abort();
				}
				catch (err) {
					console.log(err);
				}
				console.log('Query jsonData', jsonData);
				
				// Check if data is within cache
				var filterMapCacheKey = JSON.stringify(jsonData);
				if(cartograplant.filterMapCache[filterMapCacheKey] != undefined) {
					cartograplant.processFilterMapResults(mapInit, move, filterMapCache[filterMapCacheKey]);
				}
				else { // cache does not exist, perform manual pull from CT API

					ajax_requests['map_filtering'] = $.ajax({ 
						url: Drupal.settings.ct_nodejs_api + "/v2/trees/q?api_key=" + Drupal.settings.ct_api, 
						type: "POST",
						timeout: 120000,
						//async: mapInit ? true : false,
						async: true,
						xhr: xhr_progress,
						// xhr: function () {
						// 	var xhr = new window.XMLHttpRequest();
						// 	//Download progress
						// 	xhr.addEventListener("progress", function (evt) {
						// 		if (evt.lengthComputable) {
						// 			var percentComplete = evt.loaded / evt.total;
						// 			console.log('percent complete:' + Math.round(percentComplete * 100));
						// 			var percentCompleteRevised = Math.round(percentComplete * 100);
						// 			if($('#map-dataset-loading').css('display') == "none") {
						// 				$('#map-dataset-loading').slideDown(0);
						// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');

						// 				// Summary loading progress
						// 				$('#map-summary-loading').slideDown(0);
						// 				$('#map-summary-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
						// 			}
						// 			else {
						// 				$('#map-dataset-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Downloading filtered data (' + percentCompleteRevised + '%)');
						// 				$('#map-dataset-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
						// 				$('#map-dataset-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');

						// 				// Summary loading progress
						// 				$('#map-summary-loading-text-status').html('<img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" /> Map summary awaiting revised data... (' + percentCompleteRevised + '%)');
						// 				$('#map-summary-loading-progressbar-progress').css('width', percentCompleteRevised + '%');
						// 				$('#map-summary-loading-progressbar-progress-text').hide();
						// 				// $('#map-summary-loading-progressbar-progress-text').html(Math.round(evt.loaded / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB of ' + Math.round(evt.total / 1000).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' KB');									
						// 			}
						// 			// progressElem.html(Math.round(percentComplete * 100) + "%");
						// 		}
						// 	}, false);
						// 	return xhr;
						// },		
						contentType: "application/json", 
						data: JSON.stringify(jsonData),
						success: function(res) {
							$('#map-dataset-loading').slideUp(1000);
							$('#map-dataset-loading-progressbar-progress').css('width','100%');

							// Summary loading progress
							$('#map-summary-loading').slideUp(1000);
							$('#map-summary-loading-progressbar-progress').css('width', '100%');							
										
							
							console.log('res',res);
							// This is JSON stringified, zlib deflated and base 64 encoded so we need to undo that
							var base64Data = res.zlib_deflated_base64;
							// console.log('base64Data', base64Data);
							var compressData = atob(base64Data);
							var compressData = compressData.split('').map(function(e) {
								return e.charCodeAt(0);
							});				
							var inflate = new Zlib.Inflate(compressData);
							var output = inflate.decompress(); // UINT8Arra
							output = new TextDecoder().decode(output);
							// console.log('output', output);
							console.log(output);
							var res = JSON.parse(output);


							// Add this information to filterMapCache
							var filterMapCacheKey = JSON.stringify(jsonData);
							cartograplant.filterMapCache[filterMapCacheKey] = res;

							cartograplant.processFilterMapResults(mapInit, move, res);



							// Querystatus = '';
							// if(debug) {
							// 	console.log(res);
							// }

							// //update map_unique_species
							// var curr_unq_species = Object.keys(res['unq_species']);
							// if(debug) {
							// 	console.log('curr_unq_species:');
							// 	console.log(curr_unq_species);
							// 	console.log('map_unique_species under geojson query trees/q is:');
							// 	console.log(map_unique_species);
							// }
							// for(var index = 0; index < curr_unq_species.length; index++) {
							// 	if(map_unique_species.includes(curr_unq_species[index])) {
							// 		//already exists
							// 	}
							// 	else {
							// 		//add it to map_unique_species
							// 		map_unique_species.push(curr_unq_species[index]);
							// 		geojson_unique_species.push(curr_unq_species[index]);
							// 	}
							// }

							// if (mapInit) {
							// 	console.log('FILTERING MAPINIT TRUE');
							// 	var default_features_trees = []; //normal array of tree points
							// 	var dynamic_features_trees = {}; //object with sub arrays

							// 	var dynamic_dataset_source_ids = []; // this stores the source_ids  |___ both are linked by the same index number
							// 	var dynamic_dataset_keys = []; // this will store the key           |
							// 	for(var i=0; i<dynamicDatasetLayersKeys.length; i++) {
							// 		console.log('dynamicDatasetLayersKey: ', dynamicDatasetLayersKeys[i]);
							// 		dynamic_dataset_source_ids.push(datasetKey[dynamicDatasetLayersKeys[i]]);
							// 		dynamic_dataset_keys.push(dynamicDatasetLayersKeys[i]);
							// 	}
							// 	for(var i=0; i<res["features"].length; i++) {
							// 		if(dynamic_dataset_source_ids.includes(res["features"][i]["properties"]["sid"])) {
							// 			// we have to add this to the dynamic_features_trees object under the datasetkey name
							// 			var tmp_datasetkey = dynamic_dataset_keys[dynamic_dataset_source_ids.indexOf(res["features"][i]["properties"]["sid"])];
							// 			if (dynamic_features_trees[tmp_datasetkey] == undefined) {
							// 				dynamic_features_trees[tmp_datasetkey] = [];
							// 			}
							// 			dynamic_features_trees[tmp_datasetkey].push(res["features"][i]);
							// 		}
							// 		else {
							// 			default_features_trees.push(res["features"][i]);
							// 		}
							// 	}

							// 	for(var i=0; i < Object.keys(dynamic_features_trees).length; i++) {
							// 		var key = Object.keys(dynamic_features_trees)[i];
							// 		console.log('DynamicSource: dynamic-source-' + key)
							// 		setData(dynamic_features_trees[key], 'dynamic-source-' + key);
							// 		if(key == "wfid") {
							// 			setCurrentDatasetData(4, dynamic_features_trees[key]);	
							// 		}
							// 	}

							// 	//Now set the default features into the trees data source
							// 	setData(default_features_trees, 'trees');
							// 	setCurrentDatasetData(0, default_features_trees);	

							// 	// Original code for just trees
							// 	// setData(res["features"], 'trees');
							// }
							// else {
							// 	console.log("FILTERING MAPINIT FALSE");
							// 	addDatasetLayer(res["features"]);
							// }
							// var lng = res["center"][0];
							// var lat = res["center"][1];
							// console.log(res["features"][0]);
							// console.log('Center Point:');
							// try {
							// 	if(lng == null || lat == null) {
							// 		lng = res["center"][0] = res["features"][0]["geometry"]["coordinates"][0];
							// 		lat = res["center"][1] = res["features"][0]["geometry"]["coordinates"][1];
							// 	}
							// } 
							// catch (err) {

							// }
							// console.log(res["center"]);
							// if (lng != null && lat != null) {
							// 	if(debug) {
							// 		console.log(res["center"]);
							// 	}
							// 	//long must be between -180 to 180 and latitudes must be between -90 and 90
							// 	if(lng < -180 || lng > 180 || lat > 90 || lat < -90) {
							// 		if (move) {
							// 			try {
							// 				if(res["center"][0] < -180) {
							// 					res["center"][0] = -180;
							// 				}
							// 				else if(res["center"][0] > 180) {
							// 					res["center"][0] = 180;
							// 				}

							// 				if(res["center"][1] < -90) {
							// 					res["center"][1] = -90;
							// 				}
							// 				else if(res["center"][1] > 90) {
							// 					res["center"][1] = 90;
							// 				}
							// 				console.log(res["center"]);
							// 				panToCenterTrees(res["center"], 3);
							// 			}
							// 			catch(err) {
							// 				console.log(err);
							// 			}
							// 		}								
							// 		toastr.error("Filtered trees don't have valid coordinates");							
							// 		filterNotification(res["num_trees"]);
							// 	}
							// 	else {
							// 		if (move) {	
							// 			panToCenterTrees(res["center"], 6);
							// 		}
							// 		filterNotification(res["num_trees"]);
							// 	}
							// }		
							// else {
							// 	filterNotification(res["num_trees"]);
							// }
							
							// cartograplant.currently_filtered_trees = [];
							// for(var i=0; i < res["features"].length; i++) {
							// 	cartograplant.currently_filtered_trees.push(res["features"][i]["properties"]["id"]);
							// }
							// if(debug) {
							// 	console.log("Added " + res["features"].length + " trees to currently_filtered_trees");
							// }
							
							// //updateMapSummary(res["num_trees"] + parseInt($('#num-trees').text()), res["num_species"], res["num_pubs"]);
							// if(debug) {
							// 	console.log(map_unique_species.length);
							// }
							// updateMapSummary(res["num_trees"] + parseInt($('#num-trees').text()), map_unique_species.length, res["num_pubs"]);
						},	
						error: function (xhr, textStatus, errorThrown) {
							Querystatus = '';
							console.log({
								textStatus
							});
							console.log({
								errorThrown
							});
							if(errorThrown == '') {
								console.log('Most likely a timeout issue with the query');
								toastr.error("Filter failed: Query timeout");
							}
							else {
								toastr.error("Filter failed");
							}
							console.log(eval("(" + xhr.responseText + ")"));
						},
						done: function() {

						}
					});	

					//This code is used to keep the user notified that the filtering is still taking place (notification)
					Querystatus = 'IN PROGRESS';
					Querystatusinterval = setInterval(function() {
						if(Querystatus == 'IN PROGRESS') {
							toastr.clear();
							toastr.options = {
							"closeButton": false,
							"debug": false,
							"newestOnTop": false,
							"progressBar": true,
							"positionClass": "toast-top-right",
							"preventDuplicates": false,
							"onclick": null,
							"showDuration": "300",
							"hideDuration": "1000",
							"timeOut": "4500",
							"extendedTimeOut": "1000",
							"showEasing": "swing",
							"hideEasing": "linear",
							"showMethod": "fadeIn",
							"hideMethod": "fadeOut"
							}
							var filter_text_info = '';
							
							try {
								for(var i=0; i < filterQuery.rules.length; i++) {
									console.log('FilterQuery Rule ' + i, filterQuery.rules[i]);
									try {
										if(i > 0 && i < (filterQuery.rules.length - 1)) {
											filter_text_info = filter_text_info + ', ' + filterQuery.rules[i]['rules'][0].field + ' (' + filterQuery.rules[i]['rules'][0].value + ')';
										}
										else if(i > 0 && i == (filterQuery.rules.length - 1)) {
											filter_text_info = filter_text_info + ' and ' + filterQuery.rules[i]['rules'][0].field + ' (' + filterQuery.rules[i]['rules'][0].value + ')';
										}
										else {
											filter_text_info = filterQuery.rules[i]['rules'][0].field + ' (' + filterQuery.rules[i]['rules'][0].value + ')' + ' ';
										}
									}
									catch (err) {
										console.log('FilterQuery Rule error', err);
									}
								}
							}
							catch(err) {
								console.log(err);
							}
							
							
							
							toastr.info('Still awaiting ' + filter_text_info + ' filter results and latest count stats...');
						}
						else {
							//toastr.success('Filter complete');
							clearInterval(Querystatusinterval);
						}
					}, 5000);									
				}

			}	
		}
	}

	cartograplant.processFilterMapResults = processFilterMapResults;
	function processFilterMapResults(mapInit, move, res) {
		Querystatus = '';
		if(debug) {
			console.log(res);
		}

		//update map_unique_species
		var curr_unq_species = Object.keys(res['unq_species']);
		if(debug) {
			console.log('curr_unq_species:');
			console.log(curr_unq_species);
			console.log('map_unique_species under geojson query trees/q is:');
			console.log(map_unique_species);
		}
		for(var index = 0; index < curr_unq_species.length; index++) {
			if(map_unique_species.includes(curr_unq_species[index])) {
				//already exists
			}
			else {
				//add it to map_unique_species
				map_unique_species.push(curr_unq_species[index]);
				geojson_unique_species.push(curr_unq_species[index]);
			}
		}

		if (mapInit) {
			console.log('FILTERING MAPINIT TRUE');
			var default_features_trees = []; //normal array of tree points
			var dynamic_features_trees = {}; //object with sub arrays

			var dynamic_dataset_source_ids = []; // this stores the source_ids  |___ both are linked by the same index number
			var dynamic_dataset_keys = []; // this will store the key           |
			for(var i=0; i<dynamicDatasetLayersKeys.length; i++) {
				console.log('dynamicDatasetLayersKey: ', dynamicDatasetLayersKeys[i]);
				dynamic_dataset_source_ids.push(datasetKey[dynamicDatasetLayersKeys[i]]);
				dynamic_dataset_keys.push(dynamicDatasetLayersKeys[i]);
			}

			for(var i=0; i<res["features"].length; i++) {
				if(dynamic_dataset_source_ids.includes(res["features"][i]["properties"]["sid"])) {
					// we have to add this to the dynamic_features_trees object under the datasetkey name
					var tmp_datasetkey = dynamic_dataset_keys[dynamic_dataset_source_ids.indexOf(res["features"][i]["properties"]["sid"])];
					if (dynamic_features_trees[tmp_datasetkey] == undefined) {
						dynamic_features_trees[tmp_datasetkey] = [];
					}
					dynamic_features_trees[tmp_datasetkey].push(res["features"][i]);
				}
				else {
					default_features_trees.push(res["features"][i]);
				}
			}

			for(var i=0; i < Object.keys(dynamic_features_trees).length; i++) {
				var key = Object.keys(dynamic_features_trees)[i];
				console.log('DynamicSource: dynamic-source-' + key)
				setData(dynamic_features_trees[key], 'dynamic-source-' + key);
				if(key == "wfid") {
					setCurrentDatasetData(4, dynamic_features_trees[key]);	
				}
			}

			//Now set the default features into the trees data source
			setData(default_features_trees, 'trees');
			setCurrentDatasetData(0, default_features_trees);	

			// Original code for just trees
			// setData(res["features"], 'trees');
		}
		else {
			console.log("FILTERING MAPINIT FALSE");
			addDatasetLayer(res["features"]);
		}
		var lng = res["center"][0];
		var lat = res["center"][1];
		console.log(res["features"][0]);
		console.log('Center Point:');
		try {
			if(lng == null || lat == null) {
				lng = res["center"][0] = res["features"][0]["geometry"]["coordinates"][0];
				lat = res["center"][1] = res["features"][0]["geometry"]["coordinates"][1];
			}
		} 
		catch (err) {

		}
		console.log(res["center"]);
		if (lng != null && lat != null) {
			if(debug) {
				console.log(res["center"]);
			}
			//long must be between -180 to 180 and latitudes must be between -90 and 90
			if(lng < -180 || lng > 180 || lat > 90 || lat < -90) {
				if (move) {
					try {
						if(res["center"][0] < -180) {
							res["center"][0] = -180;
						}
						else if(res["center"][0] > 180) {
							res["center"][0] = 180;
						}

						if(res["center"][1] < -90) {
							res["center"][1] = -90;
						}
						else if(res["center"][1] > 90) {
							res["center"][1] = 90;
						}
						console.log(res["center"]);
						panToCenterTrees(res["center"], 3);
					}
					catch(err) {
						console.log(err);
					}
				}								
				toastr.error("Filtered trees don't have valid coordinates");							
				filterNotification(res["num_trees"]);
			}
			else {
				if (move) {
					var far_points = 0;
					if(res["features"].length > 0) {
						// check if points are far apart (like different continents)
						var lng_start = res["features"][0]["geometry"]["coordinates"][0];
						var lat_start = res["features"][0]["geometry"]["coordinates"][1];							
						for (var i=1; i<res["features"].length; i++) {
							var feature = res["features"][i];
							try {
								var lng_compare = res["features"][i]["geometry"]["coordinates"][0];
								var lat_compare = res["features"][i]["geometry"]["coordinates"][1];
								// console.log('Far point detection', lng_compare, lat_compare);
								if (lng_compare == null || lat_compare == null) {
									console.log('Null point feature detected', res["features"][i]);
								}
								if(Math.abs(lng_start - lng_compare) > 100) {
									far_points += 1;
								}
								else if(Math.abs(lat_start - lat_compare) > 60) {
									far_points += 1;								
								}

								// check for a midpoint to keep as center
								var point1 = turf.point([lng_start, lat_start]);
								var point2 = turf.point([lng_compare, lat_compare]);
								var midpoint = turf.midpoint(point1, point2);
								// console.log('Calculated midpoint', midpoint);
								res['center'][0] = midpoint['geometry']['coordinates'][0];
								res['center'][1] = midpoint['geometry']['coordinates'][1];
							}
							catch (err) {
								console.log('far_point feature with error', feature);
								console.log('far_points error', err);
							}
						}

						if(far_points == 0) {
							console.log('No far points were detected');
							
							panToCenterTrees(res["center"], 4);
						}
						else {
							panToCenterTrees([0,0], 1);
							console.log('Far points detected so do not zoom in');
						}
					}
				}
				filterNotification(res["num_trees"]);
			}
		}		
		else {
			filterNotification(res["num_trees"]);
		}
		
		cartograplant.currently_filtered_trees = [];
		for(var i=0; i < res["features"].length; i++) {
			cartograplant.currently_filtered_trees.push(res["features"][i]["properties"]["id"]);
		}
		if(debug) {
			console.log("Added " + res["features"].length + " trees to currently_filtered_trees");
		}
		
		//updateMapSummary(res["num_trees"] + parseInt($('#num-trees').text()), res["num_species"], res["num_pubs"]);
		if(debug) {
			console.log(map_unique_species.length);
		}

		// RISH TODO DOUBLE CHECK MORE 3/9/2023
		// updateMapSummary(res["num_trees"] + parseInt($('#num-trees').text()), map_unique_species.length, res["num_pubs"]);
		// This code stops the double counting which was the problem I encountered when filtering the SNPs as an example	
		updateMapSummary(res["num_trees"], map_unique_species.length, res["num_pubs"]);

		// Call check to see if any studies are detected from the filters
		console.log('Pop struct debug');
		var rule_filter_containers = $('.rule-container .rule-filter-container select');
		var rule_value_containers =  $('.rule-container .rule-value-container .selectized');
		// Search to see whether filter option is a study filter
		if(rule_filter_containers.length > 0) {
			$('#pop-struct-options-toggles').html('');
			console.log('rule_filter_containers found:' + rule_filter_containers.length);
			console.log('rule_value_containers found:' + rule_value_containers.length);
			for(var i=0; i<rule_filter_containers.length;i++) {
				var filter_element = rule_filter_containers.eq(i);
				var value_element = rule_value_containers.eq(i);
				console.log('pop struct study filter:', filter_element.val());
				if(filter_element.val() == "accession") {
					console.log('pop struct study value:' + value_element.val());

					// Check to see whether a pop_struct exists for this study
					if (Drupal.settings.popstruct_studies.includes(value_element.val())) {
						console.log('Adding pop struct UI toggle element');
						cartograplant.ui_add_pop_struct_toggle({
							caption: value_element.val() + ' Population Structure',
							name: value_element.val()
						});
					}
				}
			}
			if ($('#pop-struct-options-toggles').html() == '') {
				$('#pop-struct-options-container').slideUp(500); // hide since empty
			}
			else {
				$('#pop-struct-options-container').slideDown(500); // show since it contains content
			}
		}
	}

	cartograplant.updateUniqueSpeciesCount = updateUniqueSpeciesCount;
	function updateUniqueSpeciesCount(filter_sourceid = 0, filter = "", oncomplete_function = null) {
		var source_url_ctapi_species_count = "https://treegenesdb.org/cartogratree/api/v2/species/count?source_id=" + filter_sourceid + "&filter=" + filter;
		var species_list = "";
		var s_count = 0;
		if(debug) {
			console.log(source_url_ctapi_species_count);						
		}
		$.ajax({
			method: "GET",
			url: source_url_ctapi_species_count,
			dataType: "json",
			success: function (data) {
				if(debug) {
					console.log('Source URL CT API SPECIES COUNT:' + data.length);
				}
				//console.log(data);
				species_list = data;

				s_count = data.length;//this is array length
				//f_count = data.tree_count;
				//var current_num_trees_count = parseInt($("#num-trees").text()) + parseInt(data.tree_count);
				//$('#num-trees').text(current_num_trees_count);									
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
			cartograplant.unique_species[filter_sourceid] = species_list;
			console.log('unique species object', cartograplant.unique_species);
			if(debug) {
				console.log('-- Species list:');
				console.log(species_list);
			}

			if(oncomplete_function != null) {
				oncomplete_function();
			}
		
		});		
	}

	cartograplant.renderUserSessions = renderUserSessions;
	function renderUserSessions(sessions) {
		for (var i = 0; i < sessions.length; i++) {
			//var dateParts = sessions[i]["created_at"].split("-");
			var jsDate = new Date(sessions[i]["updated_at"].replace(" ", "T")).toLocaleString();// new Date(dateParts[0], dateParts[1] - 1);
			var config = "<a href='#session-" + i + "' data-toggle='collapse' aria-expanded='false' class='list-group-item saved-session list-group-item-action flex-column align-items-start'>";
			config += "<div class='d-flex w-100 justify-content-between'><h4 class='mb-1 session-title'>" + sessions[i]["title"];
			config += "</h4><h5>" + jsDate + " <i class='fas fa-clock'></i></h5></div><div class='d-flex w-100 justify-content-between'><p class='mb-1'>";
			config += sessions[i]["comments"] + "</p></div></a><div class='row'><button type='button' class='btn btn-danger delete-saved-session' id='" + sessions[i]["session_id"] + "' >Delete</button><button class='btn btn-info share-saved-session'>Share</button></div></div></a>";
			//config += "<div id="" + configId + "" class="collapse bg-light" aria-expanded="false"><p><b>Species</b>: " + savedConfigs[i]["filters"]["organism"]["species"].toString() + "</p></div>";
			$("#saved-session-list").append(config);
		}
		if (sessions.length == 0) {
			$(".load-old-session").prop("disabled", true);
		}
		else {
			$(".load-old-session").prop("disabled", false);
		}
	};
	
	/**************************************************

	* ONCLICK EVENTS *

	**************************************************/


	cartograplant.notifyNumSelectedTrees = notifyNumSelectedTrees;
	function notifyNumSelectedTrees() {
		var numSelectedTrees = mapState.includedTrees.length;
		var notificationStr = " plants currently selected.";
		if (numSelectedTrees == 1) {
			notificationStr = " plant currently selected.";
		}	
		toastr.info(numSelectedTrees + notificationStr);
		
		update_overlay_selected_trees();
	}
	
	/*
	$('#select-num-trees').change(function() {
		if(this.checked) {
			//Add to selected
			mapState.includedTrees = currently_filtered_trees;
			update_overlay_selected_trees();	
		}
		else {
			//Remove selected
			mapState.includedTrees = [];
			update_overlay_selected_trees();
		}
	});
	*/
	
	$(document).on("click", ".add-all-study-plants", function () {
		var treeId = $('#tree-id').html();
		console.log('treeId', treeId);
		// Extract study id
		var tree_id_parts = treeId.split('-');
		if (tree_id_parts[0].includes('TGDR')) {
			var study_id = tree_id_parts[0];
			// Go through each tree_ids to see if there's a match on the study id
			console.log('Searching ' + cartograplant.json_tree_ids.length + ' json tree ids');
			for (var i = 0; i < cartograplant.json_tree_ids.length; i++) {
				var tree_id_tmp = cartograplant.json_tree_ids[i];
				// console.log('tree_id_tmp', tree_id_tmp);
				if (tree_id_tmp.includes(study_id)) {
					// Add this to filtered trees if it does not exist
					if (mapState.includedTrees.includes(tree_id_tmp) == false) {
						mapState.includedTrees.push(tree_id_tmp);
					}
				}
			}
			$('#num-selected-trees').html(mapState.includedTrees.length);
			notifyNumSelectedTrees();
		}
		else if (treeId.includes('treesnap')) {
			// Look up treesnap treeid to get list of tree_ids of the same collection
			// url: Drupal.settings.base_url + '/cartogratree/api/v2/
			console.log('add all collection plants click');
			$.ajax({
				url: Drupal.settings.base_url + '/cartogratree/api/v2/trees/treesnap/collection_lookup_by_tree_id?tree_id=' + treeId,
				method: 'GET',
				success: function(data) {
					console.log('collection lookup data', data);
					for(var i = 0; i < data.length; i++) {
						var tree_id_tmp = data[i];
						if (mapState.includedTrees.includes(tree_id_tmp) == false) {
							mapState.includedTrees.push(tree_id_tmp);
						}
					}
					$('#num-selected-trees').html(mapState.includedTrees.length);
					notifyNumSelectedTrees();
				}
			});
		}
	});

	$(document).on("click", ".add-tree", function () {
		var treeId = $(this).parent().children(":first")[0].id;
	 	$(this).toggleClass("active");
	
		var isActive = $(this).hasClass("active");

		if (!isActive) {
			console.log("attempting to remove " + treeId);
			mapState.includedTrees.splice(mapState.includedTrees.indexOf(treeId), 1);
			cartograplant.activeTrees[treeId] = false;
			$("#add-all-trees").removeClass("active");
		}
		else {
			cartograplant.activeTrees[treeId] = true;
			mapState.includedTrees.push(treeId);
			var activeTreesCount = 0;
			var treesList = $("#tree-ids-list").children();
			for (var i = 0; i < treesList.length; i++) {
				if (treesList[i].children[1].className.includes("active")) {
					activeTreesCount++;
				}
			}
			if (activeTreesCount == cartograplant.clickedTrees.length) {
				$("#add-all-trees").addClass("active");
			}
		}
		notifyNumSelectedTrees();
	});

	$(document).on("click", ".tree-ids-select", function() {
		$(this).parent().parent().find("button.active").removeClass("active");
		$(this).addClass("active");
	
		console.log(this.id);	
		getTreeData(this.id);
	});

	$("#btn-get").on("click", function() {
		
		$('#analysis-overlapping-traits-studies').html('');
		$("#plants_details_icons").html('');


		removeAllPopStructLayers();

		//Check if importer/downloader is running
		if ($('#trees-by-source-id-import-status').hasClass('hidden') == false) {
			//Import is not hidden, thus showing, thus running
			alert('Filters have been temporarily disabled until your current dataset sources have finished downloading and applied. Please see Tree Dataset Sources in the left sidebar for current download status.');
		}
		else {
			//toastr.clear();
			mapState.includedTrees = []; 
			cartograplant.currently_filtered_trees = [];
			update_overlay_selected_trees();
			try {
				$("#tree-details").addClass("hidden");
			}
			catch (err) {
				
			}
			var result = $("#builder").queryBuilder("getRules");
			if (!$.isEmptyObject(result)) {
				// toastr.info("Filtering...", "Applying Filter", {timeOut: 20000});
				filterQuery = result;
				filterMap();
			} else {
				alert("Can't apply empty filter arguments");
			}
			
			//Reset selected trees
			$("#select-num-trees").prop("checked", false);
			
			// cartograplant.currently_filtered_trees = [];
			// update_overlay_selected_trees();
			
			//console.log(result);
		}
	});


	function removeAllPopStructLayers() {
		// Check if any pop structs were enabled, we need to disable them
		// since this the apply filter being called to assumingly a new filter set of options
		var dataset_numbers = Object.keys(dataDatasets);
		for (var i=0; i<dataset_numbers.length; i++) {
			var dataset_number = dataset_numbers[i];
			if (dataset_number > 100000 && dataset_number < 200000) {
				// This is a TGDR pop struct layer
				// We need the actual TGDR number so minus 100000 from it
				var tgdr_number_without_zeros = dataset_number - 100000;
				var tgdr_number = "";
				var tgdr_number_length = (tgdr_number_without_zeros + "").length;
				if (tgdr_number_length <= 2) {
					if(tgdr_number_length < 2) {
						tgdr_number = '00' + tgdr_number_without_zeros
					}
					else {
						tgdr_number = '0' + tgdr_number_without_zeros
					}
				}
				var tgdr_accession = 'TGDR' + tgdr_number;
				console.log('Removing popstruct_' + tgdr_accession + ' layer');
				removeDynamicDatasetLayer('popstruct_' + tgdr_accession);
			}
		}
	}
	
	

	// adding/removing a tree dataset and updating the current map state based on such an action
	$(document).on("click", ".tree-dataset-btn", function () {
		toastr.remove();
		// mapStatusNotification('Updating map, please wait...','info',false, 4000, 0);
		if(debug) {
			console.log('Class button tree-dataset-btn click function executed');
		}

		// Update search options dynamically based on which datasets are selected
		try {
			dynamically_update_search_options();
		}
		catch (err) {
			console.log(err);
		}

		//get the dataset id, and add/remove the dataset based on whether it"s currently active or not
		var datasetId = $(this)[0].id.split("-")[0];
		var element_id = $(this)[0].id;

		if(debug) {
			console.log('-- DatasetId (from element ID)' + datasetId);
		}
		
		// Determine if the layer is a geoserver_tileset layer
		if(datasetId.includes('geoserver_tileset')) {
			if(debug) {
				console.log('-- Geoserver Tileset layer detected for this dataset btn');
			}
			
			var active = $(this).hasClass("active");
			
			if(!active) {
				//Perform deactivations
				var layer = datasetId;
				var layerObj = layersList.getLayer(layer);
				console.log(layerObj);
				layersList.deactivateLayer(layer);
				map.removeLayer(layer);
				map.removeSource(layer);
				activeDatasets[datasetKey[datasetId]] = false;
				console.log($("#num-trees").text());
				console.log(layerObj.feature_count);
				var current_num_trees_count = parseInt($("#num-trees").text()) - layerObj.feature_count;
				$('#num-trees').text(current_num_trees_count);
				$('#num-species').text(parseInt($('#num-species').text()) - layerObj.species_count);

				// Regenerate overall unique species count for the UI
				cartograplant.unique_species[datasetKey[datasetId]] = null; // empty the unique_species for this specific source_id
				ui_recalculate_unique_species();
			}
			else {	
				//window.alert('This feature is currently under development. Some features may not work as intended until completion.');
				var layer = datasetId;
				console.log('HERE:'  + datasetId);
				var layerObj = new GeoserverLayer(layer, new Legend(datasetId), 1);	
				//if(datasetId == 'bien_geoserver_tileset') {
					layerObj.setLayerName(datasetGeoserverLayerConfig[datasetId].layerName);
					layerObj.setDatasetId(datasetId);
					layerObj.updateFilterSourceId(datasetKey[datasetId]);
				//}
				layerObj.setSourceMode('geoserver_tileset');

				// Add CQL Filtering
				var jsonData = {"query": filterQuery, "active_sources": active};
				
				var cqlfilter = parse_json_query(jsonData.query,'');
				console.log('CQL Filter: ' + cqlfilter);

				layerObj.setCQLFilter(cqlfilter);			
				layerObj.addSource();


				layersList.addToMap(layerObj);
				layersList.activateLayer(layer);
				console.log(activeDatasets[datasetKey[datasetId]]);
				activeDatasets[datasetKey[datasetId]] = true;
				layerObj.updateFeatureCount(); // this also updates the UI for unique species count

			}
		}
		else if(datasetId.includes('geojson')) {
			var active = $(this).hasClass("active");
			var elem_id = $(this).attr('id');
			var temp_dataset_id = elem_id.split('-')[0];
			var temp_dataset_name = temp_dataset_id.split('_')[0];
			console.log(temp_dataset_id);
			console.log(temp_dataset_name);

			var filter_sourceid = datasetKey[temp_dataset_name]; // this will be a number like 0,1,2,3 etc 
			var filter = ""; // should always be empty in this case
			console.log('Active status:' + active);
			if(active == false) {
				//do deactivations if it was preload datasets (opposite works for pop structure toggles - dynamic)
				//WFID TEMP LAYER
				if(temp_dataset_name.includes('wfid')) {
					var filter_sourceid = 4;
					removeDynamicDatasetLayer('wfid');
					activeDatasets[datasetKey[temp_dataset_name]] = false;
					setCurrentDatasetData(filter_sourceid, null);
					// Set this specific unique_species array with specified source_id to null (empty)
					cartograplant.unique_species[filter_sourceid] = null;
					// update UI to show correct unique species
					ui_recalculate_unique_species();	
					
					// update UI to show correct tree count
					var current_tree_count = parseInt($('#num-trees').html());
					current_tree_count = current_tree_count - cartograplant.trees_count[filter_sourceid];
					cartograplant.trees_count[filter_sourceid] = null;
					$('#num-trees').html(current_tree_count);
				}	
				else if (temp_dataset_name.includes('popstruct')) {
					// Assumption is made that this already went through the filtering system

					$(this).addClass('active');
					
					// First get the study accession
					var ps_parts = temp_dataset_name.split('popstruct');
					var study_accession = ps_parts[0];
					console.log('Activating popstruct dataset:' + study_accession);
					
					// map.setLayoutProperty('tree-cluster', 'text-allow-overlap', true);
					map.setLayoutProperty('tree-cluster-count', 'text-allow-overlap', true);
					map.setLayoutProperty('tree-cluster-count', 'text-ignore-placement', true);
					
					getPopStructTrees(function(data, study_accession) {
						// From the study accession eg TGDR001, get the 001 part
						var tgdr_number_only = parseInt(study_accession.replace('TGDR', ''));
						var dataset_id_number = 100000 + tgdr_number_only

						// cartograplant.loadImageWrapper(Drupal.settings.tree_img["wfid"]["angiosperm"], "wfid_ex");

						addDynamicDatasetLayer(data, 'popstruct_' + study_accession, function() {
							return [
								"match",			
								["get", "population_icon_id"],
								1,
								"popstruct_1",
								2,
								"popstruct_2",
								3,
								"popstruct_3",
								4,
								"popstruct_4",
								5,
								"popstruct_5",
								6,
								"popstruct_6",		
								"popstruct_0",
							]
						}, {
							'showClusterPoints': false,
							'iconOverlap': false,
							'moveLayerToTop': true
						});
						console.log('popstruct data', data);
						setCurrentDatasetData(dataset_id_number, data);			
					}, study_accession);					
				}														
			}
			else {
				// activations
				//WFID TEMP LAYER
				if(temp_dataset_name.includes('wfid')) {
					activeDatasets[datasetKey[temp_dataset_name]] = true;

					// check if tree_count_cache has been set
					if(cartograplant.trees_count_cache[filter_sourceid] != undefined) {
						var current_tree_count = parseInt($('#num-trees').html());
						current_tree_count = current_tree_count + cartograplant.trees_count_cache[filter_sourceid];
						$('#num-trees').html(current_tree_count);							
					}

					getWFIDTrees(function(data) {
						addDynamicDatasetLayer(data, 'wfid');
						setCurrentDatasetData(4, data);	
						// Update uniquespecies count on wfid enabled layer and perform ui unique species update
						updateUniqueSpeciesCount(filter_sourceid = 4, filter = "", ui_recalculate_unique_species);
						
						cartograplant.trees_count[filter_sourceid] = data.length;

						// if no cache, we need to add cache and update UI
						if(cartograplant.trees_count_cache[filter_sourceid] == undefined) {
							cartograplant.trees_count_cache[filter_sourceid] = data.length;
							var current_tree_count = parseInt($('#num-trees').html());
							current_tree_count = current_tree_count + cartograplant.trees_count[filter_sourceid];
							$('#num-trees').html(current_tree_count);							
						}
				
					});	
				}
				else if(temp_dataset_name.includes('popstruct')) {
					
					$(this).removeClass('active');
					var ps_parts = temp_dataset_name.split('popstruct');
					var study_accession = ps_parts[0];

					console.log('Deactivating popstruct dataset:' + study_accession);

					var tgdr_number_only = parseInt(study_accession.replace('TGDR', ''));
					var dataset_id_number = 100000 + tgdr_number_only

					
					removeDynamicDatasetLayer('popstruct_' + study_accession);
					setCurrentDatasetData(dataset_id_number, null);
				}					
			}
		}
		else {
			if(debug) {
				console.log('-- Defaulted ALL TREES GeoJSON layer detected for this dataset btn');
			}

			var active = $(this).hasClass("active");

			console.log(activeDatasets);

			if (!active) {
				activeDatasets[datasetKey[datasetId]] = false;
			}
			else {
				activeDatasets[datasetKey[datasetId]] = true;
			}
			console.log('Updating datasets');
			// toastr.clear();	
			// toastr.info("Updating Datasets...", {timeOut: 10000});
			filterMap();
		}

		try {

			if(getActiveDatasets().length < 1) {
				$('#num-trees').html('0');
				$('#num-species').html('0');
				$('#num-pubs').html('0');
			}
		}
		catch (err) {
			console.log(err);
		}

		if(debug) {
			console.log('-- Effective activedatasets:')
			console.log(getActiveDatasets());
			console.log('-- datasetKey:');
			console.log(datasetKey);
		}
	});


	/**
	 * This function should use the source_ids to call the API call
	 * which will return the species, genus, family fields which should be used
	 * to updates the Drupal.settings global variable within the browser
	 * AND also use this to dynamically update the search options available
	 */
	function dynamically_update_search_options() {
		var datasets_selected_as_source_ids = get_selected_datasets_array();
		var source_ids_string = "";
		for(var i=0; i<datasets_selected_as_source_ids.length; i++) {
			
			if (i == 0) {

			}
			else {
				source_ids_string += ",";
			}
			source_ids_string += datasets_selected_as_source_ids[i];
		}

		if(source_ids_string != "") {
			// perform query
			var url = Drupal.settings.ct_nodejs_api + "/v2/fields/trees/dynamic?api_key=" + Drupal.settings.ct_api + "&sids=" + source_ids_string;
			console.log("Dynamic fields query url:", url);
			$.ajax({
				url: url,
				dataType: "json",
				async: true,
				success: function (data) {
					//treeDataStore[tree_id] = {data};
					//treeDataStore.push({tree_id:data});
					console.log('dynamic search options', data);
					Drupal.settings.options_data.organism_data = data;
					console.log('Drupal.settings updated', Drupal.settings);
					cartograplant.reload_filter_system();
				}
			});
		}
	}

	/**
	 * This function checks each dataset toggle button to see if it's selected
	 * It then checks the toggle id against the datasetKey global variable
	 * and then it returns an array with the list of datasets (as numbers / source_ids)
	 * which can then be used for dynamic queries where necessary.
	 * @returns array
	 */
	function get_selected_datasets_array() {
		var datasets_array = [];
		$('.tree-dataset-btn').each(function (index) {
			var dataset_name = $(this).attr('id');
			// remove the trailing '_data' from the id
			dataset_name = dataset_name.replace('-data', '');
			// remove the beginning '_geoserver_tileset'
			dataset_name = dataset_name.replace('_geoserver_tileset', '');
			dataset_name = dataset_name.replace('_geojson', '');
			// console.log(dataset_name);
			if ($(this).hasClass("active")) {
				// on
				// console.log(dataset_name + ' is on');
				var dataset_value = datasetKey[dataset_name];
				if(dataset_value != undefined) {
					datasets_array.push(dataset_value);
				}
			}
			else {
				// off
				// console.log(dataset_name + ' is off');
			}
		});
		return datasets_array;
	}



	function ui_recalculate_unique_species() {
		//Update map_unique_species
		map_unique_species = []; // reset the map_unique_species array so we can repopulate it
		var unique_species_keys = Object.keys(cartograplant.unique_species);
		for(var unique_species_index=0; unique_species_index < unique_species_keys.length; unique_species_index++) {
			var unique_species_tmp = cartograplant.unique_species[unique_species_keys[unique_species_index]];
			if(unique_species_tmp != null) { // if the index was nulled from above, we need to ignore this from the counts
				for(var index=0; index< unique_species_tmp.length; index++) {
					if(map_unique_species.includes(unique_species_tmp[index])) {
						//already exists
					}
					else {
						map_unique_species.push(unique_species_tmp[index]);
					}
				}
			}
		}

		// layerObj.species_count = species_list.length;
		// layerObj.species_list = species_list;


		if(debug) {
			console.log('map_unique_species length:',map_unique_species.length);
			console.log(map_unique_species);
		}
		$('#num-species').text(map_unique_species.length);
	}
	
	$(".bien-dataset-btn").on("click", function() {
		var active = $(this).hasClass("active");
		if (!active) {
			//activeDatasets[datasetKey[datasetId]] = false;
			
		}
		else {
			//activeDatasets[datasetKey[datasetId]] = true;
			ctapiwss_conn.send('trees_by_source_id:3');
		}
	});
	
	$(".bien-vs-tgda-dataset-btn").on("click", function() {
		
		var source_id = 3;
		var timeout = 0;
		trees_by_source_id_tree_count = 0;		
		
		//console.log(trees_by_source_id_cache_object["source_id_" + source_id]);
		var active = $(this).hasClass("active");
		if (!active) {
			//activeDatasets[datasetKey[datasetId]] = false;
			activeDatasets[3] = false;
			for(var i=0; i < trees_by_source_id_cache_object["source_id_" + source_id].length; i++) {
				//Remove old layers
				removeDynamicDatasetLayer('source_id_' + source_id + '_' + [i]);
			}			
		}
		else {
			//activeDatasets[datasetKey[datasetId]] = true;
			activeDatasets[3] = true;
			if (trees_by_source_id_cache_object["source_id_" + source_id] == undefined || trees_by_source_id_cache_object["source_id_" + source_id] == null) {
				ctapiwss_conn.send('trees_by_source_id_linked_treegenes_and_dryad:3');
			}
			else {
				//pull from cached data
				toastr.info('Updating BIEN trees using cached data to speed things up');
				console.log(trees_by_source_id_cache_object["source_id_" + source_id].length);
				var timeout = 0;
				for(var i=0; i < trees_by_source_id_cache_object["source_id_" + source_id].length; i++) {
					trees_by_source_id_tree_count = trees_by_source_id_tree_count + trees_by_source_id_cache_object["source_id_" + source_id][i].length;
					//
					(function(i,timeout,source_id) {
						setTimeout(function() {
							toastr.info('Processing data. This could take some extra seconds if its thousands of trees, thank you for your patience!');
							addDynamicDatasetLayer(trees_by_source_id_cache_object["source_id_" + source_id][i], 'source_id_' + source_id + '_' + [i]); // this means it finished getting 1 million trees so create a dynamic layer
							initMapSummary(trees_by_source_id_tree_count);
						}, timeout);
					})(i,timeout,source_id);
					timeout = timeout + 2000 + (i * 1000);
				}
			}			
		}
	});	


	$(document).ready(function() {
		$("#tree-details").draggable({
		   revert : false,
		   containment: "parent"
		});
		$("#overlay-selected-trees").draggable({
		   revert : false,
		   containment: "parent"
		});		
	});
	

	$("#btn-reset").on("click", function() {
		try {
			$("#tree-details").addClass("hidden");
		}
		catch(err) {
			
		}		
		resetFilters();

		removeAllPopStructLayers();

		// This removes the allow overlap for the cluster points for trees (only needed when a pop struct is enabled)
		map.setLayoutProperty('tree-cluster-count', 'text-allow-overlap', false);
		map.setLayoutProperty('tree-cluster-count', 'text-ignore-placement', false);
		

		//Reset selected trees
		$("#select-num-trees").prop("checked", false);
		cartograplant.currently_filtered_trees = [];
		update_overlay_selected_trees();	

		/*
		if($(".bien-dataset-btn").hasClass('active')) {
			$('.bien-dataset-btn').trigger('click'); //off
			$('.bien-dataset-btn').trigger('click'); //on
			//simulate click (off)
			//simulate click (on)
		}
		*/
		
		//check for _tileset layers in activelayers
		/*
		if($("#bien_geoserver_tileset-data").hasClass('active')) {
			$("#bien_geoserver_tileset-data").trigger('click');
			setTimeout(function() {
				$("#bien_geoserver_tileset-data").trigger('click');
			},2000);	
		}
		*/

		//check for _tileset layers in activelayers
		// $('#dataset-options .tree-dataset-btn').each(function() {
		// 	var element_id = $(this).attr('id');
		// 	//console.log('Tree Dataset');
		// 	//console.log(element_id);
		// 	if(element_id.includes('geoserver_tileset') && element_id.includes('-data')) {
		// 		setTimeout(function() {
		// 			$("#" + element_id).trigger('click');
		// 		},2000);				
		// 	}
		// });
		
	});
	
	$("#tree-details-closebutton").on("click", function() {
		$("#tree-details").addClass("hidden");
	});

	$("#reset-map").on("click", function() {
		if (confirm("Are you sure you want to reset the map?")) {
			if($("#bien_geoserver_tileset-data").hasClass('active')) {

				$("#bien_geoserver_tileset-data").trigger('click');
				
				setTimeout(function() {
					$("#bien_geoserver_tileset-data").removeClass('active');
				},1500);
				
			}

			// Remove BIEN
			activeDatasets[3] = false;
			console.log("Active Datasets:");
			console.log(activeDatasets);

			layersList.resetLayers();
			resetFilters();
			map.setZoom(4);
			map.flyTo({center: [-90, 40], bearing: 0, pitch: 0});
			$("#hide-tree-details").trigger("click", function(){});
			try {
				$("#tree-details").addClass("hidden");
			}
			catch(err) {
				
			}
			
			//Reset selected trees
			var active = $("#select-num-trees").hasClass("active");
			if(active) {
				$("#select-num-trees").trigger('click');
				//$("#select-num-trees").prop("checked", false);
				cartograplant.currently_filtered_trees = [];
				update_overlay_selected_trees();
			}

			//Reset Environment Layer button if toggled
			var active = $("#env-layers-btn").hasClass("active");
			if(active) {
				$("#env-layers-btn").trigger('click');
			}
			
			//Reset Sel All button if toggles
			//Reset Environment Layer button if toggled
			var active = $("#sel-all-btn").hasClass("active");
			if(active) {
				$("#sel-all-btn").trigger('click');
			}			
		}
	});
	
	$("#hide-tree-details").on("click", function() {
		$("#tree-details").addClass("hidden");
		$(this).prop("disabled", true);
		if (currMarker != null) {
			currMarker.remove();
		}
	});
	
	cartograplant.update_overlay_selected_trees = update_overlay_selected_trees;
	function update_overlay_selected_trees() {
		var numSelectedTrees = mapState.includedTrees.length;

		/*
		$('#overlay-selected-trees').removeClass('hidden');
		$('#overlay-selected-trees').html('');
		$('#overlay-selected-trees').html('<span class="overlay_selected_trees_span">' + numSelectedTrees + ' trees currently selected.' + '</span>');
		$('#overlay-selected-trees .overlay_selected_trees_span').on("click", function() {
			show_modal_selected_trees();
		});
		*/
		$('#num-selected-trees').html('0');
		$('#num-selected-trees').html(numSelectedTrees);
		
		$('#map-summary-selected-trees .col-8, #map-summary-selected-trees .col-2:first-of-type').on("click", function() {
			show_modal_selected_trees();
		});
	}

	function show_modal_selected_trees() {
		console.log(mapState.includedTrees);
		$('#modal-trees-selected .modal-body .modal-table').html('');
		//$('#modal-trees-selected .modal-body .modal-table').append('<tr><td>Plant ID</td><td>Species</td><td>View</td><td>Remove</td></tr>');
		var html = '<tr><td>Plant ID</td><td>Species</td><td>View</td><td>Remove</td></tr>';
		console.log("treeDataStore:");
		console.log(treeDataStore);
		for(var i=0; i < mapState.includedTrees.length; i++) {
			if(i <= 100) {

				//var tree = treeDataStore[mapState.includedTrees[i]];
				var tree = searchTreeDataStore(mapState.includedTrees[i]);
				var tree_id = mapState.includedTrees[i];
				if(tree == undefined) {
					//$('#modal-trees-selected .modal-body .modal-table').append('<tr><td>'  + mapState.includedTrees[i] + '</td><td>' + 'N/A' + '</td><td><button class="modal_trees_selected_view_tree" id="modal_trees_selected_view_tree_' + mapState.includedTrees[i] + '">View</button></td><td><button class="modal_trees_selected_remove_tree" id="modal_trees_selected_remove_tree_' + mapState.includedTrees[i] + '">Remove</button></td></tr>');
					html = html + '<tr><td>'  + mapState.includedTrees[i] + '</td><td id="modal_trees_selected_species_tree_' + mapState.includedTrees[i] + '">' + 'N/A' + '</td><td><button class="modal_trees_selected_view_tree" id="modal_trees_selected_view_tree_' + mapState.includedTrees[i] + '">View</button></td><td><button class="modal_trees_selected_remove_tree" id="modal_trees_selected_remove_tree_' + mapState.includedTrees[i] + '">Remove</button></td></tr>';
				}
				else {
					//$('#modal-trees-selected .modal-body .modal-table').append('<tr><td>'  + mapState.includedTrees[i] + '</td><td>' + tree.species + '</td><td><button class="modal_trees_selected_view_tree" id="modal_trees_selected_view_tree_' + mapState.includedTrees[i] + '">View</button></td><td><button class="modal_trees_selected_remove_tree" id="modal_trees_selected_remove_tree_' + mapState.includedTrees[i] + '">Remove</button></td></tr>');
					html = html + '<tr><td>'  + mapState.includedTrees[i] + '</td><td>' + tree.data.species + '</td><td><button class="modal_trees_selected_view_tree" id="modal_trees_selected_view_tree_' + mapState.includedTrees[i] + '">View</button></td><td><button class="modal_trees_selected_remove_tree" id="modal_trees_selected_remove_tree_' + mapState.includedTrees[i] + '">Remove</button></td></tr>';
				}
			}
			else {
				html = html + '<tr><td colspan="4">And ' + (mapState.includedTrees.length - 100) +  ' more...</td></tr>';
				break;
			}
			//$('#modal-trees-selected .modal-body .modal-table').append('<div><span>' + mapState.includedTrees[i] + '</span><button onclick="show_modal_selected_trees_remove_tree(\'' + mapState.includedTrees[i] +'\', this);">Remove</button></div>');
		}
		$('#modal-trees-selected .modal-body .modal-table').append(html);
		$('#modal-trees-selected .modal-body .modal-table .modal_trees_selected_view_tree').on("click", function() {
			show_modal_selected_trees_view_tree(this);
		});
		$('#modal-trees-selected .modal-body .modal-table .modal_trees_selected_remove_tree').on("click", function() {
			show_modal_selected_trees_remove_tree(this);
		});		
		$('#modal-trees-selected').modal();
		
		//perform updates to species afterwards
		for(var i=0; i < mapState.includedTrees.length; i++) {
			if(i <= 100) {
				//var tree = treeDataStore[mapState.includedTrees[i]];
				var tree = searchTreeDataStore(mapState.includedTrees[i]);
				var tree_id = mapState.includedTrees[i];
				if(tree == undefined) {	
					/*
					setTimeout(function(tree_id) {
						console.log('Loading ' + tree_id + ' asynchronously');
						getTreeData(tree_id, false);
						tree = treeDataStore[tree_id];
						//$('#modal_trees_selected_species_tree_' + tree_id).html(tree.species);
						document.getElementById('modal_trees_selected_species_tree_' + tree_id).innerHTML = "" + tree.species + "";
					},1000, tree_id);
					*/
					console.log('Loading ' + tree_id + ' asynchronously');
					$.ajax({
						url: Drupal.settings.ct_nodejs_api + "/v2/tree?api_key=" + Drupal.settings.ct_api + "&tree_id=" + tree_id,
						dataType: "json",
						async: true,
						success: function (data) {
							//treeDataStore[tree_id] = {data};
							//treeDataStore.push({tree_id:data});
							treeDataStore.push({'tree_id':data.uniquename, 'data':data});
							console.log(data.species);
							$('#modal_trees_selected_species_tree_' + data.uniquename).html(data.species);
						},
						error: function (xhr, textStatus, errorThrown) {
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
			}
			else {
				break;
			}
		}
		
	}

	function show_modal_selected_trees_view_tree(obj) {
		try {
			$("#tree-details").addClass("hidden");
			var tree_id = jQuery(obj).attr('id').split('_')[5];
			getTreeData(tree_id);
			//console.log(treeDataStore[tree_id]);
			//var tree = treeDataStore[tree_id];
			var tree = searchTreeDataStore(tree_id);
			var lat = tree.latitude;
			var lon = tree.longitude;

			


			cartograplant.clickedTrees = [];
			cartograplant.clickedTrees.push(tree_id);


			//clickedTrees = treesInSameCoord;
			//var coordKey = coords[1] e.lngLat.lat + "_" + e.lngLat.lng;
			var coordKey = lon + "_" + lat;
			showTreeDetails(coordKey);

			//addEnvData("#tree-details-extra", bbox, map.queryRenderedFeatures(treesBbox));
			


			
			//showTreeDetails(coordKey);			
		}
		catch(err) {
			console.log(err);
		}
	}

	function show_modal_selected_trees_remove_tree(obj) {
		var tree_id = jQuery(obj).attr('id').split('_')[5];
		cartograplant.activeTrees[tree_id] = false;
		jQuery(obj).parent().parent().remove();
		var index = mapState.includedTrees.indexOf(tree_id);
		if (index !== -1) mapState.includedTrees.splice(index, 1);
		//$('#modal-trees-selected').modal();
		
		update_overlay_selected_trees();	
	}	

	//TODO: make this work better
	//updating the data values for the initial section of the analysis form when the analysis button is clicked

	var afs_progressbar = $("#analysis-filter-snp-progressbar");
	afs_progressbar.progressbar({ value: 0});
	var afs_trees_current = 0;	
	var afs_trees_total = 0;

	// This function will check to see if analysis script is already loaded
	// If not, it will load it in the background
	function load_scripts_analysis() {
		if(cartograplant['scripts']['analysis'] == undefined) {
			var url = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/js/map_analysis.js';
			console.log('Analysis script location: ' + url);
			$.ajax({
				url: url,
				dataType: "script",
				async: false,
				success: function() {
					console.log('[GOOD] Analysis scripts loaded');
				},
				error: function() {
					alert("[FATAL] Please contact administration, analysis module could not be loaded");
				}
			});
		}
		else {
			console.log('[GOOD] Analysis script already loaded');
		}

		// VENN Script
		if(cartograplant['scripts']['venn'] == undefined) {
			var url = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/js/venn/venn.js';
			console.log('Venn script location: ' + url);
			$.ajax({
				url: url,
				dataType: "script",
				async: false,
				success: function() {
					console.log('[GOOD] Venn script loaded');
				},
				error: function() {
					alert("[FATAL] Please contact administration, venn module could not be loaded");
				}
			});
		}
		else {
			console.log('[GOOD] Venn script already loaded');
		}

		// Scatterplot script
		if(cartograplant['scripts']['scatterplot_basic'] == undefined) {
			var url = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/js/scatterplot/scatterplot_basic.js';
			console.log('Scatterplot basic script location: ' + url);
			$.ajax({
				url: url,
				dataType: "script",
				async: false,
				success: function() {
					console.log('[GOOD] Scatterplot Basic script loaded');
				},
				error: function() {
					alert("[FATAL] Please contact administration, scatterplot basic module could not be loaded");
				}
			});
		}
		else {
			console.log('[GOOD] Scatterplot basic script already loaded');
		}	
		
		// Scatterplot script
		if(cartograplant['scripts']['interactivehistogramv5'] == undefined) {
			var url = Drupal.settings.base_url + '/' + Drupal.settings.cartogratree.url_path + '/js/interactivehistogram/interactivehistogramv5.js';
			console.log('Interactive Histogram V5 script location: ' + url);
			$.ajax({
				url: url,
				dataType: "script",
				async: false,
				success: function() {
					console.log('[GOOD] Interactive Histogram V5 script loaded');
				},
				error: function() {
					alert("[FATAL] Please contact administration, Interactive Histogram V5 module could not be loaded");
				}
			});
		}
		else {
			console.log('[GOOD] Scatterplot basic script already loaded');
		}		
	}

	$("#analysis-btn").on("click", function () {

		load_scripts_analysis();
		cartograplant['analysis_boot_function']();


		if ($(this).hasClass("disabled")) {
			alert("You must login to perform analysis");
			return;
		}

		



		/*
		$.ajax({
			method: "POST",
			url: Drupal.settings.ct_nodejs_api + "/v2/trees/snp/missing",
			data: JSON.stringify({"trees": mapState.includedTrees}),
			async: true,
			contentType: "application/json", 
			success: function (data) {
				console.log(data);
				data = Object.values(data["snps_to_missing_freq"]); //data["tree_snp_missing"]
				renderChart(data, true);		
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
		*/
	
		$("#analysis-form").modal();
		
		//perform_snp_chart_preload();
		//createChart(700, 500, data);
	});


	function get_file_name_caption(dataset_name) {
		console.log('raw_file_name', dataset_name);
		var file_name_caption = "";
		if(dataset_name.includes('AN') && dataset_name.includes('_TGDR') && dataset_name.includes('_snps.vcf')) {
			var file_name_dash_parts = dataset_name.split('-');
			var file_name_underscore = file_name_dash_parts[2];
			var file_name_underscore_parts = file_name_dash_parts[2].split('_');
			var file_name_relative_time = moment.unix(file_name_dash_parts[1]).fromNow();
			var file_name_caption = "Analysis " +  file_name_underscore_parts[0].replace('AN','') + ": " + file_name_underscore_parts[1] + " Filtered SNPs VCF (" + file_name_relative_time + ")";
		}
		else if(dataset_name.includes('AN') && dataset_name.includes('_PHENOVER')) {
			var file_name_dash_parts = dataset_name.split('-');
			var file_name_underscore = file_name_dash_parts[2];
			var file_name_underscore_parts = file_name_dash_parts[2].split('_');
			var file_name_relative_time = moment.unix(file_name_dash_parts[1]).fromNow();
			var file_name_caption = "Analysis " +  file_name_underscore_parts[0].replace('AN','') + ": " + " Filtered Phenotypes - " + file_name_underscore_parts[1].replace('PHENOVER','') + " - " + file_name_underscore_parts[2].toUpperCase() + " (" + file_name_relative_time + ")";
		}
		else if(dataset_name.includes('AN') && dataset_name.includes('_ENVDATA')) {
			var file_name_dash_parts = dataset_name.split('-',3);
			var properties = dataset_name.split('ENVDATA_');
			console.log('file_name_dash_parts', file_name_dash_parts);
			var file_name_underscore = file_name_dash_parts[2];
			var file_name_underscore_parts = file_name_dash_parts[2].split('_',3);
			var file_name_relative_time = moment.unix(file_name_dash_parts[1]).fromNow();
			var file_name_caption = "Analysis " +  file_name_underscore_parts[0].replace('AN','') + ": " + " Environmental data - " + properties[1].toUpperCase() + " (" + file_name_relative_time + ")";
		}
		else if(dataset_name.includes('AN') && dataset_name.includes('_POPSTRUCT')) {
			var file_name_dash_parts = dataset_name.split('-');
			var file_name_underscore = file_name_dash_parts[2];
			var file_name_underscore_parts = file_name_dash_parts[2].split('_');
			var file_name_relative_time = moment.unix(file_name_dash_parts[1]).fromNow();
			var file_name_caption = "Analysis " +  file_name_underscore_parts[0].replace('AN','') + ": " + " PopStruct Panel Final (" + file_name_relative_time + ")";
		}				
		else {
			file_name_caption = dataset_name;
		}
		return file_name_caption;
	}
	cartograplant['get_file_name_caption'] = get_file_name_caption;

	
	cartograplant['analysis_filter_snp_section_loaded'] = false;
	$('.analysis-filter-snp-section').click(function () {
		if (cartograplant['analysis_filter_snp_section_loaded'] == true) {
			return;
		}
		cartograplant['analysis_filter_snp_section_loaded'] = true;
		console.log('Analysis filter snp tab clicked');
		var studies = Object.keys(cartograplant.detected_studies);
		console.log('studies', JSON.stringify(studies));

		// Check if galaxy_id and history_id has been selected
		if(cartograplant.galaxy_id == undefined && cartograplant.history_id == undefined) {
			alert('You must choose a workspace before you can use genotype filtering workflows. Go to the Manage tab to set this up.')
			return;
		} 
		if(cartograplant.history_id == null) {
			alert('You must choose a workspace before you can use genotype filtering workflows. Go to the Manage tab to set this up.')
			return;			
		}

		var html = '<div style="float: left;" class="vcf_detection_loading"><img style="width: 48px; margin-top: 18px; margin-left: 15px; margin-right: 15px;" src="' + cartograplant.loading_icon_src + '"/></div>';
		
		html += '<div class="status">Detecting if VCF data exists for SNPs...</div>';
		html += '<div class="detected_vcf_information"></div>';
		html += '<div class="detected_vcf_overlaps" style="padding: 20px;"></div>';
		html += '<div class="none_detected_vcf_information"></div><hr />';
		html += '<div class="nextflow_variant_filtering_pipeline"></div><hr />';
		html += '<div class="vcf_snps_quality_filtering_ui">';
		// html += '	<div style="margin-bottom: 5px;" class="vcf_filtered_snp_files_select_div"><div style="display: inline-block; width: 15%;">Filter SNP Files</div><select></select></div>';
		html += '	<div style="margin-bottom: 5px;" class="vcf_snp_quality_workflow_select_div"><h3>Galaxy variant filtering</h3><div style="display: inline-block; width: 15%;">Quality filtering method</div><select></select></div>';
		html += '	<div class="vcf_snps_quality_filtering_ui_form">';
		html += '	</div>';		
		html += '</div>';

		$('#analysis-filter-snp-vcf-detection').html(html);
		$('.nextflow_variant_filtering_pipeline').html('');
		$('.nextflow_variant_filtering_pipeline').append('<h3>Nextflow variant filtering</h3>');

		

		if (Object.keys(cartograplant['detected_studies']).length == 0) {
			$('#analysis-filter-snp-vcf-detection').html('⚠️ You must set configure the Filter By Genotype tab before you can use this Filtering & Imputation section');
			return;
		}

		$('.vcf_snps_quality_filtering_ui').fadeOut(50);
		$('.vcf_detection_loading').fadeIn(500);

		// Populate the snp_quality_workflow_select select list
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_all_workflows_from_galaxy_account/" + cartograplant.galaxy_id;
		$.ajax({
			method: "GET",
			url: url,
			dataType: "json",
			success: function (data) {
				console.log('vcf_snp_quality_workflow_select', data);
				data.sort((a,b)=> (a.workflow_name > b.workflow_name ? 1 : -1));
				console.log('vcf_snp_quality_workflow_select sorted', data);
				var snps_workflows_html = '';
				
				for(var i=0; i<data.length; i++) {
					if(data[i].workflow_name.includes('SNP Quality Filtering Step') || data[i].workflow_name.includes('LinkImputeR')) {
						snps_workflows_html = snps_workflows_html +  '<option value="' + data[i].workflow_id + '">' + data[i].workflow_name +  '</option>';
					}
				}
				$('.vcf_snp_quality_workflow_select_div select').html(snps_workflows_html);
			}
		});			




		// Process VCF files in studies
		var vcf_files_ui_api_url = Drupal.settings.base_url + '/cartogratree_uiapi/vcf_files/' + Object.keys(cartograplant['detected_studies']).join(',');
		console.log('vcf_files_ui_api_url', vcf_files_ui_api_url);
		$.ajax({
			method: 'GET',
			url: vcf_files_ui_api_url,
			success: function(data) {
				
				// Clear timers
				var timers = cartograplant['generate_nextflow_variant_filtering_ui'];
				var timers_keys = Object.keys(timers);
				for (var i = 0; i<timers_keys.length; i++) {
					var key = timers_keys[i];
					try {
						clearInterval(cartograplant['generate_nextflow_variant_filtering_ui'][key]);
						delete cartograplant['generate_nextflow_variant_filtering_ui'][key];
					}
					catch (err) {
						console.log(err)
					}
				}

				console.log('snp_vcf_files', data);
				var vcf_found_count = 0;
				if(data != undefined) {
					var detected_studies_containing_vcfs = Object.keys(data);
					var vcf_info = data;
					console.log('vcf_info', vcf_info);
					var studies = Object.keys(vcf_info);
					for (var studies_i = 0; studies_i < studies.length; studies_i++) {
						cartograplant['generate_nextflow_variant_filtering_ui']({
							study_accession: studies[studies_i],
							vcf_location: vcf_info[studies[studies_i]]
						});
						// Create workspace symbolic links
						var workspace_name = $('#nextflow-create-analysis-select-history').val();
						var nextflow_vcf_symlink_api_url = Drupal.settings.base_url + '/cartogratree_uianalysis/nextflow_symlink_workspace_vcf_file/' + workspace_name + '/' + studies[studies_i];
						console.log('nextflow_vcf_symlink_api_url', nextflow_vcf_symlink_api_url);
						$.ajax({
							method: 'GET',
							url: nextflow_vcf_symlink_api_url,
							success: function(data) {
								console.log('vcf_symlink', data);
							}
						});
					}

					var vcf_found_info = {};
					for(var i=0; i<detected_studies_containing_vcfs.length; i++) {
						var study_vcf_html = "";
						if (vcf_info[detected_studies_containing_vcfs[i]] != null) {
							vcf_found_count = vcf_found_count + 1;

							// Add this study to the vcf_found_info which is used later down in the code
							vcf_found_info[detected_studies_containing_vcfs[i]] = vcf_info[detected_studies_containing_vcfs[i]];

							study_vcf_html += "<div>";
							study_vcf_html += "✅ Found Genotype VCF for " + detected_studies_containing_vcfs[i];
							study_vcf_html += "</div>";
							$('#analysis-filter-snp-vcf-detection .detected_vcf_information').append(study_vcf_html);
						}
						else {
							study_vcf_html += "<div>";
							study_vcf_html += "🚧 Missing Genotype VCF for " + detected_studies_containing_vcfs[i];
							study_vcf_html += "</div>";
							$('#analysis-filter-snp-vcf-detection .none_detected_vcf_information').append(study_vcf_html);
						}
					}
					// Set the CSS coloring for detected vcf information
					$('#analysis-filter-snp-vcf-detection .detected_vcf_information').css('padding','20px');
					$('#analysis-filter-snp-vcf-detection .detected_vcf_information').css('margin-top','10px');
					$('#analysis-filter-snp-vcf-detection .detected_vcf_information').css('background-color','#dff0d8');

					$('#analysis-filter-snp-vcf-detection .none_detected_vcf_information').css('padding','20px');
					$('#analysis-filter-snp-vcf-detection .none_detected_vcf_information').css('margin-top','10px');
					$('#analysis-filter-snp-vcf-detection .none_detected_vcf_information').css('background-color','#eff0d8');


					// So now we need to send all this data to the CT API endpoint
					// that will work to filter the VCF files and produce a single merged
					// VCF file
					$('#analysis-filter-snp-vcf-detection .status').css('padding', '20px');
					$('#analysis-filter-snp-vcf-detection .status').html('Filtering VCF files by genotype subsets selected... <br />Please wait, workflow interface will appear once files have finished uploading... <img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" />');
					if(vcf_found_count > 0) {
							// Check if any of them match
							var studies_tmp = Object.keys(vcf_info);
							var studies_values_tmp = Object.values(vcf_info);
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
											// If this is a new unique combination
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
							$('#analysis-filter-snp-vcf-detection .detected_vcf_overlaps').html(detected_vcf_overlaps_html);
							$.ajax({
								method: 'POST',
								url: Drupal.settings.ct_nodejs_api + "/v2/genotypes/snp_vcf_filtering",
								data: {
									analysis_id: cartograplant.current_analysis_id,
									galaxy_id: cartograplant.galaxy_id,
									history_id: cartograplant.history_id,
									cartogratree_base_url: Drupal.settings.base_url,
									vcf_info: JSON.stringify(vcf_found_info)
								},
								success: function (data) {
									$('.vcf_detection_loading').fadeOut(500);
									console.log('snp_vcf_filtering api response', data);
									$('#analysis-filter-snp-vcf-detection .status').html('🌟 VCF files successfully uploaded to workspace. Quality filtering methods will appear below after a few seconds.');
									
									// Update the file drop down list
									if (cartograplant.galaxy_id == null) {
										alert('Missing Galaxy ID - please reload Cartoplant, select studies and click the Analysis button');
									}
									var url_history_contents = Drupal.settings.base_url + '/cartogratree_uianalysis/get_history_details/' + cartograplant.galaxy_id + '/' + cartograplant.history_id;
									console.log(url_history_contents);
									// Empty the select list
									$('.vcf_filtered_snp_files_select_div select').html('');
									$.ajax({
										method: 'GET',
										url: url_history_contents,
										success: function(data_history_items) {
											console.log(data_history_items);
											var files_html = "";
											for(var i=0; i<data_history_items.length; i++) {
												var file_object = data_history_items[i];
												var file_name_caption = get_file_name_caption(file_object['dataset_name']);
												// if(file_object['dataset_name'].includes('AN') && file_object['dataset_name'].includes('_TGDR') && file_object['dataset_name'].includes('_snps.vcf')) {
												// 	var file_name_dash_parts = file_object['dataset_name'].split('-');
												// 	var file_name_underscore = file_name_dash_parts[2];
												// 	var file_name_underscore_parts = file_name_dash_parts[2].split('_');
												// 	var file_name_relative_time = moment.unix(file_name_dash_parts[1]).fromNow();
												// 	var file_name_caption = "Analysis " +  file_name_underscore_parts[0].replace('AN','') + ": " + file_name_underscore_parts[1] + " Filtered SNPs VCF (" + file_name_relative_time + ")";
												// }
												// else {
												// 	file_name_caption = file_object['dataset_name'];
												// }
												files_html += '<option raw_name="'+ file_object['dataset_name'] + '" value="' + file_object['dataset_id'] + '">' + file_name_caption + '</option>';
											}
											$('.vcf_filtered_snp_files_select_div select').html(files_html);
											$('.vcf_snps_quality_filtering_ui').fadeIn(500);

											cartograplant_snp_quality_filtering_populate_workflow_submit_form();
										}
									});
								}
							});
						
					}
					else {
						$('#analysis-filter-snp-vcf-detection .detected_vcf_information').html('');
						$('#analysis-filter-snp-vcf-detection .none_detected_vcf_information').html('');
						$('#analysis-filter-snp-vcf-detection .status').html('No VCF files detected<br />To continue, select studies that contain VCF files.');
						$('#analysis-filter-snp-vcf-detection .detected_vcf_information').html('');
						$('#analysis-filter-snp-vcf-detection .detected_vcf_overlaps').html('');
					}
				}
				else {
					$('#analysis-filter-snp-vcf-detection .status').html('No VCF files detected<br />To continue, select studies that contain VCF files.');
					$('#analysis-filter-snp-vcf-detection .detected_vcf_information').html('');
				}
			},
			error: function (data) {
				console.log('error', data);
			}
		});
		

		


		$("#snp-chart").html("");

		// append the svg object to the body of the page
		$("#chart-loading").removeClass("hidden");	
		// get the data
		console.log(mapState.includedTrees);

		generate_snps_to_missing_freq_objects_array = [];
		generate_snps_to_missing_freq_objects_total = mapState.includedTrees.length;
		generate_snps_to_missing_freq_objects_current = 0;

		afs_trees_current = 0;
		afs_trees_total = mapState.includedTrees.length;	

		var tree_list_for_websocket_command = "";
		for(var i=0; i<mapState.includedTrees.length; i++) {
			if(i == 0) {
				tree_list_for_websocket_command += mapState.includedTrees[i];
			}
			else {
				tree_list_for_websocket_command += "," + mapState.includedTrees[i];
			}
		}

		// Temporary disable this - new code to use Galaxy workflow instead
		// ctapiwss_conn.send('generate_snps_to_missing_freq' 
		// 	+ '::' + tree_list_for_websocket_command 
		// );		
	});

	$('body').on('change', '.vcf_snp_quality_workflow_select_div select', function() {
		cartograplant_snp_quality_filtering_populate_workflow_submit_form();
	});

	$('body').on('click', '.vcf_snps_quality_filtering_ui_refresh', function() {
		cartograplant_snp_quality_filtering_populate_workflow_submit_form();
	});

	function cartograplant_snp_quality_filtering_populate_workflow_submit_form() {
		// $('.button-refresh-snps-quality-filtering-workflow-status').html('<img style="height: 16px;" src="' + loading_icon_src + '" />');
		$('.vcf_snps_quality_filtering_ui_form').html('Loading SNP Quality filtering user interface ... <img style="width: 16px;" src="' + cartograplant.loading_icon_src + '" />');
		var workflow_id = $('.vcf_snp_quality_workflow_select_div select').val();
		cartograplant.history_id = $('#create-analysis-select-history').val();
		cartograplant.workflow_name = $('.vcf_snp_quality_workflow_select_div select option:selected').text();
		console.log('workflow_id', workflow_id);
		// var analysis_workflow_step_indexes = {};
		var url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_workflow_input_types/" + cartograplant.galaxy_id + '/' + workflow_id + '/' + cartograplant.history_id + '?nocache=' + Math.floor(Date.now() / 1000);
		console.log(url);

		// There is a current bug with how history gets updated so we're double loading the endpoint
		// This didn't work
		// $.ajax({
		// 	method: "GET",
		// 	url: url,
		// 	dataType: "json",
		// 	success: function (data) {
		// 		console.log('Force get_workflow_input_types call has been completed');
		// 	}
		// });

		
		// setTimeout(function() {
			url = Drupal.settings.base_url + "/cartogratree_uianalysis/get_workflow_input_types/" + cartograplant.galaxy_id + '/' + workflow_id + '/' + cartograplant.history_id + '?nocache=' + Math.floor(Date.now() / 1000);
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
					
					$('.vcf_snps_quality_filtering_ui_form').html('');
					//$('#create-analysis-workflow-submit-form').append('<div id="workflow_form">');
					$('.vcf_snps_quality_filtering_ui_form').append('<div style="display: inline-block; margin-top: 5px; margin-bottom: 5px; background-color: #d8e3e2; padding: 5px; color: #000000; border-radius: 5px; text-transform: uppercase; font-size: 18px;">' + $('.vcf_snp_quality_workflow_select_div select option:selected').text() +  ' Analysis Configuration</div>');
					if(data.overall_annotation != undefined) {
						$('.vcf_snps_quality_filtering_ui_form').append('<div>' + data.overall_annotation + '</div><hr />');
					}
					if(ui_controls.length != undefined) {
						console.log('ui_controls', ui_controls);
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
								$('.vcf_snps_quality_filtering_ui_form').append('<div style=""><div style="font-size: 16px; margin-top: 5px; margin-bottom: 5px;"><i class="fas fa-cog"></i> '  + title +  '</div></div>');
								if(description != undefined) {
									$('.vcf_snps_quality_filtering_ui_form').append('<div style="display: inline-block; margin-top: 5px; margin-bottom: 5px; background-color: #d8e3e2; color: #000000; padding: 5px; font-size: 12px; border-radius: 4px;"><div><i class="fas fa-info-circle"></i> '  + description +  '</div></div>');	
								}

								if(ui_control_info['type'] == "text") {
									// Show option to choose either file upload
									// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');

									var text_html = '<div style="margin-top: 5px; margin-bottom: 5px;"><input type="text" style="min-width: 15%;" id="' + name +  '-text" name="' + name + '-text" value="' + ui_control_info['default_value'] + '" /></div>';
									$('.vcf_snps_quality_filtering_ui_form').append(text_html);
								}
								else if(ui_control_info['type'] == "float") {
									// Show option to choose either file upload
									// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');

									var float_html = '<div style="margin-top: 5px; margin-bottom: 5px;"><input type="text" style="min-width: 15%;" id="' + name +  '-float" name="' + name + '-float" value="' + ui_control_info['default_value'] + '" /></div>';
									$('.vcf_snps_quality_filtering_ui_form').append(float_html);
								}							
								else if(ui_control_info['type'] == "selectfile") {
									// Show option to choose either file upload
									// $('#create-analysis-workflow-submit-form').append('<div><h4>'  + title +  '</h4></div>');
									
									$('.vcf_snps_quality_filtering_ui_form').append('<div style="margin-top: 5px; margin-bottom: 5px;"><input type="file" id="' + name + '-upload" name="' + name + '-upload" /><button class="history_file_upload_button" id="' + name + '-upload-button">Upload to workspace</button><div style="display: inline-block; padding-left: 5px;" id="' + name + '-upload-status"></div></div>');
									

									var options_html = "";
									if(ui_control_info['options'] != undefined) {
										var options_keys = Object.keys(ui_control_info['options']);
										for(var options_html_counter = 0; options_html_counter < options_keys.length; options_html_counter++) {
											// The key is a json encoded string containing the id and src, while value is name of file
											var key_object = JSON.parse(options_keys[options_html_counter]);
											var galaxy_history_file_id = key_object['id'];
											var galaxy_history_file_src = key_object['src'];
											var galaxy_history_file_name = ui_control_info['options'][options_keys[options_html_counter]];
											var file_name_caption = get_file_name_caption(galaxy_history_file_name);
											options_html += "<option value='" + options_keys[options_html_counter] + "'>" + file_name_caption +  '</option>';
										}
									}

									var select_html = '<div style="margin-top: 5px; margin-bottom: 5px;">Workspace available files: <select style="min-width: 15%;" id="' + name +  '-selectfile" name="' + name + '-selectfile">' + options_html + '</select><div style="display: inline-block;width: 40%; float:right;text-align: right;font-size: 12px; margin-top: -35px;"><div>If files don\'t appear, please try refreshing the workflow</div><button style="float:right;" class="vcf_snps_quality_filtering_ui_refresh btn btn-info"><i class="fa fa-refresh" aria-hidden="true"></i></button></div></div>';
									$('.vcf_snps_quality_filtering_ui_form').append(select_html);
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
									$('.vcf_snps_quality_filtering_ui_form').append(select_html);	
															
								}
								$('.vcf_snps_quality_filtering_ui_form').append('<div style="border-bottom: 1px solid #dfdfdf; margin-top: 25px; margin-bottom: 25px;"></div>');
							}		
						}
						$('.vcf_snps_quality_filtering_ui_form').append('<div style="margin-top: 5px; margin-bottom: 5px;"><button class="snps_quality_filter_initiate_analysis_job_button btn btn-info" id="' + workflow_id + '_intiate_analysis_job-button">Initiate analysis job</button></div>');
						// $('#create-analysis-workflow-submit-form').append('</div>');
						$('.vcf_snps_quality_filtering_ui_form').append('<div id="snps_quality_filter_analysis_job_results_status" style="margin-top: 5px; margin-bottom: 5px;"></div>');
						$('.vcf_snps_quality_filtering_ui_form').append('<div id="snps_quality_filter_analysis_job_results" style="margin-top: 5px; margin-bottom: 5px;"></div>');
					}
					else {
						$('.vcf_snps_quality_filtering_ui_form').html('<div style="margin-top: 5px; margin-bottom: 5px;">No requirements needed for this analysis, you may continue to send to Galaxy for processing.</div>');
					}
					$('.vcf_snps_quality_filtering_ui_form .button-refresh-workflow-status').html('');
					try {
						// restore_inputs_state_create_analysis_workflow_submit_form();
					}
					catch (err) {

					}
				}
			});
		//}, 5000);
	}

	$('body').on('click', '.btn-return-to-qc-filtering', function () {
		cartograplant.goTo('.vcf_snp_quality_workflow_select_div');
	});

	function scrollTo(selector) {
		console.log('Scroll to ' + selector);
		$('html, body').animate({
			scrollTop: $(selector).offset().top
		}, 1000);
	}
	cartograplant.scrollTo = scrollTo;

	function goTo(selector) {
		$(selector).get(0).scrollIntoView();
	} 
	cartograplant.goTo = goTo;


	$('body').on('click', '.btn-snps-quality-filtering-galaxy-file-as-final-output', function() {
		console.log('btn-snps-quality-filtering-galaxy-file-as-final-output clicked');
		// create an object
		var object = {};
		object.galaxy_id = $(this).attr('galaxy_id');
		object.file_id = $(this).attr('file_id');
		object.api_key = $(this).attr('api_key');
		cartograplant['analysis_snp_filtering_final_output_file'] = object;
		alert('Marked this file as the final output for SNPs Quality Filtering');
	});

	// This should cater for initiating a job analysis by clicking on the button
	$(document).on('click', '.snps_quality_filter_initiate_analysis_job_button', function() {
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
					$('#snps_quality_filter_analysis_job_results_status').html('');
					$('#snps_quality_filter_analysis_job_results_status').append('<div>Successfully submitted job to Galaxy server</div>');
					$('#snps_quality_filter_analysis_job_results_status').append('<div>Invocation ID: ' + data.invocation.id + '</div>');
					$('#snps_quality_filter_analysis_job_results_status').append('<div id="snps_quality_filter_analysis_job_status">Status: Submitted <div style="display: inline-block" class="loading"></div> <img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /></div>');
					$('#snps_quality_filter_analysis_job_results_status').append('<div id="snps_quality_filter_analysis_job_outputs"></div>');
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
									$('#snps_quality_filter_analysis_job_outputs').html('');
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
									$('#snps_quality_filter_analysis_job_outputs').append('<div id="snps_quality_filter_analysis_job_outputs_status" style="font-weight: bold; font-size: 16px; margin-top: 5px; margin-bottom: 5px;">Output Results (running) <span class="loading"><span> <img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /></div>');
									for(i = 0; i<output_details.length; i++) {
										var tmp_name = output_details[i]['name'];
										var tmp_file_ext = output_details[i]['file_ext'];
										var tmp_file_size = output_details[i]['file_size'];
										var tmp_state = output_details[i]['state'];
										var tmp_download_url = output_details[i]['download_url'];
										if(tmp_state == "ok") {
											$('#snps_quality_filter_analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #00d100; color: #FFFFFF;">Completed</span> File download: <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes) <button style="font-size: 10px; padding: 5px;" class="btn btn-info btn-snps-quality-filtering-galaxy-file-as-final-output" history_id="' + output_details[i]['history_id'] + '" file_id="' +output_details[i]['file_id'] + '" api_key="' + output_details[i]['api_key'] + '">Mark as final output</button></div>');
										}
										else if(tmp_state == "error") {
											$('#snps_quality_filter_analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #d10000; color: #FFFFFF;">Error</span> <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
										}
										else if(tmp_state == "paused") {
											$('#snps_quality_filter_analysis_job_outputs').append('<div style="margin-bottom: 5px;"><span style="padding: 5px; border-radius: 2px; background-color: #4d4d4d; color: #FFFFFF;">Paused</span> <a style="text-decoration: underline;" href="' + tmp_download_url + '">' + tmp_name + '</a> (' + tmp_file_size + ' bytes)</div>');
										}										
										else {
											$('#snps_quality_filter_analysis_job_outputs').append('<div style="margin-bottom: 5px;"><img style="height: 16px;" src="' + cartograplant.loading_icon_src + '" /> <span style="padding: 5px; border-radius: 2px; background-color: #ffbe0a;">Awaiting</span> File ' + tmp_name + ' (' + tmp_file_size + ' bytes)</div>');
										}
									}

									if(job_finished) {
										clearInterval(cartograplant.analysis_job_check_timers[data.invocation.id]);
										
										if(job_error) {
											$('#snps_quality_filter_analysis_job_status').html("Status: Error, incompleted, stopped.");
											$('#snps_quality_filter_analysis_job_outputs_status').html("Output results (Error!)");
										}
										else if(job_paused) {
											$('#snps_quality_filter_analysis_job_status').html("Status: Error, paused.");
											$('#snps_quality_filter_analysis_job_outputs_status').html("Output results (Paused, error!)");
										}
										else if (job_finished) {
											$('#snps_quality_filter_analysis_job_status').html("Status: Successfully completed.");
											$('#snps_quality_filter_analysis_job_outputs_status').html("Output results (Completed successfully!) <button class='btn btn-info btn-return-to-qc-filtering' style='float:right; font-size: 10px; padding: 5px;'>Return to Quality Filtering methods</button>");
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


	ct_ready_mapjs.generate_snps_to_missing_freq_data = generate_snps_to_missing_freq_data;
	
	function generate_snps_to_missing_freq_data() {
		var rows = generate_snps_to_missing_freq_objects_array;
		var snps_missing = {};
		var trees_snp_data = {};
		var markers_all = {};
		//transfer to util.js file as functions
		for (var i = 0; i < rows.length; i++) {
			var tree = rows[i]["tree_acc"];
			var marker = rows[i]["marker_name"];
			var marker_des = rows[i]["description"];

			markers_all[marker] = 0;
			if (trees_snp_data[tree] == undefined) {			
				trees_snp_data[tree] = {};
			}
			
			trees_snp_data[tree][marker] = marker_des;
		}	
		
		var tree_snp_missing = {};
		for (var tree_id in trees_snp_data) {
			var tree_missing_count = 0;
			for (var snp in markers_all) {
				var tree_snp_des = trees_snp_data[tree_id][snp];
				if (tree_snp_des == undefined) {	
					var missing_count = snps_missing[snp];
					snps_missing[snp] = missing_count == undefined ? 1 : missing_count + 1;	
					tree_missing_count++;
				}
				else {
					if (tree_snp_des == "NA" || tree_snp_des.length <= 2) {
						var missing_count = snps_missing[snp];
						snps_missing[snp] = missing_count == undefined ? 1 : missing_count + 1;	
						tree_missing_count++;
					}
				}
			}
			tree_snp_missing[tree_id] = (tree_missing_count/Object.keys(markers_all).length) * 100;
		}

		var num_trees = Object.keys(trees_snp_data).length;
		var snps_missing_freq = {};
		var freq_to_snp = {};
		for (var snp in snps_missing) {
			var missing_percent = (snps_missing[snp]/num_trees) * 100;
			snps_missing_freq[snp] = missing_percent;
			if (freq_to_snp[missing_percent] == undefined) {
				freq_to_snp[missing_percent] = [];
			}
			freq_to_snp[missing_percent].push(snp);
		}
		//ct_cache.put(sql_query, JSON.stringify({"snps_to_missing_freq": snps_missing_freq, "freq_to_snp": freq_to_snp, "tree_snp_missing": tree_snp_missing}), cache_time_24);
		return JSON.parse('{"snps_to_missing_freq": ' + JSON.stringify(snps_missing_freq) + ', "freq_to_snp": ' + JSON.stringify(freq_to_snp) + ', "tree_snp_missing": ' + JSON.stringify(tree_snp_missing) + '}');		
	}



	function perform_snp_chart_preload() {
		afs_trees_current = 0;
		afs_trees_total = mapState.includedTrees.length;
		for (var i=0; i < mapState.includedTrees.length; i++) {
			perform_snp_chart_preload_get_tree_snp_info(i);
		}
	}




	function perform_snp_chart_preload_get_tree_snp_info(i) {
		var tree_id = mapState.includedTrees[i];
		var url = Drupal.settings.ct_nodejs_api + '/v2/tree/snp?tree_id=' + tree_id;
		$.ajax({
			method: "GET",
			url: url,
			//async: false,
			dataType: "json",
			success: function (data) {
				console.log(url);
				console.log(data);
				$('#analysis-filter-snp-progressbar-status').html(tree_id + " SNP data downloaded.");
				afs_trees_current = i + 1;
				afs_progressbar.progressbar({ value: (afs_trees_current / afs_trees_total) * 100});
			}
		});
	}

	ct_ready_mapjs.renderChart = renderChart;
	
	function renderChart(data, newChart = false) {	
		// X axis: scale and draw:
		var height = chartProperties.chartHeight;
		var width = chartProperties.chartWidth;
		var margin = chartProperties.chartMargin;
		var svg = d3.select("#snp-chart")
		  .append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
		  .append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scaleLinear()
			.domain([0, 100])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
			.range([0, width]);
		
		svg.append("g")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x));

		// set the parameters for the histogram
		console.log(cartograplant.activeTrees);
		var histogram = d3.histogram()
			.domain(x.domain())  // then the domain of the graphic
			.thresholds(20); // then the numbers of bins

		// And apply this function to data to get the bins
		var bins = histogram(data);

		console.log(bins);
		// Y axis: scale and draw:
		var y = d3.scaleLinear()
			.range([height, 0]);
			y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
	  
		svg.append("g")
			.call(d3.axisLeft(y));

		svg.append("text")      // text label for the x axis
			.attr("x", width/2)
			.attr("y",  height + 35)
			.style("text-anchor", "middle")
			.text("% Missing");
		// append the bar rectangles to the svg element
		svg.selectAll("rect")
			.data(bins)
			.enter()
			.append("rect")
				.attr("x", 1)
				.attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
				.attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
				.attr("height", function(d) { return height - y(d.length); })
				.style("fill", "#69b3a2")

		if (newChart) {				
			populateThresholdOpts(bins);
		}
		$("#chart-loading").addClass("hidden");
	}

	function populateThresholdOpts(bins) {
		$("#snp-threshold-missing").html("<option selected>% Missing</option>");
		for (var i = 0; i < Math.min(bins.length, 10); i++) {
			if (bins[i].length > 0) {
				var roundedVal = roundHundredths(bins[i][0]);
				$("#snp-threshold-missing").append("<option value='" + roundedVal + "'> < " + roundedVal + "%</option>");
			}
		}
	}

	$("#filter-chart").on("click", function() {
		var thresholdVal = $("#snp-threshold-missing").val();

		console.log(thresholdVal);

		$("#snp-chart").html("");	
		// get the data
		$("#chart-loading").removeClass("hidden");	
		$.ajax({
			method: "POST",
			url: Drupal.settings.ct_nodejs_api + "/v2/trees/snp/missing",
			data: JSON.stringify({"trees": mapState.includedTrees}),
			contentType: "application/json", 
			success: function (data) {
				console.log(data);
				data = Object.values(data["snps_to_missing_freq"]);
				var dataToKeep = [];
				for (var i = 0; i < data.length; i++) {
					if (data[i] <= thresholdVal) {
						dataToKeep.push(data[i]);
					}
				}
				console.log(dataToKeep);
				renderChart(dataToKeep);		
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

	function createChart(width, height, data) {
		$("svg").html("");	
		const svg = d3.select("svg");
		var margin = {
			top: 20,
			right: 0,
			left: 50,
			bottom: 30,
		};
		var x = d3.scaleBand()
		  .domain(data.map(d => d.name))
		  .range([margin.left, width - margin.right])
		  .padding(0.1)

		var y = d3.scaleLinear()
		  .domain([0, d3.max(data, d => d.value)]).nice()
		  .range([height - margin.bottom, margin.top]) 

		var xAxis = g => g
		  .attr("transform", `translate(0,${height - margin.bottom})`)
		  .call(d3.axisBottom(x).tickSizeOuter(0));

		var yAxis = g => g
		  .attr("transform", `translate(${margin.left},0)`)
		  .call(d3.axisLeft(y))
		  .call(g => g.select(".domain").remove());       

		svg.append("g")
		  .attr("fill", "steelblue")
		  .selectAll("rect")
		  .data(data)
		  .join("rect")
			.attr("x", d => x(d.name))
			.attr("y", d => y(d.value))
			.attr("height", d => y(0) - y(d.value))
			.attr("width", x.bandwidth())		  
			.on("mouseover", function() {
			  d3.select(this)
			  .attr("fill", "red");
			  })
			  /*
			.on("mouseout", function(d, i) {
				  d3.select(this).attr("fill", function() {
				  return "" + color(this.id) + "";
				  });
			 });*/

		svg.append("g")
			.call(xAxis)
			.append("text")             
			  .attr("transform",
				  "translate(" + (width/2) + " ," + 
								 (height + margin.top + 40) + ")")
			  .style("text-anchor", "middle")
			  .text("% missing");
		
		svg.append("g")
		  .call(yAxis)
		  .append("text")
			.attr("transform", "rotate(-90)")
			.attr("x",0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Frequency");

	}

	//Show the current attributes associated with each filter type for the map state selected by the user
	$(".analysis-options-section").on("click", function() {
		//if the user has previous saved config, then find the one that has been selected and is active
		if ($("#saved-config-searches").length) {
			var selectedConfig = $(".map-state-container").find("tr.active");
			if (mapState.selectedConfigId == selectedConfig.attr("name").split("-")[1]) {
				return;
			} 
			mapState.selectedConfigId = selectedConfig.attr("name").split("-")[1];
		}
		else {
			//selected config is the current one loaded	
			if (mapState.selectedConfigId == selectedConfig.attr("name").split("-")[1]) {
				return;
			}
			mapState.selectedConfigId = 0;
		}

		//initialize the properties of the selected config default to the current map state
		/*
		var configSelected = {
			"layers": layersList.getLayersToSave(),
			"filters": {
				"phenotype": filtersHandler.phenotypeSelected,
				"publications": filtersHandler.pubSelected,
				"organism": filtersHandler.organismSelected,
				"genotype": filtersHandler.genotypeSelected,
				"trees": {
					"num_trees": filtersHandler.treeFiltered.length,
					"trees_removed": mapState.excludedTrees,
					"publications": Object.keys(getPublications(filtersHandler.treeFiltered)),
				}
			},
		}*/

		//if the current map is not the selected one, then replace the configSelected value to the one selected
		if (mapState.selectedConfigId > 0) {
			configSelected = Drupal.settings.user_config_history[mapState.selectedConfigId-1];
		}

		//update the publication and layers section based on the selected config
		var pubContainerId = "map-publications-data";
		var layerContainerId = "map-environmental-data";
		
		//clear the sections
		$("#" + layerContainerId).html("");
		$("#" + pubContainerId).html("");

		//go through each publication and add the necessary information to the table
		for (var i = 0; i < configSelected.filters.trees.publications.length; i++) {
			$.ajax({
				method: "POST",
				url: Drupal.settings.basePath + "cartogratree/get/data/pub",
				dataType: "json",
				//async: false,
				data: {
					"data": JSON.stringify({"pub_acc": configSelected.filters.trees.publications[i]})
				},
				success: function (data) {
					console.log(data);
					var pubRow = "<tr id='" + data.id + "'>";
					pubRow += "<td>" + data.id + "</td>";
					pubRow += "<td>" + data.title + "</td>";
					pubRow += "<td>" + data.author + "</td>";
					pubRow += "<td>" + data.year + "</td>";
					//pubRow += "<td>" + data.species + "</td>";
					pubRow += "<td class='pub-num-trees'>" + data.num_trees + "</td>";
					pubRow += "<td>" + data.study_type + "</td>";
					pubRow += "<td><button type='button' data-toggle='button' class='btn btn-toggle pub-dataset-btn active' id='toggle-map-summary' aria-pressed='false' autocomplete='off'><div class='handle'></div></button>"
					pubRow += "</tr>";
					$("#" + pubContainerId).append(pubRow);
				},
				error: function (xhr, textStatus, errorThrown) {
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

		//go through each layer and add the necessary information for the active layers, show all the variables in the layer
		for (var layer in configSelected.layers) {
			console.log(layer);
			console.log(Drupal.settings.fields);
			if (Drupal.settings.layers.hasOwnProperty(layer) && layer in Drupal.settings.layers) {
				var layerName = Drupal.settings.layers[layer].name;
				if (layerName in Drupal.settings.fields) {
					var layerRow = "<tr id=analysis-" + layer + ">";
					layerRow += "<td>" + Drupal.settings.layers[layer].title + "</td>";
					layerRow += "<td>" + Drupal.settings.layers[layer].url + "</td>";
					for (var attribute in Drupal.settings.fields[layerName]) {
						console.log(attribute);
						if (attribute != "Layer ID" && attribute != "Human-readable name for the layer") {
							layerRow += "<td><input type='checkbox' name='layers-variables' value='" + attribute + "' checked>" + attribute + "</td>";
						}
					}
					layerRow += "</tr>";
					$("#" + layerContainerId).append(layerRow);
				}
			}
		}
	});

	//In the confirm section of the analysis form, show the data for the selected map state and the options the user has filtered out
	$(".analysis-confirm-section").on("click", function() {
		// IMPORTANT: analysis_summary_update function is used in map_analysis.js to keep most of these items updated
		
		var configSelected = {
			"layers": layersList.getLayersToSave(),
			"filters": {
				/*
				"phenotype": filtersHandler.phenotypeSelected,
				"publications": filtersHandler.pubSelected,
				"organism": filtersHandler.organismSelected,
				"genotype": filtersHandler.genotypeSelected,
				"trees": {
					"num_trees": filtersHandler.treeFiltered.length,
					"trees_removed": mapState.excludedTrees, 
				}*/
			},
		}
		if (mapState.selectedConfigId > 0) {
			configSelected = Drupal.settings.user_config_history[mapState.selectedConfigId-1];
		}
				
		//var totalTrees = configSelected.filters.trees.num_trees;
		//if the user has deselected publications then update the total number of trees
		// var numPublications = 0;
		// $(".pub-dataset-btn").each(function() {
		// 	if (!($(this).hasClass("active"))) {
		// 		console.log($(this).parent().parent().children(":nth-child(5)").html());
		// 		totalTrees -= $(this).parent().parent().children(":nth-child(5)").html();
		// 	}
		// 	else {
		// 		numPublications++;
		// 	}
		// });



	
		//$("#analysis-num-trees").text(totalTrees);
		$("#analysis-num-trees").text(mapState.includedTrees.length);
		//$("#analysis-num-species").text(configSelected.filters.organism.species.length);
		// $("#analysis-num-species").text(species_unique.length);
		// $("#analysis-num-pub").text(numPublications);
		// $("#analysis-env-vals").text(analysis_environmental_data_selected_properties.length);
	});

	$('body').on('click', '.opened-layer-remove-icon', function() {
		var classNames = $(this).closest('.row').attr("class").split(/\s+/);
		for (var i = 0; i < classNames.length; i++) {
			var className = classNames[i];
			if (className.includes('opened-layer-')) {
				var element_id = className.replace('opened-layer-', '');
				$('#' + element_id).closest('.row').find('.btn-toggle').click();
			}
		}
	});

	//adding and removing layers from the map
	$(".layers-btn").on("click", function () {



		var layer = $(this)[0].id.split("-");
		var layerId = layer[0];
		var original_layerId = layer[0];
		var layerHost = layer[1];
		
		var layerObjectSettings = Drupal.settings.layers[layerId];

		console.log('Layer ID:' + layerId);
		console.log('Layer Host:' + layerHost);

		var layerNum = layerId.split("_")[2];

		//show opacity option and enable it for this layer
		$("#opacity-ctrl-" + layerNum).toggleClass("hidden");

		// Check whether this is a layer that is multilayers usually for range slider year filtering
		var isMultiLayeredYear = layerObjectSettings['layer_multilayer_rangeslider_year_option'];
		layerObjectSettings['isMultiLayeredYear'] = layerObjectSettings['layer_multilayer_rangeslider_year_option'];
		console.log('isMultiLayeredYear:' + isMultiLayeredYear);
		var generated_layers_list = [];
		if (isMultiLayeredYear == 1) {
			console.log(layerObjectSettings);
			var isMultiLayeredStartYear = layerObjectSettings['layer_multilayer_rangeslider_start_year'];
			var isMultiLayeredEndYear = layerObjectSettings['layer_multilayer_rangeslider_end_year'];
			console.log(isMultiLayeredStartYear + ' to ' + isMultiLayeredEndYear);

			for(var currentYear = isMultiLayeredStartYear; currentYear <= isMultiLayeredEndYear; currentYear++) {
				
				var tmp_layerObjectSettings = JSON.parse(JSON.stringify(layerObjectSettings));

				var generated_layer_id = tmp_layerObjectSettings['name'].replace('%', currentYear);
				console.log('Generated Layer Id for multilayer:' + generated_layer_id);
				generated_layers_list.push(generated_layer_id);
				if(typeof Drupal.settings.layers[original_layerId + '_multilayer_' + generated_layer_id] !== "undefined") {
					// already exists
					console.log('Layer already exists in Drupal.settings.layers:' + original_layerId + '_multilayer_' + generated_layer_id);
				}
				else {
					// Inherit all the rest of information from the original layer
					Drupal.settings.layers[original_layerId + '_multilayer_' + generated_layer_id] = tmp_layerObjectSettings;

					// Override specific settings to make the layer unique in Drupal.settings.layers
					Drupal.settings.layers[original_layerId + '_multilayer_' + generated_layer_id]['name'] = generated_layer_id;
					Drupal.settings.layers[original_layerId + '_multilayer_' + generated_layer_id]['title'] = layerObjectSettings['title'] + ' ' + currentYear;
					Drupal.settings.layers[original_layerId + '_multilayer_' + generated_layer_id]['layer_id'] =  layerObjectSettings['layer_id'] + '_multilayer_' + generated_layer_id;

					console.log('Added dynamic multilayer to Drupal.settings.layers:' + original_layerId + '_multilayer_' + generated_layer_id);	
				}				
			}
			

		}
		else {
			generated_layers_list.push(layerId); // not a multilayer so this array will have one layer
		}
		layerObjectSettings['generated_layers_list'] = generated_layers_list;

		console.log($(this).hasClass("active"));
		//if layer has already been added and is active, then deactivate it
		if (!$(this).hasClass("active")) {
			// Search to make sure the layer isn't already in the UI list container
			var layer_unique_id = $(this).closest('.inner-layer-header').find('h7[id*="ct-layer-title"]').attr('id');
			if ($('#map-opened-layers-list .opened-layer-' + layer_unique_id).length != 0) {
				// This item already exists, so remove it
				$('#map-opened-layers-list .opened-layer-' + layer_unique_id).remove();
				// Update the count number in the UI icon
				var open_layer_count = parseInt($('#map-icon-opened-layers .map-right-counter').html());
				open_layer_count--;
				$('#map-icon-opened-layers .map-right-counter').html(open_layer_count);
			}
			if (open_layer_count <= 0) {
				$('#map-opened-layers-list').html('No layers selected');
				$('#map-opened-layers-list').css('padding', '10%');
			}

			$('#legend_legend_icon_' + layerNum).hide();
			if(isMultiLayeredYear > 0) {
				// Remove the progress container
				try {
					$("#progress_container_" + layerObjectSettings['layer_id']).remove();
				}
				catch(err) {
		
				}	

				// Remove the legend container
				try {
					$("#legend_container_" + layerObjectSettings['layer_id']).remove();
				}
				catch(err) {
		
				}	
				
				// Remove the slider container
				try {
					$("#ct-layer-filterbyyear-instructions-" + layerObjectSettings['layer_id']).remove();
				}
				catch(err) {
		
				}
		
				try {
					$("#ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id']).remove();
				}
				catch(err) {
		
				}
				
				// So we need the timer cleared if one exists
				if (multilayers_layer_progressbar_timer[original_layerId] != "undefined") {
					// a timer already exists it seems so let's make sure we cancel it
					try {
						clearInterval(multilayers_layer_progressbar_timer[original_layerId]['timer']);
					}
					catch (err) {

					}
				}				

			}


			for(var i=0; i<generated_layers_list.length; i++) {
				if(isMultiLayeredYear > 0) {
					layerId = original_layerId + '_multilayer_' + generated_layers_list[i];
				}
				layersList.deactivateLayer(layerId);
			}

		}	
		else {
			// Activate the layer

			// Add to to layer list UI
			var layer_unique_id = $(this).closest('.inner-layer-header').find('h7[id*="ct-layer-title"]').attr('id');
			var layer_label = $(this).closest('.inner-layer-header').find('h7[id*="ct-layer-title"]').html();
			var opened_layer_ui_html = '';
			opened_layer_ui_html += '<div class="row opened-layer-list-item opened-layer-' + layer_unique_id + '">';
			opened_layer_ui_html += '<div class="col-1"><i class="opened-layer-remove-icon fas fa-times-circle" style="cursor: pointer; font-size: 1.5em !important;!i;!; padding-left: 4px; color: #FFFFFF;"></i></div>';
			opened_layer_ui_html += '<div class="col-9">' + layer_label + '</div>';
			opened_layer_ui_html += '</div>';

			if ($('#map-opened-layers-list').html() == 'No layers selected') {
				$('#map-opened-layers-list').html('');
				$('#map-opened-layers-list').css('padding', 'unset');
			}
			// Search to make sure the layer isn't already in the UI list container
			if ($('#map-opened-layers-list .opened-layer-' + layer_unique_id).length == 0) {
				// Add the list item to the UI
				$('#map-opened-layers-list').append(opened_layer_ui_html);
				// Update the count number in the UI icon
				var open_layer_count = parseInt($('#map-icon-opened-layers .map-right-counter').html());
				open_layer_count++;
				$('#map-icon-opened-layers .map-right-counter').html(open_layer_count);
			}

			$('#legend_legend_icon_' + layerNum).show();
			var currentOpacity = parseInt($("#slider-" + layerNum + "-" + layerHost).val(), 10) / 100;

			if(isMultiLayeredYear > 0) {
				// add a range slider
				showProgressByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list);
				showLayerLegendByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list)
				showLayerFilterByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list);
			}
			
			for(var i=0; i<generated_layers_list.length; i++) {
				/*
				// This was the single working layer code
				if (layersList.getLayer(layerId) == null) {
					var layerObj;
					if (layerHost == 0) {
						layerObj = new GeoserverLayer(layerId, new Legend(Drupal.settings.layers[layerId].title), currentOpacity);
						layerObj.addSource();
					}
					else {
						layerObj = new MapboxLayer(layerId, new Legend(Drupal.settings.layers[layerId].title), currentOpacity, layersList.mapboxLayers[layerId]);
					}
					layersList.addToMap(layerObj);
				}
				layersList.activateLayer(layerId);
				*/
				
				if(isMultiLayeredYear > 0) {
					layerId = original_layerId + '_multilayer_' + generated_layers_list[i];
				}
				else {
					layerId = generated_layers_list[i];
				}
				if (layersList.getLayer(layerId) == null) {
					var layerObj;
					if (layerHost == 0) {
						layerObj = new GeoserverLayer(layerId, new Legend(Drupal.settings.layers[layerId].title), currentOpacity);
						layerObj.addSource();
					}
					else {
						layerObj = new MapboxLayer(layerId, new Legend(Drupal.settings.layers[layerId].title), currentOpacity, layersList.mapboxLayers[layerId]);
					}
					layersList.addToMap(layerObj);
				}
				layersList.activateLayer(layerId);
				layersList.changeOpacity(layerId, 50 / 100);				
			}


			// Perform a click track on this layer selection
			console.log('layer click tracking');
			$.ajax({
				url: Drupal.settings.base_url + '/cartogratree_uiapi/layer_click_tracking_click/' + layerNum,
				method: 'GET',
				success: function(data) {
					console.log(data);
				}
			});
		}

		if(isMultiLayeredYear > 0) {
			console.log(map);
			// So we need the timer here to check to make sure the layers are loaded
			if (multilayers_layer_progressbar_timer[original_layerId] != "undefined") {
				// a timer already exists it seems so let's make sure we cancel it
				try {
					clearInterval(multilayers_layer_progressbar_timer[original_layerId]['timer']);
				}
				catch (err) {

				}
			}				
			// Initialize a new timer
			console.log('Creating a timer for original_layerId:' + original_layerId);
			multilayers_layer_progressbar_timer[original_layerId] = {}; //new object

			//disable zoom
			console.log('Temporarily disabling zoom while loading multilayers');
			map.scrollZoom.disable();

			var multilayer_timer = setInterval(function(generated_layers_list, original_layerId) {
				var loaded = 0;
				for(var i=0; i<generated_layers_list.length; i++) {
					// check if source loaded
					var layer_id = original_layerId + "_multilayer_" + generated_layers_list[i];
					var mapLayer = map.getLayer(layer_id);
					// if(mapLayer != "undefined" && map.loaded()) {
					if (map.isSourceLoaded(layer_id)) {
						loaded++;
					}
					//console.log(mapLayer);
					//console.log(map.getSource(layer_id));
					console.log('layer_id: ' + map.isSourceLoaded(layer_id));
				}
				// Update the progressbar with the current progress count
				try {
					var progressbar = $("#progress_container_" + original_layerId.split('_')[2]);
					progressbar.progressbar({ value: loaded});
				}
				catch (err) {
					console.log(err);
				}
				// if all layers are loaded - stop the timer
				if(loaded == generated_layers_list.length) {
					clearInterval(multilayer_timer);
					delete multilayers_layer_progressbar_timer[original_layerId];
					console.log('Timer cleared');

					// check to see if there are other timers running or not
					// we want to enable zoom abilities when all layers load
					// or we want to disable zoom abilities while maps are loading
					// this is a temporary fix for issues with multilayers
					
					var original_layerIds = Object.keys(multilayers_layer_progressbar_timer);
					var timers_running = 0;
					for(var i=0; i<original_layerIds.length; i++) {
						if(multilayers_layer_progressbar_timer[original_layerIds[i]]['timer'] != undefined) {
							timers_running = timers_running + 1;
						}
					}
					if(timers_running == 0) {
						console.log('Restoring zoom since all multilayers have completed loading.')
						map.scrollZoom.enable();
					}
				}
			}, 1500, generated_layers_list, original_layerId); 
			multilayers_layer_progressbar_timer[original_layerId]['timer'] = multilayer_timer;
		}		
		if(debug) {
			//console.log('layersList:');
			//console.log(layersList);
		}
	});

	/**
	 * Show progress bar on loading the multilayer layer
	 * since it can take a few seconds to load all the layers
	 */

	function showProgressByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list) {
		try {
			var layer_id_number = layerObjectSettings['layer_id'];

			try {
				$("#progress_container_" + layer_id_number).remove();
			}
			catch (err) {

			}

			//Recreate a new container
			var progress_container = '<div style="margin-left: 5px;width: 100%; /* padding-left: 20px;padding-right: 10px; */" id="progress_container_' + layer_id_number + '"></div><div class="progress_label_' + layer_id_number + '">Loading...</div>';
			//$("#legend").append(legend_container);
			$("#ct-layer-title-" + layer_id_number).parent().parent().append(progress_container);

			var progressbar = $("#progress_container_" + layer_id_number);
			var progressbar_label = $('.progress_label_' + layer_id_number);
			progressbar_label.css('text-align', 'center');
			progressbar_label.css('font-size', '8px');
			progressbar_label.css('color', '#000000');
			progressbar_label.css('float', 'right');
			progressbar_label.css('padding-left', '15px');
			progressbar_label.css('padding-right', '10px');
			progressbar_label.css('width', '100%');
			progressbar_label.css('margin-top', '5px');
			progressbar.removeClass('ui-corner-all');
			progressbar.css('margin-left','15px');
			progressbar.css('margin-top','5px');
			progressbar.progressbar({
				value: 0,
				change: function() {
					progressbar_label.text( progressbar.progressbar("value") + ' of '  + generated_layers_list.length + " layers loaded ...");
				},
				complete: function() {
					progressbar_label.text( "All layers loaded!").delay(2000).slideUp(1000);
					progressbar.delay(3000).slideUp(1000);	
				}
			});
			progressbar.progressbar( "option", "max", generated_layers_list.length);
			var progressbarValue = progressbar.find( ".ui-progressbar-value" );
			progressbarValue.css({
				'background': '#00731d'
			});
			progressbar.height(8);
			progessbar.find('.ui-widget-content').css('border: 0px solid #000000');
			/*
			progressbar.progressbar({
				value: false,
				change: function() {
				  progressLabel.text( progressbar.progressbar( "value" ) + ' of '  + generated_layers_list.length + " loaded ...");
				},
				complete: function() {
				  progressLabel.text( "Load complete!" );
				  
				}
			});
			*/

		}
		catch (err) {

		}
	}


	
		

	/**
	 * Show legend for a multilayer layer filtered by year
	 * Assumption: Use the lower value layer to get the Geoserver
	 * generated legend from that layer
	 */

	function showLayerLegendByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list) {
		try {
			var layer_id_number = layerObjectSettings['layer_id'];
			var layer_name = generated_layers_list[i];// this should exist in geoserver
			var legend_orientation = layerObjectSettings['layer_legend_orientation'];

			// First remove it if it exists
			try {
				$("#legend_container_" + layer_id_number).remove();
			}
			catch(err) {
	
			}
				

			console.log('Layer legend hide default:' + Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_legend_hide_default']);
			if(Drupal.settings.layers['cartogratree_layer_' + layer_id_number]['layer_legend_hide_default'] == "0") {

				//Recreate a new container
				var legend_container = '<div style="margin-left: 5px;width: 100%; /* padding-left: 20px;padding-right: 10px; */" id="legend_container_' + layer_id_number + '"></div>';
				//$("#legend").append(legend_container);
				$("#ct-layer-title-" + layer_id_number).parent().parent().append(legend_container);
				
				
				var legend_container_title = '<div style="font-size: 18px; padding-left: 10px; margin-top: 5px;" id="legend_container_title_' + layer_id_number + '"></div>';
				//if(this.html != undefined && this.html != '') {
				legend_container_title = '<div style="font-size: 18px; padding-left: 10px; margin-top: 5px;" id="legend_container_title_' + layer_id_number + '"><i title="Legend details" id="legend_legend_icon_' + layer_id_number + '" style="color: #08afff; cursor: pointer; margin-left: 4px; margin-right: 10px;" class="fas fa-chart-bar"></i></div>';
				//}
				$("#legend_container_" + layer_id_number).append(legend_container_title);

				// Geoserver Legend
				var legend_container_geoserver_legend = '<div style="text-align: center;" id="legend_container_geoserver_legend_' + layer_id_number + '"><img class="geoserver_legend_img" style="margin-left: 10px; width: 100%;"src="' + Drupal.settings.cartogratree.gis +  '?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=10&HEIGHT=10&LEGEND_OPTIONS=layout:' + legend_orientation + ';fontSize:10;&LAYER=' + layer_name + '" /></div>';
				// Add the geoserver legend to legend_container_html
				$("#legend_container_" + layer_id_number).append(legend_container_geoserver_legend);
				
				if(legend_orientation == 'horizontal') {
					$('#legend_container_geoserver_legend_' + layer_id_number + ' img')
					.wrap('<span style="display:inline-block; width: 80%;"></span>')
					.css('display', 'block')
					.parent()
					.zoom();
				}
				else {
					$('#legend_container_geoserver_legend_' + layer_id_number + ' img')
					.wrap('<span style="display:inline-block;"></span>')
					.css('display', 'block')
					.parent()
					.zoom();					
				}
				
				$('#legend_container_geoserver_legend_' + layer_id_number).toggle(); // hide the legend image

				/*	
				var legend_container_html = '<div style="font-size: 10px; margin-left: 10px;" id="legend_container_html_' + layer_id_number + '"></div>';
				$("#legend_container_" + layer_id_number).append(legend_container_html);
				*/

				$("#legend_container_html_" + layer_id_number).toggle();//default hide

				/*
				$("#legend_info_icon_" + layer_id_number).click(function() {
					$("#legend_container_html_" + layer_id_number).toggle();
				});
				*/

				$("#legend_legend_icon_" + layer_id_number).click(function() {
					$('#legend_container_geoserver_legend_' + layer_id_number).toggle();
				});

			}
		}
		catch (err) {
			console.log(err);
		}
	}

	/**
	 * Show filter by year options for a layer that is a multi layer
	 * The root layer selected using the on and off toggle is not a real
	 * layer so this cannot be added to the GeoServerLayer object
	 */
	function showLayerFilterByYearOptionsForMultiLayersLayer(layerObjectSettings, generated_layers_list) {
		var year_min = parseInt(layerObjectSettings['layer_multilayer_rangeslider_start_year']);
		var year_max = parseInt(layerObjectSettings['layer_multilayer_rangeslider_end_year']);

		// console.log('function showLayerFilterByYearOptionsMultiLayersLayer called');
		// console.log(generated_layers_list);
		try {
			$("#ct-layer-filterbyyear-instructions-" + layerObjectSettings['layer_id']).remove();
		}
		catch(err) {

		}

		try {
			$("#ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id']).remove();
		}
		catch(err) {

		}			

		// console.log(layerObjectSettings);
		var container_layer_filterbyyear_container = "<div style='padding-bottom: 15px; width: 100%; padding-left: 25px; padding-right: 10px;' id='ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id'] + "'></div>";
		$('#ct-layer-title-' + layerObjectSettings['layer_id']).parent().parent().append(container_layer_filterbyyear_container);
		
		var container_layer_filterbyyear_rangeslider_title = "<div style='text-align: center; font-size: 12px;' id='ct-layer-filterbyyear-rangeslider-title-" + layerObjectSettings['layer_id'] + "'>Select years</div>";
		$("#ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id']).append(container_layer_filterbyyear_rangeslider_title);

		var container_layer_filterbyyear_rangeslider = "<div id='ct-layer-filterbyyear-rangeslider-" + layerObjectSettings['layer_id'] + "'></div>";
		$("#ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id']).append(container_layer_filterbyyear_rangeslider);

		var container_layer_filterbyyear_rangeslider_values = "<div style='text-align: center;' id='ct-layer-filterbyyear-rangeslider-values-" + layerObjectSettings['layer_id'] + "'>" + year_min + " - " + year_max + "</div>";
		$("#ct-layer-filterbyyear-container-" + layerObjectSettings['layer_id']).append(container_layer_filterbyyear_rangeslider_values);

		// var envLayer = layerObjectSettings;
		$("#ct-layer-filterbyyear-rangeslider-" + layerObjectSettings['layer_id']).slider({
			range: true,
			min: year_min,
			max: year_max,
			values: [ year_min, year_max ],
			slide: function( event, ui ) {
				// envLayer.isFiltered = true;
				console.log('Slider adjusted');
				// console.log(layerObjectSettings);
				// console.log(generated_layers_list);
				// console.log(layersList);
				$("#ct-layer-filterbyyear-rangeslider-values-" + layerObjectSettings['layer_id']).html(ui.values[ 0 ] + " - " + ui.values[ 1 ] );

				try{
					//clear all layers
					for (var i = 0; i < generated_layers_list.length; i++) {
						try {
							var layerId = 'cartogratree_layer_' + layerObjectSettings['layer_id'] + '_multilayer_' + generated_layers_list[i];
							layersList.deactivateLayer(layerId);
						}
						catch (err) {
							console.log(err);
						}
					}

					
					// add layers within the range
					var startLayerId = (layerObjectSettings['name'] + '').replace('%', ui.values[0]);
					var endLayerId = (layerObjectSettings['name'] + '').replace('%', ui.values[1]);

					// Find the start and the end in terms of indexs
					var startIndex = generated_layers_list.indexOf(startLayerId);
					var endIndex = generated_layers_list.indexOf(endLayerId);

					for(var i = startIndex; i<=endIndex; i++) {
						// Add back these layers
						try {
						
							layersList.activateLayer('cartogratree_layer_' + layerObjectSettings['layer_id'] + '_multilayer_' + generated_layers_list[i]);
						}	
						catch (err) {
							console.log(err);
						}
					}
					

					/*
					setTimeout(function() {
						console.log('Activating layer after 2500ms');
						layersList.activateLayer(envLayer.id, true);
					}, 2500);
					*/						

				}
				catch(err) {
					console.log(err);
				}
			}
		});
	}	

	// some stuff about the sidebar, resize the map whenever sidebar changes dimensions
	$(".show-layers-menu").on("click", function () {
		$("#layers-menu").toggleClass("hidden");
		//$("#layers-menu-btn").toggleClass("active");
		$("#env-layers-btn").toggleClass("active");
		map.resize();
	});
	
	$("#env-layers-btn").on("click", function() {
		var active = $(this).hasClass("active");
		if(!active) {
			//$(this).toggleClass("active");
			$("#layers-menu").toggleClass("hidden");
		}
		else {
			//$("#env-layers-btn").removeClass("active");
			$("#layers-menu").toggleClass("hidden");
		}
	});

	$("[data-toggle=sidebar-collapse]").click(function () {
		sidebarCollapse();
	});

	function sidebarCollapse() {
		$(".menu-collapsed").toggleClass("d-none");
		$(".sidebar-submenu").toggleClass("d-none");
		$(".submenu-icon").toggleClass("d-none");
		$(".sidebar-container").toggleClass("sidebar-expanded sidebar-collapsed col-3 col-1");

		var separatorTitle = $(".sidebar-separator-title");
		if (separatorTitle.hasClass("d-flex")) {
			separatorTitle.removeClass("d-flex");
		}
		else {
			separatorTitle.addClass("d-flex");
		}

		$("#collapse-icon").toggleClass("fa-angle-double-left fa-angle-double-right");
		$("#layers-menu").addClass("hidden");
		//$("#layers-menu-btn").removeClass("active");
		$("#env-layers-btn").toggleClass("active");
		map.resize();
	}

	function saveSessionState() {
		var sessionState = {
			"session_id": Drupal.settings.session.session_id,
			"layers": layersList.getLayersToSave(),
			"filters": {"query": filterQuery, "active_sources": getActiveDatasets()},
			"user_data": {
				"center": map.getCenter(),
				"zoom": map.getZoom(),
				"pitch": map.getPitch(),
				"bearing": map.getBearing(),
				"included_trees": mapState.includedTrees,
			},
		};
		console.log({
			sessionState
		});
		console.log(JSON.stringify(sessionState));
		$.ajax({
			method: "POST",
			url: Drupal.settings.ct_nodejs_api + "/v2/user/session/save",
			contentType: "application/json", 
			data: JSON.stringify({"data": sessionState}),
			async: false,
			success: function (data) {
				console.log(data);
			},
			error: function (xhr, textStatus, errorThrown) {
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

	function getCurrentUserSession() {
		$.ajax({
			method: "GET",
			async: false,
			url: Drupal.settings.ct_nodejs_api + "/v2/user/session/by-user?api_key=" + Drupal.settings.ct_api + "&user_id=" + Drupal.settings.user.user_id + "&session_id=" + Drupal.settings.session.session_id,
			success: function (data) {
				Drupal.settings.session.curr_sess_title = data.length > 0 ? data[0]["title"] : null;	
			}, 			
			error: function (xhr, textStatus, errorThrown) {
				console.log({textStatus});
				console.log({errorThrown});
				console.log(xhr.responseText);
			} 		
		});
		//return null;
	}

	function saveUserSession() {
		//get the title and comments entered by the user
		var title = $("#save-session-title").val();
		var comments = $("#save-session-comments").val();

		//title and login validation, only allow logged in users to save and the title field is required
		if (title.length <= 0) {
			alert("Title field must not be empty.");
			return;
		}
		
		var sessionData = {
			"title": title,
			"comments": comments,
			"user_id": Drupal.settings.user.user_id,
			"session_id": Drupal.settings.session.session_id,
		}

		getCurrentUserSession();
		console.log(Drupal.settings.session.curr_sess_title);
		if (Drupal.settings.session.curr_sess_title != null) {
			if(!confirm("Are you sure you want to overwrite the session titled '" + Drupal.settings.session.curr_sess_title + "'?")) {
				return;
			}
		}

		saveSessionState();

		$.ajax({
			method: "POST",
			url: Drupal.settings.ct_nodejs_api + "/v2/user/session/save/by-user",
			contentType: "application/json",
			data: JSON.stringify({"data": sessionData}),
			success: function (data) {
				var sessionLink = getSessionUrl();
				$(".session-url").text(sessionLink);
				$(".session-url").attr("href", sessionLink); 				
				$("#save-success-container").removeClass("hidden"); 
				$("#submit-user-session").addClass("hidden");
				$("#save-session-form").addClass("hidden");
			}, 			
			error: function (xhr, textStatus, errorThrown) {
				console.log({textStatus});
				console.log({errorThrown});
				console.log(xhr.responseText);
			} 		
		});
	}

	function getSessionUrl() {
		var sessionUrl = Drupal.settings.base_url + Drupal.settings.basePath +  "cartogratree";
		if (!sessionUrl.includes("session_id")) {
			sessionUrl += "?session_id=" + Drupal.settings.session.session_id;  
		}
		return sessionUrl;
	}

	function saveAnonSession() {
		var sessionUrl = getSessionUrl();
		$(".session-url").text(sessionUrl);
		$(".session-url").attr("href", sessionUrl);		
		$("#save-success").modal();
		
	}

	//Saving the current state of the map on click event
	$("#save-session").on("click", function () {
		if (Drupal.settings.user.logged_in) {
			//open save session popup dialog
			$("#save-success-container").addClass("hidden");
			$("#submit-user-session").removeClass("hidden");
			$("#save-session-form").removeClass("hidden");
			$("#save-user-session").modal();
		}	
		else {
			saveSessionState();
			saveAnonSession();
		}
	});
	
	$("#submit-user-session").on("click", function () {
		saveUserSession();
	});

	//loading previous saved configs by the user
	$(".load-old-session").on("click", function () {
		if ($("#saved-session-list").length) {
			var selectedConfig = $("#saved-session-list").find("a.active");
			console.log(selectedConfig);
			if (selectedConfig.length == 0) {
				alert("Please select a configuration");
			}
			else{
				var selectedSession = Drupal.settings.user["sessions"][selectedConfig.attr("href").split("-")[1]];
				loadSession(selectedSession, true);
				console.log("old sess: " + Drupal.settings.session.session_id);
				Drupal.settings.session.session_id = selectedSession["session_id"];
				console.log("new sess: " + Drupal.settings.session.session_id);
				document.getElementById("save-session-title").value = selectedSession["title"];
				document.getElementById("save-session-comments").value = selectedSession["comments"];
			}
		}
	});


	/**************************************************
	 
	* LEGENDS *
	 
	**************************************************/
	//Soil legend is created entirely with html, as opposed to requesting an image from geoserver
	function addSoilLegend(layerId, title) {
		var soilLayerId = "cartogratree_layer_4";
		var soilLayer = "ct:global_soils_merge_psql";
		$("#legend").removeClass("hidden").addClass("non-img-legend");
		var titleContainer = document.createElement("div");
		titleContainer.className = "block mb6";
		titleContainer.id = "legend-title-container";
		titleContainer.innerHTML = "<strong><a id='legend-title' href='#'>" + title + "</a></strong>";
		legend.appendChild(titleContainer);
		var contentContainer = document.createElement("div");
		contentContainer.id = "legend-content";
		var idx = 0;
		for (var section in Drupal.settings.soils) {
			//var section = sections[i];
			var color = Drupal.settings.soils[section][0]; //colors[i];
			var item = document.createElement("div");

			var key = document.createElement("span");
			key.className = "soil-legend-key";
			key.id = section + "-" + idx;
			key.style.backgroundColor = color;
			key.setAttribute("data-toggle", "tooltip");
			key.setAttribute("data-placement", "left");
			key.title = Drupal.settings.soils[section][1];
			var value = document.createElement("span");
			value.innerHTML = section;
			value.id = idx + "-soil-legend-label";
			value.className = "legend-label";

			item.appendChild(key);
			item.appendChild(value);
			contentContainer.appendChild(item);
			idx++;
		}
		legend.appendChild(contentContainer);

		$("#legend-title").on("click", function () {
			$("#legend-content").toggleClass("hidden");
		});

		//Whenever a soil type is clicked from the legend, we enable/disable it based on current active state
		$(".soil-legend-key").on("click", function () {
			var keyId = $(this)[0].id.split("-");
			var soilChoice = keyId[0];
			var sectionLayerId = soilLayerId + "_" + soilChoice;
			console.log(soilChoice);
			
			if (layersHandler.loadedSoil.indexOf(soilChoice) >= 0) {
				layersHandler.loadedSoil.splice(layersHandler.loadedSoil.indexOf(soilChoice), 1);
				$(this).removeClass("active");
				$("#" + keyId[1] + "-soil-legend-label").removeClass("active");
			}
			else{
				layersHandler.loadedSoil.push(soilChoice);
				$(this).addClass("active");
				$("#" + keyId[1] + "-soil-legend-label").addClass("active");
			}
			console.log(layersHandler.loadedSoil);
			var selectedSoils = layersHandler.loadedSoil.length == 0 ? null : ["match", ["get", "value"], layersHandler.loadedSoil, true, false]; 

			var mbLayers = layersList.mapboxLayers[layerId];
			for(var i = 0; i < mbLayers.length; i++){					
				map.setFilter(mbLayers[i], selectedSoils);
			}
		});
	}

	//custom legend for neon, which shows the four sites neon has tracked
	function addNeonLegend() {
		$("#legend").removeClass("hidden").addClass("non-img-legend");
		var titleContainer = document.createElement("div");
		titleContainer.className = "block mb6";
		titleContainer.id = "legend-title-container";
		titleContainer.innerHTML = "<strong><a id='legend-title' href='#'>Site Type</a></strong>";
		legend.appendChild(titleContainer);
		var contentContainer = document.createElement("div");
		contentContainer.id = "legend-content";

		var siteTypes = {"Core Aquatic":"#1f43c7", "Core Terrestrial":"#328128", "Relocatable Aquatic":"#8d9edd", "Relocatable Terrestrial":"#97bf92"};
		for (var site in siteTypes) {		
			if (siteTypes.hasOwnProperty(site)) {
				var item = document.createElement("div");

				var key = document.createElement("span");
				key.className = "neon-legend-key";
				key.style.backgroundColor = siteTypes[site];

				var value = document.createElement("span");
				value.innerHTML = site;
				value.className = "legend-label";

				item.appendChild(key);
				item.appendChild(value);
				contentContainer.appendChild(item);
			}
		}
		legend.appendChild(contentContainer);
    }

	function removeLegend() {
		$("#legend").addClass("hidden").removeClass("non-img-legend");
		while (legend.firstChild) {
			legend.removeChild(legend.firstChild);
		}
	}

	//opacity configuration
	$(".opacity").change(function (e) {
		console.log("updating opacity");
		var layerInfo = ($(this)[0].id).split("-");
		var layerId = "cartogratree_layer_" + layerInfo[1];
		if (layersList.isActive(layerId)) {
			var currVal = e.target.value;
			layersList.changeOpacity(layerId, parseInt(currVal, 10) / 100);
		}

		// Check to see if this was a multilayered layer using for filtering by year
		var layerObjectSettings = Drupal.settings.layers[layerId];
		console.log(layerObjectSettings);
		if(layerObjectSettings.isMultiLayeredYear == "1") {
			var generated_layers_list = layerObjectSettings.generated_layers_list;
			var currVal = e.target.value;
			$('#opacity-value-' + layerObjectSettings.layer_id).html(currVal + '%');
			for(var i=0; i<generated_layers_list.length; i++) {
				try {
					layerId = 'cartogratree_layer_' + layerObjectSettings.layer_id + '_multilayer_' + generated_layers_list[i];
					layersList.changeOpacity(layerId, parseInt(currVal, 10) / 100);					
				}
				catch (err) {
					// ignore
				}
			}
		}
	});

	// -- Loading spinner when requesting data using ajax, will stop spinning once all ajax calls are done
	$(document).ajaxStop(function() {
		$(".loading-spinner").addClass("hidden");
		$(".dynamic-data").removeClass("hidden");
	});

	function panToCenterTrees(target, minZoom=4) {
		console.log("MinZoom set to " + minZoom);
		map.flyTo({
			center: target,
			bearing: 0,
			speed: .9,
			// minZoom: minZoom,
			// zoom: 0,
			zoom: minZoom,
			easing: function (t) {
				return t;
			}
		});
	}
	
	function isEmpty(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	}	

	function toggleDataset(datasetId, state) {
		if(debug) {
			console.log('toggleDataset function()');
			console.log('-- datasetId:' + datasetId);
		}

		var dataset_count = Object.keys(datasetKey).length;
		var datasetkeys = Object.keys(datasetKey);
		for(var i = 0; i < dataset_count; i++) {
			var temp_datasetkey = datasetkeys[i];
			//console.log(temp_datasetkey);
			if(datasetKey[temp_datasetkey] == datasetId) {
				activeDatasets[datasetId] = state; //set active
				if(temp_datasetkey.includes('geoserver_tileset')) {
					$("#" + temp_datasetkey + "-data").trigger('click');
				}
				else {
					$("#" + temp_datasetkey + "-data").toggleClass("active");
				}
				break;
			}
		}
		/*
		if (datasetId == 0) {
			activeDatasets[datasetId] = state;
			$("#treegenes-data").toggleClass("active");
		}
		else if (datasetId == 1) {
			activeDatasets[datasetId] = state;
			$("#treesnap-data").toggleClass("active");
		}
		else if (datasetId == 2) {
			activeDatasets[datasetId] = state;
			$("#datadryad-data").toggleClass("active");
		}
		
		else if (datasetId == 3) {
			activeDatasets[datasetId] = state;
			$("#bien_geoserver_tileset-data").trigger('click');
			//$("#bien_geoserver_tileset-data").toggleClass("active");
		}
		*/
		
			
	}

	//update zoom value 
	map.on("zoom", () => {
	  $("#zoom-level").text(map.getZoom().toFixed(2));
	});





	Array.prototype.intersection = function (arr) {
		return this.filter(function (i) {
			return arr.indexOf(i) >= 0;
		});
	};	

	Array.prototype.diff = function (arr) {
		return this.filter(function (i) {
			return arr.indexOf(i) < 0;
		});
	};

	cartograplant.unionArrays = unionArrays;
	function unionArrays(x, y) {
		var hashmap = {};
		for (var i = 0; i < x.length; i++) {
     		hashmap[x[i]] = x[i];
		}
		for (var i = 0; i < y.length; i++) {
			hashmap[y[i]] = y[i];
		}

		var unionXY = [];
		for (var k in hashmap) {
			if (hashmap.hasOwnProperty(k)) {
      			unionXY.push(hashmap[k]);
			}
		}
		return unionXY;
	}

	function roundHundredths(doubleVal) {
		return Math.round(doubleVal * 1000) / 1000;
	}

	function resetDatasets() {
		$("#treegenes-data").removeClass("active");
		$("#treesnap-data").removeClass("active");
		$("#datadryad-data").removeClass("active");
	}

	function isFloat(n) {
		return n === +n && n !== (n|0);
	}
	
	function isInteger(n) {
		return n === +n && n === (n|0);
	}

	/** When a map top button is clicked */
	$(document).on('click', '.map-top-button', function() {
		console.log('map-top-button clicked');
		// check if data-state is closed, then open it
		var button_state = $(this).attr('data-state');
		if (button_state == "closed") {
			$(this).parent().find('.map-top-container').slideDown(200);
			$(this).parent().find('.map-top-container').removeClass('map-top-hidden');
			$(this).find('.arrow i').removeClass('fa-chevron-down');
			$(this).find('.arrow i').addClass('fa-chevron-up');
			$(this).attr('data-state', 'opened');
		}
		else {
			$(this).parent().find('.map-top-container').slideUp(200);
			$(this).parent().find('.map-top-container').addClass('map-top-hidden');
			$(this).find('.arrow i').removeClass('fa-chevron-up');
			$(this).find('.arrow i').addClass('fa-chevron-down');
			$(this).attr('data-state', 'closed');
		}
	});

	// ON START UP
	$(document).ready(function() {
		$('#map-summary-button').click();
	});
	

	$(document).on('click', '.map-right-button', function() {
		console.log('map-right-button clicked');
		var button_state = $(this).attr('data-state');
		if  (button_state == "closed") {
			$(this).parent().find('.map-right-container').removeClass('map-right-hidden');
			$(this).find('.arrow i').removeClass('fa-chevron-up');
			$(this).find('.arrow i').addClass('fa-chevron-down');
			$(this).attr('data-state', 'opened');
		}
		else {

			$(this).parent().find('.map-right-container').addClass('map-right-hidden');
			$(this).find('.arrow i').removeClass('fa-chevron-down');
			$(this).find('.arrow i').addClass('fa-chevron-up');
			$(this).attr('data-state', 'closed');			
		}
	});
	
	$(document).on('click', '#nav-coordinate-go', function() {
		var lat = $('#nav-coordinate-lat-go').val();
		var lon = $('#nav-coordinate-lon-go').val();
		console.log('lat:' + lat + " lon:" + lon);
		if(lat != '' && lon != '') {
			try {
				toastr.info('Finding location on the map...');
				map.flyTo({
					center: [
						lon,
						lat
					],
					zoom: 7,
					essential: true // this animation is considered essential with respect to prefers-reduced-motion
				});
				var marker1 = new mapboxgl.Marker()
				.setLngLat([lon, lat])
				.addTo(map);
				setTimeout(function() {
					marker1.remove();
				},7000);
			}
			catch(err) {
				toastr.info('Sorry, the position you entered seems invalid, cannot find this location');
			}
		}
	});
	

    $('.mapbox-gl-draw_line').attr("data-toggle", "tooltip");
	$('.mapbox-gl-draw_line').attr("data-placement", "left");
	$('.mapbox-gl-draw_line').attr("title", "<div style='text-align: left; padding: 5px;'><b>Distance tool</b><br />Create at least 2 points by clicking locations on the map<br />When finished, click once more on your last point and your distance will popup.</div>");

    $('.mapbox-gl-draw_polygon').attr("data-toggle", "tooltip");
	$('.mapbox-gl-draw_polygon').attr("data-placement", "left");
	$('.mapbox-gl-draw_polygon').attr("title", "<div style='text-align: left; padding: 5px;'><b>Tree selection tool</b><br />Create polygon by clicking locations on the map<br />When finished, click once more on your last point and all trees within this region will be selected automatically.</div>");


	$.getScript(Drupal.settings.base_url + "/" + Drupal.settings.cartogratree.url_path + "/js/websocket.js", function( data, textStatus, jqxhr ) {
		// console.log( data ); // Data returned
		// console.log( textStatus ); // Success
		console.log( jqxhr.status ); // 200
		console.log( "Websocket functions initialized." );
	});
//});
}

$(ct_ready_mapjs);