const WP_API_URL = 'http://mhma-update.local/wp-json';
const USERNAME = 'SWE';
const PASSWORD = 'test';

// Create Basic Auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function createACFFieldGroup() {
  try {
    // Create ACF field group for Event Scheduling Request
    const fieldGroupData = {
      title: 'Event Scheduling Request',
      key: 'group_event_scheduling_request',
      fields: [
        {
          key: 'field_organizer_first_name',
          label: 'First Name',
          name: 'organizer_first_name',
          type: 'text',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_organizer_last_name',
          label: 'Last Name',
          name: 'organizer_last_name',
          type: 'text',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_organizer_email',
          label: 'Email',
          name: 'organizer_email',
          type: 'email',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_organizer_phone',
          label: 'Phone',
          name: 'organizer_phone',
          type: 'text',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_event_title',
          label: 'Event Title',
          name: 'event_title',
          type: 'text',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_event_category',
          label: 'Event Category',
          name: 'event_category',
          type: 'select',
          required: 1,
          choices: {
            religious: 'Religious',
            social: 'Social',
            educational: 'Educational',
            fundraising: 'Fundraising',
            community: 'Community',
            youth: 'Youth',
            other: 'Other'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_event_description',
          label: 'Event Description',
          name: 'event_description',
          type: 'textarea',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_event_start',
          label: 'Start',
          name: 'event_start',
          type: 'date_time_picker',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_event_end',
          label: 'End',
          name: 'event_end',
          type: 'date_time_picker',
          required: 1,
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_has_host_speaker',
          label: 'Will there be a host or guest speaker?',
          name: 'has_host_speaker',
          type: 'radio',
          choices: {
            yes: 'Yes',
            no: 'No'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_has_food',
          label: 'Will food be served?',
          name: 'has_food',
          type: 'radio',
          choices: {
            yes: 'Yes',
            no: 'No'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_food_service',
          label: 'Food Service',
          name: 'food_service',
          type: 'checkbox',
          choices: {
            self_serve: 'Self-serve',
            catered: 'Catered',
            potluck: 'Potluck',
            other: 'Other'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_location',
          label: 'Location',
          name: 'location',
          type: 'text',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_facility',
          label: 'Facility',
          name: 'facility',
          type: 'select',
          choices: {
            unity_center: 'Unity Center',
            masjid: 'Masjid',
            outdoor: 'Outdoor',
            other: 'Other'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_round_tables',
          label: 'Round Tables',
          name: 'round_tables',
          type: 'number',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_rectangular_tables',
          label: 'Rectangular Tables',
          name: 'rectangular_tables',
          type: 'number',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_chairs',
          label: 'Chairs',
          name: 'chairs',
          type: 'number',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_equipment',
          label: 'Equipment',
          name: 'equipment',
          type: 'checkbox',
          choices: {
            projector: 'Projector',
            microphone: 'Microphone',
            speakers: 'Speakers',
            tables: 'Tables',
            chairs: 'Chairs',
            other: 'Other'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_volunteers',
          label: 'Volunteers',
          name: 'volunteers',
          type: 'number',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_helpers',
          label: 'Helpers',
          name: 'helpers',
          type: 'number',
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_rsvp_required',
          label: 'RSVP Required',
          name: 'rsvp_required',
          type: 'radio',
          choices: {
            yes: 'Yes',
            no: 'No'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_payment_required',
          label: 'Payment Collection Required',
          name: 'payment_required',
          type: 'radio',
          choices: {
            yes: 'Yes',
            no: 'No'
          },
          parent: 'group_event_scheduling_request'
        },
        {
          key: 'field_comments',
          label: 'Comments',
          name: 'comments',
          type: 'textarea',
          parent: 'group_event_scheduling_request'
        }
      ],
      location: [
        {
          param: 'post_type',
          operator: '==',
          value: 'page'
        },
        {
          param: 'page_template',
          operator: '==',
          value: 'default'
        }
      ],
      menu_order: 0,
      position: 'normal',
      style: 'default',
      label_placement: 'top',
      instruction_placement: 'label',
      hide_on_screen: [],
      active: true,
      description: ''
    };

    // Create the field group using ACF REST API
    const response = await fetch(`${WP_API_URL}/acf/v3/field-groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(fieldGroupData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create field group: ${error}`);
    }

    const result = await response.json();
    console.log('✅ ACF Field Group created successfully!');
    console.log('Field Group Key:', result.key);
    console.log('Field Group ID:', result.id);

    return result;
  } catch (error) {
    console.error('❌ Error creating ACF field group:', error.message);
    throw error;
  }
}

async function createEventSchedulingPage() {
  try {
    // Create the Event Scheduling Request page
    const pageData = {
      title: 'Event Scheduling Request',
      content: '',
      status: 'publish',
      slug: 'event-scheduling-request',
      parent: 0
    };

    const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create page: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Event Scheduling Request page created successfully!');
    console.log('Page ID:', result.id);
    console.log('Page Slug:', result.slug);

    return result;
  } catch (error) {
    console.error('❌ Error creating page:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting page creation...\n');

  try {
    // Create the page first
    const page = await createEventSchedulingPage();
    console.log();

    console.log('✨ Page created successfully!');
    console.log('Note: ACF field group creation requires ACF PRO plugin.');
    console.log('You will need to create the ACF fields manually in WordPress admin.');
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

main();
