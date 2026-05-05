<?php
/**
 * Plugin Name: MHMA Member Roles
 * Description: Creates custom member roles (New Member and Existing Member) with limited dashboard access
 * Version: 1.0.0
 * Author: MHMA
 * Requires at least: 5.0
 * Requires PHP: 7.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Create custom member roles on plugin activation
 */
function mhma_create_member_roles() {
    // Define capabilities for new members (very limited access)
    $new_member_caps = array(
        'read' => true,                          // Can read/view content
        'edit_posts' => false,                   // Cannot create/edit posts
        'delete_posts' => false,                   // Cannot delete posts
        'upload_files' => false,                   // Cannot upload files
        'edit_dashboard' => false,               // Cannot access dashboard editing
    );

    // Define capabilities for existing members (read-only dashboard access)
    $existing_member_caps = array(
        'read' => true,                          // Can read/view content
        'edit_posts' => false,                   // Cannot create/edit posts
        'delete_posts' => false,                   // Cannot delete posts
        'upload_files' => false,                   // Cannot upload files
        'edit_dashboard' => false,               // Cannot access dashboard editing
    );

    // Remove roles if they exist (to ensure clean setup)
    remove_role('new_member');
    remove_role('existing_member');

    // Add New Member role
    add_role(
        'new_member',
        'New Member',
        $new_member_caps
    );

    // Add Existing Member role
    add_role(
        'existing_member',
        'Existing Member',
        $existing_member_caps
    );
}
register_activation_hook(__FILE__, 'mhma_create_member_roles');

/**
 * Remove roles on plugin deactivation
 */
function mhma_remove_member_roles() {
    remove_role('new_member');
    remove_role('existing_member');
}
register_deactivation_hook(__FILE__, 'mhma_remove_member_roles');

/**
 * Redirect non-admin users away from wp-admin
 * Board members (administrator, editor) can access dashboard
 * Members get redirected to frontend
 */
function mhma_restrict_admin_access() {
    // Check if we're in the admin area
    if (is_admin() && !wp_doing_ajax()) {
        $user = wp_get_current_user();

        // If user is not logged in, let WordPress handle login redirect
        if (!$user->exists()) {
            return;
        }

        $user_roles = $user->roles;

        // Define roles that CAN access wp-admin (board members)
        $allowed_roles = array('administrator', 'editor', 'board_member');

        // Check if user has any allowed role
        $can_access_admin = false;
        foreach ($user_roles as $role) {
            if (in_array($role, $allowed_roles)) {
                $can_access_admin = true;
                break;
            }
        }

        // Redirect members to frontend if trying to access wp-admin
        if (!$can_access_admin) {
            // Redirect to the frontend dashboard or home page
            $redirect_url = home_url('/dashboard');
            wp_redirect($redirect_url);
            exit;
        }
    }
}
add_action('init', 'mhma_restrict_admin_access');

/**
 * Hide admin bar for non-board-member roles
 */
function mhma_hide_admin_bar() {
    $user = wp_get_current_user();

    if (!$user->exists()) {
        return;
    }

    $user_roles = $user->roles;
    $allowed_roles = array('administrator', 'editor', 'board_member');

    $can_see_admin_bar = false;
    foreach ($user_roles as $role) {
        if (in_array($role, $allowed_roles)) {
            $can_see_admin_bar = true;
            break;
        }
    }

    if (!$can_see_admin_bar) {
        add_filter('show_admin_bar', '__return_false');
    }
}
add_action('after_setup_theme', 'mhma_hide_admin_bar');

/**
 * Custom REST API endpoint to check user role
 */
