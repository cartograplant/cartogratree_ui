<?php


function cartogratree_uiapi_get_phenotype_attributes_by_species_text($species_text) {
    $results = chado_query('SELECT distinct(phenotype_name) 
        FROM public.ct_trees_all_view 
        WHERE species = :species_text ORDER BY phenotype_name ASC;',
        [':species_text' => $species_text]);
    $phenotypes = [];
    foreach ($results as $row) {
        if ($row->phenotype_name != NULL) {
            $phenotypes[] = $row->phenotype_name;
        }
    }
    drupal_json_output($phenotypes);
}

function cartogratree_uiapi_get_plant_structures_by_species_text($species_text) {
    $results = chado_query('SELECT distinct(structure_name) 
        FROM public.ct_trees_all_view 
        WHERE species = :species_text ORDER BY structure_name ASC;',
        [':species_text' => $species_text]);
    $names = [];
    foreach ($results as $row) {
        if ($row->structure_name != NULL) {
            $names[] = $row->structure_name;
        }
    }
    drupal_json_output($names);
}


/**
 * This function will dynamically create a color icon for popstruct
 * based on the population id (the population column)
 * @return image/png
 */
function cartogratree_uiapi_get_pop_struct_icon($population_group_id) {
    $population_group_id = intval($population_group_id);
    $color_palette = [
        '243,255,0', // yellow
        '249,135,8', // orange
        '255,16,16', // red
        '151, 130, 216', // purple
        '3, 156, 41', // green
        '46, 46, 46', // dark grey
        '89, 89, 89', // lighter grey
        '247, 112, 215', // pink
        '10, 10, 10', // black
        '55,178,175', // teal
        '9,159,219', // blue
    ];
    $color_palette_count = count($color_palette);
    $color_selected_string = $color_palette[$population_group_id % $color_palette_count];

    // RGB array 0 is R, 1 is G, 2 is B
    $color_selected_parts = explode(',', $color_selected_string);

    $images_path = __DIR__ . '/../theme/templates/trees_imgs';

    $image_file_path = $images_path . "/popstruct_exact_" . $population_group_id . ".png";

    if(file_exists($image_file_path)) {
        // do nothing
    }
    else {
        // echo $images_path;
        $imgname = $images_path . "/popstruct_exact.png";
        // echo file_get_contents($imgname);
        $im = imagecreatefrompng($imgname);

        imagefilter($im, IMG_FILTER_NEGATE); 
        imagefilter($im, IMG_FILTER_COLORIZE, $color_selected_parts[0], $color_selected_parts[1], $color_selected_parts[2]); 
        // imagefilter($im, IMG_FILTER_NEGATE); 
        
        imagealphablending( $im, false );
        imagesavealpha( $im, true );

        // header('Content-type: image/png');
        // imagepng($im);
        // imagedestroy($im);
        
        imagepng($im, $image_file_path);
        // imagedestroy($im);
    }

    header('Content-type: image/png');
    echo file_get_contents($image_file_path);

}

/**
 * This function will get all table names of pop structures within the db
 * @return JSON 
 */
function cartogratree_uiapi_get_all_pop_struct_studies() {
    // SELECT COUNT(table_name) FROM  information_schema.tables WHERE 
    // table_schema LIKE 'public' AND table_type LIKE 'BASE TABLE' AND
    // table_name = 'actor';
    $return_results = [];
    $sql = "SELECT DISTINCT(study_accession) FROM public.cartogratree_popstruct_layer";
    $results = db_query($sql, []);
    foreach ($results as $row) {
        // Check to make sure the table for TGDR000 does not get listed
        if(strpos($row->table_name, 'tgdr000') == FALSE) {
            $return_results[] = $row->table_name;
        }
    }
    drupal_json_output($return_results);
}



/**
 * This function will convert a pop struct table into geojson format
 * @param mixed $tgdr_number_only 
 * @return JSON 
 */
