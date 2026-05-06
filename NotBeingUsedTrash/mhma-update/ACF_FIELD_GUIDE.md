# ACF Field Creation Guide for Event Scheduling Request

Since automated creation is not possible with free ACF and the current setup, follow these manual steps to create the ACF fields in WordPress admin.

## Step 1: Create the Page

1. Go to WordPress Admin: `http://mhma-update.local/wp-admin`
2. Login with username: `SWE` / password: `test`
3. Navigate to Pages → Add New
4. Title: `Event Scheduling Request`
5. Leave content empty
6. Slug: `event-scheduling-request`
7. Status: Publish
8. Click "Publish"

## Step 2: Create ACF Field Group

1. Navigate to Custom Fields → Add New
2. Field Group Title: `Event Scheduling Request`
3. Location Rules:
   - Post Type → is equal to → Page
   - Page Template → is equal to → Default

## Step 3: Add Fields

Add the following 22 fields in this order:

### Organizer Section

**Field 1: First Name**
- Field Label: First Name
- Field Name: organizer_first_name
- Field Type: Text
- Required: Yes

**Field 2: Last Name**
- Field Label: Last Name
- Field Name: organizer_last_name
- Field Type: Text
- Required: Yes

**Field 3: Email**
- Field Label: Email
- Field Name: organizer_email
- Field Type: Email
- Required: Yes

**Field 4: Phone**
- Field Label: Phone
- Field Name: organizer_phone
- Field Type: Text
- Required: No

### Event Details Section

**Field 5: Event Title**
- Field Label: Event Title
- Field Name: event_title
- Field Type: Text
- Required: Yes

**Field 6: Event Category**
- Field Label: Event Category
- Field Name: event_category
- Field Type: Select
- Required: Yes
- Choices:
  - religious : Religious
  - social : Social
  - educational : Educational
  - fundraising : Fundraising
  - community : Community
  - youth : Youth
  - other : Other

**Field 7: Event Description**
- Field Label: Event Description
- Field Name: event_description
- Field Type: Textarea
- Required: Yes

**Field 8: Start**
- Field Label: Start
- Field Name: event_start
- Field Type: Date Time Picker
- Required: Yes

**Field 9: End**
- Field Label: End
- Field Name: event_end
- Field Type: Date Time Picker
- Required: Yes

**Field 10: Host/Guest Speaker**
- Field Label: Will there be a host or guest speaker?
- Field Name: has_host_speaker
- Field Type: Radio Button
- Required: No
- Choices:
  - yes : Yes
  - no : No

**Field 11: Food Service**
- Field Label: Will food be served?
- Field Name: has_food
- Field Type: Radio Button
- Required: No
- Choices:
  - yes : Yes
  - no : No

**Field 12: Food Service Options**
- Field Label: Food Service
- Field Name: food_service
- Field Type: Checkbox
- Required: No
- Choices:
  - self_serve : Self-serve
  - catered : Catered
  - potluck : Potluck
  - other : Other

### Event Location Section

**Field 13: Location**
- Field Label: Location
- Field Name: location
- Field Type: Text
- Required: No

**Field 14: Facility**
- Field Label: Facility
- Field Name: facility
- Field Type: Select
- Required: No
- Choices:
  - unity_center : Unity Center
  - masjid : Masjid
  - outdoor : Outdoor
  - other : Other

### Requirements Section

**Field 15: Round Tables**
- Field Label: Round Tables
- Field Name: round_tables
- Field Type: Number
- Required: No

**Field 16: Rectangular Tables**
- Field Label: Rectangular Tables
- Field Name: rectangular_tables
- Field Type: Number
- Required: No

**Field 17: Chairs**
- Field Label: Chairs
- Field Name: chairs
- Field Type: Number
- Required: No

**Field 18: Equipment**
- Field Label: Equipment
- Field Name: equipment
- Field Type: Checkbox
- Required: No
- Choices:
  - projector : Projector
  - microphone : Microphone
  - speakers : Speakers
  - tables : Tables
  - chairs : Chairs
  - other : Other

### Volunteers/Helpers Section

**Field 19: Volunteers**
- Field Label: Volunteers
- Field Name: volunteers
- Field Type: Number
- Required: No

**Field 20: Helpers**
- Field Label: Helpers
- Field Name: helpers
- Field Type: Number
- Required: No

### Flyer and Form Section

**Field 21: RSVP Required**
- Field Label: RSVP Required
- Field Name: rsvp_required
- Field Type: Radio Button
- Required: No
- Choices:
  - yes : Yes
  - no : No

**Field 22: Payment Required**
- Field Label: Payment Collection Required
- Field Name: payment_required
- Field Type: Radio Button
- Required: No
- Choices:
  - yes : Yes
  - no : No

**Field 23: Comments**
- Field Label: Comments
- Field Name: comments
- Field Type: Textarea
- Required: No

## Step 4: Configure Field Group Settings

- Position: Normal
- Style: Default
- Label Placement: Top
- Instruction Placement: Label
- Click "Publish" to save the field group

## Step 5: Update Frontend Form

Once the ACF fields are created, the frontend form at `/event-scheduling-request` will automatically work with these field names. The form is already set up to submit data to these ACF field names.

## Notes

- The frontend form is already created at `/app/event-scheduling-request/page.tsx`
- The form uses the exact field names specified above
- When users submit the form, it will populate these ACF fields
- You can view submissions in WordPress admin by editing the Event Scheduling Request page
