<?php

/**
 * @file
 * Administration for this module.
 */

/**
 * Provide a landing page for this module's admin settings by listing Layers.
 * URL suffix: ?q=admin/cartogratree/settings
 */
function cartogratree_admin_list() {
    $output = '';

    $output .= '<p>This module provides a form so users can manage GIS server settings, and layers.</p>';

    // ==============================================================================================================
    // servers
    $output .= '<h1>Servers</h1>';
    $gis = variable_get('cartogratree_gis', FALSE);
    $api = variable_get('cartogratree_api', FALSE);
    if ($gis == FALSE || $api == FALSE) {
        $output .= '<p>The URL for the GIS server and the API server must be provided. ';
        $output .= l('Add', 'admin/cartogratree/settings/servers/add');
        $output .= ' GIS and API servers.</p>';
    }
    else {
        $output .= '<p><strong>GIS server:</strong> ' . $gis . ', <strong>API server:</strong> ' . $api . '. ';
        $output .= l('Update', 'admin/cartogratree/settings/servers/edit');
        $output .= ' GIS and API servers.</p>';
    }
    $output .= '<p><a target="_blank" href="settings/debug/cpapi">Cartograplant NodeJS API realtime console output</a></p>';

    $output .= '<h1>Additional Geoserver Datasets</h1>';
    $output .= '<p>In order to make additional datasets available, you must add them here</p>';
    $output .= l('Add Geoserver Dataset', 'admin/cartogratree/settings/geoserver_dataset/add');
    $table = array(
    	'header' => array(
     		array('data' => 'Geoserver Dataset Name', 'width' => '50%'),
    		array('data' => 'Operations', 'width' => '50%'),
    	),
    	'rows' => array(),
    );
    //$results = db_query('SELECT * FROM {cartogratree_groups} order by group_rank');
    
    
    $geoserver_datasets = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
    $results = $geoserver_datasets;
    foreach ($results as $r) {
        $table['rows'][] = array(
        	'geoserver_dataset_name' => $r['geoserver_dataset_name'],
        	l('edit', 'admin/cartogratree/settings/geoserver_dataset/edit/' . $r['geoserver_dataset_id']) . ' | '
          . l('delete', 'admin/cartogratree/settings/geoserver_dataset/delete/' . $r['geoserver_dataset_id'])
        );
    }
    
    // If there are no groups yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
    }
    $output .= theme('table', $table);


    // ==============================================================================================================
    // groups
    $output .= '<h1>Groups</h1>';
    $output .= '<p>In order to make an environmental layer available to users, it must first be included below. Layers are organized in the side navigation menu into groups and optionally subgroups.</p>';
    $output .= l('Add group', 'admin/cartogratree/settings/group/add');
    $table = array(
    	'header' => array(
     		array('data' => 'Group Name', 'width' => '50%'),
    		array('data' => 'Operations', 'width' => '50%'),
    	),
    	'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_groups} order by group_rank');
    foreach ($results as $r) {
        $table['rows'][] = array(
        	'group_name' => $r->group_name,
        	l('edit', 'admin/cartogratree/settings/group/edit/' . $r->group_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/group/delete/' . $r->group_id) . ' | '
          . l('subgroups', 'admin/cartogratree/settings/group/' . $r->group_id . '/subgroups')
        );
    }
    // If there are no groups yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
    }
    $output .= theme('table', $table);

    // ==============================================================================================================
    //subgroups
    $output .= '<h2>Subgroups</h2>';
    $output .= l('Add subgroup', 'admin/cartogratree/settings/subgroup/add');
    $table = array(
    	'header' => array(
    		array('data' => 'Subgroup Name', 'width' => '50%'),
    		array('data' => 'Operations', 'width' => '50%'),
    	),
    	'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_subgroups}');
//    $results = db_select('cartogratree_subgroups', 's')
//        ->extend('PagerDefault')
//        ->fields('s')
//        ->limit(10)
//        ->execute();
    foreach ($results as $r) {
        $table['rows'][] = array(
        	'subgroup_name' => $r->subgroup_name,
        	l('edit', 'admin/cartogratree/settings/subgroup/edit/' . $r->subgroup_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/subgroup/delete/' . $r->subgroup_id)
        );
    }
    // If there are no subgroups yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
    }
    $output .= theme('table', $table);
//    $output .= theme('pager');

    // ==============================================================================================================
    // layers
    $output .= '<h3>Layers</h3>';
    $output .= l('Add layer', 'admin/cartogratree/settings/layer/add');
    $table = array(
    	'header' => array(
    		array('data' => 'Layer Name', 'width' => '50%'),
    		array('data' => 'Operations', 'width' => '50%'),
    	),
    	'rows' => array(),
    );
    $results = db_query('SELECT * FROM {cartogratree_layers}');
//    $results = db_select('cartogratree_layers', 'l')
//        ->extend('PagerDefault')
//        ->fields('l')
//        ->limit(10)
//        ->execute();
    foreach ($results as $r) {
        $operations = l('edit', 'admin/cartogratree/settings/layer/edit/' . $r->layer_id) . ' | '
          . l('delete', 'admin/cartogratree/settings/layer/delete/' . $r->layer_id) . ' | '
          . l('access', 'admin/cartogratree/settings/layer/access/' . $r->layer_id);
        if (!$r->trees_layer) {
            $operations .= ' | ' . l('get values', 'admin/cartogratree/settings/get_environmental_values/' . $r->layer_id);
        }
        $table['rows'][] = array(
        	'name' => $r->title,
        	$operations,
        );
    }
    // If there are no layers yet, display only the headers of the table.
    if (empty($table['rows'])) {
        $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
    }
    $output .= theme('table', $table);
//    $output .= theme('pager');

    return $output;
}

/**
 * CPIAPI DEBUG CONSOLE OUTPUT REALTIME
 */
function cartogratree_admin_debug_cpapi($form, &$form_state) {
    global $base_url; 
    $html = "";
    $html .= '<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.6.0/socket.io.min.js" integrity="sha512-uXal8CICQ52UxoF9A3yBP6GUXGu5N2IoTZf/YXGMW4M0AvNyViA0ZjpGf9uqRpkN4kyx41Y5I0DmTQNOS6G05A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>';
    $html .= '<style>.debug-line { background-color: #d0ffe5;padding: 5px; margin-bottom: 2px; }</style>';
    $html .= '<script>';
    $html .= 'jQuery(document).ready(function() {';
    $html .= ' console.log("Ready for socket io");';
    
    $ctapi_path = '/cartogratree/api/realtime';
    $html .= ' var socket = io("' . $base_url . '", {"path":"' . $ctapi_path . '"});' . "\n";
    $html .= ' onConnect();';
    $html .= ' socket.io.on("reconnect", () => {';  
    $html .= '  console.log("Reconnecting...");';
    $html .= '  onConnect();';
    $html .= ' });';
    $html .= ' function onConnect() {';
    $html .= '  socket.emit("join_channel", {channel_name: "cp-debug"});' . "\n";
    $html .= ' }';
    $html .= ' socket.on("debug-line", function(obj) {';
    $html .= '  console.log(obj);';
    $html .= '  var space_parts = obj["line"].split(" ");';
    $html .= '  if(space_parts[1] == "memory_used:") {';
    $html .= '   jQuery("#memory_used").html(Math.ceil(space_parts[2]) + " MB");';
    $html .= '  }';
    $html .= '  else if(space_parts[1] == "realtime_connections_count:") {';
    $html .= '   jQuery("#realtime_connections_count").html(space_parts[2]);';
    $html .= '  }';    
    $html .= '  else {';
    // $html .= '  jQuery("#debug").prepend("<div class=\"debug-line-time\">" + space_parts[0] + "</div>");';
    $html .= '   jQuery("#debug").prepend("<div class=\"debug-line\">" + obj["line"] + "</div>").hide().fadeIn(500);';
    $html .= '  }';
    $html .= ' });';
    $html .= '});';
    $html .= '</script>';
    $html .= '<div style="text-align: center;">';
    $html .= '<div style="display: inline-block; width: 25%; text-align: center;">';
    $html .= '  <div><i style="font-size: 20px;" class="fa fa-microchip" aria-hidden="true"></i><br />Memory used</div>';
    $html .= '  <div id="memory_used" style="font-size: 24px;"><i class="fa fa-clock-o" aria-hidden="true"></i></div>';
    $html .= '</div>';
    $html .= '<div style="display: inline-block; width: 25%; text-align: center;">';
    $html .= '  <div><i style="font-size: 20px;" class="fa fa-eye" aria-hidden="true"></i><br />Realtime connections</div>';
    $html .= '  <div id="realtime_connections_count" style="font-size: 24px;"><i class="fa fa-clock-o" aria-hidden="true"></i></div>';
    $html .= '</div>';  
    $html .= '</div>';    
    $html .= '<div style="margin-top: 20px; text-align: center;">Realtime logs - latest messages first</div>';
    $html .= '<div id="debug"></div>';

    $form['console'] = array(
        '#prefix' => $html
    );
    return $form;
}

