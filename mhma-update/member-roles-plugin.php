<?php
/**
 * Plugin Name: MHMA Member Roles
 * Description: Adds custom member roles for MHMA (existing_member, new_member) with appropriate capabilities.
 * Version: 1.0
 * Author: MHMA
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register custom member roles on plugin activation
 */
function mhma_register_member_roles() {
    // Define capabilities for each role
    
    // Board Member - Full access (keep existing)
    // This is the administrator-level role for board members
    
    // Existing Member - Can login, view content, edit own profile only
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
    
    // New Member - Same as existing member (will be upgraded later)
    // Can login, view content, edit own profile only
    $new_member_caps = $existing_member_caps;
    
    // Remove and re-add roles to ensure clean state
    remove_role('existing_member');
    remove_role('new_member');
    
    add_role('existing_member', 'Existing Member', $existing_member_caps);
    add_role('new_member', 'New Member', $new_member_caps);
}

/**
 * Plugin activation hook
 */
function mhma_member_roles_activate() {
    mhma_register_member_roles();
    
    // Also ensure board_member role exists if needed
    if (!get_role('board_member')) {
        $board_caps = get_role('administrator')->capabilities;
        add_role('board_member', 'Board Member', $board_caps);
    }
}
register_activation_hook(__FILE__, 'mhma_member_roles_activate');

/**
 * Initialize on admin init
 */
function mhma_member_roles_init() {
    // Re-register on init to ensure roles exist
    mhma_register_member_roles();
}
add_action('admin_init', 'mhma_member_roles_init');

/**
 * Restrict dashboard access for non-board members
 */
function mhma_restrict_dashboard_access() {
    if (is_admin() && !defined('DOING_AJAX')) {
        $user = wp_get_current_user();
        
        if (in_array('existing_member', $user->roles) || in_array('new_member', $user->roles)) {
            // Allow profile page only
            $current_screen = get_current_screen();
            if ($current_screen && $current_screen->id === 'profile') {
                return;
            }
            
            // Redirect to homepage for other admin pages
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
            <li><strong>Board Member</strong> - Full admin access (keep as-is from WP)</li>
            <li><strong>Existing Member</strong> - Can login and view content, NO editing rights</li>
            <li><strong>New Member</strong> - Same as existing member (upgrade path available)</li>
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
            // Remove old MHMA roles
            $user = new WP_User($user_id);
            $user->remove_role('existing_member');
            $user->remove_role('new_member');
            $user->remove_role('board_member');
            
            // Add new role
            $user->add_role($new_role);
        }
    }
}
add_action('personal_options_update', 'mhma_save_user_role');
add_action('edit_user_profile_update', 'mhma_save_user_role');
