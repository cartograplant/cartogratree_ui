<?php

function treesnap_api_req($url) {
	header('Content-Type: application/json'); // Specify the type of data
    $ch = curl_init($url); // Initialise cURL
    //$post = json_encode($args); // Encode the data array into a JSON string
    $authorization = "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjUwYThkN2IzMjc4M2YwNzFhMTYwZTRkY2VlMGU1NjgwMTkzMTE2YjdhMGI1MTJhMTAxMzNlODJkMTAwYWYyMzFmMWNhM2YzODIzNjc5OTNiIn0.eyJhdWQiOiIxIiwianRpIjoiNTBhOGQ3YjMyNzgzZjA3MWExNjBlNGRjZWUwZTU2ODAxOTMxMTZiN2EwYjUxMmExMDEzM2U4MmQxMDBhZjIzMWYxY2EzZjM4MjM2Nzk5M2IiLCJpYXQiOjE1NTQzOTc4NTksIm5iZiI6MTU1NDM5Nzg1OSwiZXhwIjoxNTg2MDIwMjU5LCJzdWIiOiIyMDk0Iiwic2NvcGVzIjpbXX0.Shjw5jBfN7y-bE3m3NX8xHQ1HyHNd_KBUBq83nZ5fPt9oR7HObWWn1u0VsVPXrUWCEmkKanqMf_NrpUqSL1SH8ro3P9rWB4Of3rxZ176kfsUJvse5KnYhTO7tL8FHZGDMni5PMQjE3OHsJjH-jKWlfmofcfZpWkPPGEqcUoZta-h02pnyRqH5DuNBtDXmaqsw9L2j-o4kAXp9uKNqyhNk6wkgHeKHsg5pRUq1arppYm8z4DjROVOrY85Nm67BWTmkC1ExVVp7gYJK0K1WUBjGNgO4IlI1c8W1dYGC4Xn4v0_GSqNVWCNLJgiYir7crVyAYqc40Z-Xit7a3UgGPFKAO5yxIh8AbwDg-zuPprVSbBqS2KjAD7XpzZHsCnE-Ou46NscAwdFF8bJlL_OKGyyxg1AdGcoXjUuoTpgpTT5xHe_Yu0RJlyM0jEhCPbShZx4kgOObbArbH35Oyo0wrzPBcMhl6f1gDtbCNPkpRrfcagOIPA4XF8hBnRiMkcJ2UV0xd1nGfCAvzbDFcODfwNGsrdnoxOysijOSEWi5jnbc5W5lpeEmFgvghrKOwNIuGWNBWije9k-JDiPlKsRTsVFV6tw-ovk4zrvNOqjDTk3FiFceEiHz8JSndM0daEK1t892U5Y-2OvrY7k8VQzw_DpCqcoBG9-G7ZqnuhDn9I8WOI"; // Prepare the authorisation token

    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json' , $authorization )); // Inject the token into the header
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //curl_setopt($ch, CURLOPT_POST, 1); // Specify the request method as POST
    //curl_setopt($ch, CURLOPT_POSTFIELDS, $post); // Set the posted fields
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1); // This will follow any redirects

    $result = curl_exec($ch); // Execute the cURL statement

	curl_close($ch); // Close the cURL connection

	return json_decode($result);
}