/**
 * Dataset admin form.
 * URL suffix: ?q=admin/cartogratree/settings/dataset/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_geoserver_dataset_form($form, &$form_state) {
    //dpm($form_state['build_info']['args']);
    if ($form_state['build_info']['args'][0] == 'add') {
        //We need at minimum the dataset id (underscored if necessary for the UI), the dataset name, the geoserver raw tileset name

        $form['geoserver_dataset_id'] = array(
            '#type' => 'textfield',
            '#value' => '',
            '#title' => 'Geoserver Dataset ID number (unique integer)'
        );
        $form['geoserver_dataset_name'] = array(
            '#type' => 'textfield',
            '#value' => '',
            '#title' => 'Geoserver Dataset Name (The caption / text seen for UI toggle button - letters,numbers,digits,spaces allowed)'
        );
        $form['geoserver_dataset_layer_name'] = array(
            '#type' => 'textfield',
            '#value' => '',
            '#title' => 'Geoserver Dataset Layer Name (the geoserver layer name)'
        );                
        $form['add'] = array(
        	'#type' => 'submit',
        	'#value' => 'Add',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );        
    }
    else if($form_state['build_info']['args'][0] == 'delete') {
        $form['geoserver_dataset_id'] = array(
            '#type' => 'textfield',
            '#value' => $form_state['build_info']['args'][1],
            '#title' => 'Geoserver Dataset ID number (unique integer)'
        );        
        $form['delete'] = array(
        	'#type' => 'submit',
        	'#value' => 'Delete',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );
    }
    else if($form_state['build_info']['args'][0] == 'edit') {
        $dataset_id = $form_state['build_info']['args'][1];
        $geoserver_datasets = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
        $form['geoserver_dataset_id'] = array(
            '#type' => 'textfield',
            '#value' => $dataset_id,
            '#title' => 'Geoserver Dataset ID number (unique integer)'
        );        
        $form['geoserver_dataset_name'] = array(
            '#type' => 'textfield',
            '#value' => $geoserver_datasets[$dataset_id]['geoserver_dataset_name'],
            '#title' => 'Geoserver Dataset Name (The caption / text seen for UI toggle button - letters,numbers,digits,spaces allowed)'
        );
        $form['geoserver_dataset_layer_name'] = array(
            '#type' => 'textfield',
            '#value' => $geoserver_datasets[$dataset_id]['geoserver_dataset_layer_name'],
            '#title' => 'Geoserver Dataset Layer Name (the geoserver layer name)'
        );                
        $form['edit'] = array(
        	'#type' => 'submit',
        	'#value' => 'Edit',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );
    }
    return $form;
}

/**
 * Dataset admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/geoserver_dataset/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_geoserver_dataset_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    //dpm($form_state);
    //dpm($form);
    if($form_state['build_info']['args'][0] == 'add') {
        $geoserver_datasets = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
        if(!isset($geoserver_datasets[$form_state['input']['geoserver_dataset_id']])) {
            $geoserver_datasets[$form_state['input']['geoserver_dataset_id']] = array(
                'geoserver_dataset_id' => $form_state['input']['geoserver_dataset_id'],
                'geoserver_dataset_name' => $form_state['input']['geoserver_dataset_name'],
                'geoserver_dataset_layer_name' => $form_state['input']['geoserver_dataset_layer_name']
            );
            variable_set('ct_geoserver_datasets', serialize($geoserver_datasets));
            drupal_set_message('Successfully added new Geoserver Dataset');
            //$geoserver_datasets[$form_state]
        }
        else {
            drupal_set_message('Sorry! It seems a Geoserver Dataset with the id you specified already exists');
        }

    }
    else if($form_state['build_info']['args'][0] == 'edit') {
        $geoserver_datasets = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
        if(isset($geoserver_datasets[$form_state['input']['geoserver_dataset_id']])) {
            $geoserver_datasets[$form_state['input']['geoserver_dataset_id']] = array(
                'geoserver_dataset_id' => $form_state['input']['geoserver_dataset_id'],
                'geoserver_dataset_name' => $form_state['input']['geoserver_dataset_name'],
                'geoserver_dataset_layer_name' => $form_state['input']['geoserver_dataset_layer_name']
            );
            variable_set('ct_geoserver_datasets', serialize($geoserver_datasets));
            drupal_set_message('Successfully edited Geoserver Dataset');
            //$geoserver_datasets[$form_state]
        }
        else {
            drupal_set_message('Sorry! It seems we could not find the corresponding dataset with id to edit.');
        }        
    }
    else if($form_state['build_info']['args'][0] == 'delete') {
        $geoserver_datasets = unserialize(variable_get('ct_geoserver_datasets', serialize(array())));
        if(isset($geoserver_datasets[$form_state['input']['geoserver_dataset_id']])) {
            unset($geoserver_datasets[$form_state['input']['geoserver_dataset_id']]);
            variable_set('ct_geoserver_datasets', serialize($geoserver_datasets));
            drupal_set_message('Successfully deleted Geoserver Dataset');
            //$geoserver_datasets[$form_state]
        }
        else {
            drupal_set_message('Sorry! It seems we could not find the Geoserver Dataset to delete.');
        }   
    }
}

/**
 * Group admin form.
 * URL suffix: ?q=admin/cartogratree/settings/group/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_group_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_groups}
            WHERE group_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['group_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->group_id)) ? $obj->group_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {
        $table = array(
        	'header' => NULL,
        	'rows' => array(
        		array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
        		array(array('data' => 'Group rank', 'header' => TRUE), $obj->group_rank),
        	),
        );
        $form['info'] = array(
        	'#type' => 'markup',
        	'#markup' => '<p>Would you like to delete the following group?</p>'
          . theme('table', $table)
        );

        $form['group_name'] = array(
        	'#type' => 'hidden',
        	'#value' => $obj->group_name,
        );

        $form['delete'] = array(
        	'#type' => 'submit',
        	'#value' => 'Delete',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {
        $form['group_name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Group name',
        	'#description' => 'Accordion group name for side navigation menu.',
        	'#default_value' => (isset($obj->group_name)) ? $obj->group_name : '',
        );

        $form['group_rank'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Group rank',
        	'#description' => 'Rank of the group (the lower the rank the higher is displayed in the accordion.',
        	'#default_value' => (isset($obj->group_rank)) ? $obj->group_rank : '',
        	'#size' => 3,
        );

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
        	'#type' => 'submit',
        	'#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Group admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/group/[add|edit|delete][/<group id>]
 */
