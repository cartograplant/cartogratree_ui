var ct_ready_map_controls = function() {
    /**
     * Initialize Map Controls like line and polygon select controls for the map
     */


    console.log('Map controls starting up...');
    // add the draw control for polygons
    var draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
            line_string: true,
            polygon: true,
            trash: true
        },
        defaultMode: 'simple_select'
    });	

    class extendDrawBar {
        constructor(opt) {
            let ctrl = this;
            ctrl.draw = opt.draw;
            ctrl.buttons = opt.buttons || [];
            ctrl.onAddOrig = opt.draw.onAdd;
            ctrl.onRemoveOrig = opt.draw.onRemove;
        }
        onAdd(map) {
            let ctrl = this;
            ctrl.map = map;
            ctrl.elContainer = ctrl.onAddOrig(map);
            ctrl.buttons.forEach((b) => {
            ctrl.addButton(b);
            });

            return ctrl.elContainer;
        }
        onRemove(map) {
            let ctrl = this;
            ctrl.buttons.forEach((b) => {
            ctrl.removeButton(b);
            });
            ctrl.onRemoveOrig(map);
        }
        addButton(opt) {
            let ctrl = this;
            var elButton = document.createElement('button');
            elButton.className = 'mapbox-gl-draw_ctrl-draw-btn';
            if(opt.text != undefined) {
                elButton.setAttribute('title', opt.text);
            }
            if (opt.classes instanceof Array) {
            opt.classes.forEach((c) => {
                elButton.classList.add(c);
            });
            }
            elButton.addEventListener(opt.on, opt.action);
            ctrl.elContainer.appendChild(elButton);
            opt.elButton = elButton;
        }
        removeButton(opt) {
            opt.elButton.removeEventListener(opt.on, opt.action);
            opt.elButton.remove();
        }
    }

    var drawBar = new extendDrawBar({
        draw: draw,
        buttons: [
          {
            on: 'click',
            action: take_screenshot,
            classes: ['fas', 'fa-camera'],
            text: 'Take screenshot'
          }
        ]
    });
    cartograplant.map.addControl(drawBar, 'top-right');

    /**
     * Patch
     */



    var html2canvas_loaded = false;
    /**
    * Helpers
    */
    jQuery.loadAsync = function(url, callback) {
		// Don't use $.getScript since it disables caching
		jQuery.ajax({
			'url': url,
			'dataType': 'script',
			'cache': true,
			'success': callback || jQuery.noop
		});
	};   

    function take_screenshot() {
		const screenshotTarget = document.body;
		if (confirm('Taking a screenshot can temporarily freeze your browser, should we proceed?')) {
			// Save it!
			if(html2canvas_loaded == false) {
				$.loadAsync('https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js', function() {
					html2canvas_loaded = true;
					setTimeout(function() {
						html2canvas(screenshotTarget).then((canvas) => {
							const base64image = canvas.toDataURL("image/png");
							//console.log(base64image);
							saveAs(base64image, 'canvas.png');
							// window.location.href = base64image;
						});
					}, 500);
	
				
				});
			}
			else {
				setTimeout(function() {
					html2canvas(screenshotTarget).then((canvas) => {
						const base64image = canvas.toDataURL("image/png");
						//console.log(base64image);
						saveAs(base64image, 'canvas.png');
						// window.location.href = base64image;
					});
				},500);
						
			}
		} else {
			// Do nothing!
			console.log('Screenshot processing cancelled');
		}
    }  
    
	function saveAs(uri, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
          link.href = uri;
          link.download = filename;

          //Firefox requires the link to be in the body
          document.body.appendChild(link);

          //simulate click
          link.click();

          //remove the link when done
          document.body.removeChild(link);
        } else {
          window.open(uri);
        }
    }	    


    // cartograplant.map.addControl(draw);
    cartograplant.map.addControl(new mapboxgl.ScaleControl({position: 'bottom-right'}));

    cartograplant.map.on('draw.create', updateArea);
    cartograplant.map.on('draw.delete', updateArea);
    cartograplant.map.on('draw.update', updateArea);
    cartograplant.map.on('draw.modechange', function(e) {
        cartograplant.mouse_mode = e.mode;
        console.log(e);
    });


    cartograplant.arrayUnique = arrayUnique;

    /* This is a helper function to assist in merging arrays but only rendering the unique IDs */
    function arrayUnique(array) {
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
    
        return a;
    }

    // This code comes from https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-draw/
    function updateArea(e) {

        console.log('updateArea',e);
        var data = draw.getAll();
        console.log('data', data);

        if(e.features[0].geometry.type == "LineString") {
            if(e.type == "draw.create") {
                console.log('LineString created');
                var distance = 0;
                var prev_coord = null;
                for(var i=0; i<e.features[0].geometry.coordinates.length; i++) {
                    if(i>0) {
                        prev_coord = e.features[0].geometry.coordinates[i-1];
                        distance += turf.distance(prev_coord, e.features[0].geometry.coordinates[i], {units: 'kilometers'});
                    }
                }
                toastr.info('Distance: ' + Math.round(distance) + " km");
            }
            else if (e.type == "draw.update") {
                console.log('LineString updated');
                var distance = 0;
                var prev_coord = null;
                for(var i=0; i<e.features[0].geometry.coordinates.length; i++) {
                    if(i>0) {
                        prev_coord = e.features[0].geometry.coordinates[i-1];
                        distance += turf.distance(prev_coord, e.features[0].geometry.coordinates[i], {units: 'kilometers'});
                    }
                }
                toastr.info('Distance: ' + Math.round(distance) + " km");
            }
            else if (e.type == "draw.delete") {
                console.log('LineString deleted');
            }			
        }
        else {
            var answer = document.getElementById('calculated-area');
            var featuresJoined = null;

            try {
                // Reset the included trees
                // mapState.includedTrees = [];
                var polygon_ids = Object.keys(cartograplant.map_polygons);
                // Remove all polygon related trees first
                for (var j=0; j<polygon_ids.length; j++) {
                    var polygon_id = polygon_ids[j];
                    for (var i=0; i<cartograplant.map_polygons[polygon_id].features.features.length; i++) {
                        // remove the trees
                        var tree_id = cartograplant.map_polygons[polygon_id].features.features[i].properties.id;
                        cartograplant.activeTrees[tree_id] = false;
                        var index = mapState.includedTrees.indexOf(tree_id);
                        console.log('Index of ' + tree_id + ' - ' + index);
                        mapState.includedTrees.splice(index,1);
                    } 
                }      

                var relatedFeatures = cartograplant.current_dataset_data;
                console.log('relatedFeatures', relatedFeatures);
                featuresJoined = turf.pointsWithinPolygon(relatedFeatures, data);
                console.log('featuresJoined', featuresJoined);
                for(var i=0; i<featuresJoined.features.length; i++) {
                    var treeId = featuresJoined.features[i].properties.id;
                    cartograplant.activeTrees[treeId] = true;
                    if(!mapState.includedTrees.includes(treeId)) {
                        mapState.includedTrees.push(treeId);
                    }
                }
                cartograplant.notifyNumSelectedTrees();


                // Keep track of the polygon name and the features in this polygon
                if(cartograplant.map_polygons[e.features[0].id] == "undefined" || cartograplant.map_polygons[e.features[0].id] == null) {
                    cartograplant.map_polygons[e.features[0].id] = {};
                    cartograplant.map_polygons[e.features[0].id].features = featuresJoined;
                }
                else {
                    cartograplant.map_polygons[e.features[0].id].features = featuresJoined;
                }
                
            }
            catch (err) {
                console.log(err);
            }

            if (data.features.length > 0) {
                console.log('Features seems to be more than 0');
                console.log(e);
                var area = turf.area(data);
                // restrict to area to 2 decimal points
                // var rounded_area = Math.round(area * 100) / 100;
                //answer.innerHTML = '<p><strong>' + rounded_area + '</strong></p><p>square meters</p>';

                // https://medium.com/@anujsingh_wd/custom-draw-on-map-mapbox-gl-js-mapbox-draw-gl-turf-js-react-js-af579bdaa05f
                //var centroid = turf.centroid(data);
                //var rounded_area = Math.round(area*100)/100;
                
            } else {
                console.log('Features seems to be 0');
                console.log(e);
                console.log(cartograplant.map_polygons);
                if (e.type == 'draw.delete') {
                    console.log('polygons data', cartograplant.map_polygons);
                    console.log('map_polygons ids', Object.keys(cartograplant.map_polygons));
                    var polygon_id = e.features[0].id;
                    console.log('polygon id', polygon_id);
                    // console.log('polygon data', cartograplant.map_polygons[e.features[0].id])
                    // for (var i=0; i<cartograplant.map_polygons[e.features[0].id].features.features.length; i++) {
                    //     // remove the trees
                    //     var tree_id = cartograplant.map_polygons[e.features[0].id].features.features[i].properties.id;
                    //     cartograplant.activeTrees[tree_id] = false;
                    //     var index = mapState.includedTrees.indexOf(tree_id);
                    //     console.log('Index of ' + tree_id + ' - ' + index);
                    //     mapState.includedTrees.splice(index,1);
                    // }
                    delete cartograplant.map_polygons[polygon_id];
                
                    cartograplant.notifyNumSelectedTrees();
                    // cartograplant.map_polygons[e.features[0].id] = null;
                }			
                //	alert('Use the draw tools to draw a polygon!');
            }


        }
    }	
}
$(ct_ready_map_controls);