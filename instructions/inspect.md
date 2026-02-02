The Inspect page allows a player to view their character, equipped items, and view other players as well.

On loading, the player's name should be displayed and underneath the name "Level: " followed by the player's level (username and level are fields found in the user_profiles table as specified in the schema.sql reference file).

Beneath their name and level, display their player image (found at the location specified in the user_image_url field).  Surrounding their image, their equipped items will be displayed.  Shoulders and Head above, Weapon to the right, Chest and Gauntlets to the left, and Leggings, Belt, and Boots underneath.  Each equipped item will display the image, the Name, the Power (strength), and the Affinities (in the form of icons found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/)

A player's equipped items are found by querying the user_inventory table for rows where is_equipped is set to true.  Then, based on the gear_type field, querying the appropriate _lookup table to get the item details.


To the right of the player display, there is the Arena Contestants section.  Underneath that label there is a scrollable list of all usernames found in the user_profiles table sorted alphabetically.  Selecting a name will display their player data and equipment in the player display area (their name, level, player image, and equipped items).  Beneath the Arena Contestants list is a "Inspect Self" button that will revert the Player Display area back to displaying the current player's data.