# WordPress ACF Fields - Programs

## Program ACF Fields (Exact Field Names)

These are the exact ACF field names used for programs in the MHMA Volunteer project:

### Main Program Fields
- `program_title` - Text field
- `program_description` - WYSIWYG/Textarea field
- `program_image` - Image field (stores media ID)
- `program_image_poster` - Image field (stores media ID) - Optional
- `use_hardcoded_version` - Boolean field - If true, redirects to hardcoded page (only for Arabic Academy)

### Statistics Fields (4 pairs)
- `stat_1_label` - Text field
- `stat_1_value` - Text field
- `stat_2_label` - Text field
- `stat_2_value` - Text field
- `stat_3_label` - Text field
- `stat_3_value` - Text field
- `stat_4_label` - Text field
- `stat_4_value` - Text field

### Additional Content
- `additional_content` - WYSIWYG/Textarea field

## Notes
- Image fields store WordPress media IDs (integers), not URLs
- To get the image URL, fetch from `/wp/v2/media/{id}`
- When submitting to API, send the media ID for image fields
- All fields are stored in the `acf` object in the WordPress REST API response

## Example API Response Structure
```json
{
  "id": 123,
  "title": { "rendered": "Program Title" },
  "content": { "rendered": "<p>Content...</p>" },
  "acf": {
    "program_title": "Program Title",
    "program_description": "Description...",
    "program_image": 456,
    "program_image_poster": 789,
    "stat_1_label": "Students",
    "stat_1_value": "50",
    "stat_2_label": "Days/Week",
    "stat_2_value": "5",
    "stat_3_label": "",
    "stat_3_value": "",
    "stat_4_label": "",
    "stat_4_value": "",
    "additional_content": "<p>Additional content...</p>"
  }
}
```
