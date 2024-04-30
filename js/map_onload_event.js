var ct_ready_map_onload_events = function() {
	/***************************************************************************************************
 	* Initialize the trees of the map and the methods associated with the trees on load of the webpage *
	***************************************************************************************************/
	
	window.addEventListener('load', (event) => {
		console.log('Page is fully loaded');
	});



    
	window.onload = function () {
		cartograplant.map.on("load", function () {
			//mapActivityStatus = 'map-loading-finished';
			if(cartograplant.debug) {
				console.log('Session from Drupal settings:');
				console.log(Drupal.settings.session);
				console.log('Perform loadSession function()');
			}

			try {
				cartograplant.map.addSource('mapbox-dem', {
					'type': 'raster-dem',
					'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
					'tileSize': 512,
					'maxzoom': 14
				});
				// add the DEM source as a terrain layer with exaggerated height
				cartograplant.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
			}
			catch (err) {
				console.log(err);
			}
			
			console.log('LoadSession');
			cartograplant.loadSession();	

			console.log('PositionMap');
			cartograplant.positionMap();
	
			//navigation controls
			cartograplant.map.addControl(new mapboxgl.NavigationControl());
			cartograplant.map.getCanvas().addEventListener("keydown", function(e) { 
				if (e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) {
					$("#arrow-controls").css("opacity", 1);
				}
				$("#arrow-controls").fadeTo("fast", 0.5);
            });

			//load the tree images
			console.log('load the tree images');
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["exact"]["gymnosperm"], "gymnosperm_ex");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["exact"]["angiosperm"], "angiosperm_ex");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["exact"]["plant"], "plant");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["approximate"]["gymnosperm"], "gymnosperm_app");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["approximate"]["angiosperm"], "angiosperm_app");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["treesnap"]["gymnosperm"], "treesnap_gymno");
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["treesnap"]["angiosperm"], "treesnap_angio");	
			cartograplant.loadImageWrapper(Drupal.settings.tree_img["wfid"]["angiosperm"], "wfid_ex");

			//load popstruct images
			for(var i=0; i<7; i++) {
				cartograplant.loadImageWrapper(Drupal.settings.base_url + '/cartogratree_uiapi/get_popstruct_icon/' + i, "popstruct_" + i);
			}

			//intialize reusable mapbox popups
			var popupInfo = new mapboxgl.Popup();
			var popupHover = new mapboxgl.Popup({closeButton: false});

			

			//load all the tree datasets from treegenes, dryad, treesnap
			console.log('initMapTrees called');
			cartograplant.initMapTrees();


			// When a click event occurs on a feature in the trees layer, open a popup at the location of the feature
			// The popup will have a more detailed information about the trees
			var clicked = 0;
			cartograplant.map.on("click", function (e) {
				// check the type of click
				if(cartograplant.mouse_mode == "simple_select") {
					clicked = clicked + 1;

                    // This function tries to determine single or double clicks
                    // using a timeout on how fast a user clicks with the mouse
					setTimeout(function(){
						if(clicked > 1){
							//marker.setLatLng(event.latlng);
							//marker.addTo(map); 
							//double click
							if(cartograplant.debug) {
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

			/**
			 * This function will close all opened map_top_button containers
			 * allow the map to then be zoomable (without closing, you cannot zoom on the map)
			 */
			function map_top_buttons_close_all() {
				$('.map-top-button[data-state="opened"]').each(function() {
					$(this).click();// this will close the opened container
				})
			}


			cartograplant.performSingleClickOnMap = performSingleClickOnMap;
			function performSingleClickOnMap(e) {
				map_top_buttons_close_all();


				//create a bounding box around the clicked point, to be used to query for features/trees around the bbox
				var treesBbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				if(cartograplant.debug) {
					console.log(treesBbox);
				}

				//create a bounding box based on the lat/long coordinates of the clicked point, will be used to query for environmental data
				var bbox = (e.lngLat.lat - .1) + "%2C" + (e.lngLat.lng - .1) + "%2C" + (e.lngLat.lat + .1) + "%2C" + (e.lngLat.lng + .1);   

				if (cartograplant.isNeonSite(treesBbox)) {
					return;
				}

				//get all the trees around the bounding box if they exist        
				var treesInSameCoord = cartograplant.map.queryRenderedFeatures(treesBbox, {
					layers: [cartograplant.datasetLayerId]
				});
				if(cartograplant.debug) {
					console.log('treesInSameCoord');
					console.log(treesInSameCoord);
				}
				var cluster = cartograplant.map.queryRenderedFeatures(treesBbox, {
					layers: [cartograplant.datasetClusterId]
				});
				
				//a tree wasn"t clicked, treat as random click event and display coords/env values only
				// RISH 2/16/2022: Removing this IF statement since we want environmental data when trees are clicked also
				//if (treesInSameCoord.length === 0 && cluster.length === 0) {							
					console.log(cartograplant.layersList);
					var layer_names = Object.keys(cartograplant.layersList.layers);
					for (var i=0; i<layer_names.length; i++) {
						var layer_name = layer_names[i];
						if(layer_name.includes('_tileset')) {
							//get the raw layerName used (used on the backend)
							var layer_name_raw = cartograplant.layersList.layers[layer_name]['layer_name'];
                            if(cartograplant.debug) {
							    console.log('RAW backend layer name: ' + layer_name_raw);
                            }
							//query the specific location for feature information	
						}
					}

					console.log('Layers List', cartograplant.layersList);
					// check if any layers are active from the layersList.layers
					var has_active_layers = false;
					var layerNames = Object.keys(cartograplant.layersList['layers']);
					for(var i=0; i<layerNames.length; i++) {
						var lay_obj = cartograplant.layersList['layers'][layerNames[i]];
						if(lay_obj['active'] == true) {
							has_active_layers = true;
							break;
						}
					}

					// If there are active environmental layers
					if(has_active_layers == true) {
						cartograplant.showEnvData(e.lngLat, bbox, treesBbox, e);
					}
				//}
				// RISH 2/16/2022: Removing the else if to an if because we also want to show tree data if a tree was clicked
				// else if (treesInSameCoord.length > 0 && !treesInSameCoord[0].properties.cluster) {
				if (treesInSameCoord.length > 0 && !treesInSameCoord[0].properties.cluster) {					
					cartograplant.clickedTrees = [];
					
					if(treesInSameCoord.length <= 1) {
						$('#tree-details-prev-tree').hide();
						$('#tree-details-next-tree').hide();
					}
					else {
						$('#tree-details-prev-tree').show();
						$('#tree-details-next-tree').show();						
					}
					for (var i = 0; i < treesInSameCoord.length; i++) {
						cartograplant.clickedTrees.push(treesInSameCoord[i].properties.id);
					}

					var coords = treesInSameCoord[0].geometry.coordinates;
					if(cartograplant.debug) {
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
					
					if (cartograplant.currMarker != null) {
						cartograplant.currMarker.remove();
					}
					//add marker to map					
					cartograplant.currMarker = new mapboxgl.Marker(el)
						.setLngLat({"lng": coords[0], "lat": coords[1]})
						.addTo(cartograplant.map);

					//clickedTrees = treesInSameCoord;
					//var coordKey = coords[1] e.lngLat.lat + "_" + e.lngLat.lng;
					var coordKey = coords[1] + "_" + coords[0];
					cartograplant.showTreeDetails(coordKey);

					cartograplant.addEnvData("#tree-details-extra", bbox, cartograplant.map.queryRenderedFeatures(treesBbox), e);
					
				}				
			}

            cartograplant.renderNeonPopup = renderNeonPopup;
			function renderNeonPopup(neonSite) {
				cartograplant.map.getCanvas().style.cursor = "pointer";
				var neonHTML = "<div class='card-header bg-secondary text-center'><h4 style='color: white;'>Lat:" + neonSite.properties.Latitude + " | Long: " + neonSite.properties.Longitude + "</h4></div>";
				neonHTML += "<div class='text-center'><h3>NEON Site Type: " + neonSite.properties.SiteType + "</h3><h5>";
				neonHTML += neonSite.properties.SiteHost + "</h5><h5>"; 
				neonHTML += neonSite.properties.DomainName + "</h5><div id='fieldsite-data'></div>";
				return neonHTML;
			}

			// a special type of hover event for mapbox layers being tested
			// same ideas as before, but with different layer id and properties of the layer being shown
			cartograplant.map.on("mouseenter", cartograplant.layersList.neon[0], function (e) {
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonSites = cartograplant.map.queryRenderedFeatures(bbox, {
					layers: [cartograplant.layersList.neon[0]]
				});

				if(cartograplant.debug) {
					console.log(neonSites);
				}
				if (neonSites.length > 0) {
					popupHover.setLngLat(e.lngLat)
						.setHTML(cartograplant.renderNeonPopup(neonSites[0]))
						.addTo(cartograplant.map);
				}
				else {
					popupHover.remove();
				}
			});
			
			cartograplant.map.on("click", cartograplant.layersList.neon[0], function (e) {
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonSites = cartograplant.map.queryRenderedFeatures(bbox, {
					layers: [cartograplant.layersList.neon[0]]
				});

				if (neonSites.length > 0) {
					map.getCanvas().style.cursor = "pointer";
					new mapboxgl.Popup().setLngLat(e.lngLat)
						.setHTML(cartograplant.renderNeonPopup(neonSites[0]))
						.addTo(cartograplant.map);

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
							if(cartograplant.debug) {
								console.log('map.on("click", cartograplant.layersList.neon[0] click function');
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
							if(cartograplant.debug) {
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

			cartograplant.map.on("mouseleave", cartograplant.layersList.neon[0], function () {
				cartograplant.map.getCanvas().style.cursor = "";
				popupHover.remove();
			});

			//hover event for neon plot sites
			cartograplant.map.on("mouseenter", cartograplant.layersList.neon[2], function (e) {
				if(cartograplant.debug) {
					console.log('mouseenter layerList.neon[2]');
				}
				var bbox = [
					[e.point.x, e.point.y],
					[e.point.x, e.point.y]
				];
				var neonPlots = cartograplant.map.queryRenderedFeatures(bbox, {
					layers: [cartograplant.layersList.neon[1], cartograplant.layersList.neon[2]]
				});
				
				if(cartograplant.debug) {
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
					cartograplant.map.getCanvas().style.cursor = "pointer";
					var neonHTML = "<div class='text-center'><h4>Plot Type: " + neonPlots[0].properties.plotTyp + "</h4><h5>";
					neonHTML += "National Land Cover DB classification: " + neonPlots[0].properties.nlcdCls + "<h5><h5>"; 
					neonHTML += "Subtype: " + neonPlots[0].properties.subtype + "</h5><h5 class='text-muted'>";
					neonHTML += "Date of collection: " + date + "</h5><p class='text-muted'>Lat:";
					neonHTML += neonPlots[0].properties.latitud + " | Long: " + neonPlots[0].properties.longitd + "</p>";
					//new mapboxgl.Popup().setLngLat(e.lngLat)
					popupHover.setLngLat(e.lngLat)
						.setHTML(neonHTML)
						.addTo(cartograplant.map);
				}
			});

			cartograplant.map.on("mouseleave", cartograplant.layersList.neon[2], function () {
				cartograplant.map.getCanvas().style.cursor = "";
				popupHover.remove();
			});
		
			//layersList.initPreloaded(); //Why is this here - seems the maps load good without this so removing it (Rish)
			
		});
	};
    
}
$(ct_ready_map_onload_events);