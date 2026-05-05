<?php
/**
 * Plugin Name: MHMA Custom Registration
 * Description: Custom registration endpoint for MHMA website
 * Version: 1.0
 * Author: MHMA
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Add custom REST API endpoint for registration
add_action('rest_api_init', function () {
    register_rest_route('mhma/v1', '/register', [
        'methods' => 'POST',
        'callback' => 'mhma_handle_registration',
        'permission_callback' => '__return_true',
    ]);
});

function mhma_handle_registration($request) {
    $username = sanitize_text_field($request->get_param('username'));
    $email = sanitize_email($request->get_param('email'));
    $first_name = sanitize_text_field($request->get_param('first_name'));
    $last_name = sanitize_text_field($request->get_param('last_name'));
    $password = $request->get_param('password');
    $phone = sanitize_text_field($request->get_param('phone'));

    // Validate required fields
    if (empty($username) || empty($email) || empty($password)) {
        return new WP_Error('missing_fields', 'Username, email, and password are required', ['status' => 400]);
    }

    // Check if username exists
    if (username_exists($username)) {
        return new WP_Error('username_exists', 'Username already exists', ['status' => 400]);
    }

    // Check if email exists
    if (email_exists($email)) {
        return new WP_Error('email_exists', 'Email already registered', ['status' => 400]);
    }

    // Create user with new_member role
    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    // Update user meta
    update_user_meta($user_id, 'first_name', $first_name);
    update_user_meta($user_id, 'last_name', $last_name);
    update_user_meta($user_id, 'phone', $phone);

    // Assign new_member role
    $user = new WP_User($user_id);
    $user->set_role('new_member');

    // Send notification to admin
    $admin_email = get_option('admin_email');
    $subject = 'New Member Registration: ' . $first_name . ' ' . $last_name;
    $message = "A new member has registered:\n\n";
    $message .= "Name: $first_name $last_name\n";
    $message .= "Email: $email\n";
    $message .= "Phone: $phone\n";
    $message .= "Username: $username\n\n";
    $message .= "Please review and approve their account in the WordPress admin panel.";

    wp_mail($admin_email, $subject, $message);

    return new WP_REST_Response([
        'success' => true,
        'message' => 'Registration submitted successfully. Your account is pending approval.',
        'user_id' => $user_id
    ], 200);
}
