<?php
/**
 * Plugin Name: MHMA Member Roles
 * Description: Adds custom member roles for MHMA (board_member, existing_member, new_member) with appropriate capabilities.
 * Version: 2.0
 * Author: MHMA
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom member roles
 */
function mhma_register_member_roles() {
    // Existing Member capabilities
    $existing_member_caps = array(
        'read' => true,
        'edit_posts' => false,
        'delete_posts' => false,
        'publish_posts' => false,
        'upload_files' => false,
        'edit_pages' => false,
        'edit_published_posts' => false,
        'delete_published_posts' => false,
        'delete_others_posts' => false,
        'edit_others_posts' => false,
        'manage_categories' => false,
        'moderate_comments' => false,
        'manage_links' => false,
        'edit_theme_options' => false,
        'activate_plugins' => false,
        'edit_plugins' => false,
        'edit_users' => false,
        'create_users' => false,
        'delete_users' => false,
        'install_plugins' => false,
        'install_themes' => false,
        'manage_options' => false,
        'promote_users' => false,
        'publish_pages' => false,
        'edit_published_pages' => false,
        'delete_published_pages' => false,
        'delete_others_pages' => false,
        'edit_others_pages' => false,
        'delete_pages' => false,
        'switch_themes' => false,
        'list_users' => false,
        'remove_users' => false,
        'add_users' => false,
        'customize' => false,
    );
    
    $new_member_caps = $existing_member_caps;
    
    // Remove and re-add roles to ensure clean state
    remove_role('existing_member');
    remove_role('new_member');
    remove_role('board_member');
    
    add_role('existing_member', 'Existing Member', $existing_member_caps);
    add_role('new_member', 'New Member', $new_member_caps);
    
    // Board Member - Administrator capabilities
    if (!get_role('board_member')) {
        $admin_caps = get_role('administrator')->capabilities;
        add_role('board_member', 'Board Member', $admin_caps);
    }
}

/**
 * Plugin activation hook
 */
function mhma_member_roles_activate() {
    mhma_register_member_roles();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'mhma_member_roles_activate');

/**
 * Initialize on admin init
 */
function mhma_member_roles_init() {
    mhma_register_member_roles();
}
add_action('admin_init', 'mhma_member_roles_init');

/**
 * REST API endpoint to check if current user is a board member
 */
function mhma_register_role_check_endpoint() {
    register_rest_route('mhma/v1', '/check-role', array(
        'methods' => 'GET',
        'callback' => 'mhma_check_user_role',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
    ));
}
add_action('rest_api_init', 'mhma_register_role_check_endpoint');

function mhma_check_user_role() {
    $user = wp_get_current_user();
    $roles = $user->roles;
    $is_board_member = in_array('board_member', $roles) || in_array('administrator', $roles);
    
    return new WP_REST_Response(array(
        'success' => true,
        'user_id' => $user->ID,
        'username' => $user->user_login,
        'email' => $user->user_email,
        'roles' => $roles,
        'is_board_member' => $is_board_member,
        'display_name' => $user->display_name,
    ), 200);
}

/**
 * Hook into JWT auth response to include roles
 */
function mhma_add_roles_to_jwt_response($response, $user) {
    if (is_wp_error($response)) {
        return $response;
    }
    
    $user_data = get_userdata($user->ID);
    if ($user_data && !empty($user_data->roles)) {
        $response['data']['user_role'] = $user_data->roles[0];
        $response['data']['roles'] = $user_data->roles;
    }
    
    return $response;
}
add_filter('jwt_auth_token_before_dispatch', 'mhma_add_roles_to_jwt_response', 10, 2);

/**
 * Restrict REST API page creation/editing/deleting to board members only
 */