function ct_get_treesnap_all() {
	
	$file_name = 'public://treesnap_trees.json';
	$file_path = file_create_url($file_name);
	if (file_exists($file_name)) {
		Drupal_json_output(json_decode(file_get_contents($file_path), true));
	}
	else {
		$res = array();
		$url = 'https://treesnap.org/web-services/v1/observations?per_page=100&page=1';
		$curr_page = treesnap_api_req($url); 
		array_push($res, $curr_page->data->data);

		$num_pages = $curr_page->data->last_page;
		for ($i = 2; $i <= $num_pages; $i++) {
			$curr_page = treesnap_api_req('https://treesnap.org/web-services/v1/observations?per_page=100&page=' . $i);
			array_push($res, $curr_page->data->data);
		}
		
		$trees = array('type'=> 'FeatureCollection');

		foreach ($res as $records) {
			foreach ($records as $record) {
				if ($record->species != 'Unknown' && $record->genus != 'Unknown') {
					$curr_tree = array(
						'type' => 'Feature',
						'properties' => array(
							'coordinate_type' => 'approximate'  
						),
						'geometry' => array(
							'type' => 'Point' 
						)
					);
					$ts_id = 'treesnap.' . $record->id;
					$prop = &$curr_tree['properties'];
					
					$prop['markertype'] = null;
					/*
					$prop['phenotype_name'] = null;
					$prop['pato'] = null;
					$prop['po'] = null;
					$prop['pub_year'] = null;
					*/

					$query = db_query('SELECT chado.organismprop.type_id, chado.organismprop.value FROM chado.organism JOIN chado.organismprop ON chado.organism.organism_id = chado.organismprop.organism_id AND chado.organism.species = :species AND chado.organism.genus = :genus WHERE (chado.organismprop.type_id = 10 OR chado.organismprop.type_id = 35)', array(':species' => $record->species, ':genus' => $record->genus));
					/*
					$query = db_select('chado.organism', 'og');
					$query->join('chado.organismprop', 'ogp', 'og.organism_id = ogp.organism_id');
					$query->fields('ogp', array('type_id', 'value')); 
					$db_or = db_or();
					$db_or->condition('ogp.type_id', 10, '=');
					$db_or->condition('ogp.type_id', 35, '=');
					$query->condition($db_or);
					$query->condition('og.species', $record->species, '=');
					*/
					foreach($query as $row) {
						if ($row->type_id == 10) {
							$prop['family'] = $row->value;
						}
						else{
							$prop['plant_group'] = $row->value;
						}
					}
					$prop['pub_tgdr'] = null;
					$prop['species'] = $record->genus . ' ' .$record->species;
					$prop['source_url'] = $record->url;
					$prop['images'] = $record->images;
					$prop['data_source'] = 'treesnap';
					$prop['genus'] = $record->genus;
					
					if ($prop['plant_group'] == 'gymnosperm') {
						$prop['icon_type'] = 'treesnap_gymno';
					}
					else {
						$prop['icon_type'] = 'treesnap_angio';
					}
					$prop['id'] = $ts_id;
					$curr_tree['geometry']['coordinates'] = array($record->longitude, $record->latitude);
					$curr_tree['id'] = $ts_id;
					$trees['features'][] = $curr_tree; //push to trees array
					/*
					db_query("INSERT INTO ct_treesnap (id, species, genus, category, url, image_url, longitude, latitude)
						SELECT $ts_id, $record->species, $record->genus, $record->category, $record->url, $record->thumbnail, $record->longitude, $record->latitude SELECT ct_treesnap WHERE NOT EXISTS (SELECT 1 FROM ct_treesnap WHERE id = $ts_id");
					*/
				}
			}
		}
		file_unmanaged_save_data(json_encode($trees), $file_name);	
    	Drupal_json_output($trees);
	}
   //Drupal_json_output($trees);
}

//TREE specific database data

//treegenes
function ct_get_tg_trees($records, $plant_group){
	$file_name = 'public://' . $plant_group . '.json';
	/*
	if (file_exists($file_name)) {
		$file_path = file_create_url($file_name);
		return json_decode(file_get_contents($file_path), true);
	}
	else {*/
		$exclude = array(
			'ZK0008','ZK0014','ZK0065','ZK0191',
			'ZK0195','ZK0160','ZK0235','ZK0180','ZK0083',
			'ZK0262','ZK0260','ZK0188','ZK0016','ZK0213',
			'ZK0202', 'TGDR018-106499', 'TGDR018-106500',
			'TGDR018-106501', 'TGDR018-106502', 'TGDR018-106503',
			'TGDR018-106504', 'TGDR018-106505', 'TGDR018-106506',
			'TGDR018-106507', 'TGDR018-106508'
		);

		$trees = array('type'=> 'FeatureCollection');
		foreach($records as $record){
			if(!in_array($record->uniquename, $exclude)){
				$curr_tree = array(
					'type' => 'Feature',
					'properties' => array(
						'coordinate_type' => 'exact'  
					),
					'geometry' => array(
						'type' => 'Point' 
					)
				);
				$prop = &$curr_tree['properties'];
				$prop['id'] = $record->uniquename;
				
				$prop['markertype'] = $record->marker_type;
				/*
				$prop['phenotype_name'] = $record->phenotype_name;
				$prop['pato'] = $record->pato_name;
				$prop['po'] = $record->po_name;
				$prop['pub_year'][] = $record->pyear;
				*/

				$prop['species'] = $record->genus . ' ' .$record->species;
				$prop['data_source'] = 'treegenes';
				$prop['pub_tgdr'] = $record->accession;
				$prop['genus'] = $record->genus;
				$prop['plant_group'] = $record->subkingdom;
				$prop['family'] = $record->family;

				$prop['icon_type'] = $record->subkingdom . '_ex';
				$curr_tree['geometry']['coordinates'] = array($record->longitude, $record->latitude);
				$curr_tree['id'] = $record->accession;
				$trees['features'][] = $curr_tree; //push to trees array
			}
		}
		//file_unmanaged_save_data(json_encode($trees), $file_name);
		//file_put_contents(fileName . '.json', $trees);
		return $trees;
	//}
	//return $trees;
}

