<?php

function cartogratree_test_create_grid() {
    // create_filter_grid('#analysis-overlapping-genotypes-snp-grid-filter', snps_grid_array); // JS
    drupal_add_js('https://d3js.org/d3.v5.min.js', 'external');
    drupal_add_js(drupal_get_path('module', 'cartogratree') . '/js/overlap_grid.js');
    drupal_add_css(drupal_get_path('module', 'cartogratree') . '/styling/overlap_grid.css');
    drupal_add_js(drupal_get_path('module', 'cartogratree') . '/js/venn/venn.min.js');
    drupal_add_js('
        jQuery(document).ready(function() {
            var data = [{"study_name":"TGDR480","overlap_all":8536,"overlap_some":0,"overlap_none":393},{"study_name":"TGDR484","overlap_all":8536,"overlap_some":0,"overlap_none":865}];
            create_filter_grid("#analysis-overlapping-genotypes-snp-grid-filter", data);
            jQuery("#test_genotypes_snp_overlap_by_studies_views_algorithm").click(function () {
                console.log("Clicked");
                var study_ids = [];
                study_ids.push("TGDR408");
                study_ids.push("TGDR480");
                study_ids.push("TGDR484");
                console.log("study_ids", study_ids);
                console.log("study_ids JSON stringified: ", JSON.stringify(study_ids));
                jQuery.ajax({
                    method: "POST",
                    url: "/cartogratree/api/v2/genotypes/snps_overlaps_by_studies_views",
                    data: {
                        "data": "this is test data as well",
                        "study_ids": JSON.stringify(study_ids)
                    },
                    success: function (data) {
                        console.log(data);
                    }
                });
            });

            jQuery("#test_genotypes_snp_overlap_by_studies_views_venn_algorithm").click(function () {
                console.log("Clicked");
                var study_ids = [];
                study_ids.push("TGDR408");
                study_ids.push("TGDR480");
                study_ids.push("TGDR484");
                console.log("study_ids", study_ids);
                console.log("study_ids JSON stringified: ", JSON.stringify(study_ids));
                jQuery.ajax({
                    method: "POST",
                    url: "/cartogratree/api/v2/genotypes/snps_overlaps_by_studies_views_venn_format",
                    data: {
                        "data": "this is test data as well",
                        "study_ids": JSON.stringify(study_ids)
                    },
                    success: function (data) {
                        console.log(data);
                        try {
                            var data = JSON.parse(data);
                            var sets = data["venn_array"];
                            sets.map(function(set) {
                                set.size = Math.sqrt(set.size);
                                return set;
                            });
                            var chart = venn.VennDiagram()
                            d3.select("#analysis-overlapping-genotypes-snp-venn").datum(sets).call(chart);
                        } catch (err) { console.log(err) }                        
                    }
                });
            });            


        });
        
    ', "inline");
    $html = "<div id='analysis-overlapping-genotypes-snp-grid-filter'></div>";
    $html .= "<button id='test_genotypes_snp_overlap_by_studies_views_algorithm'>Test SNP overlap by study views algorithm</button>";
    $html .= "<div id='analysis-overlapping-genotypes-snp-venn'></div>";
    $html .= "<button id='test_genotypes_snp_overlap_by_studies_views_venn_algorithm'>Test SNP overlap by study views VENN algorithm</button>";    
    $html .= "<div id='venn'></div>";
    return $html;
}

?>