function cartogratree_admin_settings_group_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_groups} WHERE group_id=:id', array(':id' => $form_state['values']['group_id']));
        db_query('DELETE FROM {cartogratree_groups_subgroups} WHERE group_id=:id', array(':id' => $form_state['values']['group_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['group_name'] . '</em>.');
    }
    else {
        $record = array(
        	'group_name' => $form_state['values']['group_name'],
        	'group_rank' => $form_state['values']['group_rank'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_groups', $record);
        }
        else {
            $record['group_id'] = $form_state['values']['group_id'];
            drupal_write_record('cartogratree_groups', $record, 'group_id');
        }
    }
}

/**
 * Group management form.
 * URL suffix: ?q=admin/cartogratree/settings/group/subgroups/<group id>
 */
function cartogratree_admin_group_management_form($form, &$form_state) {
//    drupal_set_message($form_state['build_info']['args'][0]);

    $obj = NULL;
    if (isset($form_state['build_info']['args'][0])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_groups}
            WHERE group_id=:id', 
			array(':id' => $form_state['build_info']['args'][0]))->fetchObject();
    }

    $form['#attached']['css'][] = array(
    	'data' => '
    		table caption {
    			margin-top: 50px;
    			font-weight: bold;
     			font-size: 1.2em;
      			text-align: left;
      		}
      		th.name, td.name {
        		width: 300px;
      		}
      		input[type=text] {
        		width: 250px;
      		}
      		td.add {
        		background-color: #e1e2dc;
        		border-top: 1px solid #bebfb9;
      		}
      		td.add input[type=submit] {
        		margin-top: 10px;
        		margin-bottom: 0px;
      		}
    	',
    	'type' => 'inline',
    );

    $form['group_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->group_id)) ? $obj->group_id : NULL,
    );

    $form['info'] = array(
    	'#type' => 'markup',
    	'#theme' => 'table',
    	'#header' => NULL,
    	'#rows' => array(
        	array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
        	array(array('data' => 'Group rank', 'header' => TRUE), $obj->group_rank),
    	),
    );

    // SUBGROUPS:
    //---------------
    $form['subgroup'] = array(
    	'#type' => 'markup',
    	'#tree' => TRUE,
    	'#title' => 'Subgroups',
    	'#caption' => 'The following subgroups are children of <em>' . $obj->group_name . '</em>.',
    	'#theme' => 'cartogratree_admin_form_group_mgmt_table',
    );

    $count = 0;
    $subgroup_ids = array();
    $resource = db_query('
        SELECT s.subgroup_id, s.subgroup_name, gs.subgroup_rank
        FROM {cartogratree_subgroups} s
        JOIN {cartogratree_groups_subgroups} gs ON gs.subgroup_id = s.subgroup_id
        WHERE gs.group_id=:id
        ORDER BY gs.subgroup_rank', array(':id' => $obj->group_id));
    foreach ($resource as $r) {
        $count++;
        array_push($subgroup_ids, $r->subgroup_id);

        $form['subgroup'][$r->subgroup_id]['id'] = array(
        	'#type' => 'item',
        	'#value' => $r->subgroup_id,
        );

        $form['subgroup'][$r->subgroup_id]['name'] = array(
        	'#type' => 'item',
        	'#value' => $r->subgroup_name,
        );

        $form['subgroup'][$r->subgroup_id]['rank'] = array(
        	'#type' => 'item',
        	'#value' => $r->subgroup_rank,
        );

        $form['subgroup'][$r->subgroup_id]['remove_url'] = array(
        	'#type' => 'item',
        	'#value' => 'admin/cartogratree/settings/group/' . $obj->group_id . '/remove-subgroup/' . $r->subgroup_id,
        );
    }
    if (!$count) {
        $form['subgroup']['none']['name'] = array(
        	'#type' => 'item',
       		'#value' => 'None.',
        );
    }

    $options = array();
    $exclude_list = count($subgroup_ids) ? 'WHERE subgroup_id NOT IN (' . implode(',', $subgroup_ids) . ')' : '';
    $resource = db_query('SELECT * FROM {cartogratree_subgroups} ' . $exclude_list);
    foreach ($resource as $r) {
        $options[$r->subgroup_id] = $r->subgroup_name;
    }
    $form['subgroup']['add']['select'] = array(
    	'#type' => 'select',
   		'#title' => 'Subgroup to add',
    	'#options' => $options,
    	'#empty_value' => 'None',
    );

    $form['subgroup']['add']['text'] = array(
    	'#type' => 'textfield',
    	'#title' => 'Subgroup rank',
    );

    $form['subgroup']['add']['submit'] = array(
    	'#type' => 'submit',
    	'#value' => 'Add subgroup',
    );

    return $form;
}

/**
 * Group management form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/group/subgroups/<group id>
 */
function cartogratree_admin_group_management_form_submit($form, &$form_state) {
    if ($form_state['values']['subgroup']['add']['select'] == 'None')
        return;

    $record = array(
   		'group_id' => $form_state['values']['group_id'],
    	'subgroup_id' => form_get_options($form['subgroup']['add']['select'], $form_state['values']['subgroup']['add']['select'])[0],
    	'subgroup_rank' => $form_state['values']['subgroup']['add']['text'],
    );
    drupal_write_record('cartogratree_groups_subgroups', $record);
}

/**
 * Subgroup admin form.
 * URL suffix: ?q=admin/cartogratree/settings/subgroup/[add|edit|delete][/<subgroup id>]
 */
function cartogratree_admin_settings_subgroup_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_subgroups}
            WHERE subgroup_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['subgroup_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->subgroup_id)) ? $obj->subgroup_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {
        $table = array(
        	'header' => NULL,
        	'rows' => array(
        		array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
        	),
        );
        $form['info'] = array(
        	'#type' => 'markup',
        	'#markup' => '<p>Would you like to delete the following subgroup?</p>'
          .	theme('table', $table)
        );

        $form['subgroup_name'] = array(
        	'#type' => 'hidden',
        	'#value' => $obj->subgroup_name,
        );

        $form['delete'] = array(
        	'#type' => 'submit',
        	'#value' => 'Delete',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {
        $form['subgroup_name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Subgroup name',
        	'#description' => 'Accordion subgroup name for side navigation menu.',
        	'#default_value' => (isset($obj->subgroup_name)) ? $obj->subgroup_name : '',
        );

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
        	'#type' => 'submit',
        	'#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Subgroup admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/subgroup/[add|edit|delete][/<subgroup id>]
 */
function cartogratree_admin_settings_subgroup_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_subgroups} WHERE subgroup_id=:id', array(':id' => $form_state['values']['subgroup_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['subgroup_name'] . '</em>.');
    }
    else {
        $record = array(
        	'subgroup_name' => $form_state['values']['subgroup_name'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_subgroups', $record);
        }
        else {
            $record['subgroup_id'] = $form_state['values']['subgroup_id'];
            drupal_write_record('cartogratree_subgroups', $record, 'subgroup_id');
        }
    }
}

