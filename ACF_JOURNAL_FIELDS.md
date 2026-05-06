# ACF Field Creation Guide for Journal Entries

The journal date fields are not saving because the ACF fields don't exist in WordPress. Follow these manual steps to create the ACF fields for journal entries.

## Step 1: Create ACF Field Group

1. Go to WordPress Admin: `http://mhma-update.local/wp-admin`
2. Login with username: `SWE` / password: `test`
3. Navigate to Custom Fields → Add New
4. Field Group Title: `Journal Entry Fields`
5. Location Rules:
   - Post Type → is equal to → Page
   - Page Parent → is equal to → Journal (ID: 199)

## Step 2: Add Fields

Add the following 5 fields in this order:

**Field 1: Journal Title**
- Field Label: Journal Title
- Field Name: journal_title
- Field Type: Text
- Required: No

**Field 2: Date Published**
- Field Label: Date Published
- Field Name: date_published
- Field Type: Date Picker
- Required: No
- Return Format: F j, Y (e.g., April 29, 2026)

**Field 3: Date Held On**
- Field Label: Date Held On
- Field Name: date_held_on
- Field Type: Date Picker
- Required: No
- Return Format: F j, Y (e.g., April 29, 2026)

**Field 4: Attendees**
- Field Label: Attendees
- Field Name: attendees
- Field Type: Text
- Required: No

**Field 5: Content**
- Field Label: Content
- Field Name: content
- Field Type: Textarea
- Required: No

## Step 3: Configure Field Group Settings

- Position: Normal
- Style: Default
- Label Placement: Top
- Instruction Placement: Label
- Click "Publish" to save the field group

## Step 4: Test

After creating the fields:
1. Go to Dashboard → Create New Journal Entry
2. Fill in the form with date values
3. Submit the form
4. Edit the created page in WordPress admin
5. Check if the ACF fields show the date values

## Notes

- The frontend form at `/dashboard/journal/new` sends data to these exact field names
- The edit page at `/dashboard/journal/edit` reads from these field names
- Once these fields are created, journal entries will properly save and display dates
