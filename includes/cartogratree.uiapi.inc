<?php

function cartogratree_uiapi_get_vcf_studies($tgdr_numbers_csv) {
    $tgdr_numbers = explode(',',$tgdr_numbers_csv);
    $tgdr_count = count($tgdr_numbers);
    foreach($tgdr_numbers as $tgdr_number) {
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
            // dpm($data);   
            if(isset($data[4]['organism-1']['genotype']['files']['vcf'])) {
                $file = file_load($data[4]['organism-1']['genotype']['files']['vcf']);
                $uri = $file->uri;
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