function mhma_restrict_page_rest_api($result, $request) {
    $route = $request->get_route();
    
    if (strpos($route, '/wp/v2/pages') === false) {
        return $result;
    }
    
    if ($request->get_method() === 'GET') {
        return $result;
    }
    
    $user = wp_get_current_user();
    if (!in_array('board_member', $user->roles) && !in_array('administrator', $user->roles)) {
        return new WP_Error(
            'rest_forbidden',
            'Only board members can create, edit, or delete pages.',
            array('status' => 403)
        );
    }
    
    return $result;
}
add_filter('rest_request_before_callbacks', 'mhma_restrict_page_rest_api', 10, 2);

/**
 * Restrict dashboard access for non-board members
 */
function mhma_restrict_dashboard_access() {
    if (is_admin() && !defined('DOING_AJAX')) {
        $user = wp_get_current_user();
        
        if (in_array('existing_member', $user->roles) || in_array('new_member', $user->roles)) {
            $current_screen = get_current_screen();
            if ($current_screen && $current_screen->id === 'profile') {
                return;
            }
            
            wp_redirect(home_url());
            exit;
        }
    }
}
add_action('admin_init', 'mhma_restrict_dashboard_access', 1);

/**
 * Add admin menu for role management
 */
function mhma_add_roles_menu() {
    add_management_page(
        'MHMA Member Roles',
        'MHMA Roles',
        'manage_options',
        'mhma-member-roles',
        'mhma_roles_page'
    );
}
add_action('admin_menu', 'mhma_add_roles_menu');

/**
 * Render roles management page
 */
function mhma_roles_page() {
    ?>
    <div class="wrap">
        <h1>MHMA Member Roles</h1>
        <p>This plugin manages custom member roles for MHMA:</p>
        <ul>
            <li><strong>Board Member</strong> - Full admin access</li>
            <li><strong>Existing Member</strong> - Can login and view content, NO editing rights</li>
            <li><strong>New Member</strong> - Same as existing member</li>
        </ul>
        <p>Roles are automatically registered. To assign roles, go to <a href="<?php echo admin_url('users.php'); ?>">Users</a> page.</p>
    </div>
    <?php
}

/**
 * Display user role in admin user list
 */
function mhma_display_user_role($column_content, $column, $user_id) {
    if ($column === 'mhma_role') {
        $user = get_user_by('id', $user_id);
        if ($user) {
            $roles = array_map(function($role) {
                $role_labels = array(
                    'administrator' => 'Administrator',
                    'editor' => 'Editor',
                    'author' => 'Author',
                    'contributor' => 'Contributor',
                    'subscriber' => 'Subscriber',
                    'board_member' => 'Board Member',
                    'existing_member' => 'Existing Member',
                    'new_member' => 'New Member',
                );
                return isset($role_labels[$role]) ? $role_labels[$role] : $role;
            }, $user->roles);
            return implode(', ', $roles);
        }
    }
    return $column_content;
}
add_filter('manage_users_custom_column', 'mhma_display_user_role', 10, 3);

/**
 * Add custom column to user list
 */
function mhma_add_user_columns($columns) {
    $columns['mhma_role'] = 'MHMA Role';
    return $columns;
}
add_filter('manage_users_columns', 'mhma_add_user_columns');

/**
 * Show role info on user profile
 */
function mhma_show_role_info($user) {
    ?>
    <h3>MHMA Member Information</h3>
    <table class="form-table">
        <tr>
            <th><label for="mhma_member_role">Member Type</label></th>
            <td>
                <select name="mhma_member_role" id="mhma_member_role">
                    <?php
                    $user_roles = $user->roles;
                    $selected_role = '';
                    foreach ($user_roles as $role) {
                        if (in_array($role, ['existing_member', 'new_member', 'board_member'])) {
                            $selected_role = $role;
                            break;
                        }
                    }
                    ?>
                    <option value="">Select Role</option>
                    <option value="new_member" <?php selected($selected_role, 'new_member'); ?>>New Member</option>
                    <option value="existing_member" <?php selected($selected_role, 'existing_member'); ?>>Existing Member</option>
                    <option value="board_member" <?php selected($selected_role, 'board_member'); ?>>Board Member</option>
                </select>
                <p class="description">Assign MHMA member role to this user.</p>
            </td>
        </tr>
    </table>
    <?php
}
add_action('show_user_profile', 'mhma_show_role_info');
add_action('edit_user_profile', 'mhma_show_role_info');

