<?php

function cartogratree_uiapi_speciesinfo_popgen($species_text) {
  global $base_url;
  $species_parts = explode('-', $species_text);
  $genus = $species_parts[0];
  $species = $species_parts[1];
  $output = [];

  $result_accessions = chado_query('SELECT DISTINCT(accession), project_id, species, title, author, tree_count, year FROM chado.plusgeno_view WHERE species ILIKE :species;',
  array(
    ':species' => $genus . ' ' . $species,
  )
);

  $count_accessions = $result_accessions->rowCount();
  $markup = '';

  //$markup .= "<a href='$base_url/tpps_details/main?field_title=species&field_value=$organism_name&tpps_details_search_status=search_executed#results'>Get more TPPS details for " . $organism_name . "</a><br />";

  $markup .= "
      <style>
        #popgen_studies_table td {
          border-bottom: 1px solid #40b363;
          padding: 3px;
          padding-top: 10px;
          padding-bottom: 10px;
        }
        #popgen_studies_table th {
          /*
          border: 1px solid #40b363;
          padding: 3px;
          background-color: #40b363;
          color: #FFFFFF;
          */
        }					
      </style>
  
  ";
  $markup .= "<table class='species-info-table' id='popgen_studies_table' style='width: 100%; border-collapse: collapse;'>";
  $markup .= "<tr><th>Study</th><th>Author</th><th>Plants</th><th>Data</th><th>Study details</th></tr>";
  $study_arr = [];
  foreach ($result_accessions as $row) {
    $data = '';
    $accession_temp = $row->accession;
    $study_arr[] = $accession_temp;



    // Load this data from the TPPS study state
    try {
      $full_state = tpps_submission($accession_temp)->getState();
      $saved_values = $full_state['saved_values'];
      // dpm($saved_values[2]['data_type']);
      if ($saved_values[2]['data_type'] != "" && isset($saved_values[2]['data_type'])) {
        $data .= $saved_values[2]['data_type'] . ": ";
      }
    }
    catch (Exception $ex) {
    
    }

    // Add phenotypes if any
    // $study_specific_phenotypes = chado_query('SELECT * FROM chado.phenotypes_and_units_by_study WHERE accession = :accession', [
    //   ':accession' => $accession_temp
    // ]);
    // foreach ($study_specific_phenotypes as $study_row) {
    //   if ($study_row->phenotype != NULL) {
    //       $data .= $study_row->phenotype . ', '; 
    //   }
    // } 



    // Add genotypes
    $study_specific_results = chado_query('SELECT * FROM chado.plusgeno_view WHERE accession = :accession', [
    ':accession' => $accession_temp
    ]);
    foreach ($study_specific_results as $study_row) {
      if ($study_row->markers != NULL) {
        if (stripos($data, $study_row->markers) === FALSE) {
        // dpm('IT CAME HERE');
        $data .= $study_row->markers . ' (' . $study_row->gen_count . '), ';
        }
      }
    } 
    $data = rtrim($data, ', ');

    // $authors = explode(",", $row->value);
    //This is the old code based on the species but now we have the actual studies
    //$markup .= $row->accession . " | " .  $authors[0]  . " et al (" . $row->pyear . ") | " . $row->count . " trees (<a href='$base_url/cartogratree?genus=$genus&species=$species&layer_name=ct:ct_view'>Display in CartograTree</a>)<br />";
    //$markup .= '<tr><td><a href="/tpps_details/accession/' . $row->accession . '">' . $row->accession . "</a></td><td>" .  explode(',',$row->author)[0]  . " et al (" . $row->year . ") </td><td>" . $row->tree_count . " trees </td><td><a href='$base_url/cartogratree?accession=" . $row->accession . "&layer_name=ct:ct_view'>Display in CartograTree</a></td></tr>";
    $author = trim($row->author);
    if (stripos($author, ',') == 0) {
      // remove it
      $author = substr($author, 1, strlen($author));
      $author = trim($author);
    }
    $author = explode(',',trim($author))[0];
    $markup .= '<tr><td><a target="_blank" href="/tpps/details/' . $row->accession . '">' . $row->accession . "</a></td><td>" .  $author  . " et al (" . $row->year . ") </td><td>" . $row->tree_count . " plants </td><td study-accession='" . $row->accession . "' class='data'>$data</td><td><a target='_blank' href='$base_url/tpps/details/" . $row->accession . "'>Show</a></td></tr>";
  }
  $markup .= "</table>";
  //$markup .= "<br /><a href='$base_url/tpps_details/main'>[View all TPPS submissions]</a>";
  $markup .= "<br /><a target='_blank' href='$base_url/tpps/details'>[View all TPPS submissions]</a> ";

  $output['markup'] = $markup;
  drupal_json_output($output);
}