function cartogratree_uiapi_get_pop_struct_layer_json($tgdr_number_only) {
    // For security reasons, we just want the integer value of the TGDR number
    $return_results = [];
    if(is_numeric($tgdr_number_only)) {      
        $results_data = NULL;
        try {
            $results_data = db_query('SELECT * FROM cartogratree_popstruct_layer WHERE study_accession = :study_accession', 
            [':study_accession' => 'TGDR' . $tgdr_number_only]);
        }
        catch (Exception $ex) {
            print_r($ex);
        }
        foreach($results_data as $row) {
            $return_results[] = [
                'geometry' => [
                    'coordinates' => [
                        $row->latitude,
                        $row->longitude
                    ],
                    'type' => 'Point'
                ],
                'properties' => [
                    'id' => $row->uniquename,
                    'icon_type' => 0,
                    'is_tree' => true
                ],
                'type' => 'Feature'
            ];
        }
    }
    drupal_json_output($return_results);
}

function cartogratree_uiapi_get_vcf_studies($tgdr_numbers_csv) {
    $tgdr_numbers = explode(',',$tgdr_numbers_csv);
    $tgdr_count = count($tgdr_numbers);
    $return_results = array();
    foreach($tgdr_numbers as $tgdr_number) {
        // Find per study submission values
        $results_data = chado_query('SELECT * FROM tpps_submission WHERE accession ILIKE :accession LIMIT 1',
            array(
                ':accession' => $tgdr_number
            )
        );
        $data = null;
        foreach($results_data as $results_row) {
            $data_all = unserialize($results_row->submission_state);
            // Debug code for finding the VCF file information
            // print_r(array_keys($data_all));
            // print_r($data_all['saved_values'][4]);
            // print_r($data_all['saved_values']);
            $data = $data_all['saved_values'];
        }
        if($data != null) {
            // This IF statement actually does not work the way one would expect
            // An empty vcf field will hold 0 in it, so in theory it always 
            // should pass this IF condition. But as a good side effect, we want
            // the null record for the UI to show a VCF file was not found.
            if($data[4]['organism-1']['genotype']['files']['vcf'] > 0) {
                $file = file_load($data[4]['organism-1']['genotype']['files']['vcf']);
                // print_r($file);
                $uri = $file->uri;
                $return_results[$tgdr_number] = $uri;
            }
            else if(isset($data[4]['organism-1']['genotype']['files']['local_vcf'])) {
                $file_location = $data[4]['organism-1']['genotype']['files']['local_vcf'];
                // print_r($file);
                $uri = strip_tags($file_location);
                $return_results[$tgdr_number] = $uri;
            }
        }
    }
    // return array(
    //     '#markup' => 'Some arbitrary markup.',
    // );
    drupal_json_output($return_results);
}