/**
 * Layer admin form.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query("
            SELECT * FROM {cartogratree_layers} l
            LEFT JOIN {cartogratree_groups} g ON g.group_id = l.group_id
            LEFT JOIN {cartogratree_subgroups} s ON s.subgroup_id = l.subgroup_id
            WHERE layer_id=:id", 
			array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['layer_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->layer_id)) ? $obj->layer_id : NULL,
    );

    if ($form_state['build_info']['args'][0] == 'delete') {
        $table = array(
        	'header' => NULL,
        	'rows' => array(
            	array(array('data' => 'Human-readable name', 'header' => TRUE), $obj->title),
            	array(array('data' => 'Name used with the GIS server', 'header' => TRUE), $obj->name),
            	array(array('data' => 'URL for the layer provider', 'header' => TRUE), $obj->url),
            	array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
            	array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
                array(array('data' => 'Layer rank', 'header' => TRUE), $obj->layer_rank),
                array(array('data' => 'Layer styles', 'header' => TRUE), $obj->layer_styles),
                array(array('data' => 'Layer legend HTML', 'header' => TRUE), $obj->layer_legend_html),
                // layer_legend_orientation
                // layer_legend_hide_default
                array(array('data' => 'Hide default layer legend', 'header' => TRUE), $obj->layer_legend_hide_default),
                array(array('data' => 'Layer legend orientation', 'header' => TRUE), $obj->layer_legend_orientation),
                array(array('data' => 'Decimal precision for layer embedded data', 'header' => TRUE), $obj->layer_embedded_data_decimal_precision),
                array(array('data' => 'Layer add year range filter', 'header' => TRUE), $obj->layer_year_range_filter_option),
                array(array('data' => 'Layer year range geoserver parameter', 'header' => TRUE), $obj->layer_year_range_filter_geoserver_parameter),
                array(array('data' => 'Layer year range start year', 'header' => TRUE), $obj->layer_year_range_filter_year_start),
                array(array('data' => 'Layer year range end year', 'header' => TRUE), $obj->layer_year_range_filter_year_end),
                array(array('data' => 'Layer embedded fields to hide', 'header' => TRUE), $obj->layer_embedded_fields_hide),
                array(array('data' => 'Layer embedded fields to rename', 'header' => TRUE), $obj->layer_embedded_fields_rename),
                array(array('data' => 'Layer embedded fields eval manipulations', 'header' => TRUE), $obj->layer_embedded_data_eval),
                array(array('data' => 'Analysis Category ID', 'header' => TRUE), $obj->analysis_category_id),
                //layer_embedded_data_eval
                //layer_embedded_fields_rename
                array(array('data' => 'Allow user to select/change colors via the map interface?', 'header' => TRUE), $obj->layer_allow_user_select_colors),
            	array(array('data' => 'Trees layer', 'header' => TRUE), $obj->trees_layer ? 'true' : 'false'),
				array(array('data' => 'Layer host', 'header' => TRUE), $obj->layer_host ? 'true' : 'false'),
          ),
        );
        $form['info'] = array(
        	'#type' => 'markup',
        	'#markup' => '<p>Would you like to delete the following layer?</p>'
          . theme('table', $table)
          . '<p><strong>Description:</strong> ' . $obj->title . '</p>',
        );

        $form['name'] = array(
        	'#type' => 'hidden',
        	'#value' => $obj->name,
        );

        $form['delete'] = array(
        	'#type' => 'submit',
        	'#value' => 'Delete',
        	'#suffix' => '<span> ' . l('or Cancel', '/admin/cartogratree/settings') . '</span>',
        );

        return $form;
    }
    else {

        $form['fieldset_layer_required_configuration'] = array(
            '#type' => 'fieldset',
            '#title' => t('Layer required configuration'),
        );  

        $form['fieldset_layer_required_configuration']['name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Human-readable name',
        	'#description' => 'This is the name shown to the CartograTree users. Make sure it is descriptive and uniquely identifies the layer.',
        	'#default_value' => (isset($obj->title)) ? $obj->title : '',
        	'#required' => TRUE,
        );

        $form['fieldset_layer_required_configuration']['machine_name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Machine name',
        	'#description' => 'Name used with the GIS server or the Mapbox layer id.',
        	'#default_value' => (isset($obj->name)) ? $obj->name : '',
        	'#required' => TRUE,
        );


        $form['fieldset_layer_required_configuration']['url'] = array(
        	'#type' => 'textfield',
        	'#title' => 'URL',
       		'#description' => 'The URL for the provider of the layer.',
        	'#default_value' => (isset($obj->url)) ? $obj->url : '',
        	'#required' => TRUE,
        );

        $form['fieldset_layer_required_configuration']['layer_host'] = array(
        	'#type' => 'radios',
        	'#title' => 'Layer host',
        	'#description' => 'This layer is hosted on mapbox or geoserver?',
        	'#options' => array(
            	1 => t('Mapbox'),
            	0 => t('Geoserver'),
          	),
        	'#default_value' => (isset($obj->layer_host)) ? $obj->layer_host : 0,
        	'#required' => TRUE,
        );

        $form['fieldset_layer_required_configuration']['trees_layer'] = array(
        	'#type' => 'radios',
        	'#title' => 'Trees layer',
        	'#description' => 'This layer has trees (yes) or other/environmental data (no).',
        	'#options' => array(
            	1 => t('Yes'),
            	0 => t('No'),
          	),
        	'#default_value' => (isset($obj->trees_layer)) ? $obj->trees_layer : 0,
        	'#required' => TRUE,
        );

        $options = array();
        $resource = db_query('SELECT * FROM {cartogratree_groups} ORDER BY group_rank');
        $options['None'] = '- None -';
        foreach ($resource as $r) {
            $options[$r->group_id] = $r->group_name;
        }
        $form['fieldset_layer_required_configuration']['group_name'] = array(
        	'#type' => 'select',
        	'#title' => 'Group name',
        	'#description' => 'Accordion group name for side navigation menu.',
        	'#id' => 'cartogratree_group_name',
        	'#options' => $options,
        	'#default_value' => (isset($obj->group_id)) ? $obj->group_id : 0,
        	'#required' => TRUE,
        );

        $options = array();
        $options['None'] = '- None -';
        $resource = db_query('SELECT g.group_name, s.subgroup_id, s.subgroup_name
            FROM {cartogratree_groups_subgroups} gs
            JOIN {cartogratree_groups} as g on gs.group_id = g.group_id
            JOIN {cartogratree_subgroups} s on gs.subgroup_id = s.subgroup_id
            ORDER BY g.group_rank, gs.subgroup_rank');
        foreach ($resource as $r) {
            $options[$r->group_name][$r->subgroup_id] = $r->subgroup_name;
        }

        $form['fieldset_layer_required_configuration']['subgroup_name'] = array(
        	'#type' => 'select',
        	'#title' => 'Subgroup name',
        	'#description' => 'Accordion subgroup name for side navigation menu.',
        	'#options' => $options,
        	'#default_value' => (isset($obj->subgroup_id)) ? $obj->subgroup_id : 'None',
        	'#prefix' => '<div id="cartogratree_subgroup_name_div">',
        	'#suffix' => '</div>',
        	'#required' => TRUE,
        );

        $form['fieldset_layer_required_configuration']['layer_rank'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Layer rank',
        	'#description' => 'Layer rank for side navigation menu.',
        	'#default_value' => (isset($obj->layer_rank)) ? $obj->layer_rank : '',
        	'#size' => 3,
        );     

        $form['fieldset_layer_required_configuration']['layer_styles'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Layer styles',
        	'#description' => 'If this is a geoserver environmental layer, you can specify a style or multiple styles delimited by commas (optional)',
        	'#default_value' => (isset($obj->layer_styles)) ? $obj->layer_styles : '',
        );


        $form['layer_embedded_data_decimal_precision'] = array(
        	'#type' => 'textfield',
            '#title' => 'Decimal precision for layer embedded data',
        	'#description' => 'If specified, this option will round all decimal values to a specific precision for display on the map (environmental values)',
        	'#default_value' => (isset($obj->layer_embedded_data_decimal_precision)) ? $obj->layer_embedded_data_decimal_precision : 3,
        );         

        $form['layer_allow_user_select_colors'] = array(
        	'#type' => 'checkbox',
        	'#title' => 'Allow user to select/change colors via the map interface?',
        	'#description' => 'When enabled, this option will add a color palette that allows a user to change the layer color on the map',
        	'#default_value' => (isset($obj->layer_allow_user_select_colors)) ? $obj->layer_allow_user_select_colors : 0,
        ); 
        
        $form['fieldset_year_range_filter'] = array(
            '#type' => 'fieldset',
            '#title' => t('Year range filter by layer\'s embedded data'),
        );

        $form['fieldset_year_range_filter']['layer_year_range_filter_option'] = array(
        	'#type' => 'checkbox',
        	'#title' => 'Allow user to filter by year range via the map interface (embedded within the layer)?',
        	'#description' => 'When enabled, this option will add a year range slider for filtering',
        	'#default_value' => (isset($obj->layer_year_range_filter_option)) ? $obj->layer_year_range_filter_option : 0,
        );  
        
        $form['fieldset_year_range_filter']['layer_year_range_filter_geoserver_parameter'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Year range geoserver parameter',
        	'#description' => 'This is the parameter to use when filtering the geoserver layer',
        	'#default_value' => (isset($obj->layer_year_range_filter_geoserver_parameter)) ? $obj->layer_year_range_filter_geoserver_parameter : '',
            '#states' => array(
                'visible' => array(
                  ':input[name="layer_year_range_filter_option"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),            
        );      
        
       
        $form['fieldset_year_range_filter']['layer_year_range_filter_year_start'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Year range starting year',
        	'#description' => 'This is the start year option in the year range slider (left slider)',
        	'#default_value' => (isset($obj->layer_year_range_filter_year_start)) ? $obj->layer_year_range_filter_year_start : '',
            '#states' => array(
                'visible' => array(
                  ':input[name="layer_year_range_filter_option"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),              
        );
        
        $form['fieldset_year_range_filter']['layer_year_range_filter_year_end'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Year range ending year',
        	'#description' => 'This is the ending year option in the year range slider (right slider)',
        	'#default_value' => (isset($obj->layer_year_range_filter_year_end)) ? $obj->layer_year_range_filter_year_end : '',
            '#states' => array(
                'visible' => array(
                  ':input[name="layer_year_range_filter_option"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),              
        );
        
        
        $form['fieldset_layer_multilayer_rangeslider_year_option'] = array(
            '#type' => 'fieldset',
            '#title' => t('Year range slider using multiple layers'),
        );

        $form['fieldset_layer_multilayer_rangeslider_year_option']['layer_multilayer_rangeslider_year_option'] = array(
        	'#type' => 'checkbox',
        	'#title' => 'Allow user to filter this multi-layer using a year range slider',
        	'#description' => 'When enabled, this option will add a year range slider for filtering multiple layers. Replace machine_name year with % character',
        	'#default_value' => (isset($obj->layer_multilayer_rangeslider_year_option)) ? $obj->layer_multilayer_rangeslider_year_option : 0,
        );          
        
        $form['fieldset_layer_multilayer_rangeslider_year_option']['layer_multilayer_rangeslider_start_year'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Year range starting year',
        	'#description' => 'This is the start year option in the year range slider (left slider)',
        	'#default_value' => (isset($obj->layer_multilayer_rangeslider_start_year)) ? $obj->layer_multilayer_rangeslider_start_year : '',
            '#states' => array(
                'visible' => array(
                  ':input[name="layer_multilayer_rangeslider_year_option"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),              
        );     
        
        $form['fieldset_layer_multilayer_rangeslider_year_option']['layer_multilayer_rangeslider_end_year'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Year range ending year',          
        	'#description' => 'This is the end year option in the year range slider (left slider)',
        	'#default_value' => (isset($obj->layer_multilayer_rangeslider_end_year)) ? $obj->layer_multilayer_rangeslider_end_year : '',
            '#states' => array(
                'visible' => array(
                  ':input[name="layer_multilayer_rangeslider_year_option"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),              
        );   
        
        $form['fieldset_legend_config'] = array(
            '#type' => 'fieldset',
            '#title' => t('Legend features / configuration'),
        );        

        // layer_legend_hide_default
        $form['fieldset_legend_config']['layer_legend_hide_default'] = array(
        	'#type' => 'checkbox',
        	'#title' => 'Hide default layer legend?',
        	'#description' => 'When enabled, this option will hide the default layer legend usually retrieved from GeoServer',
        	'#default_value' => (isset($obj->layer_legend_hide_default)) ? $obj->layer_legend_hide_default : 0,
        );     
        
        // layer_legend_orientation
        $form['fieldset_legend_config']['layer_legend_orientation'] = array(
        	'#type' => 'select',
        	'#title' => 'Layer legend orientation',
        	'#description' => 'Select the legend\'s orientation',
        	'#options' => array(
            	'vertical' => t('Vertical'),
            	'horizontal' => t('Horizontal'),
          	),
        	'#default_value' => (isset($obj->layer_legend_orientation)) ? $obj->layer_legend_orientation : 'horizontal',
        	'#required' => TRUE,
            '#states' => array(
                'invisible' => array(
                  ':input[name="layer_legend_hide_default"]' => array(
                        'checked' => TRUE,
                    ),
                ),
            ),             
        );        

        // layer_legend_html
        $form['fieldset_legend_config']['layer_legend_html'] = array(
        	'#type' => 'textarea',
        	'#title' => 'Layer Legend HTML',
        	'#description' => 'Legend HTML code for this specific HTML layer',
        	'#default_value' => (isset($obj->layer_legend_html)) ? $obj->layer_legend_html : '',            
        );
       

        $form['fieldset_layer_data_manipulation_config'] = array(
            '#type' => 'fieldset',
            '#title' => t('Layer embedded data manipulation configuration'),
        ); 

        $form['fieldset_layer_data_manipulation_config']['layer_retrieve_raw_field_names'] = array(
            '#type' => 'button',
            '#value' => t('Get embedded raw field names for this layer'), 
            '#description' => t('Retrieve a list of embedded field names which you can use to enter into the fields to hide or fields to rename settings.'),
            '#ajax' => array(
                'callback' => 'cartogratree_admin_settings_layer_form_get_embedded_raw_field_names_callback',
                'wrapper' => 'raw_field_names',
                'method' => 'html',
                'effect' => 'fade',
            ),
            '#suffix' => '<div id="raw_field_names"></div>',
        );

        $form['fieldset_layer_data_manipulation_config']['layer_embedded_fields_hide'] = array(
        	'#type' => 'textarea',
        	'#title' => 'Layer embedded fields to hide',
        	'#description' => 'List each field on a single line (this is case sensitive)',
            '#default_value' => (isset($obj->layer_embedded_fields_hide)) ? $obj->layer_embedded_fields_hide : '',
            '#suffix' => '<a target="_blank" href="/cartogratree_uiapi/get_layer_embedded_fields_hide/' . $obj->layer_id . '">API URL - Layer embedded fields to hide</a><br /><br />',
        );        

        $form['fieldset_layer_data_manipulation_config']['layer_embedded_fields_rename'] = array(
        	'#type' => 'textarea',
        	'#title' => 'Layer embedded fields to rename',
        	'#description' => 'List each field,replacement name on a single line (this is case sensitive)',
            '#default_value' => (isset($obj->layer_embedded_fields_rename)) ? $obj->layer_embedded_fields_rename : '',
            '#suffix' => '<a target="_blank" href="/cartogratree_uiapi/get_layer_embedded_fields_rename/' . $obj->layer_id . '">API URL - Layer embedded fields to rename</a><br /><br />',
        );    
        
        $form['fieldset_layer_data_manipulation_config']['layer_embedded_data_eval'] = array(
        	'#type' => 'textarea',
        	'#title' => 'Layer embedded fields eval manipulations',
        	'#description' => 'Field,Javascript eval code',
            '#default_value' => (isset($obj->layer_embedded_data_eval)) ? $obj->layer_embedded_data_eval : '',
            '#suffix' => '<a target="_blank" href="/cartogratree_uiapi/get_layer_embedded_data_eval/' . $obj->layer_id . '">API URL - Layer embedded data eval</a><br /><br />',
        );     

        //layer_embedded_fields_rename

        $options = array();
        $resource = db_query('SELECT * FROM {cartogratree_layers_analysis_categories} ORDER BY title');
        $options['0'] = '- None -';
        foreach ($resource as $r) {
            $options[$r->category_id] = $r->title;
        }
        $form['analysis_category_id'] = array(
        	'#type' => 'select',
        	'#title' => 'Analysis Category',
        	'#description' => 'Add this layer to an Analysis Category',
        	'#id' => 'cartogratree_analysis_category',
        	'#options' => $options,
        	'#default_value' => (isset($obj->analysis_category_id)) ? $obj->analysis_category_id : 0,
        	'#required' => TRUE,
        );


        // Fields
        $table = array(
        	'header' => array(
        		array('data' => 'Field Name', 'width' => '50%'),
            	array('data' => 'Operations', 'width' => '50%'),
          	),
        	'rows' => array(),
        );
        if (isset($obj->layer_id)) {    // edit layer
            $results = db_query('SELECT * FROM {cartogratree_fields} WHERE layer_id=:id ORDER BY field_rank', array(':id' => $obj->layer_id));
            foreach ($results as $r) {
                $table['rows'][] = array(
                	'field' => $r->display_name,
                	l('edit', 'admin/cartogratree/settings/layer/' . $obj->layer_id . '/field/edit/' . $r->field_id) . ' | '
                  . l('delete', 'admin/cartogratree/settings/layer/' . $obj->layer_id . '/field/delete/' . $r->field_id)
                );
            }
            // If there are no fields yet, display only the headers of the table.
            if (empty($table['rows'])) {
                $table['rows'][] = array(array('data' => 'None.', 'colspan' => 2));
            }
            $form['fields'] = array(
            	'#type' => 'markup',
            	'#markup' => '<h1>Fields</h1>'
              . '<p>In order to make a field within a layer available to users, it must first be included below.</p>'
              . l('Add field', 'admin/cartogratree/settings/layer/' . $obj->layer_id . '/field/add')
              . theme('table', $table),
            );
        }

        $op = ucwords($form_state['build_info']['args'][0]);
        $form['submit'] = array(
        	'#type' => 'submit',
        	'#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );
        //dpm($form_state);
        return $form;
    }
}

function cartogratree_admin_settings_layer_form_get_embedded_raw_field_names_callback($form, &$form_state) {
    //return "Success - " . rand(1000000,99999999);
    $gis = variable_get('cartogratree_gis', FALSE);
    //return json_encode($form_state['values']);
    if($gis != FALSE) {
        $layer_name = $form_state['values']['machine_name'];
        $bbox = '0,0,256,256';
        $url = $gis . "?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image%2Fpng&TRANSPARENT=true&maxFeatures=1&QUERY_LAYERS=";
        //$getInfoUrl = $url . $layer_name . "&LAYERS=" . $layer_name . "&INFO_FORMAT=application%2Fjson&I=128&J=128&WIDTH=256&HEIGHT=256&CRS=EPSG:4326&STYLES=";
        //$getInfoUrl .= "&BBOX=" . $bbox; 
        if(substr($gis,strlen($gis)-1,strlen($gis)) != "/") {
            $gis = $gis . "/";
        }
        $getInfoUrl = $gis . "../wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=" . $layer_name . "&maxFeatures=1&outputFormat=csv&BBOX=" . $bbox;       
        $results = file_get_contents($getInfoUrl);
        $lines = explode("\n", $results);
        $results_csv_parts = explode(",", trim(@$lines[0]));
        $results_html = "";
        foreach($results_csv_parts as $field_name) {
            $results_html .= "<div style='background-color: #0fb360; color: #FFFFFF; padding: 5px; display: inline-block; margin-left: 5px; margin-right: 5px; border-radius: 4px;'>" . $field_name . "</div>";
        }
        if(count($results) == 0) {
            return "No field names returned.";
        }
        else {
            return $results_html;
        }
    }
    else {
        return "The GIS server url has not been set. Cannot attempt to retrieve the raw field names.";
    }
}

/**
 * Layer admin form: Validation.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form_validate($form, &$form_state) {
    if (isset($form_state['values']['group_name'])) {   // the delete form doesn't have this control
        if ($form_state['values']['group_name'] == 'None' || $form_state['values']['subgroup_name'] == 'None') {
            $form_state['values']['group_name'] = $form_state['values']['subgroup_name'] = 'None';
        }
        else {
            $count = db_query('SELECT count(*) FROM {cartogratree_groups_subgroups} WHERE group_id=:group_id AND subgroup_id=:subgroup_id',
                array(':group_id' => $form_state['values']['group_name'], ':subgroup_id' => $form_state['values']['subgroup_name']))->fetchField();
            if ($count == 0) {
                form_set_error ('subgroup_name', 'Subgroup selected must be a subgroup of the group selected.');
                form_set_error ('group_name');
            }
        }
    }
}

/**
 * Layer admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/layer/[add|edit|delete][/<layer id>]
 */