/**
 * Save custom role from user profile
 */
function mhma_save_user_role($user_id) {
    if (!current_user_can('edit_user', $user_id)) {
        return;
    }
    
    if (isset($_POST['mhma_member_role'])) {
        $new_role = sanitize_text_field($_POST['mhma_member_role']);
        
        if (in_array($new_role, ['existing_member', 'new_member', 'board_member'])) {
            $user = new WP_User($user_id);
            $user->remove_role('existing_member');
            $user->remove_role('new_member');
            $user->remove_role('board_member');
            
            $user->add_role($new_role);
        }
    }
}
add_action('personal_options_update', 'mhma_save_user_role');
add_action('edit_user_profile_update', 'mhma_save_user_role');

/**
 * Expose ACF user meta fields in REST API
 */
function mhma_register_user_meta_fields() {
    $meta_fields = array(
        'phone' => 'string',
        'address' => 'string',
        'emergency_contact_name' => 'string',
        'emergency_contact_phone' => 'string',
        'membership_date' => 'string',
        'family_size' => 'integer',
        'profile_pic' => 'integer',
    );

    foreach ($meta_fields as $field => $type) {
        register_rest_field('user', $field, array(
            'get_callback' => function($user) use ($field) {
                $value = get_user_meta($user['id'], $field, true);
                if ($field === 'profile_pic' && $value) {
                    $img = wp_get_attachment_image_src($value, 'medium');
                    return $img ? $img[0] : null;
                }
                return $value ?: null;
            },
            'update_callback' => function($value, $user) use ($field) {
                if ($field === 'profile_pic') {
                    if (is_numeric($value)) {
                        update_user_meta($user->ID, $field, intval($value));
                    }
                } else {
                    update_user_meta($user->ID, $field, sanitize_text_field($value));
                }
            },
            'schema' => array(
                'description' => ucfirst(str_replace('_', ' ', $field)),
                'type' => $type,
                'context' => array('view', 'edit'),
            ),
        ));
    }
}
add_action('rest_api_init', 'mhma_register_user_meta_fields');

/**
 * Custom endpoint to update user profile (first_name, last_name, and meta fields)
 */
function mhma_register_profile_update_endpoint() {
    register_rest_route('mhma/v1', '/update-profile', array(
        'methods' => 'POST',
        'callback' => 'mhma_update_user_profile',
        'permission_callback' => function() {
            return is_user_logged_in();
        },
    ));
}
add_action('rest_api_init', 'mhma_register_profile_update_endpoint');

function mhma_update_user_profile($request) {
    $user_id = get_current_user_id();
    $params = $request->get_json_params();

    if (isset($params['first_name'])) {
        wp_update_user(array('ID' => $user_id, 'first_name' => sanitize_text_field($params['first_name'])));
    }
    if (isset($params['last_name'])) {
        wp_update_user(array('ID' => $user_id, 'last_name' => sanitize_text_field($params['last_name'])));
    }

    $meta_fields = array('phone', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'membership_date', 'family_size');
    foreach ($meta_fields as $field) {
        if (isset($params[$field])) {
            update_user_meta($user_id, $field, sanitize_text_field($params[$field]));
        }
    }

    if (isset($params['profile_pic_id']) && is_numeric($params['profile_pic_id'])) {
        update_user_meta($user_id, 'profile_pic', intval($params['profile_pic_id']));
    }

    $updated_user = get_userdata($user_id);
    return new WP_REST_Response(array(
        'success' => true,
        'user' => array(
            'id' => $updated_user->ID,
            'first_name' => $updated_user->first_name,
            'last_name' => $updated_user->last_name,
            'email' => $updated_user->user_email,
            'username' => $updated_user->user_login,
            'phone' => get_user_meta($user_id, 'phone', true),
            'address' => get_user_meta($user_id, 'address', true),
            'emergency_contact_name' => get_user_meta($user_id, 'emergency_contact_name', true),
            'emergency_contact_phone' => get_user_meta($user_id, 'emergency_contact_phone', true),
            'membership_date' => get_user_meta($user_id, 'membership_date', true),
            'family_size' => get_user_meta($user_id, 'family_size', true),
            'profile_pic' => get_user_meta($user_id, 'profile_pic', true),
        ),
    ), 200);
}

