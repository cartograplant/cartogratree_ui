<?php

function cartogratree_uipages_species_page($species_text) {
  // $species_text = strtolower(trim($species_text));
  // $species_parts = explode(' ', $species_text);
  // $results = chado_query('SELECT * FROM chado.organism WHERE genus ILIKE :genus AND species ILIKE :species', [
  //     ':genus' => $species_parts[0],
  //     'species' => $species_parts[1]
  // ]);
  // $organism_id = NULL;
  // foreach ($results as $row) {
  //     $organism_id = $row->organism_id;
  // }
  // if ($organism_id == NULL) {
  //     drupal_not_found();
  //     return;
  // }
  //   // Set headers if needed
  // drupal_add_http_header('Content-Type', 'text/html; charset=utf-8');
  // drupal_set_title(ucfirst($species_parts[0]) . ' ' . ucfirst($species_parts[1]));

  // return theme('cartogratree_species_page', ['organism_id' => $organism_id]);
  
  // Print HTML
  echo '<!DOCTYPE html><html><body><h1>Minimal HTML</h1></body></html>';
  
  // Stops Drupal processing safely
  drupal_exit(); 

}

?>