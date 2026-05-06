<?php
/**
 * Plugin Name: Journal Meta Fields
 * Description: Enables journal date fields to work with REST API
 * Version: 1.0
 */

// Register meta fields so they work with REST API
add_action('init', function() {
    // Allow journal fields to be accessed via REST API
    register_meta('post', 'date_published', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('post', 'date_held_on', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('post', 'journal_title', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
    
    register_meta('post', 'attendees', [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
    ]);
});
