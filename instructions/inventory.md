The Inventory page will allow a user to view, equip, and remove items from their inventory.

A user's inventory can be found by querying the user_inventory table for the current user_id.  


On the left side of the page is a vertical column of Slots, with icons found at https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/slots/

To the right of that is a column displaying the user's currently equipped item for that slot (determined using the is_equipped field in the user_inventory table).  

At the top right there is an area to display the details for any currently selected item.  If the user selects an item, the item's data can be found by checking the gear_type and querying the corresponding _lookup table for that gear_id.  This area shows the item's image found at it's image_url and underneath that displays the item's Name (appended with " (equipped)" if that item's is_equipped value is true), Strength (labeled "Power: "), and the 0-2 affinities that item has (found using the primary_affinity and secondary_affinity fields).  Find the affinity_name using the affinity_lookup table and using that name, grab the corresponding icon from https://pub-0b8bdb0f1981442e9118b343565c1579.r2.dev/affinities/  (for instance, aquatic.jpg)

To the right of the display area is an Equip button and underneath that a Discard button.

At the bottom right there is the Inventory grid.  On page load, the grid is empty with the label above reading "Inventory: ".

When the user clicks an item slot in the leftmost column, perform the following:
- Boldly highlight the selected slot icon. 
- Clear the current Inventory grid and load all user items of the selected slot into the grid.
- Update the Inventory grid label to show the number of items the user has of that slot and the slot name.  If the number is >=20 then this text should be bold and in red.
- Display the information for the currently equipped item of that slot (if any) in the item display area.

When the user clicks an item in the Inventory grid, that items data should appear in the display area above the Inventory grid.

When the user clicks the Equip button, perform the following:
- In the user_inventory table, set is_equipped to false for all true values for the slot that corresponds to the currently selected item.
- Update the user_inventory table to set is_equipped to true for the currently selected item
- Refresh the Equipped column

When the user clicks the Discard button, perform the following:
- Look up the rarity of the selected item and set xpVal = 1 for Base, 5 for Common, 10 for Uncommon, 15 for Rare, 20 for Epic, 25 for Legendary, and 30 for Mythic.
- Display a Yes/No popup that asks the user to confirm they want to Discard the item for xpVal experience.  If they select no, close the popup with no further action.  If they select Yes, delete the row in the user_inventory corresponding to that item and increment the xp value in the user_profiles table for this user by xpVal amount.
- Refresh the equipped column and the inventory grid