function cartogratree_uiapi_get_study_files($tgdr_number) {
    $results_data = chado_query('SELECT * FROM tpps_submission WHERE accession ILIKE :accession LIMIT 1',
        array(
            ':accession' => $tgdr_number
        )
    );
    $data = null;
    $return_results = array();
    foreach($results_data as $results_row) {
        $data_all = unserialize($results_row->submission_state);
        // drupal_json_output($data_all);
        $data = $data_all['saved_values'];
    }
    if($data != null) {
        // Try to get the tree accession file
        
        $page_3 = $data[3]['tree-accession'];
        // drupal_json_output($page_3);
        $return_results['tree-accession-files'] = array();
        $count_keys = count($page_3);
        for ($i = 1; $i <= $count_keys; $i++) {
            if (!empty($page_3["species-$i"]['file'])) {
                $fid = $page_3["species-$i"]['file'];
                // Generate a url
                $file = file_load($fid);
                $filename = $file->filename;
                $uri = $file->uri;
                $url = file_create_url($uri);
                $return_results['tree-accession-files'][$i] = array (
                    'url' => $url,
                    'filename' => $filename,
                );
            }
        }


        unset($organisms_data);
        $page_4 = $data[4];
        $organisms_data = array();
        foreach($page_4 as $key => $value) {
            if(stripos($key,'organism') !== FALSE) {
                $organisms_data[$key] = $value;
            }
        }

        $return_results['organisms'] = array();
        $return_results['genotype-snp-files'] = array();
        $return_results['genotype-ssrs-files'] = array();
        $return_results['genotype-assaydesign-files'] = array();
        $return_results['phenotype-files'] = array();
        $return_results['phenotype-mspec-files'] = array();
        // print_r($data_all);
        foreach ($organisms_data as $key => $value) {
            $key_parts = explode('-',$key);
            $i = $key_parts[1];
            //print_r($i);
            $org = $page_4[$key];
            $org_name = $data_all['saved_values'][1]['organism'][$i]['name'];
            $return_results['organisms'][] = $org_name;
            //print_r($org_name);
            if (isset($org['phenotype'])) {
                $pheno = $org['phenotype'];
                // print_r($pheno);
                if (isset($pheno['file']) and $pheno['file']) {
                    $fid = $pheno['file'];
                    // Generate a url
                    $file = file_load($fid);
                    $filename = $file->filename;
                    $uri = $file->uri;
                    $url = file_create_url($uri);
                    $return_results['phenotype-files'][$i] = array (
                        'url' => $url,
                        'filename' => $filename,
                        'organism_name' => $org_name,
                    );                    
                }                      
            }
            if(isset($value['genotype']['files']['snps-assay'])) {
                $fid = $value['genotype']['files']['snps-assay'];
                // Generate a url
                $file = file_load($fid);
                $filename = $file->filename;
                $uri = $file->uri;
                $url = file_create_url($uri);
                $return_results['genotype-snp-files'][$i] = array (
                    'url' => $url,
                    'filename' => $filename,
                );
            }
            if(isset($value['genotype']['files']['ssrs'])) {
                $fid = $value['genotype']['files']['ssrs'];
                // Generate a url
                $file = file_load($fid);
                $filename = $file->filename;
                $uri = $file->uri;
                $url = file_create_url($uri);
                $return_results['genotype-ssrs-files'][$i] = array (
                    'url' => $url,
                    'filename' => $filename,
                    'organism_name' => $org_name,
                );
            }  
            if(isset($value['genotype']['files']['assaydesign'])) {
                $fid = $value['genotype']['files']['assaydesign'];
                // Generate a url
                $file = file_load($fid);
                $filename = $file->filename;
                $uri = $file->uri;
                $url = file_create_url($uri);
                $return_results['genotype-assaydesign-files'][$i] = array (
                    'url' => $url,
                    'filename' => $filename,
                );
            } 
            if(isset($value['phenotype']['iso'])) {
                $fid = $value['phenotype']['iso'];
                // Generate a url
                $file = file_load($fid);
                $filename = $file->filename;
                $uri = $file->uri;
                $url = file_create_url($uri);
                $return_results['phenotype-mspec-files'][$i] = array (
                    'url' => $url,
                    'filename' => $filename,
                );
            }                                    
        }

        // drupal_json_output($page_4);
    }
    
    drupal_json_output($return_results);
}

function cartogratree_uiapi_layer_click_tracking_click($layer_id) {
    $month = date('n');
    $year = date('Y');

    $results = chado_query('SELECT count(*) as c1 FROM public.cartogratree_layers_click_tracking WHERE month = :month AND year = :year AND layer_id = :layer_id', array(
        ':month' => $month,
        ':year' => $year,
        ':layer_id' => $layer_id,
    ));

    $record_count = 0;
    foreach ($results as $row) {
        $record_count = $row->c1;
    }

    $output = [];
    $output['action'] = "NA";

    if($record_count > 0) {
        // A value already exists for this month and year so perform an UPDATE
        chado_query('UPDATE public.cartogratree_layers_click_tracking SET clicks_count = clicks_count + 1 WHERE month = :month AND year = :year AND layer_id = :layer_id', array(
            ':month' => $month,
            ':year' => $year,
            ':layer_id' => $layer_id,            
        ));
        $output['action'] = 'UPDATE';
        $output['status'] = 'SUCCESS';
    }
    else {
        // A value does not exist for the month and year so perform an INSERT
        chado_query('INSERT INTO public.cartogratree_layers_click_tracking (layer_id, year, month, clicks_count) VALUES (:layer_id,:year,:month,1);', array(
            ':month' => $month,
            ':year' => $year,
            ':layer_id' => $layer_id,            
        ));
        $output['action'] = 'INSERT';
        $output['status'] = 'SUCCESS';
    }

    drupal_json_output($output);
}