function cartogratree_uiapi_speciesinfo_transcriptome($species_text) {
	//$time_start = microtime();
	global $base_url;
	$transcriptome = array();

  $species_parts = explode('-', $species_text);
  $genus = $species_parts[0];
  $species = $species_parts[1];

  // Find organism_id by looking up the chado.organism table
  $sql_organism = 'SELECT * FROM chado.organism WHERE genus ILIKE :genus AND species ILIKE :species LIMIT 1;';
  $results_organism = chado_query($sql_organism, [
    ':genus' => $genus,
    ':species' => $species
  ]);
  $organism_id = NULL;
  foreach ($results_organism as $row) {
    $organism_id = $row->organism_id;
  }


  // Get the cvterm for name = 'organism 4 letter code' from the chado.cvterm table
  $sql_cvterm = 'SELECT * FROM chado.cvterm WHERE name ILIKE :cvterm_name LIMIT 1;';
  $results_cvterm = chado_query($sql_cvterm, [
    ':cvterm_name' => 'organism 4 letter code'
  ]);
  $cvterm_id_organism_4_letter_code = NULL;
  foreach ($results_cvterm as $row) {
    $cvterm_id_organism_4_letter_code = $row->cvterm_id;
  }


  // Get the 4 letter code from chado.organismproperty table using the organism_id and cvterm_id_organism_4_letter_code
  $sql_four_letter_code = 'SELECT * FROM chado.organismprop WHERE organism_id = :organism_id AND type_id = :cvterm_id_organism_4_letter_code LIMIT 1;';
  $results_four_letter_code = chado_query($sql_four_letter_code, [
    ':organism_id' => $organism_id,
    ':cvterm_id_organism_4_letter_code' => $cvterm_id_organism_4_letter_code
  ]);
  foreach ($results_four_letter_code as $row) {
    $transcriptome['four_letter_code'] = $row->value;
  }
	
	// $transcriptome['four_letter_code'] = organism_api_get_four_letter_code($organism_id); //I think this retrieves it exactly for the directory name
	//$local_dir = "/linuxshare/projects/treegenes/tgwebprod_store/FTP/Transcriptome/";
	$local_dir = "/isg/treegenes/treegenes_store/FTP/Transcriptome/";
	
	//EST COUNT AND DOWNLOAD
	$est_file = $local_dir . "EST/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_EST.fasta";
	$transcriptome['est_http_link'] = "/FTP/Transcriptome/EST/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_EST.fasta";

	
  $args = array();
	$sql = "SELECT transcriptome_est_count as est_count FROM chado.species_summary WHERE organism_id = '$organism_id' LIMIT 1";
	//dpm($sql);
	$results = chado_query($sql, $args);
	//$results_count = $results->rowCount();
	
	$est_count = 0;
	foreach($results as $row) {
		$est_count = $row->est_count;
	}
  $transcriptome['est_count'] = $est_count;
	//echo "NCBI EST: $est_count ESTs | <a href='$est_http_link'>Download EST FASTA</a><br />";

	//cDNA COUNT AND DOWNLOAD
	$cdna_file = $local_dir . "cDNA/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_cDNA.fasta";
	$transcriptome['cdna_http_link'] = "/FTP/Transcriptome/cDNA/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_cDNA.fasta";

  $args = array();
	$sql = "SELECT transcriptome_cdna_count as cdna_count FROM chado.species_summary WHERE organism_id = '$organism_id' LIMIT 1";
	//dpm($sql);
	$results = chado_query($sql, $args);
	//$results_count = $results->rowCount();
	
	$cdna_count = 0;
	foreach($results as $row) {
		$cdna_count = $row->cdna_count;
	}

	$transcriptome['cdna_count'] = $cdna_count;


	if($transcriptome['cdna_count'] == "" || $transcriptome['cdna_count'] == '0') {
	   $transcriptome['cdna_count'] = 0;
	}
	//echo "NCBI cDNAs: $transcriptome['cdna_count'] cDNAs | <a href='$cdna_http_link'>Download cDNA FASTA</a><br />";

	//TSA COUNT AND DOWNLOAD
	$tsa_file = $local_dir . "TSA/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_TSA.fasta";
	$transcriptome['tsa_http_link'] = "/FTP/Transcriptome/TSA/" . $transcriptome['four_letter_code'] . "/" . $transcriptome['four_letter_code'] . "_TSA.fasta";
	
  $args = array();
	$sql = "SELECT transcriptome_tsa_count as tsa_count FROM chado.species_summary WHERE organism_id = '$organism_id' LIMIT 1";
	//dpm($sql);
	$results = chado_query($sql, $args);
	//$results_count = $results->rowCount();
	
	$tsa_count = 0;
	foreach($results as $row) {
		$tsa_count = $row->tsa_count;
	}

  $transcriptome['tsa_count'] = $tsa_count;

	//echo "NCBI TSA: $transcriptome['tsa_count'] TSAs | <a href='$transcriptome['tsa_http_link']'>Download TSA FASTA</a><br />";

	//1KP
	$onekp_file = $local_dir . "/../Transcriptome/1kp/" . $transcriptome['four_letter_code'];
	$transcriptome['onekp_http_link'] = "/FTP/Transcriptome/1kp/" . $transcriptome['four_letter_code'];

	//echo "1KP Project Transcripts: <!-- X Transcripts | --> <a href='$transcriptome['onekp_http_link']' target='_blank'>Download 1KP FASTA</a><br />";

	//Unigenes
	$main_dir = "/FTP/TreeGenes_UniGene/"; //This is basically the relational path to the files, we'll use this as the parent directory
	$transcriptome['link_browse_all_files'] = $main_dir . $transcriptome['four_letter_code'];

	$transcriptome['genes_file'] = "/FTP/Unigenes/98/TreeGenes_UniGene/" . $transcriptome['four_letter_code'] . "/TG_Unigenes_" . $transcriptome['four_letter_code'] . "_complete_partial_genes.fasta";
	$transcriptome['prots_file'] = "/FTP/Unigenes/98/TreeGenes_UniGene/" . $transcriptome['four_letter_code'] . "/TG_Unigenes_" . $transcriptome['four_letter_code'] . "_complete_partial_prots.fasta";
	//echo "TreeGenes UniGenes: <!-- X UniGenes | --> Download UniGene FASTA - <a href='$transcriptome['genes_file']'>GENES</a> | <a href='$transcriptome['prots_file']'>PROTS</a> <br />";

	//TSEQ
	//echo "Sequence Similarity Search: <a href='$base_url/Diamond/submit'>Search Transcripts at TSeq</a><br />";


	//echo "<h4>FTP Downloads</h4>";
	$args = array();

	//UniGene Blast
	$sql = "select * from tseq_db_existing_locations WHERE type = 'Gene' and category = 'UniGene' and location ilike '%" . $transcriptome['four_letter_code'] . "%';";
	//dpm('UniGene Blast');
	//dpm($sql);
	$result = chado_query($sql, $args);

	$transcriptome['blast_file_count'] = $result->rowCount();
	//dpm($transcriptome['blast_file_count']);
	if($transcriptome['blast_file_count'] > 0) {
	   foreach ($result as $row) {
		  //dpm($row);
		  $location = $row->location;
		  $location = explode('/Unigenes/',$location)[1];
		  $pathinfo = pathinfo($location);
		  $transcriptome['link_blast_blast'] = $base_url . '/../FTP/Unigenes/' . $pathinfo['dirname'];
		  //echo "<a href='$transcriptome['link_blast']' target='_blank'>Download UniGene BLAST index</a><br />";
	   }
	}

	//UniGene Diamond
	$sql = "select * from tseq_db_existing_locations WHERE type = 'Protein' and category = 'UniGene' and location ilike '%" . $transcriptome['four_letter_code'] . "%';";
	//dpm('UniGene Diamond');
	//dpm($sql);
	$result = chado_query($sql, $args);

	$transcriptome['diamond_file_count'] = $result->rowCount();
	//dpm($transcriptome['diamond_file_count']);
	if($transcriptome['diamond_file_count'] > 0) {
	   foreach ($result as $row) {
		  //dpm($row);
		  $location = $row->location;
		  $location = explode('/Unigenes/',$location)[1];
		  $pathinfo = pathinfo($location);
		  $transcriptome['link_diamond_blast'] = $base_url . '/../FTP/Unigenes/' . $pathinfo['dirname'];
		  //echo "<a href='$transcriptome['link_blast']' target='_blank'>Download UniGene BLAST index</a><br />";
	   }
	}




	//TSA Diamond
	$sql = "select * from tseq_db_existing_locations WHERE type ilike 'Protein' and category ilike 'TSA' and location ilike '%" . $transcriptome['four_letter_code'] . "%';";
	//dpm('TSA Diamond');
	//dpm($sql);
	$result = chado_query($sql, $args);

	$tsa_diamond_file_count = $result->rowCount();
	//dpm($tsa_diamond_file_count);
	if($tsa_diamond_file_count > 0) {
	   foreach ($result as $row) {
		  //dpm($row);
		  $location = $row->location;
		  $location = explode('/FTP/',$location)[1];
		  $pathinfo = pathinfo($location);
		  $link_diamond = $base_url . '/../FTP/' . $location;
		  $transcriptome['link_tsa_diamond_blast'] = $base_url . '/../FTP/' . str_ireplace('.dmnd', '.fasta', $location);
		  //echo "<a href='$link_diamond' target='_blank'>Download TSA Diamond index</a><br />";
		  //echo "<a href='$transcriptome['link_blast']' target='_blank'>Download TSA BLAST index</a><br />";
	   }
	}

  drupal_json_output($transcriptome);

	//$time_end = microtime();
	//drupal_set_message("Time taken:" . ($time_end - $time_start));
	//TSA BLAST
	//$time_end = microtime();
	//dpm("Time taken:" . ($time_end - $time_start));	  
}

