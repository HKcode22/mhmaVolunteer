<?php
/**
 * Plugin Name: Enable ACF REST API for Journal Fields
 * Description: Enables ACF fields to be readable and writable via REST API for journal entries
 * Version: 1.0
 */

// Enable ACF fields in REST API for all post types
add_filter('acf/rest_api/item_permissions/get', function($permission, $request, $type) {
    return true;
}, 10, 3);

add_filter('acf/rest_api/item_permissions/update', function($permission, $request, $type) {
    return true;
}, 10, 3);

// Alternative: Use WordPress native meta fields for better REST API support
add_action('rest_api_init', function() {
    // Register meta fields for journal entries
    $meta_fields = [
        'journal_title',
        'date_published', 
        'date_held_on',
        'attendees',
        'journal_content'
    ];
    
    foreach ($meta_fields as $field) {
        register_post_meta('page', $field, [
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() {
                return current_user_can('edit_posts');
            }
        ]);
    }
});

// Sync ACF fields to meta fields when saving
add_action('acf/save_post', function($post_id) {
    if (get_post_parent($post_id) == 199) { // Journal parent page
        $fields = [
            'journal_title' => 'journal_title',
            'date_published' => 'date_published',
            'date_held_on' => 'date_held_on',
            'attendees' => 'attendees',
            'content' => 'journal_content'
        ];
        
        foreach ($fields as $acf_field => $meta_key) {
            $value = get_field($acf_field, $post_id);
            if ($value) {
                update_post_meta($post_id, $meta_key, $value);
            }
        }
    }
});

// Also sync when creating via REST API
add_action('rest_after_insert_page', function($post, $request, $creating) {
    if ($post->post_parent == 199) { // Journal parent page
        $params = $request->get_json_params();
        
        if (isset($params['acf'])) {
            $acf_data = $params['acf'];
            
            // Save to meta fields for REST API accessibility
            if (isset($acf_data['journal_title'])) {
                update_post_meta($post->ID, 'journal_title', $acf_data['journal_title']);
            }
            if (isset($acf_data['date_published'])) {
                update_post_meta($post->ID, 'date_published', $acf_data['date_published']);
            }
            if (isset($acf_data['date_held_on'])) {
                update_post_meta($post->ID, 'date_held_on', $acf_data['date_held_on']);
            }
            if (isset($acf_data['attendees'])) {
                update_post_meta($post->ID, 'attendees', $acf_data['attendees']);
            }
            if (isset($acf_data['content'])) {
                update_post_meta($post->ID, 'journal_content', $acf_data['content']);
            }
        }
    }
}, 10, 3);
