<?php
/**
 * Plugin Name: Journal Meta Fields
 * Description: Enables journal date fields to work with REST API
 * Version: 1.0
 * Author: MHMA
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom meta fields for journal entries
 * These fields will be available in the REST API
 */
function register_journal_meta_fields() {
    // Register date_published meta field
    register_post_meta('page', 'date_published', [
        'type' => 'string',
        'description' => 'The date when the journal entry was published',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field',
    ]);

    // Register journal_title meta field
    register_post_meta('page', 'journal_title', [
        'type' => 'string',
        'description' => 'Custom title for journal entry',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field',
    ]);

    // Register date_held_on meta field
    register_post_meta('page', 'date_held_on', [
        'type' => 'string',
        'description' => 'The date when the meeting/event was held',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field',
    ]);

    // Register attendees meta field
    register_post_meta('page', 'attendees', [
        'type' => 'string',
        'description' => 'List of meeting attendees',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'sanitize_text_field',
    ]);

    // Register journal_content meta field
    register_post_meta('page', 'journal_content', [
        'type' => 'string',
        'description' => 'Full content of the journal entry',
        'single' => true,
        'show_in_rest' => true,
        'sanitize_callback' => 'wp_kses_post',
    ]);
}

add_action('init', 'register_journal_meta_fields');

/**
 * Add custom fields to REST API responses for pages
 * This ensures the meta fields are included in the _fields parameter
 */
function add_journal_meta_to_rest($response, $post, $request) {
    $meta_fields = ['date_published', 'journal_title', 'date_held_on', 'attendees', 'journal_content'];
    
    foreach ($meta_fields as $field) {
        $value = get_post_meta($post->ID, $field, true);
        if (!empty($value)) {
            $response->data['meta'][$field] = $value;
        }
    }
    
    return $response;
}

add_filter('rest_prepare_page', 'add_journal_meta_to_rest', 10, 3);

/**
 * Ensure ACF fields are also exposed in REST API
 * This complements the ACF to REST API plugin
 */
function expose_acf_fields_in_rest() {
    if (function_exists('acf')) {
        // Ensure ACF fields are shown in REST API
        add_filter('acf/rest_api/field_settings/show_in_rest', '__return_true');
    }
}

add_action('init', 'expose_acf_fields_in_rest');

/**
 * Add custom endpoint for journal entries
 * This provides a cleaner way to fetch journal entries
 */
function register_journal_endpoints() {
    register_rest_route('mhma/v1', '/journal-entries', [
        'methods' => 'GET',
        'callback' => 'get_journal_entries',
        'permission_callback' => '__return_true',
    ]);
}

function get_journal_entries($request) {
    $parent_id = $request->get_param('parent') ?: 199;
    
    $args = [
        'post_type' => 'page',
        'post_parent' => $parent_id,
        'posts_per_page' => 100,
        'post_status' => 'publish',
        'orderby' => 'meta_value',
        'meta_key' => 'date_published',
        'order' => 'DESC',
    ];
    
    $query = new WP_Query($args);
    $entries = [];
    
    foreach ($query->posts as $post) {
        $entry = [
            'id' => $post->ID,
            'title' => [
                'rendered' => get_the_title($post),
            ],
            'slug' => $post->post_name,
            'meta' => [
                'date_published' => get_post_meta($post->ID, 'date_published', true),
                'journal_title' => get_post_meta($post->ID, 'journal_title', true),
                'date_held_on' => get_post_meta($post->ID, 'date_held_on', true),
                'attendees' => get_post_meta($post->ID, 'attendees', true),
                'journal_content' => get_post_meta($post->ID, 'journal_content', true),
            ],
            'acf' => [],
        ];
        
        // Get ACF fields if ACF is active
        if (function_exists('get_fields')) {
            $acf_fields = get_fields($post->ID);
            if ($acf_fields) {
                $entry['acf'] = $acf_fields;
            }
        }
        
        $entries[] = $entry;
    }
    
    return rest_ensure_response($entries);
}

add_action('rest_api_init', 'register_journal_endpoints');