function cartogratree_uiapi_speciesinfo_genome($species_text) {
  global $base_url;
  $genome = array();
  $species_parts = explode('-', $species_text);
  $genus = $species_parts[0];
  $species = $species_parts[1];

  // Find organism_id by looking up the chado.organism table
  $sql_organism = 'SELECT * FROM chado.organism WHERE genus ILIKE :genus AND species ILIKE :species LIMIT 1;';
  $results_organism = chado_query($sql_organism, [
    ':genus' => $genus,
    ':species' => $species
  ]);
  $organism_id = NULL;
  foreach ($results_organism as $row) {
    $organism_id = $row->organism_id;
  }


  // Get the cvterm for name = 'organism 4 letter code' from the chado.cvterm table
  $sql_cvterm = 'SELECT * FROM chado.cvterm WHERE name ILIKE :cvterm_name LIMIT 1;';
  $results_cvterm = chado_query($sql_cvterm, [
    ':cvterm_name' => 'organism 4 letter code'
  ]);
  $cvterm_id_organism_4_letter_code = NULL;
  foreach ($results_cvterm as $row) {
    $cvterm_id_organism_4_letter_code = $row->cvterm_id;
  }


  // Get the 4 letter code from chado.organismproperty table using the organism_id and cvterm_id_organism_4_letter_code
  $sql_four_letter_code = 'SELECT * FROM chado.organismprop WHERE organism_id = :organism_id AND type_id = :cvterm_id_organism_4_letter_code LIMIT 1;';
  $results_four_letter_code = chado_query($sql_four_letter_code, [
    ':organism_id' => $organism_id,
    ':cvterm_id_organism_4_letter_code' => $cvterm_id_organism_4_letter_code
  ]);
  foreach ($results_four_letter_code as $row) {
    $genome['four_letter_code'] = $row->value;
  }

  
  // dpm($organism_id);
  $main_dir = "/FTP/Genomes/"; //This is basically the relational path to the files, we'll use this as the parent directory
  // $genome['four_letter_code'] = organism_api_get_four_letter_code($organism_id); //I think this retrieves it exactly for the directory name
  if (empty($genome['four_letter_code']) or $genome['four_letter_code'] == '') {
    $genome['four_letter_code'] = 'FOUR-LETTER-CODE-DOES-NOT-EXIST';
  }
  // dpm($genome['four_letter_code']);

  $genome['version'] = "v1.0"; //Version 1.0 but overriden by the future if is_dir clause

  //$local_dir = "/linuxshare/projects/treegenes/tgwebprod_store/FTP/Genomes/";
  $root_dir = "/isg/treegenes/treegenes_store/";
  $local_dir = "/isg/treegenes/treegenes_store/FTP/Genomes/";
  // dpm($genome);
  $local_dir_gene = $local_dir . $genome['four_letter_code'];


  // Lookup species name (Format: Genus_species)
  $species_results = chado_query('SELECT genus, species FROM chado.organism WHERE organism_id = :organism_id', [
    ':organism_id' => $organism_id
  ]);
  $species = NULL;
  foreach ($species_results as $species_row) {
    $species = $species_row->genus . '_' . $species_row->species;
  }
  if (empty($species)) {
    $species = 'SPECIES-DOES-NOT-EXIST';
  }
  $local_dir_gene_new_format = $local_dir . $species;
  $genome_species_identifier = $genome['four_letter_code'];
  if (is_dir($local_dir_gene_new_format)) {
    // override the local dir gene
    $local_dir_gene = $local_dir_gene_new_format;
    $genome_species_identifier = $species;
  }

  $genome['ftp_all'] = $main_dir . $genome_species_identifier;
	
	$genome['scaffolds_count'] = 'N/A';
	$genome['genes_count'] = 'N/A';
	if(is_dir($local_dir_gene)) {
		$versions = scandir($local_dir_gene);
		$versions_count = count($versions);

		/* This code sorts the version directories by modified time - so the latest modified time is used for the latest version */
		$versions_temp = array();
		try {
			for($i=0; $i<$versions_count; $i++) {
				$temp_version = $versions[$i];
				if(is_dir($local_dir_gene . '/' . $temp_version) && $temp_version != '.' && $temp_version != '..') {
					$versions_temp[filemtime($local_dir_gene . '/' . $temp_version)] = $temp_version;
				}
			}
			ksort($versions_temp);
			$versions_temp = array_reverse($versions_temp);
			$genome['versions_list'] = $versions_temp;
			foreach($versions_temp as $key => $val) {
				$genome['version'] = $val;
				break;//break to only get first value
			}
		}
		catch(Exception $ex) {
			// dpm($ex->getMessage());
		}
		

		//Use latest version
		//$genome['version'] = $versions[$versions_count - 1];
		//echo "Version: $version<br />";
		$genome['version_code'] = str_ireplace("v","", $genome['version']);
		$genome['version_intval'] = intval($genome['version_code']);
		
		if($genome['version_intval'] == 0) {
			//this is a string value - most probably an upload from Meg's group
			$genome['version_code'] = 'v' . $genome['version_code']; //this should produce something like 1_0
		}
		else {
			//else this is most probably uploaded from TreeGenes
			$genome['version_code'] = str_ireplace(".","_", $genome['version_code']); //this should produce something like 1_0
		}
		
		$genome['version_code'] = str_ireplace(".","_", $genome['version_code']); //this should produce something like 1_0
		

		
		//print_r($versions);
		$genome['link_browse_all_files'] = $main_dir . $genome_species_identifier . "/" . $genome['version'];
		
		
		//Updated standardization of files (29/01/2020)
		
		$ignore_file_extensions = array();
		$ignore_file_extensions[] = ".sh";
		
		
		//ALIGNMENTS DIRECTORY/FILES
		$genome['ftp_alignments_index'] = $genome['link_browse_all_files'] . "/alignments/";
		$local_dir_alignments = $local_dir_gene . "/" . $genome['version'] . "/alignments/";
		$files_alignments = scandir($local_dir_alignments);
		$array_links_alignments = array();
		foreach($files_alignments as $file_alignment) {
			if(is_dir($local_dir_alignments . $file_alignment)) {
				
			}
			else {
				// check if the file starts with a period (.) - these should not be included in the list (hidden files)
				if(substr($file_alignment, 0, 1 ) != ".") {
					$array_links_alignments[] = $genome['link_browse_all_files'] . "/alignments/" . $file_alignment;
				}
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['links_alignments'] = $array_links_alignments;
		
		//ANNOTATION DIRECTORY/FILES
		$genome['ftp_annotation_index'] = $genome['link_browse_all_files'] . "/annotation/";
		$local_dir_annotation = $local_dir_gene . "/" . $genome['version'] . "/annotation/";
		$files_annotation = scandir($local_dir_annotation);
		$array_links_annotation = array();
		$array_links_annotation_versions = array();
		foreach($files_annotation as $file_alignment) {
			if(is_dir($local_dir_annotation . $file_alignment)) {
				if (stripos($file_alignment, 'v') !== FALSE) {
					if(stripos($file_alignment, 'v') == 0) {
						$array_links_annotation_versions[] = $genome['link_browse_all_files'] . "/annotation/" . $file_alignment;
					}
				}
			}
			else {
				if ($file_alignment == 'entap_config.ini') {

				}
				else {
					$array_links_annotation[] = $genome['link_browse_all_files'] . "/annotation/" . $file_alignment;
				}
				//dpm($gmap_dir . $gmap_file);
			}
		}

		// Check for final_annotations_lvl1.tsv
		if (is_file($local_dir_annotation . 'entap_outfiles/final_results/final_annotations_lvl1.tsv')) {
			$array_links_annotation[] = $genome['link_browse_all_files'] . "/annotation/entap_outfiles/final_results/final_annotations_lvl1.tsv";
		}
		$genome['links_annotation'] = $array_links_annotation;	
		$genome['links_annotation_versions'] = $array_links_annotation_versions;		

		//GENOME DIRECTORY/FILES
		$genome['ftp_genome_index'] = $genome['link_browse_all_files'] . "/genome/";
		$local_dir_genome = $local_dir_gene . "/" . $genome['version'] . "/genome/";
		
		//check for QUAST/BUSCO README.txt or README.md
		if(is_file($local_dir_genome . 'README.txt')) {
			//file exists
			$genome['quast_busco_data'] = file($local_dir_genome . 'README.txt');
		}
		elseif (is_file($local_dir_genome . 'README.md')) {
			// file exists
			$genome['quast_busco_data'] = file($local_dir_genome . 'README.md');
		}
		else {
			$genome['quast_busco_data'] = null;
		}
		
		
		$files_genome = scandir($local_dir_genome);
		$array_links_genome = array();
		foreach($files_genome as $file_alignment) {
			if(is_dir($local_dir_genome . $file_alignment)) {
				
			}
			else {
				$array_links_genome[] = $genome['link_browse_all_files'] . "/genome/" . $file_alignment;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['links_genome'] = $array_links_genome;	
		
		//gene_index DIRECTORY/FILES
		$genome['ftp_gene_index_index'] = $genome['link_browse_all_files'] . "/index/gene_index/";
		$local_dir_gene_index = $local_dir_gene . "/" . $genome['version'] . "/index/gene_index/";
		$files_gene_index = scandir($local_dir_gene_index);
		$array_links_gene_index = array();
		foreach($files_gene_index as $item) {
			if($item == '.' || $item == '..') { }
			else {
				$array_links_gene_index[] = $genome['link_browse_all_files'] . "/index/gene_index/" . $item;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['links_gene_index'] = $array_links_gene_index;		

		//genome_index DIRECTORY/FILES
		$genome['ftp_genome_index_index'] = $genome['link_browse_all_files'] . "/index/genome_index/";
		$local_dir_genome_index = $local_dir_gene . "/" . $genome['version'] . "/index/genome_index/";
		$files_genome_index = scandir($local_dir_genome_index);
		$array_links_genome_index = array();
		foreach($files_genome_index as $item) {
			if($item == '.' || $item == '..') { }
			else {
				$array_links_genome_index[] = $genome['link_browse_all_files'] . "/index/genome_index/" . $item;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['links_genome_index'] = $array_links_genome_index;	
		
		//protein_index DIRECTORY/FILES
		$genome['ftp_protein_index_index'] = $genome['link_browse_all_files'] . "/index/protein_index/";
		$local_dir_protein_index = $local_dir_gene . "/" . $genome['version'] . "/index/protein_index/";
		$files_protein_index = scandir($local_dir_protein_index);
		$array_links_protein_index = array();
		foreach($files_protein_index as $item) {
			if($item == '.' || $item == '..') { }
			else {
				$array_links_protein_index[] = $genome['link_browse_all_files'] . "/index/protein_index/" . $item;
			}
		}
		$genome['links_protein_index'] = $array_links_protein_index;			
		

		//GMAP files
		//dpm(scandir($local_dir_gene));
		$genome['ftp_gmap_index'] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gmap/";
		$gmap_dir = $local_dir_gene . "/" . $genome['version'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gmap/";
		$gmap_files = @scandir($gmap_dir);
		$gmap_links_array = array();
		if ($gmap_files === false) {
			$gmap_files = array();
		}
		foreach($gmap_files as $gmap_file) {
			if(is_dir($gmap_dir . $gmap_file)) {
				
			}
			else {
				$gmap_links_array[] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gmap/" . $gmap_file;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['gmap_files'] = $gmap_links_array;
		
		//Bowtie files
		//dpm(scandir($local_dir_gene));
		$genome['ftp_bowtie_index'] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bowtie/";
		$bowtie_dir = $local_dir_gene . "/" . $genome['version'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bowtie/";
		$bowtie_files = @scandir($bowtie_dir);
		$bowtie_links_array = array();
		if ($bowtie_files === false) {
			$bowtie_files = array();
		}
		foreach($bowtie_files as $bowtie_file) {
			if(is_dir($bowtie_dir . $bowtie_file)) {
				
			}
			else {
				$bowtie_links_array[] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bowtie/" . $bowtie_file;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['bowtie_files'] = $bowtie_links_array;
		
		//BWA files
		//dpm(scandir($local_dir_gene));
		$genome['ftp_bwa_index'] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bwa/";
		$bwa_dir = $local_dir_gene . "/" . $genome['version'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bwa/";
		$bwa_files = @scandir($bwa_dir);
		$bwa_links_array = array();
		if ($bwa_files === false) {
			$bwa_files = array();
		}
		foreach($bwa_files as $bwa_file) {
			if(is_dir($bwa_dir . $bwa_file)) {
				
			}
			else {
				$bwa_links_array[] = $genome['link_browse_all_files'] . "/index/Genome_Indexes/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".bwa/" . $bwa_file;
				//dpm($gmap_dir . $gmap_file);
			}
		}
		$genome['bwa_files'] = $bwa_links_array;		
		
		//annotation directory
		if(is_file($root_dir . $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".cds.fa.gz")){
			$genome['link_gene_file_in_fasta_format'] = $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".cds.fa.gz";
		}
		else {
			$genome['link_gene_file_in_fasta_format'] = '';
		}
		
		if(is_file($root_dir . $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".peptides.fa.gz")){
			$genome['link_protein_file_in_fasta_format'] = $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".peptides.fa.gz";
		}
		else {
			$genome['link_protein_file_in_fasta_format'] = '';
		}
		
		if(is_file($root_dir . $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gff.gz")){
			$genome['link_gff_file'] = $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gff.gz";
		}
		else {
			$genome['link_gff_file'] = '';
		}
		
		if(is_file($root_dir . $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gtf.gz")) {
			$genome['link_gtf_file'] = $genome['link_browse_all_files'] . "/annotation/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".gtf.gz";
		}
		else {
			$genome['link_gtf_file'] = '';
		}
		
		//genome directory
		if(is_file($root_dir . $genome['link_browse_all_files'] . "/genome/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".fa.gz")) {
			$genome['link_fasta_formatted_genome'] = $genome['link_browse_all_files'] . "/genome/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".fa.gz";
		}
		else if(is_file($root_dir . $genome['link_browse_all_files'] . "/genome/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".fa")) {
			$genome['link_fasta_formatted_genome'] = $genome['link_browse_all_files'] . "/genome/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".fa";
		}
		else {
			$genome['link_fasta_formatted_genome'] = "";
		}
		$genome['link_fasta_formatted_genome_softmasked'] = $genome['link_browse_all_files'] . "/genome/" . $genome['four_letter_code'] . "." . $genome['version_code'] . ".softmasked.fa.gz";

		$scaffolds_file = $local_dir . $genome['four_letter_code'] . '/' . $genome['version_code'] . "/genome/scaffolds_count.txt";
		//dpm($scaffolds_file);
		$genome['scaffolds_count'] = trim(@file_get_contents($scaffolds_file));
		if($genome['scaffolds_count'] == '') {
			$genome['scaffolds_count'] = 'N/A';
		}

		$genes_file = $local_dir . $genome['four_letter_code'] . '/' . $genome['version'] . "/annotation/genes_count.txt";
		//dpm($genes_file);
		$genome['genes_count'] = trim(@file_get_contents($genes_file));
		if($genome['genes_count'] == '') {
			  $genome['genes_count'] = 'N/A';
		}

		$genome['link_jbrowse'] = "/JBrowse/?data=$base_url/api/jbrowse/$organism_id";

		if(is_dir($local_dir_gene . "/" . $genome['version'] . "/index/gene_index/" . $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".gene_blast")) {
			$genome['download_blast_index'] = $genome['link_browse_all_files'] . "/index/gene_index/" . $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".gene_blast";
		}
		if(is_dir($local_dir_gene . "/" . $genome['version'] . "/index/genome_index/" . $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".gmap")) {
			$genome['download_gmap_index'] = $genome['link_browse_all_files'] . "/index/genome_index/" .  $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".gmap";
		}
		if(is_dir($local_dir_gene . "/" . $genome['version'] . "/index/genome_index/" . $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".bwa")) {
			$genome['download_bwa_index'] = $genome['link_browse_all_files'] . "/index/genome_index/" .  $genome['four_letter_code'] . "." . str_ireplace('v','',str_ireplace('.','_',$genome['version'])) . ".bwa";
		}		


		$lines_count = count($genome['quast_busco_data']);
		$record_lines = false;
		$lines_output = '';
		$quast_table_output = "\n";
		$quast_table_output .= "<div style='font-weight: bold; border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>Name</div><div style='width: 50%; display: inline-block;'>Value</div></div>";
		//dpm($genome['quast_busco_data']);
		$quast_total_scaffolds = 'N/A';
		$quast_total_contigs = 0;
		$quast_total_contigs_5k = 0;
		$quast_total_length = 0;
		$quast_total_length_5k = 0;	
		$quast_N50 = 0;
		$quast_L50 = 0;				
		for($i = 0; $i < $lines_count; $i++) {
			$line = trim($genome['quast_busco_data'][$i]);
			$temp_line = trim($line);
			while(strpos($temp_line, '  ') !== FALSE) {
				$temp_line = str_replace("  ", " ", $temp_line);
			}
			if(stripos($line,'Assembly') !== FALSE) {
				$record_lines = true;
			}					
			else if(stripos($line,'______') !== FALSE) {
				$record_lines = false;
				break;
			}	
			
			if($record_lines == true) {
				// dpm($temp_line);
				if(stripos($temp_line, '# contigs (>= 0 bp)') !== FALSE) {
					$quast_total_contigs = explode('# contigs (>= 0 bp)', $temp_line)[1];
					$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>Total contigs</div><div style='width: 50%; display: inline-block;'>$quast_total_contigs</div></div>";
					$quast_total_scaffolds = explode('# contigs (>= 0 bp)', $temp_line)[1];
					//dpm($total_scaffolds);
				}
				else if(stripos($temp_line, 'Total length (>= 0 bp)') !== FALSE) {
					$quast_total_length = explode('Total length (>= 0 bp)', $temp_line)[1];
					$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>Total length</div><div style='width: 50%; display: inline-block;'>$quast_total_length</div></div>";
				}
				else if(stripos($temp_line, '# contigs (>= 5000 bp)') !== FALSE) {
					$quast_total_contigs_5k = explode('# contigs (>= 5000 bp)', $temp_line)[1];
					$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>Total contigs (> 5kb)</div><div style='width: 50%; display: inline-block;'>$quast_total_contigs_5k</div></div>";
					//dpm($total_scaffolds);
				}
				else if(stripos($temp_line, 'Total length (>= 5000 bp)') !== FALSE) {
					$quast_total_length_5k = explode('Total length (>= 5000 bp)', $temp_line)[1];
					$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>Total length (> 5kb)</div><div style='width: 50%; display: inline-block;'>$quast_total_length_5k</div></div>";
				}	
				else if(stripos($temp_line, 'N50') !== FALSE) {
					$quast_N50 = explode('N50', $temp_line)[1];
					if (trim($quast_N50) != "") {
						$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>N50</div><div style='width: 50%; display: inline-block;'>$quast_N50</div></div>";
					}
				}
				else if(stripos($temp_line, 'L50') !== FALSE) {
					$quast_L50 = explode('L50', $temp_line)[1];
					$quast_table_output .= "<div style='border: 0px solid #e2e2e2; padding: 10px;'><div style='width: 50%; display: inline-block;'>L50</div><div style='width: 50%; display: inline-block;'>$quast_L50</div></div>";
				}		
				
				$lines_output .= $temp_line . "\n";

				
			}
		
		}    
    $genome['quast_busco_data_table'] = $quast_table_output;

		// $result_polypeptides = organism_api_get_polypeptides($organism_id)->fetchObject() ;
		// $result_genes = organism_api_get_genes($organism_id)->fetchObject();
		// $result_scaffolds = organism_api_get_scaffolds($organism_id);

		//dpm($genome);
	}
	else {
		//echo "No downloads available at this time, please check back periodically.";
	}

  drupal_json_output($genome);
}

function cartogratree_uiapi_speciesinfo_subspecieshybrids($species_text) {
  $species_parts = explode('-', $species_text);
  $organism_genus = $species_parts[0];
  $organism_species = $species_parts[1];
	$sql = 'SELECT * FROM chado.organism o 
		LEFT JOIN chado.cvterm c ON o.type_id = c.cvterm_id 
		WHERE genus ILIKE :organism_genus AND species ILIKE :organism_species AND infraspecific_name IS NOT NULL
	';
	$results = chado_query($sql, array(
		':organism_genus' => $organism_genus . '%',
		':organism_species' => $organism_species . '%',
	));
  $species_hybrids = array();
	foreach($results as $row) {
		// dpm($row);
		$species_hybrids[] = [
			'species' => $row->genus . ' ' . $row->species . ' ' . $row->infraspecific_name,
			'type' => $row->name,
		];
	}

	// Find type_id for 'speciesaggregate'
	$sql_type_id = 'SELECT * FROM chado.cvterm WHERE name ILIKE :name LIMIT 1';
	$results_type_id = chado_query($sql_type_id, array(
		':name' => 'speciesaggregate'
	));
	$type_id = -1;
	foreach($results_type_id as $row_type_id) {
		$type_id = $row_type_id->cvterm_id;
	}

	$sql = 'SELECT * FROM chado.organism WHERE genus ILIKE :organism_genus AND species ILIKE :organism_species AND type_id = :type_id';
	$results = chado_query($sql, array(
		':organism_genus' => $organism_genus . '%',
		':organism_species' => $organism_species . '%',
		':type_id' => $type_id,
	));
	foreach($results as $row) {
		if($organism_genus == $row->genus && $organism_species == $row->species) {
			//Do not add this organism since this is the primary organism
		}
		else {
			$species_hybrids[] = [
				'species' => $row->genus . ' ' . $row->species,
				'type' => 'speciesaggregate'
			];
		}
	}

	// Find type_id for 'subspecies'
	$sql_type_id = 'SELECT * FROM chado.cvterm WHERE name ILIKE :name LIMIT 1';
	$results_type_id = chado_query($sql_type_id, array(
		':name' => 'subspecies'
	));
	$type_id = -1;
	foreach($results_type_id as $row_type_id) {
		$type_id = $row_type_id->cvterm_id;
	}

	$sql = 'SELECT * FROM chado.organism WHERE genus ILIKE :organism_genus AND species ILIKE :organism_species AND type_id = :type_id';
	$results = chado_query($sql, array(
		':organism_genus' => $organism_genus . '%',
		':organism_species' => $organism_species . '%',
		':type_id' => $type_id,
	));
	foreach($results as $row) {
		//dpm($row);
		if(!is_array($species_hybrids)) {
			$species_hybrids = array();
		}
		if($organism_genus == $row->genus && $organism_species == $row->species) {
			//Do not add this organism since this is the primary organism
		}
		else {
			$species_hybrids[] = [
				'species' => $row->genus . ' ' . $row->species,
				'type' => 'subspecies'
			];
		}
	}

	// Find type_id for 'varietas'
	$sql_type_id = 'SELECT * FROM chado.cvterm WHERE name ILIKE :name LIMIT 1';
	$results_type_id = chado_query($sql_type_id, array(
		':name' => 'varietas'
	));
	$type_id = -1;
	foreach($results_type_id as $row_type_id) {
		$type_id = $row_type_id->cvterm_id;
	}

	$sql = 'SELECT * FROM chado.organism WHERE genus ILIKE :organism_genus AND species ILIKE :organism_species AND type_id = :type_id';
	$results = chado_query($sql, array(
		':organism_genus' => $organism_genus . '%',
		':organism_species' => $organism_species . '%',
		':type_id' => $type_id,
	));
	foreach($results as $row) {
		//dpm($row);
		if(!is_array($species_hybrids)) {
			$species_hybrids = array();
		}
		if($organism_genus == $row->genus && $organism_species == $row->species) {
			//Do not add this organism since this is the primary organism
		}
		else {
			$species_hybrids[] = [
				'species' => $row->genus . ' ' . $row->species,
				'type' => 'varietas'
			];
		}
	}

	// Find type_id for 'forma'
	$sql_type_id = 'SELECT * FROM chado.cvterm WHERE name ILIKE :name LIMIT 1';
	$results_type_id = chado_query($sql_type_id, array(
		':name' => 'forma'
	));
	$type_id = -1;
	foreach($results_type_id as $row_type_id) {
		$type_id = $row_type_id->cvterm_id;
	}

	$sql = 'SELECT * FROM chado.organism WHERE genus ILIKE :organism_genus AND species ILIKE :organism_species AND type_id = :type_id';
	$results = chado_query($sql, array(
		':organism_genus' => $organism_genus . '%',
		':organism_species' => $organism_species . '%',
		':type_id' => $type_id,
	));
	foreach($results as $row) {
		//dpm($row);
		if(!is_array($species_hybrids)) {
			$species_hybrids = array();
		}
		if($organism_genus == $row->genus && $organism_species == $row->species) {
			//Do not add this organism since this is the primary organism
		}
		else {
			$species_hybrids[] = [
				'species' => $row->genus . ' ' . $row->species,
				'type' => 'forma'
			];
		}
	}
  drupal_json_output($species_hybrids);
}

function cartogratree_uiapi_speciesinfo_summary($species_text) {
  $species_parts = explode('-', $species_text);
  $genus = $species_parts[0];
  $species = $species_parts[1];
  $sql_species = 'SELECT * FROM chado.organism WHERE genus ILIKE :genus_text AND species ILIKE :species_text LIMIT 1;';
  $results = chado_query($sql_species, 
    [
      ':genus_text' => $genus,
      ':species_text' => $species
    ]
  );
  $output = [];
  foreach ($results as $row) {
    $output['organism_id'] = $row->organism_id;
    $output['genus'] = $row->genus;
    $output['species'] = $row->species;
    $output['common_name'] = $row->common_name;
    $output['abbreviation'] = $row->abbreviation;
    $output['organismprops'] = [];

    $results_properties = db_query('SELECT * FROM chado.organismprop LEFT JOIN chado.cvterm ON chado.organismprop.type_id = chado.cvterm.cvterm_id WHERE organism_id = :organism_id',
      array(
        ':organism_id' => $output['organism_id'],
      )
    );
    foreach($results_properties as $row_properties) {
      //dpm($row_properties);
      $output['organismprops'][$row_properties->name] = $row_properties->value;
    }
  }
  drupal_json_output($output);
}

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

function cartogratree_uiapi_get_layers_by_analysis_category_id($analysis_category_id) {
    $results = chado_query('SELECT *, l.title as layer_title, c.title as category_title FROM public.cartogratree_layers l
        LEFT JOIN public.cartogratree_groups g ON l.group_id = g.group_id 
        LEFT JOIN public.cartogratree_subgroups sg ON l.subgroup_id = sg.subgroup_id
        LEFT JOIN public.cartogratree_layers_analysis_categories c ON l.analysis_category_id = c.category_id
        LEFT JOIN public.cartogratree_groups_subgroups gsg ON g.group_id = gsg.group_id AND sg.subgroup_id = gsg.subgroup_id
        WHERE analysis_category_id = :analysis_category_id ORDER BY layer_id ASC;', 
        [':analysis_category_id' => $analysis_category_id]);
    $layers = [];
    foreach ($results as $row) {
        // $layers[] = (array) $row;
        $layers[] = [
            'layer_id' => $row->layer_id,
            'host' => $row->layer_host, // for backwards compatibility
            'isMultiLayeredYear' => $row->layer_multilayer_rangeslider_year_option,
            'layer_multilayer_rangeslider_start_year' => $row->layer_multilayer_rangeslider_start_year,
            'layer_multilayer_rangeslider_end_year' => $row->layer_multilayer_rangeslider_end_year,
            'layer_multilayer_rangeslider_year_option' => $row->layer_multilayer_rangeslider_year_option,
            'layer_year_range_filter_option' => $row->layer_year_range_filter_option,
            'layer_year_range_filter_year_start' => $row->layer_year_range_filter_year_start,
            'layer_year_range_filter_year_end' => $row->layer_year_range_filter_year_end,
            'layer_year_range_filter_geoserver_parameter' => $row->layer_year_range_filter_geoserver_parameter,
            'layer_styles' => $row->layer_styles,
            'layer_host' => $row->layer_host,
            'layer_name' => $row->name,
            'layer_title' => $row->layer_title,
            'description' => $row->description,
            'group_id' => $row->group_id,
            'group_name' => $row->group_name,
            'group_rank' => $row->group_rank,
            'subgroup_id' => $row->subgroup_id,
            'subgroup_name' => $row->subgroup_name,
            'subgroup_rank' => $row->subgroup_rank,
            'analysis_category_id' => $row->analysis_category_id,
            'analysis_category_title' => $row->category_title,
        ];
    };
    drupal_json_output($layers);
}

function cartogratree_uiapi_get_analysis_categories() {
    $results = chado_query('SELECT * FROM public.cartogratree_layers_analysis_categories ORDER BY category_id ASC;', []);
    $categories = [];
    $categories[] = [
        'category_id' => null,
        'title' => 'Uncategorized'
    ];
    foreach ($results as $row) {
        $categories[] = [
            'category_id' => $row->category_id,
            'title' => $row->title,
        ];
    };
    drupal_json_output($categories);
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

function cartogratree_uiapi_get_studies_by_species_text($species_text) {
    $species_text = strtolower(trim($species_text));
    $species_parts = explode(' ', $species_text);

    // Get organism_id
    $organism_id = NULL;
    $results_organism = chado_query('SELECT * FROM chado.organism WHERE genus ILIKE :genus AND species ILIKE :species', [
        ':genus' => $species_parts[0],
        'species' => $species_parts[1]
    ]);
    foreach ($results_organism as $row) {
        $organism_id = $row->organism_id;
    }

    $results_publications = chado_query(
        "SELECT ts.accession, pdbxref.project_id, organism_id, p.name FROM public.tpps_submission ts 
        LEFT JOIN chado.project_dbxref pdbxref ON (ts.dbxref_id = pdbxref.dbxref_id) 
        JOIN chado.project_organism po ON (po.project_id = pdbxref.project_id) 
        LEFT JOIN chado.project p ON (p.project_id = po.project_id) 
        WHERE ts.status LIKE 'Approved' AND po.organism_id = :organism_id;"
        ,[
            ':organism_id' => $organism_id
        ]
    );

    $rows = [];
    foreach ($results_publications as $row) {
        $array = json_decode(json_encode($row), true);
        $rows[] = $array;
    }
    drupal_json_output($rows);
}

function cartogratree_uiapi_get_genomes_by_species_text($species_text) {
    $species_text = strtolower(trim($species_text));
    $species_parts = explode(' ', $species_text);

    // Get organism_id
    $organism_id = NULL;
    $results_organism = chado_query('SELECT * FROM chado.organism WHERE genus ILIKE :genus AND species ILIKE :species', [
        ':genus' => $species_parts[0],
        ':species' => $species_parts[1]
    ]);
    $genus_species = NULL;
    foreach ($results_organism as $row) {
        $organism_id = $row->organism_id;
        $genus_species = $row->genus . '_' . $row->species;
    }

    $four_letter_code_type_id = NULL;
    $results_type_id = chado_query('SELECT * FROM chado.cvterm WHERE name ILIKE :name', [
        ':name' => 'organism 4 letter code'
    ]);
    foreach ($results_type_id as $row) {
        $four_letter_code_type_id = $row->cvterm_id;
    }

    $four_letter_code = NULL;
    $results_four_letter_code = chado_query('SELECT * FROM chado.organismprop WHERE organism_id = :organism_id AND type_id = :type_id',[
        ':organism_id' => $organism_id,
        ':type_id' => $four_letter_code_type_id
    ]);
    foreach ($results_four_letter_code as $row) {
        $four_letter_code = $row->value;
    }

    // Get the table name of the tripal_bundle 'Publication'
    $publication_tripal_bundle_results = chado_query("SELECT * FROM public.tripal_bundle WHERE label = 'Publication' AND type='TripalEntity';", []);
    foreach ($publication_tripal_bundle_results as $row) {
        $publication_bio_data_table_name = 'public.chado_' . $row->name;
    }

    $results = chado_query('SELECT *  
        FROM chado.analysis a
        LEFT JOIN chado.analysis_pub ap ON (ap.analysis_id = a.analysis_id) 
        LEFT JOIN chado.pub p ON (ap.pub_id = p.pub_id) 
        WHERE LOWER(a.name) ILIKE :species_text ORDER BY a.sourceversion ASC;',
        [':species_text' => $species_text . '%']);
    $rows = [];
    $ftp_main_dir = '/isg/treegenes/treegenes_store/FTP/Genomes/';
    $ftp_species_dir =  $four_letter_code;
    if (is_dir($ftp_main_dir . $genus_species)) {
        $ftp_species_dir = $genus_species;
    }
    foreach ($results as $row) {
        $array = json_decode(json_encode($row), true);
        $array['four_letter_code'] = $four_letter_code;
        $array['ftp'] = $ftp_species_dir;

        //$sql_title_link = "SELECT id FROM public.tripal_entity WHERE title ILIKE '%" . $row_plusgenoview->title . "%' LIMIT 1;";
		$sql_title_link = "SELECT entity_id as id FROM $publication_bio_data_table_name WHERE record_id = :pub_id LIMIT 1;";
		//dpm($row_plusgenoview->title);
		$results_title_link = chado_query($sql_title_link, [
            ':pub_id' => $array['pub_id']
        ]);
		$title_link = "";
		foreach($results_title_link as $row_title_link) {
			$title_link = "/Publication/" . $row_title_link->id;
		}
        $array['pub_link'] = $title_link;

        $rows[] = $array;
    }
    drupal_json_output($rows);
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

    $time_start = microtime(true);
    if(file_exists($image_file_path)) {
        // do nothing
        // echo "1";
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
        // echo "2";
    }

    header('Content-type: image/png');
    echo file_get_contents($image_file_path);
    //$time_end = microtime(true);
    //$time_taken = $time_end - $time_start;
    //echo "Time taken: " . $time_taken;
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

function cartogratree_uiapi_get_evome_data($tree_id) {
    $return_results = [];
    $evome_results = chado_query('SELECT * FROM public.ct_trees_data_treesnap WHERE tree_acc = :tree_id', [
        ':tree_id' => $tree_id
    ]);

    foreach ($evome_results as $row) {
        $return_results[] = (array) $row;
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

function cartogratree_uiapi_lookup_coordinate_cleaner_flag($tree_id) {
    $results = chado_query('SELECT * FROM public.coordinate_cleaner_flagged_coordinates WHERE uniquename = :tree_id LIMIT 1', [
        ':tree_id' => $tree_id
    ]);
    $return_results = [];
    foreach ($results as $row) {
        $return_results = (array) $row;
    }
    drupal_json_output($return_results);
}

function cartogratree_uiapi_get_vcf_studies_indexed($tgdr_numbers_csv) {
    $tgdr_numbers = explode(',',$tgdr_numbers_csv);
    // print_r($tgdr_numbers);
    $tgdr_count = count($tgdr_numbers);
    $return_results = [
        'vcf_locations' => []
    ];
    $where_clause = '';
    $study_count = 0;
    foreach($tgdr_numbers as $tgdr_number) {
        // Find per study submission values
        if ($study_count > 0) {
            $where_clause .= ' OR ';
        }
        $where_clause .= "tgdr_accession LIKE '" . $tgdr_number . "'";
        $study_count = $study_count + 1;
    }

    $return_results['study_count'] = $study_count;
    $sql = 'SELECT DISTINCT tgdr_accession, analysis_name, vcf, is_original FROM chado.vcf_locations_view WHERE (' . $where_clause . ') ORDER BY analysis_name DESC';
    // print_r($sql);
    // echo $sql;
    $results_data = chado_query($sql, []);
    $analysis_name = "";
    $found_counter = 0;
    // This goes through the results where the analysis_name is in descending order
    $analysis_indexer = [];
    foreach ($results_data as $row) {
        $analysis_name_tmp = $row->analysis_name;
        $analysis_name_tmp_parts = explode('genome v', $analysis_name_tmp);
        if (empty($analysis_indexer[$row->analysis_name])) {
            $analysis_indexer[$row->analysis_name] = [
                'found_count' => 0,
                'vcf_locations' => []
            ];
        }
        $analysis_indexer[$row->analysis_name]['found_count'] = $analysis_indexer[$row->analysis_name]['found_count'] + 1;
        if (!isset($analysis_indexer[$row->analysis_name]['vcf_locations'][$row->tgdr_accession])) {
            $analysis_indexer[$row->analysis_name]['vcf_locations'][$row->tgdr_accession] = $row->vcf;
        }
        // print_r($row);
        //print_r("\n");
        if ($row->analysis_name != $analysis_name) {
            $analysis_name = $row->analysis_name;
            $found_counter = 1;
            // $return_results['vcf_locations'] = [];
            if (!isset($return_results['vcf_locations'][$row->tgdr_accession])) {
                $return_results['vcf_locations'][$row->tgdr_accession] = $row->vcf;
            }
        }
        else {
            $found_counter = $found_counter + 1;
            if (!isset($return_results['vcf_locations'][$row->tgdr_accession])) {
                $return_results['vcf_locations'][$row->tgdr_accession] = $row->vcf;
            }
        }
        // if ($found_counter == $study_count) {
        //     $return_results['shared_analysis'] = $analysis_name;
        //     $return_results['success'] = true;
        //     break; // exit the for
        // }
    }
    // if (!isset($return_results['success'])) {
    //     $return_results['shared_analysis'] = "";
    //     $return_results['success'] = false;
    // }

    // Go through each analysis indexer and see if all studies were found
    $max_analysis_name = null;
    $max_found_count = 0;
    foreach ($analysis_indexer as $analysis_name_key => $analysis_data) {
        if ($analysis_data['found_count'] > $max_found_count) {
            $max_found_count = $analysis_data['found_count'];
            $max_analysis_name = $analysis_name_key;
            $return_results['vcf_locations'] = $analysis_data['vcf_locations'];
        }
    }
    $return_results['analysis_indexer'] = $analysis_indexer;
    $return_results['success'] = true;
    $return_results['shared_analysis'] = $max_analysis_name;
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
        // $data_all = unserialize($results_row->submission_state);
        // // drupal_json_output($data_all);
        // $data = $data_all['saved_values'];

        // Get submission shared state
        $submission = new Submission($results_row->accession);
        $data_all = $submission->getSharedState();
        $data = $data_all['saved_values'];
    }
    // print_r($data);
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
            // $key eg 'organism-1'
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
                // print_r($fid);
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
            if(isset($value['genotype']['files']['assay-design'])) {
                $fid = $value['genotype']['files']['assay-design'];
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