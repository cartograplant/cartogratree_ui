var ct_ready_map_realtime = function() {
    cartograplant['realtime'] = {};
    console.log('CartograPlant Realtime System is booting');
    // This will configure and connect to the CP API Socket IO Server
    var sio = io(Drupal.settings.base_url, {'path':'/cartogratree/api/realtime'});
    sio.emit('client_message','Message from client');

    // This will save the client_id which is used for CP UI to tell Socket
    // how to respond
    sio.on('client_id', function(obj) {
        cartograplant['realtime']['client_id'] = obj.client_id;
        console.log('REALTIME CLIENT ID', obj.client_id);
    });
    sio.on('test', function(obj) {
        console.log('test', obj);
    });
    sio.on('analysis_response', function(obj) {
        console.log('analysis_response', obj);
        if (obj.type != undefined) {
            if(obj.type == "popstruct_status") {
                var status_message = obj['message'];
                // Set the status in popstruct analysis status container
                $('#analysis-popstruct-status').fadeOut(1000);
                var html = '<h3>' + status_message;
                if(obj['complete'] != undefined) {
                    $('#analysis-popstruct-dapc-step1-plot-container').html('');
                }
                else {
                    html += '<img style="margin-top: -5px; width: 32px;" src="' + cartograplant.loading_icon_src + '" />';
                }
                html += '</h3>';
                $('#analysis-popstruct-status').html(html);
                $('#analysis-popstruct-status').fadeIn(1000);
            }
        }
    });

}
$(ct_ready_map_realtime);