function cartogratree_admin_settings_layer_form_submit($form, &$form_state) {
    
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_layers} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        db_query('DELETE FROM {cartogratree_layer_permissions} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        db_query('DELETE FROM {cartogratree_fields} WHERE layer_id=:id', array(':id' => $form_state['values']['layer_id']));
        drupal_set_message('Successfully deleted <em>' . $form_state['values']['name'] . '</em>.');
    }
    else {
        $record = array(
        	'title' => $form_state['values']['name'],
        	'name' => $form_state['values']['machine_name'],
        	'url' => $form_state['values']['url'],
        	'trees_layer' => $form_state['values']['trees_layer'],
        	'group_id' => $form_state['values']['group_name'],
        	'subgroup_id' => $form_state['values']['subgroup_name'],
            'layer_rank' => $form_state['values']['layer_rank'],
            'layer_host' => $form_state['values']['layer_host'],
            'layer_styles' => $form_state['values']['layer_styles'],
            'layer_legend_html' => $form_state['values']['layer_legend_html'],
            // layer_legend_hide_default
            'layer_legend_hide_default' => $form_state['values']['layer_legend_hide_default'],
            'layer_legend_orientation' => $form_state['values']['layer_legend_orientation'],
            'layer_embedded_data_decimal_precision' => $form_state['values']['layer_embedded_data_decimal_precision'],
            'layer_allow_user_select_colors' => $form_state['values']['layer_allow_user_select_colors'],
            'layer_year_range_filter_option' => $form_state['values']['layer_year_range_filter_option'],
            'layer_year_range_filter_geoserver_parameter' => $form_state['values']['layer_year_range_filter_geoserver_parameter'],
            'layer_year_range_filter_year_start' => $form_state['values']['layer_year_range_filter_year_start'],
            'layer_year_range_filter_year_end' => $form_state['values']['layer_year_range_filter_year_end'],

            'layer_multilayer_rangeslider_year_option' => $form_state['values']['layer_multilayer_rangeslider_year_option'],
            'layer_multilayer_rangeslider_start_year' => $form_state['values']['layer_multilayer_rangeslider_start_year'],
            'layer_multilayer_rangeslider_end_year' => $form_state['values']['layer_multilayer_rangeslider_end_year'],

            'layer_embedded_fields_hide' => $form_state['values']['layer_embedded_fields_hide'],
            'layer_embedded_fields_rename' => $form_state['values']['layer_embedded_fields_rename'],
            'layer_embedded_data_eval' => $form_state['values']['layer_embedded_data_eval'],
            'analysis_category_id' => $form_state['values']['analysis_category_id'],
        );

        if ($form_state['values']['op'] == 'Add') {
            $result = drupal_write_record('cartogratree_layers', $record);
        }
        else {
            $record['layer_id'] = $form_state['values']['layer_id'];
            $result = drupal_write_record('cartogratree_layers', $record, 'layer_id');
        }
        //dpm($record);
        //dpm($result);
    }
}