function cartogratree_uiapi_get_biome_by_treeid($tree_id) {
    $results = chado_query('SELECT * FROM public.ct_trees_biome_data bd LEFT JOIN public.ct_trees_biomes b ON (bd.biome = b.biome_id) WHERE tree_acc = :tree_acc LIMIT 1', array(
        ':tree_acc' => $tree_id
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'tree_acc' => $row->tree_acc,
            'biome' => $row->biome,
            'biome_desc' => $row->biome_desc,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No biome data found for this plant';
    }

    drupal_json_output($output);  
}

function cartogratree_uiapi_get_groups_list() {
    $results = chado_query('SELECT * FROM public.cartogratree_groups', array(
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'group_id' => $row->group_id,
            'group_name' => $row->group_name,
            'group_rank' => $row->group_rank,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No groups were found';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);

}

function cartogratree_uiapi_get_analysis_categories_list() {
    $results = chado_query('SELECT * FROM public.cartogratree_layers_analysis_categories', array(
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'category_id' => $row->category_id,
            'title' => $row->title,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No analysis categories were found';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);

}

function cartogratree_uiapi_get_layers_by_analysis_category_id_and_group_id($category_id, $group_id) {
    $results = chado_query('SELECT * FROM cartogratree_layers 
        WHERE group_id = :group_id AND analysis_category_id = :analysis_category_id', array(
        ':analysis_category_id' => $category_id,
        ':group_id' => $group_id,
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'layer_id' => $row->layer_id,
            'title' => $row->title,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No analysis categories were found';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}

function cartogratree_uiapi_get_groups_by_analysis_category_id($category_id) {
    $results = chado_query('SELECT DISTINCT group_id, group_name FROM (SELECT cl.group_id, cg.group_name FROM public.cartogratree_layers cl 
        LEFT JOIN cartogratree_groups cg ON (cl.group_id = cg.group_id) 
        WHERE analysis_category_id = :analysis_category_id) AS TABLE1', array(
        ':analysis_category_id' => $category_id
    ));

    // SELECT DISTINCT group_id, group_name FROM (SELECT cl.group_id, cg.group_name FROM public.cartogratree_layers cl 
    // LEFT JOIN cartogratree_groups cg ON (cl.group_id = cg.group_id) 
    // WHERE analysis_category_id = 1) AS TABLE1

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'group_id' => $row->group_id,
            'group_name' => $row->group_name,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No analysis categories were found';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}

function cartogratree_uiapi_get_layers_list() {
    $results = chado_query('SELECT * FROM public.cartogratree_layers', array(
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output[] = array(
            'layer_id' => $row->layer_id,
            'name' => $row->name,
            'title' => $row->title,
        );
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layers were found';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);

}

function cartogratree_uiapi_get_layer_information($layer_id) {
    $layer_id = explode('_', $layer_id)[0];
    $results = chado_query('SELECT * FROM public.cartogratree_layers WHERE layer_id = :layer_id LIMIT 1', array(
        ':layer_id' => $layer_id
    ));

    $output = array();

    // This will only have one record so the for statement should be okay to use
    // for filling data.
    $results_count = 0;
    foreach($results as $row) {
        $output['layer_id'] = $row->layer_id;
        $output['name'] = $row->name;
        $output['title'] = $row->title;
        $output['layer_legend_html'] = $row->layer_legend_html;
        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layer was found with the specified layer_id';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}


function cartogratree_uiapi_get_layer_fields_adjustments($layer_id) {
    $layer_id = explode('_', $layer_id)[0];
    $results = chado_query('SELECT * FROM public.cartogratree_layers WHERE layer_id = :layer_id LIMIT 1', array(
        ':layer_id' => $layer_id
    ));

    $output = array();

    $results_count = 0;
    foreach($results as $row) {
        $output['layer_id'] = $row->layer_id;
        $output['name'] = $row->name;
        $output['title'] = $row->title;
        $output['layer_embedded_fields_hide'] = explode("\r\n",$row->layer_embedded_fields_hide);
        $output['layer_embedded_fields_rename'] = explode("\r\n",$row->layer_embedded_fields_rename);
        $output['layer_embedded_data_eval'] = explode("\r\n",$row->layer_embedded_data_eval);

        //Trim results
        $fields_count = count($output['layer_embedded_fields_hide']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_fields_hide'][$i] = trim($output['layer_embedded_fields_hide'][$i]);
        }


        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_fields_hide'] = array_diff($output['layer_embedded_fields_hide'], $to_remove);


        //Trim results
        $fields_count = count($output['layer_embedded_fields_rename']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_fields_rename'][$i] = trim($output['layer_embedded_fields_rename'][$i]);
        }

        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_fields_rename'] = array_diff($output['layer_embedded_fields_rename'], $to_remove);

        //Trim results
        $fields_count = count($output['layer_embedded_data_eval']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_data_eval'][$i] = trim($output['layer_embedded_data_eval'][$i]);
        }

        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_data_eval'] = array_diff($output['layer_embedded_data_eval'], $to_remove);

        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layer was found with the specified layer_id';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);    
}

function cartogratree_uiapi_get_layer_embedded_fields_hide($layer_id) {
    $layer_id = explode('_', $layer_id)[0];
    $results = chado_query('SELECT * FROM public.cartogratree_layers WHERE layer_id = :layer_id LIMIT 1', array(
        ':layer_id' => $layer_id
    ));

    $output = array();

    // This will only have one record so the for statement should be okay to use
    // for filling data.
    $results_count = 0;
    foreach($results as $row) {
        $output['layer_id'] = $row->layer_id;
        $output['name'] = $row->name;
        $output['title'] = $row->title;
        $output['layer_embedded_fields_hide'] = explode("\r\n",$row->layer_embedded_fields_hide);


        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_fields_hide'] = array_diff($output['layer_embedded_fields_hide'], $to_remove);

        //Trim results
        $fields_count = count($output['layer_embedded_fields_hide']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_fields_hide'][$i] = trim($output['layer_embedded_fields_hide'][$i]);
        }

        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layer was found with the specified layer_id';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}

function cartogratree_uiapi_get_layer_embedded_fields_rename($layer_id) {
    $layer_id = explode('_', $layer_id)[0];
    $results = chado_query('SELECT * FROM public.cartogratree_layers WHERE layer_id = :layer_id LIMIT 1', array(
        ':layer_id' => $layer_id
    ));

    $output = array();

    // This will only have one record so the for statement should be okay to use
    // for filling data.
    $results_count = 0;
    foreach($results as $row) {
        $output['layer_id'] = $row->layer_id;
        $output['name'] = $row->name;
        $output['title'] = $row->title;
        $output['layer_embedded_fields_rename'] = explode("\r\n",$row->layer_embedded_fields_rename);

        //Trim results
        $fields_count = count($output['layer_embedded_fields_rename']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_fields_rename'][$i] = trim($output['layer_embedded_fields_rename'][$i]);
        }
        

        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_fields_rename'] = array_diff($output['layer_embedded_fields_rename'], $to_remove);

        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layer was found with the specified layer_id';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}

function cartogratree_uiapi_get_layer_embedded_data_eval($layer_id) {
    $layer_id = explode('_', $layer_id)[0];
    $results = chado_query('SELECT * FROM public.cartogratree_layers WHERE layer_id = :layer_id LIMIT 1', array(
        ':layer_id' => $layer_id
    ));

    $output = array();

    // This will only have one record so the for statement should be okay to use
    // for filling data.
    $results_count = 0;
    foreach($results as $row) {
        $output['layer_id'] = $row->layer_id;
        $output['name'] = $row->name;
        $output['title'] = $row->title;
        $output['layer_embedded_data_eval'] = explode("\r\n",$row->layer_embedded_data_eval);

        //Trim results
        $fields_count = count($output['layer_embedded_data_eval']);
        for ($i=0; $i<$fields_count; $i++) {
            $output['layer_embedded_data_eval'][$i] = trim($output['layer_embedded_data_eval'][$i]);
        }
        

        //Clean empty values in the layer_embedded_fields_hide
        $to_remove = array("");
        $output['layer_embedded_data_eval'] = array_diff($output['layer_embedded_data_eval'], $to_remove);

        $results_count = $results_count + 1;
    }

    if($results_count == 0) {
        $output['error'] = 'No layer was found with the specified layer_id';
    }

    //$output['layer_legend_html']
    drupal_json_output($output);
}

?>