function mhma_register_role_endpoint() {
    register_rest_route('mhma/v1', '/user-role', array(
        'methods' => 'GET',
        'callback' => 'mhma_get_user_role',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
}
add_action('rest_api_init', 'mhma_register_role_endpoint');

/**
 * Return current user's role and capabilities
 */
function mhma_get_user_role() {
    $user = wp_get_current_user();

    return array(
        'roles' => $user->roles,
        'capabilities' => $user->allcaps,
        'is_board_member' => array_intersect($user->roles, array('administrator', 'editor', 'board_member')) ? true : false,
        'is_member' => array_intersect($user->roles, array('new_member', 'existing_member')) ? true : false,
    );
}

/**
 * Add user role to JWT response
 */
function mhma_add_role_to_jwt($response, $user) {
    $user_data = get_userdata($user->ID);

    $response['user_roles'] = $user_data->roles;
    $response['is_board_member'] = array_intersect($user_data->roles, array('administrator', 'editor', 'board_member')) ? true : false;
    $response['is_member'] = array_intersect($user_data->roles, array('new_member', 'existing_member')) ? true : false;

    return $response;
}
add_filter('jwt_auth_token_before_dispatch', 'mhma_add_role_to_jwt', 10, 2);

/**
 * Create test users on plugin activation (only for development)
 * Uncomment this section when you want to create test users
 */
/*
function mhma_create_test_users() {
    // Create test new member
    $new_member_id = username_exists('testnewmember');
    if (!$new_member_id) {
        $new_member_id = wp_create_user('testnewmember', 'TestPass123!', 'testnewmember@example.com');
        if (!is_wp_error($new_member_id)) {
            $user = new WP_User($new_member_id);
            $user->set_role('new_member');
            update_user_meta($new_member_id, 'first_name', 'Test');
            update_user_meta($new_member_id, 'last_name', 'New Member');
        }
    }

    // Create test existing member
    $existing_member_id = username_exists('testexistingmember');
    if (!$existing_member_id) {
        $existing_member_id = wp_create_user('testexistingmember', 'TestPass123!', 'testexistingmember@example.com');
        if (!is_wp_error($existing_member_id)) {
            $user = new WP_User($existing_member_id);
            $user->set_role('existing_member');
            update_user_meta($existing_member_id, 'first_name', 'Test');
            update_user_meta($existing_member_id, 'last_name', 'Existing Member');
        }
    }

    // Create test board member
    $board_member_id = username_exists('testboardmember');
    if (!$board_member_id) {
        $board_member_id = wp_create_user('testboardmember', 'TestPass123!', 'testboardmember@example.com');
        if (!is_wp_error($board_member_id)) {
            $user = new WP_User($board_member_id);
            $user->set_role('administrator');
            update_user_meta($board_member_id, 'first_name', 'Test');
            update_user_meta($board_member_id, 'last_name', 'Board Member');
        }
    }
}
// Uncomment the line below to create test users on activation
// add_action('init', 'mhma_create_test_users');
*/

/**
 * Add admin notice for test user creation
 */
function mhma_admin_notice() {
    if (isset($_GET['page']) && $_GET['page'] === 'mhma-member-roles') {
        return;
    }

    // Check if test users exist
    $new_member_exists = username_exists('testnewmember');
    $existing_member_exists = username_exists('testexistingmember');
    $board_member_exists = username_exists('testboardmember');

    if (!$new_member_exists || !$existing_member_exists || !$board_member_exists) {
        ?>
        <div class="notice notice-info">
            <p>
                <strong>MHMA Member Roles:</strong> Test users not created yet.
                <a href="<?php echo admin_url('users.php?page=mhma-create-test-users'); ?>">Click here to create test users</a>
            </p>
        </div>
        <?php
    }
}
add_action('admin_notices', 'mhma_admin_notice');

/**
 * Add admin page for creating test users
 */
function mhma_add_test_users_page() {
    add_submenu_page(
        'users.php',
        'Create Test Users',
        'Create Test Users',
        'manage_options',
        'mhma-create-test-users',
        'mhma_create_test_users_page'
    );
}
add_action('admin_menu', 'mhma_add_test_users_page');

/**
 * Admin page content for creating test users
 */
function mhma_create_test_users_page() {
    $message = '';

    if (isset($_POST['create_test_users'])) {
        check_admin_referer('mhma_create_test_users');

        // Create test new member
        $new_member_id = username_exists('testnewmember');
        if (!$new_member_id) {
            $new_member_id = wp_create_user('testnewmember', 'TestPass123!', 'testnewmember@example.com');
            if (!is_wp_error($new_member_id)) {
                $user = new WP_User($new_member_id);
                $user->set_role('new_member');
                update_user_meta($new_member_id, 'first_name', 'Test');
                update_user_meta($new_member_id, 'last_name', 'New Member');
            }
        }

        // Create test existing member
        $existing_member_id = username_exists('testexistingmember');
        if (!$existing_member_id) {
            $existing_member_id = wp_create_user('testexistingmember', 'TestPass123!', 'testexistingmember@example.com');
            if (!is_wp_error($existing_member_id)) {
                $user = new WP_User($existing_member_id);
                $user->set_role('existing_member');
                update_user_meta($existing_member_id, 'first_name', 'Test');
                update_user_meta($existing_member_id, 'last_name', 'Existing Member');
            }
        }

        // Create test board member
        $board_member_id = username_exists('testboardmember');
        if (!$board_member_id) {
            $board_member_id = wp_create_user('testboardmember', 'TestPass123!', 'testboardmember@example.com');
            if (!is_wp_error($board_member_id)) {
                $user = new WP_User($board_member_id);
                $user->set_role('administrator');
                update_user_meta($board_member_id, 'first_name', 'Test');
                update_user_meta($board_member_id, 'last_name', 'Board Member');
            }
        }

        $message = 'Test users created successfully!';
    }

    ?>
    <div class="wrap">
        <h1>Create Test Users for MHMA</h1>

        <?php if ($message): ?>
        <div class="notice notice-success">
            <p><?php echo esc_html($message); ?></p>
        </div>
        <?php endif; ?>

        <div class="card">
            <h2>Test User Accounts</h2>
            <p>The following test users will be created:</p>
            <table class="widefat" style="max-width: 800px;">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Role</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>testnewmember</td>
                        <td>TestPass123!</td>
                        <td>New Member</td>
                        <td><?php echo username_exists('testnewmember') ? '<span style="color: green;">✓ Exists</span>' : '<span style="color: orange;">Not Created</span>'; ?></td>
                    </tr>
                    <tr>
                        <td>testexistingmember</td>
                        <td>TestPass123!</td>
                        <td>Existing Member</td>
                        <td><?php echo username_exists('testexistingmember') ? '<span style="color: green;">✓ Exists</span>' : '<span style="color: orange;">Not Created</span>'; ?></td>
                    </tr>
                    <tr>
                        <td>testboardmember</td>
                        <td>TestPass123!</td>
                        <td>Board Member (Admin)</td>
                        <td><?php echo username_exists('testboardmember') ? '<span style="color: green;">✓ Exists</span>' : '<span style="color: orange;">Not Created</span>'; ?></td>
                    </tr>
                </table>

            <form method="post">
                <?php wp_nonce_field('mhma_create_test_users'); ?>
                <p>
                    <input type="submit" name="create_test_users" class="button button-primary" value="Create Test Users" <?php echo (username_exists('testnewmember') && username_exists('testexistingmember') && username_exists('testboardmember')) ? 'disabled' : ''; ?>>
                </p>
            </form>

            <?php if (username_exists('testnewmember') && username_exists('testexistingmember') && username_exists('testboardmember')): ?>
            <p style="color: green;"><strong>✓ All test users have been created successfully!</strong></p>
            <p>You can now use these credentials to test the login and registration functionality on the frontend.</p>
            <?php endif; ?>
        </div>

        <div class="card" style="margin-top: 20px;">
            <h2>Role Capabilities</h2>
            <ul>
                <li><strong>New Member:</strong> Can login, view content, NO dashboard editing access</li>
                <li><strong>Existing Member:</strong> Can login, view content, NO dashboard editing access</li>
                <li><strong>Board Member:</strong> Full wp-admin access for content management</li>
            </ul>
        </div>
    </div>
    <?php
}