/**
 * Servers admin form.
 * URL suffix: ?q=admin/cartogratree/settings/servers/[add|edit]
 */
function cartogratree_admin_settings_servers_form($form, &$form_state) {
    $form['gis'] = array(
    	'#type' => 'textfield',
    	'#title' => 'GIS server',
    	'#description' => 'This is the URL prefix used to request layers from the GIS server.',
    	'#default_value' => variable_get('cartogratree_gis'),
    );

    $form['api'] = array(
    	'#type' => 'textfield',
    	'#title' => 'API',
    	'#description' => 'This is the URL prefix used to request data from the API server.',
    	'#default_value' => variable_get('cartogratree_api'),
    );

    $form['ct_nodejs_api'] = array(
    	'#type' => 'textfield',
    	'#title' => 'Cartogratree NodeJS API',
    	'#description' => 'This is the URL prefix used to request data from the Cartogratree NodeJS API server.',
    	'#default_value' => variable_get('ct_nodejs_api'),
    );    

    $op = ucwords($form_state['build_info']['args'][0]);
    $form['submit'] = array(
    	'#type' => 'submit',
    	'#value' => ($op == 'Edit') ? 'Save Changes' : $op,
    );

    return $form;
}

/**
 * Servers admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/servers/[add|edit]
 */
function cartogratree_admin_settings_servers_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings';

    variable_set('cartogratree_gis', $form_state['values']['gis']);
    variable_set('cartogratree_api', $form_state['values']['api']);
    variable_set('ct_nodejs_api', $form_state['values']['ct_nodejs_api']);
}

/**
 * Layer permissions form.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/<layer id>
 */