/**
 * Register Contact Submission custom post type
 */
function mhma_register_contact_submission_cpt() {
    register_post_type('contact_submission', array(
        'labels' => array(
            'name' => 'Contact Submissions',
            'singular_name' => 'Contact Submission',
            'add_new' => 'Add New',
            'add_new_item' => 'Add New Contact Submission',
            'edit_item' => 'Edit Contact Submission',
            'new_item' => 'New Contact Submission',
            'view_item' => 'View Contact Submission',
            'search_items' => 'Search Contact Submissions',
            'not_found' => 'No contact submissions found',
            'not_found_in_trash' => 'No contact submissions found in Trash',
        ),
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => true,
        'show_in_rest' => true,
        'rest_base' => 'contact_submission',
        'menu_icon' => 'dashicons-email-alt',
        'supports' => array('title', 'editor', 'custom-fields'),
        'capability_type' => 'post',
        'capabilities' => array(
            'create_posts' => 'do_not_allow',
        ),
        'map_meta_cap' => false,
    ));
}
add_action('init', 'mhma_register_contact_submission_cpt');

/**
 * REST endpoint to receive contact form submissions
 */
function mhma_register_contact_endpoint() {
    register_rest_route('mhma/v1', '/contact', array(
        'methods' => 'POST',
        'callback' => 'mhma_handle_contact_submission',
        'permission_callback' => '__return_true',
    ));
}
add_action('rest_api_init', 'mhma_register_contact_endpoint');

function mhma_handle_contact_submission($request) {
    $name = sanitize_text_field($request->get_param('name'));
    $email = sanitize_email($request->get_param('email'));
    $subject = sanitize_text_field($request->get_param('subject'));
    $message = sanitize_textarea_field($request->get_param('message'));

    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        return new WP_Error('missing_fields', 'All fields are required.', array('status' => 400));
    }

    $post_id = wp_insert_post(array(
        'post_title' => "$subject - $name",
        'post_content' => "Name: $name\nEmail: $email\nSubject: $subject\n\nMessage:\n$message",
        'post_status' => 'private',
        'post_type' => 'contact_submission',
        'meta_input' => array(
            'contact_name' => $name,
            'contact_email' => $email,
            'contact_subject' => $subject,
        ),
    ));

    if (is_wp_error($post_id)) {
        return $post_id;
    }

    $admin_email = get_option('admin_email');
    $email_subject = "New Contact Form Submission: $subject";
    $email_message = "A new contact form submission has been received:\n\n";
    $email_message .= "Name: $name\n";
    $email_message .= "Email: $email\n";
    $email_message .= "Subject: $subject\n\n";
    $email_message .= "Message:\n$message\n\n";
    $email_message .= "View in admin: " . admin_url("post.php?post=$post_id&action=edit");
    wp_mail($admin_email, $email_subject, $email_message);

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Your message has been sent successfully.',
        'submission_id' => $post_id,
    ), 200);
}

/**
 * Expose contact_submission meta fields in REST API
 */
function mhma_register_contact_meta_fields() {
    $meta_fields = array('contact_name', 'contact_email', 'contact_subject');
    foreach ($meta_fields as $field) {
        register_rest_field('contact_submission', $field, array(
            'get_callback' => function($post) use ($field) {
                return get_post_meta($post['id'], $field, true) ?: '';
            },
            'schema' => array(
                'description' => ucfirst(str_replace('_', ' ', $field)),
                'type' => 'string',
                'context' => array('view', 'edit'),
            ),
        ));
    }
}
add_action('rest_api_init', 'mhma_register_contact_meta_fields');
