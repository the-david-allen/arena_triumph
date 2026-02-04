
Upon loading, the landing page will do a quick check to see if the user's username is the same as their user_email (both found in the user_profiles table described in schema.sql).  If they are the same, the user sees the pre-landing page.  Otherwise, they see the main landing page.


Pre-Landing Page:
At the top left, display "Please enter a username: " followed by the username text box and a "Check Name" button.  Underneath that, a "Save" button that begins deactivated.  Any time the text in the username text box gets modified, the Save button becomes disabled.

To the right, there is an invisible grid of 2 columns and 3 rows.  Each cell in the grid contains one of the 6 images found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/characters/

The first image is highlighted by default and the user can select any of the images.  One image must be selected at all times.

Pressing the "Check Name" button will validate that there are no inappropriate words contained in the username, and then query the user_profiles table to see if there is already a row with the chosen username.  If so, display "Username taken" and highlight their username in the textbox.  If not, display "Username available" and activate the Save button.

Pressing the Save button will write the chosen username into the username field of the user_profiles table and will write the url of the selected image to the user_image_url field.  Then replace the pre-landing page with the main landing page.


Main Landing Page:
Display "Welcome to the Arena.  Can you triumph?"
Display "You'll need to master a number of challenges to have a chance at beating some of the Arena bosses."
Display "Obtain Gear for your armor and weapon slots by beating that slot's challenge - the better you do, the better gear you'll receive."
Display "Manage your Inventory by equipping or removing gear."
Display "When you're ready, Battle to test your strength against today's Arena bosses."