function cartogratree_admin_layer_permissions_form($form, &$form_state) {

    $obj = NULL;
    if (isset($form_state['build_info']['args'][1])) {
        $obj = db_query('
            SELECT * FROM {cartogratree_layers} l
            JOIN {cartogratree_groups} g ON g.group_id = l.group_id
            JOIN {cartogratree_subgroups} s ON s.subgroup_id = l.subgroup_id
            WHERE layer_id=:id', array(':id' => $form_state['build_info']['args'][1]))->fetchObject();
    }

    $form['#attached']['css'][] = array(
		'data' => '
      	table caption {
        	margin-top: 50px;
        	font-weight: bold;
        	font-size: 1.2em;
        	text-align: left;
      	}
      	th.name, td.name {
       		width: 300px;
      	}
      	input[type=text] {
        	width: 250px;
      	}
      	td.add {
        	background-color: #e1e2dc;
        	border-top: 1px solid #bebfb9;
      	}
      	td.add input[type=submit] {
        	margin-top: 10px;
        	margin-bottom: 0px;
      	}
    	',
      'type' => 'inline',
    );

    $form['layer_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->layer_id)) ? $obj->layer_id : NULL,
    );

    $form['info'] = array(
    	'#type' => 'markup',
    	'#theme' => 'table',
    	'#header' => NULL,
    	'#rows' => array(
			array(array('data' => 'Human-readable name', 'header' => TRUE), $obj->title),
			array(array('data' => 'Name used with the GIS server', 'header' => TRUE), $obj->name),
			array(array('data' => 'URL for the layer provider', 'header' => TRUE), $obj->url),
			array(array('data' => 'Group name', 'header' => TRUE), $obj->group_name),
			array(array('data' => 'Subgroup name', 'header' => TRUE), $obj->subgroup_name),
			array(array('data' => 'Layer rank', 'header' => TRUE), $obj->layer_rank),
      	),
    );

    // ROLES:
    //---------------
    $form['role'] = array(
    	'#type' => 'markup',
    	'#tree' => TRUE,
    	'#title' => 'Role Permissions',
    	'#caption' => 'All users with the following roles have access to <em>' . $obj->name . '</em>.',
    	'#theme' => 'cartogratree_admin_form_permission_table',
    );

    $count = 0;
    $resource = db_query('
    	SELECT r.rid, r.name
    	FROM {cartogratree_layer_permissions} perm
    	LEFT JOIN {role} r ON r.rid=perm.rid
    	WHERE perm.rid IS NOT NULL AND layer_id=:id', 
	array(':id' => $obj->layer_id));
    foreach ($resource as $r) {
        $count++;

        $form['role'][$r->rid]['id'] = array(
          '#type' => 'item',
          '#value' => $r->rid,
        );

        $form['role'][$r->rid]['name'] = array(
          '#type' => 'item',
          '#value' => $r->name,
        );

        $form['role'][$r->rid]['remove_url'] = array(
          '#type' => 'item',
          '#value' => 'admin/cartogratree/settings/layer/access/' . $obj->layer_id . '/remove-role/' . $r->rid,
        );
    }
    if (!$count) {
        $form['role']['none']['name'] = array(
          '#type' => 'item',
          '#value' => 'None.',
        );
    }

    $options = array();
    $resource = db_query('SELECT rid, name FROM {role}');
    foreach ($resource as $r) {
        $options[$r->rid] = $r->name;
    }
    $form['role']['add']['form_element'] = array(
    	'#type' => 'select',
    	'#title' => 'Role to give permission to',
    	'#options' => $options,
    	'#empty_value' => 'None',
    );

    $form['role']['add']['submit'] = array(
    	'#type' => 'submit',
    	'#value' => 'Add Role',
    );

    // USER:
    //---------------
    $form['user'] = array(
    	'#type' => 'markup',
    	'#tree' => TRUE,
    	'#title' => 'User Permissions',
    	'#caption' => 'The following users have access to <em>' . $obj->name . '</em>.',
    	'#theme' => 'cartogratree_admin_form_permission_table',
    );

    $count = 0;
    $resource = db_query('
    SELECT u.uid, u.name
    FROM {cartogratree_layer_permissions} perm
    LEFT JOIN {users} u ON u.uid=perm.uid
    WHERE perm.uid IS NOT NULL AND layer_id=:id', array(':id' => $obj->layer_id));
    foreach ($resource as $r) {
        $count++;

        $form['user'][$r->uid]['id'] = array(
        	'#type' => 'item',
        	'#value' => $r->uid,
        );

        $form['user'][$r->uid]['name'] = array(
        	'#type' => 'item',
        	'#value' => $r->name,
        );

        $form['user'][$r->uid]['remove_url'] = array(
        	'#type' => 'item',
        	'#value' => 'admin/cartogratree/settings/layer/access/' . $obj->layer_id . '/remove-user/' . $r->uid,
        );
    }
    if (!$count) {
        $form['user']['none']['name'] = array(
        	'#type' => 'item',
        	'#value' => 'None.',
        );
    }

    $form['user']['add']['form_element'] = array(
    	'#type' => 'textfield',
    	'#title' => 'User to give permission to',
    	'#autocomplete_path' => 'user/autocomplete',
    );

    $form['user']['add']['submit'] = array(
    	'#type' => 'submit',
    	'#value' => 'Add User',
    );

    return $form;
}

/**
 * Layer permissions form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/<layer id>
 */
function cartogratree_admin_layer_permissions_form_submit($form, &$form_state) {
    if ($form_state['clicked_button']['#value'] == 'Add Role') {
        $record = array(
        	'layer_id' => $form_state['values']['layer_id'],
        	'rid' => $form_state['values']['role']['add']['form_element'],
        );
        drupal_write_record('cartogratree_layer_permissions', $record);
    }
    elseif ($form_state['clicked_button']['#value'] == 'Add User') {
        $uid = db_query('SELECT uid FROM {users} WHERE name=:name', array(':name' => $form_state['values']['user']['add']['form_element']))->fetchField();
        if ($uid) {
            $record = array(
            	'layer_id' => $form_state['values']['layer_id'],
            	'uid' => $uid,
            );
            drupal_write_record('cartogratree_layer_permissions', $record);
        }
    }
}

/**
 * Callback to remove permissions (both user or role).
 * Invoked from ?q=admin/cartogratree/settings/layer/access/<layer id>.
 * URL suffix: ?q=admin/cartogratree/settings/layer/access/%/%/%
 *      e.g., ?q=admin/cartogratree/settings/layer/access/2/remove-role/2
 *
 * NOTE: There is no display or confirmation for removing users/roles. This callback will
 * redirect to the access page when done.
 *
 * @param $layer_id
 *   The pkey of the Layer we are removing permissions from.
 * @param $action
 *   Either 'remove-role' OR 'remove-user' based on which type of permission we need to remove.
 * @param $id
 *   The pkey of the role or user to remove permission to. If $action is remove-role then
 *   this is the rid; if it's remove-user then this is the uid.
 */
function cartogratree_admin_layer_permission_remove_callback($layer_id, $action, $id) {

    if ($action == 'remove-role') {

        $num_deleted = db_delete('cartogratree_layer_permissions')
            ->condition('layer_id', $layer_id)
            ->condition('rid', $id)
            ->execute();
        if ($num_deleted) {
            drupal_set_message('Successfully removed permission to role.');
        }
    }
    elseif ($action == 'remove-user') {

        $num_deleted = db_delete('cartogratree_layer_permissions')
            ->condition('layer_id', $layer_id)
            ->condition('uid', $id)
            ->execute();
        if ($num_deleted) {
            drupal_set_message('Successfully removed permission to user.');
        }
    }

    // Redirect to access page.
    drupal_goto('admin/cartogratree/settings/layer/access/' . $layer_id);
}

/**
 * Callback to remove subgroup from group.
 * Invoked from ?q=admin/cartogratree/settings/group/<group id>/subgroups.
 * URL suffix: ?q=admin/cartogratree/settings/group/%/remove-subgroup/%
 *      e.g., ?q=admin/cartogratree/settings/group/1/remove-subgroup/3
 *
 * NOTE: There is no display or confirmation for removing subgroups. This callback will
 * redirect to the group management page when done.
 *
 * @param $group_id
 *   The pkey of the group we are removing the subgroup from.
  \ * @param $subgroup_id
 *   The pkey of the subgroup to be removed from group.
 */
function cartogratree_admin_group_remove_subgroup($group_id, $subgroup_id) {
    $num_deleted = db_delete('cartogratree_groups_subgroups')
    	->condition('group_id', $group_id)
        ->condition('subgroup_id', $subgroup_id)
        ->execute();
    if ($num_deleted) {
        drupal_set_message('Successfully removed subgroup from group.');
    }

    // Redirect to group management page.
    drupal_goto('admin/cartogratree/settings/group/' . $group_id . '/subgroups');
}

/**
 * Theme both permissions tables on ?q=admin/cartogratree/settings/layer/access/<layer id>.
 */
function cartogratree_admin_form_permission_table($vars) {
    $element = $vars['element'];
    $output = '';

    $table = array(
    	'caption' => $element['#title'] . ': ' . $element['#caption'],
    	'header' => array('Name', 'Operations'),
    	'rows' => array(),
    );

    foreach (element_children($element) as $key) {
        if ($key == 'add') {
            $table['rows'][] = array(
            	array('data' => render($element[$key]['form_element']), 'class' => array('name', 'add')),
            	array('data' => render($element[$key]['submit']), 'class' => array('op', 'add')),
            );
        }
        else {
            $remove_link = '';
            if (isset($element[$key]['remove_url'])) {
                $remove_link = l('remove', $element[$key]['remove_url']['#value']);
            }

            $table['rows'][] = array(
            	array('data' => $element[$key]['name']['#value'], 'class' => array('name')),
            	array('data' => $remove_link, 'class' => array('op')),
            );
        }
    }

    return theme('table', $table);
}

/**
 * Theme group management table on ?q=admin/cartogratree/settings/group/subgroups/<group id>,
 */
function cartogratree_admin_form_group_mgmt_table($vars) {
    $element = $vars['element'];
    $output = '';

    $table = array(
    	'caption' => $element['#title'] . ': ' . $element['#caption'],
    	'header' => array('Name', 'Subgroup Rank', 'Operations'),
    	'rows' => array(),
    );

    foreach (element_children($element) as $key) {
        if ($key == 'add') {
            $table['rows'][] = array(
            	array('data' => render($element[$key]['select']), 'class' => array('name', 'add')),
            	array('data' => render($element[$key]['text']), 'class' => array('rank', 'add')),
            	array('data' => render($element[$key]['submit']), 'class' => array('op', 'add')),
            );
        }
        else {
            $remove_link = '';
            if (isset($element[$key]['remove_url'])) {
                $remove_link = l('remove', $element[$key]['remove_url']['#value']);
            }

            if (isset($element[$key]['rank']['#value'])) {
                $table['rows'][] = array(
                	array('data' => $element[$key]['name']['#value'], 'class' => array('name')),
                	array('data' => $element[$key]['rank']['#value'], 'class' => array('rank')),
                	array('data' => $remove_link, 'class' => array('op')),
                );
            }
        }
    }

    return theme('table', $table);
}

/**
 * Field admin form.
 * URL suffix: ?q=admin/cartogratree/settings/layer/<layer id>/field/[add|edit|delete][/<field id>]
 */
function cartogratree_admin_settings_field_form($form, &$form_state) {
    $obj = NULL;
    if (isset($form_state['build_info']['args'][2])) {
        $obj = db_query('SELECT * FROM {cartogratree_fields} WHERE field_id=:id', array(':id' => $form_state['build_info']['args'][2]))->fetchObject();
    }

    $form['field_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->field_id)) ? $obj->field_id : NULL,
    );

    $form['layer_id'] = array(
    	'#type' => 'hidden',
    	'#value' => (isset($obj->layer_id)) ? $obj->layer_id : $form_state['build_info']['args'][0],
    );

    if ($form_state['build_info']['args'][1] == 'delete') {
        $table = array(
        	'header' => NULL,
        	'rows' => array(
            	array(array('data' => 'Field name', 'header' => TRUE), $obj->field_name),
            	array(array('data' => 'Display name', 'header' => TRUE), $obj->display_name),
				array(array('data' => 'Filter', 'header' => TRUE), $obj->filter),
				array(array('data' => 'Filter type', 'header' => TRUE), $obj->filter_type),
				array(array('data' => 'Values', 'header' => TRUE), $obj->field_values),
				array(array('data' => 'Precision', 'header' => TRUE), $obj->precision),
				array(array('data' => 'Mask value', 'header' => TRUE), $obj->mask_value),
				array(array('data' => 'Mask display', 'header' => TRUE), $obj->mask_display),
				array(array('data' => 'Pop-up', 'header' => TRUE), $obj->pop_up),
				array(array('data' => 'Show in data table', 'header' => TRUE), $obj->data_table),
				array(array('data' => 'Field rank', 'header' => TRUE), $obj->field_rank),
        	),
        );
        $form['info'] = array(
        	'#type' => 'markup',
        	'#markup' => '<p>Would you like to delete the following field?</p>'
          . theme('table', $table),
        );

        $form['delete'] = array(
        	'#type' => 'submit',
        	'#value' => 'Delete',
        	'#suffix' => '<span> ' . l('or Cancel', 'admin/cartogratree/settings/layer/edit/' . $obj->layer_id) . '</span>',
        );

        return $form;
    }
    else {
        $form['field_name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Field name',
        	'#description' => 'This is the name returned by the GIS server.',
        	'#default_value' => (isset($obj->field_name)) ? $obj->field_name : '',
        	'#required' => TRUE,
        );

        $form['display_name'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Display name',
        	'#description' => 'This is the name shown to the users.',
        	'#default_value' => (isset($obj->display_name)) ? $obj->display_name : '',
        	'#required' => TRUE,
        );

        $form['filter'] = array(
        	'#type' => 'select',
        	'#title' => 'Filter',
        	'#description' => 'Allow users to filter data using this field.',
        	'#options' => array(0 => 'No', 1 => 'Yes'),
        	'#default_value' => (isset($obj->filter)) ? $obj->filter : 0,
        	'#required' => TRUE,
        );

        $form['filter_type'] = array(
        	'#type' => 'select',
        	'#title' => 'Filter type',
        	'#options' => array('radio' => 'radio-button', 'checkbox' => 'checkbox', 'slider' => 'slider', 'elastic' => 'elastic search'),
        	'#default_value' => (isset($obj->filter_type)) ? $obj->filter_type : 'None',
        	'#required' => TRUE,
        );

        $form['field_values'] = array(
        	'#type' => 'textarea',
        	'#title' => 'Field values',
        	'#description' => 'Range for slider (e.g., 0..20), and semi-colon sperated list for radio and check.',
        	'#default_value' => (isset($obj->field_values)) ? $obj->field_values : '',
        	'#required' => TRUE,
        );

        $form['precision'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Precision used with range values',
        	'#default_value' => (isset($obj->precision)) ? $obj->precision : '',
        	'#size' => 3,
        );

        $form['mask_value'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Mask value',
        	'#description' => 'Value returned by layer that should be masked.',
        	'#default_value' => (isset($obj->mask_value)) ? $obj->mask_value : '',
        );

        $form['mask_display'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Mask display',
        	'#description' => 'Text shown to user for masked values.',
        	'#default_value' => (isset($obj->mask_display)) ? $obj->mask_display : '',
        );

        $form['pop_up'] = array(
        	'#type' => 'select',
        	'#title' => 'Pop-up',
        	'#description' => 'Show this field in maps?',
        	'#options' => array(0 => 'No', 1 => 'Yes'),
        	'#default_value' => (isset($obj->pop_up)) ? $obj->pop_up : 0,
        	'#required' => TRUE,
        );

        $form['data_table'] = array(
        	'#type' => 'select',
        	'#title' => 'Show in data table',
        	'#description' => 'Show this field in data table?',
        	'#options' => array(0 => 'No', 1 => 'Yes'),
        	'#default_value' => (isset($obj->data_table)) ? $obj->data_table : 0,
        	'#required' => TRUE,
        );

        $form['field_rank'] = array(
        	'#type' => 'textfield',
        	'#title' => 'Field rank',
        	'#description' => 'Order in which this field is shown.',
        	'#default_value' => (isset($obj->field_rank)) ? $obj->field_rank : '',
        	'#required' => TRUE,
        	'#size' => 3,
        );

        $op = ucwords($form_state['build_info']['args'][1]);
        $form['submit'] = array(
        	'#type' => 'submit',
          	'#value' => ($op == 'Edit') ? 'Save Changes' : $op,
        );

        return $form;
    }
}

/**
 * Field admin form: Submission.
 * URL suffix: ?q=admin/cartogratree/settings/layer/<layer id>/field/[add|edit|delete][/<field id>]
 */
function cartogratree_admin_settings_field_form_submit($form, &$form_state) {
    $form_state['rebuild'] = FALSE;
    $form_state['redirect'] = 'admin/cartogratree/settings/layer/edit/' . $form_state['values']['layer_id'];

    if ($form_state['values']['op'] == 'Delete') {
        db_query('DELETE FROM {cartogratree_fields} WHERE field_id=:id', array(':id' => $form_state['values']['field_id']));
    }
    else {
        $record = array(
			'layer_id' => $form_state['values']['layer_id'],
			'field_name' => $form_state['values']['field_name'],
			'display_name' => $form_state['values']['display_name'],
			'filter' => $form_state['values']['filter'],
			'filter_type' => $form_state['values']['filter_type'],
			'field_values' => $form_state['values']['field_values'],
			'precision' => $form_state['values']['precision'],
			'mask_value' => $form_state['values']['mask_value'],
			'mask_display' => $form_state['values']['mask_display'],
			'pop_up' => $form_state['values']['pop_up'],
			'data_table' => $form_state['values']['data_table'],
			'field_rank' => $form_state['values']['field_rank'],
        );

        if ($form_state['values']['op'] == 'Add') {
            drupal_write_record('cartogratree_fields', $record);
        }
        else {
            $record['field_id'] = $form_state['values']['field_id'];
            drupal_write_record('cartogratree_fields', $record, 'field_id');
        }
    }
}

/**
 * Get environmental values for CartograTree form.
 * URL suffix: ?q=admin/cartogratree/settings/get_environmental_values/<layer id>
 */
function cartogratree_admin_get_environmental_values($form, &$form_state) {
    $options = array(); $layers = array();
    $resource = db_query('SELECT layer_id, title, name FROM {cartogratree_layers} where trees_layer is null order by layer_id');
    foreach ($resource as $r) {
        $options[$r->layer_id] = $r->title;
        $layers[$r->layer_id]['display_name'] = $r->title;
        $layers[$r->layer_id]['gis_name'] = $r->name;
    }
    $form['layer_select'] = array(
		'#type' => 'select',
		'#title' => t('1. Choose the environmental layer to pool for values'),
		'#options' => $options,
		'#default_value' => (isset($form_state['build_info']['args'][0]) && isset($options[$form_state['build_info']['args'][0]])) ?
							  $form_state['build_info']['args'][0] :
							  '',
		'#id' => 'cartogratree_layer_select',
    );
    
    $form['get_values_button'] = array(
		'#type' => 'button',
		'#id' => 'cartogratree_get_env_vals',
		'#value' => t('2. Get environmental values'),
    );

    $form['submit'] = array(
		'#type' => 'submit',
		'#id' => 'cartogratree_submit_env_vals',
		'#value' => '3. Write values to database',
    );
    
    $form['output_details'] = array(
		'#type' => 'textarea',
		'#title' => t('Output details'),
		'#id' => 'cartogratree_output_details',
    );
    
    $form['output_data'] = array(
		'#type' => 'textarea',
		'#title' => t('Output data'),
		'#id' => 'cartogratree_output_data',
    );
    
    $form['output_errors'] = array(
		'#type' => 'textarea',
		'#title' => t('Locations with errors'),
		'#id' => 'cartogratree_output_errors',
    );
    
    $results = db_query('SELECT * FROM {chado.ct_view}');
    $locations = array();
    foreach ($results as $r) {
        if (isset($locations[$r->latitude . ',' . $r->longitude])) {
            array_push($locations[$r->latitude . ',' . $r->longitude], $r->uniquename);
        }
        else {
            $locations[$r->longitude . ',' . $r->latitude] = array($r->uniquename);
        }
    }
    
    $settings = array(
		'gis' => variable_get('cartogratree_gis'),
		'layers' => $layers,
		'locations' => $locations,
    );
    libraries_load('openlayers');
    drupal_add_js($settings, 'setting');
    drupal_add_js(drupal_get_path('module', 'cartogratree') . '/includes/cartogratree_admin_get_environmental_values.js');

    return $form;
}

/**
 * Get environmental values for CartograTree submit.
 * URL suffix: ?q=admin/cartogratree/settings/get_environmental_values/<layer id>
 */
function cartogratree_admin_get_environmental_values_submit($form, &$form_state) {
    $layer_id = $form_state['values']['layer_select'];
    
    $fields = array();
    $records = db_query('SELECT * FROM {cartogratree_fields} WHERE layer_id = :id', array(':id' => $layer_id));
    foreach ($records as $record) {
        $fields[$record->field_name]['field_id'] = $record->field_id;
        $fields[$record->field_name]['Field name shown to user'] = $record->display_name;
        $fields[$record->field_name]['Value returned by layer that should be masked'] = $record->mask_value;
        $fields[$record->field_name]['Text shown to user for masked values'] = $record->mask_display;
        $fields[$record->field_name]['Show this field in data table'] = $record->data_table;
    }
    
    $lines = explode("\n", $form_state['values']['output_data']);
//    $num_records = 0; $inserts = 0;
//    dpm($form_state['values']);
    foreach ($lines as $line) {
        $line = str_replace("\r", '', $line);   // remove carriage returns
        $columns = explode("\t", $line);
//        if (count($columns) > 0) {
//            $num_records++;
//        }
        if ($fields[$columns[1]]['Show this field in data table'] == 1) {
            $coords = explode(',', $columns[0]);
            $value = ($columns[2] == $fields[$columns[1]]['Value returned by layer that should be masked']) ?
                $fields[$columns[1]]['Text shown to user for masked values'] :
                $columns[2];

            $record = array(
				'latitude' => $coords[1],
				'longitude' => $coords[0],
				'layer_id' => $layer_id,
				'field_id' => $fields[$columns[1]]['field_id'],
				'field_name' => $fields[$columns[1]]['Field name shown to user'],
				'field_value' => $value,
            );
//            // If the record insert or update failed, returns FALSE.
//            // If it succeeded, returns SAVED_NEW or SAVED_UPDATED, depending on the operation performed.
//            // define('SAVED_NEW', 1); define('SAVED_UPDATED', 2);
//            $inserts += drupal_write_record('cartogratree_environmental_values', $record);
        }
    }
//    if ($inserts) {
//        drupal_set_message('Successfully saved ' + $inserts + ' of ' + $num_records + ' records to database.');
//    }

    // Redirect to cartogratree management page.
    drupal_goto('admin/cartogratree/settings');
}