function ct_get_tg_gymno_geojson(){
	$records = db_query('
		SELECT *
		FROM {ct_view_complete}
		WHERE subkingdom = :gymno 
		AND uniquename NOT LIKE :pub55
		AND uniquename NOT LIKE :pub57
	', array('gymno' => 'gymnosperm', 'pub55'=>'TGDR055%', 'pub57'=>'TGDR057%'));
	Drupal_json_output(ct_get_tg_trees($records, 'gymno_trees'));
}

function ct_get_tg_angio_geojson(){
	$records = db_query('
		SELECT *
		FROM {ct_view_complete}
		WHERE subkingdom = :angio
		AND uniquename NOT LIKE :pub55
		AND uniquename NOT LIKE :pub57
	', array('angio' => 'angiosperm', 'pub55'=>'TGDR055%', 'pub57'=>'TGDR057%'));
	Drupal_json_output(ct_get_tg_trees($records, 'angio_trees'));
}

function ct_get_datadryad_all(){
	$records = db_query('
		SELECT *
		FROM {ct_datadryad}
	');

	$trees = array('type'=> 'FeatureCollection');
	foreach($records as $record){
		$curr_tree = array(
			'type' => 'Feature',
			'properties' => array(
				'coordinate_type' => $record->coordinate_type
			),
			'geometry' => array(
				'type' => 'Point' 
			)
		);
		$prop = &$curr_tree['properties'];
		
		$prop['markertype'] = null;
		/*
		$prop['phenotype_name'] = null;
		$prop['pato'] = null;
		$prop['po'] = null;		
		$prop['pub_year'] = null;
		*/
		$prop['pub_tgdr'] = null;
		$prop['family'] = null;
		$prop['genus'] = explode(" ", $record->species)[0];
		$prop['species'] = $record->species;
		$prop['data_source'] = 'dryad';
		$prop['plant_group'] = $record->plant_group;
		
		$prop['icon_type'] = $record->img_type;
		$prop['id'] = $record->id;
		$curr_tree['geometry']['coordinates'] = array($record->longitude, $record->latitude);
		$curr_tree['id'] = $record->id;
		$trees['features'][] = $curr_tree; //push to trees array
	}
	Drupal_json_output($trees);
}

function ct_get_trees_all_tg(){
	//all trees from ct_view
	$records = db_query('
		SELECT *
		FROM {chado.ct_view}
	');
	
	Drupal_json_output(ct_get_tg_trees($records));
}

function ct_get_pub_data(){
	$pub_selected = json_decode($_POST['data'], true);
	$query = db_select('chado.pub_view', 'p');
	$query->join('chado.tpps_study_summary', 'v', 'p.pub_id = v.pub_id');
	$publication = $query
		->fields('p')
		->fields('v')
		->condition('v.accession', $pub_selected['pub_acc'], '=')
		->execute();
				 
	$result = array();
	foreach($publication as $pub){
		$result['id'] = $pub->pub_id;
		$result['year'] = $pub->pyear;
		$result['title'] = $pub->title;
		$result['author'] = $pub->author;
		$result['num_trees'] = $pub->tree_count;
		$result['species'] = $pub->species;
		$result['study_type'] = $pub->study_type;
		$result['acc'] = $pub->accession;
	}
	Drupal_json_output($result);
}

function cartogratree_get_publications_data_json() {
	$records = db_query('
		SELECT coord.accession, coord.uniquename FROM chado.tpps_study_summary pub, chado.coordinates_view coord WHERE pub.accession = coord.accession AND pub.accession NOT LIKE :tg', 
		array('tg' => 'TGDR055%')
	);
	$trees = array();
	foreach($records as $record) {
		//055 and 057 don't seem to have valid coordinates
		if($record->accession != 'TGDR055' && $record->accession != 'TGDR057'){
			$trees[$record->accession][] = $record->uniquename;
		}
	}
	drupal_json_output($trees);
}

function cartogratree_get_phenotypic_data_json() {
	$pheno_prop_selected = json_decode($_POST['data'], true);
	$records = array();
	if($pheno_prop_selected['type'] == 'phenotype'){
		$records = db_query('
			SELECT DISTINCT ON(tree_acc) * FROM {chado.new_pheno_view} p
			LEFT JOIN {chado.coordinates_view} c ON p.tree_acc = c.uniquename 
			WHERE c.uniquename IS NOT NULL AND phenotype_name = :pn', 
			array('pn' => $pheno_prop_selected['val'])
		);
	}
	else if($pheno_prop_selected['type'] == 'pato'){
		$records = db_query('
			SELECT DISTINCT ON(tree_acc) * FROM {chado.new_pheno_view} p
			LEFT JOIN {chado.coordinates_view} c ON p.tree_acc = c.uniquename 
			WHERE c.uniquename IS NOT NULL AND pato_name = :pt', 
			array('pt' => $pheno_prop_selected['val'])
		);
	}
	else if($pheno_prop_selected['type'] == 'po'){
		$records = db_query('
			SELECT DISTINCT ON(tree_acc) * FROM {chado.new_pheno_view} p
			LEFT JOIN {chado.coordinates_view} c ON p.tree_acc = c.uniquename 
			WHERE c.uniquename IS NOT NULL AND po_name = :po', 
			array('po' => $pheno_prop_selected['val'])
		);
	}

	$trees = array();
	foreach($records as $record) {
		$trees[] = $record->tree_acc;
	}
	drupal_json_output($trees);
}

function cartogratree_get_genotypic_data_json() {
	//$trees_selected = json_decode($_POST['data'], true)['trees'];
	$snps_list = array();
	$genotype_data = array();
	$trees_selected = array('TGDR006-14315', 'TGDR006-14154');
	
	$all_snps = db_query('
		SELECT uniquename FROM ct_geno_view GROUP BY uniquename
	');

	foreach($all_snps as $snp){
		$snps_list[] = $snp->uniquename;
	}

	$trees_records = db_query('
		SELECT tree_acc FROM ct_geno_view GROUP BY tree_acc LIMIT 100
	');

	//$all_null = array();
	foreach($trees_records as $tree) {
		foreach($snps_list as $snp){	
			$genotype_data[$tree->tree_acc][$snp/*$snps_list[$i]*/] = 'NaN';
		}
			
		$records = db_query('
			SELECT * FROM ct_geno_view WHERE tree_acc = :tree ORDER BY uniquename
		', array('tree'=>$tree->tree_acc));

		foreach($records as $record) {
			//$genotype_data[$record->tree_acc] = array($record->uniquename;
			if($record->description == 'G:G'){
				$genotype_data[$record->tree_acc][$record->uniquename] = 0;
			}
			else if($record->description == 'A:A'){	
				$genotype_data[$record->tree_acc][$record->uniquename] = 2;
			}
			else if($record->description != 'NaN'){	
				$genotype_data[$record->tree_acc][$record->uniquename] = 1;
			}
    	}
	}
	
	$ordered_geno = array($snps_list);
	foreach($genotype_data as $tree => $markers){
		$markers_arr = array($tree);
		foreach($markers as $marker){
			array_push($markers_arr, $marker);
		}
		array_push($ordered_geno, $markers_arr);
	}
	drupal_json_output($ordered_geno);
}

?>
